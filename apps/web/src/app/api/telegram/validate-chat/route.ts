import { NextResponse } from "next/server";

import {
  callTelegram,
  normalizeToken,
  revalidateChat,
  TelegramBotInfo,
} from "../_lib";

function normalizeChatId(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string; chatId?: string };
    const token = normalizeToken(body.token);
    const chatId = normalizeChatId(body.chatId);

    if (!token) {
      return NextResponse.json(
        {
          error: "Ajoutez un Bot Token Telegram.",
          errorKey: "missingBotToken",
        },
        { status: 400 }
      );
    }

    if (!chatId) {
      return NextResponse.json(
        {
          error: "Ajoutez un Chat ID Telegram.",
          errorKey: "missingChatId",
        },
        { status: 400 }
      );
    }

    const bot = await callTelegram<TelegramBotInfo>(token, "getMe");
    const chat = await revalidateChat(token, bot.id, chatId);

    if (!chat) {
      return NextResponse.json(
        {
          error:
            "Impossible de valider ce chat. Verifiez que le bot est bien present et qu'un message a deja ete envoye.",
          errorKey: "validateChatFailed",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      bot: {
        id: bot.id,
        firstName: bot.first_name,
        username: bot.username ? `@${bot.username}` : "",
        canJoinGroups: bot.can_join_groups !== false,
      },
      chat,
    });
  } catch (error) {
    console.error("[validate-chat]", error);

    return NextResponse.json(
      { error: "Impossible de valider ce chat Telegram.", errorKey: "validateGeneric" },
      { status: 500 }
    );
  }
}
