# 👻 Usuarios Fantasma - Solución Rápida

## ¿Qué está pasando?
Aunque creas que la base de datos está vacía, hay usuarios "fantasma":
- Se crearon durante pruebas anteriores
- No tienen perfil pero SÍ existen en auth.users
- Por eso el sistema dice "email already exists"

## Solución Inmediata

### 1. Ejecuta `QUICK_DELETE_USER.sql`
Esto eliminará el usuario problemático inmediatamente.

### 2. O ejecuta este comando directo:
```sql
DELETE FROM auth.users WHERE email = 'mbaldovinodunker@gmail.com';
```

### 3. Para ver TODOS los usuarios ocultos:
```sql
SELECT email, created_at FROM auth.users;
```

## ¿Por qué pasó esto?
- Durante las pruebas, se crean usuarios en auth.users
- Si no completas el registro, quedan "fantasma"
- La tabla profiles puede estar vacía, pero auth.users no

## Prevención
- Siempre completa el proceso de registro
- O elimina usuarios de prueba después de usarlos 