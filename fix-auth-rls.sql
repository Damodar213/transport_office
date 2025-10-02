-- Fix RLS policies to allow authentication
-- The authentication system needs to read user data before login

-- Drop existing restrictive policy on users table
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

-- Create a new policy that allows authentication queries
-- This allows reading user data for login verification
CREATE POLICY "Allow authentication queries" ON public.users
FOR SELECT USING (true);

-- Also ensure admins table allows authentication
DROP POLICY IF EXISTS "Admins can view all data" ON public.admins;
CREATE POLICY "Allow admin authentication queries" ON public.admins
FOR SELECT USING (true);

-- Keep other tables with proper user-specific policies
-- These are already correct and don't need changes

