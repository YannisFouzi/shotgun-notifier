import type { CSSProperties, ReactNode } from "react";
import {
  ChevronLeft,
  EllipsisVertical,
  Mic,
  Paperclip,
  Phone,
  Search,
  Smile,
} from "lucide-react";
import { IPhoneMockup } from "./iphone-mockup";

export interface TelegramPhoneMockupMessage {
  content: ReactNode;
  time: string;
  side?: "left" | "right";
  sender?: string;
  senderColor?: string;
  bubbleColor?: string;
  progress?: number;
}

export interface TelegramPhoneMockupProps {
  title: string;
  subtitle: string;
  avatarLabel: string;
  avatarBackground: string;
  messages: TelegramPhoneMockupMessage[];
  width?: number | string;
  maxWidth?: number | string;
  style?: CSSProperties;
  progress?: number;
  dayLabel?: string | null;
  alignMessagesToBottom?: boolean;
  showComposer?: boolean;
  composerPlaceholder?: string;
  verified?: boolean;
  accentColor?: string;
  backIconColor?: string;
  actionIconColor?: string;
  subtitleColor?: string;
  actions?: Array<"search" | "call" | "more">;
  deviceShadow?: string;
}

export function resolveTelegramDayLabelLocale(language: string) {
  return language.toLowerCase().startsWith("fr") ? "fr-FR" : "en-US";
}

export function formatTelegramDayLabel(
  language: string,
  date: Date = new Date()
) {
  const locale = resolveTelegramDayLabelLocale(language);
  const formatted = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
  }).format(date);

  return formatted.replace(/\p{L}+/u, (word) => {
    const [first = "", ...rest] = Array.from(word);
    return first.toLocaleUpperCase(locale) + rest.join("");
  });
}

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

const BASE_PHONE_WIDTH = 23 * 16;
const BASE_PHONE_HEIGHT = BASE_PHONE_WIDTH * 2.08;

function renderHeaderAction(action: "search" | "call" | "more", color: string) {
  const iconStyle = { color } as const;

  if (action === "search") {
    return <Search size={16} strokeWidth={2} style={iconStyle} />;
  }

  if (action === "call") {
    return <Phone size={16} strokeWidth={2} style={iconStyle} />;
  }

  return <EllipsisVertical size={16} strokeWidth={2} style={iconStyle} />;
}

function VerifiedBadge({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ width: 14, height: 14, color, flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

export function TelegramPhoneMockup({
  title,
  subtitle,
  avatarLabel,
  avatarBackground,
  messages,
  width = "100%",
  maxWidth = "23rem",
  style,
  progress = 1,
  dayLabel = null,
  alignMessagesToBottom = true,
  showComposer = true,
  composerPlaceholder = "Message",
  verified = false,
  accentColor = TG.accent,
  backIconColor,
  actionIconColor,
  subtitleColor,
  actions = ["more"],
  deviceShadow = "0 36px 90px rgba(0, 0, 0, 0.38)",
}: TelegramPhoneMockupProps) {
  const resolvedBackIconColor = backIconColor ?? accentColor;
  const resolvedActionIconColor = actionIconColor ?? accentColor;
  const resolvedSubtitleColor = subtitleColor ?? accentColor;
  const numericWidth = typeof width === "number" ? width : null;
  // IPhoneMockup native width is 428px
  const iphoneScale = numericWidth ? numericWidth / 428 : BASE_PHONE_WIDTH / 428;
  const resolvedHeight = numericWidth
    ? 868 * iphoneScale
    : BASE_PHONE_HEIGHT;
  const containerOpacity = Math.max(0, Math.min(1, progress));

  const telegramContent = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: TG.headerBg,
        color: TG.text,
        fontFamily: "inherit",
      }}
    >
          <div style={{ background: TG.headerBg, padding: "12px 16px 0", color: "#fff" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              <span>9:41</span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                <div style={{ display: "flex", gap: 2 }}>
                  <div style={{ width: 3, height: 6, borderRadius: 2, background: "rgba(255,255,255,0.8)" }} />
                  <div style={{ width: 3, height: 8, borderRadius: 2, background: "rgba(255,255,255,0.8)" }} />
                  <div style={{ width: 3, height: 10, borderRadius: 2, background: "rgba(255,255,255,0.8)" }} />
                  <div style={{ width: 3, height: 12, borderRadius: 2, background: "rgba(255,255,255,0.4)" }} />
                </div>
                <span style={{ fontSize: 10 }}>5G</span>
                <div
                  style={{
                    display: "flex",
                    height: 11,
                    width: 20,
                    alignItems: "center",
                    borderRadius: 3,
                    border: "1px solid rgba(255,255,255,0.4)",
                    padding: "0 2px",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 7,
                      borderRadius: 2,
                      background: "rgba(255,255,255,0.8)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: TG.headerBg,
              padding: "10px 8px",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                display: "grid",
                placeItems: "center",
                color: resolvedBackIconColor,
                flexShrink: 0,
              }}
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </div>

            <div
              style={{
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
                borderRadius: "999px",
                background: avatarBackground,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {avatarLabel}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <p
                  style={{
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                  }}
                >
                  {title}
                </p>
                {verified ? <VerifiedBadge color={accentColor} /> : null}
              </div>
              <p
                style={{
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 11,
                  color: resolvedSubtitleColor,
                }}
              >
                {subtitle}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                color: resolvedActionIconColor,
              }}
            >
              {actions.map((action) => (
                <div
                  key={action}
                  style={{
                    width: 32,
                    height: 32,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "999px",
                  }}
                >
                  {renderHeaderAction(action, resolvedActionIconColor)}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: alignMessagesToBottom ? "flex-end" : "flex-start",
              padding: "16px 12px",
              overflow: "hidden",
              backgroundColor: TG.chatBg,
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(42,171,238,0.04) 0, transparent 50%), radial-gradient(circle at 80% 70%, rgba(42,171,238,0.03) 0, transparent 40%)",
            }}
          >
            {dayLabel ? (
              <div
                style={{
                  margin: "0 auto 16px",
                  width: "fit-content",
                  borderRadius: 999,
                  background: "rgba(24,37,51,0.9)",
                  padding: "4px 12px",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "rgba(106,179,243,0.7)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                }}
              >
                {dayLabel}
              </div>
            ) : null}

            {messages.map((message, index) => {
              const messageProgress =
                message.progress === undefined
                  ? 1
                  : Math.max(0, Math.min(1, message.progress));

              if (messageProgress <= 0) {
                return null;
              }

              const isRight = message.side === "right";

              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: isRight ? "flex-end" : "flex-start",
                    marginBottom: 12,
                    opacity: messageProgress,
                    transform: `translateY(${(1 - messageProgress) * 20}px) scale(${0.98 + messageProgress * 0.02})`,
                    transformOrigin: isRight ? "bottom right" : "bottom left",
                  }}
                >
                  <div style={{ maxWidth: "83%" }}>
                    <div
                      style={{
                        borderRadius: isRight ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
                        background: message.bubbleColor ?? (isRight ? TG.bubbleOut : TG.bubbleIn),
                        padding: "10px 14px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                      }}
                    >
                      {message.sender ? (
                        <div
                          style={{
                            marginBottom: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: message.senderColor ?? TG.accentBlue,
                          }}
                        >
                          {message.sender}
                        </div>
                      ) : null}

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1fr) auto",
                          alignItems: "end",
                          columnGap: 8,
                        }}
                      >
                        <div
                          style={{
                            minWidth: 0,
                            fontSize: 13,
                            lineHeight: 1.45,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            color: TG.text,
                          }}
                        >
                          {message.content}
                        </div>

                        <div
                          style={{
                            fontSize: 11,
                            lineHeight: 1,
                            color: TG.textMuted,
                            alignSelf: "end",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {message.time}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {showComposer ? (
            <div style={{ background: TG.headerBg, padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    display: "grid",
                    placeItems: "center",
                    color: "rgba(106,179,243,0.6)",
                  }}
                >
                  <Smile size={20} strokeWidth={2} />
                </div>
                <div
                  style={{
                    flex: 1,
                    minHeight: 40,
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 999,
                    background: TG.inputBg,
                    padding: "0 12px",
                    color: TG.inputText,
                    boxSizing: "border-box",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{composerPlaceholder}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: "rgba(106,179,243,0.6)",
                  }}
                >
                  <div style={{ width: 32, height: 32, display: "grid", placeItems: "center" }}>
                    <Paperclip size={18} strokeWidth={2} />
                  </div>
                  <div style={{ width: 32, height: 32, display: "grid", placeItems: "center" }}>
                    <Mic size={18} strokeWidth={2} />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
    </div>
  );

  return (
    <div
      style={{
        width: numericWidth ?? width,
        maxWidth,
        height: resolvedHeight,
        opacity: containerOpacity,
        transform: `translateY(${(1 - containerOpacity) * 44}px) scale(${0.97 + containerOpacity * 0.03})`,
        flexShrink: 0,
        position: "relative",
        margin: "0 auto",
        ...style,
      }}
    >
      <IPhoneMockup scale={iphoneScale} variant="black">
        {telegramContent}
      </IPhoneMockup>
    </div>
  );
}
