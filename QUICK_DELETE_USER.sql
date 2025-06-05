-- ELIMINAR USUARIO ESPECÍFICO RÁPIDAMENTE

-- Eliminar el usuario con el email problemático
DELETE FROM auth.users 
WHERE email = 'mbaldovinodunker@gmail.com';

-- Verificar que se eliminó
SELECT 
    'Usuarios con ese email después de eliminar:' as info,
    COUNT(*) as count 
FROM auth.users 
WHERE email = 'mbaldovinodunker@gmail.com';

-- Ver todos los usuarios que quedan
SELECT 
    email,
    created_at,
    email_confirmed_at IS NOT NULL as verified
FROM auth.users
ORDER BY created_at DESC; 