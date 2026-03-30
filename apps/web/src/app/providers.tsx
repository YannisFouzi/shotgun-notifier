"use client";

import type { ReactNode } from "react";

import { AppI18nProvider } from "@/components/app-i18n-provider";
import { I18nHtmlLang } from "@/components/i18n-html-lang";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppI18nProvider>
      <I18nHtmlLang />
      {children}
    </AppI18nProvider>
  );
}
