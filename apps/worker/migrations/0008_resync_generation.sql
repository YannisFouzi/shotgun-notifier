-- Add a generation counter to detect concurrent resync during cron runs.
-- Incremented by /api/resync; checked by syncOrganizer/bootstrapOrganizer
-- before writing results to avoid stale data overwrites.

ALTER TABLE organizers ADD COLUMN resync_generation INTEGER NOT NULL DEFAULT 0;
