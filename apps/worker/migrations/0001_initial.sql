-- Shotgun Notifier — initial D1 schema

CREATE TABLE organizers (
  id             TEXT    PRIMARY KEY,                           -- organizer_id from Shotgun JWT
  shotgun_token  TEXT    NOT NULL,
  telegram_token TEXT    NOT NULL DEFAULT '',
  telegram_chat_id TEXT  NOT NULL DEFAULT '',
  message_template TEXT  NOT NULL DEFAULT '{}',                 -- JSONContent from TipTap
  message_template_settings TEXT NOT NULL DEFAULT '{}',         -- MessageTemplateSettings JSON
  is_active      INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sync_state (
  organizer_id   TEXT    PRIMARY KEY REFERENCES organizers(id) ON DELETE CASCADE,
  bootstrapped   INTEGER NOT NULL DEFAULT 0,
  cursor         TEXT    NOT NULL DEFAULT '',
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE tickets (
  ticket_id      TEXT    NOT NULL,
  organizer_id   TEXT    NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  event_id       TEXT    NOT NULL,
  deal_title     TEXT    NOT NULL DEFAULT '',
  counted        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (organizer_id, ticket_id)
);

CREATE INDEX idx_tickets_event ON tickets (organizer_id, event_id);

CREATE TABLE event_counts (
  organizer_id   TEXT    NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  event_id       TEXT    NOT NULL,
  sold_count     INTEGER NOT NULL DEFAULT 0,
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (organizer_id, event_id)
);

CREATE TABLE deal_counts (
  organizer_id   TEXT    NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  event_id       TEXT    NOT NULL,
  deal_title     TEXT    NOT NULL,
  count          INTEGER NOT NULL DEFAULT 0,
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (organizer_id, event_id, deal_title)
);
