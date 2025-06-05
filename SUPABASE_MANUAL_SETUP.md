# Manual Setup Guide for Avatar Upload

## Error Solution: Permission Issues

Si obtuviste el error `"must be owner of table objects"`, esto significa que necesitas configurar el storage manualmente. Aquí están las dos opciones:

## Opción 1: Script Simplificado (Recomendado)

En lugar del script original, usa `supabase_storage_setup_simple.sql`:

1. **Ve a tu Supabase Dashboard → SQL Editor**
2. **Copia y pega exactamente esto:**

```sql
-- PicklePlay Avatar Storage Setup (Simplified Version)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET 
  public = true;

-- Verify the bucket was created
SELECT 
  'Bucket created: ' || name as status,
  'Public: ' || public::text as public_status
FROM storage.buckets 
WHERE id = 'avatars';
```

3. **Haz clic en "Run"**
4. **Deberías ver:** `Bucket created: avatars, Public: true`

## Opción 2: Configuración Manual en la UI

Si el script tampoco funciona, hazlo manualmente:

### Paso 1: Crear el Bucket
1. **Ve a Storage** en el menú lateral de Supabase
2. **Haz clic en "New bucket"**
3. **Nombre del bucket:** `avatars` (exactamente así, en minúsculas)
4. **✅ Marca "Public bucket"** (muy importante)
5. **Haz clic en "Create bucket"**

### Paso 2: Verificar la Configuración
1. **En Storage → Buckets**, deberías ver:
   - Nombre: `avatars`
   - Public: `true` (con un ícono de ojo abierto)

### Paso 3: Configurar Políticas (Opcional)
Si quieres más seguridad, ve a **SQL Editor** y ejecuta:

```sql
-- Solo si quieres políticas adicionales
CREATE POLICY "Avatar upload for authenticated users" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);
```

**Nota:** Si este comando también da error de permisos, no te preocupes. El bucket público funcionará de todas formas.

## Prueba que Funciona

Después de crear el bucket:

1. **Abre PicklePlay app**
2. **Ve a Profile → Editar perfil**
3. **Toca el ícono de cámara**
4. **Selecciona "Photo Library"**
5. **Elige una imagen**
6. **Debería subir exitosamente**

## Si Sigues Teniendo Problemas

### Verificación Final
En **SQL Editor**, ejecuta esta consulta para verificar:

```sql
SELECT name, public FROM storage.buckets WHERE id = 'avatars';
```

Debería devolver:
- `name: avatars`
- `public: true`

### Problemas Comunes
1. **Bucket no es público:** Ve a Storage → Buckets → Editar el bucket "avatars" → Marcar "Public"
2. **Nombre incorrecto:** Debe ser exactamente `avatars` (minúsculas, plural)
3. **App sigue fallando:** Reinicia la app después de crear el bucket

¡La configuración manual debería funcionar perfectamente para la subida de avatares! 