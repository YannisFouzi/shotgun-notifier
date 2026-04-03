import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_BODY, FONT_DISPLAY, SCENE_PAD, TYPE } from "./constants";

export type SceneVariant = "neutral" | "telegram" | "rose" | "emerald";

export function useReveal(
  delay = 0,
  config?: Partial<Parameters<typeof spring>[0]["config"]>
) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return spring({
    frame: frame - delay,
    fps,
    config: {
      mass: 0.8,
      damping: 16,
      stiffness: 110,
      ...config,
    },
  });
}

export function FadeUp({
  children,
  delay = 0,
  y = 28,
  x = 0,
  scaleFrom = 0.98,
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  x?: number;
  scaleFrom?: number;
  style?: CSSProperties;
}) {
  const progress = useReveal(delay);

  return (
    <div
      style={{
        opacity: progress,
        transform: `translate(${(1 - progress) * x}px, ${(1 - progress) * y}px) scale(${
          scaleFrom + (1 - scaleFrom) * progress
        })`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SceneBg({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: SceneVariant;
}) {
  const glows =
    variant === "telegram"
      ? {
          top: "rgba(42, 171, 238, 0.22)",
          bottom: "rgba(52, 211, 153, 0.12)",
        }
      : variant === "rose"
        ? {
            top: "rgba(251, 113, 133, 0.18)",
            bottom: "rgba(255, 122, 26, 0.12)",
          }
        : variant === "emerald"
          ? {
              top: "rgba(52, 211, 153, 0.18)",
              bottom: "rgba(42, 171, 238, 0.12)",
            }
          : {
              top: "rgba(255, 255, 255, 0.07)",
              bottom: "rgba(42, 171, 238, 0.08)",
            };

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        color: COLORS.text,
        fontFamily: FONT_BODY,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(circle at 12% 0%, ${glows.top} 0%, transparent 34%),
            radial-gradient(circle at 100% 100%, ${glows.bottom} 0%, transparent 42%),
            linear-gradient(180deg, rgba(255,255,255,0.035), transparent 16%)
          `,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "96px 96px",
          opacity: 0.18,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: `1px solid ${COLORS.stroke}`,
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
      {children}
    </AbsoluteFill>
  );
}

export function SceneFrame({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <AbsoluteFill
      style={{
        padding: `${SCENE_PAD.top}px ${SCENE_PAD.x}px ${SCENE_PAD.bottom}px`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

export function Eyebrow({
  children,
  color = COLORS.telegram,
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 18,
        fontFamily: FONT_DISPLAY,
        fontSize: TYPE.eyebrow,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 999,
          background: color,
          boxShadow: `0 0 0 10px ${color}22`,
        }}
      />
      {children}
    </div>
  );
}

export function SceneTitle({
  children,
  size = "title",
  style,
}: {
  children: ReactNode;
  size?: "hero" | "titleLg" | "title";
  style?: CSSProperties;
}) {
  const fontSize =
    size === "hero" ? TYPE.hero : size === "titleLg" ? TYPE.titleLg : TYPE.title;

  return (
    <h1
      style={{
        margin: 0,
        fontFamily: FONT_DISPLAY,
        fontSize,
        fontWeight: 800,
        lineHeight: 0.96,
        letterSpacing: "-0.05em",
        color: COLORS.text,
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

export function BodyCopy({
  children,
  size = "body",
  style,
}: {
  children: ReactNode;
  size?: "lead" | "body" | "small";
  style?: CSSProperties;
}) {
  const fontSize =
    size === "lead" ? TYPE.lead : size === "small" ? TYPE.small : TYPE.body;

  return (
    <p
      style={{
        margin: 0,
        fontFamily: FONT_BODY,
        fontSize,
        lineHeight: 1.28,
        color: COLORS.textMuted,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

export function Panel({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.stroke}`,
        borderRadius: 34,
        boxShadow: "0 30px 80px rgba(0,0,0,0.28)",
        padding: 28,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Tag({
  children,
  color = COLORS.telegram,
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "12px 18px",
        borderRadius: 999,
        border: `1px solid ${color}55`,
        background: `${color}1a`,
        color,
        fontFamily: FONT_BODY,
        fontSize: TYPE.small,
        fontWeight: 700,
        lineHeight: 1,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function BrandTitle({
  size = 86,
  style,
}: {
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: FONT_DISPLAY,
        fontSize: size,
        fontWeight: 800,
        lineHeight: 0.95,
        letterSpacing: "-0.06em",
        ...style,
      }}
    >
      <span style={{ color: COLORS.text }}>Shot</span>
      <span style={{ color: COLORS.telegram }}>Notif</span>
    </span>
  );
}
