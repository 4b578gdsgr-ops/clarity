-- Run in Supabase SQL editor
-- Tracks whether the Google review ask has already gone out for a booking,
-- so re-toggling payment_status (paid -> unpaid -> paid) doesn't re-send the
-- automated email, and so the admin "needs text" badge clears once the
-- review text has actually been copied/sent.

ALTER TABLE service_bookings
  ADD COLUMN IF NOT EXISTS review_ask_sent_at TIMESTAMPTZ;
