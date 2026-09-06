import { detectPlatform } from './installPlatform';

/**
 * Guardar un PDF que ya tenemos, en un teléfono.
 *
 * Reportado el 5-sep-2026 por varios usuarios de Android y iPhone: no podían ni imprimir
 * ni descargar el cantoral. El PDF estaba GENERADO y en memoria —la vista previa lo
 * tenía— pero la única salida era un botón que lo volvía a generar y a imponer como
 * cuadernillo, y era eso lo que fallaba. Quedaban atrapados con el archivo delante.
 *
 * Guardar un blob no necesita ni lienzos, ni pdf.js, ni memoria de sobra: es lo más
 * robusto que hay, y por eso conviene tenerlo SIEMPRE a mano como salida.
 */

/**
 * En iPhone el atributo `download` de un enlace no guarda nada: Safari lo ignora para
 * blobs. Lo que sí funciona es ABRIR el PDF; desde ahí, el botón de compartir lleva a
 * "Guardar en Archivos" y a imprimir. Es el camino que espera quien usa un iPhone.
 */
function esIPhoneOIPad(): boolean {
  return detectPlatform().os === 'ios';
}

export type ResultadoDescarga = 'descargado' | 'abierto' | 'bloqueado';

/**
 * Guarda (o abre, en iPhone) el PDF.
 *
 * Devuelve 'bloqueado' cuando el navegador impide abrir la pestaña —pasa si se llama
 * fuera de un toque del usuario—, para que quien llame pueda ofrecer un enlace visible
 * en vez de dejar la pantalla muda.
 */
export function guardarPdf(blob: Blob, nombreArchivo: string): ResultadoDescarga {
  const url = URL.createObjectURL(blob);
  // Se libera tarde: en móvil, revocarlo antes de que el visor termine de abrirlo deja
  // la pantalla en blanco.
  const liberar = () => setTimeout(() => URL.revokeObjectURL(url), 60_000);

  if (esIPhoneOIPad()) {
    const v = window.open(url, '_blank');
    liberar();
    if (v) return 'abierto';
    // Sin permiso para abrir pestaña: se intenta igual en la misma, que Safari sí deja.
    try { window.location.href = url; return 'abierto'; } catch { return 'bloqueado'; }
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  liberar();
  return 'descargado';
}

/**
 * Abre (o guarda) un PDF del que ya tenemos la URL de objeto.
 *
 * El patrón repetido por la app era: `window.open(url)` y, si el navegador lo bloquea,
 * un enlace con `download`. En iPhone eso deja al usuario sin nada: la ventana se
 * bloquea —el toque del usuario ya se perdió mientras se generaba el PDF— y el atributo
 * `download` Safari lo ignora. El botón parecía no hacer nada.
 */
export function abrirOGuardarPdf(url: string, nombreArchivo: string): ResultadoDescarga {
  const ventana = window.open(url, '_blank');
  if (ventana) return 'abierto';

  if (esIPhoneOIPad()) {
    // Safari sí deja navegar en la misma pestaña; desde el visor se comparte e imprime.
    try { window.location.href = url; return 'abierto'; } catch { return 'bloqueado'; }
  }
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  return 'descargado';
}

/** Nombre de archivo legible y sin caracteres que molesten al sistema de archivos. */
export function nombreDeFolleto(celebracion: string, fecha: string): string {
  const limpio = (celebracion || 'Cantoral')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
  return `Cantoral ${limpio} ${fecha}.pdf`.replace(/\s+/g, ' ');
}
