import { Heart } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';

/**
 * Corazón para guardar/quitar un canto de "Mis cantos". Se oculta si no hay usuario.
 * El color base lo controla `className` (para adaptarse al fondo); al estar guardado,
 * el corazón se pinta de rosado relleno.
 */
export function FavoriteButton({ songId, userId, className = '' }: { songId: string; userId?: string; className?: string }) {
  const { isFavorite, toggle, ready } = useFavorites(userId);
  if (!userId) return null;
  const fav = isFavorite(songId);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggle(songId); }}
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
