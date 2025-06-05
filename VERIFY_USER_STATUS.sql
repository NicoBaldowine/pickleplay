-- 🔍 VERIFICAR ESTADO DE TU USUARIO

-- 1. ¿Cuántos usuarios hay con tu email?
SELECT 
    COUNT(*) as total_usuarios,
    email
FROM auth.users 
WHERE email = 'nbaldovino5@gmail.com'
GROUP BY email;

-- 2. Ver TODOS los detalles de tu usuario
SELECT 
    id,
    email,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Email Verificado'
        ELSE '❌ Email NO Verificado'
    END as estado_email,
    created_at,
    updated_at,
    last_sign_in_at,
    CASE 
        WHEN encrypted_password IS NOT NULL THEN '✅ Tiene contraseña'
        ELSE '❌ NO tiene contraseña'
    END as tiene_password
FROM auth.users 
WHERE email = 'nbaldovino5@gmail.com'
ORDER BY created_at DESC;

-- 3. ¿Tienes perfil?
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Tienes perfil'
        ELSE '❌ NO tienes perfil'
    END as estado_perfil,
    COUNT(*) as total_perfiles
FROM profiles 
WHERE email = 'nbaldovino5@gmail.com';

-- 4. Ver si hay problemas con el ID
SELECT 
    u.id as user_id,
    u.email,
    p.id as profile_id,
    CASE 
        WHEN p.id IS NULL THEN '❌ Perfil faltante'
        ELSE '✅ Perfil existe'
    END as estado
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'nbaldovino5@gmail.com'; 