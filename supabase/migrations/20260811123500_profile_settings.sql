-- ============================================================================
-- TRADERNAKUL - PROFILE & SETTINGS ENHANCEMENTS
-- ============================================================================

-- 1. Modify public.user_settings to include trading preferences
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS trading_style TEXT,
ADD COLUMN IF NOT EXISTS preferred_timeframe TEXT,
ADD COLUMN IF NOT EXISTS primary_markets TEXT[];

-- 2. Create the profile-avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up RLS for profile-avatars
-- Allow public viewing of avatars
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-avatars' );

-- Allow users to upload their own avatar
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'profile-avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'profile-avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'profile-avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
