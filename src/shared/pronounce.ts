import type { BackgroundRequest, BackgroundResponse } from "./messages.js";
import type { DictionaryLanguageId } from "./languages.js";
import { createSpeakIcon } from "./ui-icons.js";

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
  btn.append(createSpeakIcon());
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    btn.classList.add("speak-btn--active");
    void pronounceWord(word, language, audioUrl).finally(() => {
      window.setTimeout(() => btn.classList.remove("speak-btn--active"), 800);
    });
  });
  return btn;
}
