"use client";

import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const resolved = (i18n.resolvedLanguage || i18n.language || "en").split(
    "-"
  )[0];
  const active = resolved === "fr" ? "fr" : "en";

  return (
    <div
      role="group"
      aria-label={t("language.toggleAria")}
      className={cn(
        "inline-flex rounded-full border border-border/60 bg-muted/20 p-0.5",
        className
      )}
    >
      <button
        type="button"
        aria-pressed={active === "en"}
        onClick={() => void i18n.changeLanguage("en")}
        className={cn(
          "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
          active === "en"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        EN
      </button>
      <button
        type="button"
        aria-pressed={active === "fr"}
        onClick={() => void i18n.changeLanguage("fr")}
        className={cn(
          "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
          active === "fr"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        FR
      </button>
    </div>
  );
}
