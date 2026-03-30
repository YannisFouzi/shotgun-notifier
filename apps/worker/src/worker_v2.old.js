const VERSION = "shotgun-notifier-v2";
const SHOTGUN_TICKETS_URL = "https://api.shotgun.live/tickets";
const SHOTGUN_EVENTS_URL = "https://smartboard-api.shotgun.live/api/shotgun/organizers";
const TELEGRAM_API_BASE = "https://api.telegram.org";

// Statuses that count as an active sold ticket.
const COUNTED_STATUSES = new Set(["valid", "resold"]);

const BOOTSTRAP_MAX_PAGES = 200;
const SYNC_MAX_PAGES_PER_RUN = 10;
const KV_WRITE_CHUNK_SIZE = 25;
const ORDER_MARKER_TTL_SECONDS = 60 * 60 * 24 * 400;

function isTruthy(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function toInt(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRequiredEnv(env, names) {
  for (const name of names) {
    if (env[name]) return env[name];
  }

  throw new Error(`Missing required secret/env: ${names.join(" or ")}`);
}

function getConfig(env) {
  const organizerId = String(getRequiredEnv(env, ["SG_ORG_ID"]));
  const shotgunToken = String(getRequiredEnv(env, ["SG_TOKEN", "SG_API_KEY"]));
  const telegramToken = String(getRequiredEnv(env, ["TELEGRAM_TOKEN"]));
  const telegramChatId = String(getRequiredEnv(env, ["TELEGRAM_CHAT_ID"]));
  const includeCohosted = isTruthy(env.SG_INCLUDE_COHOSTED, true);
  const prefix = `${organizerId}:v2:`;

  return {
    organizerId,
    shotgunToken,
    telegramToken,
    telegramChatId,
    includeCohosted,
    prefix,
  };
}

function shotgunHeaders(token) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function buildTicketsUrl(config, afterCursor, eventId) {
  const url = new URL(SHOTGUN_TICKETS_URL);
  url.searchParams.set("organizer_id", config.organizerId);

  if (eventId) {
    url.searchParams.set("event_id", eventId);
    url.searchParams.set("include_cohosted_events", "1");
  }

  if (afterCursor) {
    url.searchParams.set("after", afterCursor);
  }

  return url.toString();
}

async function fetchEvents(config) {
  const url = `${SHOTGUN_EVENTS_URL}/${config.organizerId}/events?key=${config.shotgunToken}`;
  const json = await fetchJson(url, {}, "Shotgun events list");
  const events = Array.isArray(json.data) ? json.data : [];

  const result = [];
  for (const e of events) {
    const deals = new Map();
    for (const d of (e.deals || [])) {
      deals.set(String(d.name || d.deal_title || ""), toInt(d.quantity));
    }
    result.push({ id: String(e.id), name: e.name || "", deals });
  }
  return result;
}

async function fetchJson(url, headers, label) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${label} failed (${response.status}): ${body}`);
  }

  return response.json();
}

function makeCursor(ticket) {
  const updatedAt = String(ticket.ticket_updated_at || ticket.ordered_at || "").trim();
  const ticketId = String(ticket.ticket_id || "").trim();

  if (!updatedAt || !ticketId) return "";
  return `${updatedAt}_${ticketId}`;
}

function makeTicketKey(config, ticketId) {
  return `${config.prefix}ticket:${ticketId}:counted`;
}

function makeEventCountKey(config, eventId) {
  return `${config.prefix}event:${eventId}:sold_count`;
}

function makeOrderMarkerKey(config, orderKey) {
  return `${config.prefix}order:${orderKey}:notified`;
}

function makeDealCountKey(config, eventId, dealTitle) {
  return `${config.prefix}event:${eventId}:deal:${dealTitle}:count`;
}

function makeMetaKey(config, name) {
  return `${config.prefix}meta:${name}`;
}

function isCountedStatus(status) {
  return COUNTED_STATUSES.has(String(status || "").trim().toLowerCase());
}

function getEventName(ticket) {
  const value =
    ticket.event_name ||
    ticket.event_title ||
    ticket.event_slug ||
    (ticket.event_id ? `Event #${ticket.event_id}` : "Event inconnu");

  return String(value);
}

function formatTelegramMessage({ showEventName, eventName, newCount, totalSold, dealLines }) {
  const lines = ["Nouvelle vente ShotNotif"];

  if (showEventName) {
    lines.push(eventName);
  }

  const label = newCount > 1 ? `${newCount} billets vendus` : "1 billet vendu";
  lines.push(`${label} : ${totalSold}`);

  for (const deal of dealLines) {
    const dealText = deal.max > 0
      ? `${deal.title} : ${deal.sold}/${deal.max}`
      : `${deal.title} : ${deal.sold}`;
    lines.push(dealText);
  }

  return lines.join("\n");
}

async function sendTelegram(config, text) {
  const url = `${TELEGRAM_API_BASE}/bot${config.telegramToken}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: config.telegramChatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendMessage failed (${response.status}): ${body}`);
  }
}

async function readEventCount(env, config, cache, eventId) {
  if (cache.has(eventId)) return cache.get(eventId);

  const stored = await env.SALES_KV.get(makeEventCountKey(config, eventId));
  const count = toInt(stored);
  cache.set(eventId, count);
  return count;
}

async function readTicketCounted(env, config, cache, ticketId) {
  if (cache.has(ticketId)) return cache.get(ticketId);

  const counted = (await env.SALES_KV.get(makeTicketKey(config, ticketId))) === "1";
  cache.set(ticketId, counted);
  return counted;
}

async function readOrderAlreadyNotified(env, config, cache, orderKey) {
  if (cache.has(orderKey)) return cache.get(orderKey);

  const notified = (await env.SALES_KV.get(makeOrderMarkerKey(config, orderKey))) === "1";
  cache.set(orderKey, notified);
  return notified;
}

async function applyKvWrites(env, operations) {
  for (let index = 0; index < operations.length; index += KV_WRITE_CHUNK_SIZE) {
    const chunk = operations.slice(index, index + KV_WRITE_CHUNK_SIZE);
    await Promise.all(
      chunk.map((operation) => {
        if (operation.type === "put") {
          return env.SALES_KV.put(operation.key, operation.value, operation.options);
        }

        return env.SALES_KV.delete(operation.key);
      })
    );
  }
}

async function collectTicketsForEvent(config, eventId, maxPages) {
  const headers = shotgunHeaders(config.shotgunToken);
  const rows = [];
  let nextUrl = buildTicketsUrl(config, "", eventId);
  let pages = 0;

  while (nextUrl) {
    pages += 1;
    if (pages > maxPages) {
      throw new Error(
        `Aborted: more than ${maxPages} pages for event ${eventId}`
      );
    }

    const json = await fetchJson(nextUrl, headers, `Shotgun tickets (event ${eventId})`);
    const pageRows = Array.isArray(json.data) ? json.data : [];
    rows.push(...pageRows);
    nextUrl = json?.pagination?.next || "";
  }

  return rows;
}

async function collectAllHistoricalTickets(config) {
  const events = await fetchEvents(config);
  console.log(`[${VERSION}] Found ${events.length} events to bootstrap`);

  const rows = [];
  for (const event of events) {
    const eventRows = await collectTicketsForEvent(config, event.id, BOOTSTRAP_MAX_PAGES);
    rows.push(...eventRows);
  }

  return rows;
}

async function bootstrap(env, config) {
  console.log(`[${VERSION}] Bootstrap started for organizer ${config.organizerId}`);

  const historicalRows = await collectAllHistoricalTickets(config);
  const eventCounts = new Map();
  const dealCounts = new Map();
  const ticketIdsToMark = [];
  let lastCursor = "";

  for (const ticket of historicalRows) {
    const ticketId = String(ticket.ticket_id || "");
    const eventId = String(ticket.event_id || "");
    const dealTitle = String(ticket.deal_title || "");
    lastCursor = makeCursor(ticket) || lastCursor;

    if (!ticketId || !eventId) continue;
    if (!isCountedStatus(ticket.ticket_status)) continue;

    ticketIdsToMark.push(ticketId);
    eventCounts.set(eventId, (eventCounts.get(eventId) || 0) + 1);

    if (dealTitle) {
      const dealKey = `${eventId}:${dealTitle}`;
      dealCounts.set(dealKey, (dealCounts.get(dealKey) || 0) + 1);
    }
  }

  const operations = [];

  for (const ticketId of ticketIdsToMark) {
    operations.push({
      type: "put",
      key: makeTicketKey(config, ticketId),
      value: "1",
    });
  }

  for (const [eventId, count] of eventCounts.entries()) {
    operations.push({
      type: "put",
      key: makeEventCountKey(config, eventId),
      value: String(count),
    });
  }

  for (const [dealKey, count] of dealCounts.entries()) {
    const [eventId, ...rest] = dealKey.split(":");
    const dealTitle = rest.join(":");
    operations.push({
      type: "put",
      key: makeDealCountKey(config, eventId, dealTitle),
      value: String(count),
    });
  }

  operations.push({
    type: "put",
    key: makeMetaKey(config, "cursor"),
    value: lastCursor,
  });
  operations.push({
    type: "put",
    key: makeMetaKey(config, "bootstrapped"),
    value: "1",
  });

  await applyKvWrites(env, operations);

  console.log(
    `[${VERSION}] Bootstrap completed: ${historicalRows.length} historical rows, ${eventCounts.size} events`
  );
}

async function fetchIncrementalRows(config, cursor) {
  const events = await fetchEvents(config);
  const headers = shotgunHeaders(config.shotgunToken);
  const rows = [];

  for (const event of events) {
    let nextUrl = buildTicketsUrl(config, cursor, event.id);
    let pages = 0;

    while (nextUrl && pages < SYNC_MAX_PAGES_PER_RUN) {
      pages += 1;
      const json = await fetchJson(nextUrl, headers, `Shotgun incremental (event ${event.id})`);
      const pageRows = Array.isArray(json.data) ? json.data : [];
      rows.push(...pageRows);
      nextUrl = json?.pagination?.next || "";
    }
  }

  return { rows, events };
}

async function readDealCount(env, config, cache, eventId, dealTitle) {
  const cacheKey = `${eventId}:${dealTitle}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const stored = await env.SALES_KV.get(makeDealCountKey(config, eventId, dealTitle));
  const count = toInt(stored);
  cache.set(cacheKey, count);
  return count;
}

async function syncUpdates(env, config) {
  const cursorKey = makeMetaKey(config, "cursor");
  const currentCursor = (await env.SALES_KV.get(cursorKey)) || "";
  const { rows, events } = await fetchIncrementalRows(config, currentCursor);

  if (rows.length === 0) {
    return { processedRows: 0, notifications: 0 };
  }

  const showEventName = events.length > 1;
  const dealsMap = new Map();
  for (const event of events) {
    dealsMap.set(event.id, event.deals);
  }

  const eventCountCache = new Map();
  const dealCountCache = new Map();
  const ticketCountedCache = new Map();
  const dirtyEventIds = new Set();
  const dirtyDeals = new Set();
  const ticketMutations = new Map();
  const saleNotifications = new Map();
  let lastCursor = currentCursor;

  for (const ticket of rows) {
    const ticketId = String(ticket.ticket_id || "");
    const eventId = String(ticket.event_id || "");
    const orderId = String(ticket.order_id || ticket.ticket_id || "");
    const dealTitle = String(ticket.deal_title || "");
    const nextCursor = makeCursor(ticket);

    if (nextCursor) lastCursor = nextCursor;
    if (!ticketId || !eventId || !orderId) continue;

    const previousCounted = await readTicketCounted(
      env,
      config,
      ticketCountedCache,
      ticketId
    );
    const nextCounted = isCountedStatus(ticket.ticket_status);

    if (previousCounted !== nextCounted) {
      const currentCount = await readEventCount(env, config, eventCountCache, eventId);
      const nextCount = nextCounted
        ? currentCount + 1
        : Math.max(0, currentCount - 1);

      eventCountCache.set(eventId, nextCount);
      ticketCountedCache.set(ticketId, nextCounted);
      ticketMutations.set(ticketId, nextCounted);
      dirtyEventIds.add(eventId);

      if (dealTitle) {
        const dealCacheKey = `${eventId}:${dealTitle}`;
        const currentDealCount = await readDealCount(env, config, dealCountCache, eventId, dealTitle);
        const nextDealCount = nextCounted
          ? currentDealCount + 1
          : Math.max(0, currentDealCount - 1);
        dealCountCache.set(dealCacheKey, nextDealCount);
        dirtyDeals.add(dealCacheKey);
      }
    }

    if (!previousCounted && nextCounted) {
      const existing = saleNotifications.get(eventId);
      if (existing) {
        existing.newCount += 1;
        if (dealTitle) {
          existing.newDeals.set(dealTitle, (existing.newDeals.get(dealTitle) || 0) + 1);
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

  let sentNotifications = 0;

  for (const notification of saleNotifications.values()) {
    const totalSold = eventCountCache.get(notification.eventId) || 0;
    const eventDeals = dealsMap.get(notification.eventId);
    const dealLines = [];

    for (const [title] of notification.newDeals) {
      const dealCacheKey = `${notification.eventId}:${title}`;
      const sold = dealCountCache.get(dealCacheKey) || 0;
      const max = eventDeals ? (eventDeals.get(title) || 0) : 0;
      dealLines.push({ title, sold, max });
    }

    await sendTelegram(
      config,
      formatTelegramMessage({
        showEventName,
        eventName: notification.eventName,
        newCount: notification.newCount,
        totalSold,
        dealLines,
      })
    );

    sentNotifications += 1;
  }

  const operations = [];

  for (const [ticketId, counted] of ticketMutations.entries()) {
    operations.push(
      counted
        ? {
            type: "put",
            key: makeTicketKey(config, ticketId),
            value: "1",
          }
        : {
            type: "delete",
            key: makeTicketKey(config, ticketId),
          }
    );
  }

  for (const eventId of dirtyEventIds) {
    operations.push({
      type: "put",
      key: makeEventCountKey(config, eventId),
      value: String(eventCountCache.get(eventId) || 0),
    });
  }

  for (const dealCacheKey of dirtyDeals) {
    const [eventId, ...rest] = dealCacheKey.split(":");
    const dealTitle = rest.join(":");
    operations.push({
      type: "put",
      key: makeDealCountKey(config, eventId, dealTitle),
      value: String(dealCountCache.get(dealCacheKey) || 0),
    });
  }

  operations.push({
    type: "put",
    key: cursorKey,
    value: lastCursor,
  });

  await applyKvWrites(env, operations);

  return {
    processedRows: rows.length,
    notifications: sentNotifications,
  };
}

async function runNotifier(env) {
  const config = getConfig(env);
  const bootstrappedKey = makeMetaKey(config, "bootstrapped");
  const isBootstrapped = (await env.SALES_KV.get(bootstrappedKey)) === "1";

  if (!isBootstrapped) {
    await bootstrap(env, config);
    return {
      version: VERSION,
      organizerId: config.organizerId,
      bootstrapped: true,
      mode: "bootstrap",
    };
  }

  const syncResult = await syncUpdates(env, config);
  return {
    version: VERSION,
    organizerId: config.organizerId,
    bootstrapped: true,
    mode: "sync",
    ...syncResult,
  };
}

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(runNotifier(env));
  },

  async fetch(_request, env) {
    try {
      const config = getConfig(env);
      const bootstrapped = (await env.SALES_KV.get(makeMetaKey(config, "bootstrapped"))) === "1";
      const cursor = (await env.SALES_KV.get(makeMetaKey(config, "cursor"))) || "";

      return new Response(
        JSON.stringify(
          {
            ok: true,
            version: VERSION,
            organizerId: config.organizerId,
            includeCohosted: config.includeCohosted,
            bootstrapped,
            hasCursor: cursor !== "",
          },
          null,
          2
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify(
          {
            ok: false,
            version: VERSION,
            error: error instanceof Error ? error.message : String(error),
          },
          null,
          2
        ),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
