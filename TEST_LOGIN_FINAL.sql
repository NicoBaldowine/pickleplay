-- 🚀 PROBAR LOGIN CON USUARIO DE PRUEBA

-- 1. Crear/Actualizar usuario de prueba
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'authenticated',
    'authenticated',
    'test@pickleplay.com',
    crypt('test123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
) 
ON CONFLICT (email) DO UPDATE SET
    encrypted_password = crypt('test123', gen_salt('bf')),
    email_confirmed_at = NOW();

-- 2. Verificar que se creó
SELECT 
    'Usuario de prueba listo!' as mensaje,
    'test@pickleplay.com' as email,
    'test123' as password;

-- 3. Ver el usuario
SELECT 
    id,
    email,
    email_confirmed_at IS NOT NULL as verificado
FROM auth.users 
WHERE email = 'test@pickleplay.com'; 