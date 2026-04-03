/**
 * Shared Telegram phone mockup used by both the web app and Remotion.
 * This wrapper only adds Remotion timing and animation.
 */
import {
  formatTelegramDayLabel,
  TelegramPhoneMockup,
} from "@shotgun-notifier/shared";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface TelegramMessage {
  text: string;
  time: string;
  delay: number;
}

interface TelegramPreviewDashboardProps {
  message?: string;
  messages?: TelegramMessage[];
  mode?: "bot" | "group";
  width?: number;
  delay?: number;
  animated?: boolean;
}

export function TelegramPreviewDashboard({
  message,
  messages,
  mode = "bot",
  width = 500,
  delay = 0,
  animated = true,
}: TelegramPreviewDashboardProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isGroup = mode === "group";

  const progress = animated
    ? spring({
        frame: frame - delay,
        fps,
        config: { mass: 0.8, damping: 16, stiffness: 110 },
      })
    : 1;

  const resolvedMessages: TelegramMessage[] = messages
    ? messages
    : [{ text: message || "Votre message apparaitra ici.", time: "14:33", delay: 0 }];
  const dayLabel = formatTelegramDayLabel("fr");

  return (
    <TelegramPhoneMockup
      width={width}
      maxWidth={width}
      progress={progress}
      title={isGroup ? "Orga Events" : "ShotNotif"}
      subtitle={isGroup ? "3 membres" : "bot"}
      avatarLabel={isGroup ? "OE" : "SN"}
      avatarBackground={isGroup ? "#3e546a" : "#2AABEE"}
      dayLabel={dayLabel}
      composerPlaceholder="Message"
      alignMessagesToBottom
      messages={[
        ...(isGroup
          ? [
              {
                content: "On en est ou des ventes ?",
                time: "14:25",
                sender: "Lucas",
                senderColor: "#e67e22",
              },
              {
                content: "ShotNotif va nous dire ca",
                time: "14:25",
                side: "right" as const,
              },
            ]
          : []),
        ...resolvedMessages.map((msg) => ({
          content: msg.text,
          time: msg.time,
          sender: "ShotNotif",
          senderColor: "#2AABEE",
          progress: spring({
            frame: frame - (delay + msg.delay),
            fps,
            config: { mass: 0.6, damping: 14, stiffness: 120 },
          }),
        })),
      ]}
    />
  );
}

