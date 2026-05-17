-- Fix RLS policies for tournament_registrations to allow COMPLETELY PUBLIC/ANONYMOUS registrations.
-- This ensures that users can register directly from shared links without being forced to log in.

-- 1. Enable RLS on the table if not already enabled
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive or incorrect insert policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Users can insert their own registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Authenticated users can insert registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Anyone can insert registrations" ON public.tournament_registrations;

-- 3. Create a permissive INSERT policy for ANYONE (including public/anonymous users)
CREATE POLICY "Anyone can insert registrations" 
ON public.tournament_registrations 
FOR INSERT 
TO public 
WITH CHECK (true);

-- 4. Create a permissive SELECT policy for public so they can view details or confirmation checks
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Public can view registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Anyone can view registrations" ON public.tournament_registrations;

CREATE POLICY "Anyone can view registrations" 
ON public.tournament_registrations 
FOR SELECT 
TO public 
USING (true);
