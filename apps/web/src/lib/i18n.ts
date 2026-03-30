import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

export const LOCALE_STORAGE_KEY = "shotgun-notifier-locale";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "fr"],
    load: "languageOnly",
    defaultNS: "translation",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
    },
  });

export default i18n;
