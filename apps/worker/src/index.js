import * as Sentry from "@sentry/cloudflare";
import {
  renderMessageTemplateWithData,
  normalizeMessageTemplateSettings,
  DEFAULT_MESSAGE_TEMPLATE_CONTENT,
  DEFAULT_MESSAGE_TEMPLATE_SETTINGS,
} from "@shotgun-notifier/shared";
import {
  toInt,
  isCountedStatus,
  parseAllowedOrigins,
  matchOrigin,
  getOrganizerIdFromToken,
  makeCursor,
  getEventName,
  toTelegramIntegerChatId,
  sqliteIntFlagIsOn,
  organizerTargetSupportsSendAsChat,
  buildTicketsUrl,
  buildNotificationData,
  isValidCheckInterval,
  CHECK_INTERVAL_OPTIONS,
  DEFAULT_CHECK_INTERVAL,
  isMerciLilleOrganizer,
  getShotnotifIntegrationUrl,
  buildShotnotifRequestId,
  buildShotnotifIntegrationBody,
  buildShotnotifSignaturePayload,
  createShotnotifSignature,
  getShotnotifRetryAt,
} from "./helpers.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VERSION = "shotgun-notifier-v3";
const SHOTGUN_TICKETS_URL = "https://api.shotgun.live/tickets";
const SHOTGUN_EVENTS_URL =
  "https://smartboard-api.shotgun.live/api/shotgun/organizers";
const TELEGRAM_API_BASE = "https://api.telegram.org";

const BOOTSTRAP_MAX_PAGES = 200;
const SYNC_MAX_PAGES_PER_RUN = 10;
const ORGANIZER_EVENT_STATUS_KNOWN = "known";
const ORGANIZER_EVENT_STATUS_PENDING = "pending";
const ORGANIZER_EVENT_STATUS_DONE = "done";
const ORGANIZER_EVENT_STATUS_RETRY = "retry";

// Rate limit: { max requests, window in seconds }
const RATE_LIMITS = {
  "/api/auth":     { max: 10, window: 60 },
  "/api/feedback": { max: 3,  window: 60 },
};
const RATE_LIMIT_CLEANUP_PROBABILITY = 0.05; // 5% chance per request

const FETCH_TIMEOUT_MS = 10_000; // 10 seconds

// ---------------------------------------------------------------------------
// Helpers (HTTP / CORS)
// ---------------------------------------------------------------------------

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function withCors(response, origin) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
}

async function checkRateLimit(db, ip, endpoint) {
  const config = RATE_LIMITS[endpoint];
  if (!config) return null; // no limit configured

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % config.window);
  const key = `${ip}:${endpoint}:${windowStart}`;

  const row = await db
    .prepare("SELECT count FROM rate_limits WHERE key = ?")
    .bind(key)
    .first();

  const currentCount = row ? toInt(row.count) : 0;

  if (currentCount >= config.max) {
    const retryAfter = windowStart + config.window - now;
    return retryAfter > 0 ? retryAfter : 1;
  }

  await db
    .prepare(
      `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
       ON CONFLICT (key) DO UPDATE SET count = count + 1`
    )
    .bind(key, windowStart)
    .run();

  // Probabilistic cleanup of expired entries
  if (Math.random() < RATE_LIMIT_CLEANUP_PROBABILITY) {
    await db
      .prepare("DELETE FROM rate_limits WHERE window_start < ?")
      .bind(windowStart - config.window)
      .run();
  }

  return null; // allowed
}

function rateLimitResponse(retryAfter) {
  return new Response(
    JSON.stringify({ error: "Too many requests" }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}

function corsPreflightResponse(origin) {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      "Access-Control-Max-Age": "86400",
    },
  });
}

// ---------------------------------------------------------------------------
// Fetch with timeout
// ---------------------------------------------------------------------------

function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

// ---------------------------------------------------------------------------
// Shotgun token helpers
// ---------------------------------------------------------------------------


async function validateShotgunToken(token) {
  const organizerId = getOrganizerIdFromToken(token);
  if (!organizerId) return null;

  const url = `${SHOTGUN_EVENTS_URL}/${organizerId}/events?key=${token.trim()}`;
  const res = await fetchWithTimeout(url);

  if (res.status === 401 || res.status === 403 || !res.ok) return null;
  return organizerId;
}

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------

async function authenticate(request, db) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) return null;

  const organizerId = getOrganizerIdFromToken(token);
  if (!organizerId) return null;

  const row = await db
    .prepare("SELECT * FROM organizers WHERE id = ?")
    .bind(organizerId)
    .first();

  if (!row) return null;
  if (row.shotgun_token !== token.trim()) return null;

  return row;
}

// ---------------------------------------------------------------------------
// Shotgun API
// ---------------------------------------------------------------------------

function shotgunHeaders(token) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function fetchJson(url, headers, label) {
  const response = await fetchWithTimeout(url, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${label} failed (${response.status}): ${body}`);
  }
  return response.json();
}


async function fetchEvents(organizerId, shotgunToken) {
  const url = `${SHOTGUN_EVENTS_URL}/${organizerId}/events?key=${shotgunToken}`;
  const json = await fetchJson(url, {}, "Shotgun events list");
  const events = Array.isArray(json.data) ? json.data : [];

  return events.map((e) => {
    const deals = new Map();
    for (const d of e.deals || []) {
      deals.set(String(d.name || d.deal_title || ""), toInt(d.quantity));
    }
    return { id: String(e.id), name: e.name || "", deals };
  });
}

function getShotnotifIntegrationConfig(env, organizerId) {
  const normalizedOrganizerId = String(organizerId || "").trim();
  if (!isMerciLilleOrganizer(normalizedOrganizerId)) {
    return null;
  }

  return {
    organizerId: normalizedOrganizerId,
    secret: String(env?.SHOTNOTIF_INTEGRATION_SECRET || "").trim(),
    url: getShotnotifIntegrationUrl(env),
  };
}

async function postDetectedEventToMerciLille(env, organizerId, trackedEvent) {
  const config = getShotnotifIntegrationConfig(env, organizerId);
  if (!config) {
    return { skipped: true, reason: "organizer_not_eligible" };
  }

  if (!config.secret) {
    return { skipped: true, reason: "missing_secret" };
  }

  const url = new URL(config.url);
  const method = "POST";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const eventId = toInt(trackedEvent.event_id);
  const detectedAt = String(trackedEvent.first_seen_at || "").trim();
  const requestId =
    String(trackedEvent.integration_request_id || "").trim() ||
    buildShotnotifRequestId(eventId, detectedAt || new Date().toISOString());
  const body = buildShotnotifIntegrationBody({
    organizerId: config.organizerId,
    shotgunEventId: eventId,
    requestId,
    detectedAt,
    eventName: trackedEvent.event_name,
  });
  const signaturePayload = buildShotnotifSignaturePayload({
    timestamp,
    method,
    path: url.pathname,
    organizerId: body.organizerId,
    shotgunEventId: body.shotgunEventId,
    requestId: body.requestId,
    detectedAt: body.detectedAt,
    trigger: body.trigger,
  });
  const signature = createShotnotifSignature(config.secret, signaturePayload);

  const response = await fetchWithTimeout(
    url.toString(),
    {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Integration-Timestamp": timestamp,
        "X-Integration-Signature": signature,
      },
      body: JSON.stringify(body),
    }
  );

  const raw = await response.text();
  let parsed = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok || parsed?.success === false) {
    const message =
      parsed?.message ||
      parsed?.error ||
      raw ||
      `Unexpected integration response (${response.status})`;
    throw new Error(`Merci Lille integration failed (${response.status}): ${message}`);
  }

  return {
    skipped: false,
    data: parsed,
  };
}

async function processOrganizerEventExports(db, env, organizer) {
  const config = getShotnotifIntegrationConfig(env, organizer.id);
  if (!config) {
    return {
      eligible: false,
      discovered: 0,
      attempted: 0,
      delivered: 0,
      failed: 0,
      blocked: 0,
    };
  }

  const nowIso = new Date().toISOString();
  const dueRows = await listDueOrganizerEventExports(db, organizer.id, nowIso);

  if (!config.secret) {
    if (dueRows.length > 0) {
      console.warn(
        `[${VERSION}] ShotNotif integration skipped for organizer ${organizer.id}: missing SHOTNOTIF_INTEGRATION_SECRET`
      );
    }

    return {
      eligible: true,
      discovered: 0,
      attempted: 0,
      delivered: 0,
      failed: 0,
      blocked: dueRows.length,
    };
  }

  let delivered = 0;
  let failed = 0;

  for (const trackedEvent of dueRows) {
    const eventId = String(trackedEvent.event_id || "").trim();
    if (!eventId) continue;

    const attemptedAt = new Date().toISOString();
    const attemptCount = toInt(trackedEvent.integration_attempts) + 1;

    try {
      const result = await postDetectedEventToMerciLille(env, organizer.id, trackedEvent);
      if (result.skipped) continue;

      await markOrganizerEventExportSuccess(
        db,
        organizer.id,
        eventId,
        attemptCount,
        attemptedAt
      );

      delivered += 1;
      console.log(
        `[${VERSION}] Exported new event ${eventId} for organizer ${organizer.id} to Merci Lille`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const nextRetryAt = getShotnotifRetryAt(attemptedAt, attemptCount) || attemptedAt;

      await markOrganizerEventExportFailure(
        db,
        organizer.id,
        eventId,
        attemptCount,
        attemptedAt,
        nextRetryAt,
        message
      );

      failed += 1;
      console.error(
        `[${VERSION}] Merci Lille export failed for organizer ${organizer.id}, event ${eventId}:`,
        message
      );
    }
  }

  return {
    eligible: true,
    discovered: 0,
    attempted: dueRows.length,
    delivered,
    failed,
    blocked: 0,
  };
}


// ---------------------------------------------------------------------------
// D1 data access
// ---------------------------------------------------------------------------

async function getResyncGeneration(db, organizerId) {
  const row = await db
    .prepare("SELECT resync_generation FROM organizers WHERE id = ?")
    .bind(organizerId)
    .first();
  return row ? toInt(row.resync_generation) : 0;
}

async function getTicketCounted(db, organizerId, ticketId) {
  const row = await db
    .prepare(
      "SELECT counted FROM tickets WHERE organizer_id = ? AND ticket_id = ?"
    )
    .bind(organizerId, ticketId)
    .first();
  return row ? row.counted === 1 : false;
}

async function setTicketCounted(db, organizerId, ticketId, eventId, dealTitle, counted) {
  await db
    .prepare(
      `INSERT INTO tickets (organizer_id, ticket_id, event_id, deal_title, counted)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (organizer_id, ticket_id)
       DO UPDATE SET counted = excluded.counted, deal_title = excluded.deal_title`
    )
    .bind(organizerId, ticketId, eventId, dealTitle, counted ? 1 : 0)
    .run();
}

async function getEventCount(db, organizerId, eventId) {
  const row = await db
    .prepare(
      "SELECT sold_count FROM event_counts WHERE organizer_id = ? AND event_id = ?"
    )
    .bind(organizerId, eventId)
    .first();
  return row ? toInt(row.sold_count) : 0;
}

async function setEventCount(db, organizerId, eventId, count) {
  await db
    .prepare(
      `INSERT INTO event_counts (organizer_id, event_id, sold_count, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT (organizer_id, event_id)
       DO UPDATE SET sold_count = excluded.sold_count, updated_at = excluded.updated_at`
    )
    .bind(organizerId, eventId, count)
    .run();
}

async function getDealCount(db, organizerId, eventId, dealTitle) {
  const row = await db
    .prepare(
      "SELECT count FROM deal_counts WHERE organizer_id = ? AND event_id = ? AND deal_title = ?"
    )
    .bind(organizerId, eventId, dealTitle)
    .first();
  return row ? toInt(row.count) : 0;
}

async function setDealCount(db, organizerId, eventId, dealTitle, count) {
  await db
    .prepare(
      `INSERT INTO deal_counts (organizer_id, event_id, deal_title, count, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT (organizer_id, event_id, deal_title)
       DO UPDATE SET count = excluded.count, updated_at = excluded.updated_at`
    )
    .bind(organizerId, eventId, dealTitle, count)
    .run();
}

async function getSyncState(db, organizerId) {
  const row = await db
    .prepare("SELECT * FROM sync_state WHERE organizer_id = ?")
    .bind(organizerId)
    .first();
  if (!row) {
    return {
      organizer_id: organizerId,
      bootstrapped: 0,
      cursor: "",
      events_seeded: 0,
    };
  }

  return {
    ...row,
    bootstrapped: toInt(row.bootstrapped),
    cursor: row.cursor || "",
    events_seeded: toInt(row.events_seeded),
  };
}

async function setSyncState(db, organizerId, bootstrapped, cursor, eventsSeeded, expectedGeneration) {
  // When expectedGeneration is provided, the write is conditional: the INSERT
  // uses a SELECT that returns 0 rows if resync_generation no longer matches,
  // making it a no-op at the SQL level — no check-then-act race.
  if (expectedGeneration !== undefined) {
    const { meta } = await db
      .prepare(
        `INSERT INTO sync_state (organizer_id, bootstrapped, cursor, events_seeded, updated_at)
         SELECT ?, ?, ?, ?, datetime('now')
         FROM organizers WHERE id = ? AND resync_generation = ?
         ON CONFLICT (organizer_id)
         DO UPDATE SET
           bootstrapped = excluded.bootstrapped,
           cursor = excluded.cursor,
           events_seeded = excluded.events_seeded,
           updated_at = excluded.updated_at`
      )
      .bind(
        organizerId, bootstrapped ? 1 : 0, cursor, eventsSeeded ? 1 : 0,
        organizerId, expectedGeneration
      )
      .run();
    return (meta?.changes ?? 0) > 0;
  }

  await db
    .prepare(
      `INSERT INTO sync_state (organizer_id, bootstrapped, cursor, events_seeded, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT (organizer_id)
       DO UPDATE SET
         bootstrapped = excluded.bootstrapped,
         cursor = excluded.cursor,
         events_seeded = excluded.events_seeded,
         updated_at = excluded.updated_at`
    )
    .bind(organizerId, bootstrapped ? 1 : 0, cursor, eventsSeeded ? 1 : 0)
    .run();
  return true;
}

async function listOrganizerEvents(db, organizerId) {
  const { results } = await db
    .prepare("SELECT * FROM organizer_events WHERE organizer_id = ?")
    .bind(organizerId)
    .all();
  return Array.isArray(results) ? results : [];
}

async function registerOrganizerEvents(db, organizerId, events, { queueNewEvents }) {
  const existingRows = await listOrganizerEvents(db, organizerId);
  const existingMap = new Map(
    existingRows.map((row) => [String(row.event_id || "").trim(), row])
  );
  const nowIso = new Date().toISOString();
  const statements = [];
  let discovered = 0;
  let queued = 0;

  for (const event of events) {
    const eventId = String(event.id || "").trim();
    const eventName = String(event.name || "").trim();
    if (!eventId) continue;

    if (existingMap.has(eventId)) {
      statements.push(
        db
          .prepare(
            `UPDATE organizer_events
             SET event_name = ?, last_seen_at = ?
             WHERE organizer_id = ? AND event_id = ?`
          )
          .bind(eventName, nowIso, organizerId, eventId)
      );
      continue;
    }

    discovered += 1;

    const integrationStatus = queueNewEvents
      ? ORGANIZER_EVENT_STATUS_PENDING
      : ORGANIZER_EVENT_STATUS_KNOWN;
    const requestId = queueNewEvents ? buildShotnotifRequestId(eventId, nowIso) : "";
    const nextRetryAt = queueNewEvents ? nowIso : "";

    if (queueNewEvents) {
      queued += 1;
    }

    statements.push(
      db
        .prepare(
          `INSERT INTO organizer_events (
             organizer_id,
             event_id,
             event_name,
             first_seen_at,
             last_seen_at,
             integration_status,
             integration_attempts,
             integration_request_id,
             next_retry_at,
             last_integration_attempt_at,
             integrated_at,
             last_integration_error
           )
           VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, '', '', '')`
        )
        .bind(
          organizerId,
          eventId,
          eventName,
          nowIso,
          nowIso,
          integrationStatus,
          requestId,
          nextRetryAt
        )
    );
  }

  for (let i = 0; i < statements.length; i += 400) {
    await db.batch(statements.slice(i, i + 400));
  }

  return {
    discovered,
    queued,
    seeded: queueNewEvents ? 0 : discovered,
  };
}

async function listDueOrganizerEventExports(db, organizerId, nowIso) {
  const { results } = await db
    .prepare(
      `SELECT * FROM organizer_events
       WHERE organizer_id = ?
         AND integration_status IN (?, ?)
         AND (next_retry_at = '' OR next_retry_at <= ?)
       ORDER BY first_seen_at ASC, event_id ASC`
    )
    .bind(
      organizerId,
      ORGANIZER_EVENT_STATUS_PENDING,
      ORGANIZER_EVENT_STATUS_RETRY,
      nowIso
    )
    .all();

  return Array.isArray(results) ? results : [];
}

async function markOrganizerEventExportSuccess(
  db,
  organizerId,
  eventId,
  attemptCount,
  attemptedAt
) {
  await db
    .prepare(
      `UPDATE organizer_events
       SET integration_status = ?,
           integration_attempts = ?,
           last_integration_attempt_at = ?,
           integrated_at = ?,
           next_retry_at = '',
           last_integration_error = ''
       WHERE organizer_id = ? AND event_id = ?`
    )
    .bind(
      ORGANIZER_EVENT_STATUS_DONE,
      attemptCount,
      attemptedAt,
      attemptedAt,
      organizerId,
      eventId
    )
    .run();
}

async function markOrganizerEventExportFailure(
  db,
  organizerId,
  eventId,
  attemptCount,
  attemptedAt,
  nextRetryAt,
  errorMessage
) {
  await db
    .prepare(
      `UPDATE organizer_events
       SET integration_status = ?,
           integration_attempts = ?,
           last_integration_attempt_at = ?,
           next_retry_at = ?,
           last_integration_error = ?
       WHERE organizer_id = ? AND event_id = ?`
    )
    .bind(
      ORGANIZER_EVENT_STATUS_RETRY,
      attemptCount,
      attemptedAt,
      nextRetryAt,
      errorMessage,
      organizerId,
      eventId
    )
    .run();
}

// ---------------------------------------------------------------------------
// Telegram
// ---------------------------------------------------------------------------


async function sendTelegram(telegramToken, chatId, text, options) {
  const useSenderChat =
    options?.sendAsChat &&
    toTelegramIntegerChatId(chatId) !== null;

  const payload = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  };

  if (useSenderChat) {
    payload.sender_chat_id = toTelegramIntegerChatId(chatId);
  }

  const url = `${TELEGRAM_API_BASE}/bot${telegramToken}/sendMessage`;
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Telegram sendMessage failed (${response.status}): ${body}`
    );
  }
}

// ---------------------------------------------------------------------------
// Notification message building
// ---------------------------------------------------------------------------


function renderNotificationMessage(organizer, notificationData, showEventName) {
  let template;
  try {
    template = JSON.parse(organizer.message_template);
    if (!template || template.type !== "doc") throw new Error("invalid");
  } catch {
    template = DEFAULT_MESSAGE_TEMPLATE_CONTENT;
  }

  let settings;
  try {
    settings = normalizeMessageTemplateSettings(
      JSON.parse(organizer.message_template_settings)
    );
  } catch {
    settings = DEFAULT_MESSAGE_TEMPLATE_SETTINGS;
  }

  const data = {
    ...notificationData,
    scheduled_events_count: showEventName ? "2" : "1",
  };

  const rendered = renderMessageTemplateWithData(template, data, settings);

  // Fallback: if the template renders empty, use a basic format
  if (!rendered.trim()) {
    const lines = ["Nouvelle vente"];
    if (showEventName) lines.push(data.event_name);
    lines.push(`${data.new_tickets_label} : ${data.event_total_sold}`);
    if (data.deal_lines) lines.push(data.deal_lines);
    return lines.join("\n");
  }

  return rendered;
}

// ---------------------------------------------------------------------------
// Bootstrap (first run for an organizer)
// ---------------------------------------------------------------------------

async function collectTicketsForEvent(organizerId, shotgunToken, eventId, maxPages) {
  const headers = shotgunHeaders(shotgunToken);
  const rows = [];
  let nextUrl = buildTicketsUrl(organizerId, "", eventId);
  let pages = 0;

  while (nextUrl) {
    pages += 1;
    if (pages > maxPages) {
      throw new Error(`Aborted: more than ${maxPages} pages for event ${eventId}`);
    }
    const json = await fetchJson(nextUrl, headers, `Shotgun tickets (event ${eventId})`);
    rows.push(...(Array.isArray(json.data) ? json.data : []));
    nextUrl = json?.pagination?.next || "";
  }
  return rows;
}

async function bootstrapOrganizer(db, organizer) {
  const { id: organizerId, shotgun_token: shotgunToken } = organizer;
  const generationAtStart = toInt(organizer.resync_generation);
  console.log(`[${VERSION}] Bootstrap started for organizer ${organizerId}`);

  // Purge any stale data left by a previous run that was interrupted by a
  // resync (its writes survived because ON CONFLICT DO UPDATE doesn't clean
  // rows whose real count is now zero). This ensures the bootstrap starts
  // from a truly blank slate.
  await db.batch([
    db.prepare("DELETE FROM tickets WHERE organizer_id = ?").bind(organizerId),
    db.prepare("DELETE FROM event_counts WHERE organizer_id = ?").bind(organizerId),
    db.prepare("DELETE FROM deal_counts WHERE organizer_id = ?").bind(organizerId),
  ]);

  const events = await fetchEvents(organizerId, shotgunToken);
  const shouldTrackOrganizerEvents = isMerciLilleOrganizer(organizerId);
  if (shouldTrackOrganizerEvents) {
    const registered = await registerOrganizerEvents(db, organizerId, events, {
      queueNewEvents: false,
    });
    if (registered.seeded > 0) {
      console.log(
        `[${VERSION}] Seeded ${registered.seeded} existing events for organizer ${organizerId} without exporting them`
      );
    }
  }
  const allRows = [];

  for (const event of events) {
    const eventRows = await collectTicketsForEvent(
      organizerId, shotgunToken, event.id, BOOTSTRAP_MAX_PAGES
    );
    allRows.push(...eventRows);
  }

  // Batch counting
  const eventCounts = new Map();
  const dealCounts = new Map();
  let lastCursor = "";

  for (const ticket of allRows) {
    const ticketId = String(ticket.ticket_id || "");
    const eventId = String(ticket.event_id || "");
    const dealTitle = String(ticket.deal_title || "");
    lastCursor = makeCursor(ticket) || lastCursor;

    if (!ticketId || !eventId) continue;
    if (!isCountedStatus(ticket.ticket_status)) continue;

    eventCounts.set(eventId, (eventCounts.get(eventId) || 0) + 1);
    if (dealTitle) {
      const dk = `${eventId}:${dealTitle}`;
      dealCounts.set(dk, (dealCounts.get(dk) || 0) + 1);
    }
  }

  // Check if a resync was requested while we were fetching from Shotgun.
  // If the generation changed, discard everything — the next cron tick will
  // start a fresh bootstrap with clean state.
  const generationNow = await getResyncGeneration(db, organizerId);
  if (generationNow !== generationAtStart) {
    console.log(`[${VERSION}] Bootstrap aborted for organizer ${organizerId}: resync detected (generation ${generationAtStart} → ${generationNow})`);
    return;
  }

  // Batch write tickets
  const ticketBatch = [];
  for (const ticket of allRows) {
    const ticketId = String(ticket.ticket_id || "");
    const eventId = String(ticket.event_id || "");
    const dealTitle = String(ticket.deal_title || "");
    if (!ticketId || !eventId) continue;
    const counted = isCountedStatus(ticket.ticket_status);

    ticketBatch.push(
      db
        .prepare(
          `INSERT INTO tickets (organizer_id, ticket_id, event_id, deal_title, counted)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (organizer_id, ticket_id) DO UPDATE SET counted = excluded.counted`
        )
        .bind(organizerId, ticketId, eventId, dealTitle, counted ? 1 : 0)
    );
  }

  // D1 batch max 500 statements
  for (let i = 0; i < ticketBatch.length; i += 400) {
    await db.batch(ticketBatch.slice(i, i + 400));
  }

  // Write event counts
  const countBatch = [];
  for (const [eventId, count] of eventCounts) {
    countBatch.push(
      db
        .prepare(
          `INSERT INTO event_counts (organizer_id, event_id, sold_count, updated_at)
           VALUES (?, ?, ?, datetime('now'))
           ON CONFLICT (organizer_id, event_id)
           DO UPDATE SET sold_count = excluded.sold_count, updated_at = excluded.updated_at`
        )
        .bind(organizerId, eventId, count)
    );
  }
  for (const [key, count] of dealCounts) {
    const [eventId, ...rest] = key.split(":");
    const dealTitle = rest.join(":");
    countBatch.push(
      db
        .prepare(
          `INSERT INTO deal_counts (organizer_id, event_id, deal_title, count, updated_at)
           VALUES (?, ?, ?, ?, datetime('now'))
           ON CONFLICT (organizer_id, event_id, deal_title)
           DO UPDATE SET count = excluded.count, updated_at = excluded.updated_at`
        )
        .bind(organizerId, eventId, dealTitle, count)
    );
  }
  if (countBatch.length) {
    for (let i = 0; i < countBatch.length; i += 400) {
      await db.batch(countBatch.slice(i, i + 400));
    }
  }

  // Atomic write: only commits sync_state if resync_generation still matches.
  // If a resync purged everything after the early check above, the INSERT is
  // a no-op and the next cron tick will re-bootstrap with clean state.
  const written = await setSyncState(db, organizerId, true, lastCursor, shouldTrackOrganizerEvents, generationAtStart);
  if (!written) {
    console.log(`[${VERSION}] Bootstrap state discarded for organizer ${organizerId}: resync detected at commit`);
    return;
  }

  console.log(
    `[${VERSION}] Bootstrap completed for ${organizerId}: ${allRows.length} tickets, ${eventCounts.size} events`
  );
}

// ---------------------------------------------------------------------------
// Incremental sync
// ---------------------------------------------------------------------------

async function syncOrganizer(db, env, organizer, maxPagesPerEvent = SYNC_MAX_PAGES_PER_RUN) {
  const { id: organizerId, shotgun_token: shotgunToken } = organizer;
  const generationAtStart = toInt(organizer.resync_generation);
  const syncState = await getSyncState(db, organizerId);
  const cursor = syncState.cursor || "";
  const shouldTrackOrganizerEvents = isMerciLilleOrganizer(organizerId);
  let eventsSeeded = sqliteIntFlagIsOn(syncState.events_seeded);

  const events = await fetchEvents(organizerId, shotgunToken);
  let eventRegistry = {
    discovered: 0,
    queued: 0,
    seeded: 0,
  };

  if (shouldTrackOrganizerEvents) {
    eventRegistry = await registerOrganizerEvents(db, organizerId, events, {
      queueNewEvents: eventsSeeded,
    });
    if (!eventsSeeded) {
      eventsSeeded = true;
      if (eventRegistry.seeded > 0) {
        console.log(
          `[${VERSION}] Seeded ${eventRegistry.seeded} existing events for organizer ${organizerId} without exporting them`
        );
      }
    }
  }

  const headers = shotgunHeaders(shotgunToken);
  const rows = [];

  for (const event of events) {
    let nextUrl = buildTicketsUrl(organizerId, cursor, event.id);
    let pages = 0;

    while (nextUrl && pages < maxPagesPerEvent) {
      pages += 1;
      const json = await fetchJson(
        nextUrl, headers, `Shotgun incremental (event ${event.id})`
      );
      rows.push(...(Array.isArray(json.data) ? json.data : []));
      nextUrl = json?.pagination?.next || "";
    }
  }

  const showEventName = events.length > 1;
  const dealsMap = new Map();
  for (const event of events) {
    dealsMap.set(event.id, event.deals);
  }

  // In-memory caches for this sync run.
  // DB writes are deferred into pendingStatements so that nothing touches
  // tickets / event_counts / deal_counts until we have verified that no
  // resync has invalidated this run.
  const eventCountCache = new Map();
  const dealCountCache = new Map();
  const saleNotifications = new Map();
  const pendingStatements = [];
  let lastCursor = cursor;

  for (const ticket of rows) {
    const ticketId = String(ticket.ticket_id || "");
    const eventId = String(ticket.event_id || "");
    const dealTitle = String(ticket.deal_title || "");
    const nextCursor = makeCursor(ticket);
    if (nextCursor) lastCursor = nextCursor;
    if (!ticketId || !eventId) continue;

    const previousCounted = await getTicketCounted(db, organizerId, ticketId);
    const nextCounted = isCountedStatus(ticket.ticket_status);

    if (previousCounted !== nextCounted) {
      // Get current count (use cache if available)
      if (!eventCountCache.has(eventId)) {
        eventCountCache.set(eventId, await getEventCount(db, organizerId, eventId));
      }
      const currentCount = eventCountCache.get(eventId);
      const nextCount = nextCounted
        ? currentCount + 1
        : Math.max(0, currentCount - 1);
      eventCountCache.set(eventId, nextCount);

      // Defer writes — they will be flushed after the generation check
      pendingStatements.push(
        db
          .prepare(
            `INSERT INTO tickets (organizer_id, ticket_id, event_id, deal_title, counted)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT (organizer_id, ticket_id)
             DO UPDATE SET counted = excluded.counted, deal_title = excluded.deal_title`
          )
          .bind(organizerId, ticketId, eventId, dealTitle, nextCounted ? 1 : 0)
      );
      pendingStatements.push(
        db
          .prepare(
            `INSERT INTO event_counts (organizer_id, event_id, sold_count, updated_at)
             VALUES (?, ?, ?, datetime('now'))
             ON CONFLICT (organizer_id, event_id)
             DO UPDATE SET sold_count = excluded.sold_count, updated_at = excluded.updated_at`
          )
          .bind(organizerId, eventId, nextCount)
      );

      if (dealTitle) {
        const dealCacheKey = `${eventId}:${dealTitle}`;
        if (!dealCountCache.has(dealCacheKey)) {
          dealCountCache.set(
            dealCacheKey,
            await getDealCount(db, organizerId, eventId, dealTitle)
          );
        }
        const currentDealCount = dealCountCache.get(dealCacheKey);
        const nextDealCount = nextCounted
          ? currentDealCount + 1
          : Math.max(0, currentDealCount - 1);
        dealCountCache.set(dealCacheKey, nextDealCount);
        pendingStatements.push(
          db
            .prepare(
              `INSERT INTO deal_counts (organizer_id, event_id, deal_title, count, updated_at)
               VALUES (?, ?, ?, ?, datetime('now'))
               ON CONFLICT (organizer_id, event_id, deal_title)
               DO UPDATE SET count = excluded.count, updated_at = excluded.updated_at`
            )
            .bind(organizerId, eventId, dealTitle, nextDealCount)
        );
      }
    }

    // Track new sales for notification
    if (!previousCounted && nextCounted) {
      const existing = saleNotifications.get(eventId);
      if (existing) {
        existing.newCount += 1;
        if (dealTitle) {
          existing.newDeals.set(
            dealTitle,
            (existing.newDeals.get(dealTitle) || 0) + 1
          );
        }
      } else {
        const newDeals = new Map();
        if (dealTitle) newDeals.set(dealTitle, 1);
        saleNotifications.set(eventId, {
          eventId,
          eventName: getEventName(ticket),
          newCount: 1,
          newDeals,
        });
      }
    }
  }

  // Generation check: if a resync happened during ticket processing, discard
  // all pending writes and skip notifications / exports entirely.
  const generationCheck = await getResyncGeneration(db, organizerId);
  if (generationCheck !== generationAtStart) {
    console.log(`[${VERSION}] Sync aborted for organizer ${organizerId}: resync detected (generation ${generationAtStart} → ${generationCheck}), ${pendingStatements.length} writes discarded`);
    return {
      processed: rows.length,
      notifications: 0,
      aborted: true,
      newEventsDiscovered: 0,
      newEventsQueued: 0,
      eventExportsAttempted: 0,
      eventExportsDelivered: 0,
      eventExportsFailed: 0,
      eventExportsBlocked: 0,
    };
  }

  // Flush deferred writes now that we know the generation is still valid
  for (let i = 0; i < pendingStatements.length; i += 400) {
    await db.batch(pendingStatements.slice(i, i + 400));
  }

  // Check generation again before external effects (Merci Lille export)
  const generationBeforeExport = await getResyncGeneration(db, organizerId);
  if (generationBeforeExport !== generationAtStart) {
    console.log(`[${VERSION}] Sync aborted before exports for organizer ${organizerId}: resync detected`);
    return {
      processed: rows.length,
      notifications: 0,
      aborted: true,
      newEventsDiscovered: eventRegistry.discovered,
      newEventsQueued: eventRegistry.queued,
      eventExportsAttempted: 0,
      eventExportsDelivered: 0,
      eventExportsFailed: 0,
      eventExportsBlocked: 0,
    };
  }

  const exportResult = await processOrganizerEventExports(db, env, organizer);

  // Send notifications — check generation before EACH send to minimise the
  // window for duplicate messages if a resync lands mid-loop.
  let sent = 0;
  let aborted = false;
  if (organizer.telegram_token && organizer.telegram_chat_id) {
    const sendAsChat =
      sqliteIntFlagIsOn(organizer.telegram_send_as_chat) &&
      organizerTargetSupportsSendAsChat(organizer);

    for (const notification of saleNotifications.values()) {
      const genBeforeSend = await getResyncGeneration(db, organizerId);
      if (genBeforeSend !== generationAtStart) {
        console.log(`[${VERSION}] Sync notifications aborted for organizer ${organizerId}: resync detected before send`);
        aborted = true;
        break;
      }

      const data = buildNotificationData(
        notification, eventCountCache, dealCountCache, dealsMap
      );
      const text = renderNotificationMessage(organizer, data, showEventName);

      await sendTelegram(
        organizer.telegram_token,
        organizer.telegram_chat_id,
        text,
        { sendAsChat }
      );
      sent += 1;
    }
  }

  // Atomic write: setSyncState only succeeds if resync_generation still matches.
  // If a resync happened at any point (including between the last genBeforeSend
  // check and now), this is a no-op and the next cron tick will bootstrap.
  const written = await setSyncState(db, organizerId, true, lastCursor, eventsSeeded, generationAtStart);
  if (!written) {
    console.log(`[${VERSION}] Sync state discarded for organizer ${organizerId}: resync detected at commit`);
    aborted = true;
  }

  return {
    processed: rows.length,
    notifications: sent,
    aborted,
    newEventsDiscovered: eventRegistry.discovered,
    newEventsQueued: eventRegistry.queued,
    eventExportsAttempted: exportResult.attempted,
    eventExportsDelivered: exportResult.delivered,
    eventExportsFailed: exportResult.failed,
    eventExportsBlocked: exportResult.blocked,
  };
}

// ---------------------------------------------------------------------------
// Cron handler — multi-tenant
// ---------------------------------------------------------------------------

async function runCron(db, env) {
  const { results: organizers } = await db
    .prepare(
      `SELECT * FROM organizers
       WHERE is_active = 1
         AND (last_checked_at = ''
              OR (julianday('now') - julianday(last_checked_at)) * 1440 >= check_interval)`
    )
    .all();

  console.log(`[${VERSION}] Cron tick: ${organizers.length} organizer(s) due`);

  const results = [];

  for (const organizer of organizers) {
    try {
      const syncState = await getSyncState(db, organizer.id);

      if (!syncState.bootstrapped) {
        await bootstrapOrganizer(db, organizer);
        results.push({
          organizerId: organizer.id,
          mode: "bootstrap",
          ok: true,
        });
      } else {
        const interval = toInt(organizer.check_interval) || DEFAULT_CHECK_INTERVAL;
        const maxPages = interval > 1 ? BOOTSTRAP_MAX_PAGES : SYNC_MAX_PAGES_PER_RUN;
        const syncResult = await syncOrganizer(db, env, organizer, maxPages);
        results.push({
          organizerId: organizer.id,
          mode: "sync",
          ok: true,
          ...syncResult,
        });
      }

      // Atomically update last_checked_at only if resync_generation hasn't
      // changed. If a resync happened, the WHERE won't match → no-op.
      await db
        .prepare("UPDATE organizers SET last_checked_at = datetime('now') WHERE id = ? AND resync_generation = ?")
        .bind(organizer.id, toInt(organizer.resync_generation))
        .run();
    } catch (error) {
      console.error(
        `[${VERSION}] Error for organizer ${organizer.id}:`,
        error instanceof Error ? error.message : error
      );
      results.push({
        organizerId: organizer.id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------

async function handleAuth(request, db) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const body = await request.json();
  const token = String(body.token || "").trim();

  if (!token) {
    return jsonResponse({ error: "Token requis" }, 400);
  }

  const organizerId = await validateShotgunToken(token);
  if (!organizerId) {
    return jsonResponse({ error: "Token invalide" }, 401);
  }

  // Upsert organizer
  await db
    .prepare(
      `INSERT INTO organizers (id, shotgun_token, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT (id)
       DO UPDATE SET shotgun_token = excluded.shotgun_token, updated_at = excluded.updated_at`
    )
    .bind(organizerId, token)
    .run();

  // Get full row
  const organizer = await db
    .prepare("SELECT * FROM organizers WHERE id = ?")
    .bind(organizerId)
    .first();

  return jsonResponse({
    ok: true,
    organizerId,
    telegramConfigured: !!(
      organizer.telegram_token && organizer.telegram_chat_id
    ),
  });
}

async function handleGetConfig(request, db) {
  const organizer = await authenticate(request, db);
  if (!organizer) return jsonResponse({ error: "Non autorise" }, 401);

  return jsonResponse({
    ok: true,
    organizerId: organizer.id,
    telegramToken: organizer.telegram_token,
    telegramChatId: organizer.telegram_chat_id,
    telegramChatTitle: organizer.telegram_chat_title || "",
    telegramChatType: organizer.telegram_chat_type || "",
    telegramSendAsChat: sqliteIntFlagIsOn(organizer.telegram_send_as_chat),
    messageTemplate: JSON.parse(organizer.message_template || "{}"),
    messageTemplateSettings: JSON.parse(
      organizer.message_template_settings || "{}"
    ),
    checkInterval: toInt(organizer.check_interval) || DEFAULT_CHECK_INTERVAL,
    isActive: organizer.is_active === 1,
  });
}

async function handleUpdateConfig(request, db) {
  const organizer = await authenticate(request, db);
  if (!organizer) return jsonResponse({ error: "Non autorise" }, 401);

  const body = await request.json();

  const updates = [];
  const binds = [];

  if (typeof body.telegramToken === "string") {
    updates.push("telegram_token = ?");
    binds.push(body.telegramToken.trim());
  }
  if (typeof body.telegramChatId === "string") {
    updates.push("telegram_chat_id = ?");
    binds.push(body.telegramChatId.trim());
  }
  if (typeof body.telegramChatTitle === "string") {
    updates.push("telegram_chat_title = ?");
    binds.push(body.telegramChatTitle.trim());
  }
  if (typeof body.telegramChatType === "string") {
    updates.push("telegram_chat_type = ?");
    binds.push(body.telegramChatType.trim());
  }
  if (typeof body.telegramSendAsChat === "boolean") {
    updates.push("telegram_send_as_chat = ?");
    binds.push(body.telegramSendAsChat ? 1 : 0);
  }
  if (body.messageTemplate !== undefined) {
    updates.push("message_template = ?");
    binds.push(JSON.stringify(body.messageTemplate));
  }
  if (body.messageTemplateSettings !== undefined) {
    updates.push("message_template_settings = ?");
    binds.push(JSON.stringify(body.messageTemplateSettings));
  }
  if (typeof body.checkInterval === "number" && CHECK_INTERVAL_OPTIONS.has(body.checkInterval)) {
    updates.push("check_interval = ?");
    binds.push(body.checkInterval);
  }

  if (updates.length === 0) {
    return jsonResponse({ error: "Rien a mettre a jour" }, 400);
  }

  updates.push("updated_at = datetime('now')");
  binds.push(organizer.id);

  await db
    .prepare(
      `UPDATE organizers SET ${updates.join(", ")} WHERE id = ?`
    )
    .bind(...binds)
    .run();

  return jsonResponse({ ok: true });
}

async function handleGetTemplate(request, db) {
  const organizer = await authenticate(request, db);
  if (!organizer) return jsonResponse({ error: "Non autorise" }, 401);

  let template;
  try {
    template = JSON.parse(organizer.message_template);
    if (!template || template.type !== "doc") throw new Error("invalid");
  } catch {
    template = DEFAULT_MESSAGE_TEMPLATE_CONTENT;
  }

  let settings;
  try {
    settings = normalizeMessageTemplateSettings(
      JSON.parse(organizer.message_template_settings)
    );
  } catch {
    settings = DEFAULT_MESSAGE_TEMPLATE_SETTINGS;
  }

  return jsonResponse({
    ok: true,
    messageTemplate: template,
    messageTemplateSettings: settings,
  });
}

async function handleUpdateTemplate(request, db) {
  const organizer = await authenticate(request, db);
  if (!organizer) return jsonResponse({ error: "Non autorise" }, 401);

  const body = await request.json();

  const updates = [];
  const binds = [];

  if (body.messageTemplate !== undefined) {
    updates.push("message_template = ?");
    binds.push(JSON.stringify(body.messageTemplate));
  }
  if (body.messageTemplateSettings !== undefined) {
    updates.push("message_template_settings = ?");
    binds.push(
      JSON.stringify(
        normalizeMessageTemplateSettings(body.messageTemplateSettings)
      )
    );
  }

  if (updates.length === 0) {
    return jsonResponse({ error: "Rien a mettre a jour" }, 400);
  }

  updates.push("updated_at = datetime('now')");
  binds.push(organizer.id);

  await db
    .prepare(
      `UPDATE organizers SET ${updates.join(", ")} WHERE id = ?`
    )
    .bind(...binds)
    .run();

  return jsonResponse({ ok: true });
}

async function handleTelegramTest(request, db) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const organizer = await authenticate(request, db);
  if (!organizer) return jsonResponse({ error: "Non autorise" }, 401);

  const tgToken = String(organizer.telegram_token || "").trim();
  const tgChatId = String(organizer.telegram_chat_id || "").trim();
  if (!tgToken || !tgChatId) {
    return jsonResponse(
      { error: "Telegram non configure (token et chat_id requis)" },
      400
    );
  }

  const sendAsChat =
    sqliteIntFlagIsOn(organizer.telegram_send_as_chat) &&
    organizerTargetSupportsSendAsChat(organizer);

  const text = sendAsChat
    ? "Message de test\nSi tu lis ceci, l'envoi fonctionne."
    : "Message de test\nSi tu lis ceci, l'envoi Telegram fonctionne.";

  try {
    await sendTelegram(tgToken, tgChatId, text, { sendAsChat });
  } catch (error) {
    console.error(`[${VERSION}] Telegram test error:`, error instanceof Error ? error.message : error);
    return jsonResponse(
      {
        ok: false,
        error: "Telegram send failed",
        sendAsChatAttempted: sendAsChat,
      },
      502
    );
  }

  return jsonResponse({ ok: true, sendAsChat });
}

async function handleDeleteAccount(request, db) {
  const organizer = await authenticate(request, db);
  if (!organizer) return jsonResponse({ error: "Non autorise" }, 401);

  await db.batch([
    db.prepare("DELETE FROM deal_counts WHERE organizer_id = ?").bind(organizer.id),
    db.prepare("DELETE FROM event_counts WHERE organizer_id = ?").bind(organizer.id),
    db.prepare("DELETE FROM tickets WHERE organizer_id = ?").bind(organizer.id),
    db.prepare("DELETE FROM sync_state WHERE organizer_id = ?").bind(organizer.id),
    db.prepare("DELETE FROM organizers WHERE id = ?").bind(organizer.id),
  ]);

  return jsonResponse({ ok: true });
}

// ---------------------------------------------------------------------------
// Feedback (Resend)
// ---------------------------------------------------------------------------

const FEEDBACK_TYPES = new Set(["bug", "feature"]);
const FEEDBACK_SENDER = "ShotNotif <noreply@fouzi-dev.fr>";
const FEEDBACK_RECIPIENT = "contact@fouzi-dev.fr";

async function handleFeedback(request, env) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Corps de requête invalide" }, 400);
  }
  const type = String(body.type || "").trim();
  const message = String(body.message || "").trim();
  const email = String(body.email || "").trim();

  if (!FEEDBACK_TYPES.has(type)) {
    return jsonResponse({ error: "Type invalide" }, 400);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "Email invalide" }, 400);
  }
  if (!message || message.length < 5) {
    return jsonResponse({ error: "Message trop court" }, 400);
  }
  if (message.length > 5000) {
    return jsonResponse({ error: "Message trop long" }, 400);
  }

  const subject =
    type === "bug"
      ? `[Bug Report] ShotNotif`
      : `[Feature Request] ShotNotif`;

  const text = [
    `Type: ${type}`,
    `Email: ${email || "non renseigné"}`,
    "",
    message,
  ].join("\n");

  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) {
    console.error(`[${VERSION}] RESEND_API_KEY not configured`);
    return jsonResponse({ error: "Service indisponible" }, 503);
  }

  const res = await fetchWithTimeout("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FEEDBACK_SENDER,
      to: [FEEDBACK_RECIPIENT],
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[${VERSION}] Resend error (${res.status}): ${err}`);
    return jsonResponse({ error: "Envoi échoué" }, 502);
  }

  return jsonResponse({ ok: true });
}

// ---------------------------------------------------------------------------
// Admin stats (restricted to ADMIN_ORG_ID)
// ---------------------------------------------------------------------------

const ADMIN_ORG_ID = "183206";

async function handleAdminStats(request, db) {
  const organizer = await authenticate(request, db);
  if (!organizer) return jsonResponse({ error: "Non autorise" }, 401);
  if (String(organizer.id) !== ADMIN_ORG_ID) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  const totalOrganizers = await db
    .prepare("SELECT COUNT(*) as count FROM organizers")
    .first();

  const activeOrganizers = await db
    .prepare(
      "SELECT COUNT(*) as count FROM organizers WHERE is_active = 1 AND telegram_token IS NOT NULL AND telegram_chat_id IS NOT NULL"
    )
    .first();

  const totalEvents = await db
    .prepare("SELECT COUNT(*) as count FROM event_counts")
    .first();

  const totalTickets = await db
    .prepare("SELECT COALESCE(SUM(count), 0) as count FROM deal_counts")
    .first();

  const recentOrganizers = await db
    .prepare(
      "SELECT id, telegram_chat_title, is_active, check_interval, created_at, updated_at FROM organizers ORDER BY created_at DESC LIMIT 10"
    )
    .all();

  return jsonResponse({
    ok: true,
    stats: {
      totalOrganizers: totalOrganizers.count,
      activeOrganizers: activeOrganizers.count,
      totalEvents: totalEvents.count,
      totalTickets: totalTickets.count,
    },
    recentOrganizers: recentOrganizers.results,
  });
}

// ---------------------------------------------------------------------------
// Resync — force a full recount from Shotgun for the authenticated organizer
// ---------------------------------------------------------------------------

async function handleResync(request, db) {
  const organizer = await authenticate(request, db);
  if (!organizer) return jsonResponse({ error: "Non autorise" }, 401);

  const organizerId = String(organizer.id);

  // Atomic batch:
  // 1. Increment resync_generation so any in-flight sync/bootstrap detects the
  //    invalidation and discards its results before writing to DB.
  // 2. Purge all stale counters and ticket tracking.
  // 3. Reset last_checked_at so the next cron tick triggers a fresh bootstrap.
  await db.batch([
    db.prepare("UPDATE organizers SET resync_generation = resync_generation + 1, last_checked_at = '' WHERE id = ?").bind(organizerId),
    db.prepare("DELETE FROM tickets WHERE organizer_id = ?").bind(organizerId),
    db.prepare("DELETE FROM event_counts WHERE organizer_id = ?").bind(organizerId),
    db.prepare("DELETE FROM deal_counts WHERE organizer_id = ?").bind(organizerId),
    db.prepare("DELETE FROM sync_state WHERE organizer_id = ?").bind(organizerId),
  ]);

  console.log(`[${VERSION}] Resync requested for organizer ${organizerId}: generation incremented, counters purged, bootstrap will run on next cron tick`);

  return jsonResponse({ ok: true, message: "Resync scheduled. Counters will be recalculated on the next check." });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function matchRoute(method, pathname) {
  const routes = [
    { method: "POST", path: "/api/auth", handler: handleAuth },
    { method: "GET", path: "/api/config", handler: handleGetConfig },
    { method: "PUT", path: "/api/config", handler: handleUpdateConfig },
    { method: "POST", path: "/api/telegram-test", handler: handleTelegramTest },
    { method: "GET", path: "/api/template", handler: handleGetTemplate },
    { method: "PUT", path: "/api/template", handler: handleUpdateTemplate },
    { method: "DELETE", path: "/api/account", handler: handleDeleteAccount },
    { method: "GET", path: "/api/admin/stats", handler: handleAdminStats },
    { method: "POST", path: "/api/resync", handler: handleResync },
  ];

  return routes.find((r) => r.method === method && r.path === pathname);
}

// ---------------------------------------------------------------------------
// Worker entry
// ---------------------------------------------------------------------------

const SENTRY_DSN =
  "https://5115235bd662c08eb9adb4a7b9768ae4@o4511158959931392.ingest.de.sentry.io/4511159575052368";

export default Sentry.withSentry(
  () => ({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.2,
  }),
  {
    async scheduled(_controller, env, ctx) {
      ctx.waitUntil(runCron(env.DB, env));
    },

    async fetch(request, env) {
      const allowedOrigins = parseAllowedOrigins(env);
      const requestOrigin = request.headers.get("Origin") || "";
      const corsOrigin = matchOrigin(allowedOrigins, requestOrigin);

      // Preflight
      if (request.method === "OPTIONS") {
        if (requestOrigin && !corsOrigin) {
          return new Response(null, { status: 403 });
        }
        return corsPreflightResponse(corsOrigin);
      }

      const url = new URL(request.url);

      // Health check (no CORS — useful for uptime monitoring)
      if (url.pathname === "/" || url.pathname === "/health") {
        return jsonResponse({ ok: true, version: VERSION });
      }

      // Block cross-origin API requests from unauthorized origins
      if (requestOrigin && !corsOrigin) {
        return new Response(JSON.stringify({ error: "Origin not allowed" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Rate limiting on sensitive endpoints
      if (RATE_LIMITS[url.pathname]) {
        const ip = getClientIp(request);
        const retryAfter = await checkRateLimit(env.DB, ip, url.pathname);
        if (retryAfter !== null) {
          return withCors(rateLimitResponse(retryAfter), corsOrigin);
        }
      }

      // All API responses get CORS headers for the allowed origin
      try {
        let response;

        // Feedback (needs env, not db)
        if (url.pathname === "/api/feedback" && request.method === "POST") {
          response = await handleFeedback(request, env);
        } else {
          const route = matchRoute(request.method, url.pathname);
          if (!route) {
            return withCors(jsonResponse({ error: "Not found" }, 404), corsOrigin);
          }
          response = await route.handler(request, env.DB);
        }

        return withCors(response, corsOrigin);
      } catch (error) {
        Sentry.captureException(error);
        console.error(`[${VERSION}] API error:`, error);
        return withCors(
          jsonResponse({ error: "Erreur interne" }, 500),
          corsOrigin
        );
      }
    },
  }
);
