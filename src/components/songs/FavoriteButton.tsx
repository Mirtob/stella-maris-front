import { Heart } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';
import { useCurrentUserId } from '../../services/currentUser';

/**
 * Corazón para guardar/quitar un canto de "Mis cantos". Se oculta si no hay usuario.
 * El color base lo controla `className` (para adaptarse al fondo); al estar guardado,
 * el corazón se pinta de rosado relleno. Si no se pasa `userId`, lo toma del usuario
 * actual (store), para poder colocarse en cualquier pantalla sin cablear props.
 */
/**
 * Cantos "sintéticos" que no viven en el catálogo `songs` (salmo del libro, Padre Nuestro
 * generado, o una parte re-etiquetada con sufijo `::parte`). No se pueden guardar como
 * favorito porque "Mis cantos" resuelve los ids contra la tabla `songs` → no aparecerían.
 * En esos casos no mostramos el corazón (el canto real sí es favoritable en su ficha).
 */
function isPersistableSongId(id: string): boolean {
  return !!id && !id.includes('::') && !/^(psalm-|padre-nuestro-)/.test(id);
}

export function FavoriteButton({ songId, userId, className = '' }: { songId: string; userId?: string; className?: string }) {
  const ctxUserId = useCurrentUserId();
  const uid = userId ?? ctxUserId;
  const { isFavorite, toggle, ready } = useFavorites(uid);
  if (!uid || !isPersistableSongId(songId)) return null;
  const fav = isFavorite(songId);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggle(songId); }}
      disabled={!ready}
      aria-pressed={fav}
      aria-label={fav ? 'Quitar de Mis cantos' : 'Guardar en Mis cantos'}
      title={fav ? 'Quitar de Mis cantos' : 'Guardar en Mis cantos'}
      className={`inline-flex items-center justify-center rounded-full p-2 active:scale-90 transition-all disabled:opacity-50 ${className}`}
    >
      <Heart className={`w-6 h-6 ${fav ? 'text-rose-500 fill-rose-500' : ''}`} strokeWidth={2.2} />
    </button>
  );
}
