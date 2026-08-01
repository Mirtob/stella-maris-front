import { getSupabaseClient } from './supabaseClient';

/**
 * Notificaciones push (Web Push / PWA). Suscribe el dispositivo con PushManager y
 * guarda la suscripción vía /api/push-subscribe (service role). El envío lo hacen las
 * funciones serverless: recordatorio de celebraciones (cron) y "nuevo cantoral".
 *
 * iOS: solo funciona con la PWA INSTALADA en pantalla de inicio (iOS 16.4+); en la
 * pestaña de Safari no llega. Android/Chrome funciona en navegador e instalada.
 */

// La clave PÚBLICA VAPID no es secreta; se puede incrustar. Se puede sobreescribir por
// VITE_VAPID_PUBLIC_KEY. La PRIVADA vive solo en el servidor (Vercel).
const DEFAULT_VAPID_PUBLIC = 'BD6iyTq35EL0rH1goWKY4FEjvAjpUpxO-XSY9qFFaKHh9qBOeUeMSiKhFuUO8ZwZHOsUwM5T3F4NmvJSzv1ViSg';
const VAPID_PUBLIC = ((import.meta as any).env?.VITE_VAPID_PUBLIC_KEY as string) || DEFAULT_VAPID_PUBLIC;
const SW_URL = '/push-sw.js';
const LOCAL_FLAG = 'stella_maris_push_on';
const TOPICS = ['celebrations', 'cantorals'];

export function pushSupported(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

/** 'granted' | 'denied' | 'default' | 'unsupported'. */
export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!pushSupported()) return 'unsupported';
  return Notification.permission;
}

/** ¿Está corriendo como PWA instalada? (en iOS es requisito para el push). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches
    || (navigator as any).standalone === true;
}

export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function accessToken(): Promise<string | undefined> {
  try {
    const { data } = await getSupabaseClient().auth.getSession();
    return data.session?.access_token;
  } catch {
    return undefined;
  }
}

async function callSubscribeApi(body: object): Promise<Response> {
  const token = await accessToken();
  return fetch('/api/push-subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function getRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  return (await navigator.serviceWorker.getRegistration(SW_URL)) ?? undefined;
}

/** ¿El dispositivo ya está suscrito a push en este navegador? */
export async function isPushEnabled(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    const reg = await getRegistration();
    if (!reg) return false;
    return !!(await reg.pushManager.getSubscription());
  } catch {
    return false;
  }
}

function subToRow(sub: PushSubscription): { endpoint: string; p256dh: string; auth: string } {
  const json = sub.toJSON();
  return {
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? '',
    auth: json.keys?.auth ?? '',
  };
}

/**
 * Pide permiso, suscribe con PushManager y guarda la suscripción con las parroquias
 * indicadas. Devuelve la razón si no se pudo ('unsupported' | 'denied' | 'default').
 */
export async function enablePush(parishes: string[], role?: string): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, reason: perm };

  const reg = await navigator.serviceWorker.register(SW_URL);
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });
  }

  const res = await callSubscribeApi({
    action: 'subscribe',
    subscription: subToRow(sub),
    parishes,
    topics: TOPICS,
    role,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    return { ok: false, reason: err || 'server' };
  }
  try { localStorage.setItem(LOCAL_FLAG, '1'); } catch { /* modo privado */ }
  // Aviso de bienvenida inmediato: confirma al usuario que la entrega funciona.
  void sendTestPush(sub.endpoint);
  return { ok: true };
}

/**
 * Envía una notificación de PRUEBA a este dispositivo para verificar la entrega.
 * Devuelve cuántas se enviaron (sent>0 = el push service la aceptó).
 */
export async function sendTestPush(endpoint?: string): Promise<{ ok: boolean; sent: number; reason?: string }> {
  if (!pushSupported()) return { ok: false, sent: 0, reason: 'unsupported' };
  let ep = endpoint;
  if (!ep) {
    const reg = await getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (!sub) return { ok: false, sent: 0, reason: 'no-subscription' };
    ep = sub.endpoint;
  }
  try {
    const token = await accessToken();
    const r = await fetch('/api/push-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ endpoint: ep }),
    });
    const data = await r.json().catch(() => ({} as any));
    return { ok: r.ok && (data.sent ?? 0) > 0, sent: data.sent ?? 0 };
  } catch {
    return { ok: false, sent: 0, reason: 'network' };
  }
}

/** Cancela la suscripción en el dispositivo y en el servidor. */
export async function disablePush(): Promise<void> {
  try {
    const reg = await getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      await callSubscribeApi({ action: 'unsubscribe', endpoint: sub.endpoint }).catch(() => {});
      await sub.unsubscribe().catch(() => {});
    }
  } finally {
    try { localStorage.removeItem(LOCAL_FLAG); } catch { /* modo privado */ }
  }
}

/**
 * Si el dispositivo ya estaba suscrito, actualiza sus parroquias en el servidor (p. ej.
 * al iniciar sesión o cambiar de parroquia). No pide permiso ni suscribe de nuevo.
 *
 * Además REPARA la suscripción si el navegador la perdió. Los push services rotan o
 * invalidan endpoints cada cierto tiempo; cuando eso pasa, el servidor borra la fila al
 * recibir 404/410 y el dispositivo dejaba de recibir avisos PARA SIEMPRE, en silencio
 * (esta función salía sin hacer nada al no encontrar suscripción). Como el permiso ya
 * está concedido, volver a suscribir no le pregunta nada al usuario.
 */
export async function syncPushParishes(parishes: string[], role?: string): Promise<void> {
  if (!pushSupported()) return;
  try {
    if (localStorage.getItem(LOCAL_FLAG) !== '1') return;
  } catch {
    return;
  }
  // El permiso se revocó desde los ajustes del navegador: limpiamos la marca para que el
  // banner vuelva a ofrecer la activación en vez de reintentar en vano cada vez.
  if (Notification.permission !== 'granted') {
    try { localStorage.removeItem(LOCAL_FLAG); } catch { /* modo privado */ }
    return;
  }
  try {
    let reg = await getRegistration();
    if (!reg) {
      reg = await navigator.serviceWorker.register(SW_URL);
      await navigator.serviceWorker.ready;
    }
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
    }
    await callSubscribeApi({ action: 'subscribe', subscription: subToRow(sub), parishes, topics: TOPICS, role });
  } catch {
    /* silencioso: es una sincronización de fondo */
  }
}
