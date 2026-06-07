import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import ptBR from "./locales/pt-BR.json";
import en from "./locales/en.json";

const LANG_KEY = "@portal_churras:language";

function detectLanguage() {
  const tag = Localization.getLocales()[0]?.languageTag ?? "pt-BR";
  if (tag.startsWith("pt")) return "pt-BR";
  if (tag.startsWith("en")) return "en";
  return "pt-BR";
}

i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptBR },
    en: { translation: en },
  },
  lng: detectLanguage(),
  fallbackLng: "pt-BR",
  interpolation: { escapeValue: false },
  returnNull: false,
});

export async function loadSavedLanguage() {
  try {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    const saved = await AsyncStorage.getItem(LANG_KEY);
    if (saved && saved !== i18n.language) {
      await i18n.changeLanguage(saved);
    }
  } catch (_) {}
}

export async function setLanguage(lang) {
  try {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    await AsyncStorage.setItem(LANG_KEY, lang);
    await i18n.changeLanguage(lang);
  } catch (_) {}
}

export default i18n;
