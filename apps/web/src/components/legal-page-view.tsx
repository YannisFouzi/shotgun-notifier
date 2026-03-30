"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { LanguageToggle } from "@/components/language-toggle";
import { DEFAULT_LEGAL_CONTACT_EMAIL } from "@/lib/legal/contact";
import type { LegalDocument } from "@/lib/legal/types";

type LegalPageViewProps = {
  documents: Record<"fr" | "en", LegalDocument>;
};

export function LegalPageView({ documents }: LegalPageViewProps) {
  const { i18n, t } = useTranslation();
  const lang: "fr" | "en" = i18n.language.startsWith("fr") ? "fr" : "en";
  const doc = documents[lang];
  const fromEnv =
    typeof process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL === "string"
      ? process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL.trim()
      : "";
  const contact = fromEnv || DEFAULT_LEGAL_CONTACT_EMAIL;

  return (
    <div className="min-h-screen bg-[#050608] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <nav aria-label={t("legal.backHome")}>
            <Link
              href="/"
              className="text-sm text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#050608]"
            >
              {t("legal.backHome")}
            </Link>
          </nav>
          <LanguageToggle className="border-white/15 bg-black/30" />
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-10 pb-16">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          {doc.title}
        </h1>
        <p className="mt-2 text-sm text-white/50">{doc.lastUpdatedLabel}</p>

        <p className="mt-4 text-sm text-white/65">
          <span className="font-medium text-white/80">
            {t("legal.contactLabel")}
          </span>{" "}
          <a
            href={`mailto:${contact}`}
            className="text-sky-300 underline-offset-2 hover:underline"
          >
            {contact}
          </a>
        </p>

        <div className="mt-10 space-y-10">
          {doc.sections.map((section, index) => (
            <section
              key={index}
              aria-labelledby={`legal-section-${index}`}
            >
              <h2
                id={`legal-section-${index}`}
                className="text-lg font-semibold text-white"
              >
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-white/72">
                {section.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
