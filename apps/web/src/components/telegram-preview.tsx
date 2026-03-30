"use client";

import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  EllipsisVertical,
  Mic,
  Paperclip,
  Phone,
  Search,
  Smile,
} from "lucide-react";

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

  return (
    <div className="mx-auto flex h-[42rem] w-full max-w-[23rem] min-w-0 shrink-0 flex-col overflow-hidden rounded-[2.2rem] border border-black/20 bg-[#17212b] shadow-[0_28px_60px_rgba(0,0,0,0.38)]">
      <div className="bg-[#17212b] px-4 pb-0 pt-3 text-white">
        <div className="flex items-center justify-between text-[0.7rem] font-semibold tracking-[0.02em]">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 text-white/80">
            <div className="flex gap-[2px]">
              <div className="h-[6px] w-[3px] rounded-sm bg-white/80" />
              <div className="h-[8px] w-[3px] rounded-sm bg-white/80" />
              <div className="h-[10px] w-[3px] rounded-sm bg-white/80" />
              <div className="h-[12px] w-[3px] rounded-sm bg-white/40" />
            </div>
            <span className="text-[10px]">5G</span>
            <div className="flex h-[11px] w-[20px] items-center rounded-[3px] border border-white/40 px-[2px]">
              <div className="h-[7px] w-[12px] rounded-[1.5px] bg-white/80" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-[#17212b] px-2 py-2.5">
        <button
          type="button"
          className="grid size-8 place-items-center text-[#6ab3f3]"
          aria-label={t("telegramPreview.back")}
        >
          <ChevronLeft className="size-5" strokeWidth={2.5} />
        </button>

        {isGroup ? (
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#3e546a] text-sm font-bold text-white">
            {t("telegramPreview.groupInitials")}
          </div>
        ) : (
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#2AABEE] text-sm font-bold text-white">
            {t("telegramPreview.botInitials")}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {isGroup
              ? t("telegramPreview.groupTitle")
              : t("telegramPreview.botTitle")}
          </p>
          <p className="truncate text-[11px] text-[#6ab3f3]">
            {isGroup
              ? t("telegramPreview.groupMembers", { count: 3 })
              : t("telegramPreview.botSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-0.5 text-[#6ab3f3]">
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full"
            aria-label={t("telegramPreview.search")}
          >
            <Search className="size-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full"
            aria-label={t("telegramPreview.call")}
          >
            <Phone className="size-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full"
            aria-label={t("telegramPreview.more")}
          >
            <EllipsisVertical className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 px-3 py-4"
        style={{
          backgroundColor: "#0e1621",
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(42,171,238,0.04) 0, transparent 50%), radial-gradient(circle at 80% 70%, rgba(42,171,238,0.03) 0, transparent 40%)",
        }}
      >
        <div className="mx-auto mb-4 w-fit rounded-full bg-[#182533]/90 px-3 py-1 text-[11px] font-medium text-[#6ab3f3]/70 shadow-sm">
          {t("telegramPreview.today")}
        </div>

        {isGroup && (
          <>
            <div className="mb-3 flex justify-start">
              <div className="max-w-[83%]">
                <div className="rounded-2xl rounded-tl-md bg-[#182533] px-3.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                  <div className="mb-0.5 text-[11px] font-semibold text-[#e67e22]">
                    {t("telegramPreview.userLucas")}
                  </div>
                  <div className="pr-10 text-[13px] leading-[1.45] text-[#f5f5f5]">
                    {t("telegramPreview.msgLucas")}
                  </div>
                  <div className="mt-0.5 flex justify-end text-[11px] text-[#6ab3f3]/50">
                    {prevTime}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-3 flex justify-end">
              <div className="max-w-[83%]">
                <div className="rounded-2xl rounded-tr-md bg-[#2b5278] px-3.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
                  <div className="pr-10 text-[13px] leading-[1.45] text-[#f5f5f5]">
                    {t("telegramPreview.msgMarie")}
                  </div>
                  <div className="mt-0.5 flex justify-end text-[11px] text-[#6ab3f3]/50">
                    {prevTime}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-start">
          <div className="relative max-w-[83%]">
            <div className="rounded-2xl rounded-tl-md bg-[#182533] px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
              <div className="mb-1 text-[11px] font-semibold text-[#2AABEE]">
                {t("telegramPreview.senderBot")}
              </div>
              <div className="pr-10 text-[13px] leading-[1.45] whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[#f5f5f5]">
                {renderedMessage}
              </div>
              <div className="mt-1 flex justify-end text-[11px] text-[#6ab3f3]/50">
                {previewTime}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#17212b] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center text-[#6ab3f3]/60">
            <Smile className="size-5" strokeWidth={2} />
          </div>
          <div className="flex min-h-10 flex-1 items-center rounded-full bg-[#242f3d] px-3 text-[#6ab3f3]/40">
            <span className="text-sm">{t("telegramPreview.composerPlaceholder")}</span>
          </div>
          <div className="flex items-center gap-1 text-[#6ab3f3]/60">
            <div className="grid size-8 place-items-center">
              <Paperclip className="size-4.5" strokeWidth={2} />
            </div>
            <div className="grid size-8 place-items-center">
              <Mic className="size-4.5" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
