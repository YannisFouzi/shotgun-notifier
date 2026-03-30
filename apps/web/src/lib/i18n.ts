import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

export const LOCALE_STORAGE_KEY = "shotgun-notifier-locale";

/**
 * Fixed initial language avoids SSR/client hydration mismatches: the browser
 * LanguageDetector used to run during import and diverged from the server
 * (which has no localStorage). Locale is applied after mount in
 * AppI18nProvider (useLayoutEffect).
 */
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "fr"],
  load: "languageOnly",
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  react: {
    useSuspense: false,
  },
});

export default i18n;
