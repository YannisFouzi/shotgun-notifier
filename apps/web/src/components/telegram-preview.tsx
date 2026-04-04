"use client";

import { useTranslation } from "react-i18next";
import {
  IPhoneMockup,
  IOSLockScreen,
  TelegramNotifIcon,
  type IOSNotification,
} from "@shotgun-notifier/shared";

interface TelegramPreviewProps {
  message: string;
  mode?: "bot" | "group";
}

function timeLocaleTag(lng: string) {
  return lng.startsWith("fr") ? "fr-FR" : "en-GB";
}

function getFormattedTime(localeTag: string) {
  return new Intl.DateTimeFormat(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function getFormattedDate(localeTag: string) {
  return new Intl.DateTimeFormat(localeTag, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export function TelegramPreview({
  message,
  mode = "bot",
}: TelegramPreviewProps) {
  const { t, i18n } = useTranslation();
  const localeTag = timeLocaleTag(
    i18n.resolvedLanguage || i18n.language || "en"
  );
  const renderedMessage = message || t("telegramPreview.emptyMessage");
  const isGroup = mode === "group";

  const title = isGroup
    ? t("telegramPreview.groupTitle")
    : t("telegramPreview.botTitle");

  const notifications: IOSNotification[] = [
    {
      icon: <TelegramNotifIcon size={28} />,
      appName: "Telegram",
      title,
      body: renderedMessage,
      time: t("telegramPreview.now", { defaultValue: "now" }),
    },
  ];


  return (
    <IPhoneMockup scale={0.85} variant="black">
      <IOSLockScreen
        time={getFormattedTime(localeTag)}
        date={getFormattedDate(localeTag)}
        notifications={notifications}
      />
    </IPhoneMockup>
  );
}
