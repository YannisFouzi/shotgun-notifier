import type { FC } from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import {
  DEMO_EDITOR_TRANSITION_FRAMES,
  DEMO_SCENE_FRAMES,
  EDITOR_OUTRO_TRANSITION_FRAMES,
  SCENE,
} from "./constants";
import { Demo } from "./scenes/Demo";
import { Editor } from "./scenes/Editor";
import { Outro } from "./scenes/Outro";

export const ShotNotifPromo: FC = () => {
  const frame = useCurrentFrame();

  const demo = { from: 0, durationInFrames: DEMO_SCENE_FRAMES };
  const editor = {
    from: DEMO_SCENE_FRAMES - DEMO_EDITOR_TRANSITION_FRAMES,
    durationInFrames: SCENE.editor,
  };
  const outro = {
    from: editor.from + editor.durationInFrames - EDITOR_OUTRO_TRANSITION_FRAMES,
    durationInFrames: SCENE.outro,
  };

  const demoToEditorProgress = interpolate(
    frame,
    [editor.from, editor.from + DEMO_EDITOR_TRANSITION_FRAMES],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const editorToOutroProgress = interpolate(
    frame,
    [outro.from, outro.from + EDITOR_OUTRO_TRANSITION_FRAMES],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const introTranslateX = (progress: number) =>
    interpolate(progress, [0, 1], [120, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const introScale = (progress: number) =>
    interpolate(progress, [0, 1], [1.08, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const introBlur = (progress: number) =>
    interpolate(progress, [0, 1], [22, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const introOpacity = (progress: number) =>
    interpolate(progress, [0, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const exitTranslateX = (progress: number) =>
    interpolate(progress, [0, 1], [0, -110], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const exitScale = (progress: number) =>
    interpolate(progress, [0, 1], [1, 0.94], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const exitBlur = (progress: number) =>
    interpolate(progress, [0, 1], [0, 20], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const exitOpacity = (progress: number) =>
    interpolate(progress, [0, 1], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const editorBgOpacity = introOpacity(demoToEditorProgress);
  const outroBgOpacity = introOpacity(editorToOutroProgress);

  const demoContentStyle = {
    opacity: exitOpacity(demoToEditorProgress),
    transform: `translateX(${exitTranslateX(demoToEditorProgress)}px) scale(${exitScale(
      demoToEditorProgress
    )})`,
    transformOrigin: "center center",
    filter: `blur(${exitBlur(demoToEditorProgress)}px)`,
  };

  const editorContentStyle = {
    opacity: introOpacity(demoToEditorProgress) * exitOpacity(editorToOutroProgress),
    transform: `translateX(${
      introTranslateX(demoToEditorProgress) + exitTranslateX(editorToOutroProgress)
    }px) scale(${introScale(demoToEditorProgress) * exitScale(editorToOutroProgress)})`,
    transformOrigin: "center center",
    filter: `blur(${introBlur(demoToEditorProgress) + exitBlur(editorToOutroProgress)}px)`,
  };

  const outroContentStyle = {
    opacity: introOpacity(editorToOutroProgress),
    transform: `translateX(${introTranslateX(editorToOutroProgress)}px) scale(${introScale(
      editorToOutroProgress
    )})`,
    transformOrigin: "center center",
    filter: `blur(${introBlur(editorToOutroProgress)}px)`,
  };

  return (
    <>
      <Sequence {...demo}>
        <Demo showContent={false} />
      </Sequence>
      <Sequence {...editor}>
        <AbsoluteFill style={{ opacity: editorBgOpacity }}>
          <Editor showContent={false} />
        </AbsoluteFill>
      </Sequence>
      <Sequence {...outro}>
        <AbsoluteFill style={{ opacity: outroBgOpacity }}>
          <Outro showContent={false} />
        </AbsoluteFill>
      </Sequence>

      <Sequence {...demo}>
        <Demo showBackground={false} contentStyle={demoContentStyle} />
      </Sequence>
      <Sequence {...editor}>
        <Editor showBackground={false} contentStyle={editorContentStyle} />
      </Sequence>
      <Sequence {...outro}>
        <Outro showBackground={false} contentStyle={outroContentStyle} />
      </Sequence>
    </>
  );
};
