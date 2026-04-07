import { createHmac } from "node:crypto";

// ---------------------------------------------------------------------------
// Pure / near-pure helpers extracted for testability
// ---------------------------------------------------------------------------

const COUNTED_STATUSES = new Set(["valid", "resold"]);
const CHECK_INTERVAL_OPTIONS = new Set([1, 5, 10, 60, 300, 720, 1440, 10080]);
const DEFAULT_CHECK_INTERVAL = 1;
const DEFAULT_ALLOWED_ORIGINS = "https://shotnotif.com,https://www.shotnotif.com,https://shotnotif.vercel.app";
const MERCI_LILLE_ORGANIZER_ID = "183206";
const SHOTNOTIF_TRIGGER = "new_event_detected";
const SHOTNOTIF_SOURCE = "shotnotif";
const DEFAULT_SHOTNOTIF_INTEGRATION_URL =
  "https://api.mercilille.com/api/integrations/shotnotif/events/detected";
const SHOTNOTIF_RETRY_DELAYS_MINUTES = [1, 5, 15, 60, 360, 1440];

export function toInt(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isCountedStatus(status) {
  return COUNTED_STATUSES.has(String(status || "").trim().toLowerCase());
}

export function parseAllowedOrigins(env) {
  const raw = env?.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS;
  return new Set(raw.split(",").map((o) => o.trim()).filter(Boolean));
}

export function matchOrigin(origins, requestOrigin) {
  return requestOrigin && origins.has(requestOrigin) ? requestOrigin : null;
}

export function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return atob(padded);
}

export function getOrganizerIdFromToken(token) {
  const [, payload = ""] = token.trim().split(".");
  if (!payload) return "";

  try {
    const parsed = JSON.parse(decodeBase64Url(payload));
    return parsed.organizerId ? String(parsed.organizerId) : "";
  } catch {
    return "";
  }
}

export function makeCursor(ticket) {
  const updatedAt = String(
    ticket.ticket_updated_at || ticket.ordered_at || ""
  ).trim();
  const ticketId = String(ticket.ticket_id || "").trim();
  if (!updatedAt || !ticketId) return "";
  return `${updatedAt}_${ticketId}`;
}

export function getEventName(ticket) {
  return String(
    ticket.event_name ||
      ticket.event_title ||
      ticket.event_slug ||
      (ticket.event_id ? `Event #${ticket.event_id}` : "Event inconnu")
  );
}

export function toTelegramIntegerChatId(chatId) {
  const s = String(chatId || "").trim();
  if (!/^-?\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
}

export function sqliteIntFlagIsOn(value) {
  return value === 1 || value === true || value === "1";
}

export function organizerTargetSupportsSendAsChat(organizer) {
  const type = String(organizer.telegram_chat_type || "").toLowerCase();
  return type === "channel";
}

export function buildTicketsUrl(organizerId, afterCursor, eventId) {
  const SHOTGUN_TICKETS_URL = "https://api.shotgun.live/tickets";
  const url = new URL(SHOTGUN_TICKETS_URL);
  url.searchParams.set("organizer_id", organizerId);
  if (eventId) {
    url.searchParams.set("event_id", eventId);
    url.searchParams.set("include_cohosted_events", "1");
  }
  if (afterCursor) {
    url.searchParams.set("after", afterCursor);
  }
  return url.toString();
}

export function buildNotificationData(notification, eventCountCache, dealCountCache, dealsMap) {
  const totalSold = eventCountCache.get(notification.eventId) || 0;
  const eventDeals = dealsMap.get(notification.eventId);
  const dealLines = [];

  for (const [title] of notification.newDeals) {
    const sold = dealCountCache.get(`${notification.eventId}:${title}`) || 0;
    const max = eventDeals ? eventDeals.get(title) || 0 : 0;
    const line = max > 0 ? `${title} : ${sold}/${max}` : `${title} : ${sold}`;
    dealLines.push(line);
  }

  const newCount = notification.newCount;

  return {
    event_name: notification.eventName,
    event_id: notification.eventId,
    new_tickets_count: String(newCount),
    new_tickets_label:
      newCount > 1 ? `${newCount} billets vendus` : "1 billet vendu",
    event_total_sold: String(totalSold),
    deal_lines: dealLines.join("\n"),
    first_deal_name: dealLines.length > 0 ? notification.newDeals.keys().next().value : "",
    first_deal_sold: dealLines.length > 0
      ? String(dealCountCache.get(`${notification.eventId}:${notification.newDeals.keys().next().value}`) || 0)
      : "",
  };
}

export function isValidCheckInterval(value) {
  return CHECK_INTERVAL_OPTIONS.has(value);
}

export function isMerciLilleOrganizer(organizerId) {
  return String(organizerId || "").trim() === MERCI_LILLE_ORGANIZER_ID;
}

export function getShotnotifIntegrationUrl(env) {
  return String(env?.SHOTNOTIF_INTEGRATION_URL || DEFAULT_SHOTNOTIF_INTEGRATION_URL).trim();
}

export function buildShotnotifRequestId(eventId, detectedAt) {
  return `shotnotif-${String(eventId || "").trim()}-${String(detectedAt || "").trim()}`;
}

export function buildShotnotifIntegrationBody({
  organizerId,
  shotgunEventId,
  requestId,
  detectedAt,
  eventName = "",
}) {
  const body = {
    organizerId: String(organizerId || "").trim(),
    shotgunEventId: toInt(shotgunEventId),
    requestId: String(requestId || "").trim(),
    detectedAt: String(detectedAt || "").trim(),
    trigger: SHOTNOTIF_TRIGGER,
    source: SHOTNOTIF_SOURCE,
  };

  const normalizedEventName = String(eventName || "").trim();
  if (normalizedEventName) {
    body.eventName = normalizedEventName;
  }

  return body;
}

export function buildShotnotifSignaturePayload({
  timestamp,
  method,
  path,
  organizerId,
  shotgunEventId,
  requestId,
  detectedAt,
  trigger = SHOTNOTIF_TRIGGER,
}) {
  return [
    String(timestamp || "").trim(),
    String(method || "").trim().toUpperCase(),
    String(path || "").trim(),
    String(organizerId || "").trim(),
    String(shotgunEventId || "").trim(),
    String(requestId || "").trim(),
    String(detectedAt || "").trim(),
    String(trigger || "").trim(),
  ].join("\n");
}

export function createShotnotifSignature(secret, payload) {
  return `sha256=${createHmac("sha256", String(secret || "")).update(String(payload || "")).digest("hex")}`;
}

export function getShotnotifRetryDelayMinutes(attemptNumber) {
  const normalized = Math.max(1, toInt(attemptNumber));
  const index = Math.min(normalized - 1, SHOTNOTIF_RETRY_DELAYS_MINUTES.length - 1);
  return SHOTNOTIF_RETRY_DELAYS_MINUTES[index];
}

export function getShotnotifRetryAt(nowIso, attemptNumber) {
  const startMs = Date.parse(String(nowIso || ""));
  if (Number.isNaN(startMs)) return "";
  const delayMs = getShotnotifRetryDelayMinutes(attemptNumber) * 60 * 1000;
  return new Date(startMs + delayMs).toISOString();
}

export {
  CHECK_INTERVAL_OPTIONS,
  DEFAULT_CHECK_INTERVAL,
  COUNTED_STATUSES,
  DEFAULT_SHOTNOTIF_INTEGRATION_URL,
  MERCI_LILLE_ORGANIZER_ID,
  SHOTNOTIF_TRIGGER,
  SHOTNOTIF_SOURCE,
};
