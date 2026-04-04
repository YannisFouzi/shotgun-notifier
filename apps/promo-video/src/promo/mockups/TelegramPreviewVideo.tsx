import type { CSSProperties } from "react";
import { formatTelegramDayLabel } from "@shotgun-notifier/shared";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_BODY } from "../constants";

/* ── Telegram theme tokens ── */
const TG = {
  headerBg: "#17212b",
  chatBg: "#0e1621",
  bubbleIn: "#182533",
  bubbleOut: "#2b5278",
  accent: "#6ab3f3",
  accentBlue: "#2AABEE",
  text: "#f5f5f5",
  textMuted: "rgba(106,179,243,0.5)",
  inputBg: "#242f3d",
  inputText: "rgba(106,179,243,0.4)",
} as const;

/* ── Inline SVG icons ── */
function IconChevronLeft() {
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke={TG.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="8" stroke={TG.accent} strokeWidth="2" />
      <path d="M21 21l-4.35-4.35" stroke={TG.accent} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke={TG.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconDots() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="1.5" fill={TG.accent} />
      <circle cx="12" cy="12" r="1.5" fill={TG.accent} />
      <circle cx="12" cy="19" r="1.5" fill={TG.accent} />
    </svg>
  );
}
function IconSmile() {
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="rgba(106,179,243,0.6)" strokeWidth="2" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="rgba(106,179,243,0.6)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="10" r="1" fill="rgba(106,179,243,0.6)" />
      <circle cx="15" cy="10" r="1" fill="rgba(106,179,243,0.6)" />
    </svg>
  );
}
function IconPaperclip() {
  return (
    <svg width={27} height={27} viewBox="0 0 24 24" fill="none">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" stroke="rgba(106,179,243,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconMic() {
  return (
    <svg width={27} height={27} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="11" rx="3" stroke="rgba(106,179,243,0.6)" strokeWidth="2" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="rgba(106,179,243,0.6)" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="22" stroke="rgba(106,179,243,0.6)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ── Status bar ── */
function StatusBar() {
  return (
    <div style={{ background: TG.headerBg, padding: "18px 24px 0", color: "white" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 17, fontWeight: 600, letterSpacing: "0.02em" }}>
        <span>9:41</span>
        <div style={{ display: "flex", alignItems: "center", gap: 9, opacity: 0.8 }}>
          <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
            <div style={{ width: 4.5, height: 9, borderRadius: 1.5, background: "rgba(255,255,255,0.8)" }} />
            <div style={{ width: 4.5, height: 12, borderRadius: 1.5, background: "rgba(255,255,255,0.8)" }} />
            <div style={{ width: 4.5, height: 15, borderRadius: 1.5, background: "rgba(255,255,255,0.8)" }} />
            <div style={{ width: 4.5, height: 18, borderRadius: 1.5, background: "rgba(255,255,255,0.4)" }} />
          </div>
          <span style={{ fontSize: 15 }}>5G</span>
          <div style={{ display: "flex", alignItems: "center", height: 17, width: 30, borderRadius: 4.5, border: "1.5px solid rgba(255,255,255,0.4)", padding: "0 3px" }}>
            <div style={{ width: 18, height: 11, borderRadius: 2.5, background: "rgba(255,255,255,0.8)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Chat header ── */
function ChatHeader() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: TG.headerBg, padding: "15px 12px" }}>
      <div style={{ width: 48, height: 48, display: "grid", placeItems: "center" }}>
        <IconChevronLeft />
      </div>
      <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#3e546a", display: "grid", placeItems: "center", fontSize: 21, fontWeight: 700, color: "white", flexShrink: 0 }}>
        OE
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 21, fontWeight: 600, color: "white", lineHeight: 1.2 }}>Orga Shotnotif</div>
        <div style={{ fontSize: 17, color: TG.accent }}>3 membres</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <div style={{ width: 48, height: 48, display: "grid", placeItems: "center" }}><IconSearch /></div>
        <div style={{ width: 48, height: 48, display: "grid", placeItems: "center" }}><IconPhone /></div>
        <div style={{ width: 48, height: 48, display: "grid", placeItems: "center" }}><IconDots /></div>
      </div>
    </div>
  );
}

/* ── Animated bubble ── */
function AnimatedBubble({
  children,
  time,
  sender,
  senderColor,
  side = "left",
  delay,
}: {
  children: React.ReactNode;
  time: string;
  sender?: string;
  senderColor?: string;
  side?: "left" | "right";
  delay: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { mass: 0.7, damping: 14, stiffness: 120 },
  });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: side === "right" ? "flex-end" : "flex-start",
        marginBottom: 18,
        opacity: progress,
        transform: `translateY(${(1 - progress) * 30}px) scale(${0.96 + progress * 0.04})`,
        transformOrigin: side === "right" ? "bottom right" : "bottom left",
      }}
    >
      <div style={{ maxWidth: "83%" }}>
        <div
          style={{
            borderRadius: side === "right" ? "24px 24px 6px 24px" : "24px 24px 24px 6px",
            background: side === "right" ? TG.bubbleOut : TG.bubbleIn,
            padding: "12px 21px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          {sender && (
            <div style={{ fontSize: 17, fontWeight: 600, color: senderColor || TG.accentBlue, marginBottom: 3 }}>
              {sender}
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              alignItems: "end",
              columnGap: 10,
            }}
          >
            <div
              style={{
                minWidth: 0,
                fontSize: 20,
                lineHeight: 1.45,
                color: TG.text,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {children}
            </div>
            <div
              style={{
                fontSize: 17,
                lineHeight: 1,
                color: TG.textMuted,
                alignSelf: "end",
                whiteSpace: "nowrap",
              }}
            >
              {time}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Input bar ── */
function InputBar() {
  return (
    <div style={{ background: TG.headerBg, padding: "15px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <IconSmile />
        <div style={{ flex: 1, height: 60, borderRadius: 999, background: TG.inputBg, display: "flex", alignItems: "center", padding: "0 18px", fontSize: 21, color: TG.inputText }}>
          Message
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <IconPaperclip />
          <IconMic />
        </div>
      </div>
    </div>
  );
}

/* ── Types ── */
export interface ChatMessage {
  text: string;
  sender?: string;
  senderColor?: string;
  side?: "left" | "right";
  time: string;
  /** Frame delay before this message appears */
  delay: number;
}

export interface TelegramPreviewVideoProps {
  messages: ChatMessage[];
  /** Compact mode: no status bar, no input bar, content aligned to top */
  compact?: boolean;
  style?: CSSProperties;
}

/* ── Main component ── */
export function TelegramPreviewVideo({ messages, compact, style }: TelegramPreviewVideoProps) {
  const dayLabel = formatTelegramDayLabel("fr");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        fontFamily: FONT_BODY,
        background: TG.headerBg,
        ...style,
      }}
    >
      {!compact && <StatusBar />}
      <ChatHeader />

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: compact ? "flex-start" : "flex-end",
          padding: compact ? "16px 18px" : "24px 18px",
          backgroundColor: TG.chatBg,
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(42,171,238,0.04) 0, transparent 50%), radial-gradient(circle at 80% 70%, rgba(42,171,238,0.03) 0, transparent 40%)",
        }}
      >
        {/* Today badge */}
        {!compact && (
        <div
          style={{
            margin: "0 auto 24px",
            width: "fit-content",
            borderRadius: 999,
            background: "rgba(24,37,51,0.9)",
            padding: "6px 18px",
            fontSize: 17,
            fontWeight: 500,
            color: "rgba(106,179,243,0.7)",
          }}
        >
          {dayLabel}
        </div>
        )}

        {messages.map((msg, i) => (
          <AnimatedBubble
            key={i}
            time={msg.time}
            sender={msg.sender}
            senderColor={msg.senderColor}
            side={msg.side}
            delay={msg.delay}
          >
            {msg.text}
          </AnimatedBubble>
        ))}
      </div>

      {!compact && <InputBar />}
    </div>
  );
}
