"use client";

import {
  AtSign,
  Bell,
  Hash,
  HelpCircle,
  Inbox,
  PinIcon,
  Plus,
  Search,
  Smile,
  Users,
} from "lucide-react";

interface DiscordPreviewProps {
  message: string;
}

function getPreviewTime() {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export function DiscordPreview({ message }: DiscordPreviewProps) {
  const renderedMessage = message || "Votre message apparaitra ici.";
  const previewTime = getPreviewTime();

  return (
    <div className="mx-auto flex h-[42rem] w-full max-w-[23rem] flex-col overflow-hidden rounded-[2.2rem] border border-[#1e1f22] bg-[#313338] shadow-[0_28px_60px_rgba(0,0,0,0.38)]">
      {/* Channel header */}
      <div className="flex items-center gap-2 border-b border-[#1e1f22] bg-[#313338] px-3 py-2.5">
        <Hash className="size-4 text-[#80848e]" strokeWidth={2.5} />
        <span className="text-sm font-semibold text-[#f2f3f5]">
          notifications
        </span>
        <div className="ml-auto flex items-center gap-2 text-[#b5bac1]">
          <Bell className="size-3.5" strokeWidth={2} />
          <PinIcon className="size-3.5" strokeWidth={2} />
          <Users className="size-3.5" strokeWidth={2} />
          <div className="flex h-6 items-center rounded-[4px] bg-[#1e1f22] px-1.5">
            <Search className="size-3 text-[#80848e]" strokeWidth={2} />
            <span className="ml-1 text-[11px] text-[#80848e]">Rechercher</span>
          </div>
          <Inbox className="size-3.5" strokeWidth={2} />
          <HelpCircle className="size-3.5" strokeWidth={2} />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 bg-[#313338] px-4 py-4">
        {/* Date separator */}
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-[#3f4147]" />
          <span className="text-[11px] font-semibold text-[#80848e]">
            Aujourd&apos;hui
          </span>
          <div className="h-px flex-1 bg-[#3f4147]" />
        </div>

        {/* Message */}
        <div className="group flex gap-3 rounded-lg px-1 py-1">
          {/* Avatar */}
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#5865F2] text-sm font-bold text-white">
            SG
          </div>

          <div className="min-w-0 flex-1">
            {/* Username + badge + time */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#f2f3f5]">
                Shotgun Notifier
              </span>
              <span className="rounded-[3px] bg-[#5865F2] px-[5px] py-[1px] text-[10px] font-medium text-white">
                BOT
              </span>
              <span className="text-[11px] text-[#80848e]">{previewTime}</span>
            </div>

            {/* Message content */}
            <div className="mt-0.5 whitespace-pre-wrap text-[13.5px] leading-[1.4] text-[#dbdee1]">
              {renderedMessage}
            </div>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="bg-[#313338] px-4 pb-4">
        <div className="flex items-center gap-2 rounded-lg bg-[#383a40] px-3 py-2.5">
          <Plus className="size-5 text-[#b5bac1]" strokeWidth={2.5} />
          <span className="flex-1 text-sm text-[#6d6f78]">
            Envoyer un message dans #notifications
          </span>
          <div className="flex items-center gap-3 text-[#b5bac1]">
            <Smile className="size-5" strokeWidth={2} />
            <AtSign className="size-5" strokeWidth={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
