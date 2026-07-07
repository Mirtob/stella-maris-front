import type { ReactNode } from 'react';

/**
 * Renderiza formato inline de la letra: **negrita**, *cursiva*, __subrayado__.
 * (El centrado por línea lo maneja quien la usa, con el prefijo ">> ".)
 */
export function FormattedText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] != null) nodes.push(<strong key={key++}>{m[2]}</strong>);
    else if (m[3] != null) nodes.push(<u key={key++}>{m[3]}</u>);
    else if (m[4] != null) nodes.push(<em key={key++}>{m[4]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}
