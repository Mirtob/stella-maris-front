import { getSupabaseClient } from './supabaseClient';

const BUCKET = 'cantorales-pdf';
const MAX_ATTEMPTS = 3;

/** Errors worth retrying — transient network / 5xx, not RLS / auth / 4xx. */
function isRetryable(error: { message?: string; statusCode?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? '').toLowerCase();
  const code = error.statusCode ?? '';
  if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('timeout')) return true;
  if (code.startsWith('5')) return true;
  // Auth / permission errors do not benefit from retry
  return false;
}

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Sube el PDF del cantoral al bucket público de Supabase Storage.
 * Si ya existe un PDF para ese cantoralId, lo sobreescribe (upsert).
 *
 * Q41 — Reintenta hasta 3 veces ante errores transitorios (red, 5xx) con
 * backoff exponencial (400ms, 800ms). Errores permanentes (RLS, 4xx,
 * payload inválido) NO se reintentan para no engañar al usuario.
 */
export async function uploadCantoralPDF(
  cantoralId: string,
  blob: Blob
): Promise<{ ok: boolean; publicUrl?: string; error?: string }> {
  const sb = getSupabaseClient();
  const path = `${cantoralId}.pdf`;

  let lastError: any = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { error: uploadError } = await sb.storage
        .from(BUCKET)
        .upload(path, blob, {
          contentType: 'application/pdf',
          upsert: true,
          cacheControl: '3600',
        });

      if (!uploadError) {
        const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
        return { ok: true, publicUrl: data.publicUrl };
      }

      lastError = uploadError;
      if (!isRetryable(uploadError as any)) break;
    } catch (err: any) {
      lastError = err;
      if (!isRetryable(err)) break;
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(200 * 2 ** attempt); // 400ms, 800ms
    }
  }

  console.error('Upload de PDF fallido tras retries:', lastError?.message);
  return { ok: false, error: lastError?.message ?? 'Upload fallido' };
}
