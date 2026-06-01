# 🔐 Sistema de Seguridad - Stella Maris

## Descripción General

La aplicación Stella Maris implementa un sistema de seguridad robusto que garantiza que **solo los administradores** puedan subir cantos y manipular el canal de YouTube.

---

## 🛡️ Niveles de Protección

### 1. Control de Acceso por Roles

#### Roles Disponibles:
- **👥 Coro**: Pueden crear y publicar cantorales, seleccionar instrumento preferido
- **🙏 Pueblo Fiel**: Solo pueden ver cantorales publicados
- **🔒 Admin**: Control total del sistema, incluyendo subida de cantos y gestión de YouTube

#### Restricciones Implementadas:

```typescript
// En App.tsx - Línea 268
{currentView === 'admin' && userProfile.role === 'Admin' && (
  <AdminDashboard />
)}

// Mensaje de bloqueo si no es admin - Línea 273
{currentView === 'admin' && userProfile.role !== 'Admin' && (
  <div>🔒 Acceso Denegado</div>
)}
```

### 2. Ocultación de Opciones en el Menú

El menú lateral (`Sidebar`) solo muestra la opción "Panel Admin" a usuarios administradores:

```typescript
// En Sidebar.tsx - Línea 33
{ id: 'admin', label: 'Panel Admin', icon: ShieldCheck, roles: ['Admin'] }

// Filtro automático - Línea 36
const visibleMenuItems = menuItems.filter(item => item.roles.includes(userProfile.role));
```

**Resultado:**
- ✅ **Admins**: Ven "Panel Admin" en el menú
- ❌ **Coro y Pueblo Fiel**: NO ven esta opción

### 3. Pantalla de Acceso Denegado

Si un usuario no administrador intenta acceder a `/admin` (por URL directa o manipulación), ve:

```
🔒 
Acceso Denegado

Solo los administradores pueden acceder a esta sección.

Esta área incluye funcionalidades críticas como:
• Subir nuevos cantos al sistema
• Gestión del canal de YouTube
• Administración de usuarios

[Botón: Volver al Inicio]
```

---

## 📺 Protección del Canal de YouTube

### Seguridad a Nivel de Aplicación

✅ **Solo AdminDashboard tiene acceso** a las funciones de subida de cantos
✅ **SongManager** solo se renderiza si `userProfile.role === 'Admin'`
✅ **Verificación en múltiples niveles** (UI + lógica)

### Seguridad a Nivel de YouTube (CRÍTICO)

Para proteger el canal de YouTube contra modificaciones directas desde YouTube Studio:

#### 📋 Pasos Obligatorios:

1. **Acceder a YouTube Studio**
   - Ve a: https://studio.youtube.com
   - Haz clic en: **Configuración** (ícono de engranaje)
   - Selecciona: **Permisos**

2. **Configurar Permisos del Canal**
   - ✅ Mantén **solo al administrador principal** como "Propietario"
   - ❌ **NO agregues otros usuarios** como:
     - Editores
     - Administradores
     - Colaboradores

3. **Activar Autenticación de Dos Factores (2FA)**
   - Ve a: https://myaccount.google.com/security
   - Activa: **Verificación en 2 pasos**
   - Usa: Aplicación de autenticación (Google Authenticator, Authy, etc.)

4. **Configurar API de YouTube en Google Cloud Console**
   - Ve a: https://console.cloud.google.com
   - Proyecto: Stella Maris
   - APIs y servicios → YouTube Data API v3
   - Credenciales:
     - Solo la cuenta admin debe tener credenciales OAuth
     - Revoca cualquier credencial no autorizada

---

## 🔑 Flujo de Autenticación

### Login Inicial
```
1. Usuario inicia sesión con Google OAuth
2. Sistema verifica si el usuario existe en la base de datos
3. Si es nuevo → ProfileSetup (selecciona rol)
4. Si existe → Carga perfil con rol asignado
```

### Asignación de Roles (Solo Admin)

**IMPORTANTE**: Solo los administradores pueden asignar roles a nuevos usuarios.

En **ProductionMode**, el flujo sería:

1. Usuario nuevo se registra → Rol por defecto: `Pueblo Fiel`
2. Admin accede a: **Panel Admin → Gestión de Usuarios**
3. Admin cambia el rol según corresponda:
   - `Pueblo Fiel` → Usuario común
   - `Coro` → Miembro del coro de una parroquia
   - `Admin` → Solo para administradores del sistema

**NUNCA** permitas auto-asignación de rol "Admin" en producción.

---

## 🚨 Recomendaciones de Seguridad

### Para la Aplicación:

1. **Backend con Autenticación Real**
   - Implementar Supabase Auth con Row Level Security (RLS)
   - Verificar rol del usuario en cada operación sensible
   - NO confiar solo en verificaciones del frontend

2. **API Keys Protegidas**
   - YouTube API Key en variables de entorno
   - NUNCA hardcodear credenciales en el código
   - Usar Supabase Edge Functions para llamadas a YouTube API

3. **Logs de Auditoría**
   - Registrar TODAS las subidas de cantos
   - Guardar: quién, cuándo, qué canto, desde dónde
   - Revisar logs regularmente

### Para YouTube:

1. **Monitoreo Regular**
   - Revisar semanalmente: YouTube Studio → Configuración → Permisos
   - Verificar que NO haya usuarios no autorizados

2. **Backup de Contenido**
   - Mantener backup local de todos los cantos subidos
   - Usar Google Takeout periódicamente

3. **Notificaciones de Cambios**
   - Activar notificaciones de YouTube para:
     - Nuevos videos subidos
     - Cambios en configuración del canal
     - Nuevos colaboradores agregados

---

## 🧪 Pruebas de Seguridad

### Cómo Verificar que el Sistema Está Protegido:

#### Test 1: Usuario Coro intenta acceder a Admin

```
1. Inicia sesión como "Coro"
2. Abre el Sidebar
3. ✅ Verifica: NO aparece "Panel Admin"
4. Intenta acceder manualmente (si tuvieras routing)
5. ✅ Verifica: Aparece pantalla "Acceso Denegado"
```

#### Test 2: Usuario Pueblo Fiel intenta acceder a Admin

```
1. Inicia sesión como "Pueblo Fiel"
2. Abre el Sidebar
3. ✅ Verifica: NO aparece "Panel Admin"
4. Intenta acceder manualmente
5. ✅ Verifica: Aparece pantalla "Acceso Denegado"
```

#### Test 3: Usuario Admin accede correctamente

```
1. Inicia sesión como "Admin"
2. Abre el Sidebar
3. ✅ Verifica: Aparece "Panel Admin" con ícono 🛡️
4. Haz clic en "Panel Admin"
5. ✅ Verifica: Se carga AdminDashboard
6. ✅ Verifica: Aparece aviso de seguridad de YouTube
7. Haz clic en "Gestión de Cantos"
8. ✅ Verifica: Se carga SongManager
```

---

## 📊 Resumen Visual

```
┌─────────────────────────────────────────────────────┐
│              NIVELES DE SEGURIDAD                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  NIVEL 1: UI (Sidebar)                               │
│  ├─ Oculta "Panel Admin" para no-admins             │
│  └─ Solo muestra si role === 'Admin'                │
│                                                      │
│  NIVEL 2: Routing (App.tsx)                          │
│  ├─ Verifica rol antes de renderizar                │
│  ├─ Muestra AdminDashboard solo si Admin            │
│  └─ Muestra "Acceso Denegado" si no es Admin        │
│                                                      │
│  NIVEL 3: Componente (AdminDashboard)                │
│  ├─ Muestra aviso de seguridad                       │
│  ├─ SongManager solo accesible desde Admin          │
│  └─ Instrucciones de YouTube Security               │
│                                                      │
│  NIVEL 4: YouTube Studio                             │
│  ├─ Permisos: Solo propietario = Admin              │
│  ├─ 2FA activado en cuenta admin                    │
│  └─ API Keys protegidas en Google Cloud             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

- [x] Control de acceso por roles en `App.tsx`
- [x] Filtrado de menú en `Sidebar.tsx`
- [x] Pantalla de "Acceso Denegado" para no-admins
- [x] Aviso de seguridad en `AdminDashboard`
- [x] Instrucciones de configuración de YouTube
- [x] Documentación de seguridad (este archivo)
- [ ] **PENDIENTE**: Implementar backend con Supabase
- [ ] **PENDIENTE**: Row Level Security (RLS) en base de datos
- [ ] **PENDIENTE**: Edge Functions para YouTube API
- [ ] **PENDIENTE**: Logs de auditoría
- [ ] **PENDIENTE**: Configurar permisos reales de YouTube Studio

---

## 📞 Contacto y Soporte

Si detectas alguna vulnerabilidad de seguridad o tienes preguntas sobre la implementación, contacta al administrador del sistema inmediatamente.

**Última actualización**: 20 de enero de 2026
**Versión**: 1.0.0
**Estado**: Protección Frontend Completa - Pendiente Backend

---

## 🔒 Recordatorio Final

> **IMPORTANTE**: Este sistema de seguridad a nivel frontend es una primera capa de protección. En producción, SIEMPRE debes implementar:
>
> 1. Autenticación y autorización en el backend
> 2. Validación de roles en cada endpoint de API
> 3. Row Level Security (RLS) en la base de datos
> 4. Cifrado de datos sensibles
> 5. Monitoreo y alertas de seguridad
>
> **NUNCA confíes únicamente en verificaciones del frontend para funcionalidades críticas.**
