import type { CSSProperties, ReactNode } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../constants";

export function PhoneMockup({
  children,
  width = 540,
  delay = 0,
  animated = true,
  style,
}: {
  children: ReactNode;
  width?: number;
  delay?: number;
  animated?: boolean;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = animated
    ? spring({
        frame: frame - delay,
        fps,
        config: { mass: 0.8, damping: 16, stiffness: 110 },
      })
    : 1;

  const height = width * 2.08;

  return (
    <div
      style={{
        width,
        height,
        opacity: progress,
        transform: `translateY(${(1 - progress) * 44}px) scale(${0.97 + progress * 0.03})`,
        flexShrink: 0,
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 56,
          padding: 10,
          background: "#080b10",
          border: `2px solid ${COLORS.strokeStrong}`,
          boxShadow: `0 36px 90px rgba(0, 0, 0, 0.38)`,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 144,
              height: 32,
              background: "#080b10",
              borderRadius: "0 0 18px 18px",
              position: "absolute",
              top: 0,
            }}
          />
        </div>
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 46,
            overflow: "hidden",
            background: "#0e1621",
            border: `1px solid ${COLORS.strokeStrong}`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
