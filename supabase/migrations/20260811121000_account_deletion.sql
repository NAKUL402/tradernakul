-- ============================================================================
-- TRADERNAKUL: ACCOUNT DELETION & DANGER ZONE
-- ============================================================================

-- 1. Storage Policies for `trade-screenshots` to allow users to manage their own files
CREATE POLICY "Users Update Own Screenshots"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1])
    WITH CHECK (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users Delete Own Screenshots"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. Secure RPC for Account Deletion
-- Must be SECURITY DEFINER to bypass RLS and allow deleting from auth.users

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_is_owner BOOLEAN;
BEGIN
    -- Get the authenticated user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if the user is the owner
    SELECT is_owner INTO v_is_owner FROM public.profiles WHERE id = v_user_id;

    IF v_is_owner = true THEN
        RAISE EXCEPTION 'Owner accounts cannot be deleted through this method. Administrative intervention required.';
    END IF;

    -- Delete the user from auth.users (This cascades to profiles, trades, etc.)
    DELETE FROM auth.users WHERE id = v_user_id;

    -- Log the deletion
    INSERT INTO public.audit_logs (
        action, entity_type, entity_id, details
    ) VALUES (
        'account_deleted',
        'user',
        v_user_id::text,
        jsonb_build_object('reason', 'User explicitly requested account deletion')
    );
END;
$$;
