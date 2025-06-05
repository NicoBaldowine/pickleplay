# 🔐 Solución para Problemas de Login

## El Problema
No puedes hacer login aunque usas la contraseña correcta. Esto puede pasar porque:
1. Hay múltiples usuarios con el mismo email
2. La contraseña se cambió durante las pruebas
3. El usuario no está verificado

## Solución Rápida

### Paso 1: Diagnosticar el Problema
Ejecuta `DEBUG_LOGIN.sql` en Supabase para ver:
- Cuántos usuarios hay con tu email
- Si están verificados
- Cuál es el más reciente

### Paso 2: Resetear tu Contraseña

**Opción A - Cambiar contraseña (Recomendado):**

1. Ve a Supabase → SQL Editor
2. Ejecuta este SQL (reemplaza `nueva_password_123` con tu contraseña):

```sql
UPDATE auth.users 
SET encrypted_password = crypt('nueva_password_123', gen_salt('bf'))
WHERE email = 'nbaldovino5@gmail.com'
ORDER BY created_at DESC
LIMIT 1;
```

3. Intenta login con la nueva contraseña

**Opción B - Crear cuenta nueva:**

1. Usa un email diferente
2. Completa el registro normalmente

### Paso 3: Limpiar Usuarios Duplicados (Opcional)

Si tienes múltiples usuarios con el mismo email, puedes limpiar:

```sql
-- Ver cuántos usuarios tienes
SELECT COUNT(*) FROM auth.users WHERE email = 'nbaldovino5@gmail.com';

-- Eliminar duplicados (mantiene el más reciente)
DELETE FROM auth.users 
WHERE email = 'nbaldovino5@gmail.com'
AND id != (
    SELECT id FROM auth.users 
    WHERE email = 'nbaldovino5@gmail.com'
    ORDER BY created_at DESC
    LIMIT 1
);
```

## Prevención
- El sistema ahora bloquea emails duplicados correctamente
- Siempre verifica tu email antes de hacer login
- Usa contraseñas que recuerdes

## ¿Necesitas más ayuda?
Si sigues con problemas, ejecuta `RESET_USER_PASSWORD.sql` para más opciones. 