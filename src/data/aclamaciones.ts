/**
 * Aclamaciones breves de la Misa que el coro puede agregar al cantoral junto con el
 * Padre Nuestro: la respuesta a las peticiones de la Oración Universal, la aclamación
 * después de la consagración (anámnesis) y el Amén de la doxología.
 *
 * Son partes del ordinario (ver utils/ordinary): la partitura se busca en la carpeta
 * de la Misa en Drive, igual que el Kyrie o el Santo. Si no hay partitura, el cantoral
 * lleva solo la letra que va aquí.
 */

export type AclamacionId = 'oracion-universal' | 'consagracion' | 'amen';

export interface Aclamacion {
  id: AclamacionId;
  /** Parte de la Misa (rótulo de MASS_CATEGORY_ORDER). */
  category: string;
  /** Título del canto en el cantoral y en el folleto. */
  titulo: string;
  /** Letra de respaldo cuando no hay partitura. */
  letra: string;
  /** Texto corto para la casilla del diálogo. */
  resumen: string;
}

export const ACLAMACIONES: Aclamacion[] = [
  {
    id: 'oracion-universal',
    category: 'Respuesta a Oración Universal',
    titulo: 'Respuesta a la Oración Universal',
    letra: 'V/ Roguemos al Señor.\nR/ Señor, escúchanos.',
    resumen: '«Roguemos al Señor» — R/ «Señor, escúchanos»',
  },
  {
    id: 'consagracion',
    category: 'Aclamación Consagración',
    titulo: 'Aclamación después de la Consagración',
    letra: 'V/ Este es el misterio de la fe.\nR/ Anunciamos tu muerte, proclamamos tu Resurrección: ¡Ven, Señor Jesús!',
    resumen: '«Este es el misterio de la fe» — R/ «Anunciamos tu muerte…»',
  },
  {
    id: 'amen',
    category: 'Amén (Doxología)',
    titulo: 'Triple Amén',
    letra: 'Amén, Amén, Amén.',
    resumen: '«Amén, Amén, Amén» tras la doxología',
  },
];
