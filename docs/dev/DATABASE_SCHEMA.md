# 🗄️ Esquema de Base de Datos - Stella Maris

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Diagrama ER](#diagrama-er)
3. [Tablas](#tablas)
4. [Índices](#índices)
5. [Relaciones](#relaciones)
6. [Políticas RLS](#políticas-rls)
7. [Funciones y Triggers](#funciones-y-triggers)
8. [Storage Buckets](#storage-buckets)
9. [Scripts SQL](#scripts-sql)

---

## 🌐 Visión General

La base de datos de Stella Maris usa **PostgreSQL 14+** a través de Supabase.

### Características

- ✅ **Row Level Security (RLS)** habilitado en todas las tablas
- ✅ **UUID** como primary keys
- ✅ **Timestamps automáticos** (created_at, updated_at)
- ✅ **Foreign keys** con CASCADE deletes
- ✅ **Check constraints** para validación de datos
- ✅ **Índices optimizados** para búsquedas rápidas
- ✅ **Full-text search** en español

---

## 📊 Diagrama ER (Entity-Relationship)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          auth.users                                 │
│  (Gestionada automáticamente por Supabase Auth)                    │
│  ├── id (UUID, PK)                                                  │
│  ├── email                                                          │
│  ├── created_at                                                     │
│  └── user_metadata (JSON)                                           │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     │ 1:1
                     │
┌────────────────────▼────────────────────────────────────────────────┐
│                      user_profiles                                  │
│  ├── id (UUID, PK, FK → auth.users.id)                             │
│  ├── email (TEXT, NOT NULL)                                        │
│  ├── name (TEXT, NOT NULL)                                         │
│  ├── role (TEXT, NOT NULL)                                         │
│  │    CHECK: 'Coro' | 'Pueblo fiel' | 'Admin'                      │
│  ├── instrument (TEXT, NULLABLE)                                   │
│  │    CHECK: 'Coro' | 'Guitarra' | 'Órgano'                        │
│  ├── parish_name (TEXT, NULLABLE)                                  │
│  ├── created_at (TIMESTAMPTZ, DEFAULT NOW())                       │
│  └── updated_at (TIMESTAMPTZ, DEFAULT NOW())                       │
└────┬──────────────────────────────────────────────┬────────────────┘
     │                                              │
     │ 1:N (created_by)                             │ 1:N (choir_id)
     │                                              │
┌────▼──────────────────────────────────┐  ┌───────▼─────────────────────────┐
│           songs                       │  │   published_cantorals           │
│  ├── id (UUID, PK)                    │  │  ├── id (UUID, PK)              │
│  ├── title (TEXT, NOT NULL)           │  │  ├── choir_id (UUID, NOT NULL, │
│  ├── category (TEXT, NOT NULL)        │  │  │      FK → user_profiles.id) │
│  ├── youtube_id (TEXT, NOT NULL)      │  │  ├── choir_name (TEXT)          │
│  │    CONSTRAINT: 11 chars [A-Za-z0-9]│  │  ├── parish_name (TEXT)         │
│  ├── sheet_music_url (TEXT, NULLABLE) │  │  ├── date (DATE, NOT NULL)      │
│  ├── duration (TEXT, NOT NULL)        │  │  ├── liturgical_date (TEXT)     │
│  ├── artist (TEXT, NULLABLE)          │  │  ├── mass_time (TEXT)           │
│  ├── author (TEXT, NULLABLE)          │  │  ├── created_at (TIMESTAMPTZ)   │
│  ├── version (TEXT, NULLABLE)         │  │  ├── published_by (UUID, FK)    │
│  │    CHECK: 'Coro'|'Guitarra'|'Órgano'│ │  └── published_at (TIMESTAMPTZ) │
│  ├── mass_name (TEXT, NULLABLE)       │  └────────────┬────────────────────┘
│  ├── thumbnail_url (TEXT, NULLABLE)   │               │
│  ├── created_at (TIMESTAMPTZ)         │               │ 1:N
│  ├── updated_at (TIMESTAMPTZ)         │               │
│  └── created_by (UUID, FK)            │               │
└────────────┬──────────────────────────┘               │
             │                                          │
             │ N:M (through cantoral_songs)             │
             │                                          │
             │        ┌─────────────────────────────────▼─┐
             │        │      cantoral_songs               │
             │        │  ├── id (UUID, PK)                │
             │        │  ├── cantoral_id (UUID, NOT NULL, │
             │        │  │      FK → published_cantorals) │
             └────────┼─►├── song_id (UUID, NOT NULL,     │
                      │  │      FK → songs.id)            │
                      │  ├── position (INTEGER, NOT NULL) │
                      │  └── created_at (TIMESTAMPTZ)     │
                      │  UNIQUE(cantoral_id, song_id)     │
                      └────────────────────────────────────┘
```

---

## 📋 Tablas

### 1. user_profiles

Almacena información adicional de los usuarios más allá de la autenticación.

```sql
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
COMMENT ON COLUMN user_profiles.role IS 'Tipo de usuario: Coro (puede publicar), Pueblo fiel (solo lectura), Admin (gestión total)';
COMMENT ON COLUMN user_profiles.instrument IS 'Instrumento de preferencia, solo para usuarios tipo Coro';
COMMENT ON COLUMN user_profiles.parish_name IS 'Nombre de la parroquia del usuario';
```

**Campos:**
- `id`: UUID del usuario (sincronizado con auth.users)
- `email`: Email del usuario (duplicado para facilitar consultas)
- `name`: Nombre completo del usuario
- `role`: Rol del usuario (`'Coro'` | `'Pueblo fiel'` | `'Admin'`)
- `instrument`: Instrumento preferido (solo para Coro)
- `parish_name`: Nombre de la parroquia
- `created_at`: Fecha de creación del perfil
- `updated_at`: Fecha de última actualización

**Ejemplo de datos:**
```sql
INSERT INTO user_profiles (id, email, name, role, instrument, parish_name) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'coro@parroquia.com', 'Coro Parroquial', 'Coro', 'Guitarra', 'Parroquia San Juan'),
('660e8400-e29b-41d4-a716-446655440001', 'fiel@email.com', 'María García', 'Pueblo fiel', NULL, 'Parroquia San Juan'),
('770e8400-e29b-41d4-a716-446655440002', 'admin@stella.com', 'Admin Sistema', 'Admin', NULL, NULL);
```

---

### 2. songs

Biblioteca completa de cantos litúrgicos.

```sql
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
COMMENT ON COLUMN songs.category IS 'Momento litúrgico: Entrada, Kyrie, Gloria, Santo, Cordero de Dios, Salmo, Aleluya, Post Evangelio, Ofertorio, Comunión, Salida';
COMMENT ON COLUMN songs.youtube_id IS 'ID del video de YouTube (11 caracteres)';
COMMENT ON COLUMN songs.version IS 'Versión instrumental del canto';
COMMENT ON COLUMN songs.mass_name IS 'Nombre de la misa (para agrupar Kyrie, Gloria, Santo, Cordero)';
```

**Campos:**
- `id`: UUID único del canto
- `title`: Título del canto (ej: "Pescador de Hombres")
- `category`: Categoría litúrgica (Entrada, Kyrie, Gloria, Santo, etc.)
- `youtube_id`: ID del video de YouTube (11 caracteres alfanuméricos)
- `sheet_music_url`: URL de la partitura en PDF (nullable)
- `duration`: Duración del canto (formato "M:SS" o "MM:SS")
- `artist`: Artista o intérprete (nullable)
- `author`: Compositor o autor (ej: "Cesáreo Gabaráin")
- `version`: Versión instrumental (`'Coro'` | `'Guitarra'` | `'Órgano'`)
- `mass_name`: Nombre de la misa (para agrupar partes del ordinario)
- `thumbnail_url`: URL del thumbnail de YouTube (opcional)
- `created_at`: Fecha de creación
- `updated_at`: Fecha de última actualización
- `created_by`: UUID del admin que creó el canto

**Categorías válidas:**
```typescript
const CATEGORIES = [
  'Entrada',
  'Kyrie',
  'Gloria',
  'Santo',
  'Cordero de Dios',
  'Credo',
  'Padre Nuestro',
  'Salmo',
  'Aleluya',
  'Aclamación al Evangelio',  // Solo en Cuaresma
  'Post Evangelio',
  'Ofertorio',
  'Comunión',
  'Salida'
];
```

**Ejemplo de datos:**
```sql
INSERT INTO songs (title, category, youtube_id, duration, author, version, mass_name) VALUES
('Kyrie Eleison', 'Kyrie', 'dQw4w9WgXcQ', '2:30', 'Misa Criolla', 'Guitarra', 'Misa Criolla'),
('Gloria a Dios', 'Gloria', 'dQw4w9WgXcR', '3:15', 'Misa Criolla', 'Guitarra', 'Misa Criolla'),
('Santo es el Señor', 'Santo', 'dQw4w9WgXcS', '2:45', 'Misa Criolla', 'Guitarra', 'Misa Criolla'),
('Cordero de Dios', 'Cordero de Dios', 'dQw4w9WgXcT', '2:00', 'Misa Criolla', 'Guitarra', 'Misa Criolla'),
('Pescador de Hombres', 'Comunión', 'dQw4w9WgXcU', '4:30', 'Cesáreo Gabaráin', 'Coro', NULL);
```

---

### 3. published_cantorals

Cantorales publicados por los coros para sus parroquias.

```sql
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
COMMENT ON COLUMN published_cantorals.date IS 'Fecha del calendario para la misa';
COMMENT ON COLUMN published_cantorals.liturgical_date IS 'Fecha litúrgica (ej: "3er Domingo de Adviento")';
COMMENT ON COLUMN published_cantorals.mass_time IS 'Hora de la misa (ej: "10:00 AM")';
```

**Campos:**
- `id`: UUID único del cantoral
- `choir_id`: UUID del coro que publicó (FK a user_profiles)
- `choir_name`: Nombre del coro (desnormalizado para performance)
- `parish_name`: Nombre de la parroquia
- `date`: Fecha de la misa (tipo DATE)
- `liturgical_date`: Fecha litúrgica descriptiva (ej: "3er Domingo del Tiempo Ordinario")
- `mass_time`: Hora de la misa (ej: "10:00 AM", "19:00")
- `created_at`: Fecha de creación del cantoral
- `published_by`: UUID del usuario que publicó
- `published_at`: Fecha de publicación

**Ejemplo de datos:**
```sql
INSERT INTO published_cantorals (choir_id, choir_name, parish_name, date, liturgical_date, mass_time) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Coro Parroquial', 'Parroquia San Juan', '2025-01-26', '3er Domingo del Tiempo Ordinario', '10:00 AM'),
('550e8400-e29b-41d4-a716-446655440000', 'Coro Parroquial', 'Parroquia San Juan', '2025-02-02', 'Presentación del Señor', '12:00 PM');
```

---

### 4. cantoral_songs

Tabla de relación muchos-a-muchos entre cantorales y cantos.

```sql
CREATE TABLE cantoral_songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cantoral_id UUID NOT NULL REFERENCES published_cantorals(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(cantoral_id, song_id)
);

COMMENT ON TABLE cantoral_songs IS 'Relación entre cantorales y cantos con orden específico';
COMMENT ON COLUMN cantoral_songs.position IS 'Posición del canto en el cantoral (0-indexed)';
```

**Campos:**
- `id`: UUID único de la relación
- `cantoral_id`: UUID del cantoral (FK a published_cantorals)
- `song_id`: UUID del canto (FK a songs)
- `position`: Posición del canto en el cantoral (orden litúrgico)
- `created_at`: Fecha de creación de la relación

**Constraint UNIQUE:** Un canto no puede aparecer dos veces en el mismo cantoral.

**Ejemplo de datos:**
```sql
-- Cantoral del 26 de enero de 2025
INSERT INTO cantoral_songs (cantoral_id, song_id, position) VALUES
('cantoral-uuid-1', 'song-entrada-uuid', 0),
('cantoral-uuid-1', 'song-kyrie-uuid', 1),
('cantoral-uuid-1', 'song-gloria-uuid', 2),
('cantoral-uuid-1', 'song-salmo-uuid', 3),
('cantoral-uuid-1', 'song-aleluya-uuid', 4),
('cantoral-uuid-1', 'song-ofertorio-uuid', 5),
('cantoral-uuid-1', 'song-santo-uuid', 6),
('cantoral-uuid-1', 'song-cordero-uuid', 7),
('cantoral-uuid-1', 'song-comunion-1-uuid', 8),
('cantoral-uuid-1', 'song-comunion-2-uuid', 9),
('cantoral-uuid-1', 'song-salida-uuid', 10);
```

---

## 🔍 Índices

### Índices en user_profiles

```sql
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_parish ON user_profiles(parish_name) WHERE parish_name IS NOT NULL;
```

**Propósito:**
- Búsqueda rápida por email
- Filtrado por rol (para permisos)
- Búsqueda por parroquia

---

### Índices en songs

```sql
-- Índice para búsqueda por categoría
CREATE INDEX idx_songs_category ON songs(category);

-- Índice para búsqueda por nombre de misa
CREATE INDEX idx_songs_mass_name ON songs(mass_name) WHERE mass_name IS NOT NULL;

-- Índice para filtrado por versión
CREATE INDEX idx_songs_version ON songs(version) WHERE version IS NOT NULL;

-- Índice GIN para búsqueda full-text en español
CREATE INDEX idx_songs_title_fts ON songs USING gin(to_tsvector('spanish', title));

-- Índice compuesto para búsquedas comunes
CREATE INDEX idx_songs_category_version ON songs(category, version) WHERE version IS NOT NULL;

-- Índice para búsqueda por autor
CREATE INDEX idx_songs_author ON songs(author) WHERE author IS NOT NULL;
```

**Propósito:**
- Búsqueda rápida por categoría litúrgica
- Agrupación por misa (Kyrie, Gloria, Santo, Cordero)
- Filtrado por instrumento preferido
- Búsqueda de texto completo en título
- Optimización de queries combinados

**Ejemplo de query optimizada:**
```sql
-- Buscar cantos de Comunión con Guitarra
SELECT * FROM songs
WHERE category = 'Comunión'
  AND version = 'Guitarra'
ORDER BY title;
-- Usa: idx_songs_category_version
```

---

### Índices en published_cantorals

```sql
-- Índice para búsqueda por coro
CREATE INDEX idx_cantorals_choir ON published_cantorals(choir_id);

-- Índice para búsqueda por parroquia
CREATE INDEX idx_cantorals_parish ON published_cantorals(parish_name);

-- Índice para búsqueda por fecha
CREATE INDEX idx_cantorals_date ON published_cantorals(date DESC);

-- Índice compuesto para query común: parroquia + fecha
CREATE INDEX idx_cantorals_parish_date ON published_cantorals(parish_name, date DESC);
```

**Propósito:**
- Listar cantorales de un coro específico
- Filtrar cantorales por parroquia
- Ordenar cantorales por fecha (más recientes primero)
- Optimizar búsqueda de cantorales de una parroquia en rango de fechas

**Ejemplo de query optimizada:**
```sql
-- Cantorales de Parroquia San Juan en próximos 30 días
SELECT * FROM published_cantorals
WHERE parish_name = 'Parroquia San Juan'
  AND date >= CURRENT_DATE
  AND date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY date ASC;
-- Usa: idx_cantorals_parish_date
```

---

### Índices en cantoral_songs

```sql
-- Índice para obtener cantos de un cantoral
CREATE INDEX idx_cantoral_songs_cantoral ON cantoral_songs(cantoral_id, position);

-- Índice para encontrar cantorales que usan un canto
CREATE INDEX idx_cantoral_songs_song ON cantoral_songs(song_id);

-- Índice para ordenamiento por posición
CREATE INDEX idx_cantoral_songs_position ON cantoral_songs(position);
```

**Propósito:**
- Obtener cantos de un cantoral en orden correcto
- Encontrar en qué cantorales se usa un canto específico
- Ordenamiento eficiente

---

## 🔗 Relaciones

### Diagrama de Relaciones

```
auth.users (1) ──────────────── (1) user_profiles
                                      │
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    │                 │                 │
              created_by         choir_id          (implicit)
                    │                 │                 │
                    │                 │                 │
                    ▼                 ▼                 ▼
                  songs       published_cantorals
                    │                 │
                    │                 │
                    └────────┬────────┘
                             │
                             │ (N:M through)
                             │
                             ▼
                      cantoral_songs
```

### Foreign Keys

```sql
-- user_profiles → auth.users
ALTER TABLE user_profiles
  ADD CONSTRAINT fk_user_profiles_auth_users
  FOREIGN KEY (id) REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- songs → auth.users (created_by)
ALTER TABLE songs
  ADD CONSTRAINT fk_songs_created_by
  FOREIGN KEY (created_by) REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- published_cantorals → user_profiles (choir_id)
ALTER TABLE published_cantorals
  ADD CONSTRAINT fk_cantorals_choir
  FOREIGN KEY (choir_id) REFERENCES user_profiles(id)
  ON DELETE CASCADE;

-- published_cantorals → auth.users (published_by)
ALTER TABLE published_cantorals
  ADD CONSTRAINT fk_cantorals_published_by
  FOREIGN KEY (published_by) REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- cantoral_songs → published_cantorals
ALTER TABLE cantoral_songs
  ADD CONSTRAINT fk_cantoral_songs_cantoral
  FOREIGN KEY (cantoral_id) REFERENCES published_cantorals(id)
  ON DELETE CASCADE;

-- cantoral_songs → songs
ALTER TABLE cantoral_songs
  ADD CONSTRAINT fk_cantoral_songs_song
  FOREIGN KEY (song_id) REFERENCES songs(id)
  ON DELETE CASCADE;
```

### Comportamiento de Cascada

**ON DELETE CASCADE:**
- Si se elimina un usuario (`auth.users`), se elimina su perfil y sus cantorales
- Si se elimina un cantoral, se eliminan todas sus relaciones con cantos
- Si se elimina un canto, se eliminan todas sus relaciones con cantorales

**ON DELETE SET NULL:**
- Si se elimina el usuario que creó un canto, el campo `created_by` se pone en NULL
- Si se elimina el usuario que publicó un cantoral, el campo `published_by` se pone en NULL

---

## 🔐 Políticas RLS (Row Level Security)

### user_profiles

```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden leer su propio perfil
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Los usuarios pueden insertar su propio perfil (solo una vez)
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Los admins pueden ver todos los perfiles
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

---

### songs

```sql
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer cantos
CREATE POLICY "Anyone can read songs"
  ON songs FOR SELECT
  USING (auth.is_authenticated());

-- Solo admins pueden insertar cantos
CREATE POLICY "Only admins can insert songs"
  ON songs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'Admin'
    )
  );

-- Solo admins pueden actualizar cantos
CREATE POLICY "Only admins can update songs"
  ON songs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'Admin'
    )
  );

-- Solo admins pueden eliminar cantos
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

---

### published_cantorals

```sql
ALTER TABLE published_cantorals ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer cantorales publicados
CREATE POLICY "Anyone can read published cantorals"
  ON published_cantorals FOR SELECT
  USING (auth.is_authenticated());

-- Solo usuarios tipo Coro pueden publicar cantorales
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

-- Los coros pueden actualizar sus propios cantorales
CREATE POLICY "Choirs can update own cantorals"
  ON published_cantorals FOR UPDATE
  USING (choir_id = auth.uid())
  WITH CHECK (choir_id = auth.uid());

-- Los coros pueden eliminar sus propios cantorales
CREATE POLICY "Choirs can delete own cantorals"
  ON published_cantorals FOR DELETE
  USING (choir_id = auth.uid());

-- Los admins pueden gestionar cualquier cantoral
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

---

### cantoral_songs

```sql
ALTER TABLE cantoral_songs ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer relaciones
CREATE POLICY "Anyone can read cantoral songs"
  ON cantoral_songs FOR SELECT
  USING (auth.is_authenticated());

-- Solo el dueño del cantoral puede agregar cantos
CREATE POLICY "Choir can add songs to own cantoral"
  ON cantoral_songs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM published_cantorals
      WHERE published_cantorals.id = cantoral_id
        AND published_cantorals.choir_id = auth.uid()
    )
  );

-- Solo el dueño del cantoral puede eliminar cantos
CREATE POLICY "Choir can remove songs from own cantoral"
  ON cantoral_songs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM published_cantorals
      WHERE published_cantorals.id = cantoral_id
        AND published_cantorals.choir_id = auth.uid()
    )
  );

-- Los admins pueden gestionar cualquier relación
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

---

## ⚙️ Funciones y Triggers

### Trigger: updated_at automático

```sql
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

---

### Función: Buscar cantos con filtros

```sql
CREATE OR REPLACE FUNCTION search_songs(
  p_category TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_version TEXT DEFAULT NULL,
  p_mass_name TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  youtube_id TEXT,
  sheet_music_url TEXT,
  duration TEXT,
  artist TEXT,
  author TEXT,
  version TEXT,
  mass_name TEXT,
  thumbnail_url TEXT,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.category,
    s.youtube_id,
    s.sheet_music_url,
    s.duration,
    s.artist,
    s.author,
    s.version,
    s.mass_name,
    s.thumbnail_url,
    CASE
      WHEN p_search_term IS NOT NULL THEN
        ts_rank(to_tsvector('spanish', s.title), plainto_tsquery('spanish', p_search_term))
      ELSE 0
    END AS relevance
  FROM songs s
  WHERE
    (p_category IS NULL OR s.category = p_category)
    AND (p_version IS NULL OR s.version = p_version)
    AND (p_mass_name IS NULL OR s.mass_name = p_mass_name)
    AND (
      p_search_term IS NULL OR
      to_tsvector('spanish', s.title) @@ plainto_tsquery('spanish', p_search_term) OR
      s.author ILIKE '%' || p_search_term || '%' OR
      s.artist ILIKE '%' || p_search_term || '%'
    )
  ORDER BY
    CASE WHEN p_search_term IS NOT NULL THEN relevance ELSE 0 END DESC,
    s.title ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Uso:**
```sql
-- Buscar cantos de Comunión con Guitarra
SELECT * FROM search_songs(
  p_category := 'Comunión',
  p_version := 'Guitarra',
  p_limit := 20
);

-- Búsqueda de texto completo
SELECT * FROM search_songs(
  p_search_term := 'pescador',
  p_limit := 10
);
```

---

## 📦 Storage Buckets

### Bucket: sheet-music

```sql
-- Crear bucket para partituras
INSERT INTO storage.buckets (id, name, public)
VALUES ('sheet-music', 'sheet-music', true);

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

**Estructura de archivos:**
```
sheet-music/
  └── partituras/
      ├── {song-uuid-1}.pdf
      ├── {song-uuid-2}.pdf
      └── ...
```

---

## 📝 Scripts SQL Completos

### Script 1: Crear todas las tablas

```sql
-- Habilitar extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Tabla: cantoral_songs
CREATE TABLE cantoral_songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cantoral_id UUID NOT NULL REFERENCES published_cantorals(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(cantoral_id, song_id)
);
```

### Script 2: Crear todos los índices

```sql
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

### Script 3: Habilitar RLS y crear políticas

Ver secciones anteriores de políticas RLS para cada tabla.

### Script 4: Crear funciones y triggers

Ver sección de Funciones y Triggers.

---

## 🎯 Conclusión

Este esquema de base de datos está diseñado para:

✅ **Performance:** Índices optimizados para todas las queries comunes  
✅ **Seguridad:** RLS completo con políticas granulares  
✅ **Integridad:** Foreign keys y constraints garantizan datos válidos  
✅ **Escalabilidad:** Diseño normalizado permite crecimiento  
✅ **Flexibilidad:** Estructura permite agregar nuevas características  

**Próximo paso:** Ejecutar estos scripts en Supabase SQL Editor siguiendo `/docs/BACKEND_SETUP.md`
