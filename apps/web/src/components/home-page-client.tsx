"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trans, useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageToggle } from "@/components/language-toggle";
import { TelegramPreview } from "@/components/telegram-preview";
import { SiteFooter } from "@/components/site-footer";
import {
  normalizeShotgunToken,
  saveStoredShotgunToken,
  SHOTGUN_INTEGRATIONS_URL,
} from "@/lib/shotgun";
import { apiLogin, ApiError } from "@/lib/api";

export function HomePageClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);

  const previewMessages = useMemo(
    () => [
      t("preview.carousel0"),
      t("preview.carousel1"),
      t("preview.carousel2"),
      t("preview.carousel3"),
    ],
    [t]
  );

  const activeMessage =
    previewMessages[activeMessageIndex] ?? previewMessages[0];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveMessageIndex(
        (current) => (current + 1) % previewMessages.length
      );
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [previewMessages.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedToken = normalizeShotgunToken(token);

      await apiLogin(normalizedToken);

      saveStoredShotgunToken(normalizedToken);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(t("home.errorInvalidToken"));
      } else {
        setError(t("home.errorValidateFailed"));
      }
      setLoading(false);
    }
  }

  return (
    <>
    <main className="relative min-h-screen overflow-x-hidden bg-[#050608] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(42,171,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(37,211,102,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%)]" />

      <div className="relative mx-auto max-w-6xl px-6 pb-10 pt-4 lg:px-8 xl:py-14">
        <div className="mb-5 flex justify-end xl:mb-0 xl:hidden">
          <LanguageToggle className="border-white/15 bg-black/30" />
        </div>

        <div className="grid min-w-0 gap-8 xl:min-h-[calc(100vh-7rem)] xl:grid-cols-[minmax(0,29rem)_minmax(0,1fr)] xl:items-center">
          <section className="min-w-0 space-y-6 xl:flex xl:flex-col xl:justify-center">
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {t("home.title")}
              </h1>
              <p className="max-w-lg text-base leading-7 text-white/68">
                {t("home.subtitle")}
              </p>
            </div>

            <div className="space-y-3 text-sm font-medium text-white/72">
              <p>
                {t("home.step1Before")}{" "}
                <strong className="font-semibold text-white">
                  {t("home.step1Integrations")}
                </strong>{" "}
                {t("home.step1After")}{" "}
                <Link
                  href={SHOTGUN_INTEGRATIONS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-white transition-colors hover:text-white/80"
                >
                  {t("home.step1Link")}
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </p>
              <p>
                <Trans
                  i18nKey="home.step2"
                  components={{
                    strong: <strong className="font-semibold text-white" />,
                  }}
                />
              </p>
            </div>

            <Card className="rounded-[28px] border border-white/10 bg-black/35 py-0 shadow-[0_30px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <CardContent className="px-6 py-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    id="token"
                    type="password"
                    autoComplete="off"
                    placeholder={t("home.tokenPlaceholder")}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    className="h-12 w-full min-w-0 rounded-2xl border border-white/12 bg-white/[0.03] px-4 text-base text-white outline-none transition-colors placeholder:text-white/35 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />

                  {error ? (
                    <p className="text-sm text-red-300">{error}</p>
                  ) : null}

                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 w-full rounded-2xl bg-white text-black hover:bg-white/90"
                    disabled={loading || !token.trim()}
                  >
                    {loading ? t("home.submitLoading") : t("home.submit")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          <section className="flex min-w-0 flex-col items-center xl:justify-center">
            <div className="flex w-full max-w-[23rem] flex-col gap-3">
              <div className="hidden shrink-0 justify-end xl:flex">
                <LanguageToggle className="border-white/15 bg-black/30" />
              </div>
              <div className="flex w-full min-w-0 justify-center overflow-x-hidden">
                <TelegramPreview message={activeMessage} mode="group" animated messages={previewMessages} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
    <SiteFooter variant="home" />
    </>
  );
}
