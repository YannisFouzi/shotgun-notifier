"use client";

import {
  ChevronLeft,
  Mic,
  Phone,
  Plus,
  Smile,
  Video,
  Camera,
  Image,
} from "lucide-react";

interface MessengerPreviewProps {
  message: string;
  mode?: "bot" | "group";
}

function getPreviewTime() {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function getPreviousTime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - 6);
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function MessengerPreview({ message, mode = "bot" }: MessengerPreviewProps) {
  const renderedMessage = message || "Votre message apparaitra ici.";
  const previewTime = getPreviewTime();
  const prevTime = getPreviousTime();
  const isGroup = mode === "group";

  return (
    <div className="mx-auto flex h-[42rem] w-full max-w-[23rem] flex-col overflow-hidden rounded-[2.2rem] border border-black/20 bg-[#1c1e21] shadow-[0_28px_60px_rgba(0,0,0,0.38)]">
      {/* Status bar */}
      <div className="bg-[#242526] px-4 pb-0 pt-3 text-white">
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

      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-[#3a3b3c] bg-[#242526] px-2 py-2.5">
        <button type="button" className="grid size-8 place-items-center text-[#0084ff]" aria-label="Retour">
          <ChevronLeft className="size-5" strokeWidth={2.5} />
        </button>

        <div className="relative">
          {isGroup ? (
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#3a3b3c] text-xs font-bold text-white">
              OE
            </div>
          ) : (
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#0084ff] to-[#a033ff] text-xs font-bold text-white">
              SG
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#242526] bg-[#31a24c]" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {isGroup ? "Orga Events" : "Shotgun Notifier"}
          </p>
          <p className="truncate text-[11px] text-[#65676b]">
            {isGroup ? "Lucas, Marie, Shotgun Notifier" : "Actif maintenant"}
          </p>
        </div>

        <div className="flex items-center gap-1 text-[#0084ff]">
          <button type="button" className="grid size-8 place-items-center rounded-full" aria-label="Appel">
            <Phone className="size-4.5" strokeWidth={2.2} />
          </button>
          <button type="button" className="grid size-8 place-items-center rounded-full" aria-label="Video">
            <Video className="size-4.5" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-[#1c1e21] px-3 py-4">
        <div className="mx-auto mb-4 w-fit text-[11px] text-[#65676b]">
          {prevTime}
        </div>

        {isGroup && (
          <>
            {/* Message from Lucas */}
            <div className="mb-3 flex items-end gap-2">
              <div className="grid size-7 shrink-0 place-items-center rounded-full bg-[#ed4245] text-[10px] font-bold text-white">
                L
              </div>
              <div className="max-w-[78%]">
                <div className="rounded-2xl rounded-bl-md bg-[#303030] px-3.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                  <div className="text-[13px] leading-[1.45] text-[#e4e6eb]">
                    On en est ou des ventes ?
                  </div>
                </div>
              </div>
            </div>

            {/* Sent message (right side) */}
            <div className="mb-3 flex justify-end">
              <div className="max-w-[78%]">
                <div className="rounded-2xl rounded-br-md bg-[#0084ff] px-3.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                  <div className="text-[13px] leading-[1.45] text-white">
                    Le bot va nous dire ca
                  </div>
                </div>
              </div>
            </div>

            {/* Time before bot message */}
            <div className="mx-auto mb-3 w-fit text-[11px] text-[#65676b]">
              {previewTime}
            </div>
          </>
        )}

        {/* Bot message */}
        <div className="flex items-end gap-2">
          <div className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#0084ff] to-[#a033ff] text-[10px] font-bold text-white">
            SG
          </div>
          <div className="max-w-[78%]">
            <div className="rounded-2xl rounded-bl-md bg-[#303030] px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
              <div className="whitespace-pre-wrap text-[13px] leading-[1.45] text-[#e4e6eb]">
                {renderedMessage}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="bg-[#242526] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[#0084ff]">
            <div className="grid size-8 place-items-center">
              <Plus className="size-5" strokeWidth={2.5} />
            </div>
            <div className="grid size-8 place-items-center">
              <Camera className="size-4.5" strokeWidth={2} />
            </div>
            <div className="grid size-8 place-items-center">
              <Image className="size-4.5" strokeWidth={2} />
            </div>
            <div className="grid size-8 place-items-center">
              <Mic className="size-4.5" strokeWidth={2} />
            </div>
          </div>
          <div className="flex min-h-9 flex-1 items-center rounded-full bg-[#3a3b3c] px-3">
            <span className="text-sm text-[#65676b]">Aa</span>
            <div className="ml-auto grid size-6 place-items-center text-[#0084ff]">
              <Smile className="size-4" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
