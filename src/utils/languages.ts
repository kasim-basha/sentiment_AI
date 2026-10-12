export interface LanguageOption {
  code: string;       // BCP 47 code for SpeechSynthesis (e.g. "en-US", "es-ES", "fr-FR")
  name: string;       // English display name
  nativeName: string; // Native language name
  flag: string;       // Country flag emoji
  dir?: "ltr" | "rtl";
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en-US", name: "English", nativeName: "English (US)", flag: "🇺🇸" },
  { code: "es-ES", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr-FR", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de-DE", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "ar-SA", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "ja-JP", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文", flag: "🇨🇳" },
  { code: "pt-BR", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "it-IT", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "ru-RU", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "ko-KR", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "tr-TR", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "nl-NL", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "te-IN", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "bn-BD", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  { code: "id-ID", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" }
];

export const DEFAULT_LANGUAGE: LanguageOption = SUPPORTED_LANGUAGES[0];

export function findLanguage(identifier: string): LanguageOption {
  if (!identifier) return DEFAULT_LANGUAGE;
  const match = SUPPORTED_LANGUAGES.find(
    l => l.code.toLowerCase() === identifier.toLowerCase() ||
         l.name.toLowerCase() === identifier.toLowerCase() ||
         l.nativeName.toLowerCase() === identifier.toLowerCase()
  );
  return match || DEFAULT_LANGUAGE;
}

export function speakSpeechSynthesis(
  text: string,
  langCode: string = "en-US",
  rate: number = 1.0,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onError?.(new Error("Speech synthesis not supported in this browser"));
    return null;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  utterance.rate = rate;
  utterance.pitch = 1.0;

  // Try to find a matching voice for the language
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = langCode.split("-")[0];
  const matchingVoice = voices.find(v => v.lang.toLowerCase() === langCode.toLowerCase()) ||
                        voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));

  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (e) => {
    // Some browsers trigger error on cancel; ignore interrupted
    if (e.error !== "canceled" && e.error !== "interrupted") {
      onError?.(e);
    } else {
      onEnd?.();
    }
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeechSynthesis() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
