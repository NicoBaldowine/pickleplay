-- QUICK FIX: Arreglar el problema del perfil

-- 1. Asegurarse de que RLS esté desactivado
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Dar permisos completos
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;

-- 3. Verificar que funcione
SELECT * FROM profiles;

-- Si está vacío, no hay problema. La app creará el perfil cuando lo intentes de nuevo. 