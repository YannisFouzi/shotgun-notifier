"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { JSONContent } from "@tiptap/react";
import { useRouter } from "next/navigation";
import { Trans, useTranslation } from "react-i18next";
import { Bot, Loader2, Pencil, Send, User, Users } from "lucide-react";

import type { DiscoveredChatSubtitleI18n } from "@/app/api/telegram/_lib";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsToggleRow } from "@/components/settings-toggle-row";
import { Separator } from "@/components/ui/separator";
import { MessageTemplateEditor } from "@/components/message-template-editor";
import { ChannelSetupGuide } from "@/components/channel-setup-guide";
import { DeleteAccountSection } from "@/components/delete-account-dialog";
import { FeedbackSection } from "@/components/feedback-section";
import { AdminUserCount, useIsAdmin } from "@/components/admin-panel";
import { SiteFooter } from "@/components/site-footer";
import { LanguageToggle } from "@/components/language-toggle";
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
  CHECK_INTERVAL_STORAGE_KEY,
  clearStoredShotgunToken,
  readStoredTelegramConfig,
  saveStoredTelegramConfig,
  TELEGRAM_SEND_AS_CHAT_STORAGE_KEY,
} from "@/lib/shotgun";
import type { TFunction } from "i18next";

import {
  ApiError,
  apiGetConfig,
  apiTelegramTest,
  apiUpdateConfig,
  apiUpdateTemplate,
} from "@/lib/api";
import { resolveTelegramApiErrorMessage } from "@/lib/telegram-api-error";
import { type SyncStatus } from "@/components/sync-indicator";
import { cn } from "@/lib/utils";

const CHECK_INTERVAL_OPTIONS = [1, 5, 10, 60, 300, 720, 1440, 10080] as const;

interface TelegramDetectedChat {
  id: string;
  type: "private" | "group" | "supergroup" | "channel";
  title: string;
  subtitle: string;
  titleI18nKey?: "fallbackUser";
  subtitleI18nKey?: DiscoveredChatSubtitleI18n;
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

const TELEGRAM_CHAT_TYPES: TelegramDetectedChat["type"][] = [
  "private",
  "group",
  "supergroup",
  "channel",
];

function validatedChatFromStoredApi(
  chatId: string,
  title: string | undefined,
  type: string | undefined
): TelegramDetectedChat | null {
  const id = chatId.trim();
  if (!id) {
    return null;
  }

  const rawType = (type || "").trim();
  const chatType = TELEGRAM_CHAT_TYPES.includes(
    rawType as TelegramDetectedChat["type"]
  )
    ? (rawType as TelegramDetectedChat["type"])
    : id.startsWith("-")
      ? "supergroup"
      : "private";

  const displayTitle = (title || "").trim() || id;
  const subtitleI18nKey: DiscoveredChatSubtitleI18n =
    chatType === "private"
      ? "privateConversation"
      : chatType === "channel"
        ? "channel"
        : chatType === "supergroup"
          ? "supergroup"
          : "group";

  return {
    id,
    type: chatType,
    title: displayTitle,
    subtitle: "",
    subtitleI18nKey,
  };
}

function DashboardMainSkeleton() {
  const { t } = useTranslation();
  return (
    <main
      className="mx-auto max-w-6xl space-y-6 px-6 py-8"
      aria-busy="true"
      aria-label={t("dashboard.skeletonAria")}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-md bg-muted/40 motion-safe:animate-pulse" />
          <div className="h-4 w-72 max-w-full rounded-md bg-muted/30 motion-safe:animate-pulse" />
        </div>
        <div className="h-9 w-24 rounded-md bg-muted/40 motion-safe:animate-pulse" />
      </div>
      <div className="h-64 rounded-xl border border-border/30 bg-muted/10 motion-safe:animate-pulse" />
      <div className="h-8 w-64 rounded-md bg-muted/40 motion-safe:animate-pulse" />
      <div className="min-h-[280px] rounded-xl border border-border/30 bg-muted/10 motion-safe:animate-pulse" />
    </main>
  );
}

function chatRowTitle(chat: TelegramDetectedChat, t: TFunction) {
  if (chat.titleI18nKey === "fallbackUser") {
    return t("telegram.title.fallbackUser", { id: chat.title });
  }
  return chat.title;
}

function chatRowSubtitle(chat: TelegramDetectedChat, t: TFunction) {
  if (chat.subtitleI18nKey) {
    return t(`telegram.subtitle.${chat.subtitleI18nKey}`);
  }
  return chat.subtitle;
}

export function DashboardPageClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const isAdmin = useIsAdmin();
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
  const [telegramSendAsChat, setTelegramSendAsChat] = useState(false);
  const [sendAsChatSaving, setSendAsChatSaving] = useState(false);
  const [telegramTestStatus, setTelegramTestStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [telegramTestError, setTelegramTestError] = useState("");
  const [telegramConfigExpanded, setTelegramConfigExpanded] = useState(true);
  const [channelSaved, setChannelSaved] = useState(false);
  const [editingBotToken, setEditingBotToken] = useState(false);
  const [editingChatId, setEditingChatId] = useState(false);
  const [savedBotUsername, setSavedBotUsername] = useState("");
  const [messageTemplate, setMessageTemplate] = useState<JSONContent>(
    cloneMessageTemplateContent(DEFAULT_MESSAGE_TEMPLATE_CONTENT)
  );
  const [messageTemplateSettings, setMessageTemplateSettings] =
    useState<MessageTemplateSettings>(DEFAULT_MESSAGE_TEMPLATE_SETTINGS);
  const [readyToAutosave, setReadyToAutosave] = useState(false);
  const [dashboardReady, setDashboardReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "pending" | "syncing" | "synced" | "error">("idle");
  const syncRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [checkInterval, setCheckInterval] = useState(1);
  const [checkIntervalSaving, setCheckIntervalSaving] = useState(false);

  useLayoutEffect(() => {
    const stored = readStoredTelegramConfig();
    const hasStoredTg = Boolean(
      stored.telegramToken.trim() && stored.telegramChatId.trim()
    );

    setTelegramToken(stored.telegramToken);
    setTelegramChatId(stored.telegramChatId);
    setTelegramTokenValidated(hasStoredTg);
    setTelegramChatValidated(hasStoredTg);
    setTelegramConfigured(hasStoredTg);
    setTelegramConfigExpanded(!hasStoredTg);
    setTelegramValidatedChat(
      validatedChatFromStoredApi(
        stored.telegramChatId,
        stored.telegramChatTitle,
        stored.telegramChatType
      )
    );
    setTelegramSendAsChat(stored.telegramSendAsChat);
    setMessageTemplate(readStoredMessageTemplateContent());
    setMessageTemplateSettings(readStoredMessageTemplateSettings());

    if (hasStoredTg) {
      setDashboardReady(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

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

        setTelegramValidatedChat(
          validatedChatFromStoredApi(
            tgChatId,
            config.telegramChatTitle,
            config.telegramChatType
          )
        );
        setTelegramSendAsChat(Boolean(config.telegramSendAsChat));
        setCheckInterval(config.checkInterval ?? 1);

        // Fetch bot info if we have a saved token
        if (tgToken.trim()) {
          fetch("/api/telegram/discover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: tgToken.trim() }),
          })
            .then((res) => res.json())
            .then((data: unknown) => {
              const result = data as TelegramDetectionResult | { error?: string };
              if ("bot" in result && result.bot) {
                setSavedBotUsername(result.bot.username || result.bot.firstName);
                setTelegramLookupResult(result);
                const cid = tgChatId.trim();
                if (cid && "chats" in result && Array.isArray(result.chats)) {
                  const found = result.chats.find((c) => c.id === cid);
                  if (found) {
                    setTelegramValidatedChat(found);
                  }
                }
              }
            })
            .catch(() => {});
        }

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
          saveStoredTelegramConfig(tgToken, tgChatId, {
            chatTitle: config.telegramChatTitle ?? "",
            chatType: config.telegramChatType ?? "",
            sendAsChat: Boolean(config.telegramSendAsChat),
            checkInterval: config.checkInterval ?? 1,
          });
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
        setTelegramValidatedChat(
          validatedChatFromStoredApi(
            storedConfig.telegramChatId,
            storedConfig.telegramChatTitle,
            storedConfig.telegramChatType
          )
        );
        setTelegramSendAsChat(storedConfig.telegramSendAsChat);
        setCheckInterval(storedConfig.checkInterval ?? 1);
        setMessageTemplate(readStoredMessageTemplateContent());
        setMessageTemplateSettings(readStoredMessageTemplateSettings());
      } finally {
        if (!cancelled) {
          setDashboardReady(true);
          setReadyToAutosave(true);
        }
      }
    }

    loadConfig();
    return () => {
      cancelled = true;
    };
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
      setTelegramSendAsChat(false);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(TELEGRAM_SEND_AS_CHAT_STORAGE_KEY);
      }
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
      setTelegramLookupError(t("dashboard.errAddTokenFirst"));
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
        | { error?: string; errorKey?: string };

      if (!response.ok || !("bot" in payload)) {
        setTelegramLookupResult(null);
        setTelegramTokenValidated(false);
        setTelegramLookupError(
          resolveTelegramApiErrorMessage(
            payload as { error?: string; errorKey?: string },
            t
          )
        );
        return;
      }

      setTelegramLookupResult(payload);
      setTelegramTokenValidated(true);
      setSavedBotUsername(payload.bot.username || payload.bot.firstName);
      setEditingBotToken(false);
    } catch {
      setTelegramLookupResult(null);
      setTelegramLookupError(t("dashboard.errContactTelegram"));
      setTelegramTokenValidated(false);
    } finally {
      setTelegramLookupLoading(false);
    }
  }

  async function handleTelegramSave() {
    const normalizedToken = telegramToken.trim();
    const normalizedChatId = telegramChatId.trim();

    if (!normalizedToken) {
      setTelegramChatValidationError(t("dashboard.errAddTokenFirst"));
      return;
    }

    if (!telegramTokenValidated) {
      setTelegramChatValidationError(t("dashboard.errValidateTokenFirst"));
      return;
    }

    if (!normalizedChatId) {
      setTelegramChatValidationError(t("dashboard.errPickChatId"));
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
        | { error?: string; errorKey?: string };

      if (!response.ok || !("chat" in payload)) {
        setTelegramChatValidated(false);
        setTelegramValidatedChat(null);
        setTelegramChatValidationError(
          resolveTelegramApiErrorMessage(
            payload as { error?: string; errorKey?: string },
            t
          )
        );
        return;
      }

      const sendAsChatPref =
        payload.chat.type === "channel" ? telegramSendAsChat : false;
      if (payload.chat.type !== "channel" && telegramSendAsChat) {
        setTelegramSendAsChat(false);
      }

      saveStoredTelegramConfig(normalizedToken, payload.chat.id, {
        chatTitle: payload.chat.title,
        chatType: payload.chat.type,
        sendAsChat: sendAsChatPref,
      });

      // Push to Worker API so the cron uses these credentials
      try {
        await apiUpdateConfig({
          telegramToken: normalizedToken,
          telegramChatId: payload.chat.id,
          telegramChatTitle: payload.chat.title,
          telegramChatType: payload.chat.type,
          telegramSendAsChat: sendAsChatPref,
        });
      } catch {
        setTelegramChatValidationError(t("dashboard.errSaveConfig"));
        return;
      }

      setTelegramChatId(payload.chat.id);
      setTelegramValidatedChat(payload.chat);
      setTelegramChatValidated(true);
      setTelegramConfigured(true);
      setTelegramConfigExpanded(false);
      setEditingChatId(false);
      setChannelSaved(true);
      setTimeout(() => setChannelSaved(false), 2000);
    } catch {
      setTelegramChatValidated(false);
      setTelegramValidatedChat(null);
      setTelegramChatValidationError(t("dashboard.errValidateChat"));
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
  const botTokenIsLocked =
    telegramTokenValidated && !editingBotToken && Boolean(telegramToken.trim());

  const telegramTokenStepContent = (
    <div className="space-y-3">
      {botTokenIsLocked ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs font-medium text-emerald-300">
            <Bot className="size-3.5" />
            {savedBotUsername
              ? savedBotUsername.startsWith("@")
                ? savedBotUsername
                : `@${savedBotUsername}`
              : t("dashboard.botFallback")}
          </span>
          <button
            type="button"
            onClick={() => setEditingBotToken(true)}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Pencil className="size-3" />
            {t("dashboard.modify")}
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="tg-token">{t("dashboard.botTokenLabel")}</Label>
          <Input
            id="tg-token"
            type="password"
            placeholder={t("dashboard.botTokenPlaceholder")}
            value={telegramToken}
            onChange={(event) => {
              setTelegramToken(event.target.value);
              resetTelegramProgress({ clearChatId: true });
            }}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={handleTelegramDetectChats}
          size="sm"
          disabled={telegramLookupLoading || !telegramToken.trim()}
        >
          {telegramLookupLoading && (
            <Loader2 className="size-3.5 animate-spin" />
          )}
          {t("dashboard.detectChats")}
        </Button>
        {telegramLookupResult?.bot && !botTokenIsLocked && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
            <Bot className="size-3.5" />
            {telegramLookupResult.bot.username ||
              telegramLookupResult.bot.firstName}
          </span>
        )}
        {!botTokenIsLocked && editingBotToken && telegramTokenValidated && (
          <button
            type="button"
            onClick={() => setEditingBotToken(false)}
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("dashboard.cancel")}
          </button>
        )}
      </div>

      {telegramLookupError && (
        <p className="text-xs text-amber-400">{telegramLookupError}</p>
      )}
    </div>
  );
  const chatIdIsLocked = telegramChatValidated && !editingChatId && telegramChatId.trim();
  const chatDisplayName = telegramValidatedChat
    ? chatRowTitle(telegramValidatedChat, t)
    : telegramChatId;
  const chatIsGroup = telegramValidatedChat
    ? telegramValidatedChat.type !== "private"
    : telegramChatId.startsWith("-");
  const chatIsChannel = telegramValidatedChat?.type === "channel";

  async function handleSendTelegramTest() {
    setTelegramTestStatus("loading");
    setTelegramTestError("");
    try {
      await apiTelegramTest();
      setTelegramTestStatus("ok");
      window.setTimeout(() => setTelegramTestStatus("idle"), 4000);
    } catch (err) {
      setTelegramTestStatus("error");
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t("dashboard.sendTestTelegramErrorGeneric");
      setTelegramTestError(msg);
    }
  }

  async function handleToggleTelegramSendAsChat(next: boolean) {
    if (!telegramConfigured || !chatIsChannel) return;
    const token = telegramToken.trim();
    const chatId = telegramChatId.trim();
    if (!token || !chatId) return;

    const prev = telegramSendAsChat;
    setTelegramSendAsChat(next);
    saveStoredTelegramConfig(token, chatId, { sendAsChat: next });
    setSendAsChatSaving(true);
    try {
      await apiUpdateConfig({ telegramSendAsChat: next });
    } catch {
      setTelegramSendAsChat(prev);
      saveStoredTelegramConfig(token, chatId, { sendAsChat: prev });
      setTelegramChatValidationError(t("dashboard.errSaveConfig"));
    } finally {
      setSendAsChatSaving(false);
    }
  }

  async function handleCheckIntervalChange(nextInterval: number) {
    if (!telegramConfigured) return;
    const token = telegramToken.trim();
    const chatId = telegramChatId.trim();
    if (!token || !chatId) return;

    const prev = checkInterval;
    setCheckInterval(nextInterval);
    saveStoredTelegramConfig(token, chatId, { checkInterval: nextInterval });
    setCheckIntervalSaving(true);
    try {
      await apiUpdateConfig({ checkInterval: nextInterval });
    } catch {
      setCheckInterval(prev);
      saveStoredTelegramConfig(token, chatId, { checkInterval: prev });
      setTelegramChatValidationError(t("dashboard.errSaveConfig"));
    } finally {
      setCheckIntervalSaving(false);
    }
  }

  const telegramChatStepContent = chatIdIsLocked ? (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs font-medium text-emerald-300">
        {chatIsGroup ? (
          <Users className="size-3.5" />
        ) : (
          <User className="size-3.5" />
        )}
        {chatDisplayName}
      </span>
      <button
        type="button"
        onClick={() => {
          setEditingChatId(true);
          // Re-fetch chats if we have the bot token
          if (telegramTokenValidated && !telegramLookupResult) {
            handleTelegramDetectChats();
          }
        }}
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <Pencil className="size-3" />
        {t("dashboard.modify")}
      </button>
    </div>
  ) : (
    <div className="space-y-3">
      {telegramLookupResult?.bot && !telegramLookupResult.bot.canJoinGroups && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
          <Trans
            i18nKey="dashboard.joinGroupsWarning"
            components={{
              cmd: <span className="font-semibold" />,
            }}
          />
        </div>
      )}

      {telegramLookupResult && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {t("dashboard.pickChatHint")}
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
                        <p className="truncate text-sm font-medium">
                          {chatRowTitle(chat, t)}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {chatRowSubtitle(chat, t)}
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
              {t("dashboard.noChatsHint")}
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="tg-chat">{t("dashboard.chatIdLabel")}</Label>
        <Input
          id="tg-chat"
          type="text"
          placeholder={t("dashboard.chatIdPlaceholder")}
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
            {t("dashboard.saved")}
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
          {t("dashboard.save")}
        </Button>
        {editingChatId && (
          <button
            type="button"
            onClick={() => setEditingChatId(false)}
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("dashboard.cancel")}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <h1 className="text-lg font-semibold">{t("dashboard.title")}</h1>
          <div className="flex items-center gap-2">
            {isAdmin && <AdminUserCount />}
            <LanguageToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearStoredShotgunToken();
                router.replace("/");
              }}
            >
              {t("dashboard.logout")}
            </Button>
          </div>
        </div>
      </header>

      {dashboardReady ? (
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              {t("dashboard.sectionTelegramTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.sectionTelegramSubtitle")}
            </p>
          </div>

          {telegramConfigured && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTelegramConfigExpanded((current) => !current)}
            >
              {telegramConfigExpanded
                ? t("dashboard.collapse")
                : t("dashboard.edit")}
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="space-y-4">
            {showTelegramSummaryBar && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  {t("dashboard.telegramConnected")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {telegramValidatedChat
                    ? chatRowTitle(telegramValidatedChat, t)
                    : telegramChatId}
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

            {telegramConfigured && (
              <>
                <Separator className="my-1" />
                <SettingsToggleRow
                  variant="plain"
                  label={t("dashboard.sendAsChatLabel")}
                  description={
                    chatIsChannel
                      ? undefined
                      : chatIsGroup
                        ? t("dashboard.sendAsChatChannelsOnlyHint")
                        : t("dashboard.sendAsChatPrivateHint")
                  }
                  pressed={telegramSendAsChat && chatIsChannel}
                  onToggle={() => void handleToggleTelegramSendAsChat(!telegramSendAsChat)}
                  disabled={!chatIsChannel || sendAsChatSaving}
                  aria-label={t("dashboard.sendAsChatAria")}
                />

                <Separator className="my-1" />
                <div className="space-y-2">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {t("dashboard.checkFrequencyLabel")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("dashboard.checkFrequencyHint")}
                    </p>
                  </div>
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="radiogroup"
                    aria-label={t("dashboard.checkFrequencyAria")}
                  >
                    {CHECK_INTERVAL_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={checkInterval === option}
                        disabled={checkIntervalSaving}
                        onClick={() => void handleCheckIntervalChange(option)}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                          checkInterval === option
                            ? "border-foreground/30 bg-foreground text-background"
                            : "border-border/60 text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                          checkIntervalSaving && "pointer-events-none opacity-50"
                        )}
                      >
                        {t(`dashboard.freq${option}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator className="my-1" />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {t("dashboard.sendTestTelegramTitle")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("dashboard.sendTestTelegramHint")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="inline-flex shrink-0 gap-2"
                    disabled={telegramTestStatus === "loading"}
                    onClick={() => void handleSendTelegramTest()}
                  >
                    {telegramTestStatus === "loading" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                    <span>{t("dashboard.sendTestTelegram")}</span>
                  </Button>
                </div>
                {telegramTestStatus === "ok" && (
                  <p className="text-xs text-emerald-400">
                    {t("dashboard.sendTestTelegramOk")}
                  </p>
                )}
                {telegramTestStatus === "error" && telegramTestError && (
                  <p className="text-xs text-amber-400">{telegramTestError}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {showMessageTemplate && (
          <>
            <div>
              <h2 className="text-2xl font-bold">
                {t("dashboard.messageSectionTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.messageSectionSubtitle")}
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

        <FeedbackSection />

        <DeleteAccountSection />
      </main>
      ) : (
        <DashboardMainSkeleton />
      )}
      <SiteFooter variant="app" />
    </div>
  );
}
