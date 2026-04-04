import type { CSSProperties } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, COMPOSITION, FONT_DISPLAY } from "../constants";
import { COPY } from "../copy";
import { IPhoneLockScreenMockup } from "../mockups/IPhoneLockScreenMockup";
import { FadeUp, SceneBg, SceneFrame } from "../ui";

interface DemoProps {
  showBackground?: boolean;
  showContent?: boolean;
  contentStyle?: CSSProperties;
}

export function Demo({
  showBackground = true,
  showContent = true,
  contentStyle,
}: DemoProps = {}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleBaseFontSize = 82;
  const titleCompactFontSize = 54;
  const line2Delay = fps;
  const line3Delay = fps * 2;
  const titleHoldFrames = line3Delay + fps * 2;
  const titleMoveProgress = spring({
    frame: frame - titleHoldFrames,
    fps,
    config: { mass: 0.9, damping: 16, stiffness: 105 },
  });
  const titleFontSize = interpolate(titleMoveProgress, [0, 1], [titleBaseFontSize, titleCompactFontSize], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleLineHeight = interpolate(titleMoveProgress, [0, 1], [1.08, 1.02], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line2MarginTop = interpolate(titleMoveProgress, [0, 1], [52, 22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line3MarginTop = interpolate(titleMoveProgress, [0, 1], [64, 28], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const centeredTitleOffset = Math.round(COMPOSITION.height * 0.4);
  const titleTranslateY = interpolate(titleMoveProgress, [0, 1], [centeredTitleOffset, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleScale = interpolate(titleMoveProgress, [0, 1], [1, 0.96], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const content = showContent ? (
      <SceneFrame style={contentStyle}>
        {/* Opening copy above phone */}
        <div
          style={{
            textAlign: "center",
            width: "100%",
            maxWidth: 1000,
            margin: "0 auto 16px",
            marginBottom: 16,
            transform: `translateY(${titleTranslateY}px) scale(${titleScale})`,
            transformOrigin: "center top",
            boxSizing: "border-box",
          }}
        >
          <FadeUp y={14}>
            <p
              style={{
                margin: 0,
                fontFamily: FONT_DISPLAY,
                fontSize: titleFontSize,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: titleLineHeight,
                whiteSpace: "pre-line",
                color: COLORS.text,
              }}
            >
              {COPY.demo.line1}
            </p>
          </FadeUp>
          <FadeUp y={14} delay={line2Delay}>
            <p
              style={{
                margin: `${line2MarginTop}px 0 0`,
                fontFamily: FONT_DISPLAY,
                fontSize: titleFontSize,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: titleLineHeight,
                whiteSpace: "pre-line",
                color: COLORS.text,
              }}
            >
              {COPY.demo.line2}
            </p>
          </FadeUp>
          <FadeUp y={14} delay={line3Delay}>
            <p
              style={{
                margin: `${line3MarginTop}px 0 0`,
                fontFamily: FONT_DISPLAY,
                fontSize: titleFontSize,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: titleLineHeight,
                whiteSpace: "pre-line",
                color: COLORS.telegram,
              }}
            >
              {COPY.demo.line3}
            </p>
          </FadeUp>
        </div>

        {/* Phone mockup */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
          }}
        >
          <IPhoneLockScreenMockup
            messages={COPY.demo.messages}
            width={700}
            delay={titleHoldFrames + 4}
            time="14:30"
            date="Samedi 5 avril"
          />
        </div>
      </SceneFrame>
  ) : null;

  if (!showBackground) {
    return content;
  }

  return <SceneBg variant="telegram">{content}</SceneBg>;
}
