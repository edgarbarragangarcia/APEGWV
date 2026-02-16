-- 1. CREAR TABLA DE CUPONES (COUPONS)
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  value NUMERIC NOT NULL,
  valid_until TIMESTAMPTZ,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  creator_id UUID NOT NULL
);

-- Habilitar seguridad para cupones
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Política de seguridad (cada usuario ve sus cupones)
CREATE POLICY "Users can manage their own coupons" ON public.coupons
  FOR ALL USING (auth.uid() = creator_id);


-- 2. ACTUALIZAR TABLA DE TORNEOS (TOURNAMENTS)
-- Añadir columnas faltantes para Dirección, Modalidad y Presupuesto
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS game_mode TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS budget_per_player NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_prizes NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_operational NUMERIC DEFAULT 0;
