-- ============================================================================
-- TRADERNAKUL PHASE 5: USER API KEYS & MT5 SYNC SCHEMA
-- ============================================================================

-- 1. Create USER_API_KEYS Table for MT5 EA Authentication
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

-- Index for fast MT5 key authentication
CREATE INDEX IF NOT EXISTS idx_user_api_keys_api_key ON public.user_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- 2. RLS POLICIES FOR USER_API_KEYS

-- Policy 1: Users can view their own API keys
CREATE POLICY "Users view own API keys"
    ON public.user_api_keys FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy 2: Users can generate API keys
CREATE POLICY "Users insert own API keys"
    ON public.user_api_keys FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can revoke/delete their own API keys
CREATE POLICY "Users delete own API keys"
    ON public.user_api_keys FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
