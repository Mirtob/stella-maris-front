// Service worker DEDICADO a notificaciones push (Web Push / PWA).
// NO cachea nada ni tiene handler de `fetch`: por eso NO reintroduce el problema de
// versiones viejas por el que se desactivó el sw.js del app-shell. Solo despierta al
// llegar un push y al tocar la notificación.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Ids de las ventanas que reportaron correr como app INSTALADA (display standalone).
// La API de clientes no distingue una pestaña del navegador de la PWA, así que es la
// propia app la que lo informa al cargar (ver reportDisplayMode en services/push.ts).
// Vive solo en memoria del SW: si el SW estaba dormido llega vacío, y ese caso cae en
// openWindow(), que con la PWA instalada la abre igual. Perderlo nunca empeora nada.
const standaloneClients = new Set();

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type !== 'CLIENT_MODE') return;
  const id = event.source && event.source.id;
  if (!id) return;
  if (data.standalone) standaloneClients.add(id);
  else standaloneClients.delete(id);
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Stella Maris';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    lang: 'es',
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Al tocar la notificación hay que ABRIR LA APP INSTALADA si el usuario la instaló.
// Antes se enfocaba la PRIMERA ventana que apareciera: bastaba una pestaña suelta de
// Chrome para que el aviso llevara a la web en vez de a la PWA, sin llegar nunca a
// openWindow(). Ahora el orden es:
//   1. Una ventana de la app instalada que ya esté abierta → enfocarla.
//   2. Si no hay → openWindow(): con la PWA instalada y la URL dentro del scope del
//      manifest ("/"), Chrome lanza la app; si no está instalada, abre el navegador.
//      Eso da justo lo pedido: la web solo cuando no hay app.
//   3. Si openWindow falla (o no existe) → reutilizar cualquier ventana, para no
//      dejar el toque sin efecto.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

    const installed = all.find((c) => standaloneClients.has(c.id) && 'focus' in c);
    if (installed) {
      try { await installed.navigate(url); } catch (_e) { /* mismo origen ya abierto */ }
      return installed.focus();
    }

    if (self.clients.openWindow) {
      try {
        return await self.clients.openWindow(url);
      } catch (_e) { /* sin permiso para abrir: caemos al reaprovechamiento */ }
    }

    for (const client of all) {
      if ('focus' in client) {
        try { await client.navigate(url); } catch (_e) { /* mismo origen ya abierto */ }
        return client.focus();
      }
    }
  })());
});
