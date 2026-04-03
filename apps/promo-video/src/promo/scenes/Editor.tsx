import type { CSSProperties } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_DISPLAY } from "../constants";
import { COPY } from "../copy";
import { getEditorLineProgress } from "../editor-timing";
import { EditorPanel } from "../mockups/EditorPanel";
import { TelegramMessageMockup } from "../mockups/TelegramMessageMockup";
import { FadeUp, SceneBg, SceneFrame } from "../ui";

const PREVIEW_MESSAGE_TIME = "14:33";

interface EditorProps {
  showBackground?: boolean;
  showContent?: boolean;
  contentStyle?: CSSProperties;
}

function buildEditorPreviewMessage(frame: number, fps: number) {
  const rows = COPY.editor.templateRows
    .map((row, rowIndex) => {
      const rowProgress = Math.max(
        ...row.map((line) => getEditorLineProgress(frame, fps, line.delay))
      );

      if (rowProgress <= 0.001) {
        return null;
      }

      const segments = row.map((line, itemIndex) => {
        const progress = getEditorLineProgress(frame, fps, line.delay);
        const content =
          line.type === "text" ? line.text : COPY.editor.previewContext[line.key];

        return (
          <span
            key={`${rowIndex}-${itemIndex}`}
            style={{
              opacity: progress,
              display: "inline",
              whiteSpace: line.type === "text" ? "pre-wrap" : "normal",
            }}
          >
            {content}
          </span>
        );
      });

      return (
        <div
          key={`row-${rowIndex}`}
          style={{
            marginBottom: rowIndex === COPY.editor.templateRows.length - 1 ? 0 : 2,
            lineHeight: 1.28,
          }}
        >
          {segments}
        </div>
      );
    })
    .filter((row): row is JSX.Element => row !== null);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        lineHeight: 1.22,
      }}
    >
      {rows}
    </div>
  );
}

export function Editor({
  showBackground = true,
  showContent = true,
  contentStyle,
}: EditorProps = {}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const previewMsg = buildEditorPreviewMessage(frame, fps);
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

          <TelegramMessageMockup
            message={previewMsg}
            time={PREVIEW_MESSAGE_TIME}
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
