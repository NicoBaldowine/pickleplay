-- ========================================
-- CONECTAR GAMES CON AUTENTICACIÓN
-- (Ejecutar DESPUÉS de auth_tables_only.sql)
-- ========================================

-- Agregar columnas de usuario a la tabla games existente
-- (Solo si no existen ya)
DO $$ 
BEGIN
    -- Agregar creator_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='games' AND column_name='creator_id') THEN
        ALTER TABLE public.games 
        ADD COLUMN creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Agregar partner_id si no existe (para doubles)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='games' AND column_name='partner_id') THEN
        ALTER TABLE public.games 
        ADD COLUMN partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Habilitar RLS en games si no está habilitado
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Políticas para games (usuarios pueden ver sus propios juegos)
DROP POLICY IF EXISTS "Users can view own games" ON public.games;
CREATE POLICY "Users can view own games" ON public.games
  FOR SELECT USING (
    auth.uid() = creator_id OR 
    auth.uid() = partner_id
  );

DROP POLICY IF EXISTS "Users can create games" ON public.games;
CREATE POLICY "Users can create games" ON public.games
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can update own games" ON public.games;
CREATE POLICY "Users can update own games" ON public.games
  FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can delete own games" ON public.games;
CREATE POLICY "Users can delete own games" ON public.games
  FOR DELETE USING (auth.uid() = creator_id);

-- Función para obtener el perfil del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS public.profiles AS $$
BEGIN
  RETURN (
    SELECT * FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 