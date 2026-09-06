/**
 * Salud de los avisos push: quién los recibiría y quién se está quedando fuera.
 *
 * Vive aparte del servicio a propósito. `services/broadcasts` crea el cliente de
 * Supabase al importarse, y eso hace imposible probar esta regla sin base de datos —
 * siendo, como es, una comparación de listas.
 */

/**
 * Parroquias que publican cantorales pero NO tienen a nadie que reciba el aviso.
 *
 * Es la comprobación que faltaba. Cuando un coro publica y no le llega nada a nadie, hoy
 * no hay forma de saberlo salvo que alguien se queje: la lista de suscriptores no se
 * puede leer desde la app, y "cero destinatarios" no se distinguía de "todo bien".
 * Cruzando las parroquias que de verdad publican con los dispositivos suscritos, el
 * hueco salta a la vista.
 */
export function parroquiasSinAvisos(
  porParroquia: Record<string, number>,
  parroquiasQuePublican: string[],
): string[] {
  const norm = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
  const conAlguien = new Set(Object.entries(porParroquia)
    .filter(([, n]) => n > 0)
    .map(([p]) => norm(p)));
  return Array.from(new Set(parroquiasQuePublican.filter(Boolean)))
    .filter((p) => !conAlguien.has(norm(p)))
    .sort((a, b) => a.localeCompare(b));
}
