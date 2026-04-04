import type { CSSProperties } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../constants";
import { COPY } from "../copy";
import type { LockScreenMessage } from "../mockups/IPhoneLockScreenMockup";
import { IPhoneLockScreenMockup } from "../mockups/IPhoneLockScreenMockup";
import { FadeUp, SceneBg, SceneFrame } from "../ui";

const FAST_MESSAGES: LockScreenMessage[] = COPY.demo.messages.map((msg, i) => ({
  ...msg,
  delay: i * 16,
}));

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

  const phoneWidth = 700;
  const deviceScale = phoneWidth / 428;
  const phoneVisibleHeight = 868 * deviceScale;

  const removePhoneAt = 80;
  const p = spring({
    frame: frame - removePhoneAt,
    fps,
    config: { mass: 0.85, damping: 16, stiffness: 120 },
  });

  const phoneWrapperHeight = interpolate(p, [0, 1], [phoneVisibleHeight, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const phoneOpacity = interpolate(p, [0, 1], [1, 0], {
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
            gap: 0,
          }}
        >
          <FadeUp>
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 52,
                fontWeight: 700,
                color: COLORS.text,
                letterSpacing: "0.01em",
              }}
            >
              Configurable en quelques secondes
            </span>
          </FadeUp>

          <FadeUp delay={6}>
            <span
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 110,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                background: `linear-gradient(135deg, ${COLORS.text} 0%, ${COLORS.telegram} 100%)`,
                color: "transparent",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {COPY.outro.url}
            </span>
          </FadeUp>

          {/* Phone — collapses height + fades, texts naturally center via flex */}
          <div
            style={{
              height: phoneWrapperHeight,
              overflow: "hidden",
              marginTop: phoneWrapperHeight > 1 ? 24 : 0,
            }}
          >
            <div style={{ opacity: phoneOpacity }}>
              <IPhoneLockScreenMockup
                messages={FAST_MESSAGES}
                width={700}
                delay={10}
                time="14:30"
                date="Samedi 5 avril"
              />
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
