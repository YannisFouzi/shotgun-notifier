"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { useRouter } from "next/navigation";
import { Bot, Loader2, User, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageTemplateEditor } from "@/components/message-template-editor";
import { ChannelSetupGuide } from "@/components/channel-setup-guide";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cloneMessageTemplateContent,
  DEFAULT_MESSAGE_TEMPLATE_CONTENT,
  DEFAULT_MESSAGE_TEMPLATE_SETTINGS,
  readStoredMessageTemplateContent,
  readStoredMessageTemplateSettings,
  saveStoredMessageTemplateContent,
  saveStoredMessageTemplateSettings,
  type MessageTemplateSettings,
} from "@/lib/message-template";
import {
  clearStoredShotgunToken,
  readStoredTelegramConfig,
  saveStoredTelegramConfig,
} from "@/lib/shotgun";
import { apiGetConfig, apiUpdateConfig, apiUpdateTemplate } from "@/lib/api";
import { type SyncStatus } from "@/components/sync-indicator";
import { cn } from "@/lib/utils";

interface TelegramDetectedChat {
  id: string;
  type: "private" | "group" | "supergroup" | "channel";
  title: string;
  subtitle: string;
}

interface TelegramDetectionResult {
  bot: {
    id: number;
    firstName: string;
    username: string;
    canJoinGroups: boolean;
  };
  chats: TelegramDetectedChat[];
}

interface TelegramValidatedChatResult {
  bot: TelegramDetectionResult["bot"];
  chat: TelegramDetectedChat;
}

export function DashboardPageClient() {
  const router = useRouter();
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramLookupLoading, setTelegramLookupLoading] = useState(false);
  const [telegramLookupError, setTelegramLookupError] = useState("");
  const [telegramLookupResult, setTelegramLookupResult] =
    useState<TelegramDetectionResult | null>(null);
  const [telegramValidatedChat, setTelegramValidatedChat] =
    useState<TelegramDetectedChat | null>(null);
  const [telegramTokenValidated, setTelegramTokenValidated] = useState(false);
  const [telegramChatValidationLoading, setTelegramChatValidationLoading] =
    useState(false);
  const [telegramChatValidationError, setTelegramChatValidationError] =
    useState("");
  const [telegramChatValidated, setTelegramChatValidated] = useState(false);
  const [telegramConfigured, setTelegramConfigured] = useState(false);
  const [telegramConfigExpanded, setTelegramConfigExpanded] = useState(true);
  const [channelSaved, setChannelSaved] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState<JSONContent>(
    cloneMessageTemplateContent(DEFAULT_MESSAGE_TEMPLATE_CONTENT)
  );
  const [messageTemplateSettings, setMessageTemplateSettings] =
    useState<MessageTemplateSettings>(DEFAULT_MESSAGE_TEMPLATE_SETTINGS);
  const [readyToAutosave, setReadyToAutosave] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "pending" | "syncing" | "synced" | "error">("idle");
  const syncRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function loadConfig() {
      // Try loading from API first, fall back to localStorage
      try {
        const config = await apiGetConfig();
        const tgToken = config.telegramToken || "";
        const tgChatId = config.telegramChatId || "";
        const hasConfig = Boolean(tgToken.trim()) && Boolean(tgChatId.trim());

        setTelegramToken(tgToken);
        setTelegramChatId(tgChatId);
        setTelegramTokenValidated(hasConfig);
        setTelegramChatValidated(hasConfig);
        setTelegramConfigured(hasConfig);
        setTelegramConfigExpanded(!hasConfig);

        const template = config.messageTemplate as JSONContent;
        if (template && typeof template === "object" && template.type === "doc") {
          setMessageTemplate(template);
        } else {
          setMessageTemplate(readStoredMessageTemplateContent());
        }

        const settings = config.messageTemplateSettings as MessageTemplateSettings;
        if (settings && typeof settings === "object") {
          setMessageTemplateSettings(settings);
        } else {
          setMessageTemplateSettings(readStoredMessageTemplateSettings());
        }

        // Sync to localStorage as cache
        if (tgToken || tgChatId) {
          saveStoredTelegramConfig(tgToken, tgChatId);
        }
      } catch {
        // API unavailable — fall back to localStorage
        const storedConfig = readStoredTelegramConfig();
        const hasStoredTelegramConfig =
          Boolean(storedConfig.telegramToken.trim()) &&
          Boolean(storedConfig.telegramChatId.trim());

        setTelegramToken(storedConfig.telegramToken);
        setTelegramChatId(storedConfig.telegramChatId);
        setTelegramTokenValidated(hasStoredTelegramConfig);
        setTelegramChatValidated(hasStoredTelegramConfig);
        setTelegramConfigured(hasStoredTelegramConfig);
        setTelegramConfigExpanded(!hasStoredTelegramConfig);
        setMessageTemplate(readStoredMessageTemplateContent());
        setMessageTemplateSettings(readStoredMessageTemplateSettings());
      }

      setReadyToAutosave(true);
    }

    loadConfig();
  }, []);

  const syncTemplateToApi = useCallback(
    async (template: JSONContent, settings: MessageTemplateSettings) => {
      setSyncStatus("syncing");
      try {
        await apiUpdateTemplate({
          messageTemplate: template,
          messageTemplateSettings: settings,
        });
        setSyncStatus("synced");
        // Reset to idle after a brief "synced" flash
        syncRetryRef.current = setTimeout(() => setSyncStatus("idle"), 2500);
      } catch {
        setSyncStatus("error");
      }
    },
    []
  );

  useEffect(() => {
    if (!readyToAutosave) return;

    // Save to localStorage immediately
    saveStoredMessageTemplateContent(messageTemplate);
    saveStoredMessageTemplateSettings(messageTemplateSettings);

    // Show pending state
    setSyncStatus("pending");

    // Clear any previous timers
    if (syncRetryRef.current) {
      clearTimeout(syncRetryRef.current);
      syncRetryRef.current = null;
    }

    // Debounced save to API
    const timer = setTimeout(() => {
      syncTemplateToApi(messageTemplate, messageTemplateSettings);
    }, 1500);

    return () => clearTimeout(timer);
  }, [messageTemplate, messageTemplateSettings, readyToAutosave, syncTemplateToApi]);

  function resetTelegramProgress(options?: { clearChatId?: boolean }) {
    if (options?.clearChatId) {
      setTelegramChatId("");
    }

    setTelegramLookupLoading(false);
    setTelegramLookupError("");
    setTelegramLookupResult(null);
    setTelegramValidatedChat(null);
    setTelegramTokenValidated(false);
    setTelegramChatValidationLoading(false);
    setTelegramChatValidationError("");
    setTelegramChatValidated(false);
    setChannelSaved(false);
  }

  async function handleTelegramDetectChats() {
    const normalizedToken = telegramToken.trim();

    if (!normalizedToken) {
      setTelegramLookupError("Ajoutez d'abord votre Bot Token.");
      setTelegramLookupResult(null);
      return;
    }

    setTelegramLookupLoading(true);
    setTelegramLookupError("");
    setTelegramChatValidated(false);
    setTelegramChatValidationError("");
    setChannelSaved(false);

    try {
      const response = await fetch("/api/telegram/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: normalizedToken }),
      });

      const payload = (await response.json()) as
        | TelegramDetectionResult
        | { error?: string };

      if (!response.ok || !("bot" in payload)) {
        setTelegramLookupResult(null);
        setTelegramTokenValidated(false);
        setTelegramLookupError(
          "error" in payload && payload.error
            ? payload.error
            : "Impossible de verifier ce bot Telegram."
        );
        return;
      }

      setTelegramLookupResult(payload);
      setTelegramTokenValidated(true);
    } catch {
      setTelegramLookupResult(null);
      setTelegramLookupError("Impossible de contacter Telegram.");
      setTelegramTokenValidated(false);
    } finally {
      setTelegramLookupLoading(false);
    }
  }

  async function handleTelegramSave() {
    const normalizedToken = telegramToken.trim();
    const normalizedChatId = telegramChatId.trim();

    if (!normalizedToken) {
      setTelegramChatValidationError("Ajoutez d'abord votre Bot Token.");
      return;
    }

    if (!telegramTokenValidated) {
      setTelegramChatValidationError("Validez d'abord votre Bot Token.");
      return;
    }

    if (!normalizedChatId) {
      setTelegramChatValidationError("Choisissez ou renseignez un Chat ID.");
      return;
    }

    setTelegramChatValidationLoading(true);
    setTelegramChatValidationError("");
    setChannelSaved(false);

    try {
      const response = await fetch("/api/telegram/validate-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: normalizedToken,
          chatId: normalizedChatId,
        }),
      });

      const payload = (await response.json()) as
        | TelegramValidatedChatResult
        | { error?: string };

      if (!response.ok || !("chat" in payload)) {
        setTelegramChatValidated(false);
        setTelegramValidatedChat(null);
        setTelegramChatValidationError(
          "error" in payload && payload.error
            ? payload.error
            : "Impossible de valider ce chat Telegram."
        );
        return;
      }

      saveStoredTelegramConfig(normalizedToken, payload.chat.id);

      // Push to Worker API so the cron uses these credentials
      apiUpdateConfig({
        telegramToken: normalizedToken,
        telegramChatId: payload.chat.id,
      }).catch(() => {
        // API save failed silently — will retry on next save
      });

      setTelegramChatId(payload.chat.id);
      setTelegramValidatedChat(payload.chat);
      setTelegramChatValidated(true);
      setTelegramConfigured(true);
      setTelegramConfigExpanded(false);
      setChannelSaved(true);
      setTimeout(() => setChannelSaved(false), 2000);
    } catch {
      setTelegramChatValidated(false);
      setTelegramValidatedChat(null);
      setTelegramChatValidationError("Impossible de valider ce chat Telegram.");
    } finally {
      setTelegramChatValidationLoading(false);
    }
  }

  function handleSyncRetry() {
    syncTemplateToApi(messageTemplate, messageTemplateSettings);
  }

  const isTelegramSetupOpen = !telegramConfigured || telegramConfigExpanded;
  const showTelegramSummaryBar = telegramConfigured && !telegramConfigExpanded;
  const showMessageTemplate = telegramConfigured;
  const telegramTokenStepContent = (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="tg-token">Bot Token</Label>
        <Input
          id="tg-token"
          type="password"
          placeholder="7103948261:AAF..."
          value={telegramToken}
          onChange={(event) => {
            setTelegramToken(event.target.value);
            resetTelegramProgress({ clearChatId: true });
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={handleTelegramDetectChats}
          size="sm"
          disabled={telegramLookupLoading || !telegramToken.trim()}
        >
          {telegramLookupLoading && <Loader2 className="size-3.5 animate-spin" />}
          {telegramTokenValidated ? "Actualiser les chats" : "Valider le bot"}
        </Button>
        {telegramLookupResult?.bot && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
            <Bot className="size-3.5" />
            {telegramLookupResult.bot.username || telegramLookupResult.bot.firstName}
          </span>
        )}
      </div>
      {telegramLookupError && (
        <p className="text-xs text-amber-400">{telegramLookupError}</p>
      )}
    </div>
  );
  const telegramChatStepContent = (
    <div className="space-y-3">
      {telegramLookupResult?.bot && !telegramLookupResult.bot.canJoinGroups && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
          Ce bot ne peut pas rejoindre de groupes. Activez{" "}
          <span className="font-semibold">/setjoingroups</span> dans BotFather.
        </div>
      )}

      {telegramLookupResult && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Cliquez sur le bon chat pour remplir le Chat ID.
          </p>

          {telegramLookupResult.chats.length > 0 ? (
            <div className="grid gap-2">
              {telegramLookupResult.chats.map((chat) => {
                const isSelected = telegramChatId === chat.id;
                const isPrivate = chat.type === "private";

                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => {
                      setTelegramChatId(chat.id);
                      setTelegramChatValidationError("");
                      setTelegramChatValidated(false);
                      setChannelSaved(false);
                    }}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      isSelected
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-border/40 hover:border-border"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {isPrivate ? (
                          <User className="size-3.5 text-muted-foreground" />
                        ) : (
                          <Users className="size-3.5 text-muted-foreground" />
                        )}
                        <p className="truncate text-sm font-medium">{chat.title}</p>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {chat.subtitle}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {chat.id}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5 text-xs text-muted-foreground">
              Aucun chat detecte. Envoyez un message a votre bot ou dans votre
              groupe, puis relancez.
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="tg-chat">Chat ID</Label>
        <Input
          id="tg-chat"
          type="text"
          placeholder="123456789 ou -1001234567890"
          value={telegramChatId}
          onChange={(event) => {
            setTelegramChatId(event.target.value);
            setTelegramChatValidationError("");
            setTelegramChatValidated(false);
            setChannelSaved(false);
          }}
        />
      </div>
      {telegramChatValidationError && (
        <p className="text-xs text-amber-400">{telegramChatValidationError}</p>
      )}
      <div className="flex items-center gap-3">
        {channelSaved && (
          <span className="text-xs text-emerald-400">
            Configuration enregistree
          </span>
        )}
        <Button
          onClick={handleTelegramSave}
          size="sm"
          className="min-w-40"
          disabled={telegramChatValidationLoading}
        >
          {telegramChatValidationLoading && (
            <Loader2 className="size-3.5 animate-spin" />
          )}
          Enregistrer
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold">Shotgun Notifier</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearStoredShotgunToken();
              router.replace("/");
            }}
          >
            Deconnexion
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Configuration Telegram</h2>
            <p className="text-sm text-muted-foreground">
              Connectez votre bot pour recevoir les alertes de vente.
            </p>
          </div>

          {telegramConfigured && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTelegramConfigExpanded((current) => !current)}
            >
              {telegramConfigExpanded ? "Réduire" : "Modifier"}
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="space-y-4">
            {showTelegramSummaryBar && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  Telegram connecte
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {telegramValidatedChat?.title || telegramChatId}
                </p>
              </div>
            )}

            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none",
                isTelegramSetupOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div
                className="min-h-0 overflow-hidden"
                inert={showTelegramSummaryBar ? true : undefined}
              >
                <ChannelSetupGuide
                  channelKey="telegram"
                  visibleSteps={
                    telegramConfigured ? 4 : telegramTokenValidated ? 4 : 3
                  }
                  slots={{
                    2: telegramTokenStepContent,
                    ...((telegramConfigured || telegramTokenValidated)
                      ? { 3: telegramChatStepContent }
                      : {}),
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {showMessageTemplate && (
          <>
            <div>
              <h2 className="text-2xl font-bold">Message de notification</h2>
              <p className="text-sm text-muted-foreground">
                Ecrivez votre message puis ajoutez les informations a afficher.
              </p>
            </div>

            <Card>
              <CardContent>
                <MessageTemplateEditor
                  activePreview="telegram"
                  settings={messageTemplateSettings}
                  value={messageTemplate}
                  onChange={setMessageTemplate}
                  onSettingsChange={setMessageTemplateSettings}
                  syncStatus={syncStatus}
                  onSyncRetry={handleSyncRetry}
                />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
