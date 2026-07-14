-- Run in Supabase SQL editor
-- Adds Box & Ship as a separate booking flow on service_bookings.

ALTER TABLE service_bookings
  ADD COLUMN IF NOT EXISTS service_type          TEXT DEFAULT 'service' CHECK (service_type IN ('service', 'box_ship')),
  ADD COLUMN IF NOT EXISTS shipping_destination  TEXT,
  ADD COLUMN IF NOT EXISTS shipping_carrier      TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number       TEXT,
  ADD COLUMN IF NOT EXISTS include_disassembly   BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS service_bookings_service_type_idx ON service_bookings(service_type);
