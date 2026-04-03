-- Per-user check frequency: how often (in minutes) the cron should sync this organizer
ALTER TABLE organizers ADD COLUMN check_interval INTEGER NOT NULL DEFAULT 1;

-- Timestamp of the last successful cron check for this organizer
ALTER TABLE organizers ADD COLUMN last_checked_at TEXT NOT NULL DEFAULT '';
