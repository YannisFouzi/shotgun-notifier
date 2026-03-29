"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DiscordPreview } from "@/components/discord-preview";
import { MessengerPreview } from "@/components/messenger-preview";
import { TelegramPreview } from "@/components/telegram-preview";
import { WhatsAppPreview } from "@/components/whatsapp-preview";
import {
  buildShotgunEventsUrl,
  getOrganizerIdFromToken,
  normalizeShotgunToken,
  saveStoredShotgunToken,
  SHOTGUN_INTEGRATIONS_URL,
} from "@/lib/shotgun";
import { cn } from "@/lib/utils";

type PreviewChannel = "whatsapp" | "telegram" | "messenger" | "discord";
type PreviewMode = "bot" | "group";

interface PreviewScenario {
  id: string;
  channel: PreviewChannel;
  mode: PreviewMode;
  message: string;
}

const PREVIEW_SCENARIOS: PreviewScenario[] = [
  {
    id: "wa-sale",
    channel: "whatsapp",
    mode: "bot",
    message:
      "Nouvelle vente Shotgun\n1 billet vendu\nVAGUE 2 : 4/200\n57 billets vendus au total",
  },
  {
    id: "tg-summary",
    channel: "telegram",
    mode: "group",
    message:
      "Point de vente Shotgun\nKODZ X GUETTAPEN X MERCI LILLE\n56 billets vendus\n164 billets restants",
  },
  {
    id: "msg-alert",
    channel: "messenger",
    mode: "bot",
    message:
      "Alerte Shotgun\nVAGUE 1 est sold out\nVAGUE 2 devient le billet principal",
  },
  {
    id: "dc-sale",
    channel: "discord",
    mode: "group",
    message:
      "Nouvelle vente Shotgun\n2 billets vendus\nEARLY : 18/100\n82 billets restants",
  },
];

function renderPreview(
  channel: PreviewChannel,
  message: string,
  mode: PreviewMode
) {
  if (channel === "whatsapp") {
    return <WhatsAppPreview message={message} mode={mode} />;
  }

  if (channel === "telegram") {
    return <TelegramPreview message={message} mode={mode} />;
  }

  if (channel === "messenger") {
    return <MessengerPreview message={message} mode={mode} />;
  }

  return <DiscordPreview message={message} mode={mode} />;
}

export function HomePageClient() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [previewPaused, setPreviewPaused] = useState(false);

  const activeScenario = useMemo(
    () => PREVIEW_SCENARIOS[activeScenarioIndex] ?? PREVIEW_SCENARIOS[0],
    [activeScenarioIndex]
  );

  useEffect(() => {
    if (previewPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveScenarioIndex((current) => (current + 1) % PREVIEW_SCENARIOS.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [previewPaused]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedToken = normalizeShotgunToken(token);
      const organizerId = getOrganizerIdFromToken(normalizedToken);

      if (!organizerId) {
        setError("Token invalide");
        setLoading(false);
        return;
      }

      const res = await fetch(buildShotgunEventsUrl(normalizedToken, organizerId));

      if (res.status === 401 || res.status === 403) {
        setError("Token invalide");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError("Impossible de valider le token");
        setLoading(false);
        return;
      }

      saveStoredShotgunToken(normalizedToken);
      router.replace("/dashboard");
    } catch {
      setError("Impossible de valider le token");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050608] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(42,171,238,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(37,211,102,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%)]" />

      <div className="relative mx-auto max-w-6xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-8 xl:min-h-[calc(100vh-7rem)] xl:grid-cols-[minmax(0,29rem)_minmax(0,1fr)] xl:items-center">
          <section className="space-y-6 xl:flex xl:flex-col xl:justify-center">
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Recevez un message a chaque vente Shotgun
              </h1>
              <p className="max-w-lg text-base leading-7 text-white/68">
                Configurez vos notifications en quelques secondes.
              </p>
            </div>

            <div className="space-y-3 text-sm font-medium text-white/72">
              <p>
                1. Connectez vous a votre compte Shotgun et accedez a la page{" "}
                <strong className="font-semibold text-white">Integrations</strong> en{" "}
                <Link
                  href={SHOTGUN_INTEGRATIONS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-white transition-colors hover:text-white/80"
                >
                  cliquant ici
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </p>
              <p>
                2. Activez <strong className="font-semibold text-white">Shotgun APIs</strong>,
                copiez le jeton puis collez-le ici.
              </p>
            </div>

            <Card className="rounded-[28px] border border-white/10 bg-black/35 py-0 shadow-[0_30px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <CardContent className="px-6 py-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    id="token"
                    type="password"
                    placeholder="eyJhbGci..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    className="h-12 rounded-2xl border-white/12 bg-white/[0.03] px-4 text-white placeholder:text-white/35 dark:bg-white/[0.03]"
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
                    {loading ? "Verification du token..." : "Se connecter"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          <section
            className="space-y-4 xl:flex xl:flex-col xl:items-center xl:justify-center"
            onMouseEnter={() => setPreviewPaused(true)}
            onMouseLeave={() => setPreviewPaused(false)}
          >
            <div className="flex justify-center">
              {renderPreview(
                activeScenario.channel,
                activeScenario.message,
                activeScenario.mode
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              {PREVIEW_SCENARIOS.map((scenario, index) => (
                <button
                  key={scenario.id}
                  type="button"
                  aria-label={`Voir l'aperçu ${index + 1}`}
                  onClick={() => setActiveScenarioIndex(index)}
                  className={cn(
                    "h-2.5 rounded-full bg-white/18 transition-all",
                    index === activeScenarioIndex ? "w-8 bg-white/80" : "w-2.5 hover:bg-white/35"
                  )}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
