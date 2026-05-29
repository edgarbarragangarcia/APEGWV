-- =============================================================
-- APEG: Solución Definitiva de RLS y Recursión para Saved Groups
-- Ejecuta este script en Supabase Dashboard > SQL Editor
-- =============================================================

-- 1. ELIMINAR DINÁMICAMENTE TODAS LAS POLÍTICAS EXISTENTES EN AMBAS TABLAS
-- Esto evita cualquier conflicto de tipo "policy already exists" al crear las nuevas.
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('saved_groups', 'saved_group_members')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END
$$;

-- 2. ELIMINAR FUNCIONES ANTIGUAS (CON CASCADE PARA LIMPIAR DEPENDENCIAS)
DROP FUNCTION IF EXISTS public.is_saved_group_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_saved_group_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.check_saved_group_access(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_saved_group_owner(uuid, uuid) CASCADE;

-- 3. CREAR FUNCIÓN CON "SECURITY DEFINER" PARA CONTROL DE ACCESO
-- Al usar SECURITY DEFINER, se ejecuta con privilegios elevados omitiendo
-- la evaluación de RLS dentro de la función, rompiendo la recursión infinita.
CREATE OR REPLACE FUNCTION public.check_saved_group_access(checking_group_id UUID, checking_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        -- El usuario es el dueño del grupo
        SELECT 1 FROM public.saved_groups
        WHERE id = checking_group_id AND owner_id = checking_user_id
        UNION ALL
        -- El usuario es miembro del grupo
        SELECT 1 FROM public.saved_group_members
        WHERE group_id = checking_group_id AND member_id = checking_user_id
    );
END;
$$;

-- 4. CREAR FUNCIÓN CON "SECURITY DEFINER" PARA CONTROL DE PROPIEDAD
-- Permite validar si un usuario es el dueño del grupo antes de editar miembros.
CREATE OR REPLACE FUNCTION public.is_saved_group_owner(checking_group_id UUID, checking_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.saved_groups
        WHERE id = checking_group_id AND owner_id = checking_user_id
    );
END;
$$;

-- 5. ASEGURAR QUE RLS ESTÉ HABILITADO
ALTER TABLE public.saved_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_group_members ENABLE ROW LEVEL SECURITY;

-- 6. CREAR NUEVAS POLÍTICAS PARA "saved_groups"
CREATE POLICY "Users can create groups" 
ON public.saved_groups 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = owner_id);

-- CRÍTICO: Añadir "auth.uid() = owner_id" directamente aquí permite que
-- el INSERT con .select() funcione perfectamente, ya que evita llamar a la
-- función sobre la fila en transición (que aún no es visible para subconsultas).
CREATE POLICY "Users can view groups" 
ON public.saved_groups 
FOR SELECT 
TO authenticated 
USING (auth.uid() = owner_id OR check_saved_group_access(id, auth.uid()));

CREATE POLICY "Users can update groups" 
ON public.saved_groups 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete groups" 
ON public.saved_groups 
FOR DELETE 
TO authenticated 
USING (auth.uid() = owner_id);

-- 7. CREAR NUEVAS POLÍTICAS PARA "saved_group_members"
CREATE POLICY "Users can view group members" 
ON public.saved_group_members 
FOR SELECT 
TO authenticated 
USING (member_id = auth.uid() OR check_saved_group_access(group_id, auth.uid()));

CREATE POLICY "Users can add group members" 
ON public.saved_group_members 
FOR INSERT 
TO authenticated 
WITH CHECK (is_saved_group_owner(group_id, auth.uid()));

CREATE POLICY "Users can update group members" 
ON public.saved_group_members 
FOR UPDATE 
TO authenticated 
USING (is_saved_group_owner(group_id, auth.uid()))
WITH CHECK (is_saved_group_owner(group_id, auth.uid()));

CREATE POLICY "Users can remove group members" 
ON public.saved_group_members 
FOR DELETE 
TO authenticated 
USING (is_saved_group_owner(group_id, auth.uid()));
