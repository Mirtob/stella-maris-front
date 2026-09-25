/**
 * Vuelve a armar el folleto (cuadernillo) de un cantoral YA publicado y lo sube a
 * Storage, para que «Descargar folleto» entregue la versión corregida. (El enlace del
 * QR, /c/{id}, arma el folleto en el momento y ya relee las letras solo.)
 *
 * Al publicar o editar esto ya lo hace App (generateAndUploadCantoralPDF). Esto es para
 * «Actualizar partituras» en el visor del folleto: el coro corrige una letra o sube la
 * partitura de una Misa DESPUÉS de publicar, y sin republicar el PDF guardado seguía
 * siendo el del día de la publicación.
 *
 * Al terminar avisa con `EVENTO_FOLLETO` para que App ponga la URL nueva en memoria
 * (lista, QR). Nunca lanza: devuelve si pudo.
 */
import { PublishedCantoral } from '../types';
import { generateCantoralPDF } from './cantoralPDFGenerator';
import { uploadCantoralPDF } from '../services/cantoralPDF';
import { updateCantoralPdfUrl } from '../services/cantorals';

export const EVENTO_FOLLETO = 'stella:folleto-guardado';
export interface FolletoGuardado { id: string; url: string }

export async function guardarFolletoAlDia(
  cantoral: PublishedCantoral,
  refrescar = false,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const { blob } = await generateCantoralPDF({ cantoral, download: false, booklet: true, refrescar });
    const up = await uploadCantoralPDF(cantoral.id, blob);
    if (!up.ok || !up.publicUrl) return { ok: false, error: up.error };
    const db = await updateCantoralPdfUrl(cantoral.id, up.publicUrl);
    if (!db.ok) return { ok: false, error: db.error };
    try {
      window.dispatchEvent(new CustomEvent<FolletoGuardado>(EVENTO_FOLLETO, { detail: { id: cantoral.id, url: up.publicUrl } }));
    } catch { /* sin window */ }
    return { ok: true, url: up.publicUrl };
  } catch (e: unknown) {
    return { ok: false, error: (e as Error)?.message };
  }
}
