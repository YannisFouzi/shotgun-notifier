import type { CSSProperties } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_BODY, FONT_DISPLAY } from "../constants";
import { COPY } from "../copy";
import { getEditorLineProgress } from "../editor-timing";
import { EditorPanel } from "../mockups/EditorPanel";
import { IPhoneLockScreenCropped } from "../mockups/IPhoneLockScreenMockup";
import { FadeUp, SceneBg, SceneFrame } from "../ui";

const FREQ_OPTIONS = ["1 min", "5 min", "10 min", "1h", "5h", "12h", "1x/jour", "1x/sem"];
const SWITCH_AT = 275; // frame where part 1 exits and part 2 enters

function FrequencySelector({ frame, fps }: { frame: number; fps: number }) {
  // 0 -> "1 min", 1 -> "5 min", 6 -> "1x/jour"
  const select1 = spring({
    frame: frame - (SWITCH_AT + 40),
    fps,
    config: { mass: 0.6, damping: 16, stiffness: 100 },
  });
  const select2 = spring({
    frame: frame - (SWITCH_AT + 80),
    fps,
    config: { mass: 0.6, damping: 16, stiffness: 100 },
  });
  const selectedIndex = select2 > 0.5 ? 6 : select1 > 0.5 ? 1 : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, auto)", gap: 18, justifyContent: "center" }}>
      {FREQ_OPTIONS.map((label, i) => {
        const isSelected = i === selectedIndex;
        return (
          <div
            key={label}
            style={{
              padding: "18px 36px",
              borderRadius: 14,
              fontFamily: FONT_BODY,
              fontSize: 38,
              fontWeight: 500,
              color: isSelected ? COLORS.text : COLORS.textSoft,
              background: isSelected
                ? "rgba(255,255,255,0.1)"
                : "transparent",
              border: `1px solid ${isSelected ? COLORS.strokeStrong : COLORS.stroke}`,
              textAlign: "center",
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}

interface EditorProps {
  showBackground?: boolean;
  showContent?: boolean;
  contentStyle?: CSSProperties;
}

function buildEditorPreviewText(frame: number, fps: number): string {
  const parts: string[] = [];
  for (const row of COPY.editor.templateRows) {
    const visibleChips: string[] = [];
    for (const line of row) {
      const chipProgress = getEditorLineProgress(frame, fps, line.delay);
      if (chipProgress <= 0.001) continue;
      visibleChips.push(
        line.type === "text" ? line.text : COPY.editor.previewContext[line.key]
      );
    }
    if (visibleChips.length > 0) {
      parts.push(visibleChips.join(""));
    }
  }
  return parts.join("\n");
}

export function Editor({
  showBackground = true,
  showContent = true,
  contentStyle,
}: EditorProps = {}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const previewText = buildEditorPreviewText(frame, fps);
  const previewProgress = getEditorLineProgress(
    frame,
    fps,
    COPY.editor.templateRows[0][0].delay
  );
  const phoneProgress = getEditorLineProgress(frame, fps, 6);

  // Part 1 exit animation
  const exitProgress = spring({
    frame: frame - SWITCH_AT,
    fps,
    config: { mass: 0.8, damping: 16, stiffness: 120 },
  });
  const part1Opacity = interpolate(exitProgress, [0, 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const part1TranslateY = interpolate(exitProgress, [0, 1], [0, -40], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Part 2 enter animation
  const enterProgress = spring({
    frame: frame - (SWITCH_AT + 10),
    fps,
    config: { mass: 0.7, damping: 14, stiffness: 120 },
  });
  const part2Opacity = interpolate(enterProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const part2TranslateY = interpolate(enterProgress, [0, 1], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const content = showContent ? (
      <SceneFrame style={contentStyle}>
        {/* Part 1: Template editor + phone */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
            gap: 42,
            padding: "0 44px",
            boxSizing: "border-box",
            opacity: part1Opacity,
            transform: `translateY(${part1TranslateY}px)`,
            pointerEvents: exitProgress > 0.5 ? "none" : "auto",
          }}
        >
          <FadeUp y={14}>
            <p
              style={{
                margin: 0,
                fontFamily: FONT_DISPLAY,
                fontSize: 88,
                fontWeight: 800,
                letterSpacing: "-0.05em",
                lineHeight: 0.98,
                color: COLORS.text,
                textAlign: "center",
              }}
            >
              {COPY.editor.label}
            </p>
          </FadeUp>

          <FadeUp
            delay={6}
            style={{
              width: "100%",
              maxWidth: 1000,
              flexShrink: 0,
            }}
          >
            <EditorPanel />
          </FadeUp>

          <IPhoneLockScreenCropped
            message={previewText}
            phoneProgress={phoneProgress}
            progress={previewProgress}
          />

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
              textAlign: "center",
            }}
          >
            shotnotif.com
          </span>
        </div>

        {/* Part 2: Frequency selector */}
        {enterProgress > 0.01 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 42,
              padding: "0 44px",
              boxSizing: "border-box",
              opacity: part2Opacity,
              transform: `translateY(${part2TranslateY}px)`,
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: FONT_DISPLAY,
                fontSize: 88,
                fontWeight: 800,
                letterSpacing: "-0.05em",
                lineHeight: 0.98,
                color: COLORS.text,
                textAlign: "center",
              }}
            >
              Choisis ta fréquence{"\n"}de vérification
            </p>

            <FrequencySelector frame={frame} fps={fps} />

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
                textAlign: "center",
              }}
            >
              shotnotif.com
            </span>
          </div>
        )}
      </SceneFrame>
  ) : null;

  if (!showBackground) {
    return content;
  }

  return <SceneBg variant="emerald">{content}</SceneBg>;
}
