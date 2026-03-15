-- Run in Supabase SQL editor

CREATE TABLE service_bookings (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  address       TEXT NOT NULL,
  city          TEXT,
  state         TEXT DEFAULT 'CT',
  zip           TEXT NOT NULL,
  lat           DECIMAL(10,7),
  lng           DECIMAL(10,7),
  phone         TEXT,
  email         TEXT,
  bike_brand    TEXT,
  bike_model    TEXT,
  issues        TEXT[],
  notes         TEXT,
  zone          TEXT,
  pickup_date   DATE,
  time_slot     TEXT,
  is_member     BOOLEAN DEFAULT false,
  status        TEXT DEFAULT 'booked'
                  CHECK (status IN ('booked','picked_up','in_progress','ready','delivered','cancelled')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX service_bookings_date_idx    ON service_bookings(pickup_date);
CREATE INDEX service_bookings_status_idx  ON service_bookings(status);
CREATE INDEX service_bookings_zone_idx    ON service_bookings(zone);
