-- Run in Supabase SQL editor
-- Supports the improved Phone Leads flow: call duration on leads, and a
-- traceable link from a booking back to the lead it was created from (so
-- the admin UI can prompt a manual "needs text" follow-up, since automatic
-- SMS delivery isn't yet reliable while Twilio toll-free verification is
-- pending).

ALTER TABLE phone_leads
  ADD COLUMN IF NOT EXISTS call_duration_seconds INTEGER;

ALTER TABLE service_bookings
  ADD COLUMN IF NOT EXISTS phone_lead_id UUID REFERENCES phone_leads(id);

CREATE INDEX IF NOT EXISTS service_bookings_phone_lead_idx ON service_bookings(phone_lead_id);
