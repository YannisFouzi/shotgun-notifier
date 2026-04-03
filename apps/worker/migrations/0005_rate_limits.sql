-- Sliding window rate limiting per IP + endpoint
CREATE TABLE rate_limits (
  key        TEXT    PRIMARY KEY,
  count      INTEGER NOT NULL DEFAULT 1,
  window_start INTEGER NOT NULL
);
