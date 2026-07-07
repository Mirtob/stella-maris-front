/**
 * Formato ligero de la letra (editor del admin). Markdown-subset que NO colisiona con
 * los acordes `[G]` (no usa corchetes):
 *   **negrita**  ·  *cursiva*  ·  __subrayado__  ·  línea centrada con prefijo ">> ".
 *
 * Se RENDERIZA en la vista de letra del Pueblo (LyricsOnly). En contextos con acordes o
 * en los PDF se usa `stripLyricsFormatting` para no mostrar los marcadores en crudo.
 */

export const CENTER_PREFIX = '>> ';

export function isCenteredLine(line: string): boolean {
  return /^>>\s?/.test(line);
}
export function stripCenterMarker(line: string): string {
  return line.replace(/^>>\s?/, '');
}

/** Quita todos los marcadores de formato (deja el texto plano). */
export function stripLyricsFormatting(text?: string | null): string {
  if (!text) return '';
  return text
    .split('\n')
    .map((l) => stripCenterMarker(l))
    .join('\n')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1');
}
