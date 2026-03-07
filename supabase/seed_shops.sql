-- Run this in the Supabase SQL editor.
-- Step 1: Add active column if the table already exists from a previous schema run.
ALTER TABLE shops ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Step 2: Seed shops (skip if already present by name).
INSERT INTO shops (name, address, city, state, zip, lat, lng, phone, website, brands_carried, services, shop_type, active, verified)
VALUES
  (
    'Trek Newington',
    'Main St', 'Newington', 'CT', '06111',
    41.6957, -72.7205,
    NULL, NULL,
    ARRAY['Trek', 'Bontrager'],
    ARRAY['repair', 'fitting'],
    'chain', true, true
  ),
  (
    'Pedal Power',
    '359 Main St', 'Middletown', 'CT', '06457',
    41.5623, -72.6512,
    NULL, NULL,
    ARRAY['Specialized', 'Giant'],
    ARRAY['repair', 'fitting', 'rental'],
    'indie', true, true
  ),
  (
    'Manchester Cycle Shop',
    '178 W Middle Turnpike', 'Manchester', 'CT', '06040',
    41.7732, -72.5204,
    NULL, NULL,
    ARRAY[]::TEXT[],
    ARRAY['repair'],
    'indie', true, true
  ),
  (
    'Benidorm Bikes',
    '247 NY-32', 'New Paltz', 'NY', '12561',
    41.7463, -74.0859,
    NULL, NULL,
    ARRAY[]::TEXT[],
    ARRAY['repair', 'custom_builds'],
    'indie', true, true
  )
ON CONFLICT DO NOTHING;
