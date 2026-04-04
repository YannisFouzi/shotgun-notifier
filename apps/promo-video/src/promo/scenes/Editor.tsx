import type { CSSProperties } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_DISPLAY } from "../constants";
import { COPY } from "../copy";
import { getEditorLineProgress } from "../editor-timing";
import { EditorPanel } from "../mockups/EditorPanel";
import { IPhoneLockScreenCropped } from "../mockups/IPhoneLockScreenMockup";
import { FadeUp, SceneBg, SceneFrame } from "../ui";


interface EditorProps {
  showBackground?: boolean;
  showContent?: boolean;
  contentStyle?: CSSProperties;
}

function buildEditorPreviewText(frame: number, fps: number): string {
  const parts: string[] = [];
  for (const row of COPY.editor.templateRows) {
    const rowProgress = Math.max(
      ...row.map((line) => getEditorLineProgress(frame, fps, line.delay))
    );
    if (rowProgress <= 0.001) continue;
    const rowText = row
      .map((line) =>
        line.type === "text" ? line.text : COPY.editor.previewContext[line.key]
      )
      .join("");
    parts.push(rowText);
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

  const content = showContent ? (
      <SceneFrame style={contentStyle}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
            gap: 42,
            padding: "0 44px",
            boxSizing: "border-box",
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
        </div>
      </SceneFrame>
  ) : null;

  if (!showBackground) {
    return content;
  }

  return <SceneBg variant="emerald">{content}</SceneBg>;
}
