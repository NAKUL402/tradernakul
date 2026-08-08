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

-- Create a secure RPC function to SET the token, bypassing RLS (SECURITY DEFINER)
-- We require a basic internal secret to prevent malicious frontend users from calling this RPC.
CREATE OR REPLACE FUNCTION public.set_upstox_token(internal_secret text, new_token text)
RETURNS void AS $$
BEGIN
    -- This secret matches the backend API routes (server-side only)
    IF internal_secret != 'tn_backend_oauth_secure_99' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Clear old tokens and insert the new one
    DELETE FROM public.upstox_tokens;
    INSERT INTO public.upstox_tokens (access_token, updated_at) VALUES (new_token, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure RPC function to GET the token, bypassing RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_upstox_token(internal_secret text)
RETURNS text AS $$
DECLARE
    tok text;
BEGIN
    IF internal_secret != 'tn_backend_oauth_secure_99' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT access_token INTO tok FROM public.upstox_tokens ORDER BY updated_at DESC LIMIT 1;
    RETURN tok;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
