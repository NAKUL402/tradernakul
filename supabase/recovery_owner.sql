-- EMERGENCY RECOVERY SCRIPT FOR OWNER ADMIN PRIVILEGES
-- Run this script in Supabase SQL Editor if you ever need to manually grant/restore Owner rights.

UPDATE public.profiles
SET 
    role = 'admin',
    status = 'approved',
    is_owner = TRUE,
    subscription_plan = 'enterprise',
    subscription_status = 'active',
    updated_at = NOW()
WHERE email = 'YOUR_OWNER_EMAIL_HERE';
