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
export async function enablePush(parishes: string[]): Promise<{ ok: boolean; reason?: string }> {
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
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    return { ok: false, reason: err || 'server' };
  }
  try { localStorage.setItem(LOCAL_FLAG, '1'); } catch { /* modo privado */ }
  return { ok: true };
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
 */
export async function syncPushParishes(parishes: string[]): Promise<void> {
  if (!pushSupported()) return;
  try {
    if (localStorage.getItem(LOCAL_FLAG) !== '1') return;
  } catch {
    return;
  }
  try {
    const reg = await getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (!sub) return;
    await callSubscribeApi({ action: 'subscribe', subscription: subToRow(sub), parishes, topics: TOPICS });
  } catch {
    /* silencioso: es una sincronización de fondo */
  }
}
