"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  IPhoneMockup,
  IOSLockScreen,
  TelegramNotifIcon,
  type IOSNotification,
} from "@shotgun-notifier/shared";

interface TelegramPreviewProps {
  message: string;
  mode?: "bot" | "group";
  animated?: boolean;
  messages?: string[];
}

const TIMES = ["3 min", "2 min", "now", "now"];

// Non-breaking space: preserves line height while the clock is not yet
// available on the first client render (see `useLocalizedClock`).
const CLOCK_PLACEHOLDER = "\u00A0";

function timeLocaleTag(lng: string) {
  return lng.startsWith("fr") ? "fr-FR" : "en-GB";
}

/**
 * Returns the current `Date` on the client, or `null` during SSR and the
 * first client render (before mount). Ticks every minute.
 *
 * Returning `null` pre-mount is what avoids the hydration mismatch: the
 * server has no notion of the user's wall clock / timezone, so any
 * `new Date()` call during render would diverge from the client.
 */
function useClock(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const intervalId = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(intervalId);
  }, []);

  return now;
}

function useLocalizedClock(localeTag: string): { time: string; date: string } {
  const now = useClock();

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(localeTag, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [localeTag]
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(localeTag, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [localeTag]
  );

  return {
    time: now ? timeFormatter.format(now) : CLOCK_PLACEHOLDER,
    date: now ? dateFormatter.format(now) : CLOCK_PLACEHOLDER,
  };
}

export function TelegramPreview({
  message,
  mode = "bot",
  animated = false,
  messages = [],
}: TelegramPreviewProps) {
  const { t, i18n } = useTranslation();
  const localeTag = timeLocaleTag(
    i18n.resolvedLanguage || i18n.language || "en"
  );
  const { time, date } = useLocalizedClock(localeTag);
  const renderedMessage = message || t("telegramPreview.emptyMessage");
  const isGroup = mode === "group";

  const title = isGroup
    ? t("telegramPreview.groupTitle")
    : t("telegramPreview.botTitle");

  if (animated && messages.length > 0) {
    return (
      <AnimatedLockScreen
        messages={messages}
        title={title}
        time={time}
        date={date}
      />
    );
  }

  const notifications: IOSNotification[] = [
    {
      icon: <TelegramNotifIcon size={28} />,
      appName: "Telegram",
      title,
      body: renderedMessage,
      time: t("telegramPreview.now", { defaultValue: "now" }),
    },
  ];

  return (
    <IPhoneMockup scale={0.85} variant="black">
      <IOSLockScreen
        time={time}
        date={date}
        notifications={notifications}
      />
    </IPhoneMockup>
  );
}

/** Notification card style matching IOSLockScreen */
function NotifCard({
  title,
  body,
  time,
}: {
  title: string;
  body: string;
  time: string;
}) {
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
      }}
    >
      <div style={{ flexShrink: 0, marginTop: 1 }}>
        <TelegramNotifIcon size={28} />
      </div>
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
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: "#fff",
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
              color: "#fff",
            }}
          >
            {time}
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
            color: "#fff",
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
}

function AnimatedLockScreen({
  messages,
  title,
  time,
  date,
}: {
  messages: string[];
  title: string;
  time: string;
  date: string;
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [cycle, setCycle] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setVisibleCount(0);

    messages.forEach((_, i) => {
      const timer = setTimeout(() => setVisibleCount(i + 1), 1200 + i * 2500);
      timersRef.current.push(timer);
    });

    const resetTimer = setTimeout(() => {
      setCycle((c) => c + 1);
    }, 1200 + messages.length * 2500 + 3000);
    timersRef.current.push(resetTimer);

    return () => timersRef.current.forEach(clearTimeout);
  }, [messages.length, cycle]);

  // Build visible notifications reversed (newest on top)
  const visible = messages.slice(0, visibleCount);

  return (
    <IPhoneMockup scale={0.85} variant="black">
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

        {/* Notifications with stacking animation */}
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
          {[...visible].reverse().map((msg, reversedIndex) => {
            const originalIndex = visible.length - 1 - reversedIndex;
            const isNewest = originalIndex === visibleCount - 1;
            return (
              <div
                key={`${cycle}-${originalIndex}`}
                style={{
                  overflow: "hidden",
                  transition: "max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out",
                  maxHeight: isNewest ? 200 : 200,
                  opacity: 1,
                  marginBottom: 10,
                }}
                ref={(el) => {
                  // Trigger animation on mount
                  if (el && isNewest) {
                    el.style.maxHeight = "0px";
                    el.style.opacity = "0";
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        el.style.maxHeight = "200px";
                        el.style.opacity = "1";
                      });
                    });
                  }
                }}
              >
                <div
                  style={{
                    transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: "translateY(0px)",
                  }}
                  ref={(el) => {
                    if (el && isNewest) {
                      el.style.transform = "translateY(-20px)";
                      requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                          el.style.transform = "translateY(0px)";
                        });
                      });
                    }
                  }}
                >
                  <NotifCard
                    title={title}
                    body={msg}
                    time={TIMES[originalIndex] || "now"}
                  />
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
  );
}
