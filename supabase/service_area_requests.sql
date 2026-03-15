-- Run in Supabase SQL editor

CREATE TABLE service_area_requests (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zip        TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX service_area_requests_zip_idx ON service_area_requests(zip);
