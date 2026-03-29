"use client";

import { useEffect, useState, type ComponentType, type CSSProperties } from "react";
import type { JSONContent } from "@tiptap/react";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MessageTemplateEditor,
  type PreviewChannel,
} from "@/components/message-template-editor";
import {
  clearStoredShotgunToken,
  readStoredTelegramConfig,
  saveStoredTelegramConfig,
} from "@/lib/shotgun";
import {
  TelegramIcon,
  DiscordIcon,
  WhatsAppIcon,
  MessengerIcon,
} from "@/components/icons";
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

type NotifChannel = PreviewChannel;

interface ChannelConfig {
  key: NotifChannel;
  label: string;
  color: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  available: boolean;
  fields: { id: string; label: string; placeholder: string; type?: string }[];
}

const CHANNELS: ChannelConfig[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    color: "#25d366",
    icon: WhatsAppIcon,
    available: false,
    fields: [
      { id: "wa-token", label: "API Token", placeholder: "EAAx...", type: "password" },
      { id: "wa-phone", label: "Numero", placeholder: "+33612345678" },
    ],
  },
  {
    key: "telegram",
    label: "Telegram",
    color: "#2AABEE",
    icon: TelegramIcon,
    available: true,
    fields: [
      { id: "tg-token", label: "Bot Token", placeholder: "123456:ABC...", type: "password" },
      { id: "tg-chat", label: "Chat ID", placeholder: "-1001234567890" },
    ],
  },
  {
    key: "messenger",
    label: "Messenger",
    color: "#0084ff",
    icon: MessengerIcon,
    available: false,
    fields: [
      { id: "msg-token", label: "Page Token", placeholder: "EAAx...", type: "password" },
      { id: "msg-recipient", label: "Recipient ID", placeholder: "123456789" },
    ],
  },
  {
    key: "discord",
    label: "Discord",
    color: "#5865F2",
    icon: DiscordIcon,
    available: false,
    fields: [
      { id: "dc-webhook", label: "Webhook URL", placeholder: "https://discord.com/api/webhooks/..." },
    ],
  },
];

export function DashboardPageClient() {
  const router = useRouter();
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [activeChannel, setActiveChannel] = useState<NotifChannel>("whatsapp");
  const [messageTemplate, setMessageTemplate] = useState<JSONContent>(
    cloneMessageTemplateContent(DEFAULT_MESSAGE_TEMPLATE_CONTENT)
  );
  const [messageTemplateSettings, setMessageTemplateSettings] =
    useState<MessageTemplateSettings>(DEFAULT_MESSAGE_TEMPLATE_SETTINGS);
  const [channelSaved, setChannelSaved] = useState(false);
  const [readyToAutosave, setReadyToAutosave] = useState(false);

  useEffect(() => {
    const storedConfig = readStoredTelegramConfig();
    setTelegramToken(storedConfig.telegramToken);
    setTelegramChatId(storedConfig.telegramChatId);
    setMessageTemplate(readStoredMessageTemplateContent());
    setMessageTemplateSettings(readStoredMessageTemplateSettings());
    setReadyToAutosave(true);
  }, []);

  useEffect(() => {
    if (!readyToAutosave) {
      return;
    }

    saveStoredMessageTemplateContent(messageTemplate);
    saveStoredMessageTemplateSettings(messageTemplateSettings);
  }, [messageTemplate, messageTemplateSettings, readyToAutosave]);

  function handleChannelSave() {
    saveStoredTelegramConfig(telegramToken, telegramChatId);
    setChannelSaved(true);
    setTimeout(() => setChannelSaved(false), 2000);
  }

  const currentChannel =
    CHANNELS.find((channel) => channel.key === activeChannel) ?? CHANNELS[0];

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
            <h2 className="text-2xl font-bold">Canal de notification</h2>
            <p className="text-sm text-muted-foreground">
              Choisissez le canal a connecter.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {CHANNELS.map((ch) => {
                const isActive = activeChannel === ch.key;
                const Icon = ch.icon;
                return (
                  <button
                    key={ch.key}
                    type="button"
                    onClick={() => {
                      setActiveChannel(ch.key);
                      setChannelSaved(false);
                    }}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition-all",
                      isActive
                        ? "border-transparent shadow-sm"
                        : "border-border/50 hover:border-border",
                      !ch.available && !isActive && "opacity-50"
                    )}
                    style={isActive ? { backgroundColor: ch.color + "15", borderColor: ch.color + "40" } : undefined}
                  >
                    <Icon
                      className={cn("size-6", isActive ? "" : "text-muted-foreground")}
                      style={isActive ? { color: ch.color } : undefined}
                    />
                    <p
                      className={cn("text-[10px] font-medium", isActive ? "" : "text-muted-foreground")}
                      style={isActive ? { color: ch.color } : undefined}
                    >
                      {ch.label}
                    </p>
                  </button>
                );
              })}
            </div>

            <div
              className="rounded-xl border p-4"
              style={{ borderColor: currentChannel.color + "25" }}
            >
              {currentChannel.available ? (
                <>
                  <div
                    className={cn(
                      "grid gap-3",
                      currentChannel.fields.length > 1 ? "sm:grid-cols-2" : ""
                    )}
                  >
                    {currentChannel.fields.map((field) => (
                      <div key={field.id} className="space-y-1.5">
                        <Label htmlFor={field.id}>{field.label}</Label>
                        <Input
                          id={field.id}
                          type={field.type || "text"}
                          placeholder={field.placeholder}
                          value={
                            field.id === "tg-token"
                              ? telegramToken
                              : field.id === "tg-chat"
                                ? telegramChatId
                                : ""
                          }
                          onChange={(e) => {
                            setChannelSaved(false);
                            if (field.id === "tg-token") {
                              setTelegramToken(e.target.value);
                            }
                            if (field.id === "tg-chat") {
                              setTelegramChatId(e.target.value);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    {channelSaved && activeChannel === "telegram" && (
                      <span className="text-xs text-emerald-400">
                        Configuration enregistree
                      </span>
                    )}
                    <Button
                      onClick={handleChannelSave}
                      size="sm"
                      className="min-w-40"
                    >
                      Enregistrer
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {currentChannel.label} sera disponible prochainement.
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground/50">
                    Les champs sont affiches a titre indicatif.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold">Message de notification</h2>
          <p className="text-sm text-muted-foreground">
            Ecrivez votre message puis ajoutez les informations a afficher.
          </p>
        </div>

        <Card>
          <CardContent>
            <MessageTemplateEditor
              activePreview={activeChannel}
              settings={messageTemplateSettings}
              value={messageTemplate}
              onChange={setMessageTemplate}
              onSettingsChange={setMessageTemplateSettings}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
