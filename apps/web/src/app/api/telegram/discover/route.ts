import { NextResponse } from "next/server";

import {
  callTelegram,
  DiscoveredChat,
  extractChatFromUpdate,
  normalizeToken,
  revalidateChat,
  TelegramBotInfo,
  TelegramUpdate,
  toDiscoveredChat,
} from "../_lib";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    const token = normalizeToken(body.token);

    if (!token) {
      return NextResponse.json(
        { error: "Ajoutez un Bot Token Telegram." },
        { status: 400 }
      );
    }

    const bot = await callTelegram<TelegramBotInfo>(token, "getMe");

    let updates: TelegramUpdate[] = [];

    try {
      updates = await callTelegram<TelegramUpdate[]>(
        token,
        "getUpdates?limit=100&timeout=0"
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible de lire Telegram.";

      if (message.toLowerCase().includes("webhook")) {
        return NextResponse.json(
          {
            error:
              "Impossible de detecter les chats car ce bot a deja un webhook actif.",
          },
          { status: 409 }
        );
      }

      throw error;
    }

    const chatsById = new Map<string, DiscoveredChat>();

    for (const update of updates) {
      const chat = extractChatFromUpdate(update);

      if (!chat) {
        continue;
      }

      chatsById.set(String(chat.id), toDiscoveredChat(chat));
    }

    const revalidatedChats = (
      await Promise.all(
        Array.from(chatsById.keys()).map((chatId) =>
          revalidateChat(token, bot.id, chatId)
        )
      )
    ).filter((chat): chat is DiscoveredChat => Boolean(chat));

    const chats = revalidatedChats.sort((left, right) => {
      if (left.type === right.type) {
        return left.title.localeCompare(right.title, "fr");
      }

      if (left.type === "private") {
        return -1;
      }

      if (right.type === "private") {
        return 1;
      }

      return left.title.localeCompare(right.title, "fr");
    });

    return NextResponse.json({
      bot: {
        id: bot.id,
        firstName: bot.first_name,
        username: bot.username ? `@${bot.username}` : "",
        canJoinGroups: bot.can_join_groups !== false,
      },
      chats,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de contacter Telegram.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
