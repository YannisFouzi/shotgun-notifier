import {
  renderMessageTemplateWithData,
  normalizeMessageTemplateSettings,
  DEFAULT_MESSAGE_TEMPLATE_CONTENT,
  DEFAULT_MESSAGE_TEMPLATE_SETTINGS,
} from "@shotgun-notifier/shared";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VERSION = "shotgun-notifier-v3";
const SHOTGUN_TICKETS_URL = "https://api.shotgun.live/tickets";
const SHOTGUN_EVENTS_URL =
  "https://smartboard-api.shotgun.live/api/shotgun/organizers";
const TELEGRAM_API_BASE = "https://api.telegram.org";

const COUNTED_STATUSES = new Set(["valid", "resold"]);
const BOOTSTRAP_MAX_PAGES = 200;
const SYNC_MAX_PAGES_PER_RUN = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toInt(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isCountedStatus(status) {
  return COUNTED_STATUSES.has(String(status || "").trim().toLowerCase());
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function corsPreflightResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// ---------------------------------------------------------------------------
// Shotgun token helpers
// ---------------------------------------------------------------------------

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return atob(padded);
}

function getOrganizerIdFromToken(token) {
  const [, payload = ""] = token.trim().split(".");
  if (!payload) return "";

  try {
    const parsed = JSON.parse(decodeBase64Url(payload));
    return parsed.organizerId ? String(parsed.organizerId) : "";
  } catch {
    return "";
  }
}

async function validateShotgunToken(token) {
  const organizerId = getOrganizerIdFromToken(token);
  if (!organizerId) return null;

  const url = `${SHOTGUN_EVENTS_URL}/${organizerId}/events?key=${token.trim()}`;
  const res = await fetch(url);

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
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${label} failed (${response.status}): ${body}`);
  }
  return response.json();
}

function buildTicketsUrl(organizerId, afterCursor, eventId) {
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

function makeCursor(ticket) {
  const updatedAt = String(
    ticket.ticket_updated_at || ticket.ordered_at || ""
  ).trim();
  const ticketId = String(ticket.ticket_id || "").trim();
  if (!updatedAt || !ticketId) return "";
  return `${updatedAt}_${ticketId}`;
}

function getEventName(ticket) {
  return String(
    ticket.event_name ||
      ticket.event_title ||
      ticket.event_slug ||
      (ticket.event_id ? `Event #${ticket.event_id}` : "Event inconnu")
  );
}

// ---------------------------------------------------------------------------
// D1 data access
// ---------------------------------------------------------------------------

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
  return row || { organizer_id: organizerId, bootstrapped: 0, cursor: "" };
}

async function setSyncState(db, organizerId, bootstrapped, cursor) {
  await db
    .prepare(
      `INSERT INTO sync_state (organizer_id, bootstrapped, cursor, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT (organizer_id)
       DO UPDATE SET bootstrapped = excluded.bootstrapped, cursor = excluded.cursor, updated_at = excluded.updated_at`
    )
    .bind(organizerId, bootstrapped ? 1 : 0, cursor)
    .run();
}

// ---------------------------------------------------------------------------
// Telegram
// ---------------------------------------------------------------------------

async function sendTelegram(telegramToken, chatId, text) {
  const url = `${TELEGRAM_API_BASE}/bot${telegramToken}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
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

function buildNotificationData(notification, eventCountCache, dealCountCache, dealsMap) {
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
    const lines = ["Nouvelle vente ShotNotif"];
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
  console.log(`[${VERSION}] Bootstrap started for organizer ${organizerId}`);

  const events = await fetchEvents(organizerId, shotgunToken);
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

  await setSyncState(db, organizerId, true, lastCursor);

  console.log(
    `[${VERSION}] Bootstrap completed for ${organizerId}: ${allRows.length} tickets, ${eventCounts.size} events`
  );
}

// ---------------------------------------------------------------------------
// Incremental sync
// ---------------------------------------------------------------------------

async function syncOrganizer(db, organizer) {
  const { id: organizerId, shotgun_token: shotgunToken } = organizer;
  const syncState = await getSyncState(db, organizerId);
  const cursor = syncState.cursor || "";

  const events = await fetchEvents(organizerId, shotgunToken);
  const headers = shotgunHeaders(shotgunToken);
  const rows = [];

  for (const event of events) {
    let nextUrl = buildTicketsUrl(organizerId, cursor, event.id);
    let pages = 0;

    while (nextUrl && pages < SYNC_MAX_PAGES_PER_RUN) {
      pages += 1;
      const json = await fetchJson(
        nextUrl, headers, `Shotgun incremental (event ${event.id})`
      );
      rows.push(...(Array.isArray(json.data) ? json.data : []));
      nextUrl = json?.pagination?.next || "";
    }
  }

  if (rows.length === 0) return { processed: 0, notifications: 0 };

  const showEventName = events.length > 1;
  const dealsMap = new Map();
  for (const event of events) {
    dealsMap.set(event.id, event.deals);
  }

  // In-memory caches for this sync run
  const eventCountCache = new Map();
  const dealCountCache = new Map();
  const saleNotifications = new Map();
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

      await setTicketCounted(db, organizerId, ticketId, eventId, dealTitle, nextCounted);
      await setEventCount(db, organizerId, eventId, nextCount);

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
        await setDealCount(db, organizerId, eventId, dealTitle, nextDealCount);
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

  // Send notifications
  let sent = 0;
  if (organizer.telegram_token && organizer.telegram_chat_id) {
    for (const notification of saleNotifications.values()) {
      const data = buildNotificationData(
        notification, eventCountCache, dealCountCache, dealsMap
      );
      const text = renderNotificationMessage(organizer, data, showEventName);

      await sendTelegram(
        organizer.telegram_token,
        organizer.telegram_chat_id,
        text
      );
      sent += 1;
    }
  }

  await setSyncState(db, organizerId, true, lastCursor);

  return { processed: rows.length, notifications: sent };
}

// ---------------------------------------------------------------------------
// Cron handler — multi-tenant
// ---------------------------------------------------------------------------

async function runCron(db) {
  const { results: organizers } = await db
    .prepare("SELECT * FROM organizers WHERE is_active = 1")
    .all();

  console.log(`[${VERSION}] Cron tick: ${organizers.length} active organizer(s)`);

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
        const syncResult = await syncOrganizer(db, organizer);
        results.push({
          organizerId: organizer.id,
          mode: "sync",
          ok: true,
          ...syncResult,
        });
      }
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
    messageTemplate: JSON.parse(organizer.message_template || "{}"),
    messageTemplateSettings: JSON.parse(
      organizer.message_template_settings || "{}"
    ),
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
  if (body.messageTemplate !== undefined) {
    updates.push("message_template = ?");
    binds.push(JSON.stringify(body.messageTemplate));
  }
  if (body.messageTemplateSettings !== undefined) {
    updates.push("message_template_settings = ?");
    binds.push(JSON.stringify(body.messageTemplateSettings));
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
// Router
// ---------------------------------------------------------------------------

function matchRoute(method, pathname) {
  const routes = [
    { method: "POST", path: "/api/auth", handler: handleAuth },
    { method: "GET", path: "/api/config", handler: handleGetConfig },
    { method: "PUT", path: "/api/config", handler: handleUpdateConfig },
    { method: "GET", path: "/api/template", handler: handleGetTemplate },
    { method: "PUT", path: "/api/template", handler: handleUpdateTemplate },
    { method: "DELETE", path: "/api/account", handler: handleDeleteAccount },
  ];

  return routes.find((r) => r.method === method && r.path === pathname);
}

// ---------------------------------------------------------------------------
// Worker entry
// ---------------------------------------------------------------------------

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(runCron(env.DB));
  },

  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return corsPreflightResponse();
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/" || url.pathname === "/health") {
      return jsonResponse({ ok: true, version: VERSION });
    }

    const route = matchRoute(request.method, url.pathname);

    if (!route) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    try {
      return await route.handler(request, env.DB);
    } catch (error) {
      console.error(`[${VERSION}] API error:`, error);
      return jsonResponse(
        {
          error: "Erreur interne",
          details:
            error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  },
};
