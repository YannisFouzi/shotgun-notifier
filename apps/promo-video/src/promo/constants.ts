export const FPS = 30;

export const COMPOSITION = { width: 1080, height: 1920 } as const;

export const SCENE_PAD = {
  x: 56,
  top: 54,
  bottom: 56,
} as const;

export const TYPE = {
  eyebrow: 24,
  hero: 112,
  titleLg: 96,
  title: 84,
  lead: 40,
  body: 30,
  small: 22,
  micro: 18,
} as const;

export const FONT_DISPLAY =
  '"Bahnschrift SemiCondensed", "Aptos Display", "Trebuchet MS", "Segoe UI", sans-serif';
export const FONT_BODY =
  '"Aptos", "Segoe UI", "Helvetica Neue", Arial, sans-serif';

export const SCENE = {
  demo: 150,
  editor: 420,
  outro: 132,
} as const;

export const DEMO_SCENE_FRAMES = 330;
export const DEMO_EDITOR_TRANSITION_FRAMES = 24;
export const EDITOR_OUTRO_TRANSITION_FRAMES = 20;

export const TOTAL_FRAMES =
  DEMO_SCENE_FRAMES +
  SCENE.editor +
  SCENE.outro -
  DEMO_EDITOR_TRANSITION_FRAMES -
  EDITOR_OUTRO_TRANSITION_FRAMES;

export const COLORS = {
  bg: "#05070b",
  bgAlt: "#0b1018",
  surface: "rgba(14, 20, 29, 0.9)",
  surfaceAlt: "rgba(20, 27, 39, 0.96)",
  surfaceMuted: "rgba(255, 255, 255, 0.05)",
  stroke: "rgba(255, 255, 255, 0.14)",
  strokeStrong: "rgba(255, 255, 255, 0.24)",
  text: "#f6f8fb",
  textMuted: "rgba(246, 248, 251, 0.72)",
  textSoft: "rgba(246, 248, 251, 0.52)",
  telegram: "#2AABEE",
  telegramSoft: "rgba(42, 171, 238, 0.18)",
  shotgun: "#ff7a1a",
  shotgunSoft: "rgba(255, 122, 26, 0.18)",
  emerald: "#34d399",
  emeraldSoft: "rgba(52, 211, 153, 0.18)",
  rose: "#fb7185",
  roseSoft: "rgba(251, 113, 133, 0.18)",
  white: "#ffffff",
  black: "#020304",
} as const;

export const SECTION_COLORS = {
  event: {
    border: "rgba(59,130,246,0.3)",
    bg: "rgba(59,130,246,0.12)",
    bgHi: "rgba(59,130,246,0.25)",
    text: "#93c5fd",
    label: "rgba(96,165,250,0.8)",
  },
  summary: {
    border: "rgba(16,185,129,0.3)",
    bg: "rgba(16,185,129,0.12)",
    bgHi: "rgba(16,185,129,0.25)",
    text: "#6ee7b7",
    label: "rgba(52,211,153,0.8)",
  },
  deal: {
    border: "rgba(217,119,6,0.3)",
    bg: "rgba(217,119,6,0.12)",
    bgHi: "rgba(217,119,6,0.25)",
    text: "#fcd34d",
    label: "rgba(251,191,36,0.8)",
  },
  context: {
    border: "rgba(168,85,247,0.3)",
    bg: "rgba(168,85,247,0.12)",
    bgHi: "rgba(168,85,247,0.25)",
    text: "#c4b5fd",
    label: "rgba(192,132,250,0.8)",
  },
} as const;
