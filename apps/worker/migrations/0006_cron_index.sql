-- Speed up the cron query that filters on is_active + last_checked_at
CREATE INDEX idx_organizers_cron ON organizers (is_active, last_checked_at);
