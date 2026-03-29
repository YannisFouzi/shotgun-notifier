"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TelegramPreview } from "@/components/telegram-preview";
// Hidden — kept for future multi-platform support
// import { DiscordPreview } from "@/components/discord-preview";
// import { MessengerPreview } from "@/components/messenger-preview";
// import { WhatsAppPreview } from "@/components/whatsapp-preview";
import {
  buildShotgunEventsUrl,
  getOrganizerIdFromToken,
  normalizeShotgunToken,
  saveStoredShotgunToken,
  SHOTGUN_INTEGRATIONS_URL,
} from "@/lib/shotgun";
// Hidden — kept for future multi-platform support
type PreviewChannel = "whatsapp" | "telegram" | "messenger" | "discord";
type PreviewMode = "bot" | "group";

interface PreviewScenario {
  id: string;
  channel: PreviewChannel;
  mode: PreviewMode;
  message: string;
  hidden?: boolean;
}

const PREVIEW_MESSAGES: string[] = [
  "Nouvelle vente Shotgun\n1 billet vendu : 57\nVAGUE 2 : 4/200\n16.50 EUR",
  "Nouvelle vente Shotgun\n3 billets vendus : 60\nEARLY BIRD : 48/100\nVAGUE 1 : 12/300\n49.50 EUR",
  "Nouvelle vente Shotgun\n2 billets vendus : 100\nEARLY BIRD : 100/100 SOLD OUT\nPaiement : card",
  "KODZ X GUETTAPEN X MERCI LILLE\n1 mai 2026 - 21:00\n1 billet vendu : 57\nVAGUE 2 : 4/200",
];

// Kept for future multi-platform support
const PREVIEW_SCENARIOS: PreviewScenario[] = [
  {
    id: "wa-sale",
    channel: "whatsapp",
    mode: "bot",
    message:
      "Nouvelle vente Shotgun\n1 billet vendu\nVAGUE 2 : 4/200\n57 billets vendus au total",
    hidden: true,
  },
  {
    id: "msg-alert",
    channel: "messenger",
    mode: "bot",
    message:
      "Alerte Shotgun\nVAGUE 1 est sold out\nVAGUE 2 devient le billet principal",
    hidden: true,
  },
  {
    id: "dc-sale",
    channel: "discord",
    mode: "group",
    message:
      "Nouvelle vente Shotgun\n2 billets vendus\nEARLY : 18/100\n82 billets restants",
    hidden: true,
  },
];

// Hidden — kept for future multi-platform support
// function renderPreview(channel: PreviewChannel, message: string, mode: PreviewMode) {
//   if (channel === "whatsapp") return <WhatsAppPreview message={message} mode={mode} />;
//   if (channel === "telegram") return <TelegramPreview message={message} mode={mode} />;
//   if (channel === "messenger") return <MessengerPreview message={message} mode={mode} />;
//   return <DiscordPreview message={message} mode={mode} />;
// }

export function HomePageClient() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);

  const activeMessage = PREVIEW_MESSAGES[activeMessageIndex] ?? PREVIEW_MESSAGES[0];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveMessageIndex((current) => (current + 1) % PREVIEW_MESSAGES.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, []);

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
                Recevez un message sur Telegram a chaque vente Shotgun
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
                  <input
                    id="token"
                    type="password"
                    autoComplete="off"
                    placeholder="eyJhbGci..."
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
                    {loading ? "Verification du token..." : "Se connecter"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          <section className="xl:flex xl:flex-col xl:items-center xl:justify-center">
            <div className="flex justify-center">
              <TelegramPreview message={activeMessage} mode="group" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
