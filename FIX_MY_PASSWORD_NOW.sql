-- 🔐 RESETEAR TU CONTRASEÑA AHORA MISMO

-- 1. Primero, veamos tu usuario
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'nbaldovino5@gmail.com';

-- 2. RESETEAR TU CONTRASEÑA
-- Cambia 'password123' por la contraseña que quieras usar
UPDATE auth.users 
SET 
    encrypted_password = crypt('password123', gen_salt('bf')),
    email_confirmed_at = NOW() -- Aseguramos que esté verificado
WHERE email = 'nbaldovino5@gmail.com';

-- 3. Verificar que funcionó
SELECT 
    'CONTRASEÑA RESETEADA!' as mensaje,
    'nbaldovino5@gmail.com' as tu_email,
    'password123' as tu_nueva_password,
    'CAMBIA password123 POR LA QUE QUIERAS EN EL SQL DE ARRIBA' as nota;

-- 4. ALTERNATIVA: Si quieres eliminar TODO y empezar de cero
-- DESCOMENTA ESTAS LÍNEAS:
-- DELETE FROM profiles WHERE email = 'nbaldovino5@gmail.com';
-- DELETE FROM auth.users WHERE email = 'nbaldovino5@gmail.com';
-- SELECT 'Usuario eliminado. Puedes crear una cuenta nueva.' as resultado; 