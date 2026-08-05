-- ============================================================================
-- EMERGENCY OWNER RECOVERY SCRIPT (Run in Supabase SQL Editor if needed)
-- ============================================================================
-- Replace 'YOUR_OWNER_GMAIL@gmail.com' with your actual Gmail address.

DO $$
DECLARE
    target_email TEXT := 'tradernakul@gmail.com'; -- Replace with your Gmail
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE LOWER(email) = LOWER(target_email);

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User % not found in auth.users. Please sign in via Google OAuth first.', target_email;
    ELSE
        -- Temporarily disable protection trigger to apply emergency repair
        ALTER TABLE public.profiles DISABLE TRIGGER trg_protect_owner;

        UPDATE public.profiles
        SET 
            role = 'admin',
            status = 'approved',
            is_owner = TRUE,
            updated_at = NOW()
        WHERE id = target_user_id;

        -- Re-enable protection trigger
        ALTER TABLE public.profiles ENABLE TRIGGER trg_protect_owner;

        RAISE NOTICE 'SUCCESS: Owner privileges restored for % (User ID: %).', target_email, target_user_id;
    END IF;
END $$;
