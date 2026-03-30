const SHOTGUN_ORGANIZERS_URL =
  "https://smartboard-api.shotgun.live/api/shotgun/organizers";

export const SHOTGUN_INTEGRATIONS_URL =
  "https://smartboard.shotgun.live/fr/settings/integrations";

export const SHOTGUN_TOKEN_STORAGE_KEY = "sg_token";
export const SHOTGUN_TOKEN_COOKIE_KEY = SHOTGUN_TOKEN_STORAGE_KEY;
export const TELEGRAM_TOKEN_STORAGE_KEY = "tg_token";
export const TELEGRAM_CHAT_ID_STORAGE_KEY = "tg_chat_id";
export const TELEGRAM_CHAT_TITLE_STORAGE_KEY = "tg_chat_title";
export const TELEGRAM_CHAT_TYPE_STORAGE_KEY = "tg_chat_type";

const SHOTGUN_TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function normalizeShotgunToken(token: string) {
  return token.trim();
}

export function buildShotgunEventsUrl(token: string, organizerId?: string) {
  const resolvedOrganizerId = organizerId || getOrganizerIdFromToken(token);

  if (!resolvedOrganizerId) {
    return "";
  }

  const url = new URL(`${SHOTGUN_ORGANIZERS_URL}/${resolvedOrganizerId}/events`);
  url.searchParams.set("key", normalizeShotgunToken(token));
  return url.toString();
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return atob(padded);
}

function readCookieValue(cookieSource: string, cookieName: string) {
  const cookiePrefix = `${cookieName}=`;
  const cookiePart = cookieSource
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(cookiePrefix));

  if (!cookiePart) {
    return "";
  }

  return decodeURIComponent(cookiePart.slice(cookiePrefix.length));
}

function writeCookieValue(cookieName: string, cookieValue: string) {
  if (typeof document === "undefined") {
    return;
  }

  const attributes = [
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${SHOTGUN_TOKEN_COOKIE_MAX_AGE}`,
  ];

  if (window.location.protocol === "https:") {
    attributes.push("Secure");
  }

  document.cookie = `${cookieName}=${encodeURIComponent(cookieValue)}; ${attributes.join("; ")}`;
}

function clearCookieValue(cookieName: string) {
  if (typeof document === "undefined") {
    return;
  }

  const attributes = [
    "Path=/",
    "SameSite=Lax",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
  ];

  if (window.location.protocol === "https:") {
    attributes.push("Secure");
  }

  document.cookie = `${cookieName}=; ${attributes.join("; ")}`;
}

export function readStoredShotgunTokenFromCookieString(cookieSource: string) {
  return normalizeShotgunToken(
    readCookieValue(cookieSource, SHOTGUN_TOKEN_COOKIE_KEY)
  );
}

export function getOrganizerIdFromToken(token: string) {
  const [, payload = ""] = normalizeShotgunToken(token).split(".");

  if (!payload) {
    return "";
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as {
      organizerId?: string | number;
    };

    return parsed.organizerId ? String(parsed.organizerId) : "";
  } catch {
    return "";
  }
}

export function readStoredShotgunToken() {
  if (typeof window === "undefined") {
    return "";
  }

  const localToken = normalizeShotgunToken(
    window.localStorage.getItem(SHOTGUN_TOKEN_STORAGE_KEY) || ""
  );

  if (localToken) {
    return localToken;
  }

  const cookieToken = readStoredShotgunTokenFromCookieString(document.cookie);

  if (cookieToken) {
    window.localStorage.setItem(SHOTGUN_TOKEN_STORAGE_KEY, cookieToken);
  }

  return cookieToken;
}

export function saveStoredShotgunToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedToken = normalizeShotgunToken(token);

  if (!normalizedToken) {
    window.localStorage.removeItem(SHOTGUN_TOKEN_STORAGE_KEY);
    clearCookieValue(SHOTGUN_TOKEN_COOKIE_KEY);
    return;
  }

  window.localStorage.setItem(SHOTGUN_TOKEN_STORAGE_KEY, normalizedToken);
  writeCookieValue(SHOTGUN_TOKEN_COOKIE_KEY, normalizedToken);
}

export function clearStoredShotgunToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SHOTGUN_TOKEN_STORAGE_KEY);
  clearCookieValue(SHOTGUN_TOKEN_COOKIE_KEY);
}

export function readStoredTelegramConfig() {
  if (typeof window === "undefined") {
    return {
      telegramToken: "",
      telegramChatId: "",
      telegramChatTitle: "",
      telegramChatType: "",
    };
  }

  return {
    telegramToken: window.localStorage.getItem(TELEGRAM_TOKEN_STORAGE_KEY) || "",
    telegramChatId:
      window.localStorage.getItem(TELEGRAM_CHAT_ID_STORAGE_KEY) || "",
    telegramChatTitle:
      window.localStorage.getItem(TELEGRAM_CHAT_TITLE_STORAGE_KEY) || "",
    telegramChatType:
      window.localStorage.getItem(TELEGRAM_CHAT_TYPE_STORAGE_KEY) || "",
  };
}

export function saveStoredTelegramConfig(
  telegramToken: string,
  telegramChatId: string,
  meta?: { chatTitle?: string; chatType?: string } | null
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    TELEGRAM_TOKEN_STORAGE_KEY,
    telegramToken.trim()
  );

  const trimmedChatId = telegramChatId.trim();
  window.localStorage.setItem(TELEGRAM_CHAT_ID_STORAGE_KEY, trimmedChatId);

  if (!trimmedChatId) {
    window.localStorage.removeItem(TELEGRAM_CHAT_TITLE_STORAGE_KEY);
    window.localStorage.removeItem(TELEGRAM_CHAT_TYPE_STORAGE_KEY);
    return;
  }

  if (meta) {
    if (meta.chatTitle !== undefined) {
      window.localStorage.setItem(
        TELEGRAM_CHAT_TITLE_STORAGE_KEY,
        meta.chatTitle.trim()
      );
    }
    if (meta.chatType !== undefined) {
      window.localStorage.setItem(
        TELEGRAM_CHAT_TYPE_STORAGE_KEY,
        meta.chatType.trim()
      );
    }
  }
}
