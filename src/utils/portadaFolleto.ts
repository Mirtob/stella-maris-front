/**
 * La portada del folleto: qué dice y cómo se reparte en la hoja (pedido del 6-nov-2026).
 *
 *     Cantoral para la Misa de
 *     I Vísperas de la Solemnidad de Jesucristo, Rey del Universo
 *     sábado, 21 de noviembre de 2026 · 08:00 PM
 *     Parroquia · Diócesis
 *
 * Reglas puras: el calendario lo pone `rangoDeCelebracion`, la medida del texto la pone
 * quien dibuja y el dibujo está en utils/cantoralPDFGenerator.
 */
import type { MassType } from '../types';
import { MASS_TYPE_LABEL } from './massType';
import { parseParishChapel, splitActiveParish } from './parish';

/** El rango según el calendario. `null` = no figura en él (una agregada a mano). */
export type RangoCelebracion = 'solemnity' | 'feast' | 'sunday' | 'weekday' | null;

const primeraPalabra = (s: string) => (s.split(/\s+/)[0] ?? '').replace(/[,.:;]+$/, '').toLowerCase();

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Sin artículo: nombres propios. Van antes que las terminaciones: «María» acaba en -ía. */
const SIN_ARTICULO = new Set([
  'san', 'santa', 'santo', 'santiago', 'todos', 'jesucristo', 'cristo', 'jesús', 'maría',
  'nuestra', 'nuestro', 'pentecostés', 'misiones',
]);
const MASCULINOS = new Set([
  ...DIAS, 'bautismo', 'sagrado', 'inmaculado', 'corpus', 'santísimo', 'cuerpo', 'corazón',
  'encuentro', 'aniversario', 'día', 'triduo', 'retiro', 'congreso', 'jubileo', 'mes',
]);
const FEMENINOS = new Set([
  'santísima', 'sagrada', 'inmaculada', 'cátedra', 'vigilia', 'jornada', 'semana', 'octava',
  'fiesta', 'solemnidad', 'memoria', 'virgen',
]);

/** «de la Epifanía», «del 33.º Domingo», «de los Santos Inocentes», «de San José». */
export function conPreposicion(nombre: string): string {
  const n = nombre.trim();
  const articulo = n.match(/^(la|las|el|los)\s+(.+)$/i);
  if (articulo) {
    const a = articulo[1].toLowerCase();
    return `${a === 'el' ? 'del' : `de ${a}`} ${articulo[2]}`;
  }
  const p = primeraPalabra(n);
  if (p === 'santos') return `de los ${n}`;
  if (SIN_ARTICULO.has(p)) return `de ${n}`;
  if (/^\d/.test(p) || MASCULINOS.has(p)) return `del ${n}`;
  if (FEMENINOS.has(p) || /(ción|sión|dad|tad|ía)$/.test(p)) return `de la ${n}`;
  return `de ${n}`;
}

/**
 * La celebración con su rango: el calendario dice «Jesucristo, Rey del Universo» y la
 * portada, «Solemnidad de Jesucristo, Rey del Universo». No se le agrega a lo que ya se
 * nombra por sí mismo (el Domingo de Resurrección es solemnidad, pero no se dice así) ni
 * a lo que el calendario no conoce: una agregada a mano se imprime como la escribieron.
 */
function conRango(nombre: string, rango: RangoCelebracion): string {
  const p = primeraPalabra(nombre);
  const seNombraSola = DIAS.includes(p) || ['solemnidad', 'fiesta', 'memoria', 'conmemoración'].includes(p);
  if (seNombraSola) return nombre;
  if (rango === 'solemnity') return `Solemnidad ${conPreposicion(nombre)}`;
  if (rango === 'feast') return `Fiesta ${conPreposicion(nombre)}`;
  return nombre;
}

/** «I Vísperas de la Solemnidad de …», «Misa del día del 33.º Domingo del Tiempo Ordinario». */
export function tituloDePortada(celebracion: string, tipo: MassType, rango: RangoCelebracion): string {
  const nombre = celebracion.trim();
  if (!nombre) return MASS_TYPE_LABEL[tipo];
  // «Santa Misa de Acción de Gracias…» ya es una Misa: «Misa del día de Santa Misa…» no.
  if (/^(santa\s+)?misa\s/i.test(nombre)) return nombre;
  return `${MASS_TYPE_LABEL[tipo]} ${conPreposicion(conRango(nombre, rango))}`;
}

/**
 * Las líneas del lugar. `parishName` viene como "Parroquia - Diócesis", con
 * " · Capilla" al final si la Misa es en una capilla.
 */
export function lugarDePortada(parishName?: string | null): { parroquia: string[]; diocesis: string } {
  const { parishFull, chapel } = splitActiveParish(parishName);
  const { parish, chapel: diocesis } = parseParishChapel(parishFull);
  const capilla = chapel ? (/^capilla\b/i.test(chapel) ? chapel : `Capilla ${chapel}`) : '';
  return { parroquia: [capilla, parish].filter(Boolean), diocesis: diocesis ?? '' };
}

// ─── Reparto en la hoja ──────────────────────────────────────────────────────

type Color = [number, number, number];

export interface LineaDePortada {
  texto: string;
  /** Tamaño base en puntos; el reparto lo agranda o lo achica parejo con las demás. */
  puntos: number;
  negrita?: boolean;
  color: Color;
  /** Reparte los renglones parejos, sin dejar una palabra sola en el último. */
  parejo?: boolean;
}

export interface LineaColocada {
  texto: string;
  puntos: number;
  negrita: boolean;
  color: Color;
  /** Línea base, en mm desde el borde superior del área. */
  y: number;
}

export type MedirTexto = (texto: string, puntos: number, negrita: boolean) => number;

const MM_POR_PUNTO = 0.3528;
const INTERLINEA = 1.22;
/** Lo que el texto ocupa del alto; el resto es el aire entre los bloques. */
const LLENADO = 0.74;
const ESCALA_MAX = 1.8;
const ESCALA_MIN = 0.45;

const altoDeLinea = (puntos: number) => puntos * MM_POR_PUNTO * INTERLINEA;

function partir(texto: string, ancho: number, medir: (t: string) => number): string[] {
  const renglones: string[] = [];
  let actual = '';
  for (const palabra of texto.split(/\s+/).filter(Boolean)) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (actual && medir(prueba) > ancho) {
      renglones.push(actual);
      actual = palabra;
    } else actual = prueba;
  }
  if (actual) renglones.push(actual);
  return renglones;
}

/** El ancho más angosto que no agrega renglones: deja los renglones de largo parecido. */
function partirParejo(texto: string, ancho: number, medir: (t: string) => number): string[] {
  const cuantos = partir(texto, ancho, medir).length;
  let bajo = 0;
  let alto = ancho;
  for (let i = 0; i < 14; i++) {
    const medio = (bajo + alto) / 2;
    if (partir(texto, medio, medir).length <= cuantos) alto = medio;
    else bajo = medio;
  }
  return partir(texto, alto, medir);
}

/**
 * Reparte los bloques en todo el alto: agranda la letra de todos por igual hasta llenar
 * `LLENADO` del área —un título corto sale grande y uno largo se achica— y el resto queda
 * como aire parejo arriba, abajo y entre los bloques.
 */
export function repartirPortada(
  bloques: LineaDePortada[][],
  medir: MedirTexto,
  ancho: number,
  alto: number,
): LineaColocada[] {
  const llenos = bloques
    .map((b) => b.filter((l) => l.texto.trim() !== ''))
    .filter((b) => b.length > 0);

  const armar = (escala: number) => {
    let cabe = true;
    const armados = llenos.map((bloque) => bloque.flatMap((l) => {
      const puntos = l.puntos * escala;
      const negrita = !!l.negrita;
      const mide = (t: string) => medir(t, puntos, negrita);
      const renglones = (l.parejo ? partirParejo : partir)(l.texto, ancho, mide);
      if (renglones.some((r) => mide(r) > ancho)) cabe = false;
      return renglones.map((texto) => ({ texto, puntos, negrita, color: l.color }));
    }));
    const total = armados.flat().reduce((s, l) => s + altoDeLinea(l.puntos), 0);
    return { armados, total, cabe };
  };

  let escala = ESCALA_MAX;
  let r = armar(escala);
  while (escala > ESCALA_MIN && (!r.cabe || r.total > alto * LLENADO)) {
    escala -= 0.02;
    r = armar(escala);
  }

  const aire = Math.max(0, alto - r.total) / (r.armados.length + 1);
  const colocadas: LineaColocada[] = [];
  let y = aire;
  for (const bloque of r.armados) {
    for (const l of bloque) {
      const h = altoDeLinea(l.puntos);
      colocadas.push({ ...l, y: y + h * 0.78 });
      y += h;
    }
    y += aire;
  }
  return colocadas;
}
