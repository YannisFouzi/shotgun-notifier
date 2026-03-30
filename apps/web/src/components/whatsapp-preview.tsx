"use client";

import { useTranslation } from "react-i18next";
import {
  BatteryFull,
  Camera,
  ChevronLeft,
  EllipsisVertical,
  Lock,
  Mic,
  Paperclip,
  Phone,
  SignalHigh,
  Smile,
  Video,
  Wifi,
} from "lucide-react";

interface WhatsAppPreviewProps {
  message: string;
  mode?: "bot" | "group";
}

const WALLPAPER_STYLE = {
  backgroundColor: "#efeae2",
  backgroundImage: `
    radial-gradient(circle at 25% 20%, rgba(18, 140, 126, 0.08) 0, rgba(18, 140, 126, 0.08) 2px, transparent 2px),
    radial-gradient(circle at 75% 30%, rgba(17, 27, 33, 0.04) 0, rgba(17, 27, 33, 0.04) 1.5px, transparent 1.5px),
    radial-gradient(circle at 35% 75%, rgba(37, 211, 102, 0.06) 0, rgba(37, 211, 102, 0.06) 2px, transparent 2px),
    linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.18))
  `,
  backgroundPosition: "0 0, 22px 18px, 10px 30px, 0 0",
  backgroundSize: "34px 34px, 42px 42px, 56px 56px, 100% 100%",
} satisfies React.CSSProperties;

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
  d.setMinutes(d.getMinutes() - 12);
  return new Intl.DateTimeFormat(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function WhatsAppPreview({ message, mode = "bot" }: WhatsAppPreviewProps) {
  const { t, i18n } = useTranslation();
  const localeTag = timeLocaleTag(i18n.resolvedLanguage || i18n.language || "en");
  const renderedMessage = message || t("telegramPreview.emptyMessage");
  const previewTime = getPreviewTime(localeTag);
  const prevTime = getPreviousTime(localeTag);
  const isGroup = mode === "group";

  return (
    <div className="mx-auto flex h-[42rem] w-full max-w-[23rem] flex-col overflow-hidden rounded-[2.2rem] border border-black/20 bg-[#0b141a] shadow-[0_28px_60px_rgba(0,0,0,0.38)]">
      <div className="bg-[#0b141a] px-4 pb-3 pt-3 text-white">
        <div className="flex items-center justify-between text-[0.7rem] font-semibold tracking-[0.02em]">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <SignalHigh className="size-3.5" strokeWidth={2.3} />
            <Wifi className="size-3.5" strokeWidth={2.3} />
            <BatteryFull className="size-4" strokeWidth={2.3} />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2.5">
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full text-white/90"
            aria-label={t("telegramPreview.back")}
          >
            <ChevronLeft className="size-5" strokeWidth={2.5} />
          </button>

          {isGroup ? (
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#00a884] text-sm font-semibold text-white">
              {t("telegramPreview.groupInitials")}
            </div>
          ) : (
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#25d366] text-sm font-semibold text-[#0b141a]">
              {t("telegramPreview.botInitials")}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {isGroup
                ? t("telegramPreview.groupTitle")
                : t("telegramPreview.senderBot")}
            </p>
            <p className="truncate text-[11px] text-white/70">
              {isGroup
                ? t("whatsappPreview.groupParticipants")
                : t("whatsappPreview.businessSubtitle")}
            </p>
          </div>

          <div className="flex items-center gap-0.5 text-white/90">
            <button
              type="button"
              className="grid size-8 place-items-center rounded-full"
              aria-label={t("telegramPreview.video")}
            >
              <Video className="size-4.5" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-full"
              aria-label={t("telegramPreview.call")}
            >
              <Phone className="size-4.5" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-full"
              aria-label={t("telegramPreview.more")}
            >
              <EllipsisVertical className="size-4.5" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-3 py-4" style={WALLPAPER_STYLE}>
        <div className="mx-auto mb-4 w-fit rounded-full bg-[#dff0f8] px-3 py-1 text-[11px] font-medium text-[#54656f] shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
          {t("telegramPreview.today")}
        </div>

        {!isGroup && (
          <div className="mx-auto mb-4 flex max-w-[17.5rem] items-start gap-2 rounded-2xl bg-[#fff3c4] px-3 py-2 text-[11px] leading-4 text-[#54656f] shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
            <Lock className="mt-0.5 size-3 shrink-0 text-[#667781]" />
            <span>{t("whatsappPreview.encryptionNotice")}</span>
          </div>
        )}

        {isGroup && (
          <>
            {/* Message from Lucas */}
            <div className="mb-3 flex justify-start">
              <div className="relative max-w-[83%]">
                <div className="rounded-[1.25rem] rounded-tl-[0.35rem] bg-white px-3.5 py-2 shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
                  <div className="mb-0.5 text-[11px] font-semibold text-[#e67e22]">
                    {t("telegramPreview.userLucas")}
                  </div>
                  <div className="pr-10 text-[13px] leading-[1.45] text-[#111b21]">
                    {t("telegramPreview.msgLucas")}
                  </div>
                  <div className="mt-0.5 flex justify-end text-[11px] text-[#667781]">{prevTime}</div>
                </div>
              </div>
            </div>

            {/* Message from Marie (sent - right side) */}
            <div className="mb-3 flex justify-end">
              <div className="relative max-w-[83%]">
                <div className="rounded-[1.25rem] rounded-tr-[0.35rem] bg-[#d9fdd3] px-3.5 py-2 shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
                  <div className="pr-10 text-[13px] leading-[1.45] text-[#111b21]">
                    {t("telegramPreview.msgMarie")}
                  </div>
                  <div className="mt-0.5 flex justify-end text-[11px] text-[#667781]">{prevTime}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Bot message */}
        <div className="flex justify-start">
          <div className="relative max-w-[83%]">
            {!isGroup && (
              <div className="absolute left-[-4px] top-3 size-3 rotate-45 rounded-[2px] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.07)]" />
            )}
            <div className="relative rounded-[1.25rem] rounded-tl-[0.35rem] bg-white px-3.5 py-2.5 shadow-[0_1px_1px_rgba(0,0,0,0.12)]">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#128c7e]">
                {isGroup
                  ? t("telegramPreview.senderBot")
                  : t("whatsappPreview.senderShort")}
              </div>
              <div className="pr-10 text-[13px] leading-[1.45] whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[#111b21]">
                {renderedMessage}
              </div>
              <div className="mt-1 flex justify-end text-[11px] text-[#667781]">
                {previewTime}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#f0f2f5] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center text-[#667781]">
            <Smile className="size-5" strokeWidth={2} />
          </div>
          <div className="flex min-h-11 flex-1 items-center gap-2 rounded-full bg-white px-3 text-[#667781] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            <Paperclip className="size-4.5" strokeWidth={2} />
            <span className="text-sm">{t("telegramPreview.composerPlaceholder")}</span>
            <div className="ml-auto grid size-7 place-items-center rounded-full bg-[#f6f7f8]">
              <Camera className="size-4" strokeWidth={2} />
            </div>
          </div>
          <div className="grid size-10 place-items-center rounded-full bg-[#25d366] text-[#0b141a] shadow-[0_6px_12px_rgba(37,211,102,0.25)]">
            <Mic className="size-4.5" strokeWidth={2.4} />
          </div>
        </div>
      </div>
    </div>
  );
}
