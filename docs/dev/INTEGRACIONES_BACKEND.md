# Estado de las Integraciones Backend

## 📊 Resumen Ejecutivo

**Estado actual:** ✅ La aplicación está **100% lista para integrarse con backend**

La estructura de código está diseñada para facilitar la integración con:
- ✅ Autenticación Google OAuth
- ✅ Base de datos (Supabase recomendado)
- ✅ YouTube Data API
- ✅ Almacenamiento de archivos (partituras PDF)

---

## 🔐 1. AUTENTICACIÓN CON GOOGLE

### Estado Actual: ✅ LISTO PARA INTEGRAR

#### Implementación Actual (Mock)

**Archivo:** `/components/Login.tsx`

```typescript
const handleGoogleLogin = () => {
  // In production, this would use real Google OAuth
  const mockUser = {
    id: 'user123',
    email: 'usuario@ejemplo.com',
    name: 'Usuario Demo',
    photoUrl: undefined,
  };
  
  setAppState('profile-setup');
};
```

#### Integración Requerida con Supabase

**Paso 1: Configurar Google OAuth en Supabase**

1. En Supabase Dashboard → Authentication → Providers → Google
2. Configurar Client ID y Client Secret de Google Cloud Console
3. Agregar URL de callback autorizada

**Paso 2: Reemplazar el Mock Login**

```typescript
// ANTES (Mock)
const handleGoogleLogin = () => {
  const mockUser = { ... };
  setAppState('profile-setup');
};

// DESPUÉS (Supabase Real)
import { supabase } from './lib/supabase';

const handleGoogleLogin = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    
    // Supabase manejará la redirección automáticamente
  } catch (error) {
    console.error('Error en login:', error);
    toast.error('Error al iniciar sesión con Google');
  }
};
```

**Paso 3: Manejar el Callback de Autenticación**

```typescript
// En App.tsx o en un hook useEffect
useEffect(() => {
  // Escuchar cambios en la autenticación
  const { data: authListener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Verificar si el usuario ya tiene un perfil
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          // Usuario existente - ir a vista principal
          setUserProfile({
            id: profile.id,
            email: session.user.email!,
            name: profile.name,
            role: profile.role,
            instrument: profile.instrument,
            photoUrl: session.user.user_metadata.avatar_url,
          });
          setAppState('main');
        } else {
          // Usuario nuevo - ir a setup de perfil
          setAppState('profile-setup');
        }
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setAppState('login');
      }
    }
  );

  return () => {
    authListener.subscription.unsubscribe();
  };
}, []);
```

#### Estructura de Base de Datos Necesaria

**Tabla: `user_profiles`**

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Coro', 'Pueblo fiel', 'Admin')),
  instrument TEXT CHECK (instrument IN ('Coro', 'Guitarra', 'Órgano')),
  parish_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden leer su propio perfil
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Cualquier usuario autenticado puede crear su perfil
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

#### Configuración de Supabase Client

**Archivo nuevo:** `/lib/supabase.ts`

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

**Variables de entorno:** `.env`

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

---

## 🎥 2. INTEGRACIÓN CON YOUTUBE

### Estado Actual: ✅ LISTO PARA USAR

#### Implementación Actual

**Archivo:** `/components/SongPlayer.tsx`

```typescript
<iframe
  width="100%"
  height="100%"
  src={`https://www.youtube.com/embed/${song.youtubeId}?rel=0`}
  title={song.title}
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
```

#### ✅ Funcionalidad Actual

1. **Reproductor embebido:** Ya está implementado y funciona correctamente
2. **ID de YouTube:** Se almacena en el campo `youtubeId` de cada canción
3. **Sin restricciones:** Usa iframe embed que no requiere API key

#### 🔧 Mejoras Opcionales con YouTube Data API

Si deseas agregar funcionalidad avanzada:

**Características adicionales posibles:**
- ✅ Obtener duración del video automáticamente
- ✅ Validar que el video existe y es público
- ✅ Obtener thumbnails de mejor calidad
- ✅ Detectar si el video fue eliminado o privatizado

**Configuración de YouTube Data API:**

1. **Google Cloud Console:**
   - Habilitar YouTube Data API v3
   - Crear API Key
   - Restringir key a tu dominio

2. **Variables de entorno:**
```bash
VITE_YOUTUBE_API_KEY=tu-api-key-aqui
```

3. **Función de utilidad:**

```typescript
// utils/youtube.ts
export async function getYouTubeVideoInfo(videoId: string) {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails,status&key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      
      return {
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.high.url,
        duration: parseDuration(video.contentDetails.duration),
        isAvailable: video.status.privacyStatus === 'public',
        channelTitle: video.snippet.channelTitle,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching YouTube video:', error);
    return null;
  }
}

// Convertir formato ISO 8601 a minutos:segundos
function parseDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
```

4. **Uso en AdminDashboard al agregar canción:**

```typescript
const handleAddSong = async (newSong) => {
  // Validar el video de YouTube
  const videoInfo = await getYouTubeVideoInfo(newSong.youtubeId);
  
  if (!videoInfo) {
    toast.error('El video de YouTube no existe o no es público');
    return;
  }
  
  if (!videoInfo.isAvailable) {
    toast.error('El video no está disponible públicamente');
    return;
  }
  
  // Auto-llenar duración si no se proporcionó
  if (!newSong.duration && videoInfo.duration) {
    newSong.duration = videoInfo.duration;
  }
  
  // Guardar en base de datos
  const { error } = await supabase
    .from('songs')
    .insert({
      ...newSong,
      thumbnail_url: videoInfo.thumbnail,
    });
    
  if (error) {
    toast.error('Error al guardar la canción');
    return;
  }
  
  toast.success('Canción agregada exitosamente');
};
```

#### ⚠️ Límites de Cuota de YouTube API

- **Cuota diaria gratuita:** 10,000 unidades/día
- **Costo de consulta video:** 1 unidad
- **Recomendación:** Solo validar al AGREGAR canción (admin), no en cada reproducción

---

## 📚 3. BASE DE DATOS - ESTRUCTURA COMPLETA

### Tablas Necesarias

#### 3.1 Tabla `songs`

```sql
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  sheet_music_url TEXT,
  duration TEXT NOT NULL,
  artist TEXT,
  author TEXT,
  version TEXT CHECK (version IN ('Coro', 'Guitarra', 'Órgano')),
  mass_name TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para búsqueda rápida
CREATE INDEX idx_songs_category ON songs(category);
CREATE INDEX idx_songs_mass_name ON songs(mass_name) WHERE mass_name IS NOT NULL;
CREATE INDEX idx_songs_version ON songs(version);
CREATE INDEX idx_songs_title ON songs USING gin(to_tsvector('spanish', title));

-- RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Policy: Todos pueden leer cantos
CREATE POLICY "Anyone can read songs"
  ON songs FOR SELECT
  USING (true);

-- Policy: Solo admins pueden insertar/actualizar/eliminar
CREATE POLICY "Only admins can modify songs"
  ON songs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'Admin'
    )
  );
```

#### 3.2 Tabla `published_cantorals`

```sql
CREATE TABLE published_cantorals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  choir_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  choir_name TEXT NOT NULL,
  parish_name TEXT NOT NULL,
  date DATE NOT NULL,
  liturgical_date TEXT NOT NULL,
  mass_time TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_cantorals_choir ON published_cantorals(choir_id);
CREATE INDEX idx_cantorals_parish ON published_cantorals(parish_name);
CREATE INDEX idx_cantorals_date ON published_cantorals(date);

-- RLS
ALTER TABLE published_cantorals ENABLE ROW LEVEL SECURITY;

-- Policy: Todos pueden leer cantorales publicados
CREATE POLICY "Anyone can read published cantorals"
  ON published_cantorals FOR SELECT
  USING (true);

-- Policy: Solo coros pueden publicar
CREATE POLICY "Choirs can publish cantorals"
  ON published_cantorals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'Coro'
    )
  );

-- Policy: Coros pueden actualizar sus propios cantorales
CREATE POLICY "Choirs can update own cantorals"
  ON published_cantorals FOR UPDATE
  USING (choir_id = auth.uid());

-- Policy: Coros pueden eliminar sus propios cantorales
CREATE POLICY "Choirs can delete own cantorals"
  ON published_cantorals FOR DELETE
  USING (choir_id = auth.uid());
```

#### 3.3 Tabla `cantoral_songs` (relación muchos-a-muchos)

```sql
CREATE TABLE cantoral_songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cantoral_id UUID NOT NULL REFERENCES published_cantorals(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- Orden de las canciones en el cantoral
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cantoral_id, song_id)
);

-- Índices
CREATE INDEX idx_cantoral_songs_cantoral ON cantoral_songs(cantoral_id);
CREATE INDEX idx_cantoral_songs_song ON cantoral_songs(song_id);
CREATE INDEX idx_cantoral_songs_position ON cantoral_songs(cantoral_id, position);

-- RLS
ALTER TABLE cantoral_songs ENABLE ROW LEVEL SECURITY;

-- Policy: Todos pueden leer
CREATE POLICY "Anyone can read cantoral songs"
  ON cantoral_songs FOR SELECT
  USING (true);

-- Policy: Solo el dueño del cantoral puede agregar canciones
CREATE POLICY "Choir can add songs to own cantoral"
  ON cantoral_songs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM published_cantorals
      WHERE published_cantorals.id = cantoral_id
      AND published_cantorals.choir_id = auth.uid()
    )
  );
```

---

## 📝 4. FUNCIONES DE INTEGRACIÓN NECESARIAS

### 4.1 Publicar Cantoral

**Archivo:** `/lib/cantorals.ts`

```typescript
import { supabase } from './supabase';
import { PublishedCantoral, Song } from '../types';

export async function publishCantoral(
  cantoral: {
    parishName: string;
    date: string;
    liturgicalDate: string;
    massTime: string;
    songs: Song[];
  }
): Promise<{ data: PublishedCantoral | null; error: Error | null }> {
  try {
    // 1. Obtener el perfil del usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'Coro') {
      throw new Error('Solo los coros pueden publicar cantorales');
    }

    // 2. Crear el cantoral
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

    // 3. Agregar las canciones al cantoral
    const cantoralSongs = cantoral.songs.map((song, index) => ({
      cantoral_id: newCantoral.id,
      song_id: song.id,
      position: index,
    }));

    const { error: songsError } = await supabase
      .from('cantoral_songs')
      .insert(cantoralSongs);

    if (songsError) throw songsError;

    // 4. Retornar el cantoral completo
    return {
      data: {
        id: newCantoral.id,
        choirId: newCantoral.choir_id,
        choirName: newCantoral.choir_name,
        parishName: newCantoral.parish_name,
        date: newCantoral.date,
        liturgicalDate: newCantoral.liturgical_date,
        massTime: newCantoral.mass_time,
        songs: cantoral.songs,
        createdAt: newCantoral.created_at,
        publishedBy: newCantoral.published_by,
        publishedAt: newCantoral.published_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error publicando cantoral:', error);
    return { data: null, error: error as Error };
  }
}
```

### 4.2 Obtener Cantorales Publicados

```typescript
export async function getPublishedCantorals(
  filters?: {
    parishName?: string;
    date?: string;
    choirId?: string;
  }
): Promise<{ data: PublishedCantoral[]; error: Error | null }> {
  try {
    let query = supabase
      .from('published_cantorals')
      .select(`
        *,
        cantoral_songs (
          position,
          song:songs (*)
        )
      `)
      .order('date', { ascending: false });

    if (filters?.parishName) {
      query = query.eq('parish_name', filters.parishName);
    }

    if (filters?.date) {
      query = query.eq('date', filters.date);
    }

    if (filters?.choirId) {
      query = query.eq('choir_id', filters.choirId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transformar los datos al formato esperado
    const cantorals: PublishedCantoral[] = data.map(cantoral => ({
      id: cantoral.id,
      choirId: cantoral.choir_id,
      choirName: cantoral.choir_name,
      parishName: cantoral.parish_name,
      date: cantoral.date,
      liturgicalDate: cantoral.liturgical_date,
      massTime: cantoral.mass_time,
      songs: cantoral.cantoral_songs
        .sort((a, b) => a.position - b.position)
        .map(cs => cs.song),
      createdAt: cantoral.created_at,
      publishedBy: cantoral.published_by,
      publishedAt: cantoral.published_at,
    }));

    return { data: cantorals, error: null };
  } catch (error) {
    console.error('Error obteniendo cantorales:', error);
    return { data: [], error: error as Error };
  }
}
```

### 4.3 Agregar Canción (Solo Admin)

```typescript
export async function addSong(song: Omit<Song, 'id'>): Promise<{ data: Song | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Verificar que el usuario es admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'Admin') {
      throw new Error('Solo los administradores pueden agregar canciones');
    }

    // Insertar la canción
    const { data: newSong, error } = await supabase
      .from('songs')
      .insert({
        title: song.title,
        category: song.category,
        youtube_id: song.youtubeId,
        sheet_music_url: song.sheetMusicUrl,
        duration: song.duration,
        artist: song.artist,
        author: song.author,
        version: song.version,
        mass_name: song.massName,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Transformar al formato Song
    const result: Song = {
      id: newSong.id,
      title: newSong.title,
      category: newSong.category,
      youtubeId: newSong.youtube_id,
      sheetMusicUrl: newSong.sheet_music_url,
      duration: newSong.duration,
      artist: newSong.artist,
      author: newSong.author,
      version: newSong.version,
      massName: newSong.mass_name,
    };

    return { data: result, error: null };
  } catch (error) {
    console.error('Error agregando canción:', error);
    return { data: null, error: error as Error };
  }
}
```

### 4.4 Buscar Canciones

```typescript
export async function searchSongs(
  filters?: {
    category?: string;
    searchTerm?: string;
    massName?: string;
    version?: string;
  }
): Promise<{ data: Song[]; error: Error | null }> {
  try {
    let query = supabase
      .from('songs')
      .select('*')
      .order('title', { ascending: true });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.massName) {
      query = query.eq('mass_name', filters.massName);
    }

    if (filters?.version) {
      query = query.eq('version', filters.version);
    }

    if (filters?.searchTerm) {
      query = query.or(`
        title.ilike.%${filters.searchTerm}%,
        artist.ilike.%${filters.searchTerm}%,
        author.ilike.%${filters.searchTerm}%,
        mass_name.ilike.%${filters.searchTerm}%
      `);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transformar al formato Song
    const songs: Song[] = data.map(song => ({
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
    }));

    return { data: songs, error: null };
  } catch (error) {
    console.error('Error buscando canciones:', error);
    return { data: [], error: error as Error };
  }
}
```

---

## 📦 5. ALMACENAMIENTO DE PARTITURAS

### Configuración de Supabase Storage

**1. Crear bucket para partituras:**

```sql
-- En Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('sheet-music', 'sheet-music', true);
```

**2. Políticas de acceso:**

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
```

**3. Función para subir partituras:**

```typescript
export async function uploadSheetMusic(
  file: File,
  songId: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${songId}.${fileExt}`;
    const filePath = `partituras/${fileName}`;

    // Subir archivo
    const { error: uploadError } = await supabase.storage
      .from('sheet-music')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Obtener URL pública
    const { data } = supabase.storage
      .from('sheet-music')
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error subiendo partitura:', error);
    return { url: null, error: error as Error };
  }
}
```

---

## ✅ CHECKLIST DE INTEGRACIÓN

### Fase 1: Configuración Inicial
- [ ] Crear proyecto en Supabase
- [ ] Configurar Google OAuth en Supabase
- [ ] Crear tablas en base de datos
- [ ] Configurar políticas RLS
- [ ] Crear bucket de storage para partituras
- [ ] Configurar variables de entorno

### Fase 2: Autenticación
- [ ] Instalar `@supabase/supabase-js`
- [ ] Crear cliente de Supabase (`/lib/supabase.ts`)
- [ ] Reemplazar mock login con Supabase OAuth
- [ ] Implementar listener de auth state
- [ ] Manejar creación de perfil de usuario
- [ ] Implementar logout

### Fase 3: Canciones
- [ ] Implementar función `searchSongs()`
- [ ] Reemplazar `mockSongs` con llamadas a Supabase
- [ ] Implementar función `addSong()` (admin)
- [ ] Implementar función `updateSong()` (admin)
- [ ] Implementar función `deleteSong()` (admin)
- [ ] (Opcional) Integrar YouTube Data API para validación

### Fase 4: Cantorales
- [ ] Implementar función `publishCantoral()`
- [ ] Implementar función `getPublishedCantorals()`
- [ ] Implementar función `updateCantoral()`
- [ ] Implementar función `deleteCantoral()`
- [ ] Implementar filtros por parroquia/fecha

### Fase 5: Partituras
- [ ] Implementar función `uploadSheetMusic()`
- [ ] Agregar uploader de archivos en AdminDashboard
- [ ] Validar formato de archivos (solo PDF)
- [ ] Implementar límite de tamaño de archivo
- [ ] Mostrar URLs de partituras en SongPlayer

### Fase 6: Testing
- [ ] Probar login con Google
- [ ] Probar creación de perfil
- [ ] Probar búsqueda de canciones
- [ ] Probar publicación de cantorales
- [ ] Probar permisos (Coro vs Admin vs Pueblo Fiel)
- [ ] Probar subida de partituras

### Fase 7: Optimización
- [ ] Implementar caché local de canciones
- [ ] Implementar paginación de cantorales
- [ ] Optimizar queries con select específicos
- [ ] Agregar loading states
- [ ] Implementar error handling robusto

---

## 📦 DEPENDENCIAS NPM NECESARIAS

```bash
npm install @supabase/supabase-js
```

---

## 🎯 CONCLUSIÓN

**Estado: ✅ TODO ESTÁ LISTO PARA INTEGRAR**

La aplicación fue diseñada desde el principio con backend en mente:

1. ✅ **Tipos TypeScript** están perfectamente definidos
2. ✅ **Estructura de componentes** separa lógica de UI
3. ✅ **Props drilling** permite fácil reemplazo de funciones mock
4. ✅ **YouTube** ya funciona con iframe embed (no requiere cambios)
5. ✅ **UX/UI** completo y profesional

**Próximo paso:** Conectar Supabase siguiendo el checklist de integración.

Todo el código mock puede ser reemplazado sin modificar la UI.
