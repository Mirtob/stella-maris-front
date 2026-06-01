/**
 * 🧪 Script de Testing para Validar Integraciones
 * 
 * Ejecutar en DevTools Console (F12) mientras está corriendo la app
 */

// ============================================
// 🔐 TEST 1: Verificar Variables de Entorno
// ============================================
console.log('=== TEST 1: Variables de Entorno ===');
(async () => {
  const checks = {
    'GOOGLE_CLIENT_ID': import.meta.env?.VITE_GOOGLE_CLIENT_ID ? '✅' : '❌',
    'YOUTUBE_API_KEY': import.meta.env?.VITE_YOUTUBE_API_KEY ? '✅' : '❌',
    'YOUTUBE_CHANNEL_ID': import.meta.env?.VITE_YOUTUBE_CHANNEL_ID ? '✅' : '❌',
    'GOOGLE_DRIVE_API_KEY': import.meta.env?.VITE_GOOGLE_DRIVE_API_KEY ? '✅' : '❌',
    'GOOGLE_DRIVE_SHEET_MUSIC_FOLDER': import.meta.env?.VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER ? '✅' : '❌',
  };
  
  for (const [key, status] of Object.entries(checks)) {
    console.log(`${status} ${key}`);
  }
})();

// ============================================
// 🔐 TEST 2: Verificar Storage después de Login
// ============================================
console.log('\n=== TEST 2: Storage después de Login ===');
(() => {
  const session = sessionStorage.getItem('stella_maris_google_session');
  const profile = sessionStorage.getItem('stella_maris_user_profile');
  
  console.log('Session Storage:');
  console.log('- stella_maris_google_session:', session ? '✅ (presente)' : '❌ (ausente)');
  console.log('- stella_maris_user_profile:', profile ? '✅ (presente)' : '❌ (ausente)');
  
  if (session) {
    const sessionData = JSON.parse(session);
    console.log('\nDatos de sesión:');
    console.log('- accessToken:', sessionData.accessToken?.substring(0, 20) + '...' ? '✅' : '❌');
    console.log('- idToken:', sessionData.idToken ? '✅' : '❌');
    console.log('- expiresAt:', new Date(sessionData.expiresAt).toLocaleString());
    const expired = sessionData.expiresAt < Date.now();
    console.log('- Expirado:', expired ? '⚠️ SÍ' : '✅ No');
  }
  
  if (profile) {
    const profileData = JSON.parse(profile);
    console.log('\nDatos de perfil:');
    console.log('- name:', profileData.name);
    console.log('- email:', profileData.email);
    console.log('- role:', profileData.role);
  }
})();

// ============================================
// 🎬 TEST 3: Validar YouTube Data API
// ============================================
console.log('\n=== TEST 3: YouTube Data API ===');
(async () => {
  try {
    const apiKey = import.meta.env?.VITE_YOUTUBE_API_KEY;
    if (!apiKey) {
      console.log('❌ VITE_YOUTUBE_API_KEY no configurado');
      return;
    }
    
    // Buscar un video popular
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=música católica&type=video&maxResults=1&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Error en YouTube API:', data.error.message);
    } else if (data.items && data.items.length > 0) {
      console.log('✅ YouTube API funcionando');
      console.log('- Primer resultado:', data.items[0].snippet.title);
    } else {
      console.log('⚠️ YouTube API responde pero sin resultados');
    }
  } catch (error) {
    console.log('❌ Error conectando a YouTube:', error.message);
  }
})();

// ============================================
// 📁 TEST 4: Validar Google Drive API
// ============================================
console.log('\n=== TEST 4: Google Drive API ===');
(async () => {
  try {
    const session = sessionStorage.getItem('stella_maris_google_session');
    if (!session) {
      console.log('⚠️ No hay sesión activa. Inicia sesión primero para probar Drive.');
      return;
    }
    
    const sessionData = JSON.parse(session);
    const accessToken = sessionData.accessToken;
    
    const url = 'https://www.googleapis.com/drive/v3/about?fields=user';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.status === 401) {
      console.log('❌ Token de Drive expirado o inválido');
    } else if (response.ok) {
      console.log('✅ Google Drive API funcionando');
      const data = await response.json();
      console.log('- Usuario:', data.user.displayName);
    } else {
      console.log('⚠️ Error Drive API:', response.status);
    }
  } catch (error) {
    console.log('❌ Error conectando a Drive:', error.message);
  }
})();

// ============================================
// 🔒 TEST 5: Validar OAuth Security
// ============================================
console.log('\n=== TEST 5: OAuth Security Checks ===');
(() => {
  const session = sessionStorage.getItem('stella_maris_google_session');
  
  if (!session) {
    console.log('⚠️ No hay sesión para validar. Inicia sesión primero.');
    return;
  }
  
  const sessionData = JSON.parse(session);
  
  // Validar estructura
  console.log('Token structure:');
  console.log('- accessToken existe:', sessionData.accessToken ? '✅' : '❌');
  console.log('- idToken existe:', sessionData.idToken ? '✅' : '❌');
  console.log('- expiresAt existe:', sessionData.expiresAt ? '✅' : '❌');
  console.log('- user.id existe:', sessionData.user?.id ? '✅' : '❌');
  console.log('- user.email existe:', sessionData.user?.email ? '✅' : '❌');
  
  // Validar que está en sessionStorage, no localStorage
  const inSessionStorage = !!sessionStorage.getItem('stella_maris_google_session');
  const inLocalStorage = !!localStorage.getItem('stella_maris_google_session');
  
  console.log('\nStorage security:');
  console.log('- En sessionStorage:', inSessionStorage ? '✅' : '❌');
  console.log('- En localStorage:', inLocalStorage ? '❌ (RIESGO)' : '✅ (bien)');
})();

// ============================================
// 📊 TEST 6: Cache de Videos YouTube
// ============================================
console.log('\n=== TEST 6: YouTube Video Cache ===');
(() => {
  const youtubeCache = Object.keys(localStorage)
    .filter(key => key.startsWith('youtube_video_'))
    .length;
  
  console.log(`Videos en cache: ${youtubeCache}`);
  
  if (youtubeCache > 0) {
    const firstCacheKey = Object.keys(localStorage)
      .filter(key => key.startsWith('youtube_video_'))[0];
    const cached = JSON.parse(localStorage.getItem(firstCacheKey));
    console.log('Ejemplo de cache:');
    console.log('- Título:', cached.data.title);
    console.log('- Duración:', cached.data.durationFormatted);
    console.log('- Cache guardado hace:', Math.floor((Date.now() - cached.timestamp) / 1000), 'segundos');
  }
})();

// ============================================
// 🔍 TEST 7: Validar App State
// ============================================
console.log('\n=== TEST 7: App State ===');
(() => {
  const hasSession = !!sessionStorage.getItem('stella_maris_google_session');
  const hasProfile = !!sessionStorage.getItem('stella_maris_user_profile');
  
  console.log('App ready:');
  console.log('- Sesión activa:', hasSession ? '✅' : '❌');
  console.log('- Perfil cargado:', hasProfile ? '✅' : '❌');
  console.log('- Storage consistente:', (hasSession === hasProfile) ? '✅' : '⚠️');
})();

console.log('\n=== Testing Completado ===');
console.log('Revisa la consola para ver todos los resultados.');
