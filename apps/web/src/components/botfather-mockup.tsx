"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  EllipsisVertical,
  Mic,
  Paperclip,
  Search,
  Smile,
} from "lucide-react";

interface Message {
  from: "user" | "botfather";
  parts: MessagePart[];
  time: string;
}

type MessagePart =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "code"; value: string }
  | { type: "mono"; value: string };

function renderParts(parts: MessagePart[]) {
  return parts.map((part, i) => {
    if (part.type === "bold") {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.value}
        </strong>
      );
    }
    if (part.type === "code") {
      return (
        <span
          key={i}
          className="rounded bg-[#1a2530] px-1 py-0.5 font-mono text-[11px] text-[#6ab7f5]"
        >
          {part.value}
        </span>
      );
    }
    if (part.type === "mono") {
      return (
        <span
          key={i}
          className="rounded bg-[#1a2530] px-1 py-0.5 font-mono text-[11px] text-[#e4e6eb]"
        >
          {part.value}
        </span>
      );
    }
    return part.value.split("\n").map((line, j) => (
      <span key={`${i}-${j}`}>
        {j > 0 && <br />}
        {line}
      </span>
    ));
  });
}

export function BotFatherMockup() {
  const { i18n } = useTranslation();
  /** BotFather’s real flow is in English; longer FR copy overflowed the fixed-height mockup. */
  const tBf = useMemo(() => i18n.getFixedT("en"), [i18n]);

  const conversation = useMemo<Message[]>(
    () => [
      {
        from: "user",
        parts: [{ type: "text", value: tBf("bf.m0") }],
        time: "10:26",
      },
      {
        from: "botfather",
        parts: [{ type: "text", value: tBf("bf.m1") }],
        time: "10:26",
      },
      {
        from: "user",
        parts: [{ type: "text", value: tBf("bf.m2") }],
        time: "10:26",
      },
      {
        from: "botfather",
        parts: [
          { type: "text", value: tBf("bf.m3a") },
          { type: "mono", value: "bot" },
          { type: "text", value: tBf("bf.m3b") },
        ],
        time: "10:26",
      },
      {
        from: "user",
        parts: [{ type: "text", value: tBf("bf.m4") }],
        time: "10:27",
      },
      {
        from: "botfather",
        parts: [
          { type: "text", value: tBf("bf.m5a") },
          { type: "code", value: tBf("bf.token") },
          { type: "text", value: tBf("bf.m5b") },
          { type: "bold", value: tBf("bf.m5c") },
          { type: "text", value: tBf("bf.m5d") },
          { type: "bold", value: tBf("bf.m5e") },
          { type: "text", value: tBf("bf.m5f") },
        ],
        time: "10:27",
      },
    ],
    [tBf]
  );

  return (
    <div className="mx-auto flex h-[42rem] w-[23rem] shrink-0 flex-col overflow-hidden rounded-[2.2rem] border border-black/20 bg-[#17212b] shadow-[0_28px_60px_rgba(0,0,0,0.38)]">
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

      <div className="flex items-center gap-2 border-b border-[#101a23] bg-[#17212b] px-2 py-2">
        <button
          type="button"
          className="grid size-8 place-items-center text-[#6ab7f5]"
          aria-label={tBf("bf.back")}
        >
          <ChevronLeft className="size-5" strokeWidth={2.5} />
        </button>
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#5288c1]">
          <span className="text-xs font-bold text-white">BF</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-white">BotFather</span>
            <svg
              className="size-3.5 text-[#6ab7f5]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
          <span className="text-[11px] text-[#708499]">{tBf("bf.headerSubtitle")}</span>
        </div>
        <div className="flex items-center gap-0.5 text-[#aaaaaa]">
          <Search className="size-5" strokeWidth={1.8} />
          <EllipsisVertical className="size-5" strokeWidth={1.8} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#0e1621] px-3 py-3">
        <div className="space-y-1.5">
          {conversation.map((msg, i) => (
            <div
              key={i}
              className={
                msg.from === "user" ? "flex justify-end" : "flex justify-start"
              }
            >
              <div
                className={
                  msg.from === "user"
                    ? "max-w-[82%] rounded-2xl rounded-br-sm bg-[#2b5278] px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                    : "max-w-[82%] rounded-2xl rounded-bl-sm bg-[#182533] px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                }
              >
                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[12.5px] leading-[1.45] text-[#e4e6eb]">
                  {renderParts(msg.parts)}
                </p>
                <div className="mt-0.5 flex items-center justify-end gap-1">
                  <span className="text-[10px] text-[#708499]">{msg.time}</span>
                  {msg.from === "user" && (
                    <svg
                      className="size-3 text-[#6ab7f5]"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 8.5l3 3 5-6M6 11.5l1 1 5-6" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#17212b] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Paperclip className="size-5 text-[#aaaaaa]" strokeWidth={1.8} />
          <div className="flex min-h-9 flex-1 items-center rounded-xl bg-[#0e1621] px-3">
            <span className="text-sm text-[#708499]">{tBf("bf.inputPlaceholder")}</span>
          </div>
          <div className="flex items-center gap-1 text-[#aaaaaa]">
            <Smile className="size-5" strokeWidth={1.8} />
            <Mic className="size-5" strokeWidth={1.8} />
          </div>
        </div>
      </div>
    </div>
  );
}
