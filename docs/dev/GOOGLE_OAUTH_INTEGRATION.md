# Integración de Google OAuth para Autenticación

## 📋 Descripción General

Este documento detalla la implementación de Google OAuth 2.0 para la autenticación de usuarios en la aplicación de cantorales católicos.

## 🎯 Objetivos

1. Permitir login seguro con cuentas de Google
2. Obtener información del perfil del usuario (nombre, email, foto)
3. Mantener sesión persistente del usuario
4. Conectar con YouTube API usando las mismas credenciales

## 🔧 Configuración en Google Cloud Console

### 1. Crear Proyecto en Google Cloud

```bash
1. Ir a https://console.cloud.google.com/
2. Crear nuevo proyecto: "Cantorales Católicos"
3. Habilitar APIs necesarias:
   - Google+ API (para perfil de usuario)
   - YouTube Data API v3
```

### 2. Configurar OAuth 2.0

```javascript
// En Google Cloud Console:
// Credenciales > Crear credenciales > ID de cliente de OAuth 2.0

const OAUTH_CONFIG = {
  clientId: "TU_CLIENT_ID.apps.googleusercontent.com",
  redirectUri: window.location.origin + "/auth/callback",
  scope: [
    "profile",
    "email",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl"
  ].join(" ")
};
```

### 3. Orígenes Autorizados

```
Desarrollo:
- http://localhost:3000
- http://localhost:5173

Producción:
- https://tu-dominio.com
- https://www.tu-dominio.com
```

## 📦 Instalación de Dependencias

```bash
npm install @react-oauth/google
npm install jwt-decode
```

## 💻 Implementación en el Frontend

### 1. Configurar Provider de Google OAuth

```typescript
// En App.tsx o main.tsx
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="TU_CLIENT_ID">
      <YourApp />
    </GoogleOAuthProvider>
  );
}
```

### 2. Componente de Login

El componente actual `/components/Login.tsx` ya tiene la estructura. Necesita actualización:

```typescript
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface GoogleUser {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const decoded: GoogleUser = jwtDecode(credentialResponse.credential!);
      
      // Enviar token al backend para verificar y crear sesión
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
          clientId: credentialResponse.clientId,
        }),
      });

      const data = await response.json();
      
      if (data.isNewUser) {
        // Redirigir a setup de perfil
        onLoginSuccess({ ...decoded, needsProfileSetup: true });
      } else {
        // Usuario existente, cargar perfil
        onLoginSuccess({ ...decoded, profile: data.profile });
      }
    } catch (error) {
      console.error('Error en login:', error);
      alert('Error al iniciar sesión. Intenta nuevamente.');
    }
  };

  const handleGoogleError = () => {
    console.error('Login Failed');
    alert('Error al conectar con Google');
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-bold mb-6">Cantorales Católicos</h1>
        
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap
          theme="filled_blue"
          size="large"
          text="signin_with"
          shape="rectangular"
          logo_alignment="left"
        />
      </div>
    </div>
  );
}
```

### 3. Almacenamiento de Sesión

```typescript
// utils/auth.ts

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}

export const authStorage = {
  // Guardar tokens
  setTokens(tokens: AuthToken) {
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  },

  // Obtener tokens
  getTokens(): AuthToken | null {
    const stored = localStorage.getItem('auth_tokens');
    if (!stored) return null;
    
    const tokens = JSON.parse(stored);
    
    // Verificar si el token expiró
    if (Date.now() >= tokens.expiresAt) {
      this.clearTokens();
      return null;
    }
    
    return tokens;
  },

  // Limpiar tokens
  clearTokens() {
    localStorage.removeItem('auth_tokens');
  },

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return this.getTokens() !== null;
  }
};
```

### 4. Interceptor para Renovar Tokens

```typescript
// utils/apiClient.ts

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  let tokens = authStorage.getTokens();
  
  // Renovar token si está próximo a expirar (menos de 5 minutos)
  if (tokens && tokens.expiresAt - Date.now() < 5 * 60 * 1000) {
    tokens = await refreshAccessToken(tokens.refreshToken);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${tokens?.accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    // Token inválido, cerrar sesión
    authStorage.clearTokens();
    window.location.href = '/login';
  }

  return response;
}

async function refreshAccessToken(refreshToken: string): Promise<AuthToken> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const newTokens = await response.json();
  authStorage.setTokens(newTokens);
  return newTokens;
}
```

## 🔐 Backend API Endpoints

### 1. POST /api/auth/google

Verificar credential de Google y crear/actualizar usuario.

```typescript
// Request
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "clientId": "TU_CLIENT_ID"
}

// Response (nuevo usuario)
{
  "isNewUser": true,
  "userId": "user_abc123",
  "email": "usuario@example.com",
  "name": "Usuario Demo",
  "picture": "https://lh3.googleusercontent.com/..."
}

// Response (usuario existente)
{
  "isNewUser": false,
  "userId": "user_abc123",
  "profile": {
    "role": "Coro",
    "instrument": "Guitarra",
    "parishName": "Parroquia San Juan"
  },
  "accessToken": "...",
  "refreshToken": "...",
  "expiresAt": 1234567890
}
```

### 2. POST /api/auth/refresh

Renovar access token usando refresh token.

```typescript
// Request
{
  "refreshToken": "..."
}

// Response
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresAt": 1234567890
}
```

### 3. POST /api/auth/logout

Invalidar sesión del usuario.

```typescript
// Request
{
  "userId": "user_abc123"
}

// Response
{
  "success": true
}
```

## 🔒 Seguridad

### 1. Validación de Tokens

```typescript
// Backend: Verificar token de Google
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    return {
      userId: payload['sub'],
      email: payload['email'],
      name: payload['name'],
      picture: payload['picture'],
      emailVerified: payload['email_verified'],
    };
  } catch (error) {
    throw new Error('Token inválido');
  }
}
```

### 2. CSRF Protection

```typescript
// Generar state token para prevenir CSRF
function generateStateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Guardar en sesión
sessionStorage.setItem('oauth_state', generateStateToken());

// Verificar en callback
const savedState = sessionStorage.getItem('oauth_state');
if (savedState !== receivedState) {
  throw new Error('State token inválido');
}
```

### 3. Variables de Entorno

```bash
# .env
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
OAUTH_REDIRECT_URI=https://tu-dominio.com/auth/callback
JWT_SECRET=tu_secret_key_para_jwt
```

## 📱 Flujo de Autenticación Completo

```
1. Usuario → Click "Login con Google"
2. App → Redirige a Google OAuth
3. Google → Usuario autoriza permisos
4. Google → Redirige a /auth/callback con credential
5. App → Envía credential al backend
6. Backend → Verifica credential con Google
7. Backend → Crea/actualiza usuario en DB
8. Backend → Genera JWT tokens
9. Backend → Retorna tokens + perfil
10. App → Guarda tokens en localStorage
11. App → Redirige a perfil o setup según isNewUser
```

## 🧪 Testing

### Login Manual de Prueba

```typescript
// Para desarrollo/testing sin Google OAuth real
const mockGoogleLogin = () => {
  const mockUser = {
    sub: 'test_user_123',
    email: 'test@example.com',
    name: 'Usuario de Prueba',
    picture: 'https://via.placeholder.com/150',
    email_verified: true,
  };
  
  onLoginSuccess({ ...mockUser, needsProfileSetup: true });
};
```

## 📚 Referencias

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

## 🚀 Próximos Pasos

1. ✅ Implementar componente de Login con Google OAuth
2. ✅ Crear endpoints de backend para autenticación
3. ✅ Implementar refresh token mechanism
4. ✅ Conectar con YouTube API usando mismos tokens
5. ✅ Implementar logout y manejo de sesiones
6. ✅ Agregar analytics de login (opcional)

---

**Nota:** Esta es la base para la integración. El backend debe implementarse en Supabase siguiendo el documento `/docs/BACKEND_SETUP.md`.
