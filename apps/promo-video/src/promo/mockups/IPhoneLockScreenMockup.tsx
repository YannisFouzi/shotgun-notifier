/**
 * iPhone 14 Pro with iOS lock screen + animated Telegram push notifications.
 * Notifications stack from top: each new one slides in at the top and pushes
 * older ones down, like real iOS.
 */
import type { ReactNode } from "react";
import {
  IPhoneMockup,
  TelegramNotifIcon,
  type IOSNotification,
} from "@shotgun-notifier/shared";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface LockScreenMessage {
  /** Notification body text */
  text: string;
  /** Timestamp label ("now", "2 min", etc.) */
  time?: string;
  /** Delay in frames before this notification appears */
  delay: number;
}

interface IPhoneLockScreenMockupProps {
  messages: LockScreenMessage[];
  width?: number;
  delay?: number;
  time?: string;
  date?: string;
}

const TELEGRAM_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><linearGradient id="tg" x1="120" y1="0" x2="120" y2="240" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2AABEE"/><stop offset="1" stop-color="#229ED9"/></linearGradient></defs><circle cx="120" cy="120" r="120" fill="url(#tg)"/><path d="M98 175c-3.9 0-3.2-1.5-4.6-5.2L82 134.8 168 84" fill="#C8DAEA"/><path d="M98 175c3 0 4.3-1.4 6-3l16-15.6-20-12" fill="#A9C9DD"/><path d="M100 144.4l48.4 35.7c5.5 3 9.5 1.5 10.9-5.1L179 78.3c2-8-3-11.6-8.3-9.2l-105 40.5c-7.8 3.1-7.7 7.5-1.4 9.5l27 8.4 62.4-39.3c2.9-1.8 5.6-.8 3.4 1.1" fill="#FFF"/></svg>`;

// Estimated notification card height for height animation (px at native 390 width)
const NOTIF_CARD_HEIGHT = 90;
const NOTIF_GAP = 10;

export function IPhoneLockScreenMockup({
  messages,
  width = 700,
  delay = 0,
  time = "14:30",
  date = "Lundi 1 mai",
}: IPhoneLockScreenMockupProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneProgress = spring({
    frame: frame - delay,
    fps,
    config: { mass: 0.8, damping: 16, stiffness: 110 },
  });

  const phoneScale = interpolate(phoneProgress, [0, 1], [0.92, 1]);
  const phoneOpacity = interpolate(phoneProgress, [0, 1], [0, 1]);
  const scale = width / 428;

  // Compute progress for each message (ordered by appearance: oldest first)
  const progresses = messages.map((msg) =>
    spring({
      frame: frame - (delay + msg.delay),
      fps,
      config: { mass: 0.6, damping: 14, stiffness: 120 },
    })
  );

  // Render in reverse: newest (last to appear) at top of flex column
  const reversed = [...messages].map((_, i) => i).reverse();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: phoneOpacity,
        transform: `scale(${phoneScale})`,
        transformOrigin: "center top",
      }}
    >
      <IPhoneMockup scale={scale} variant="black">
        {/* Lock screen content — native 390×830 */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(160deg, #1a0533 0%, #0a1628 40%, #0d1f3c 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
            color: "#fff",
            overflow: "hidden",
          }}
        >
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

          {/* Notifications — newest at top, each animates height from 0 */}
          <div
            style={{
              width: "100%",
              padding: "0 14px",
              marginTop: 32,
              display: "flex",
              flexDirection: "column",
              gap: 0,
              boxSizing: "border-box",
            }}
          >
            {reversed.map((origIndex) => {
              const msg = messages[origIndex];
              const p = progresses[origIndex];
              // Animate wrapper height: 0 → card height + gap
              const wrapperHeight = interpolate(
                p,
                [0, 1],
                [0, NOTIF_CARD_HEIGHT + NOTIF_GAP]
              );

              return (
                <div
                  key={origIndex}
                  style={{
                    height: wrapperHeight,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 14,
                      background: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(40px)",
                      WebkitBackdropFilter: "blur(40px)",
                      opacity: p,
                      transform: `translateY(${interpolate(p, [0, 1], [-15, 0])}px)`,
                      marginBottom: NOTIF_GAP,
                    }}
                  >
                    {/* Telegram icon */}
                    <div
                      style={{
                        flexShrink: 0,
                        marginTop: 1,
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        overflow: "hidden",
                      }}
                      dangerouslySetInnerHTML={{ __html: TELEGRAM_ICON_SVG }}
                    />
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
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
                          }}
                        >
                          ShotNotif
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            opacity: 0.5,
                            flexShrink: 0,
                            fontWeight: 300,
                          }}
                        >
                          {msg.time || "now"}
                        </span>
                      </div>
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
                        {msg.text}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
      </IPhoneMockup>
    </div>
  );
}

/**
 * Cropped version showing only the bottom of the phone (notifications area).
 * Used in the Editor scene.
 */
interface IPhoneLockScreenCroppedProps {
  message: ReactNode;
  delay?: number;
  phoneProgress?: number;
  progress?: number;
}

export function IPhoneLockScreenCropped({
  message,
  delay = 0,
  phoneProgress,
  progress,
}: IPhoneLockScreenCroppedProps) {
  const phoneWidth = 820;
  const visibleHeight = 720;
  const cropWidth = 860;
  const fadeHeight = 164;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const resolvedPhoneProgress =
    phoneProgress ??
    spring({
      frame: frame - delay,
      fps,
      config: { mass: 0.7, damping: 14, stiffness: 120 },
    });

  const resolvedProgress =
    progress ??
    spring({
      frame: frame - delay,
      fps,
      config: { mass: 0.7, damping: 14, stiffness: 120 },
    });

  const scale = phoneWidth / 428;
  const bodyText = typeof message === "string" ? message : "";

  const cropMask = `linear-gradient(
    180deg,
    rgba(0,0,0,1) 0px,
    rgba(0,0,0,1) ${visibleHeight - fadeHeight}px,
    rgba(0,0,0,0.82) ${visibleHeight - Math.round(fadeHeight * 0.24)}px,
    rgba(0,0,0,0.08) ${visibleHeight - 32}px,
    rgba(0,0,0,0) ${visibleHeight}px
  )`;

  const notifications: IOSNotification[] = [
    {
      icon: <TelegramNotifIcon size={28} />,
      appName: "Telegram",
      title: "ShotNotif",
      body: bodyText,
      time: "now",
      opacity: resolvedProgress,
      translateY: interpolate(resolvedProgress, [0, 1], [-20, 0]),
    },
  ];

  // Import IOSLockScreen lazily to avoid circular — inline the lock screen here
  return (
    <div
      style={{
        width: "100%",
        maxWidth: cropWidth,
        minHeight: visibleHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: cropWidth,
          height: visibleHeight,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          overflow: "hidden",
          WebkitMaskImage: cropMask,
          maskImage: cropMask,
          opacity: resolvedPhoneProgress,
        }}
      >
        <IPhoneMockup scale={scale} variant="black">
          <_StaticLockScreen
            time="14:33"
            date="Samedi 5 avril"
            bodyText={bodyText}
            progress={resolvedProgress}
          />
        </IPhoneMockup>
      </div>
    </div>
  );
}

function _StaticLockScreen({
  time,
  date,
  bodyText,
  progress,
}: {
  time: string;
  date: string;
  bodyText: string;
  progress: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(160deg, #1a0533 0%, #0a1628 40%, #0d1f3c 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
        color: "#fff",
        overflow: "hidden",
      }}
    >
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

      <div
        style={{
          width: "100%",
          padding: "0 14px",
          marginTop: 32,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(40px)",
            opacity: progress,
            transform: `translateY(${interpolate(progress, [0, 1], [-15, 0])}px)`,
          }}
        >
          <div
            style={{
              flexShrink: 0,
              marginTop: 1,
              width: 28,
              height: 28,
              borderRadius: 6,
              overflow: "hidden",
            }}
            dangerouslySetInnerHTML={{ __html: TELEGRAM_ICON_SVG }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.25 }}>
                ShotNotif
              </span>
              <span style={{ fontSize: 12, opacity: 0.5, fontWeight: 300 }}>
                now
              </span>
            </div>
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
              {bodyText}
            </div>
          </div>
        </div>
      </div>

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
