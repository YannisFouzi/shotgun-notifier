"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TelegramPhoneMockup } from "@shotgun-notifier/shared";

interface Message {
  from: "user" | "botfather";
  parts: MessagePart[];
  time: string;
}

type MessagePart =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "code"; value: string }
  | { type: "mono"; value: string };

function renderParts(parts: MessagePart[]) {
  return parts.map((part, i) => {
    if (part.type === "bold") {
      return (
        <strong key={i} style={{ fontWeight: 600, color: "#fff" }}>
          {part.value}
        </strong>
      );
    }

    if (part.type === "code") {
      return (
        <span
          key={i}
          style={{
            borderRadius: 4,
            background: "#1a2530",
            padding: "2px 4px",
            fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
            fontSize: 11,
            color: "#6ab7f5",
          }}
        >
          {part.value}
        </span>
      );
    }

    if (part.type === "mono") {
      return (
        <span
          key={i}
          style={{
            borderRadius: 4,
            background: "#1a2530",
            padding: "2px 4px",
            fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
            fontSize: 11,
            color: "#e4e6eb",
          }}
        >
          {part.value}
        </span>
      );
    }

    return part.value.split("\n").map((line, j) => (
      <span key={`${i}-${j}`}>
        {j > 0 ? <br /> : null}
        {line}
      </span>
    ));
  });
}

export function BotFatherMockup() {
  const { i18n } = useTranslation();
  const tBf = useMemo(() => i18n.getFixedT("en"), [i18n]);

  const conversation = useMemo<Message[]>(
    () => [
      {
        from: "user",
        parts: [{ type: "text", value: tBf("bf.m0") }],
        time: "10:26",
      },
      {
        from: "botfather",
        parts: [{ type: "text", value: tBf("bf.m1") }],
        time: "10:26",
      },
      {
        from: "user",
        parts: [{ type: "text", value: tBf("bf.m2") }],
        time: "10:26",
      },
      {
        from: "botfather",
        parts: [
          { type: "text", value: tBf("bf.m3a") },
          { type: "mono", value: "bot" },
          { type: "text", value: tBf("bf.m3b") },
        ],
        time: "10:26",
      },
      {
        from: "user",
        parts: [{ type: "text", value: tBf("bf.m4") }],
        time: "10:27",
      },
      {
        from: "botfather",
        parts: [
          { type: "text", value: tBf("bf.m5a") },
          { type: "code", value: tBf("bf.token") },
          { type: "text", value: tBf("bf.m5b") },
          { type: "bold", value: tBf("bf.m5c") },
          { type: "text", value: tBf("bf.m5d") },
          { type: "bold", value: tBf("bf.m5e") },
          { type: "text", value: tBf("bf.m5f") },
        ],
        time: "10:27",
      },
    ],
    [tBf]
  );

  return (
    <TelegramPhoneMockup
      width="23rem"
      maxWidth="23rem"
      title="BotFather"
      subtitle={tBf("bf.headerSubtitle")}
      subtitleColor="#708499"
      avatarLabel="BF"
      avatarBackground="#5288c1"
      verified
      dayLabel={null}
      alignMessagesToBottom={false}
      composerPlaceholder={tBf("bf.inputPlaceholder")}
      actionIconColor="#aaaaaa"
      actions={["more"]}
      messages={conversation.map((msg) => ({
        content: renderParts(msg.parts),
        time: msg.time,
        side: msg.from === "user" ? "right" : "left",
        bubbleColor: msg.from === "user" ? "#2b5278" : "#182533",
      }))}
    />
  );
}
