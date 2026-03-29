const SHOTGUN_ORGANIZERS_URL =
  "https://smartboard-api.shotgun.live/api/shotgun/organizers";

export const SHOTGUN_INTEGRATIONS_URL =
  "https://smartboard.shotgun.live/fr/settings/integrations";

export const SHOTGUN_TOKEN_STORAGE_KEY = "sg_token";
export const TELEGRAM_TOKEN_STORAGE_KEY = "tg_token";
export const TELEGRAM_CHAT_ID_STORAGE_KEY = "tg_chat_id";

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

  return normalizeShotgunToken(
    window.localStorage.getItem(SHOTGUN_TOKEN_STORAGE_KEY) || ""
  );
}

export function saveStoredShotgunToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedToken = normalizeShotgunToken(token);

  if (!normalizedToken) {
    window.localStorage.removeItem(SHOTGUN_TOKEN_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SHOTGUN_TOKEN_STORAGE_KEY, normalizedToken);
}

export function clearStoredShotgunToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SHOTGUN_TOKEN_STORAGE_KEY);
}

export function readStoredTelegramConfig() {
  if (typeof window === "undefined") {
    return { telegramToken: "", telegramChatId: "" };
  }

  return {
    telegramToken: window.localStorage.getItem(TELEGRAM_TOKEN_STORAGE_KEY) || "",
    telegramChatId:
      window.localStorage.getItem(TELEGRAM_CHAT_ID_STORAGE_KEY) || "",
  };
}

export function saveStoredTelegramConfig(
  telegramToken: string,
  telegramChatId: string
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    TELEGRAM_TOKEN_STORAGE_KEY,
    telegramToken.trim()
  );
  window.localStorage.setItem(
    TELEGRAM_CHAT_ID_STORAGE_KEY,
    telegramChatId.trim()
  );
}
