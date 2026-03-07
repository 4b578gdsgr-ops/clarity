CREATE TABLE shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  phone TEXT,
  website TEXT,
  email TEXT,
  brands_carried TEXT[],
  services TEXT[],
  shop_type TEXT CHECK (shop_type IN ('indie', 'chain', 'co-op')),
  verified BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  added_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bikes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  type TEXT NOT NULL,
  subtype TEXT,
  msrp INTEGER,
  frame_material TEXT,
  drivetrain_brand TEXT,
  drivetrain_type TEXT,
  wheel_size TEXT,
  suspension_type TEXT,
  weight_range TEXT,
  best_for TEXT[],
  karma_score INTEGER,
  transparency_score INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE component_brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  ownership_type TEXT CHECK (ownership_type IN ('independent','employee_owned','cooperative','corporate','pe_owned')),
  category TEXT,
  karma_score INTEGER,
  transparency_score INTEGER,
  made_in TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shop_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  submitted_by_email TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected'))
);

CREATE TABLE custom_build_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  budget_range TEXT,
  riding_style TEXT,
  dream_bike_description TEXT,
  bike_types TEXT[],
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','in_progress','completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE membership_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('base','premium')),
  bikes_owned TEXT,
  status TEXT DEFAULT 'interested' CHECK (status IN ('interested','active','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recommendation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bike_type TEXT,
  budget_range TEXT,
  zip_prefix TEXT,
  experience_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
