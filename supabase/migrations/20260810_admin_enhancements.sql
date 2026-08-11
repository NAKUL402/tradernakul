-- ============================================================================
-- TRADERNAKUL PRODUCTION MIGRATION: ADVANCED ADMIN CONTROL CENTER
-- ============================================================================

-- 1. ADD SUSPENDED STATUS TO PROFILES CHECK CONSTRAINT
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));

-- 2. ADD COLUMNS FOR PLATFORM CONTROL TO SITE SETTINGS
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS registration_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS login_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS journal_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS market_data_enabled BOOLEAN DEFAULT TRUE;

-- 3. CREATE FEATURE DEADLINES TABLE
CREATE TABLE IF NOT EXISTS public.feature_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deadline TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('active', 'scheduled', 'disabled', 'maintenance', 'completed')),
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.feature_deadlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view deadlines" ON public.feature_deadlines;
DROP POLICY IF EXISTS "Admins can manage deadlines" ON public.feature_deadlines;

CREATE POLICY "Anyone can view deadlines" ON public.feature_deadlines FOR SELECT USING (true);
CREATE POLICY "Admins can manage deadlines" ON public.feature_deadlines FOR ALL TO authenticated USING (
    public.is_admin_or_owner()
) WITH CHECK (
    public.is_admin_or_owner()
);

-- 4. CREATE AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    previous_state TEXT,
    new_state TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    result TEXT NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (
    public.is_admin_or_owner()
);

CREATE POLICY "Admins can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (
    public.is_admin_or_owner()
);

-- 5. CREATE ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    audience TEXT NOT NULL CHECK (audience IN ('all', 'approved', 'pending')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;

CREATE POLICY "Anyone can view published announcements" ON public.announcements FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL TO authenticated USING (
    public.is_admin_or_owner()
) WITH CHECK (
    public.is_admin_or_owner()
);

-- 6. SECURITY DEFINER HELPER TO BAPASS RLS SECURELY FOR TOTAL COUNTS
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB AS $$
DECLARE
    total_users INT;
    pending_users INT;
    approved_users INT;
    suspended_users INT;
    rejected_users INT;
    total_trades INT;
    total_ai_chats INT;
    total_mt5_keys INT;
BEGIN
    -- Verify the caller is authorized
    IF NOT public.is_admin_or_owner() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT COUNT(*) INTO total_users FROM public.profiles;
    SELECT COUNT(*) FILTER (WHERE status = 'pending') INTO pending_users FROM public.profiles;
    SELECT COUNT(*) FILTER (WHERE status = 'approved') INTO approved_users FROM public.profiles;
    SELECT COUNT(*) FILTER (WHERE status = 'suspended') INTO suspended_users FROM public.profiles;
    SELECT COUNT(*) FILTER (WHERE status = 'rejected') INTO rejected_users FROM public.profiles;
    
    SELECT COUNT(*) INTO total_trades FROM public.trades;
    SELECT COUNT(*) INTO total_ai_chats FROM public.ai_chat_history;
    SELECT COUNT(*) INTO total_mt5_keys FROM public.user_api_keys;

    RETURN jsonb_build_object(
        'total_users', total_users,
        'pending_users', pending_users,
        'approved_users', approved_users,
        'suspended_users', suspended_users,
        'rejected_users', rejected_users,
        'total_trades', total_trades,
        'total_ai_chats', total_ai_chats,
        'total_mt5_keys', total_mt5_keys
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
