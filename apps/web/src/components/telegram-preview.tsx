"use client";

import { useTranslation } from "react-i18next";
import {
  formatTelegramDayLabel,
  TelegramPhoneMockup,
} from "@shotgun-notifier/shared";

interface TelegramPreviewProps {
  message: string;
  mode?: "bot" | "group";
}

function timeLocaleTag(lng: string) {
  return lng.startsWith("fr") ? "fr-FR" : "en-GB";
}

function getPreviewTime(localeTag: string) {
  return new Intl.DateTimeFormat(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function getPreviousTime(localeTag: string) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - 8);
  return new Intl.DateTimeFormat(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function TelegramPreview({ message, mode = "bot" }: TelegramPreviewProps) {
  const { t, i18n } = useTranslation();
  const localeTag = timeLocaleTag(i18n.resolvedLanguage || i18n.language || "en");
  const renderedMessage = message || t("telegramPreview.emptyMessage");
  const previewTime = getPreviewTime(localeTag);
  const prevTime = getPreviousTime(localeTag);
  const isGroup = mode === "group";
  const dayLabel = formatTelegramDayLabel(
    i18n.resolvedLanguage || i18n.language || "en"
  );

  return (
    <TelegramPhoneMockup
      width="100%"
      maxWidth="23rem"
      title={isGroup ? t("telegramPreview.groupTitle") : t("telegramPreview.botTitle")}
      subtitle={
        isGroup
          ? t("telegramPreview.groupMembers", { count: 3 })
          : t("telegramPreview.botSubtitle")
      }
      avatarLabel={
        isGroup
          ? t("telegramPreview.groupInitials")
          : t("telegramPreview.botInitials")
      }
      avatarBackground={isGroup ? "#3e546a" : "#2AABEE"}
      dayLabel={dayLabel}
      composerPlaceholder={t("telegramPreview.composerPlaceholder")}
      alignMessagesToBottom
      messages={[
        ...(isGroup
          ? [
              {
                content: t("telegramPreview.msgLucas"),
                time: prevTime,
                sender: t("telegramPreview.userLucas"),
                senderColor: "#e67e22",
              },
              {
                content: t("telegramPreview.msgMarie"),
                time: prevTime,
                side: "right" as const,
              },
            ]
          : []),
        {
          content: renderedMessage,
          time: previewTime,
          sender: t("telegramPreview.senderBot"),
          senderColor: "#2AABEE",
        },
      ]}
    />
  );
}
