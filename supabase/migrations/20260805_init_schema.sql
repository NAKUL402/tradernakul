-- ============================================================================
-- TRADERNAKUL PHASE 1: DATABASE SCHEMA, RLS POLICIES & IMMUTABLE OWNER TRIGGER
-- ============================================================================

-- 1. Create PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. RLS POLICIES FOR PROFILES

-- Policy 1: Authenticated users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy 2: Admins & Owner can view all user profiles
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR is_owner = TRUE)
        )
    );

-- Policy 3: Only Owner and Admins can update user status (Approve/Reject)
CREATE POLICY "Admins can update user status"
    ON public.profiles FOR UPDATE
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

-- 3. IMMUTABLE OWNER PROTECTION TRIGGER
-- Prevents deletion of the owner account and prevents demoting/changing owner role or status.
CREATE OR REPLACE FUNCTION public.prevent_owner_demotion_or_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Block Deletion of Owner Profile
    IF TG_OP = 'DELETE' AND OLD.is_owner = TRUE THEN
        RAISE EXCEPTION 'CRITICAL SECURITY: Owner profile cannot be deleted.';
    END IF;

    -- Block Demotion / Alteration of Owner Role or Status or is_owner flag
    IF TG_OP = 'UPDATE' THEN
        IF OLD.is_owner = TRUE AND (NEW.is_owner = FALSE OR NEW.role != 'admin' OR NEW.status != 'approved') THEN
            RAISE EXCEPTION 'CRITICAL SECURITY: Owner account role, status, and owner status are immutable.';
        END IF;

        -- Prevent non-owners from promoting themselves to owner
        IF OLD.is_owner = FALSE AND NEW.is_owner = TRUE THEN
            IF NOT EXISTS (
                SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_owner = TRUE
            ) THEN
                RAISE EXCEPTION 'CRITICAL SECURITY: Only existing Owner can assign owner privileges.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_protect_owner
    BEFORE UPDATE OR DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_owner_demotion_or_deletion();

-- 4. AUTOMATIC NEW USER HANDLER (FIRST USER OR DESIGNATED OWNER EMAIL -> ADMIN & OWNER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INT;
    designated_owner_email TEXT := 'tradernakul@gmail.com'; -- Replace with your exact owner email
    is_first_or_owner BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.profiles;

    -- If email matches designated owner OR table is empty, auto-assign owner/admin
    IF LOWER(NEW.email) = LOWER(designated_owner_email) OR user_count = 0 THEN
        is_first_or_owner := TRUE;
    ELSE
        is_first_or_owner := FALSE;
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        role,
        status,
        is_owner
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Trader'),
        NEW.raw_user_meta_data->>'avatar_url',
        CASE WHEN is_first_or_owner THEN 'admin' ELSE 'user' END,
        CASE WHEN is_first_or_owner THEN 'approved' ELSE 'pending' END,
        is_first_or_owner
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on sign-up
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
