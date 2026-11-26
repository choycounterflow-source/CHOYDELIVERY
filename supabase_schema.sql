-- ChoyFood / CHOY DELIVERY Supabase PostgreSQL Schema
-- Safe to run on both fresh and existing Supabase projects (idempotent migrations).
-- Paste and run this entire script in your Supabase Dashboard -> SQL Editor.

-- 1. Users / Profiles table
CREATE TABLE IF NOT EXISTS public.users (
  uid TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT 'ChoyFood User',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('super_admin', 'admin', 'store', 'rider', 'customer')),
  wallet_balance NUMERIC(12, 2) NOT NULL DEFAULT 150.00,
  choy_pro_active BOOLEAN NOT NULL DEFAULT FALSE,
  kyc_status TEXT NOT NULL DEFAULT 'unverified' CHECK (kyc_status IN ('unverified', 'pending', 'verified', 'rejected')),
  rider_code TEXT DEFAULT '',
  store_name TEXT DEFAULT '',
  referral_code TEXT DEFAULT '',
  referral_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0,
  referred_count INTEGER NOT NULL DEFAULT 0,
  rating_score NUMERIC(3, 2) DEFAULT 4.9,
  rider_photo_url TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  nickname TEXT DEFAULT '',
  game_bonus_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nickname TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS game_bonus_points INTEGER NOT NULL DEFAULT 0;

-- 2. Dishes Catalog table
CREATE TABLE IF NOT EXISTS public.dishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10, 2) NOT NULL,
  sale_group TEXT NOT NULL DEFAULT 'Solo',
  store_name TEXT NOT NULL,
  store_owner_id TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  likes INTEGER NOT NULL DEFAULT 0,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('approved', 'pending', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.dishes
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved';

-- 3. Promos table
CREATE TABLE IF NOT EXISTS public.promos (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 25,
  min_spend NUMERIC(10, 2) NOT NULL DEFAULT 250,
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Live 7-Step Delivery Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_display_name TEXT NOT NULL,
  store_name TEXT NOT NULL,
  store_owner_id TEXT NOT NULL,
  rider_id TEXT NOT NULL DEFAULT '',
  rider_code TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  distance_tier TEXT NOT NULL DEFAULT '0-2km',
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 25,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tip_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'COD',
  delivery_address TEXT NOT NULL,
  delivery_note TEXT NOT NULL DEFAULT '',
  delivery_coords JSONB,
  step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'picked',
  proof_of_delivery_note TEXT NOT NULL DEFAULT '',
  rating INTEGER,
  review_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_coords JSONB;

-- 5. Super Admin KYC Vault (Private PII table)
CREATE TABLE IF NOT EXISTS public.kyc_vault (
  uid TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  real_legal_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
  id_type TEXT NOT NULL,
  id_reference TEXT NOT NULL,
  profile_photo_name TEXT NOT NULL,
  valid_id_photo_name TEXT NOT NULL,
  privacy_consent_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Support Tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  full_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. System Activity Logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'system',
  actor_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Platform CMS Settings (Banners, Carousel, AI Knowledge Base, Store Status/Permits, Donations, Shifts)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Extended Rider Onboarding Documents & Clearances Vault
CREATE TABLE IF NOT EXISTS public.rider_onboarding_docs (
  uid TEXT PRIMARY KEY,
  legal_full_name TEXT NOT NULL DEFAULT '',
  nickname TEXT NOT NULL DEFAULT '',
  public_handle TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  contact_number TEXT NOT NULL DEFAULT '',
  age TEXT NOT NULL DEFAULT '',
  sex TEXT NOT NULL DEFAULT 'Male',
  civil_status TEXT NOT NULL DEFAULT 'Single',
  license_number TEXT NOT NULL DEFAULT '',
  license_expiry TEXT NOT NULL DEFAULT '',
  vehicle_type TEXT NOT NULL DEFAULT 'Motorcycle',
  plate_number TEXT NOT NULL DEFAULT '',
  or_cr_number TEXT NOT NULL DEFAULT '',
  or_cr_expiry TEXT NOT NULL DEFAULT '',
  vehicle_photo_name TEXT NOT NULL DEFAULT '',
  barangay_clearance_ref TEXT NOT NULL DEFAULT '',
  city_clearance_ref TEXT NOT NULL DEFAULT '',
  police_clearance_ref TEXT NOT NULL DEFAULT '',
  sss_number TEXT DEFAULT '',
  pagibig_number TEXT DEFAULT '',
  philhealth_number TEXT DEFAULT '',
  tin_number TEXT DEFAULT '',
  camera_verified_at TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Cross-Device Notifications Inbox
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('admin', 'customer', 'rider', 'store', 'all')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_onboarding_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Idempotent policies (drop first so re-running this script never fails)
DROP POLICY IF EXISTS "Public read dishes" ON public.dishes;
DROP POLICY IF EXISTS "Public read promos" ON public.promos;
DROP POLICY IF EXISTS "Users manage own profile" ON public.users;
DROP POLICY IF EXISTS "Manage dishes" ON public.dishes;
DROP POLICY IF EXISTS "Manage promos" ON public.promos;
DROP POLICY IF EXISTS "Manage orders" ON public.orders;
DROP POLICY IF EXISTS "Manage kyc_vault" ON public.kyc_vault;
DROP POLICY IF EXISTS "Manage support_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Manage activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Public read platform_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Manage platform_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Manage rider_onboarding_docs" ON public.rider_onboarding_docs;
DROP POLICY IF EXISTS "Manage notifications" ON public.notifications;

-- Public read access for menu dishes, active promos, and platform settings
CREATE POLICY "Public read dishes" ON public.dishes FOR SELECT USING (true);
CREATE POLICY "Public read promos" ON public.promos FOR SELECT USING (active = true);
CREATE POLICY "Public read platform_settings" ON public.platform_settings FOR SELECT USING (true);

-- App access policies (tighten with auth.uid() / JWT role claims for strict production RLS)
CREATE POLICY "Users manage own profile" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage dishes" ON public.dishes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage promos" ON public.promos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage kyc_vault" ON public.kyc_vault FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage support_tickets" ON public.support_tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage platform_settings" ON public.platform_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage rider_onboarding_docs" ON public.rider_onboarding_docs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- Seed default promo code
INSERT INTO public.promos (id, code, discount, min_spend, description, active)
VALUES ('promo_choy25', 'CHOY25', 25, 250, '₱25 OFF on neighborhood orders ₱250 and above', true)
ON CONFLICT (code) DO NOTHING;

-- Enable Realtime safely on live operational tables
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.dishes;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_settings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_onboarding_docs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
