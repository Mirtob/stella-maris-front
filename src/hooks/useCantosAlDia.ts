import { useEffect, useState } from 'react';
import { Song } from '../types';
import { leerCatalogoVigente } from '../services/catalogoVigente';
import { refrescarCantos } from '../utils/refrescarCantos';

/**
 * Los cantos dados, releídos del catálogo al montar.
 *
 * Lo usa el Modo Atril: se abre con la copia que trae el cantoral (o la tarjeta del
 * canto) para mostrar algo al instante, y enseguida la cambia por lo que dice HOY la
 * tabla `songs` — la letra, los acordes y de dónde sale la partitura. Así una corrección
 * de último minuto se ve en el atril del organista y del guitarrista sin volver a
 * publicar nada. Si no se puede leer, se queda con la copia.
 *
 * Se relee cuando cambia QUÉ cantos son (sus ids), no cada vez que el padre arma un
 * arreglo nuevo con los mismos cantos.
 */
export function useCantosAlDia(songs: Song[]): Song[] {
  const [alDia, setAlDia] = useState<Song[]>(songs);
  const clave = songs.map((s) => s.id).join('|');

  useEffect(() => {
    let cancelado = false;
    setAlDia(songs);
    leerCatalogoVigente(songs).then((indice) => {
      if (!cancelado && indice.size > 0) setAlDia(refrescarCantos(songs, indice));
    });
    return () => { cancelado = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  return alDia;
}
