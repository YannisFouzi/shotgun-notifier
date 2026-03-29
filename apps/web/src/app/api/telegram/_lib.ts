export interface TelegramBotInfo {
  id: number;
  first_name: string;
  username?: string;
  can_join_groups?: boolean;
}

export interface TelegramChat {
  id: number | string;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: { chat: TelegramChat };
  edited_message?: { chat: TelegramChat };
  channel_post?: { chat: TelegramChat };
  edited_channel_post?: { chat: TelegramChat };
  my_chat_member?: { chat: TelegramChat };
  chat_member?: { chat: TelegramChat };
}

export interface TelegramChatMember {
  status:
    | "creator"
    | "administrator"
    | "member"
    | "restricted"
    | "left"
    | "kicked";
}

interface TelegramApiSuccess<T> {
  ok: true;
  result: T;
}

interface TelegramApiError {
  ok: false;
  description?: string;
  error_code?: number;
}

type TelegramApiResponse<T> = TelegramApiSuccess<T> | TelegramApiError;

export interface DiscoveredChat {
  id: string;
  type: TelegramChat["type"];
  title: string;
  subtitle: string;
}

export function normalizeToken(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function buildTelegramUrl(token: string, method: string) {
  return `https://api.telegram.org/bot${token}/${method}`;
}

export async function callTelegram<T>(token: string, method: string) {
  const response = await fetch(buildTelegramUrl(token, method), {
    cache: "no-store",
  });

  const payload = (await response.json()) as TelegramApiResponse<T>;

  if (!response.ok || !payload.ok) {
    const error = payload as TelegramApiError;
    throw new Error(error.description || "Telegram API error");
  }

  return payload.result;
}

export async function callTelegramSafely<T>(token: string, method: string) {
  try {
    return await callTelegram<T>(token, method);
  } catch {
    return null;
  }
}

export function extractChatFromUpdate(update: TelegramUpdate) {
  return (
    update.message?.chat ||
    update.edited_message?.chat ||
    update.channel_post?.chat ||
    update.edited_channel_post?.chat ||
    update.my_chat_member?.chat ||
    update.chat_member?.chat ||
    null
  );
}

export function toDiscoveredChat(chat: TelegramChat): DiscoveredChat {
  if (chat.type === "private") {
    const privateTitle =
      chat.username
        ? `@${chat.username}`
        : [chat.first_name, chat.last_name].filter(Boolean).join(" ") ||
          `Utilisateur ${chat.id}`;

    const privateSubtitle =
      [chat.first_name, chat.last_name].filter(Boolean).join(" ") ||
      "Conversation privee";

    return {
      id: String(chat.id),
      type: chat.type,
      title: privateTitle,
      subtitle: privateSubtitle,
    };
  }

  const typeLabel =
    chat.type === "channel"
      ? "Canal"
      : chat.type === "supergroup"
        ? "Supergroupe"
        : "Groupe";

  return {
    id: String(chat.id),
    type: chat.type,
    title: chat.title || `${typeLabel} ${chat.id}`,
    subtitle: typeLabel,
  };
}

export async function revalidateChat(
  token: string,
  botId: number,
  chatId: string
) {
  const encodedChatId = encodeURIComponent(chatId);
  const freshChat = await callTelegramSafely<TelegramChat>(
    token,
    `getChat?chat_id=${encodedChatId}`
  );

  if (!freshChat) {
    return null;
  }

  if (freshChat.type !== "private") {
    const membership = await callTelegramSafely<TelegramChatMember>(
      token,
      `getChatMember?chat_id=${encodedChatId}&user_id=${botId}`
    );

    if (!membership || membership.status === "left" || membership.status === "kicked") {
      return null;
    }
  }

  return toDiscoveredChat(freshChat);
}
