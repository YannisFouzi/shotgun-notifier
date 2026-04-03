import type { CSSProperties } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_BODY, SECTION_COLORS } from "../constants";
import { COPY } from "../copy";
import { getEditorLineProgress } from "../editor-timing";

type Section = "event" | "summary" | "deal" | "context";

function Chip({
  label,
  section,
  inline,
  glow,
  style,
}: {
  label: string;
  section: Section;
  inline?: boolean;
  glow?: number;
  style?: CSSProperties;
}) {
  const c = SECTION_COLORS[section];
  const g = Math.min(1, glow ?? 0);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: inline ? 10 : 999,
        padding: inline ? "8px 14px" : "8px 16px",
        fontSize: inline ? 21 : 18,
        fontWeight: 600,
        fontFamily: FONT_BODY,
        border: `1px solid ${c.border}`,
        background: g > 0.3 ? c.bgHi : c.bg,
        color: c.text,
        whiteSpace: "nowrap",
        lineHeight: 1.1,
        transform: g > 0.3 ? `scale(${1 + g * 0.06})` : undefined,
        boxShadow: g > 0.4 ? `0 0 0 2px ${c.border}, 0 0 12px ${c.bg}` : undefined,
        margin: inline ? "0 4px 6px 0" : undefined,
        ...style,
      }}
    >
      {label}
    </span>
  );
}

function PaletteRow({
  label,
  section,
  chips,
  highlightChip,
  highlightGlow,
}: {
  label: string;
  section: Section;
  chips: readonly string[];
  highlightChip?: string;
  highlightGlow?: number;
}) {
  const c = SECTION_COLORS[section];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 10,
        marginBottom: 10,
      }}
    >
      <span
        style={{
          minWidth: 120,
          fontSize: 16,
          fontWeight: 700,
          fontFamily: FONT_BODY,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: c.label,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      {chips.map((chip) => (
        <Chip
          key={chip}
          label={chip}
          section={section}
          glow={chip === highlightChip ? highlightGlow : 0}
        />
      ))}
    </div>
  );
}

export function EditorPanel({ style }: { style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { templateRows, palette } = COPY.editor;

  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.stroke}`,
        borderRadius: 30,
        padding: 28,
        boxSizing: "border-box",
        boxShadow: "0 28px 80px rgba(0,0,0,0.3)",
        ...style,
      }}
    >
      <div
        style={{
          borderRadius: 22,
          border: `1px solid ${COLORS.stroke}`,
          background: "rgba(5,9,14,0.9)",
          padding: "20px 22px",
          minHeight: 146,
          fontFamily: FONT_BODY,
          fontSize: 22,
          lineHeight: 1.68,
          color: COLORS.text,
          marginBottom: 22,
        }}
      >
        {templateRows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: rowIndex === templateRows.length - 1 ? 0 : 14,
            }}
          >
            {row.map((line, itemIndex) => {
              const visible = getEditorLineProgress(frame, fps, line.delay);

              if (line.type === "text") {
                return (
                  <span key={itemIndex} style={{ opacity: visible }}>
                    {line.text}
                  </span>
                );
              }

              return (
                <span key={itemIndex} style={{ opacity: visible, display: "inline" }}>
                  <Chip label={line.text} section={line.section!} inline />
                </span>
              );
            })}
          </div>
        ))}

      </div>

      {palette.map((row) => (
        <PaletteRow
          key={row.label}
          label={row.label}
          section={row.section}
          chips={row.chips}
        />
      ))}
    </div>
  );
}
