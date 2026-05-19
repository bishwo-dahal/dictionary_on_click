import type { BackgroundRequest, BackgroundResponse } from "./messages.js";
import type { DictionaryLanguageId } from "./languages.js";

const SPEECH_LANG: Record<DictionaryLanguageId, string> = {
  ar: "ar-SA",
  "pt-br": "pt-BR",
  "zh-hans": "zh-CN",
  "zh-hant": "zh-TW",
  cs: "cs-CZ",
  nl: "nl-NL",
  "en-uk": "en-GB",
  "en-us": "en-US",
  fr: "fr-FR",
  de: "de-DE",
  hi: "hi-IN",
  it: "it-IT",
  ja: "ja-JP",
  ko: "ko-KR",
  ru: "ru-RU",
  sk: "sk-SK",
  es: "es-ES",
  tr: "tr-TR",
};

export function speechLangFor(language: DictionaryLanguageId): string {
  return SPEECH_LANG[language];
}

export const SPEAK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 5.636a9 9 0 0 1 0 12.728"/></svg>`;

let ttsFrame: HTMLIFrameElement | null = null;
let currentObjectUrl: string | null = null;

function revokeObjectUrl(): void {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

async function playAudioBuffer(buffer: ArrayBuffer, mime: string): Promise<boolean> {
  revokeObjectUrl();
  const blob = new Blob([buffer], { type: mime });
  currentObjectUrl = URL.createObjectURL(blob);

  return new Promise((resolve) => {
    const audio = new Audio(currentObjectUrl!);
    const done = (ok: boolean): void => {
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onErr);
      resolve(ok);
    };
    const onEnd = (): void => done(true);
    const onErr = (): void => done(false);

    audio.addEventListener("ended", onEnd);
    audio.addEventListener("error", onErr);
    void audio.play().then(() => {}).catch(() => done(false));
  });
}

function ensureTtsFrame(): HTMLIFrameElement {
  if (ttsFrame?.isConnected) {
    return ttsFrame;
  }

  ttsFrame = document.createElement("iframe");
  ttsFrame.src = browser.runtime.getURL("audio/speak.html");
  ttsFrame.title = "Dictionary pronunciation";
  ttsFrame.setAttribute("aria-hidden", "true");
  Object.assign(ttsFrame.style, {
    position: "fixed",
    width: "0",
    height: "0",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });
  document.documentElement.append(ttsFrame);
  return ttsFrame;
}

function speakViaExtensionFrame(word: string, language: DictionaryLanguageId): void {
  const frame = ensureTtsFrame();
  const post = (): void => {
    frame.contentWindow?.postMessage({ type: "speak", word, language }, "*");
  };
  if (frame.contentWindow) {
    post();
    return;
  }
  frame.addEventListener("load", post, { once: true });
}

async function requestPronunciation(
  word: string,
  language: DictionaryLanguageId,
  audioUrl?: string,
): Promise<BackgroundResponse> {
  const message: BackgroundRequest = {
    type: "pronounce",
    word,
    language,
    audioUrl,
  };
  return browser.runtime.sendMessage(message) as Promise<BackgroundResponse>;
}

/** Fetch audio via the background worker, then fall back to extension-page TTS. */
export async function pronounceWord(
  word: string,
  language: DictionaryLanguageId,
  audioUrl?: string,
): Promise<void> {
  try {
    const response = await requestPronunciation(word, language, audioUrl);
    if (response.type === "pronunciationAudio") {
      const ok = await playAudioBuffer(response.buffer, response.mime);
      if (ok) {
        return;
      }
    }
  } catch {
    /* fall through to TTS */
  }

  speakViaExtensionFrame(word, language);
}

export function createSpeakButton(
  word: string,
  language: DictionaryLanguageId,
  audioUrl?: string,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "icon-btn speak-btn";
  btn.title = "Listen to pronunciation";
  btn.setAttribute("aria-label", `Pronounce ${word}`);
  btn.innerHTML = SPEAK_ICON_SVG;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    btn.classList.add("speak-btn--active");
    void pronounceWord(word, language, audioUrl).finally(() => {
      window.setTimeout(() => btn.classList.remove("speak-btn--active"), 800);
    });
  });
  return btn;
}
