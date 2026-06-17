# 🚀 Guía de Setup del Backend - Stella Maris

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de Supabase](#configuración-de-supabase)
3. [Configuración de Google OAuth](#configuración-de-google-oauth)
4. [Crear Base de Datos](#crear-base-de-datos)
5. [Configurar Storage](#configurar-storage)
6. [Configurar Frontend](#configurar-frontend)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## ✅ Requisitos Previos

### Cuentas Necesarias

- [ ] Cuenta de Google (para OAuth)
- [ ] Cuenta de Supabase (gratis en https://supabase.com)
- [ ] Cuenta de Google Cloud Console (gratis)

### Conocimientos Técnicos

- Básico: SQL, JavaScript/TypeScript
- Intermedio: React, Node.js
- Opcional: PostgreSQL, REST APIs

---

## 🗄️ Configuración de Supabase

### Paso 1: Crear Proyecto en Supabase

1. **Ir a Supabase Dashboard:**
   ```
   https://app.supabase.com
   ```

2. **Crear Nuevo Proyecto:**
   - Click en "New Project"
   - Nombre del proyecto: `stella-maris`
   - Database Password: Generar contraseña segura (guardarla)
   - Region: Seleccionar región más cercana (ej: `South America (São Paulo)`)
   - Click "Create new project"

3. **Esperar Provisioning:**
   - El proyecto tarda ~2 minutos en estar listo
   - Verás un mensaje "Project is being set up"

### Paso 2: Obtener Credenciales

Una vez que el proyecto esté listo:

1. **Ir a Settings → API:**
   ```
   https://app.supabase.com/project/[tu-proyecto]/settings/api
   ```

2. **Copiar credenciales:**
   ```env
   Project URL: https://[tu-proyecto].supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (¡SECRETO!)
   ```

3. **Guardar en archivo `.env.local`:**
   ```bash
   # En la raíz del proyecto frontend
   VITE_SUPABASE_URL=https://[tu-proyecto].supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **IMPORTANTE:** Nunca subir el `service_role key` a Git. Solo usar `anon public key` en frontend.

---

## 🔐 Configuración de Google OAuth

### Paso 1: Crear Proyecto en Google Cloud Console

1. **Ir a Google Cloud Console:**
   ```
   https://console.cloud.google.com
   ```

2. **Crear Nuevo Proyecto:**
   - Click en dropdown de proyectos (arriba izquierda)
   - "New Project"
   - Nombre: `Stella Maris`
   - Click "Create"

### Paso 2: Configurar OAuth Consent Screen

1. **Ir a APIs & Services → OAuth consent screen:**
   ```
   https://console.cloud.google.com/apis/credentials/consent
   ```

2. **Configurar:**
   - User Type: `External`
   - App name: `Stella Maris`
   - User support email: Tu email
   - Developer contact: Tu email
   - Click "Save and Continue"

3. **Scopes:**
   - Click "Add or Remove Scopes"
   - Buscar y seleccionar:
     - `userinfo.email`
     - `userinfo.profile`
     - `openid`
   - Click "Update" y "Save and Continue"

4. **Test users (opcional para testing):**
   - Agregar tu email de prueba
   - Click "Save and Continue"

### Paso 3: Crear OAuth Client ID

1. **Ir a APIs & Services → Credentials:**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Create Credentials → OAuth client ID:**
   - Application type: `Web application`
   - Name: `Stella Maris Web Client`

3. **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   https://[tu-dominio].vercel.app
   ```

4. **Authorized redirect URIs:**
   ```
   https://[tu-proyecto].supabase.co/auth/v1/callback
   http://localhost:5173/auth/callback
   https://[tu-dominio].vercel.app/auth/callback
   ```

5. **Click "Create"**

6. **Copiar credenciales:**
   - Client ID: `123456789-abc.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-abc123...`

### Paso 4: Configurar Google OAuth en Supabase

1. **Ir a Supabase → Authentication → Providers:**
   ```
   https://app.supabase.com/project/[tu-proyecto]/auth/providers
   ```

2. **Habilitar Google Provider:**
   - Scroll hasta "Google"
   - Toggle "Enable" ON
   - Pegar Client ID
   - Pegar Client Secret
   - Click "Save"

---

## 💾 Crear Base de Datos

### Paso 1: Abrir SQL Editor

1. **Ir a Supabase → SQL Editor:**
   ```
   https://app.supabase.com/project/[tu-proyecto]/sql/new
   ```

### Paso 2: Ejecutar Scripts en Orden

#### Script 1: Habilitar Extensiones

```sql
-- Habilitar extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Click "Run" (Ctrl/Cmd + Enter)

#### Script 2: Crear Tablas

Copiar y pegar el siguiente script completo:

```sql
-- ====================
-- TABLAS PRINCIPALES
-- ====================

-- Tabla: user_profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Coro', 'Pueblo fiel', 'Admin')),
  instrument TEXT CHECK (instrument IS NULL OR instrument IN ('Coro', 'Guitarra', 'Órgano')),
  parish_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE user_profiles IS 'Perfiles de usuario con información adicional';

-- Tabla: songs
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  youtube_id TEXT NOT NULL CHECK (youtube_id ~ '^[a-zA-Z0-9_-]{11}$'),
  sheet_music_url TEXT,
  duration TEXT NOT NULL CHECK (duration ~ '^\d+:\d{2}$'),
  artist TEXT,
  author TEXT,
  version TEXT CHECK (version IS NULL OR version IN ('Coro', 'Guitarra', 'Órgano')),
  mass_name TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE songs IS 'Biblioteca de cantos litúrgicos';

-- Tabla: published_cantorals
CREATE TABLE published_cantorals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  choir_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  choir_name TEXT NOT NULL,
  parish_name TEXT NOT NULL,
  date DATE NOT NULL,
  liturgical_date TEXT NOT NULL,
  mass_time TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE published_cantorals IS 'Cantorales publicados por los coros';

-- Tabla: cantoral_songs
CREATE TABLE cantoral_songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cantoral_id UUID NOT NULL REFERENCES published_cantorals(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(cantoral_id, song_id)
);

COMMENT ON TABLE cantoral_songs IS 'Relación entre cantorales y cantos con orden específico';
```

Click "Run"

✅ Deberías ver: "Success. No rows returned"

#### Script 3: Crear Índices

```sql
-- ====================
-- ÍNDICES
-- ====================

-- Índices en user_profiles
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_parish ON user_profiles(parish_name) WHERE parish_name IS NOT NULL;

-- Índices en songs
CREATE INDEX idx_songs_category ON songs(category);
CREATE INDEX idx_songs_mass_name ON songs(mass_name) WHERE mass_name IS NOT NULL;
CREATE INDEX idx_songs_version ON songs(version) WHERE version IS NOT NULL;
CREATE INDEX idx_songs_title_fts ON songs USING gin(to_tsvector('spanish', title));
CREATE INDEX idx_songs_category_version ON songs(category, version) WHERE version IS NOT NULL;
CREATE INDEX idx_songs_author ON songs(author) WHERE author IS NOT NULL;

-- Índices en published_cantorals
CREATE INDEX idx_cantorals_choir ON published_cantorals(choir_id);
CREATE INDEX idx_cantorals_parish ON published_cantorals(parish_name);
CREATE INDEX idx_cantorals_date ON published_cantorals(date DESC);
CREATE INDEX idx_cantorals_parish_date ON published_cantorals(parish_name, date DESC);

-- Índices en cantoral_songs
CREATE INDEX idx_cantoral_songs_cantoral ON cantoral_songs(cantoral_id, position);
CREATE INDEX idx_cantoral_songs_song ON cantoral_songs(song_id);
CREATE INDEX idx_cantoral_songs_position ON cantoral_songs(position);
```

Click "Run"

#### Script 4: Habilitar RLS

```sql
-- ====================
-- ROW LEVEL SECURITY
-- ====================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_cantorals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cantoral_songs ENABLE ROW LEVEL SECURITY;
```

Click "Run"

#### Script 5: Políticas RLS - user_profiles

```sql
-- Políticas para user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.role = 'Admin'
    )
  );
```

Click "Run"

#### Script 6: Políticas RLS - songs

```sql
-- Políticas para songs
CREATE POLICY "Anyone can read songs"
  ON songs FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert songs"
  ON songs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'Admin'
    )
  );

CREATE POLICY "Only admins can update songs"
  ON songs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'Admin'
    )
  );

CREATE POLICY "Only admins can delete songs"
  ON songs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'Admin'
    )
  );
```

Click "Run"

#### Script 7: Políticas RLS - published_cantorals

```sql
-- Políticas para published_cantorals
CREATE POLICY "Anyone can read published cantorals"
  ON published_cantorals FOR SELECT
  USING (true);

CREATE POLICY "Choirs can publish cantorals"
  ON published_cantorals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'Coro'
    )
    AND choir_id = auth.uid()
  );

CREATE POLICY "Choirs can update own cantorals"
  ON published_cantorals FOR UPDATE
  USING (choir_id = auth.uid())
  WITH CHECK (choir_id = auth.uid());

CREATE POLICY "Choirs can delete own cantorals"
  ON published_cantorals FOR DELETE
  USING (choir_id = auth.uid());

CREATE POLICY "Admins can manage all cantorals"
  ON published_cantorals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'Admin'
    )
  );
```

Click "Run"

#### Script 8: Políticas RLS - cantoral_songs

```sql
-- Políticas para cantoral_songs
CREATE POLICY "Anyone can read cantoral songs"
  ON cantoral_songs FOR SELECT
  USING (true);

CREATE POLICY "Choir can add songs to own cantoral"
  ON cantoral_songs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM published_cantorals
      WHERE published_cantorals.id = cantoral_id
        AND published_cantorals.choir_id = auth.uid()
    )
  );

CREATE POLICY "Choir can remove songs from own cantoral"
  ON cantoral_songs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM published_cantorals
      WHERE published_cantorals.id = cantoral_id
        AND published_cantorals.choir_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all cantoral songs"
  ON cantoral_songs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'Admin'
    )
  );
```

Click "Run"

#### Script 9: Triggers

```sql
-- ====================
-- TRIGGERS
-- ====================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger a songs
CREATE TRIGGER update_songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

Click "Run"

### Paso 3: Insertar Datos de Prueba (Opcional)

```sql
-- Usuario admin de prueba (reemplazar con tu UUID real después del primer login)
-- Este script fallará hasta que hagas login por primera vez
-- Luego reemplaza 'TU-UUID-AQUI' con tu UUID real de auth.users

INSERT INTO user_profiles (id, email, name, role) VALUES
('TU-UUID-AQUI', 'tu-email@gmail.com', 'Admin Sistema', 'Admin');

-- Cantos de prueba
INSERT INTO songs (title, category, youtube_id, duration, author, version) VALUES
('Pescador de Hombres', 'Comunión', 'dQw4w9WgXcQ', '4:30', 'Cesáreo Gabaráin', 'Coro'),
('Juntos como Hermanos', 'Entrada', 'dQw4w9WgXcR', '3:45', 'Cesáreo Gabaráin', 'Guitarra'),
('Salmo 23', 'Salmo', 'dQw4w9WgXcS', '3:15', 'Traditional', 'Órgano');
```

---

## 📦 Configurar Storage

### Paso 1: Crear Bucket

1. **Ir a Storage en Supabase:**
   ```
   https://app.supabase.com/project/[tu-proyecto]/storage/buckets
   ```

2. **Create a new bucket:**
   - Name: `sheet-music`
   - Public bucket: ✅ ON
   - File size limit: `10 MB` (opcional)
   - Allowed MIME types: `application/pdf` (opcional)
   - Click "Create bucket"

### Paso 2: Configurar Políticas de Storage

1. **Ir a SQL Editor y ejecutar:**

```sql
-- Política: Todos pueden leer partituras
CREATE POLICY "Anyone can read sheet music"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sheet-music');

-- Política: Solo admins pueden subir partituras
CREATE POLICY "Only admins can upload sheet music"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'sheet-music'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'Admin'
    )
  );

-- Política: Solo admins pueden eliminar partituras
CREATE POLICY "Only admins can delete sheet music"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'sheet-music'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'Admin'
    )
  );
```

### Paso 3: Crear Carpeta

1. **En Storage → sheet-music:**
   - Click "Create folder"
   - Name: `partituras`
   - Click "Create"

---

## ⚛️ Configurar Frontend

### Paso 1: Instalar Dependencias

```bash
cd [tu-proyecto-frontend]
npm install @supabase/supabase-js
```

### Paso 2: Crear Cliente de Supabase

Crear archivo `/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

### Paso 3: Reemplazar Mock Login

En `/App.tsx`, reemplazar:

```typescript
// ANTES (Mock)
const handleGoogleLogin = () => {
  const mockUser = { ... };
  setAppState('profile-setup');
};

// DESPUÉS (Supabase Real)
import { supabase } from './lib/supabase';

const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Error en login:', error);
    toast.error('Error al iniciar sesión');
  }
};
```

### Paso 4: Auth Listener

Agregar en `App.tsx`:

```typescript
useEffect(() => {
  // Listener de cambios en autenticación
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('Auth event:', event, session);

      if (event === 'SIGNED_IN' && session?.user) {
        // Verificar si tiene perfil
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          // Usuario existente
          setUserProfile({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role as UserRole,
            instrument: profile.instrument as InstrumentType,
            photoUrl: session.user.user_metadata.avatar_url,
          });
          setAppState('main');
        } else {
          // Usuario nuevo - ir a setup
          setAppState('profile-setup');
        }
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setCantoral([]);
        setAppState('login');
      }
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### Paso 5: Crear funciones de API

Crear archivo `/lib/api.ts`:

```typescript
import { supabase } from './supabase';
import { Song, PublishedCantoral, UserProfile } from '../types';

// ========== USUARIOS ==========

export async function createUserProfile(profile: Omit<UserProfile, 'photoUrl'>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      instrument: profile.instrument,
      parish_name: (profile as any).parishName,
    })
    .select()
    .single();

  return { data, error };
}

// ========== CANTOS ==========

export async function searchSongs(filters?: {
  category?: string;
  version?: string;
  massName?: string;
  searchTerm?: string;
}) {
  let query = supabase
    .from('songs')
    .select('*')
    .order('title', { ascending: true });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.version) {
    query = query.eq('version', filters.version);
  }

  if (filters?.massName) {
    query = query.eq('mass_name', filters.massName);
  }

  if (filters?.searchTerm) {
    query = query.or(`
      title.ilike.%${filters.searchTerm}%,
      author.ilike.%${filters.searchTerm}%,
      artist.ilike.%${filters.searchTerm}%
    `);
  }

  const { data, error } = await query;

  // Transformar a formato frontend
  const songs: Song[] = data?.map(song => ({
    id: song.id,
    title: song.title,
    category: song.category,
    youtubeId: song.youtube_id,
    sheetMusicUrl: song.sheet_music_url,
    duration: song.duration,
    artist: song.artist,
    author: song.author,
    version: song.version,
    massName: song.mass_name,
  })) || [];

  return { data: songs, error };
}

// ========== CANTORALES ==========

export async function publishCantoral(cantoral: {
  parishName: string;
  date: string;
  liturgicalDate: string;
  massTime: string;
  songs: Song[];
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'Coro') {
    throw new Error('Solo los coros pueden publicar cantorales');
  }

  // Crear cantoral
  const { data: newCantoral, error: cantoralError } = await supabase
    .from('published_cantorals')
    .insert({
      choir_id: user.id,
      choir_name: profile.name,
      parish_name: cantoral.parishName,
      date: cantoral.date,
      liturgical_date: cantoral.liturgicalDate,
      mass_time: cantoral.massTime,
      published_by: user.id,
    })
    .select()
    .single();

  if (cantoralError) throw cantoralError;

  // Agregar cantos
  const cantoralSongs = cantoral.songs.map((song, index) => ({
    cantoral_id: newCantoral.id,
    song_id: song.id,
    position: index,
  }));

  const { error: songsError } = await supabase
    .from('cantoral_songs')
    .insert(cantoralSongs);

  if (songsError) throw songsError;

  return {
    data: {
      ...newCantoral,
      songs: cantoral.songs,
    },
    error: null,
  };
}
```

---

## 🧪 Testing

### Paso 1: Verificar Autenticación

1. **Iniciar frontend:**
   ```bash
   npm run dev
   ```

2. **Abrir browser:**
   ```
   http://localhost:5173
   ```

3. **Click "Continuar con Google"**

4. **Verificar que redirige a Google OAuth**

5. **Autorizar la app**

6. **Verificar que redirige de vuelta a tu app**

### Paso 2: Verificar Creación de Perfil

1. **En Profile Setup, seleccionar rol y guardar**

2. **Verificar en Supabase → Table Editor → user_profiles:**
   - Debe aparecer un nuevo registro con tu usuario

### Paso 3: Verificar Lectura de Cantos

1. **En Supabase SQL Editor, insertar cantos de prueba:**
   ```sql
   INSERT INTO songs (title, category, youtube_id, duration, author) VALUES
   ('Pescador de Hombres', 'Comunión', 'dQw4w9WgXcQ', '4:30', 'Cesáreo Gabaráin');
   ```

2. **En la app, ir a una categoría (ej: Comunión)**

3. **Verificar que aparece el canto**

### Paso 4: Verificar Publicación de Cantoral

1. **Agregar cantos al cantoral**

2. **Click "Publicar"**

3. **Completar formulario y publicar**

4. **Verificar en Supabase:**
   - Table Editor → published_cantorals
   - Table Editor → cantoral_songs

---

## 🚀 Deployment

### Frontend (Vercel)

1. **Push código a GitHub**

2. **Ir a Vercel:**
   ```
   https://vercel.com
   ```

3. **Import Git Repository**

4. **Configurar Environment Variables:**
   ```
   VITE_SUPABASE_URL=https://[tu-proyecto].supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```

5. **Deploy**

6. **Actualizar Google OAuth redirect URIs:**
   - Agregar: `https://[tu-app].vercel.app/auth/callback`

### Backend (Ya deployado en Supabase)

- ✅ Supabase está en la nube automáticamente
- ✅ No requiere deployment adicional

---

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"

**Solución:**
- Verificar que `.env.local` existe
- Verificar que las variables empiezan con `VITE_`
- Reiniciar el servidor de desarrollo

### Error: "Invalid login credentials"

**Solución:**
- Verificar que Google OAuth está configurado en Supabase
- Verificar redirect URIs en Google Cloud Console

### Error: "new row violates row-level security policy"

**Solución:**
- Verificar que las políticas RLS están creadas
- Verificar que el usuario tiene el rol correcto

### Error: "relation 'user_profiles' does not exist"

**Solución:**
- Verificar que ejecutaste todos los scripts SQL
- Ir a Table Editor y verificar que las tablas existen

### Cantos no aparecen en la app

**Solución:**
- Verificar que la política RLS permite SELECT
- Verificar en Network tab del browser si la request fue exitosa
- Verificar que hay datos en la tabla `songs`

---

## ✅ Checklist Final

### Supabase

- [ ] Proyecto creado
- [ ] Credenciales copiadas a `.env.local`
- [ ] Google OAuth configurado
- [ ] Todas las tablas creadas
- [ ] Todos los índices creados
- [ ] RLS habilitado en todas las tablas
- [ ] Todas las políticas RLS creadas
- [ ] Triggers creados
- [ ] Storage bucket `sheet-music` creado
- [ ] Políticas de storage creadas

### Frontend

- [ ] `@supabase/supabase-js` instalado
- [ ] `/lib/supabase.ts` creado
- [ ] `/lib/api.ts` creado
- [ ] Login con Google reemplazado
- [ ] Auth listener agregado
- [ ] Datos de prueba insertados
- [ ] Testing completado

### Google OAuth

- [ ] Proyecto en Google Cloud Console creado
- [ ] OAuth Consent Screen configurado
- [ ] OAuth Client ID creado
- [ ] Redirect URIs configurados
- [ ] Credenciales copiadas a Supabase

---

## 🎯 Conclusión

Si completaste todos los pasos, tu backend está **100% funcional** y listo para producción.

**Próximo paso:** Comenzar a usar la aplicación y agregar más cantos a la biblioteca.

**¿Problemas?** Revisa la sección de Troubleshooting o consulta la documentación de Supabase:
- https://supabase.com/docs
