# 🏗️ Arquitectura Técnica - Stella Maris

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura de Sistema](#arquitectura-de-sistema)
3. [Arquitectura Frontend](#arquitectura-frontend)
4. [Arquitectura Backend](#arquitectura-backend)
5. [Flujo de Datos](#flujo-de-datos)
6. [Seguridad](#seguridad)
7. [Escalabilidad](#escalabilidad)

---

## 🌐 Visión General

Stella Maris sigue una arquitectura **cliente-servidor** con separación clara entre frontend y backend.

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                            │
│  React + TypeScript + Tailwind CSS + Vite              │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ HTTPS / REST API
                 │
┌────────────────▼────────────────────────────────────────┐
│                     BACKEND                             │
│              Supabase (BaaS)                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │ PostgreSQL + PostgREST + Auth + Storage          │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ OAuth 2.0
                 │
┌────────────────▼────────────────────────────────────────┐
│              SERVICIOS EXTERNOS                         │
│  Google OAuth | YouTube Embed | Google Cloud           │
└─────────────────────────────────────────────────────────┘
```

---

## 🏛️ Arquitectura de Sistema

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (PWA)                             │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Coro       │  │ Pueblo Fiel  │  │    Admin     │         │
│  │   View       │  │    View      │  │  Dashboard   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                 │
│                            │                                     │
│  ┌─────────────────────────▼─────────────────────────┐         │
│  │           React State Management                   │         │
│  │  (useState, useEffect, Context API)                │         │
│  └─────────────────────────┬─────────────────────────┘         │
│                            │                                     │
│  ┌─────────────────────────▼─────────────────────────┐         │
│  │         Supabase Client Library                    │         │
│  │  (Authentication, Database, Storage)               │         │
│  └─────────────────────────┬─────────────────────────┘         │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                      SUPABASE BACKEND                             │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Auth Service                           │    │
│  │  - Google OAuth 2.0                                      │    │
│  │  - JWT Token Generation                                  │    │
│  │  - Session Management                                    │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                            │                                     │
│  ┌─────────────────────────▼───────────────────────────────┐    │
│  │                   PostgreSQL Database                     │    │
│  │  Tables:                                                  │    │
│  │  - user_profiles                                          │    │
│  │  - songs                                                  │    │
│  │  - published_cantorals                                    │    │
│  │  - cantoral_songs                                         │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                            │                                     │
│  ┌─────────────────────────▼───────────────────────────────┐    │
│  │              Row Level Security (RLS)                     │    │
│  │  - Policies por tabla                                     │    │
│  │  - Validación de permisos por rol                         │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                            │                                     │
│  ┌─────────────────────────▼───────────────────────────────┐    │
│  │                   Storage Service                         │    │
│  │  Buckets:                                                 │    │
│  │  - sheet-music (partituras PDF)                           │    │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## ⚛️ Arquitectura Frontend

### Estructura de Componentes

```
App.tsx (Root Component)
│
├── ThemeProvider (Context)
│   └── ThemeToggle
│
├── Toaster (Notifications)
│
├── Login Screen
│   └── Google OAuth Button
│
├── ProfileSetup Screen
│   ├── Role Selection
│   └── Instrument Selection (conditional)
│
├── Main App (Authenticated)
│   ├── Sidebar
│   │   ├── Home
│   │   ├── Cantorales
│   │   ├── Courses
│   │   ├── Settings
│   │   └── Logout
│   │
│   ├── Views (Role-based routing)
│   │   ├── ChoirView (Role: Coro)
│   │   │   ├── CategorySearch (x11 categorías)
│   │   │   │   ├── SearchInput
│   │   │   │   ├── SongList
│   │   │   │   └── AddGloriaDialog
│   │   │   ├── CantoralPreview
│   │   │   └── PublishCantoralModal
│   │   │
│   │   ├── PublishedCantorals (Role: Pueblo Fiel)
│   │   │   ├── FilterOptions
│   │   │   ├── CantoralCard
│   │   │   └── CantoralDetail
│   │   │
│   │   └── AdminDashboard (Role: Admin)
│   │       ├── SongManager
│   │       │   ├── SongForm
│   │       │   ├── SongList
│   │       │   └── FileUploader
│   │       └── CantoralManager
│   │
│   ├── SongPlayer
│   │   ├── YouTubeEmbed
│   │   ├── SongInfo
│   │   └── SheetMusicViewer
│   │
│   └── Additional Views
│       ├── CoursesMenu
│       ├── MusicalTheory
│       ├── Liturgy
│       ├── MusicalInstruments
│       ├── CantoralHistory
│       ├── LiturgicalCalendar
│       └── SheetMusicLibrary
```

### Gestión de Estado

```typescript
// Estado Global en App.tsx
const [appState, setAppState] = useState<AppState>('login');
const [currentView, setCurrentView] = useState<ViewState>('main');
const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
const [cantoral, setCantoral] = useState<Song[]>([]);
const [selectedSong, setSelectedSong] = useState<Song | null>(null);
const [publishedCantorals, setPublishedCantorals] = useState<PublishedCantoral[]>([]);
const [sidebarOpen, setSidebarOpen] = useState(false);

// Context API para tema
const ThemeContext = createContext<ThemeContextType>();

// Supabase Auth Listener
useEffect(() => {
  const { data: authListener } = supabase.auth.onAuthStateChange(...);
  return () => authListener.subscription.unsubscribe();
}, []);
```

### Flujo de Datos (Props Drilling)

```
App.tsx
  │
  ├─ onGoogleLogin() ──────► Login.tsx
  │
  ├─ onProfileSetup() ─────► ProfileSetup.tsx
  │
  ├─ ChoirView
  │   ├─ cantoral ────────────────┐
  │   ├─ onAddToCantoral() ───────┼─► CategorySearch
  │   ├─ onRemoveFromCantoral() ──┤
  │   ├─ onPlaySong() ────────────┘
  │   └─ onPublishCantoral() ────► PublishCantoralModal
  │
  ├─ PublishedCantorals
  │   ├─ publishedCantorals ──────┐
  │   └─ onPlaySong() ────────────┼─► CantoralDetail
  │                               │
  └─ SongPlayer                   │
      ├─ selectedSong ◄───────────┘
      └─ onBack()
```

### Patrones de Diseño

#### 1. Compound Components
```tsx
<CategorySearch
  category="Entrada"
  icon="🚪"
  onAddToCantoral={handleAdd}
  onRemoveFromCantoral={handleRemove}
  cantoral={cantoral}
  onPlaySong={handlePlay}
  preferredInstrument={instrument}
/>
```

#### 2. Render Props (implícito)
```tsx
{publishedCantorals.map(cantoral => (
  <CantoralCard
    key={cantoral.id}
    cantoral={cantoral}
    onView={() => handleView(cantoral)}
  />
))}
```

#### 3. Custom Hooks (para backend)
```tsx
// Ejemplo de hook a implementar
function useSongs(category?: string) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSongs() {
      setLoading(true);
      const { data, error } = await searchSongs({ category });
      if (error) setError(error);
      else setSongs(data);
      setLoading(false);
    }
    fetchSongs();
  }, [category]);

  return { songs, loading, error };
}
```

---

## 🗄️ Arquitectura Backend

### Supabase como BaaS (Backend as a Service)

#### Componentes de Supabase

```
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE                             │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │             Auth Service                          │ │
│  │  - Gestión de usuarios                            │ │
│  │  - Integración OAuth (Google)                     │ │
│  │  - JWT tokens                                     │ │
│  │  - Session management                             │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │             PostgreSQL Database                   │ │
│  │  - Tablas relacionales                            │ │
│  │  - Índices optimizados                            │ │
│  │  - Full-text search                               │ │
│  │  - Triggers y funciones                           │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │             PostgREST API                         │ │
│  │  - Auto-generated REST API                        │ │
│  │  - Filtros y ordenamiento                         │ │
│  │  - Paginación                                     │ │
│  │  - Relaciones (joins)                             │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │         Row Level Security (RLS)                  │ │
│  │  - Políticas de acceso                            │ │
│  │  - Validación a nivel de fila                     │ │
│  │  - Basado en auth.uid()                           │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │             Storage Service                       │ │
│  │  - Almacenamiento de archivos                     │ │
│  │  - CDN integrado                                  │ │
│  │  - Políticas de acceso                            │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │             Realtime Service                      │ │
│  │  - Suscripciones a cambios                        │ │
│  │  - WebSocket connections                          │ │
│  │  - Broadcasting                                   │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Esquema de Base de Datos

```sql
-- Tabla de perfiles de usuario
user_profiles
  ├── id (UUID, PK, FK → auth.users)
  ├── email (TEXT, NOT NULL)
  ├── name (TEXT, NOT NULL)
  ├── role (TEXT, CHECK)
  ├── instrument (TEXT, CHECK, NULLABLE)
  ├── parish_name (TEXT, NULLABLE)
  ├── created_at (TIMESTAMPTZ)
  └── updated_at (TIMESTAMPTZ)

-- Tabla de cantos
songs
  ├── id (UUID, PK)
  ├── title (TEXT, NOT NULL)
  ├── category (TEXT, NOT NULL)
  ├── youtube_id (TEXT, NOT NULL)
  ├── sheet_music_url (TEXT, NULLABLE)
  ├── duration (TEXT, NOT NULL)
  ├── artist (TEXT, NULLABLE)
  ├── author (TEXT, NULLABLE)
  ├── version (TEXT, CHECK, NULLABLE)
  ├── mass_name (TEXT, NULLABLE)
  ├── thumbnail_url (TEXT, NULLABLE)
  ├── created_at (TIMESTAMPTZ)
  ├── updated_at (TIMESTAMPTZ)
  └── created_by (UUID, FK → auth.users)

-- Tabla de cantorales publicados
published_cantorals
  ├── id (UUID, PK)
  ├── choir_id (UUID, NOT NULL, FK → user_profiles)
  ├── choir_name (TEXT, NOT NULL)
  ├── parish_name (TEXT, NOT NULL)
  ├── date (DATE, NOT NULL)
  ├── liturgical_date (TEXT, NOT NULL)
  ├── mass_time (TEXT, NOT NULL)
  ├── created_at (TIMESTAMPTZ)
  ├── published_by (UUID, FK → auth.users)
  └── published_at (TIMESTAMPTZ)

-- Tabla de relación cantoral-cantos
cantoral_songs
  ├── id (UUID, PK)
  ├── cantoral_id (UUID, NOT NULL, FK → published_cantorals)
  ├── song_id (UUID, NOT NULL, FK → songs)
  ├── position (INTEGER, NOT NULL)
  └── created_at (TIMESTAMPTZ)
```

### Índices de Base de Datos

```sql
-- Índices para optimización de búsquedas
CREATE INDEX idx_songs_category ON songs(category);
CREATE INDEX idx_songs_mass_name ON songs(mass_name) WHERE mass_name IS NOT NULL;
CREATE INDEX idx_songs_version ON songs(version);
CREATE INDEX idx_songs_title ON songs USING gin(to_tsvector('spanish', title));

CREATE INDEX idx_cantorals_choir ON published_cantorals(choir_id);
CREATE INDEX idx_cantorals_parish ON published_cantorals(parish_name);
CREATE INDEX idx_cantorals_date ON published_cantorals(date);

CREATE INDEX idx_cantoral_songs_cantoral ON cantoral_songs(cantoral_id);
CREATE INDEX idx_cantoral_songs_song ON cantoral_songs(song_id);
CREATE INDEX idx_cantoral_songs_position ON cantoral_songs(cantoral_id, position);

CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
```

---

## 🔄 Flujo de Datos

### 1. Autenticación

```
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│  Client  │       │  Google  │       │ Supabase │       │   App    │
└────┬─────┘       └────┬─────┘       └────┬─────┘       └────┬─────┘
     │                  │                   │                  │
     │ Click Login      │                   │                  │
     ├─────────────────►│                   │                  │
     │                  │                   │                  │
     │ Redirect to      │                   │                  │
     │ Google OAuth     │                   │                  │
     │◄─────────────────┤                   │                  │
     │                  │                   │                  │
     │ User authorizes  │                   │                  │
     ├─────────────────►│                   │                  │
     │                  │                   │                  │
     │                  │ Auth code         │                  │
     │                  ├──────────────────►│                  │
     │                  │                   │                  │
     │                  │                   │ Exchange for JWT │
     │                  │                   ├─────────────────►│
     │                  │                   │                  │
     │                  │                   │ Check if user    │
     │                  │                   │ exists in DB     │
     │                  │                   │◄─────────────────┤
     │                  │                   │                  │
     │ Session + JWT    │                   │                  │
     │◄─────────────────┴───────────────────┤                  │
     │                                      │                  │
     │ Fetch user profile                   │                  │
     ├─────────────────────────────────────►│                  │
     │                                      │                  │
     │ User profile data                    │                  │
     │◄─────────────────────────────────────┤                  │
     │                                      │                  │
     │ Set app state                        │                  │
     ├──────────────────────────────────────┴─────────────────►│
     │                                                          │
```

### 2. Crear Cantoral (Coro)

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│   Coro   │       │ Supabase │       │ Database │
└────┬─────┘       └────┬─────┘       └────┬─────┘
     │                  │                  │
     │ Search songs     │                  │
     │ by category      │                  │
     ├─────────────────►│                  │
     │                  │ SELECT * FROM    │
     │                  │ songs WHERE...   │
     │                  ├─────────────────►│
     │                  │                  │
     │                  │ Songs data       │
     │ Songs list       │◄─────────────────┤
     │◄─────────────────┤                  │
     │                  │                  │
     │ Add song         │                  │
     │ to cantoral      │                  │
     │ (local state)    │                  │
     │──────┐           │                  │
     │      │           │                  │
     │◄─────┘           │                  │
     │                  │                  │
     │ Publish          │                  │
     │ cantoral         │                  │
     ├─────────────────►│                  │
     │                  │ INSERT INTO      │
     │                  │ published_       │
     │                  │ cantorals        │
     │                  ├─────────────────►│
     │                  │                  │
     │                  │ Cantoral ID      │
     │                  │◄─────────────────┤
     │                  │                  │
     │                  │ INSERT INTO      │
     │                  │ cantoral_songs   │
     │                  │ (batch)          │
     │                  ├─────────────────►│
     │                  │                  │
     │                  │ Success          │
     │ Cantoral         │◄─────────────────┤
     │ published        │                  │
     │◄─────────────────┤                  │
     │                  │                  │
```

### 3. Ver Cantorales (Pueblo Fiel)

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│  Fiel    │       │ Supabase │       │ Database │
└────┬─────┘       └────┬─────┘       └────┬─────┘
     │                  │                  │
     │ Filter by        │                  │
     │ parish/date      │                  │
     ├─────────────────►│                  │
     │                  │ SELECT * FROM    │
     │                  │ published_       │
     │                  │ cantorals        │
     │                  │ JOIN cantoral_   │
     │                  │ songs...         │
     │                  ├─────────────────►│
     │                  │                  │
     │                  │ Cantorales +     │
     │ Cantorales       │ songs data       │
     │ list             │◄─────────────────┤
     │◄─────────────────┤                  │
     │                  │                  │
     │ Select           │                  │
     │ cantoral         │                  │
     │──────┐           │                  │
     │      │           │                  │
     │◄─────┘           │                  │
     │                  │                  │
     │ Play song        │                  │
     │ (YouTube embed)  │                  │
     │──────┐           │                  │
     │      │           │                  │
     │◄─────┘           │                  │
     │                  │                  │
```

---

## 🔐 Seguridad

### Row Level Security (RLS)

#### Política: user_profiles

```sql
-- Usuarios pueden leer su propio perfil
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

#### Política: songs

```sql
-- Todos pueden leer cantos
CREATE POLICY "Anyone can read songs"
  ON songs FOR SELECT
  USING (true);

-- Solo admins pueden modificar cantos
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

#### Política: published_cantorals

```sql
-- Todos pueden leer cantorales publicados
CREATE POLICY "Anyone can read published cantorals"
  ON published_cantorals FOR SELECT
  USING (true);

-- Solo coros pueden publicar
CREATE POLICY "Choirs can publish cantorals"
  ON published_cantorals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'Coro'
    )
  );

-- Coros pueden actualizar sus propios cantorales
CREATE POLICY "Choirs can update own cantorals"
  ON published_cantorals FOR UPDATE
  USING (choir_id = auth.uid());

-- Coros pueden eliminar sus propios cantorales
CREATE POLICY "Choirs can delete own cantorals"
  ON published_cantorals FOR DELETE
  USING (choir_id = auth.uid());
```

### Validación de Datos

#### Frontend Validation
```typescript
// Validación de YouTube ID
function isValidYouTubeId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

// Validación de duración
function isValidDuration(duration: string): boolean {
  return /^\d+:\d{2}$/.test(duration);
}
```

#### Backend Validation (PostgreSQL)
```sql
-- Constraint en tabla songs
ALTER TABLE songs ADD CONSTRAINT check_youtube_id
  CHECK (youtube_id ~ '^[a-zA-Z0-9_-]{11}$');

-- Constraint en tabla user_profiles
ALTER TABLE user_profiles ADD CONSTRAINT check_role
  CHECK (role IN ('Coro', 'Pueblo fiel', 'Admin'));

ALTER TABLE user_profiles ADD CONSTRAINT check_instrument
  CHECK (instrument IS NULL OR instrument IN ('Coro', 'Guitarra', 'Órgano'));
```

### Autenticación JWT

```typescript
// El cliente incluye el JWT en cada request
const { data, error } = await supabase
  .from('songs')
  .select('*')
  // El token JWT se envía automáticamente en headers
  // Authorization: Bearer <jwt_token>
```

---

## 📈 Escalabilidad

### Optimizaciones de Performance

#### 1. Paginación

```typescript
// Implementar paginación en queries
const { data, error } = await supabase
  .from('songs')
  .select('*')
  .range(0, 49)  // Primeras 50 canciones
  .order('title', { ascending: true });
```

#### 2. Caché Local

```typescript
// Caché de canciones en localStorage
const CACHE_KEY = 'stella_maris_songs_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

function getCachedSongs(): Song[] | null {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
  
  return data;
}
```

#### 3. Lazy Loading de Componentes

```typescript
// Code splitting con React.lazy
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const SongPlayer = lazy(() => import('./components/SongPlayer'));

<Suspense fallback={<Loading />}>
  <AdminDashboard />
</Suspense>
```

#### 4. Índices de Base de Datos

Todos los índices están definidos en la sección de Arquitectura Backend.

### Límites y Quotas

#### Supabase Free Tier
- **Database:** 500 MB
- **Storage:** 1 GB
- **Bandwidth:** 5 GB/mes
- **Edge Functions:** 500,000 invocations/mes

#### Estimación de Uso

**Cantos:**
- ~1 KB por canto (solo metadata)
- 1,000 cantos = ~1 MB
- 10,000 cantos = ~10 MB ✅ Dentro del límite

**Cantorales:**
- ~2 KB por cantoral (con relaciones)
- 1,000 cantorales/mes = ~2 MB/mes ✅

**Partituras:**
- ~500 KB por PDF
- 1,000 partituras = ~500 MB ✅ Dentro del límite

**Usuarios:**
- ~500 bytes por usuario
- 10,000 usuarios = ~5 MB ✅

### Plan de Escalamiento

```
Phase 1: MVP (Free Tier) ────► 100-500 usuarios
  │
  ├─ Database: < 100 MB
  ├─ Storage: < 500 MB
  └─ Bandwidth: < 2 GB/mes
  
Phase 2: Growth (Pro Tier) ──► 500-5,000 usuarios
  │
  ├─ Database: < 8 GB
  ├─ Storage: < 100 GB
  ├─ Bandwidth: < 50 GB/mes
  └─ Costo: $25/mes
  
Phase 3: Scale (Team Tier) ──► 5,000-50,000 usuarios
  │
  ├─ Database: < 500 GB
  ├─ Storage: < 1 TB
  ├─ Bandwidth: < 250 GB/mes
  ├─ Backups automáticos
  └─ Costo: $599/mes
```

---

## 🚀 Deployment

### Frontend Deployment

**Opciones recomendadas:**
1. **Vercel** (Recomendado)
   - Deploy automático desde Git
   - CDN global
   - SSL gratis
   - Preview deployments

2. **Netlify**
   - Similar a Vercel
   - Continuous deployment

3. **GitHub Pages**
   - Gratis para proyectos públicos
   - Requiere configuración manual

### Backend Deployment

**Supabase** (Ya deployado en la nube)
- Hosting automático
- CDN integrado
- Backups automáticos (tier Pro)
- Monitoreo y logs

---

## 📊 Monitoreo

### Métricas Clave

1. **Performance**
   - Tiempo de carga de página
   - Tiempo de respuesta de API
   - FCP, LCP, CLS (Core Web Vitals)

2. **Usuarios**
   - Usuarios activos diarios (DAU)
   - Usuarios activos mensuales (MAU)
   - Retención de usuarios

3. **Funcionalidad**
   - Cantorales publicados por día
   - Cantos más reproducidos
   - Errores de autenticación

4. **Infraestructura**
   - Uso de base de datos
   - Uso de storage
   - Bandwidth consumido

### Herramientas de Monitoreo

- **Supabase Dashboard:** Monitoreo de database y API
- **Google Analytics:** Métricas de usuarios
- **Sentry:** Error tracking (opcional)
- **Vercel Analytics:** Performance metrics

---

## 🎯 Conclusión

La arquitectura de Stella Maris está diseñada para:

✅ **Simplicidad:** Uso de BaaS (Supabase) reduce complejidad  
✅ **Escalabilidad:** Diseño permite crecer de 100 a 50,000 usuarios  
✅ **Seguridad:** RLS y JWT garantizan protección de datos  
✅ **Performance:** Índices, caché y lazy loading optimizan velocidad  
✅ **Mantenibilidad:** Código modular y bien documentado  

**Próximo paso:** Implementar el backend siguiendo `/docs/BACKEND_SETUP.md`
