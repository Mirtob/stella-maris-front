import { getSupabaseClient } from './supabaseClient';

const BUCKET = 'cantorales-pdf';

/**
 * Sube el PDF del cantoral al bucket público de Supabase Storage.
 * Si ya existe un PDF para ese cantoralId, lo sobreescribe (upsert).
 *
 * Returns the public URL on success, or null on failure.
 */
export async function uploadCantoralPDF(
  cantoralId: string,
  blob: Blob
): Promise<{ ok: boolean; publicUrl?: string; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const path = `${cantoralId}.pdf`;

    const { error: uploadError } = await sb.storage
      .from(BUCKET)
      .upload(path, blob, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Error subiendo PDF a Supabase Storage:', uploadError);
      return { ok: false, error: uploadError.message };
    }

    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    return { ok: true, publicUrl: data.publicUrl };
  } catch (err: any) {
    console.error('Excepción subiendo PDF:', err);
    return { ok: false, error: err.message };
  }
}
