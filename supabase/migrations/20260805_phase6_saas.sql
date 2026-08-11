-- ============================================================================
-- TRADERNAKUL PHASE 6: MULTI-USER SAAS PLATFORM CONVERSION
-- Owner: nakultrader007@gmail.com
-- Public Registration: Auto-approved, isolated personal trading journals, RLS active, SaaS Tiers
-- ============================================================================

-- 1. Add Subscription Plan columns to PROFILES table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'enterprise')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing'));

-- 2. Update New User Trigger for Public SaaS Auto-Approval & Owner email nakultrader007@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INT;
    is_first_or_owner BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.profiles;

    -- If table is empty or email matches owner email, assign owner/admin privileges
    IF user_count = 0 OR NEW.email = 'nakulrathi641@gmail.com' THEN
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
        is_owner,
        subscription_plan,
        subscription_status
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Trader'),
        NEW.raw_user_meta_data->>'avatar_url',
        CASE WHEN is_first_or_owner THEN 'admin' ELSE 'user' END,
        'approved', -- Public SaaS auto-approval: Anyone worldwide can sign up and use their journal!
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

-- 3. Policy to allow Admins to update user subscription plans
CREATE POLICY "Admins can update subscription plans"
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
