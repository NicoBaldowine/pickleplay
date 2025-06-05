-- DIAGNÓSTICO COMPLETO Y SOLUCIÓN RLS
-- 1. Ver las políticas actuales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. Ver si RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 3. SOLUCIÓN TEMPORAL - Desactivar RLS completamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 4. Verificar que se desactivó
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 5. SOLUCIÓN PERMANENTE - RLS más permisivo
-- Volver a activar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- Crear políticas más permisivas
-- Para SELECT: Permitir a usuarios autenticados leer su propio perfil
CREATE POLICY "Allow users to read own profile" ON profiles
    FOR SELECT 
    TO authenticated
    USING (auth.uid()::text = id::text);

-- Para INSERT: Permitir a usuarios autenticados crear su propio perfil
CREATE POLICY "Allow users to insert own profile" ON profiles
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid()::text = id::text);

-- Para UPDATE: Permitir a usuarios autenticados actualizar su propio perfil
CREATE POLICY "Allow users to update own profile" ON profiles
    FOR UPDATE 
    TO authenticated
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- 6. Verificar las nuevas políticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 7. ALTERNATIVA: Si sigue fallando, hacer los perfiles públicos TEMPORALMENTE
-- (Solo para testing - REMOVER en producción)
-- DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;
-- CREATE POLICY "Temporary public read" ON profiles FOR SELECT TO authenticated USING (true);

-- 8. Test básico - ver si podemos ver perfiles
SELECT count(*) as profile_count FROM profiles; 