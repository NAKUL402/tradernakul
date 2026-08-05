-- ============================================================================
-- TRADERNAKUL PHASE 3: SITE SETTINGS TABLE & ADMIN RLS POLICIES
-- ============================================================================

-- 1. Create SITE_SETTINGS Table
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

-- Insert default row if not present
INSERT INTO public.site_settings (id, announcement_banner, banner_active, maintenance_mode, ai_coach_enabled, mt5_sync_enabled)
VALUES (1, 'Welcome to TraderNakul — Professional AI Trading Journal', FALSE, FALSE, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 2. RLS POLICIES FOR SITE_SETTINGS

-- Anyone (public and authenticated) can view site settings
CREATE POLICY "Anyone can view site settings"
    ON public.site_settings FOR SELECT
    USING (true);

-- Only Admins and Owner can update site settings
CREATE POLICY "Admins can update site settings"
    ON public.site_settings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR is_owner = TRUE)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR is_owner = TRUE)
        )
    );
