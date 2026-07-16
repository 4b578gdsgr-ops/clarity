-- Run in Supabase SQL editor
-- Tracks whether a completed/cancelled booking's photos & videos have already
-- been purged by the 90-day cleanup job, so the job doesn't keep re-scanning
-- (and re-touching) bookings whose media is already gone. The booking record
-- itself, inspection checklist data, messages, and phone leads are never deleted.

ALTER TABLE service_bookings
  ADD COLUMN IF NOT EXISTS media_purged_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS service_bookings_media_purged_idx ON service_bookings(media_purged_at);
