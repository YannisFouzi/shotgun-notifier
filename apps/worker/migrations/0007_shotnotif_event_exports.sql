-- Track whether the event discovery registry has been initialized for an organizer.
ALTER TABLE sync_state ADD COLUMN events_seeded INTEGER NOT NULL DEFAULT 0;

-- Registry of Shotgun events discovered by the worker plus personal Merci Lille export state.
CREATE TABLE organizer_events (
  organizer_id                 TEXT    NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  event_id                     TEXT    NOT NULL,
  event_name                   TEXT    NOT NULL DEFAULT '',
  first_seen_at                TEXT    NOT NULL DEFAULT '',
  last_seen_at                 TEXT    NOT NULL DEFAULT '',
  integration_status           TEXT    NOT NULL DEFAULT 'known',
  integration_attempts         INTEGER NOT NULL DEFAULT 0,
  integration_request_id       TEXT    NOT NULL DEFAULT '',
  next_retry_at                TEXT    NOT NULL DEFAULT '',
  last_integration_attempt_at  TEXT    NOT NULL DEFAULT '',
  integrated_at                TEXT    NOT NULL DEFAULT '',
  last_integration_error       TEXT    NOT NULL DEFAULT '',
  PRIMARY KEY (organizer_id, event_id)
);

CREATE INDEX idx_organizer_events_retry
  ON organizer_events (organizer_id, integration_status, next_retry_at);
