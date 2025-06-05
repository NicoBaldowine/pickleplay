-- Script para depurar problemas de login

-- 1. Ver todos los usuarios con ese email
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'nbaldovino5@gmail.com'
ORDER BY created_at DESC;

-- 2. Ver si hay perfil asociado
SELECT * FROM profiles WHERE email = 'nbaldovino5@gmail.com';

-- 3. Verificar el estado del usuario específico
SELECT 
    id,
    email,
    email_confirmed_at IS NOT NULL as is_verified,
    created_at
FROM auth.users 
WHERE id = '225f5d06-d49c-4b1e-b828-409ee4173ce0';

-- 4. Si necesitas resetear la contraseña manualmente:
-- UPDATE auth.users 
-- SET encrypted_password = crypt('nueva_password_aqui', gen_salt('bf'))
-- WHERE email = 'nbaldovino5@gmail.com'; 