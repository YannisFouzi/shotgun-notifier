import type { ReactNode } from "react";
import {
  formatTelegramDayLabel,
  TelegramPhoneMockup,
} from "@shotgun-notifier/shared";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

interface TelegramMessageMockupProps {
  message: ReactNode;
  time: string;
  delay?: number;
  progress?: number;
  phoneProgress?: number;
}

export function TelegramMessageMockup({
  message,
  time,
  delay = 0,
  progress,
  phoneProgress,
}: TelegramMessageMockupProps) {
  const phoneWidth = 820;
  const visibleHeight = 720;
  const cropWidth = 860;
  const fadeHeight = 164;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const resolvedProgress =
    progress ??
    spring({
      frame: frame - delay,
      fps,
      config: { mass: 0.7, damping: 14, stiffness: 120 },
    });
  const resolvedPhoneProgress =
    phoneProgress ??
    spring({
      frame: frame - delay,
      fps,
      config: { mass: 0.7, damping: 14, stiffness: 120 },
    });
  const dayLabel = formatTelegramDayLabel("fr");
  const cropMask = `linear-gradient(
    180deg,
    rgba(0, 0, 0, 0) 0px,
    rgba(0, 0, 0, 0.08) 32px,
    rgba(0, 0, 0, 0.82) ${Math.round(fadeHeight * 0.76)}px,
    rgba(0, 0, 0, 1) ${fadeHeight}px,
    rgba(0, 0, 0, 1) 100%
  )`;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: cropWidth,
        minHeight: visibleHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: cropWidth,
          height: visibleHeight,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          overflow: "hidden",
          WebkitMaskImage: cropMask,
          maskImage: cropMask,
        }}
      >
        <TelegramPhoneMockup
          width={phoneWidth}
          maxWidth={phoneWidth}
          progress={resolvedPhoneProgress}
          title="ShotNotif"
          subtitle="bot"
          avatarLabel="SN"
          avatarBackground="#2AABEE"
          dayLabel={dayLabel}
          composerPlaceholder="Message"
          alignMessagesToBottom
          deviceShadow="none"
          messages={[
            {
              content: message,
              time,
              sender: "ShotNotif",
              senderColor: "#2AABEE",
              progress: resolvedProgress,
            },
          ]}
        />
      </div>
    </div>
  );
}
