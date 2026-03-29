"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildShotgunEventsUrl,
  getOrganizerIdFromToken,
  normalizeShotgunToken,
  saveStoredShotgunToken,
  SHOTGUN_INTEGRATIONS_URL,
} from "@/lib/shotgun";

export function HomePageClient() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Shotgun Notifier
          </h1>
          <p className="text-muted-foreground">
            Recevez une notification a chaque vente
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connexion</CardTitle>
            <CardDescription>
              Entrez votre token API Shotgun.
              <br />
              <span className="text-xs leading-relaxed">
                Ouvrez{" "}
                <Link
                  href={SHOTGUN_INTEGRATIONS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  Smartboard &gt; Settings &gt; Integrations
                </Link>
                , activez <strong>Shotgun APIs</strong>, copiez le jeton puis
                collez-le ici.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="token">Token API</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="eyJhbGci..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !token.trim()}
              >
                {loading ? "Verification..." : "Se connecter"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
