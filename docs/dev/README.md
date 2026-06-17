# 📖 Stella Maris - Documentación Completa del Proyecto

## 🌟 Visión General

**Stella Maris** es una aplicación móvil para coros católicos que funciona como un "Spotify litúrgico", permitiendo a los coros armar cantorales para sus parroquianos con acceso a cantos, partituras y audios desde YouTube.

### 🎯 Propósito

Facilitar la participación activa en la liturgia católica mediante:
- 🎵 Búsqueda organizada de cantos por momento litúrgico
- 📖 Acceso a partituras y audios
- ⛪ Cantorales publicados con ordinario completo de la Misa
- 📱 Indicaciones posturales para guiar a fieles (especialmente niños y ancianos)

---

## 👥 Tipos de Usuario

### 1. 🎤 Coro
**Permisos:**
- ✅ Crear y publicar cantorales
- ✅ Elegir instrumento de acompañamiento (Coro, Guitarra, Órgano)
- ✅ Ver cantorales publicados por otros coros
- ❌ NO pueden agregar nuevos cantos a la biblioteca

**Flujo típico:**
1. Buscar cantos por categoría litúrgica
2. Armar cantoral para una fecha específica
3. Publicar cantoral para los fieles de su parroquia

### 2. 👨‍👩‍👧‍👦 Pueblo Fiel
**Permisos:**
- ✅ Ver cantorales publicados
- ✅ Reproducir cantos con audio y partituras
- ❌ NO pueden crear cantorales
- ❌ NO pueden agregar cantos

**Flujo típico:**
1. Ver cantorales publicados para su parroquia
2. Consultar cantoral de la próxima Misa
3. Reproducir cantos para aprender/practicar

### 3. 🔧 Admin
**Permisos:**
- ✅ Agregar nuevos cantos a la biblioteca
- ✅ Editar información de cantos existentes
- ✅ Subir partituras (PDF)
- ✅ Gestionar todos los cantorales
- ✅ Todos los permisos de Coro y Pueblo Fiel

**Flujo típico:**
1. Subir nuevos cantos con YouTube ID y partitura
2. Organizar cantos por categoría y misa
3. Gestionar biblioteca completa de cantos

---

## 🎵 Categorías Litúrgicas

Los cantos están organizados según el momento de la Santa Misa:

### Categorías Principales

1. **Entrada** 🚪
2. **Misa** (Ordinario)
   - **Kyrie** ✝️ (Señor, ten piedad)
   - **Gloria** 🕊️
   - **Santo** 👑 (Sanctus)
   - **Cordero de Dios** 🐑 (Agnus Dei)
   - **Credo** 📿 (opcional, domingos y solemnidades)
   - **Padre Nuestro** 🙏 (opcional)
3. **Salmo** 📖
4. **Aleluya** 🎺 (o **Aclamación al Evangelio** 📿 en Cuaresma)
5. **Post Evangelio** 📿
6. **Ofertorio** 🍞
7. **Comunión** 🍷 (permite múltiples cantos)
8. **Salida** 🚶

### ⚠️ Reglas Litúrgicas Especiales

#### 1. Kyrie - Santo - Cordero de Dios
Cuando se agrega un **Kyrie**, automáticamente se deben agregar:
- ✝️ **Kyrie** (elegido por el usuario)
- 👑 **Santo** (automático, de la misma misa)
- 🐑 **Cordero de Dios** (automático, de la misma misa)
- 🕊️ **Gloria** (pregunta al usuario si desea agregarlo)

**Razón:** Estos cantos pertenecen al mismo ordinario de la Misa y deben ser coherentes.

#### 2. Restricción de Un Solo Canto

**Regla:** Solo **Comunión** permite múltiples cantos. Todas las demás categorías solo permiten **UN CANTO**.

**Comportamiento:**
- Al agregar un canto a una categoría (excepto Comunión), se reemplaza automáticamente el anterior
- En Comunión, se pueden agregar múltiples cantos que se reproducen en secuencia

#### 3. Aleluya en Cuaresma

**Regla litúrgica:** Durante la Cuaresma (Miércoles de Ceniza → Viernes Santo), el Aleluya se omite y se reemplaza por "Aclamación al Evangelio".

**Implementación:**
- Detección automática del tiempo litúrgico
- Cambio de UI: "Aleluya 🎺" → "Aclamación al Evangelio 📿"
- Aviso visual morado explicando el cambio
- Cálculo de fechas usando algoritmo de Pascua

---

## 🎨 Diseño y Paleta de Colores

### Paleta Católica Tradicional

**Fondos:**
- `from-amber-100 via-amber-50 to-orange-100` (modo claro)
- `from-slate-900 via-blue-950 to-indigo-950` (modo oscuro)
- Tonos ocres claros y legibles

**Encabezados y Botones:**
- `from-blue-900 to-blue-950` (azul rey con gradiente)
- Bordes: `border-blue-800`
- Textos blancos para máximo contraste

**Efectos:**
- Glassmorphism moderno: `backdrop-blur-sm` + `bg-white/30`
- Bordes semi-transparentes: `border-white/40`
- Sombras suaves: `shadow-xl`

**Colores por Tiempo Litúrgico:**
- 🟣 **Cuaresma:** Morado (`purple-100`, `purple-900`)
- 🟢 **Tiempo Ordinario:** Verde
- ⚪ **Navidad/Pascua:** Blanco
- 🔴 **Pentecostés:** Rojo

---

## 📱 Estructura de la Aplicación

### Estados Principales

```typescript
type AppState = 'login' | 'profile-setup' | 'main' | 'player' | 'settings';
type ViewState = 'main' | 'cantorals' | 'courses' | 'admin' | 'theory' | 
                 'liturgy' | 'instruments' | 'manage-cantorals' | 'history' | 
                 'liturgical-calendar' | 'sheet-music';
```

### Flujo de Navegación

```
┌─────────────┐
│   Login     │ (Pantalla inicial)
└──────┬──────┘
       │ Google OAuth
       ▼
┌─────────────┐
│Profile Setup│ (Solo primera vez)
└──────┬──────┘
       │ Selecciona rol + instrumento (si es Coro)
       ▼
┌─────────────┐
│  Main App   │
└──────┬──────┘
       │
       ├─► Home (según rol)
       │   ├─► ChoirView (para Coro)
       │   ├─► PublishedCantorals (para Pueblo Fiel)
       │   └─► AdminDashboard (para Admin)
       │
       ├─► SongPlayer (reproducir canto)
       ├─► Courses (cursos de formación)
       ├─► Settings (configuración)
       └─► Sidebar (menú lateral)
```

---

## 🗂️ Estructura de Archivos

```
/
├── components/
│   ├── Login.tsx                    # Pantalla de login con Google
│   ├── ProfileSetup.tsx             # Setup inicial de perfil
│   ├── ChoirView.tsx                # Vista principal del Coro
│   ├── PublishedCantorals.tsx       # Vista de Pueblo Fiel
│   ├── AdminDashboard.tsx           # Panel de administración
│   ├── SongPlayer.tsx               # Reproductor de cantos
│   ├── CategorySearch.tsx           # Búsqueda por categoría
│   ├── CantoralPreview.tsx          # Vista previa del cantoral
│   ├── PublishCantoralModal.tsx     # Modal para publicar
│   ├── AddGloriaDialog.tsx          # Diálogo del Gloria
│   ├── Sidebar.tsx                  # Menú lateral
│   ├── Home.tsx                     # Pantalla de bienvenida
│   └── ...
│
├── data/
│   ├── mockSongs.ts                 # Datos mock de cantos
│   └── mockPublishedCantorals.ts    # Datos mock de cantorales
│
├── utils/
│   ├── colors.ts                    # Sistema de colores
│   └── liturgicalSeason.ts          # Cálculo de tiempos litúrgicos
│
├── contexts/
│   └── ThemeContext.tsx             # Contexto de tema claro/oscuro
│
├── types.ts                         # Tipos TypeScript
├── App.tsx                          # Componente principal
└── styles/
    └── globals.css                  # Estilos globales
```

---

## 📊 Modelos de Datos

### Song (Canto)

```typescript
interface Song {
  id: string;                        // UUID único
  title: string;                     // "Pescador de Hombres"
  category: string;                  // "Comunión", "Entrada", etc.
  youtubeId: string;                 // ID del video de YouTube
  sheetMusicUrl?: string;            // URL de la partitura (PDF)
  duration: string;                  // "4:30"
  artist?: string;                   // Intérprete
  author?: string;                   // "Cesáreo Gabaráin"
  version?: 'Coro' | 'Guitarra' | 'Órgano';
  massName?: string;                 // "Misa de la Alegría" (para agrupar ordinario)
}
```

### UserProfile (Perfil de Usuario)

```typescript
interface UserProfile {
  id: string;                        // UUID (mismo que auth.users)
  email: string;                     // "usuario@ejemplo.com"
  name: string;                      // "Juan Pérez"
  role: 'Coro' | 'Pueblo fiel' | 'Admin';
  instrument?: 'Coro' | 'Guitarra' | 'Órgano';  // Solo para Coro
  photoUrl?: string;                 // URL de foto de perfil (Google)
  parishName?: string;               // "Parroquia San Juan"
}
```

### PublishedCantoral (Cantoral Publicado)

```typescript
interface PublishedCantoral {
  id: string;                        // UUID único
  choirId: string;                   // UUID del coro que publicó
  choirName: string;                 // "Coro Parroquial"
  parishName: string;                // "Parroquia San Juan"
  date: string;                      // "2025-01-19" (ISO date)
  liturgicalDate: string;            // "3er Domingo del Tiempo Ordinario"
  massTime: string;                  // "10:00 AM"
  songs: Song[];                     // Array de cantos ordenados
  createdAt: string;                 // Timestamp de creación
  publishedBy?: string;              // UUID del usuario que publicó
  publishedAt?: string;              // Timestamp de publicación
}
```

---

## 🔐 Autenticación y Autorización

### Método de Autenticación

**Google OAuth 2.0** via Supabase

### Matriz de Permisos

| Acción | Coro | Pueblo Fiel | Admin |
|--------|------|-------------|-------|
| Ver cantorales publicados | ✅ | ✅ | ✅ |
| Crear cantorales | ✅ | ❌ | ✅ |
| Publicar cantorales | ✅ | ❌ | ✅ |
| Editar cantorales propios | ✅ | ❌ | ✅ |
| Eliminar cantorales propios | ✅ | ❌ | ✅ |
| Ver cantos | ✅ | ✅ | ✅ |
| Reproducir cantos | ✅ | ✅ | ✅ |
| Agregar nuevos cantos | ❌ | ❌ | ✅ |
| Editar cantos | ❌ | ❌ | ✅ |
| Eliminar cantos | ❌ | ❌ | ✅ |
| Subir partituras | ❌ | ❌ | ✅ |

---

## 🌐 Tecnologías

### Frontend
- ⚛️ **React 18** - Framework principal
- 🎨 **Tailwind CSS v4** - Estilos
- 📘 **TypeScript** - Type safety
- 🔥 **Vite** - Build tool

### Backend (A implementar)
- 🗄️ **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication (Google OAuth)
  - Storage (partituras PDF)
  - Row Level Security (RLS)

### Integraciones
- 🎥 **YouTube Embed API** - Reproducción de videos (NO requiere API key)
- 🔐 **Google OAuth** - Autenticación

---

## 📚 Documentación Relacionada

1. **`/INTEGRACIONES_BACKEND.md`** - Guía completa de integración con Supabase
2. **`/YOUTUBE_INTEGRATION.md`** - Documentación de integración con YouTube
3. **`/CORRECCIONES_LITURGICAS.md`** - Reglas litúrgicas implementadas
4. **`/docs/ARQUITECTURA.md`** - Arquitectura técnica detallada
5. **`/docs/API_SPECIFICATION.md`** - Especificación de API
6. **`/docs/DATABASE_SCHEMA.md`** - Esquema de base de datos
7. **`/docs/BACKEND_SETUP.md`** - Guía de setup del backend
8. **`/docs/CASOS_DE_USO.md`** - Casos de uso y flujos

---

## 🚀 Inicio Rápido

### Para Desarrolladores Frontend

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
```

### Para Desarrolladores Backend

1. Lee **`/docs/BACKEND_SETUP.md`** para configurar Supabase
2. Revisa **`/docs/DATABASE_SCHEMA.md`** para crear las tablas
3. Consulta **`/docs/API_SPECIFICATION.md`** para los endpoints

---

## 📞 Soporte

Para preguntas sobre la implementación, consulta la documentación técnica en la carpeta `/docs/`.

---

**Versión:** 1.0.0  
**Última actualización:** Enero 2025  
**Autor:** Equipo Stella Maris  
