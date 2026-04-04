import type { CSSProperties, ReactNode } from "react";

// ---------------------------------------------------------------------------
// iPhone 14 Pro CSS mockup — adapted from Devices.css v0.2.0 (MIT)
// Pure inline styles, zero dependencies, works in React + Remotion.
// ---------------------------------------------------------------------------

export interface IPhoneMockupProps {
  children: ReactNode;
  /** Scale factor relative to the native 428×868 frame (default 1) */
  scale?: number;
  /** Extra CSS on the outer wrapper */
  style?: CSSProperties;
  /** Color variant */
  variant?: "purple" | "silver" | "black" | "gold";
  /** Class name on the outer wrapper */
  className?: string;
}

// Native dimensions from Devices.css
const W = 428;
const H = 868;
const SCREEN_W = 390;
const SCREEN_H = 830;
const BORDER_RADIUS = 68;
const SCREEN_RADIUS = 49;
const PADDING = 19;

const VARIANTS = {
  purple: {
    frameBorder: "#1b1721",
    frameShadow: "inset 0 0 4px 2px #c0b7cd, inset 0 0 0 6px #342c3f",
    btnBg: "#1b1721",
  },
  silver: {
    frameBorder: "#c8cacb",
    frameShadow: "inset 0 0 4px 2px white, inset 0 0 0 6px #e2e3e4",
    btnBg: "#c8cacb",
  },
  black: {
    frameBorder: "#5c5956",
    frameShadow: "inset 0 0 4px 2px white, inset 0 0 0 6px #76726f",
    btnBg: "#5c5956",
  },
  gold: {
    frameBorder: "#e7d19e",
    frameShadow: "inset 0 0 4px 2px white, inset 0 0 0 6px #d2ab4c",
    btnBg: "#e7d19e",
  },
} as const;

export function IPhoneMockup({
  children,
  scale = 1,
  style,
  variant = "black",
  className,
}: IPhoneMockupProps) {
  const v = VARIANTS[variant];
  const s = scale;

  const outerStyle: CSSProperties = {
    position: "relative",
    width: W * s,
    height: H * s,
    flexShrink: 0,
    ...style,
  };

  const frameStyle: CSSProperties = {
    position: "relative",
    background: "#010101",
    border: `${1 * s}px solid ${v.frameBorder}`,
    borderRadius: BORDER_RADIUS * s,
    boxShadow: v.frameShadow,
    width: W * s,
    height: H * s,
    padding: PADDING * s,
    boxSizing: "border-box",
    zIndex: 1,
    overflow: "hidden",
  };

  // Screen container at scaled size, content renders at native 390×830
  // and is scaled up/down via CSS transform to fill the container.
  const screenStyle: CSSProperties = {
    position: "relative",
    width: SCREEN_W * s,
    height: SCREEN_H * s,
    borderRadius: SCREEN_RADIUS * s,
    overflow: "hidden",
    backgroundColor: "#000",
    zIndex: 1,
  };

  const screenContentStyle: CSSProperties = {
    width: SCREEN_W,
    height: SCREEN_H,
    transform: s !== 1 ? `scale(${s})` : undefined,
    transformOrigin: "top left",
  };

  // Dynamic Island
  const islandStyle: CSSProperties = {
    position: "absolute",
    top: 29 * s,
    left: "50%",
    marginLeft: -60 * s,
    width: 120 * s,
    height: 35 * s,
    background: "#010101",
    borderRadius: 20 * s,
    zIndex: 10,
  };

  // Camera dot in Dynamic Island
  const cameraStyle: CSSProperties = {
    position: "absolute",
    top: 42 * s,
    left: "50%",
    marginLeft: 36 * s,
    width: 9 * s,
    height: 9 * s,
    borderRadius: "50%",
    background:
      "radial-gradient(farthest-corner at 20% 20%, #6074bf 0, transparent 40%), radial-gradient(farthest-corner at 80% 80%, #513785 0, #24555e 20%, transparent 50%)",
    boxShadow: "0 0 1px 1px rgba(255, 255, 255, .05)",
    zIndex: 11,
  };

  // Side buttons — left (silent + volume)
  const btnLeftStyle: CSSProperties = {
    position: "absolute",
    left: -2 * s,
    top: 115 * s,
    width: 3 * s,
    height: 32 * s,
    background: v.btnBg,
    borderRadius: 2 * s,
    zIndex: 0,
  };

  const btnVolUpStyle: CSSProperties = {
    position: "absolute",
    left: -2 * s,
    top: (115 + 60) * s,
    width: 3 * s,
    height: 62 * s,
    background: v.btnBg,
    borderRadius: 2 * s,
    zIndex: 0,
  };

  const btnVolDownStyle: CSSProperties = {
    position: "absolute",
    left: -2 * s,
    top: (115 + 140) * s,
    width: 3 * s,
    height: 62 * s,
    background: v.btnBg,
    borderRadius: 2 * s,
    zIndex: 0,
  };

  // Power button — right
  const btnPowerStyle: CSSProperties = {
    position: "absolute",
    right: -2 * s,
    top: 200 * s,
    width: 3 * s,
    height: 100 * s,
    background: v.btnBg,
    borderRadius: 2 * s,
    zIndex: 0,
  };

  // Antenna stripes (top + bottom)
  const stripeTopStyle: CSSProperties = {
    position: "absolute",
    top: 85 * s,
    left: 0,
    width: "100%",
    height: 7 * s,
    borderLeft: `7px solid rgba(1,1,1,0.25)`,
    borderRight: `7px solid rgba(1,1,1,0.25)`,
    boxSizing: "border-box",
    zIndex: 9,
    pointerEvents: "none",
  };

  const stripeBottomStyle: CSSProperties = {
    position: "absolute",
    bottom: 85 * s,
    left: 0,
    width: "100%",
    height: 7 * s,
    borderLeft: `7px solid rgba(1,1,1,0.25)`,
    borderRight: `7px solid rgba(1,1,1,0.25)`,
    boxSizing: "border-box",
    zIndex: 9,
    pointerEvents: "none",
  };

  return (
    <div style={outerStyle} className={className}>
      <div style={frameStyle}>
        {/* Antenna stripes */}
        <div style={stripeTopStyle} />
        <div style={stripeBottomStyle} />
        {/* Dynamic Island */}
        <div style={islandStyle} />
        <div style={cameraStyle} />
        {/* Screen content — always 390×830 native, CSS-scaled */}
        <div style={screenStyle}>
          <div style={screenContentStyle}>{children}</div>
        </div>
      </div>
      {/* Side buttons */}
      <div style={btnLeftStyle} />
      <div style={btnVolUpStyle} />
      <div style={btnVolDownStyle} />
      <div style={btnPowerStyle} />
    </div>
  );
}
