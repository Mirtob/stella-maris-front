/**
 * Subida del informe a Google Drive ("Mi unidad" del admin que lo guarda).
 *
 * ── Por qué este flujo y no el que se eliminó ──────────────────────────────
 * En la mitigación S4 se quitaron los provider_token de Google: eran tokens de
 * la cuenta del canal, guardados en sessionStorage, con permiso sobre TODO el
 * Drive y YouTube. Un XSS podía robarlos y controlar la cuenta durante una hora.
 *
 * Este flujo es distinto en las tres cosas que importaban:
 *   1. Scope `drive.file` — la app solo ve y toca los archivos que ELLA crea.
 *      No puede leer, modificar ni borrar nada más del Drive de la persona.
 *   2. El token vive SOLO en memoria (`token`), nunca en localStorage ni en
 *      sessionStorage: al recargar la página desaparece.
 *   3. Es la cuenta de QUIEN aprieta el botón, no la cuenta del canal, y solo
 *      tras un consentimiento explícito suyo.
 *
 * No agregar aquí scopes más amplios (`drive`, `drive.readonly`, YouTube…): eso
 * reabre exactamente el agujero que se cerró.
 *
 * ── Requisitos de configuración (Google Cloud Console) ─────────────────────
 *   - El origen del sitio debe estar en "Orígenes autorizados de JavaScript"
 *     del Client ID `VITE_GOOGLE_CLIENT_ID`.
 *   - La pantalla de consentimiento debe estar publicada (o el admin debe ser
 *     usuario de prueba). `drive.file` NO es un scope sensible: no requiere
 *     verificación de Google.
 * La CSP del sitio ya permite accounts.google.com y googleapis.com.
 */

import { GOOGLE_OAUTH_CONFIG } from '../config/api';

/** Único scope permitido: acceso a los archivos creados por esta app. */
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GIS_SRC = 'https://accounts.google.com/gsi/client';

export interface DriveSaveResult {
  ok: boolean;
  /** Enlace para abrir el archivo en Drive. */
  link?: string;
  fileId?: string;
  /** true si se reemplazó el contenido del archivo anterior (mismo enlace). */
  updated?: boolean;
  error?: string;
}

// ── Estado en memoria ───────────────────────────────────────────────────────

// A propósito NO se persiste: si el usuario recarga, se vuelve a pedir. Un token
// que sobrevive a la recarga es un token que un XSS puede llegar a leer.
let token: { value: string; expiresAt: number } | null = null;
let gisPromise: Promise<void> | null = null;

/** ¿Está configurado el Client ID? Si no, el botón no debe ofrecerse. */
export function isDriveSaveConfigured(): boolean {
  const id = GOOGLE_OAUTH_CONFIG.clientId;
  return !!id && !String(id).includes('xxxxx');
}

/** Olvida el token (al cerrar sesión o si Drive lo rechaza). */
export function forgetDriveToken(): void {
  token = null;
}

/** Carga el script de Google Identity Services una sola vez. */
function loadGis(): Promise<void> {
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) { resolve(); return; }
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => { gisPromise = null; reject(new Error('No se pudo cargar Google Identity Services')); };
    document.head.appendChild(script);
  });
  return gisPromise;
}

/**
 * Token de acceso para `drive.file`. Reutiliza el vigente; si no hay, abre el
 * consentimiento de Google. `forceConsent` fuerza la pantalla de permisos
 * (se usa cuando Drive responde 401/403 con un token que creíamos válido).
 */
async function getAccessToken(forceConsent = false): Promise<string> {
  if (!forceConsent && token && token.expiresAt > Date.now() + 30_000) return token.value;
  await loadGis();

  return new Promise<string>((resolve, reject) => {
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      scope: SCOPE,
      callback: (response: any) => {
        if (response?.error || !response?.access_token) {
          reject(new Error(response?.error_description || response?.error || 'Permiso denegado'));
          return;
        }
        const ttl = Number(response.expires_in || 3600) * 1000;
        token = { value: response.access_token, expiresAt: Date.now() + ttl };
        resolve(token.value);
      },
      error_callback: (err: any) => {
        // El usuario cerró la ventana o el origen no está autorizado.
        reject(new Error(err?.type === 'popup_closed'
          ? 'Se cerró la ventana de Google sin autorizar'
          : (err?.message || 'No se pudo obtener el permiso de Google')));
      },
    });
    client.requestAccessToken({ prompt: forceConsent ? 'consent' : '' });
  });
}

// ── Piezas puras (probadas en tests/unit) ───────────────────────────────────

/**
 * Consulta `q` para buscar el archivo por nombre. Las comillas simples se
 * escapan porque delimitan el literal: un nombre con apóstrofo rompería la
 * consulta (o permitiría colarle sintaxis).
 */
export function driveNameQuery(name: string): string {
  return `name = '${name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}' and trashed = false`;
}

/**
 * Cuerpo multipart (metadata JSON + contenido) y el `Content-Type` que le
 * corresponde. Devuelve ambos juntos —y genera el boundary aquí dentro— porque
 * tienen que coincidir exactamente: si el header declara un boundary y el cuerpo
 * usa otro, Drive responde 400 y el error no dice por qué. El boundary se genera
 * en minúsculas a propósito: `Blob` normaliza su `type` a minúsculas, así que
 * uno con mayúsculas dejaría `blob.type` desalineado del cuerpo.
 */
export function buildMultipartBody(
  metadata: object,
  file: Blob,
  boundary = `stella${Math.random().toString(36).slice(2)}`,
): { body: Blob; contentType: string } {
  const mark = boundary.toLowerCase();
  const contentType = `multipart/related; boundary=${mark}`;
  const body = new Blob([
    `--${mark}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${mark}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
    file,
    `\r\n--${mark}--\r\n`,
  ], { type: contentType });
  return { body, contentType };
}

// ── Llamadas a Drive ────────────────────────────────────────────────────────

/**
 * Busca un archivo con ese nombre entre los que creó esta app. Con el scope
 * `drive.file` la búsqueda NO ve el resto del Drive, así que no hay riesgo de
 * pisar un archivo ajeno que se llame igual.
 */
async function findAppFile(name: string, accessToken: string): Promise<string | null> {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', driveNameQuery(name));
  url.searchParams.set('fields', 'files(id,name)');
  url.searchParams.set('spaces', 'drive');
  url.searchParams.set('pageSize', '10');

  const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  if (r.status === 401 || r.status === 403) throw Object.assign(new Error('unauthorized'), { status: r.status });
  if (!r.ok) return null;
  const data = await r.json();
  return data.files?.[0]?.id ?? null;
}

async function createFile(name: string, file: Blob, accessToken: string) {
  // Sin `parents`: el archivo queda en la raíz de "Mi unidad" del usuario.
  const { body, contentType } = buildMultipartBody({ name, mimeType: file.type }, file);
  return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': contentType },
    body,
  });
}

/**
 * Reemplaza el CONTENIDO del archivo existente. Conserva el id, el enlace y los
 * permisos: por eso quien ya tenía acceso lo sigue teniendo y el enlace que se
 * repartió a los demás admins nunca queda obsoleto.
 */
async function updateFile(fileId: string, file: Blob, accessToken: string) {
  return fetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media&fields=id,webViewLink`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': file.type },
    body: file,
  });
}

/**
 * Guarda el informe en "Mi unidad" del admin: crea el archivo la primera vez y
 * de ahí en adelante actualiza ese mismo, para que el enlace compartido con los
 * otros admins siga sirviendo y siempre muestre la última versión.
 */
export async function saveToDrive(file: Blob, name: string): Promise<DriveSaveResult> {
  if (!isDriveSaveConfigured()) {
    return { ok: false, error: 'Falta configurar VITE_GOOGLE_CLIENT_ID' };
  }

  const attempt = async (forceConsent: boolean): Promise<DriveSaveResult> => {
    const accessToken = await getAccessToken(forceConsent);
    const existing = await findAppFile(name, accessToken);
    const response = existing
      ? await updateFile(existing, file, accessToken)
      : await createFile(name, file, accessToken);

    if (response.status === 401 || response.status === 403) {
      throw Object.assign(new Error('unauthorized'), { status: response.status });
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return { ok: false, error: `Drive respondió ${response.status}. ${detail.slice(0, 140)}` };
    }
    const data = await response.json();
    return {
      ok: true,
      fileId: data.id,
      link: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
      updated: !!existing,
    };
  };

  try {
    return await attempt(false);
  } catch (err: any) {
    // Token vencido o permiso revocado: se pide de nuevo, una sola vez.
    if (err?.status === 401 || err?.status === 403) {
      forgetDriveToken();
      try {
        return await attempt(true);
      } catch (retry: any) {
        return { ok: false, error: retry?.message || 'Google rechazó el permiso' };
      }
    }
    return { ok: false, error: err?.message || 'No se pudo guardar en Drive' };
  }
}
