import type { FC } from "react";
import { Composition } from "remotion";
import "./style.css";
import { ShotNotifPromo } from "./promo/ShotNotifPromo";
import { COMPOSITION, FPS, TOTAL_FRAMES } from "./promo/constants";

export const RemotionRoot: FC = () => {
  return (
    <>
      <Composition
        id="ShotNotifPromo"
        component={ShotNotifPromo}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={COMPOSITION.width}
        height={COMPOSITION.height}
        defaultProps={{}}
      />
    </>
  );
};
