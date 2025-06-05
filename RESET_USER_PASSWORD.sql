-- Script para resetear contraseña de usuario

-- 1. Primero, veamos cuántos usuarios hay con ese email
SELECT COUNT(*) as user_count, email 
FROM auth.users 
WHERE email = 'nbaldovino5@gmail.com'
GROUP BY email;

-- 2. Lista todos los usuarios con ese email
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Verified'
        ELSE 'Not Verified'
    END as status
FROM auth.users 
WHERE email = 'nbaldovino5@gmail.com'
ORDER BY created_at DESC;

-- 3. OPCIÓN A: Resetear contraseña del usuario más reciente
-- Descomenta y ejecuta esta línea con tu nueva contraseña:
-- UPDATE auth.users 
-- SET encrypted_password = crypt('TU_NUEVA_CONTRASEÑA_AQUI', gen_salt('bf'))
-- WHERE email = 'nbaldovino5@gmail.com'
-- ORDER BY created_at DESC
-- LIMIT 1;

-- 4. OPCIÓN B: Eliminar usuarios duplicados y mantener solo el más reciente
-- CUIDADO: Esto eliminará permanentemente los usuarios antiguos
-- DELETE FROM auth.users 
-- WHERE email = 'nbaldovino5@gmail.com'
-- AND id NOT IN (
--     SELECT id FROM auth.users 
--     WHERE email = 'nbaldovino5@gmail.com'
--     ORDER BY created_at DESC
--     LIMIT 1
-- );

-- 5. Verificar el resultado
SELECT 'Después de los cambios:' as info;
SELECT id, email, email_confirmed_at IS NOT NULL as verified 
FROM auth.users 
WHERE email = 'nbaldovino5@gmail.com'; 