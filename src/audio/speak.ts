import { speechLangFor } from "../shared/pronounce.js";
import type { DictionaryLanguageId } from "../shared/languages.js";

interface SpeakMessage {
  type: "speak";
  word: string;
  language: DictionaryLanguageId;
}

function voicesReady(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const existing = synth.getVoices();
  if (existing.length > 0) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve) => {
    const finish = (): void => {
      synth.removeEventListener("voiceschanged", finish);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", finish);
    window.setTimeout(() => {
      synth.removeEventListener("voiceschanged", finish);
      resolve(synth.getVoices());
    }, 1500);
  });
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  langTag: string,
): SpeechSynthesisVoice | undefined {
  const base = langTag.split("-")[0]?.toLowerCase() ?? langTag.toLowerCase();
  const exact = voices.find((v) => v.lang.replace("_", "-").toLowerCase() === langTag.toLowerCase());
  if (exact) {
    return exact;
  }
  const regional = voices.find((v) => v.lang.replace("_", "-").toLowerCase().startsWith(`${base}-`));
  if (regional) {
    return regional;
  }
  return voices.find((v) => v.lang.replace("_", "-").toLowerCase().startsWith(base));
}

function speak(word: string, language: DictionaryLanguageId): void {
  const synth = window.speechSynthesis;
  synth.cancel();

  const langTag = speechLangFor(language);
  void voicesReady().then((voices) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = langTag;
    utterance.rate = 0.95;
    const voice = pickVoice(voices, langTag);
    if (voice) {
      utterance.voice = voice;
    }
    synth.speak(utterance);
  });
}

window.addEventListener("message", (event: MessageEvent<SpeakMessage>) => {
  if (event.data?.type !== "speak") {
    return;
  }
  speak(event.data.word, event.data.language);
});
