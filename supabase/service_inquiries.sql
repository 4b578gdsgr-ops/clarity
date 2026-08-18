-- Run in Supabase SQL editor
-- Safe to run whether or not the table already exists (e.g. from before
-- the name/phone columns were added).

CREATE TABLE IF NOT EXISTS service_inquiries (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE service_inquiries ADD COLUMN IF NOT EXISTS name  TEXT;
ALTER TABLE service_inquiries ADD COLUMN IF NOT EXISTS phone TEXT;
