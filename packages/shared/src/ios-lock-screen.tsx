import type { CSSProperties, ReactNode } from "react";

// ---------------------------------------------------------------------------
// iOS-style lock screen with push notifications — pure inline styles.
// Designed for a 390×830 native screen (iPhone 14 Pro).
// The IPhoneMockup component handles scaling via CSS transform.
// ---------------------------------------------------------------------------

export interface IOSNotification {
  /** App icon (React node — img, svg, emoji, etc.) */
  icon: ReactNode;
  /** App name displayed in the notification */
  appName: string;
  /** Notification title */
  title: string;
  /** Notification body text */
  body: string;
  /** Timestamp label ("now", "2m ago", etc.) */
  time: string;
  /** Optional opacity for animation (0–1, default 1) */
  opacity?: number;
  /** Optional translateY offset for animation (default 0) */
  translateY?: number;
}

export interface IOSLockScreenProps {
  /** List of notifications to display */
  notifications: IOSNotification[];
  /** Time displayed on lock screen (e.g. "9:41") */
  time?: string;
  /** Date displayed below time (e.g. "Monday, June 7") */
  date?: string;
  /** Background — CSS gradient or solid color */
  background?: string;
  /** Extra styles on the root container */
  style?: CSSProperties;
}

const TELEGRAM_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><linearGradient id="tg" x1="120" y1="0" x2="120" y2="240" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2AABEE"/><stop offset="1" stop-color="#229ED9"/></linearGradient></defs><circle cx="120" cy="120" r="120" fill="url(#tg)"/><path d="M98 175c-3.9 0-3.2-1.5-4.6-5.2L82 134.8 168 84" fill="#C8DAEA"/><path d="M98 175c3 0 4.3-1.4 6-3l16-15.6-20-12" fill="#A9C9DD"/><path d="M100 144.4l48.4 35.7c5.5 3 9.5 1.5 10.9-5.1L179 78.3c2-8-3-11.6-8.3-9.2l-105 40.5c-7.8 3.1-7.7 7.5-1.4 9.5l27 8.4 62.4-39.3c2.9-1.8 5.6-.8 3.4 1.1" fill="#FFF"/></svg>`;

/** Inline-able Telegram icon (28×28 rounded square) */
export function TelegramNotifIcon({ size = 28 }: { size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        overflow: "hidden",
        flexShrink: 0,
        display: "block",
      }}
      dangerouslySetInnerHTML={{ __html: TELEGRAM_ICON_SVG }}
    />
  );
}

export function IOSLockScreen({
  notifications,
  time = "9:41",
  date = "Monday, June 7",
  background = "linear-gradient(160deg, #1a0533 0%, #0a1628 40%, #0d1f3c 100%)",
  style,
}: IOSLockScreenProps) {
  const rootStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    background,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
    color: "#fff",
    overflow: "hidden",
    ...style,
  };

  return (
    <div style={rootStyle}>
      {/* Time */}
      <div
        style={{
          fontSize: 72,
          fontWeight: 300,
          letterSpacing: -1,
          lineHeight: 1,
          marginTop: 72,
          textAlign: "center",
        }}
      >
        {time}
      </div>

      {/* Date */}
      <div
        style={{
          fontSize: 16,
          fontWeight: 400,
          opacity: 0.85,
          marginTop: 4,
          textAlign: "center",
        }}
      >
        {date}
      </div>

      {/* Notifications */}
      <div
        style={{
          width: "100%",
          padding: "0 14px",
          marginTop: 32,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          boxSizing: "border-box",
        }}
      >
        {notifications.map((notif, i) => (
          <IOSNotificationCard key={i} notification={notif} />
        ))}
      </div>

      {/* Home indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          width: 134,
          height: 5,
          borderRadius: 3,
          background: "rgba(255,255,255,0.35)",
        }}
      />
    </div>
  );
}

function IOSNotificationCard({
  notification,
}: {
  notification: IOSNotification;
}) {
  const { icon, title, body, time, opacity = 1, translateY = 0 } =
    notification;

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        opacity,
        transform: translateY ? `translateY(${translateY}px)` : undefined,
        transition: "opacity 0.3s, transform 0.3s",
      }}
    >
      {/* App icon */}
      <div style={{ flexShrink: 0, marginTop: 1 }}>
        {icon || <TelegramNotifIcon size={28} />}
      </div>
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 300,
              lineHeight: 1.25,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: 12,
              opacity: 0.5,
              flexShrink: 0,
              fontWeight: 300,
            }}
          >
            {time}
          </span>
        </div>
        {/* Body */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.3,
            opacity: 0.8,
            marginTop: 1,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
}
