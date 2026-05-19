import {
  getLanguage,
  WIKIMEDIA_USER_AGENT,
  wiktionaryHost,
  type DictionaryLanguageId,
} from "../shared/languages.js";

const WIKI_HEADERS = { "User-Agent": WIKIMEDIA_USER_AGENT };

interface MediaListItem {
  type?: string;
  title?: string;
  srcset?: Array<{ src?: string }>;
}

interface MediaListResponse {
  items?: MediaListItem[];
}

function accentHint(language: DictionaryLanguageId): string | null {
  if (language === "en-us") {
    return "en-us";
  }
  if (language === "en-uk") {
    return "en-gb";
  }
  return null;
}

function scoreAudioUrl(url: string, hint: string | null): number {
  const lower = url.toLowerCase();
  let score = 0;
  if (/\.(ogg|mp3|wav|opus)(\?|$)/i.test(lower)) {
    score += 2;
  }
  if (hint && lower.includes(hint)) {
    score += 5;
  }
  if (lower.includes("pronunciation") || lower.includes("pronunc")) {
    score += 1;
  }
  return score;
}

function pickBestAudioUrl(items: MediaListItem[], language: DictionaryLanguageId): string | undefined {
  const hint = accentHint(language);
  let best: { url: string; score: number } | undefined;

  for (const item of items) {
    const type = item.type?.toLowerCase() ?? "";
    const title = item.title?.toLowerCase() ?? "";
    const isAudio =
      type.includes("audio") ||
      (title.startsWith("file:") && /\.(ogg|mp3|wav|opus)$/i.test(title));

    if (!isAudio) {
      continue;
    }

    for (const src of item.srcset ?? []) {
      const url = src.src?.trim();
      if (!url) {
        continue;
      }
      const score = scoreAudioUrl(url, hint);
      if (!best || score > best.score) {
        best = { url, score };
      }
    }
  }

  return best?.url;
}

export async function findWiktionaryAudio(
  word: string,
  language: DictionaryLanguageId,
  signal?: AbortSignal,
): Promise<string | undefined> {
  const lang = getLanguage(language);
  const url = `${wiktionaryHost(lang.wikiCode)}/api/rest_v1/page/media-list/${encodeURIComponent(word)}`;

  try {
    const res = await fetch(url, { headers: WIKI_HEADERS, signal });
    if (!res.ok) {
      return undefined;
    }
    const data = (await res.json()) as MediaListResponse;
    return pickBestAudioUrl(data.items ?? [], language);
  } catch {
    return undefined;
  }
}

export async function fetchAudioBuffer(
  url: string,
  signal?: AbortSignal,
): Promise<{ buffer: ArrayBuffer; mime: string } | undefined> {
  try {
    const res = await fetch(url, {
      signal,
      headers: url.includes("wikimedia.org") ? WIKI_HEADERS : undefined,
    });
    if (!res.ok) {
      return undefined;
    }
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength === 0) {
      return undefined;
    }
    const mime = res.headers.get("content-type")?.split(";")[0]?.trim() || guessMime(url);
    return { buffer, mime };
  } catch {
    return undefined;
  }
}

function guessMime(url: string): string {
  if (/\.ogg(\?|$)/i.test(url)) {
    return "audio/ogg";
  }
  if (/\.wav(\?|$)/i.test(url)) {
    return "audio/wav";
  }
  return "audio/mpeg";
}

/** Resolve and fetch the best pronunciation audio for a word. */
export async function resolvePronunciationAudio(
  word: string,
  language: DictionaryLanguageId,
  preferredUrl?: string,
  signal?: AbortSignal,
): Promise<{ buffer: ArrayBuffer; mime: string } | undefined> {
  const candidates = [preferredUrl, await findWiktionaryAudio(word, language, signal)].filter(
    (u): u is string => Boolean(u),
  );

  const seen = new Set<string>();
  for (const url of candidates) {
    if (seen.has(url)) {
      continue;
    }
    seen.add(url);
    const audio = await fetchAudioBuffer(url, signal);
    if (audio) {
      return audio;
    }
  }
  return undefined;
}
