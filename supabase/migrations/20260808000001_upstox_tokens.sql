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
-- The backend will access this table using the SUPABASE_SERVICE_ROLE_KEY, which inherently bypasses RLS.
