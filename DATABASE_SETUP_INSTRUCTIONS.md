# 🎯 Database Setup Instructions

## Solo necesitas 1 archivo:
- **COMPLETE_DATABASE_SETUP.sql** - TODO lo que necesitas

## Pasos:

1. **Ve a Supabase SQL Editor**
2. **Crea nueva query** (New query)
3. **Copia y pega** todo el contenido de `COMPLETE_DATABASE_SETUP.sql`
4. **Ejecuta** (Run)

## ¿Qué hace el script?

1. **Borra todo** lo existente (tablas, triggers, funciones)
2. **Crea 3 tablas**:
   - `profiles` - Perfiles de usuarios
   - `games` - Juegos de pickleball
   - `game_users` - Participantes en juegos
3. **Sin triggers automáticos** - La app maneja todo
4. **Sin RLS** - Para desarrollo rápido

## Después de ejecutar:

1. Verás 3 confirmaciones que las tablas existen
2. La app está lista para usar
3. Crea una cuenta nueva y debería funcionar sin errores

## Estructura final:

```
auth.users (Supabase)
    ↓
public.profiles (Tu perfil)
    ↓
public.games (Juegos que creas)
    ↓
public.game_users (Quién juega)
```

¡Eso es todo! Simple y limpio. 🚀 