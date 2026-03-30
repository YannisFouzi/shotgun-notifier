"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function I18nHtmlLang() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lng = i18n.resolvedLanguage || i18n.language || "en";
    document.documentElement.lang = lng.split("-")[0] || "en";
  }, [i18n.language, i18n.resolvedLanguage]);

  useEffect(() => {
    const onChange = (lng: string) => {
      document.documentElement.lang = lng.split("-")[0] || "en";
    };
    i18n.on("languageChanged", onChange);
    return () => {
      i18n.off("languageChanged", onChange);
    };
  }, [i18n]);

  return null;
}
