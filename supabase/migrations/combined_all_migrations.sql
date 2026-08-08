-- ============================================================================
-- TRADERNAKUL COMBINED PRODUCTION MIGRATION (100% IDEMPOTENT & SAFE TO RUN MULTIPLE TIMES)
-- Owner: nakultrader007@gmail.com
-- Safe: Uses IF NOT EXISTS, CREATE OR REPLACE, DROP POLICY IF EXISTS & ON CONFLICT DO NOTHING
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE & SAAS AUTH TRIGGERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'enterprise')),
    subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update user status" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update subscription plans" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR is_owner = TRUE))
);
CREATE POLICY "Admins can update user status" ON public.profiles FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR is_owner = TRUE))
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR is_owner = TRUE))
);
CREATE POLICY "Admins can delete user profiles" ON public.profiles FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR is_owner = TRUE))
);

CREATE OR REPLACE FUNCTION public.prevent_owner_demotion_or_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' AND OLD.is_owner = TRUE THEN
        RAISE EXCEPTION 'CRITICAL SECURITY: Owner profile cannot be deleted.';
    END IF;
    IF TG_OP = 'UPDATE' THEN
        IF OLD.is_owner = TRUE AND (NEW.is_owner = FALSE OR NEW.role != 'admin' OR NEW.status != 'approved') THEN
            RAISE EXCEPTION 'CRITICAL SECURITY: Owner account role, status, and owner status are immutable.';
        END IF;
        IF OLD.is_owner = FALSE AND NEW.is_owner = TRUE THEN
            IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_owner = TRUE) THEN
                RAISE EXCEPTION 'CRITICAL SECURITY: Only existing Owner can assign owner privileges.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_owner ON public.profiles;
CREATE TRIGGER trg_protect_owner BEFORE UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_owner_demotion_or_deletion();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INT;
    designated_owner_email TEXT := 'nakultrader007@gmail.com';
    is_first_or_owner BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.profiles;

    IF LOWER(NEW.email) = 'nakultrader007@gmail.com' OR LOWER(NEW.email) = 'tradernakul@gmail.com' OR user_count = 0 THEN
        is_first_or_owner := TRUE;
    ELSE
        is_first_or_owner := FALSE;
    END IF;

    INSERT INTO public.profiles (
        id, email, full_name, avatar_url, role, status, is_owner, subscription_plan, subscription_status
    )
    VALUES (
        NEW.id, NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Trader'),
        NEW.raw_user_meta_data->>'avatar_url',
        CASE WHEN is_first_or_owner THEN 'admin' ELSE 'user' END,
        CASE WHEN is_first_or_owner THEN 'approved' ELSE 'pending' END,
        is_first_or_owner,
        CASE WHEN is_first_or_owner THEN 'enterprise' ELSE 'free' END,
        'active'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. SITE SETTINGS TABLE (NO-CODE CONTROL PANEL)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    announcement_banner TEXT DEFAULT '',
    banner_active BOOLEAN DEFAULT FALSE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    ai_coach_enabled BOOLEAN DEFAULT TRUE,
    mt5_sync_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT single_row_check CHECK (id = 1)
);

INSERT INTO public.site_settings (id, announcement_banner, banner_active, maintenance_mode, ai_coach_enabled, mt5_sync_enabled)
VALUES (1, 'Welcome to TraderNakul — Professional AI Trading Journal', FALSE, FALSE, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;

CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR is_owner = TRUE))
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR is_owner = TRUE))
);

-- ----------------------------------------------------------------------------
-- 3. TRADES DATABASE & SCREENSHOTS STORAGE (ROW LEVEL SECURITY)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    pair TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('Buy', 'Sell')),
    session TEXT NOT NULL CHECK (session IN ('Asian', 'London', 'New York')),
    entry_time TEXT NOT NULL, exit_time TEXT NOT NULL,
    entry_price NUMERIC NOT NULL, exit_price NUMERIC NOT NULL,
    stop_loss NUMERIC, take_profit NUMERIC,
    result TEXT NOT NULL CHECK (result IN ('Win', 'Loss')),
    rrr NUMERIC NOT NULL DEFAULT 1.0, risk_pct NUMERIC NOT NULL DEFAULT 1.0, pnl NUMERIC NOT NULL DEFAULT 0.0,
    setup TEXT NOT NULL, confirmation TEXT DEFAULT '', notes TEXT DEFAULT '', screenshot_url TEXT DEFAULT '', tags TEXT[] DEFAULT '{}',
    mt5_order_id TEXT DEFAULT NULL, broker TEXT DEFAULT NULL, account_number TEXT DEFAULT NULL, lot_size NUMERIC DEFAULT NULL, commission NUMERIC DEFAULT NULL, swap NUMERIC DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_date ON public.trades(date);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own trades" ON public.trades;
DROP POLICY IF EXISTS "Users insert own trades" ON public.trades;
DROP POLICY IF EXISTS "Users update own trades" ON public.trades;
DROP POLICY IF EXISTS "Users delete own trades" ON public.trades;
DROP POLICY IF EXISTS "Admins view all trades" ON public.trades;

CREATE POLICY "Users view own trades" ON public.trades FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own trades" ON public.trades FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own trades" ON public.trades FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own trades" ON public.trades FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all trades" ON public.trades FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR is_owner = TRUE))
);

INSERT INTO storage.buckets (id, name, public) VALUES ('trade-screenshots', 'trade-screenshots', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users Upload Own Screenshots" ON storage.objects;

CREATE POLICY "Public Read Screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'trade-screenshots');
CREATE POLICY "Users Upload Own Screenshots" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ----------------------------------------------------------------------------
-- 4. USER API KEYS TABLE (MT5 INTEGRATION FOUNDATION)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key_label TEXT DEFAULT 'MT5 EA Key',
    api_key TEXT UNIQUE NOT NULL,
    account_number TEXT DEFAULT NULL,
    broker_name TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_api_key ON public.user_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users insert own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users delete own API keys" ON public.user_api_keys;

CREATE POLICY "Users view own API keys" ON public.user_api_keys FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own API keys" ON public.user_api_keys FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own API keys" ON public.user_api_keys FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- Create the upstox_tokens table
CREATE TABLE IF NOT EXISTS public.upstox_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_token TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS to block ALL direct frontend access
ALTER TABLE public.upstox_tokens ENABLE ROW LEVEL SECURITY;

-- No policies created -> Default is deny all for anon and authenticated.
-- The backend will access this table using the SUPABASE_SERVICE_ROLE_KEY, which inherently bypasses RLS.

