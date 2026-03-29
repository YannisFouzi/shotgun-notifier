"use client";

import { useEffect, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageTemplateEditor } from "@/components/message-template-editor";
import {
  clearStoredShotgunToken,
  readStoredShotgunToken,
  readStoredTelegramConfig,
  saveStoredTelegramConfig,
} from "@/lib/shotgun";
import {
  cloneMessageTemplateContent,
  DEFAULT_MESSAGE_TEMPLATE_CONTENT,
  readStoredMessageTemplateContent,
  saveStoredMessageTemplateContent,
} from "@/lib/message-template";

export default function DashboardPage() {
  const router = useRouter();
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [messageTemplate, setMessageTemplate] = useState<JSONContent>(
    cloneMessageTemplateContent(DEFAULT_MESSAGE_TEMPLATE_CONTENT)
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = readStoredShotgunToken();
    if (!token) {
      router.replace("/");
      return;
    }

    const storedConfig = readStoredTelegramConfig();
    setTelegramToken(storedConfig.telegramToken);
    setTelegramChatId(storedConfig.telegramChatId);
    setMessageTemplate(readStoredMessageTemplateContent());
  }, [router]);

  function handleSave() {
    saveStoredTelegramConfig(telegramToken, telegramChatId);
    saveStoredMessageTemplateContent(messageTemplate);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold">Shotgun Notifier</h1>
          <button
            onClick={() => {
              clearStoredShotgunToken();
              router.replace("/");
            }}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Deconnexion
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Configuration</h2>
            <p className="text-sm text-muted-foreground">
              Parametrez Telegram et composez le message sans syntaxe technique.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} size="sm">
              Sauvegarder
            </Button>
            {saved && (
              <span className="text-sm text-emerald-400">
                Modifications sauvegardees
              </span>
            )}
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>
                Renseignez vos informations Telegram pour cette session locale.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Telegram</span>
                  {telegramToken && telegramChatId ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-400/30 text-emerald-400"
                    >
                      Configure
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Non configure</Badge>
                  )}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="tg-token">Bot Token</Label>
                    <Input
                      id="tg-token"
                      type="password"
                      placeholder="123456:ABC..."
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tg-chat">Chat ID</Label>
                    <Input
                      id="tg-chat"
                      placeholder="-1001234567890"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                    />
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Cette sauvegarde reste locale au navigateur et ne modifie pas
                  encore la configuration du worker Cloudflare.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Discord</span>
                    <Badge variant="secondary">Bientot</Badge>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">WhatsApp</span>
                    <Badge variant="secondary">Bientot</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle className="text-base">Message</CardTitle>
              <CardDescription>
                Ecrivez votre notification comme un vrai message, puis inserez
                les infos Shotgun dans le texte.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <MessageTemplateEditor
              value={messageTemplate}
              onChange={setMessageTemplate}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
