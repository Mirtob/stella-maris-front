# 🔌 Especificación de API - Stella Maris

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Autenticación](#autenticación)
3. [Endpoints de Usuarios](#endpoints-de-usuarios)
4. [Endpoints de Cantos](#endpoints-de-cantos)
5. [Endpoints de Cantorales](#endpoints-de-cantorales)
6. [Endpoints de Storage](#endpoints-de-storage)
7. [Códigos de Error](#códigos-de-error)
8. [Rate Limiting](#rate-limiting)

---

## 🌐 Visión General

La API de Stella Maris está construida sobre **Supabase**, que auto-genera endpoints REST para cada tabla usando **PostgREST**.

### Base URL

```
https://[tu-proyecto].supabase.co/rest/v1
```

### Formato de Respuestas

Todas las respuestas están en formato JSON.

**Respuesta exitosa:**
```json
{
  "data": [...],
  "error": null
}
```

**Respuesta con error:**
```json
{
  "data": null,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

---

## 🔐 Autenticación

### Método de Autenticación

Todas las requests (excepto login) requieren un token JWT en el header `Authorization`.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Endpoints de Auth

#### 1. Login con Google OAuth

**Cliente (Frontend):**
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

**Response:**
- Redirige automáticamente a Google OAuth
- Google redirige de vuelta con código de autorización
- Supabase intercambia código por JWT token

#### 2. Obtener Sesión Actual

```typescript
const { data: { session }, error } = await supabase.auth.getSession();
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@ejemplo.com",
    "user_metadata": {
      "avatar_url": "https://...",
      "full_name": "Juan Pérez"
    }
  }
}
```

#### 3. Logout

```typescript
const { error } = await supabase.auth.signOut();
```

---

## 👤 Endpoints de Usuarios

### 1. Crear Perfil de Usuario

**Endpoint:** `POST /user_profiles`

**Descripción:** Crear perfil después del primer login.

**Headers:**
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "coro@parroquia.com",
  "name": "Coro Parroquial",
  "role": "Coro",
  "instrument": "Guitarra",
  "parish_name": "Parroquia San Juan"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "coro@parroquia.com",
  "name": "Coro Parroquial",
  "role": "Coro",
  "instrument": "Guitarra",
  "parish_name": "Parroquia San Juan",
  "created_at": "2025-01-19T10:00:00Z",
  "updated_at": "2025-01-19T10:00:00Z"
}
```

**Errores:**
- `400` - Datos inválidos
- `401` - No autenticado
- `409` - Perfil ya existe

**Código TypeScript:**
```typescript
async function createUserProfile(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      instrument: profile.instrument,
      parish_name: profile.parishName,
    })
    .select()
    .single();

  return { data, error };
}
```

---

### 2. Obtener Perfil Actual

**Endpoint:** `GET /user_profiles?id=eq.{user_id}`

**Descripción:** Obtener perfil del usuario autenticado.

**Headers:**
```http
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "coro@parroquia.com",
  "name": "Coro Parroquial",
  "role": "Coro",
  "instrument": "Guitarra",
  "parish_name": "Parroquia San Juan",
  "created_at": "2025-01-19T10:00:00Z",
  "updated_at": "2025-01-19T10:00:00Z"
}
```

**Código TypeScript:**
```typescript
async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { data, error };
}
```

---

### 3. Actualizar Perfil

**Endpoint:** `PATCH /user_profiles?id=eq.{user_id}`

**Request Body:**
```json
{
  "name": "Nuevo Nombre",
  "instrument": "Órgano",
  "parish_name": "Parroquia Santa María"
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "coro@parroquia.com",
  "name": "Nuevo Nombre",
  "role": "Coro",
  "instrument": "Órgano",
  "parish_name": "Parroquia Santa María",
  "created_at": "2025-01-19T10:00:00Z",
  "updated_at": "2025-01-19T15:30:00Z"
}
```

**Código TypeScript:**
```typescript
async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      name: updates.name,
      instrument: updates.instrument,
      parish_name: updates.parishName,
    })
    .eq('id', userId)
    .select()
    .single();

  return { data, error };
}
```

---

## 🎵 Endpoints de Cantos

### 1. Listar Cantos

**Endpoint:** `GET /songs`

**Query Parameters:**
- `category` - Filtrar por categoría (ej: `Comunión`)
- `version` - Filtrar por versión (ej: `Guitarra`)
- `mass_name` - Filtrar por nombre de misa
- `select` - Campos a retornar (por defecto: `*`)
- `order` - Ordenamiento (por defecto: `title.asc`)
- `limit` - Límite de resultados (por defecto: 50)
- `offset` - Offset para paginación

**Ejemplos:**

```http
GET /songs?category=eq.Comunión&version=eq.Guitarra&limit=20
GET /songs?mass_name=eq.Misa Criolla
GET /songs?order=created_at.desc&limit=10
```

**Response (200 OK):**
```json
[
  {
    "id": "song-uuid-1",
    "title": "Pescador de Hombres",
    "category": "Comunión",
    "youtube_id": "dQw4w9WgXcQ",
    "sheet_music_url": "https://...supabase.co/storage/v1/object/public/sheet-music/...",
    "duration": "4:30",
    "artist": "Coro Parroquial",
    "author": "Cesáreo Gabaráin",
    "version": "Guitarra",
    "mass_name": null,
    "thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    "created_at": "2025-01-10T08:00:00Z",
    "updated_at": "2025-01-10T08:00:00Z",
    "created_by": "admin-uuid"
  },
  ...
]
```

**Código TypeScript:**
```typescript
async function searchSongs(filters?: {
  category?: string;
  version?: string;
  massName?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
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

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;
  return { data, error };
}
```

---

### 2. Obtener Canto por ID

**Endpoint:** `GET /songs?id=eq.{song_id}`

**Response (200 OK):**
```json
{
  "id": "song-uuid-1",
  "title": "Pescador de Hombres",
  "category": "Comunión",
  "youtube_id": "dQw4w9WgXcQ",
  "sheet_music_url": "https://...",
  "duration": "4:30",
  "author": "Cesáreo Gabaráin",
  "version": "Guitarra",
  ...
}
```

**Código TypeScript:**
```typescript
async function getSongById(songId: string) {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('id', songId)
    .single();

  return { data, error };
}
```

---

### 3. Crear Canto (Solo Admin)

**Endpoint:** `POST /songs`

**Permisos:** Solo usuarios con rol `Admin`

**Request Body:**
```json
{
  "title": "Nuevo Canto",
  "category": "Entrada",
  "youtube_id": "abc12345678",
  "sheet_music_url": "https://...storage.../partitura.pdf",
  "duration": "3:45",
  "author": "Compositor",
  "version": "Coro",
  "mass_name": null
}
```

**Response (201 Created):**
```json
{
  "id": "new-song-uuid",
  "title": "Nuevo Canto",
  "category": "Entrada",
  "youtube_id": "abc12345678",
  "sheet_music_url": "https://...storage.../partitura.pdf",
  "duration": "3:45",
  "author": "Compositor",
  "version": "Coro",
  "mass_name": null,
  "created_at": "2025-01-19T16:00:00Z",
  "updated_at": "2025-01-19T16:00:00Z",
  "created_by": "admin-uuid"
}
```

**Errores:**
- `400` - Datos inválidos (ej: youtube_id no válido)
- `401` - No autenticado
- `403` - No autorizado (no es Admin)

**Código TypeScript:**
```typescript
async function createSong(song: Omit<Song, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
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
      created_by: user?.id,
    })
    .select()
    .single();

  return { data, error };
}
```

---

### 4. Actualizar Canto (Solo Admin)

**Endpoint:** `PATCH /songs?id=eq.{song_id}`

**Request Body:**
```json
{
  "title": "Título Actualizado",
  "duration": "4:00"
}
```

**Response (200 OK):**
```json
{
  "id": "song-uuid",
  "title": "Título Actualizado",
  "duration": "4:00",
  ...
}
```

**Código TypeScript:**
```typescript
async function updateSong(songId: string, updates: Partial<Song>) {
  const { data, error } = await supabase
    .from('songs')
    .update({
      title: updates.title,
      category: updates.category,
      youtube_id: updates.youtubeId,
      duration: updates.duration,
      author: updates.author,
      version: updates.version,
    })
    .eq('id', songId)
    .select()
    .single();

  return { data, error };
}
```

---

### 5. Eliminar Canto (Solo Admin)

**Endpoint:** `DELETE /songs?id=eq.{song_id}`

**Response (204 No Content)**

**Código TypeScript:**
```typescript
async function deleteSong(songId: string) {
  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', songId);

  return { error };
}
```

---

## 📖 Endpoints de Cantorales

### 1. Listar Cantorales Publicados

**Endpoint:** `GET /published_cantorals`

**Query Parameters:**
- `parish_name` - Filtrar por parroquia
- `date` - Filtrar por fecha exacta
- `choir_id` - Filtrar por coro
- `order` - Ordenamiento (por defecto: `date.desc`)
- `limit` - Límite de resultados

**Ejemplos:**

```http
GET /published_cantorals?parish_name=eq.Parroquia San Juan&order=date.asc
GET /published_cantorals?date=gte.2025-01-19&date=lte.2025-01-26
GET /published_cantorals?choir_id=eq.{choir_uuid}
```

**Response (200 OK):**
```json
[
  {
    "id": "cantoral-uuid-1",
    "choir_id": "choir-uuid",
    "choir_name": "Coro Parroquial",
    "parish_name": "Parroquia San Juan",
    "date": "2025-01-26",
    "liturgical_date": "3er Domingo del Tiempo Ordinario",
    "mass_time": "10:00 AM",
    "created_at": "2025-01-19T12:00:00Z",
    "published_by": "user-uuid",
    "published_at": "2025-01-19T12:00:00Z"
  },
  ...
]
```

**Código TypeScript:**
```typescript
async function getPublishedCantorals(filters?: {
  parishName?: string;
  date?: string;
  choirId?: string;
}) {
  let query = supabase
    .from('published_cantorals')
    .select('*')
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
  return { data, error };
}
```

---

### 2. Obtener Cantoral con Cantos

**Endpoint:** `GET /published_cantorals?id=eq.{cantoral_id}&select=*,cantoral_songs(position,song:songs(*))`

**Descripción:** Obtener cantoral con todos sus cantos ordenados.

**Response (200 OK):**
```json
{
  "id": "cantoral-uuid-1",
  "choir_id": "choir-uuid",
  "choir_name": "Coro Parroquial",
  "parish_name": "Parroquia San Juan",
  "date": "2025-01-26",
  "liturgical_date": "3er Domingo del Tiempo Ordinario",
  "mass_time": "10:00 AM",
  "cantoral_songs": [
    {
      "position": 0,
      "song": {
        "id": "song-1",
        "title": "Entrada Festiva",
        "category": "Entrada",
        "youtube_id": "...",
        "duration": "3:30",
        ...
      }
    },
    {
      "position": 1,
      "song": {
        "id": "song-2",
        "title": "Kyrie Eleison",
        "category": "Kyrie",
        ...
      }
    },
    ...
  ]
}
```

**Código TypeScript:**
```typescript
async function getCantoralWithSongs(cantoralId: string) {
  const { data, error } = await supabase
    .from('published_cantorals')
    .select(`
      *,
      cantoral_songs (
        position,
        song:songs (*)
      )
    `)
    .eq('id', cantoralId)
    .single();

  if (error) return { data: null, error };

  // Transformar y ordenar
  const cantoral = {
    ...data,
    songs: data.cantoral_songs
      .sort((a, b) => a.position - b.position)
      .map(cs => cs.song),
  };

  delete cantoral.cantoral_songs;

  return { data: cantoral, error: null };
}
```

---

### 3. Publicar Cantoral (Solo Coro)

**Endpoint:** Requiere 2 requests:
1. `POST /published_cantorals` - Crear cantoral
2. `POST /cantoral_songs` - Agregar cantos

**Request 1 - Crear Cantoral:**
```json
{
  "choir_id": "choir-uuid",
  "choir_name": "Coro Parroquial",
  "parish_name": "Parroquia San Juan",
  "date": "2025-01-26",
  "liturgical_date": "3er Domingo del Tiempo Ordinario",
  "mass_time": "10:00 AM"
}
```

**Response 1 (201 Created):**
```json
{
  "id": "new-cantoral-uuid",
  "choir_id": "choir-uuid",
  "choir_name": "Coro Parroquial",
  "parish_name": "Parroquia San Juan",
  "date": "2025-01-26",
  "liturgical_date": "3er Domingo del Tiempo Ordinario",
  "mass_time": "10:00 AM",
  "created_at": "2025-01-19T14:00:00Z",
  "published_by": "user-uuid",
  "published_at": "2025-01-19T14:00:00Z"
}
```

**Request 2 - Agregar Cantos (batch insert):**
```json
[
  {
    "cantoral_id": "new-cantoral-uuid",
    "song_id": "song-entrada-uuid",
    "position": 0
  },
  {
    "cantoral_id": "new-cantoral-uuid",
    "song_id": "song-kyrie-uuid",
    "position": 1
  },
  ...
]
```

**Código TypeScript Completo:**
```typescript
async function publishCantoral(cantoral: {
  parishName: string;
  date: string;
  liturgicalDate: string;
  massTime: string;
  songs: Song[];
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // 1. Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'Coro') {
    throw new Error('Solo los coros pueden publicar cantorales');
  }

  // 2. Crear cantoral
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

  // 3. Agregar cantos al cantoral
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

### 4. Actualizar Cantoral (Solo dueño)

**Endpoint:** `PATCH /published_cantorals?id=eq.{cantoral_id}`

**Request Body:**
```json
{
  "liturgical_date": "Solemnidad de la Epifanía",
  "mass_time": "11:00 AM"
}
```

**Código TypeScript:**
```typescript
async function updateCantoral(cantoralId: string, updates: Partial<PublishedCantoral>) {
  const { data, error } = await supabase
    .from('published_cantorals')
    .update({
      liturgical_date: updates.liturgicalDate,
      mass_time: updates.massTime,
    })
    .eq('id', cantoralId)
    .select()
    .single();

  return { data, error };
}
```

---

### 5. Eliminar Cantoral (Solo dueño)

**Endpoint:** `DELETE /published_cantorals?id=eq.{cantoral_id}`

**Nota:** Elimina automáticamente las relaciones en `cantoral_songs` por CASCADE.

**Código TypeScript:**
```typescript
async function deleteCantoral(cantoralId: string) {
  const { error } = await supabase
    .from('published_cantorals')
    .delete()
    .eq('id', cantoralId);

  return { error };
}
```

---

## 📁 Endpoints de Storage

### 1. Subir Partitura (Solo Admin)

**Endpoint:** `POST /storage/v1/object/sheet-music/partituras/{filename}`

**Headers:**
```http
Authorization: Bearer {jwt_token}
Content-Type: application/pdf
```

**Body:** Archivo PDF binario

**Response (200 OK):**
```json
{
  "Key": "sheet-music/partituras/song-uuid.pdf",
  "Id": "...",
  "ETag": "..."
}
```

**Código TypeScript:**
```typescript
async function uploadSheetMusic(file: File, songId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${songId}.${fileExt}`;
  const filePath = `partituras/${fileName}`;

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
}
```

---

### 2. Obtener URL de Partitura

**Endpoint:** `GET /storage/v1/object/public/sheet-music/partituras/{filename}`

**Descripción:** Las partituras son públicas, no requiere autenticación.

**Ejemplo:**
```
https://[proyecto].supabase.co/storage/v1/object/public/sheet-music/partituras/song-uuid.pdf
```

**Código TypeScript:**
```typescript
function getSheetMusicUrl(songId: string) {
  const { data } = supabase.storage
    .from('sheet-music')
    .getPublicUrl(`partituras/${songId}.pdf`);

  return data.publicUrl;
}
```

---

### 3. Eliminar Partitura (Solo Admin)

**Endpoint:** `DELETE /storage/v1/object/sheet-music/partituras/{filename}`

**Código TypeScript:**
```typescript
async function deleteSheetMusic(songId: string) {
  const { error } = await supabase.storage
    .from('sheet-music')
    .remove([`partituras/${songId}.pdf`]);

  return { error };
}
```

---

## ❌ Códigos de Error

### Errores de Autenticación

| Código | Mensaje | Descripción |
|--------|---------|-------------|
| `401` | `Unauthorized` | Token JWT no válido o ausente |
| `403` | `Forbidden` | Usuario no tiene permisos para esta acción |
| `419` | `Authentication Timeout` | Sesión expirada, refresh token |

### Errores de Validación

| Código | Mensaje | Descripción |
|--------|---------|-------------|
| `400` | `Bad Request` | Datos inválidos en request body |
| `422` | `Unprocessable Entity` | Constraint violation (ej: youtube_id inválido) |

### Errores de Recursos

| Código | Mensaje | Descripción |
|--------|---------|-------------|
| `404` | `Not Found` | Recurso no existe |
| `409` | `Conflict` | Recurso ya existe (ej: duplicate key) |

### Errores de Servidor

| Código | Mensaje | Descripción |
|--------|---------|-------------|
| `500` | `Internal Server Error` | Error del servidor |
| `503` | `Service Unavailable` | Servicio temporalmente no disponible |

---

## ⏱️ Rate Limiting

Supabase aplica rate limiting automático:

- **Free Tier:** 100 requests/segundo por IP
- **Pro Tier:** 200 requests/segundo por IP

**Response headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642612800
```

**Error de rate limit:**
```json
{
  "message": "Rate limit exceeded",
  "code": "429"
}
```

---

## 📊 Paginación

### Usando range()

```typescript
// Obtener cantos 0-49 (primera página)
const { data, error } = await supabase
  .from('songs')
  .select('*')
  .range(0, 49);

// Obtener cantos 50-99 (segunda página)
const { data, error } = await supabase
  .from('songs')
  .select('*')
  .range(50, 99);
```

### Usando limit() y offset()

```typescript
const page = 2;
const pageSize = 20;

const { data, error } = await supabase
  .from('songs')
  .select('*')
  .limit(pageSize)
  .range((page - 1) * pageSize, page * pageSize - 1);
```

### Obtener conteo total

```typescript
const { count, error } = await supabase
  .from('songs')
  .select('*', { count: 'exact', head: true });

console.log(`Total cantos: ${count}`);
```

---

## 🎯 Ejemplos de Uso Completo

### Flujo Completo: Coro Publica Cantoral

```typescript
// 1. Usuario se autentica
const { data: { session } } = await supabase.auth.signInWithOAuth({
  provider: 'google'
});

// 2. Verificar si tiene perfil
const { data: profile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', session.user.id)
  .single();

// 3. Si no tiene perfil, crear uno
if (!profile) {
  await supabase.from('user_profiles').insert({
    id: session.user.id,
    email: session.user.email,
    name: 'Coro Parroquial',
    role: 'Coro',
    instrument: 'Guitarra',
    parish_name: 'Parroquia San Juan',
  });
}

// 4. Buscar cantos por categoría
const { data: songs } = await supabase
  .from('songs')
  .select('*')
  .eq('category', 'Comunión')
  .eq('version', 'Guitarra');

// 5. Usuario selecciona cantos (en frontend)
const selectedSongs = [...]; // Array de Song

// 6. Publicar cantoral
const { data: cantoral } = await publishCantoral({
  parishName: 'Parroquia San Juan',
  date: '2025-01-26',
  liturgicalDate: '3er Domingo del Tiempo Ordinario',
  massTime: '10:00 AM',
  songs: selectedSongs,
});

console.log('Cantoral publicado:', cantoral.id);
```

---

## 🎯 Conclusión

La API de Stella Maris proporciona:

✅ **CRUD completo** para todos los recursos  
✅ **Autenticación segura** con JWT y Google OAuth  
✅ **Autorización granular** con RLS  
✅ **Queries optimizadas** con filtros y joins  
✅ **Storage integrado** para partituras  
✅ **Type-safe** con TypeScript  

**Próximo paso:** Implementar estas funciones en el frontend siguiendo `/docs/BACKEND_SETUP.md`
