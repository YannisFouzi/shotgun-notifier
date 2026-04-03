import { spring } from "remotion";

const LINE_CONFIG = {
  mass: 0.5,
  damping: 14,
  stiffness: 140,
} as const;

const ADDED_LINE_CONFIG = {
  mass: 0.6,
  damping: 14,
  stiffness: 120,
} as const;

export function getEditorLineProgress(
  frame: number,
  fps: number,
  delay: number
) {
  return spring({
    frame: frame - delay,
    fps,
    config: LINE_CONFIG,
  });
}

export function getEditorAddedLineProgress(
  frame: number,
  fps: number,
  delay: number
) {
  return spring({
    frame: frame - (delay + 15),
    fps,
    config: ADDED_LINE_CONFIG,
  });
}
