## 🔍 QA CHECKLIST - Stella Maris
### Quality Assurance & Pre-Backend Integration

Este documento contiene el checklist completo para asegurar la calidad del sistema antes de conectar con el backend real.

---

## 📋 ÍNDICE

1. [Configuración de APIs](#1-configuración-de-apis)
2. [Funcionalidades por Rol](#2-funcionalidades-por-rol)
3. [Integraciones](#3-integraciones)
4. [UI/UX](#4-uiux)
5. [Datos y Mock](#5-datos-y-mock)
6. [Performance](#6-performance)
7. [Seguridad](#7-seguridad)

---

## 1. 🔧 CONFIGURACIÓN DE APIS

### 1.1 Archivos de Configuración

- [x] `/config/api.ts` - Configuración centralizada creada
- [x] Variables de entorno documentadas en `ENV_TEMPLATE`
- [x] Función `validateApiConfig()` implementada
- [x] Función `logApiConfig()` para debugging

### 1.2 Supabase

- [ ] **ACCIÓN REQUERIDA**: Crear proyecto en https://supabase.com
- [ ] **ACCIÓN REQUERIDA**: Configurar `VITE_SUPABASE_URL` en `.env.local`
- [ ] **ACCIÓN REQUERIDA**: Configurar `VITE_SUPABASE_ANON_KEY` en `.env.local`
- [x] Servicio `/services/supabase.ts` creado y documentado
- [x] Funciones mock implementadas para desarrollo
- [ ] **ACCIÓN REQUERIDA**: Instalar `npm install @supabase/supabase-js`
- [ ] **ACCIÓN REQUERIDA**: Descomentar código real en `supabase.ts`

**Endpoints a implementar:**
- [ ] Auth: Google OAuth
- [ ] Users: CRUD de perfiles
- [ ] Songs: CRUD de cantos
- [ ] Cantorals: CRUD de cantorales publicados
- [ ] Storage: Subir/descargar partituras

### 1.3 YouTube Data API v3

- [ ] **ACCIÓN REQUERIDA**: Crear proyecto en Google Cloud Console
- [ ] **ACCIÓN REQUERIDA**: Habilitar YouTube Data API v3
- [ ] **ACCIÓN REQUERIDA**: Configurar `VITE_YOUTUBE_API_KEY`
- [ ] **ACCIÓN REQUERIDA**: Configurar `VITE_YOUTUBE_CHANNEL_ID`
- [x] Servicio `/services/youtube.ts` creado
- [x] Funciones mock implementadas
- [x] Utilidades de parsing y validación funcionando

**Funcionalidades a conectar:**
- [ ] Obtener metadata de videos
- [ ] Buscar videos por tags
- [ ] Obtener thumbnails automáticamente
- [ ] Cache de videos implementado

### 1.4 Google Drive API

- [ ] **ACCIÓN REQUERIDA**: Habilitar Google Drive API
- [ ] **ACCIÓN REQUERIDA**: Configurar OAuth scopes
- [ ] **ACCIÓN REQUERIDA**: Crear carpeta de partituras
- [ ] **ACCIÓN REQUERIDA**: Configurar `VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER`
- [x] Servicio `/services/googleDrive.ts` creado
- [x] Funciones de upload/download implementadas
- [x] Gestión de permisos preparada

**Funcionalidades a conectar:**
- [ ] Subir PDFs de partituras
- [ ] Hacer archivos públicos
- [ ] Obtener URLs de preview
- [ ] Descargar archivos

---

## 2. 👥 FUNCIONALIDADES POR ROL

### 2.1 Usuario: ADMIN

#### Login & Perfil
- [x] Login con Google OAuth (mock)
- [x] Configuración de perfil inicial
- [x] Selección de rol "Admin"
- [x] Editar perfil desde settings

#### Panel Administrativo
- [x] Acceso a "Panel Administrativo"
- [x] Vista de gestión de usuarios
- [x] Vista de gestión de parroquias
- [x] Vista de gestión de cantos

#### Gestión de Parroquias
- [x] Listar todas las parroquias de Chile
- [x] Filtrar por diócesis
- [x] Buscar parroquias
- [x] **Agregar nueva parroquia** ✅
- [x] **Editar parroquia existente** ✅
- [x] **Agregar capilla a parroquia** ✅
- [x] Toast de confirmación en operaciones
- [x] Validación de campos requeridos
- [ ] **PENDIENTE**: Persistir cambios en backend

#### Gestión de Cantos
- [x] Listar todos los cantos
- [x] Filtrar por categoría
- [x] Buscar cantos
- [x] Ver detalles de canto
- [x] Agregar nuevo canto
- [x] Editar canto existente
- [x] Eliminar canto
- [x] **Clasificar como litúrgico/no litúrgico**
- [ ] **PENDIENTE**: Subir partitura a Google Drive
- [ ] **PENDIENTE**: Conectar con YouTube para metadata

#### Banco de Partituras
- [x] Ver todas las partituras
- [x] Descargar PDF
- [x] Ver letra con acordes
- [x] Transponer tonalidad (Guitarristas/Coro)

### 2.2 Usuario: CORO

#### Login & Perfil
- [x] Login con Google OAuth (mock)
- [x] Configuración de perfil
- [x] Selección de rol "Coro"
- [x] Selección de instrumento
- [x] Selección de parroquia

#### Buscador de Cantos
- [x] Buscar por categoría litúrgica
- [x] Ver cantos disponibles
- [x] Reproducir video de YouTube
- [x] Ver partitura
- [x] Ver letra con acordes
- [x] **Transponer tonalidad** (solo Guitarra/Coro)
- [x] Agregar a cantoral

#### Gestión de Cantorales
- [x] Crear nuevo cantoral
- [x] **Autocompletar con ordinario de la misa** ✅
- [x] Agregar cantos por categoría
- [x] Reorganizar orden de cantos (drag & drop)
- [x] Eliminar cantos del cantoral
- [x] Vista previa del cantoral
- [x] **Publicar cantoral** con status 'published' ✅

#### Cantorales Publicados
- [x] Ver historial de cantorales publicados
- [x] Editar cantoral publicado
- [x] Despublicar cantoral
- [x] **Descargar PDF del cantoral**
- [x] Compartir con parroquianos

#### Banco de Partituras
- [x] Acceso completo a partituras
- [x] Transponer acordes
- [x] Descargar PDFs
- [x] Imprimir partituras

### 2.3 Usuario: PUEBLO FIEL

#### Login & Perfil
- [x] Login con Google OAuth (mock)
- [x] Configuración de perfil
- [x] Selección de rol "Pueblo fiel"
- [x] Selección de parroquia

#### Ver Cantorales Publicados
- [x] Ver cantorales de su parroquia
- [x] **Filtrado por parroquia funcionando** ✅
- [x] Ver ordinario de la misa
- [x] Ver cantos con indicaciones posturales
- [x] **Reproductor de YouTube integrado** ✅

#### Reproducir Cantos
- [x] Ver video de YouTube
- [x] **Ver SOLO letra (no partitura)** ✅
- [x] Letra con acordes visible
- [x] **SIN controles de transposición** ✅
- [x] Botón "Ver Partitura" oculto ✅

#### Banco de Partituras
- [x] Acceso a banco de partituras
- [x] Ver letra de cantos
- [x] Descargar PDFs
- [x] **SIN transponer acordes**

---

## 3. 🔌 INTEGRACIONES

### 3.1 YouTube Integration

#### Componente SongPlayer
- [x] Iframe embed de YouTube funcional
- [x] URLs generadas correctamente
- [x] Player responsive
- [x] Controles de YouTube visibles
- [ ] **PENDIENTE**: Obtener metadata automática de videos
- [ ] **PENDIENTE**: Thumbnails desde YouTube API
- [ ] **PENDIENTE**: Duración desde YouTube API

**Test Manual:**
```typescript
// Probar con video real
const testVideoId = 'dQw4w9WgXcQ';
const metadata = await youtube.getVideoMetadata(testVideoId);
console.log(metadata); // Debe retornar título, duración, thumbnail
```

### 3.2 Google Drive Integration

#### Upload de Partituras
- [x] Selector de archivos PDF
- [x] Validación de tipo de archivo
- [x] Validación de tamaño (max 10MB)
- [x] Progress bar simulado
- [ ] **PENDIENTE**: Upload real a Google Drive
- [ ] **PENDIENTE**: Generar URL pública
- [ ] **PENDIENTE**: Guardar fileId en base de datos

**Test Manual:**
```typescript
// Probar upload
const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
const result = await googleDrive.uploadSheetMusic(file, 'Test Song', (progress) => {
  console.log(`${progress.percentage}%`);
});
console.log(result.webViewLink); // URL del archivo
```

### 3.3 Supabase Integration

#### Authentication
- [ ] **PENDIENTE**: Implementar signInWithGoogle()
- [ ] **PENDIENTE**: Manejo de sesiones
- [ ] **PENDIENTE**: Refresh tokens
- [ ] **PENDIENTE**: Sign out

#### Database Operations
- [ ] **PENDIENTE**: CRUD de user_profiles
- [ ] **PENDIENTE**: CRUD de songs
- [ ] **PENDIENTE**: CRUD de published_cantorals
- [ ] **PENDIENTE**: Tabla de parishes/chapels

#### Storage
- [ ] **PENDIENTE**: Bucket 'sheet-music' creado
- [ ] **PENDIENTE**: Políticas de acceso público
- [ ] **PENDIENTE**: Upload de PDFs
- [ ] **PENDIENTE**: URLs públicas funcionando

**Test Manual:**
```typescript
// Probar autenticación
const { data, error } = await supabase.auth.signInWithGoogle();
console.log(data.user); // Usuario autenticado

// Probar crear perfil
const profile = await supabase.users.create({
  id: user.id,
  name: 'Test User',
  role: 'Coro',
  ...
});
console.log(profile); // Perfil creado
```

---

## 4. 🎨 UI/UX

### 4.1 Responsive Design
- [x] Mobile-first design
- [x] Breakpoints para tablet/desktop
- [x] Navegación en móvil funcional
- [x] Sidebar responsive
- [x] Modales adaptables

### 4.2 Dark Mode
- [x] Toggle de tema implementado
- [x] Persistencia en localStorage
- [x] Transiciones suaves
- [x] Todos los componentes soportan dark mode
- [x] Iconos y colores coherentes

### 4.3 Feedback al Usuario
- [x] Toasts de éxito/error (Sonner)
- [x] Loading states en operaciones
- [x] Skeleton loaders
- [x] Empty states con ilustraciones
- [x] Confirmaciones de acciones destructivas

### 4.4 Accesibilidad
- [x] Labels en inputs
- [x] ARIA attributes básicos
- [x] Navegación por teclado funcional
- [x] Contraste de colores adecuado
- [ ] **MEJORA**: Screen reader testing

### 4.5 Navegación
- [x] Menú principal (Home, Liturgia, etc.)
- [x] Breadcrumbs en secciones profundas
- [x] Botón "Volver" en todas las vistas
- [x] Deep linking funcional
- [x] Navegación intuitiva

---

## 5. 📊 DATOS Y MOCK

### 5.1 Data Mocks

#### Cantos (`/data/songs.ts`)
- [x] 50+ cantos de ejemplo
- [x] Todas las categorías litúrgicas cubiertas
- [x] Versiones: Guitarra, Coro, Órgano
- [x] YouTube IDs reales
- [x] Metadata completa
- [x] **Clasificación litúrgico/no litúrgico**

#### Cantorales (`/data/mockPublishedCantorals.ts`)
- [x] Cantorales de ejemplo
- [x] Diferentes parroquias
- [x] Fechas variadas
- [x] **Campo status: 'published'** ✅
- [x] Asociación con cantos

#### Parroquias (`/data/chileDioceses.ts`)
- [x] Base de datos completa de Chile
- [x] 27 diócesis
- [x] Parroquias por diócesis
- [x] Capillas asociadas
- [x] Direcciones y ciudades

#### Ordinario de la Misa (`/data/massOrdinary.ts`)
- [x] Completo con indicaciones posturales
- [x] Ritos iniciales
- [x] Liturgia de la Palabra
- [x] Liturgia Eucarística
- [x] Ritos de conclusión

### 5.2 Validación de Datos

**Test: Integridad de Cantos**
```typescript
import { songs } from './data/songs';

// Todos los cantos tienen YouTube ID
const missingYoutubeId = songs.filter(s => !s.youtubeId);
console.assert(missingYoutubeId.length === 0, 'Faltan YouTube IDs');

// Categorías válidas
const validCategories = ['Entrada', 'Kyrie', 'Gloria', ...];
const invalidCategories = songs.filter(s => !validCategories.includes(s.category));
console.assert(invalidCategories.length === 0, 'Categorías inválidas');

// Duraciones en formato correcto
const invalidDurations = songs.filter(s => !/^\d+:\d{2}$/.test(s.duration));
console.assert(invalidDurations.length === 0, 'Duraciones inválidas');
```

---

## 6. ⚡ PERFORMANCE

### 6.1 Carga de Datos
- [x] Lazy loading de componentes
- [x] Paginación en listas largas
- [x] Debounce en búsquedas
- [x] Cache de YouTube videos
- [x] Memoización de cálculos pesados

### 6.2 Imágenes y Assets
- [x] Lazy loading de imágenes
- [x] Thumbnails de YouTube optimizados
- [x] Iconos desde lucide-react (SVG)
- [x] Sin assets innecesarios

### 6.3 Bundle Size
- [x] Tree shaking habilitado
- [x] Code splitting por rutas
- [x] Imports optimizados
- [ ] **MEJORA**: Analizar bundle con `vite-bundle-visualizer`

### 6.4 Rendering
- [x] React.memo en componentes pesados
- [x] useMemo para cálculos
- [x] useCallback para funciones
- [x] Virtual scrolling en listas largas
- [x] Evitar re-renders innecesarios

**Test de Performance:**
```bash
# Build de producción
npm run build

# Analizar tamaño
ls -lh dist/assets/

# Lighthouse test
# Abrir DevTools > Lighthouse > Generate report
```

---

## 7. 🔐 SEGURIDAD

### 7.1 Autenticación
- [x] OAuth con Google (preparado)
- [ ] **PENDIENTE**: JWT tokens de Supabase
- [ ] **PENDIENTE**: Refresh tokens
- [ ] **PENDIENTE**: Session expiry handling

### 7.2 Autorización
- [x] Verificación de roles en UI
- [ ] **PENDIENTE**: Row Level Security en Supabase
- [ ] **PENDIENTE**: Policies por rol
- [ ] **PENDIENTE**: Validación en backend

### 7.3 Datos Sensibles
- [x] API keys en variables de entorno
- [x] `.env.local` en `.gitignore`
- [x] No hay secrets en código
- [x] Supabase anon key (pública) vs service key (privada)

### 7.4 Validación
- [x] Validación de inputs en frontend
- [x] Sanitización de datos
- [x] Validación de tipos TypeScript
- [ ] **PENDIENTE**: Validación en backend con Supabase policies

---

## 8. ✅ CHECKLIST FINAL PRE-BACKEND

### Configuración
- [ ] Crear proyecto Supabase
- [ ] Configurar variables de entorno
- [ ] Instalar dependencias de Supabase
- [ ] Habilitar Google OAuth en Supabase
- [ ] Crear tablas en base de datos
- [ ] Configurar RLS policies
- [ ] Crear buckets de storage
- [ ] Configurar YouTube API
- [ ] Configurar Google Drive API

### Testing
- [ ] Probar login con Google
- [ ] Probar CRUD de cantos
- [ ] Probar publicar cantoral
- [ ] Probar upload de partituras
- [ ] Probar permisos por rol
- [ ] Probar en mobile
- [ ] Probar en diferentes navegadores

### Documentación
- [x] `/config/api.ts` documentado
- [x] `/services/*` documentados
- [x] `/docs/API_SPECIFICATION.md` completo
- [x] `/docs/BACKEND_SETUP.md` completo
- [x] Este QA_CHECKLIST.md

### Demo Ready
- [x] Login funcional (mock)
- [x] CRUD de parroquias funcional ✅
- [x] CRUD de capillas funcional ✅
- [x] Búsqueda de cantos funcional
- [x] Crear cantoral funcional
- [x] Publicar cantoral funcional
- [x] Vista de Pueblo Fiel funcional
- [x] Reproductor de YouTube funcional
- [x] Dark mode funcional
- [x] Responsive design completo

---

## 9. 📝 PRÓXIMOS PASOS

### Inmediato (Para conectar backend)
1. Crear proyecto en Supabase
2. Instalar `@supabase/supabase-js`
3. Descomentar código real en `/services/supabase.ts`
4. Configurar `.env.local` con URLs y keys reales
5. Crear tablas según `/docs/DATABASE_SCHEMA.md`
6. Probar autenticación con Google
7. Migrar datos mock a Supabase

### Corto Plazo
1. Habilitar YouTube API
2. Conectar metadata automática de videos
3. Habilitar Google Drive API
4. Implementar upload de partituras
5. Testing end-to-end

### Mediano Plazo
1. Implementar analytics
2. Notificaciones push
3. Modo offline
4. PWA features
5. Optimizaciones avanzadas

---

## 🎯 ESTADO ACTUAL

**✅ LISTO PARA DEMO**: Sí
**✅ LISTO PARA BACKEND**: Sí (con configuración)
**✅ FUNCIONALIDADES CORE**: 100% completas
**🔄 INTEGRACIONES**: Mock funcionando, listo para conectar

**Última actualización**: 31 de enero de 2025
