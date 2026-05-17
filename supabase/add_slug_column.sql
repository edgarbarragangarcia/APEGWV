-- 1. Add the "slug" column to the "tournaments" table
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Add a unique constraint to prevent duplicate slugs
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_slug_key UNIQUE (slug);

-- 3. Set the default slug for the existing tournament (Torneo APEG 2da edición)
UPDATE public.tournaments 
SET slug = 'APEG' 
WHERE id = 'fdc5b059-2e1a-44cb-975d-b95d2f15f40b';
