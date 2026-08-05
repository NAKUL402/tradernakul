-- ============================================================================
-- TRADERNAKUL PHASE 4: REAL TRADES DATABASE & MT5 READY SCHEMA
-- ============================================================================

-- 1. Create TRADES Table
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL, -- ISO yyyy-mm-dd
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

    -- MT5 Compatibility Fields (Ready for Phase 5 Auto Sync)
    mt5_order_id TEXT DEFAULT NULL,
    broker TEXT DEFAULT NULL,
    account_number TEXT DEFAULT NULL,
    lot_size NUMERIC DEFAULT NULL,
    commission NUMERIC DEFAULT NULL,
    swap NUMERIC DEFAULT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_date ON public.trades(date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- 2. RLS POLICIES FOR TRADES

-- Policy 1: Users can view only their own trades
CREATE POLICY "Users can view own trades"
    ON public.trades FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own trades
CREATE POLICY "Users can insert own trades"
    ON public.trades FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own trades
CREATE POLICY "Users can update own trades"
    ON public.trades FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own trades
CREATE POLICY "Users can delete own trades"
    ON public.trades FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy 5: Admins and Owner can view all trades for aggregate platform metrics
CREATE POLICY "Admins can view all trades"
    ON public.trades FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR is_owner = TRUE)
        )
    );

-- 3. SUPABASE STORAGE BUCKET FOR SCREENSHOTS
INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-screenshots', 'trade-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Public Read Screenshots"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'trade-screenshots');

CREATE POLICY "Users Upload Own Screenshots"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
