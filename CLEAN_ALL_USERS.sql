-- VER TODOS LOS USUARIOS EN LA BASE DE DATOS

-- 1. Contar cuántos usuarios hay en total
SELECT COUNT(*) as total_users FROM auth.users;

-- 2. Listar TODOS los usuarios
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Verified'
        ELSE '❌ Not Verified'
    END as status
FROM auth.users 
ORDER BY created_at DESC;

-- 3. Ver usuarios sin perfil (usuarios fantasma)
SELECT 
    u.id,
    u.email,
    u.created_at,
    'No Profile' as issue
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 4. OPCIÓN A: Eliminar TODOS los usuarios NO verificados
-- CUIDADO: Esto eliminará usuarios que no han verificado su email
-- DELETE FROM auth.users 
-- WHERE email_confirmed_at IS NULL;

-- 5. OPCIÓN B: Eliminar usuarios específicos
-- Reemplaza el email con el que quieres eliminar
-- DELETE FROM auth.users 
-- WHERE email = 'mbaldovinodunker@gmail.com';

-- 6. OPCIÓN C: NUCLEAR - Eliminar TODOS los usuarios excepto el de prueba
-- PELIGRO: Esto eliminará TODOS los usuarios
-- DELETE FROM auth.users 
-- WHERE email != 'test@pickleplay.com';

-- 7. Verificar después de limpiar
SELECT 'Usuarios después de limpieza:' as info;
SELECT COUNT(*) as remaining_users FROM auth.users; 