import type { CSSProperties } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_BODY } from "../constants";
import { COPY } from "../copy";
import type { LockScreenMessage } from "../mockups/IPhoneLockScreenMockup";
import { IPhoneLockScreenMockup } from "../mockups/IPhoneLockScreenMockup";
import { BrandTitle, FadeUp, SceneBg, SceneFrame } from "../ui";

/** Same messages as Demo but with much shorter delays */
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

  // Phone disappears at frame 80 (≈ 22:10 in the video)
  const removePhoneAt = 80;
  const hidePhoneProgress = spring({
    frame: frame - removePhoneAt,
    fps,
    config: { mass: 0.85, damping: 16, stiffness: 120 },
  });
  const phoneWrapperHeight = interpolate(
    hidePhoneProgress,
    [0, 1],
    [phoneVisibleHeight, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
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
