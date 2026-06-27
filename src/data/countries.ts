import { Diocese, chileDioceses } from './chileDioceses';
import { argentinaDioceses } from './argentinaDioceses';

/**
 * País de América con sus diócesis. La capa de país es solo un FILTRO de la UI
 * para acotar la lista de diócesis/parroquias: el string canónico de una
 * parroquia sigue siendo "<Parroquia> - <Diócesis>" (sin país), para no romper
 * los perfiles ni los cantorales ya publicados.
 *
 * El campo `region` de cada Diocese agrupa la lista en el selector (vía
 * <optgroup>): en Chile son las regiones civiles; en Argentina serán las
 * PROVINCIAS ECLESIÁSTICAS.
 */
export interface Country {
  id: string;   // ISO 3166-1 alpha-2 (CL, AR, …)
  name: string;
  flag: string; // emoji bandera
  dioceses: Diocese[];
}

/**
 * Países americanos. Por ahora solo Chile tiene datos cargados; Argentina y el
 * resto se irán completando (las diócesis de cada país se importan desde su
 * propio archivo de datos, p. ej. `argentinaDioceses`). Los que ya tienen datos
 * van primero; el resto en orden alfabético.
 */
export const americanCountries: Country[] = [
  { id: 'CL', name: 'Chile',                flag: '🇨🇱', dioceses: chileDioceses },
  { id: 'AR', name: 'Argentina',            flag: '🇦🇷', dioceses: argentinaDioceses },
  { id: 'BO', name: 'Bolivia',              flag: '🇧🇴', dioceses: [] },
  { id: 'BR', name: 'Brasil',               flag: '🇧🇷', dioceses: [] },
  { id: 'CA', name: 'Canadá',               flag: '🇨🇦', dioceses: [] },
  { id: 'CO', name: 'Colombia',             flag: '🇨🇴', dioceses: [] },
  { id: 'CR', name: 'Costa Rica',           flag: '🇨🇷', dioceses: [] },
  { id: 'CU', name: 'Cuba',                 flag: '🇨🇺', dioceses: [] },
  { id: 'EC', name: 'Ecuador',              flag: '🇪🇨', dioceses: [] },
  { id: 'SV', name: 'El Salvador',          flag: '🇸🇻', dioceses: [] },
  { id: 'US', name: 'Estados Unidos',       flag: '🇺🇸', dioceses: [] },
  { id: 'GT', name: 'Guatemala',            flag: '🇬🇹', dioceses: [] },
  { id: 'HT', name: 'Haití',                flag: '🇭🇹', dioceses: [] },
  { id: 'HN', name: 'Honduras',             flag: '🇭🇳', dioceses: [] },
  { id: 'MX', name: 'México',               flag: '🇲🇽', dioceses: [] },
  { id: 'NI', name: 'Nicaragua',            flag: '🇳🇮', dioceses: [] },
  { id: 'PA', name: 'Panamá',               flag: '🇵🇦', dioceses: [] },
  { id: 'PY', name: 'Paraguay',             flag: '🇵🇾', dioceses: [] },
  { id: 'PE', name: 'Perú',                 flag: '🇵🇪', dioceses: [] },
  { id: 'PR', name: 'Puerto Rico',          flag: '🇵🇷', dioceses: [] },
  { id: 'DO', name: 'República Dominicana', flag: '🇩🇴', dioceses: [] },
  { id: 'UY', name: 'Uruguay',              flag: '🇺🇾', dioceses: [] },
  { id: 'VE', name: 'Venezuela',            flag: '🇻🇪', dioceses: [] },
];

/** País por id (CL, AR, …). */
export function getCountry(id: string): Country | undefined {
  return americanCountries.find(c => c.id === id);
}

/** Diócesis de un país (vacío si el país aún no tiene datos cargados). */
export function getDiocesesByCountry(id: string): Diocese[] {
  return getCountry(id)?.dioceses ?? [];
}
