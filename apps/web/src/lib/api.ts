/**
 * API client for the ShotNotif Worker.
 *
 * All calls go through the Worker's REST API.
 * Auth is via the Shotgun token passed as Bearer header.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://notifshotgun.<YOUR_SUBDOMAIN>.workers.dev";

function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("sg_token") || "";
}

async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(
      data.error || `Request failed (${res.status})`,
      res.status,
      data
    );
  }

  return data as T;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

interface AuthResponse {
  ok: boolean;
  organizerId: string;
  telegramConfigured: boolean;
}

export async function apiLogin(token: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth", {
    method: "POST",
    body: JSON.stringify({ token: token.trim() }),
  });
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface ConfigResponse {
  ok: boolean;
  organizerId: string;
  telegramToken: string;
  telegramChatId: string;
  /** Présent après migration Worker D1 + déploiement */
  telegramChatTitle?: string;
  telegramChatType?: string;
  /** Poster avec sender_chat_id (nom du groupe/canal), si le bot a les droits */
  telegramSendAsChat?: boolean;
  messageTemplate: unknown;
  messageTemplateSettings: unknown;
  checkInterval?: number;
  isActive: boolean;
}

export async function apiGetConfig(): Promise<ConfigResponse> {
  return apiFetch<ConfigResponse>("/api/config");
}

export async function apiTelegramTest(): Promise<{
  ok: boolean;
  sendAsChat?: boolean;
}> {
  return apiFetch("/api/telegram-test", { method: "POST" });
}

export async function apiUpdateConfig(data: {
  telegramToken?: string;
  telegramChatId?: string;
  telegramChatTitle?: string;
  telegramChatType?: string;
  telegramSendAsChat?: boolean;
  checkInterval?: number;
}): Promise<{ ok: boolean }> {
  return apiFetch("/api/config", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

interface TemplateResponse {
  ok: boolean;
  messageTemplate: unknown;
  messageTemplateSettings: unknown;
}

export async function apiGetTemplate(): Promise<TemplateResponse> {
  return apiFetch<TemplateResponse>("/api/template");
}

export async function apiUpdateTemplate(data: {
  messageTemplate?: unknown;
  messageTemplateSettings?: unknown;
}): Promise<{ ok: boolean }> {
  return apiFetch("/api/template", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

export async function apiDeleteAccount(): Promise<{ ok: boolean }> {
  return apiFetch("/api/account", { method: "DELETE" });
}
