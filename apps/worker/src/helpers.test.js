import { describe, it, expect } from "vitest";
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
} from "./helpers.js";

// ---------------------------------------------------------------------------
// toInt
// ---------------------------------------------------------------------------
describe("toInt", () => {
  it("parses valid integers", () => {
    expect(toInt(42)).toBe(42);
    expect(toInt("100")).toBe(100);
    expect(toInt("0")).toBe(0);
  });

  it("parses floats", () => {
    expect(toInt(3.14)).toBe(3.14);
  });

  it("returns 0 for non-numeric values", () => {
    expect(toInt(null)).toBe(0);
    expect(toInt(undefined)).toBe(0);
    expect(toInt("abc")).toBe(0);
    expect(toInt("")).toBe(0);
    expect(toInt(NaN)).toBe(0);
    expect(toInt(Infinity)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// isCountedStatus
// ---------------------------------------------------------------------------
describe("isCountedStatus", () => {
  it("counts valid and resold", () => {
    expect(isCountedStatus("valid")).toBe(true);
    expect(isCountedStatus("resold")).toBe(true);
  });

  it("is case-insensitive and trims", () => {
    expect(isCountedStatus("VALID")).toBe(true);
    expect(isCountedStatus("  Resold  ")).toBe(true);
  });

  it("rejects other statuses", () => {
    expect(isCountedStatus("cancelled")).toBe(false);
    expect(isCountedStatus("pending")).toBe(false);
    expect(isCountedStatus("")).toBe(false);
    expect(isCountedStatus(null)).toBe(false);
    expect(isCountedStatus(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseAllowedOrigins / matchOrigin
// ---------------------------------------------------------------------------
describe("parseAllowedOrigins", () => {
  it("uses default when no env", () => {
    const origins = parseAllowedOrigins({});
    expect(origins.has("https://shotnotif.vercel.app")).toBe(true);
    expect(origins.size).toBe(1);
  });

  it("parses comma-separated origins", () => {
    const origins = parseAllowedOrigins({
      ALLOWED_ORIGINS: "https://a.com, https://b.com , https://c.com",
    });
    expect(origins.size).toBe(3);
    expect(origins.has("https://a.com")).toBe(true);
    expect(origins.has("https://b.com")).toBe(true);
    expect(origins.has("https://c.com")).toBe(true);
  });

  it("filters empty entries", () => {
    const origins = parseAllowedOrigins({
      ALLOWED_ORIGINS: "https://a.com,,, https://b.com,",
    });
    expect(origins.size).toBe(2);
  });
});

describe("matchOrigin", () => {
  const origins = new Set(["https://a.com", "https://b.com"]);

  it("returns origin when it matches", () => {
    expect(matchOrigin(origins, "https://a.com")).toBe("https://a.com");
  });

  it("returns null for unknown origin", () => {
    expect(matchOrigin(origins, "https://evil.com")).toBeNull();
  });

  it("returns null for empty origin", () => {
    expect(matchOrigin(origins, "")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getOrganizerIdFromToken
// ---------------------------------------------------------------------------
describe("getOrganizerIdFromToken", () => {
  it("extracts organizerId from JWT payload", () => {
    // payload: {"organizerId":183206}
    const payload = btoa(JSON.stringify({ organizerId: 183206 }));
    const token = `header.${payload}.signature`;
    expect(getOrganizerIdFromToken(token)).toBe("183206");
  });

  it("returns empty for token without organizerId", () => {
    const payload = btoa(JSON.stringify({ sub: "user1" }));
    const token = `header.${payload}.signature`;
    expect(getOrganizerIdFromToken(token)).toBe("");
  });

  it("returns empty for invalid token", () => {
    expect(getOrganizerIdFromToken("")).toBe("");
    expect(getOrganizerIdFromToken("no-dots")).toBe("");
    expect(getOrganizerIdFromToken("a.!!!.c")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// makeCursor
// ---------------------------------------------------------------------------
describe("makeCursor", () => {
  it("builds cursor from ticket_updated_at and ticket_id", () => {
    const ticket = { ticket_updated_at: "2026-01-01T00:00:00Z", ticket_id: "42" };
    expect(makeCursor(ticket)).toBe("2026-01-01T00:00:00Z_42");
  });

  it("falls back to ordered_at", () => {
    const ticket = { ordered_at: "2026-02-01", ticket_id: "99" };
    expect(makeCursor(ticket)).toBe("2026-02-01_99");
  });

  it("returns empty when data is missing", () => {
    expect(makeCursor({})).toBe("");
    expect(makeCursor({ ticket_updated_at: "2026-01-01" })).toBe("");
    expect(makeCursor({ ticket_id: "42" })).toBe("");
  });
});

// ---------------------------------------------------------------------------
// getEventName
// ---------------------------------------------------------------------------
describe("getEventName", () => {
  it("uses event_name first", () => {
    expect(getEventName({ event_name: "Festival", event_title: "Fest" })).toBe("Festival");
  });

  it("falls back to event_title", () => {
    expect(getEventName({ event_title: "Concert" })).toBe("Concert");
  });

  it("falls back to event_slug", () => {
    expect(getEventName({ event_slug: "my-event" })).toBe("my-event");
  });

  it("falls back to Event #id", () => {
    expect(getEventName({ event_id: 123 })).toBe("Event #123");
  });

  it("returns Event inconnu when nothing available", () => {
    expect(getEventName({})).toBe("Event inconnu");
  });
});

// ---------------------------------------------------------------------------
// toTelegramIntegerChatId
// ---------------------------------------------------------------------------
describe("toTelegramIntegerChatId", () => {
  it("parses positive integer", () => {
    expect(toTelegramIntegerChatId("604071592")).toBe(604071592);
  });

  it("parses negative integer (group chat)", () => {
    expect(toTelegramIntegerChatId("-1001234567890")).toBe(-1001234567890);
  });

  it("returns null for non-integer", () => {
    expect(toTelegramIntegerChatId("abc")).toBeNull();
    expect(toTelegramIntegerChatId("12.34")).toBeNull();
    expect(toTelegramIntegerChatId("")).toBeNull();
    expect(toTelegramIntegerChatId(null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// sqliteIntFlagIsOn
// ---------------------------------------------------------------------------
describe("sqliteIntFlagIsOn", () => {
  it("truthy values", () => {
    expect(sqliteIntFlagIsOn(1)).toBe(true);
    expect(sqliteIntFlagIsOn(true)).toBe(true);
    expect(sqliteIntFlagIsOn("1")).toBe(true);
  });

  it("falsy values", () => {
    expect(sqliteIntFlagIsOn(0)).toBe(false);
    expect(sqliteIntFlagIsOn(false)).toBe(false);
    expect(sqliteIntFlagIsOn("0")).toBe(false);
    expect(sqliteIntFlagIsOn(null)).toBe(false);
    expect(sqliteIntFlagIsOn(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// organizerTargetSupportsSendAsChat
// ---------------------------------------------------------------------------
describe("organizerTargetSupportsSendAsChat", () => {
  it("returns true for channels", () => {
    expect(organizerTargetSupportsSendAsChat({ telegram_chat_type: "channel" })).toBe(true);
    expect(organizerTargetSupportsSendAsChat({ telegram_chat_type: "Channel" })).toBe(true);
  });

  it("returns false for groups and others", () => {
    expect(organizerTargetSupportsSendAsChat({ telegram_chat_type: "group" })).toBe(false);
    expect(organizerTargetSupportsSendAsChat({ telegram_chat_type: "supergroup" })).toBe(false);
    expect(organizerTargetSupportsSendAsChat({ telegram_chat_type: "" })).toBe(false);
    expect(organizerTargetSupportsSendAsChat({})).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildTicketsUrl
// ---------------------------------------------------------------------------
describe("buildTicketsUrl", () => {
  it("builds URL with organizer_id", () => {
    const url = buildTicketsUrl("123", "", "");
    expect(url).toContain("organizer_id=123");
    expect(url).not.toContain("event_id");
    expect(url).not.toContain("after");
  });

  it("includes event_id and include_cohosted_events", () => {
    const url = buildTicketsUrl("123", "", "456");
    expect(url).toContain("event_id=456");
    expect(url).toContain("include_cohosted_events=1");
  });

  it("includes cursor", () => {
    const url = buildTicketsUrl("123", "cursor_abc", "456");
    expect(url).toContain("after=cursor_abc");
  });
});

// ---------------------------------------------------------------------------
// buildNotificationData
// ---------------------------------------------------------------------------
describe("buildNotificationData", () => {
  it("builds correct data for a single deal", () => {
    const notification = {
      eventId: "E1",
      eventName: "Festival",
      newCount: 3,
      newDeals: new Map([["VIP", 3]]),
    };
    const eventCountCache = new Map([["E1", 50]]);
    const dealCountCache = new Map([["E1:VIP", 10]]);
    const dealsMap = new Map([["E1", new Map([["VIP", 100]])]]);

    const data = buildNotificationData(notification, eventCountCache, dealCountCache, dealsMap);

    expect(data.event_name).toBe("Festival");
    expect(data.event_id).toBe("E1");
    expect(data.new_tickets_count).toBe("3");
    expect(data.new_tickets_label).toBe("3 billets vendus");
    expect(data.event_total_sold).toBe("50");
    expect(data.deal_lines).toBe("VIP : 10/100");
    expect(data.first_deal_name).toBe("VIP");
    expect(data.first_deal_sold).toBe("10");
  });

  it("singular label for 1 ticket", () => {
    const notification = {
      eventId: "E1",
      eventName: "Concert",
      newCount: 1,
      newDeals: new Map(),
    };
    const data = buildNotificationData(notification, new Map(), new Map(), new Map());
    expect(data.new_tickets_label).toBe("1 billet vendu");
  });

  it("omits max when deal quota is 0", () => {
    const notification = {
      eventId: "E1",
      eventName: "Test",
      newCount: 1,
      newDeals: new Map([["GA", 1]]),
    };
    const dealCountCache = new Map([["E1:GA", 5]]);
    const dealsMap = new Map([["E1", new Map([["GA", 0]])]]);

    const data = buildNotificationData(notification, new Map([["E1", 5]]), dealCountCache, dealsMap);
    expect(data.deal_lines).toBe("GA : 5");
  });
});

// ---------------------------------------------------------------------------
// isValidCheckInterval
// ---------------------------------------------------------------------------
describe("isValidCheckInterval", () => {
  it("accepts valid intervals", () => {
    expect(isValidCheckInterval(1)).toBe(true);
    expect(isValidCheckInterval(5)).toBe(true);
    expect(isValidCheckInterval(10080)).toBe(true);
  });

  it("rejects invalid intervals", () => {
    expect(isValidCheckInterval(0)).toBe(false);
    expect(isValidCheckInterval(2)).toBe(false);
    expect(isValidCheckInterval(999)).toBe(false);
    expect(isValidCheckInterval(-1)).toBe(false);
  });
});
