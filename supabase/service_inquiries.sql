-- Run in Supabase SQL editor

CREATE TABLE service_inquiries (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
