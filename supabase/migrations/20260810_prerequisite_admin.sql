-- ============================================================================
-- TRADERNAKUL: SAFE PREREQUISITE MIGRATION FOR ADMIN ENHANCEMENTS
-- Run this BEFORE: 20260810_admin_enhancements.sql
--
-- Safety:
--   * Uses CREATE TABLE IF NOT EXISTS    -> will NOT overwrite existing tables
--   * Uses CREATE OR REPLACE FUNCTION    -> safe to re-run on existing functions
--   * Uses DROP POLICY IF EXISTS         -> safe, prevents duplicate policy errors
--   * Uses ON CONFLICT (id) DO NOTHING   -> will NOT overwrite existing settings row
--   * Does NOT touch public.profiles rows
--   * Does NOT alter auth.users or OTP config
--   * Does NOT modify existing trades, journals, or user data
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. is_admin_or_owner() SECURITY DEFINER HELPER
--    Required by all RLS policies and get_admin_stats() in the enhancements file.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (role = 'admin' OR is_owner = TRUE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 2. SITE SETTINGS TABLE
--    Single-row control panel. CREATE IF NOT EXISTS — safe if table already exists.
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

-- Insert default row only if the table was just created (ON CONFLICT skips existing row)
INSERT INTO public.site_settings (id, announcement_banner, banner_active, maintenance_mode, ai_coach_enabled, mt5_sync_enabled)
VALUES (1, 'Welcome to TraderNakul — Professional AI Trading Journal', FALSE, FALSE, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;

CREATE POLICY "Anyone can view site settings"
    ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "Admins can update site settings"
    ON public.site_settings FOR UPDATE TO authenticated
    USING (public.is_admin_or_owner())
    WITH CHECK (public.is_admin_or_owner());

-- ----------------------------------------------------------------------------
-- 3. TRADES TABLE
--    Core trading journal data. Existing rows are untouched.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    pair TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('Buy', 'Sell')),
    session TEXT NOT NULL CHECK (session IN ('Asian', 'London', 'New York')),
    entry_time TEXT NOT NULL,
    exit_time TEXT NOT NULL,
    entry_price NUMERIC NOT NULL,
    exit_price NUMERIC NOT NULL,
    stop_loss NUMERIC,
    take_profit NUMERIC,
    result TEXT NOT NULL CHECK (result IN ('Win', 'Loss')),
    rrr NUMERIC NOT NULL DEFAULT 1.0,
    risk_pct NUMERIC NOT NULL DEFAULT 1.0,
    pnl NUMERIC NOT NULL DEFAULT 0.0,
    setup TEXT NOT NULL,
    confirmation TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    screenshot_url TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    mt5_order_id TEXT DEFAULT NULL,
    broker TEXT DEFAULT NULL,
    account_number TEXT DEFAULT NULL,
    lot_size NUMERIC DEFAULT NULL,
    commission NUMERIC DEFAULT NULL,
    swap NUMERIC DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_date ON public.trades(date);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own trades" ON public.trades;
DROP POLICY IF EXISTS "Users insert own trades" ON public.trades;
DROP POLICY IF EXISTS "Users update own trades" ON public.trades;
DROP POLICY IF EXISTS "Users delete own trades" ON public.trades;
DROP POLICY IF EXISTS "Admins view all trades" ON public.trades;

CREATE POLICY "Users view own trades"   ON public.trades FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own trades" ON public.trades FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own trades" ON public.trades FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own trades" ON public.trades FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all trades"  ON public.trades FOR SELECT TO authenticated USING (public.is_admin_or_owner());

-- ----------------------------------------------------------------------------
-- 4. USER API KEYS TABLE (MT5 Integration)
--    Existing rows are untouched.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key_label TEXT DEFAULT 'MT5 EA Key',
    api_key TEXT UNIQUE NOT NULL,
    account_number TEXT DEFAULT NULL,
    broker_name TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_api_key ON public.user_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own API keys"   ON public.user_api_keys;
DROP POLICY IF EXISTS "Users insert own API keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Users delete own API keys" ON public.user_api_keys;

CREATE POLICY "Users view own API keys"   ON public.user_api_keys FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own API keys" ON public.user_api_keys FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own API keys" ON public.user_api_keys FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. AI CHAT HISTORY TABLE
--    Existing chat rows are untouched.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    model_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own chat history" ON public.ai_chat_history;
DROP POLICY IF EXISTS "Users can read their own chat history"   ON public.ai_chat_history;

CREATE POLICY "Users can insert their own chat history"
    ON public.ai_chat_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own chat history"
    ON public.ai_chat_history FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================================
-- END OF PREREQUISITE MIGRATION
-- Next step: Run 20260810_admin_enhancements.sql
-- ============================================================================
