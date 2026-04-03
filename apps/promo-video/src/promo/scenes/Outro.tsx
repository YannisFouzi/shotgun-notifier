import type { CSSProperties } from "react";
import {
  formatTelegramDayLabel,
  TelegramPhoneMockup,
} from "@shotgun-notifier/shared";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_BODY } from "../constants";
import { COPY } from "../copy";
import { BrandTitle, FadeUp, SceneBg, SceneFrame } from "../ui";

interface OutroProps {
  showBackground?: boolean;
  showContent?: boolean;
  contentStyle?: CSSProperties;
}

export function Outro({
  showBackground = true,
  showContent = true,
  contentStyle,
}: OutroProps = {}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dayLabel = formatTelegramDayLabel("fr");
  const phoneWidth = 700;
  const phoneAspectRatio = 2.08;
  const phoneVisibleHeight = phoneWidth * phoneAspectRatio;
  const removePhoneAt = 75;
  const hidePhoneProgress = spring({
    frame: frame - removePhoneAt,
    fps,
    config: { mass: 0.85, damping: 16, stiffness: 120 },
  });
  const phoneWrapperHeight = interpolate(
    hidePhoneProgress,
    [0, 1],
    [phoneVisibleHeight, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const phoneOpacity = interpolate(hidePhoneProgress, [0, 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phoneScale = interpolate(hidePhoneProgress, [0, 1], [1, 0.94], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const groupTranslateY = interpolate(hidePhoneProgress, [0, 1], [-34, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const groupGap = interpolate(hidePhoneProgress, [0, 1], [28, 12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const content = showContent ? (
      <SceneFrame style={contentStyle}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: groupGap,
            transform: `translateY(${groupTranslateY}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              textAlign: "center",
            }}
          >
            <FadeUp>
              <BrandTitle size={144} />
            </FadeUp>

            <FadeUp delay={6}>
              <span
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 56,
                  fontWeight: 800,
                  color: COLORS.text,
                  letterSpacing: "0.01em",
                }}
              >
                {COPY.outro.url}
              </span>
            </FadeUp>

            <FadeUp delay={8}>
              <span
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 24,
                  fontWeight: 600,
                  color: COLORS.textMuted,
                  letterSpacing: "0.01em",
                }}
              >
                Directement sur Telegram
              </span>
            </FadeUp>
          </div>

          <div
            style={{
              height: phoneWrapperHeight,
              overflow: "hidden",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                opacity: phoneOpacity,
                transform: `scale(${phoneScale})`,
                transformOrigin: "center top",
              }}
            >
              <FadeUp delay={10}>
                <TelegramPhoneMockup
                  width={phoneWidth}
                  maxWidth={phoneWidth}
                  title="Orga Events"
                  subtitle="3 membres"
                  avatarLabel="OE"
                  avatarBackground="#3e546a"
                  dayLabel={dayLabel}
                  composerPlaceholder="Message"
                  alignMessagesToBottom
                  messages={[
                    {
                      content: "On en est ou des ventes ?",
                      time: "12:57",
                      sender: "Lucas",
                      senderColor: "#e67e22",
                    },
                    {
                      content: "ShotNotif va nous dire ca",
                      time: "12:57",
                      side: "right",
                    },
                    {
                      content:
                        "KODZ X GUETTAPEN X MERCI LILLE\n1 mai 2026 - 21:00\n1 billet vendu : 57\nVAGUE 2 : 4/200",
                      time: "13:05",
                      sender: "ShotNotif",
                      senderColor: "#2AABEE",
                    },
                  ]}
                />
              </FadeUp>
            </div>
          </div>
        </div>
      </SceneFrame>
  ) : null;

  if (!showBackground) {
    return content;
  }

  return <SceneBg variant="telegram">{content}</SceneBg>;
}
