"use client";

import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

import i18n, { LOCALE_STORAGE_KEY } from "@/lib/i18n";

function resolveClientLocale(): "en" | "fr" {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "fr" || stored === "en") {
      return stored;
    }
  } catch {
    /* private mode */
  }
  try {
    const nav = navigator.language?.split("-")[0]?.toLowerCase();
    if (nav === "fr") {
      return "fr";
    }
  } catch {
    /* ignore */
  }
  return "en";
}

/**
 * After hydration, align i18n with localStorage / navigator and keep them in sync.
 */
function I18nClientLocaleSync() {
  useLayoutEffect(() => {
    const target = resolveClientLocale();
    const current = (i18n.resolvedLanguage || i18n.language || "en").split(
      "-"
    )[0] as "en" | "fr";
    if (current !== target) {
      void i18n.changeLanguage(target);
    }
  }, []);

  useEffect(() => {
    const persist = (lng: string) => {
      try {
        const short = lng.split("-")[0]?.toLowerCase();
        if (short === "fr" || short === "en") {
          localStorage.setItem(LOCALE_STORAGE_KEY, short);
        }
      } catch {
        /* ignore */
      }
    };
    i18n.on("languageChanged", persist);
    return () => {
      i18n.off("languageChanged", persist);
    };
  }, []);

  return null;
}

export function AppI18nProvider({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <I18nClientLocaleSync />
      {children}
    </I18nextProvider>
  );
}
