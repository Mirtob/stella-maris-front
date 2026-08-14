/**
 * Generador mínimo de archivos .xlsx (Excel / Google Sheets), sin dependencias.
 *
 * Un .xlsx es un ZIP con unos pocos XML dentro. Para lo que necesitamos —varias
 * hojas de texto y números, con la fila de títulos en negrita— eso cabe en este
 * archivo y evita sumar una librería de ~1 MB al bundle solo para exportar una
 * planilla.
 *
 * Decisiones y sus porqués:
 *  - Entradas ZIP SIN comprimir (método 0 "stored"). Es ZIP válido y ahorra
 *    implementar deflate; una planilla de cientos de filas pesa pocos KB.
 *  - Textos como `inlineStr` en vez de tabla de cadenas compartidas: menos
 *    piezas que mantener sincronizadas y el resultado abre igual.
 *  - Los números van como números de verdad (`<v>`), para que Excel pueda sumar
 *    y ordenar sin que el usuario tenga que convertir la columna.
 *
 * La salida se valida abriéndola con openpyxl (ver tests/unit/README.md), además
 * de las comprobaciones de estructura en tests/unit/reporteria-cantos.test.ts.
 */

// ── API ─────────────────────────────────────────────────────────────────────

/** Celda: valor suelto, o valor con formato. */
export type XlsxCell =
  | string
  | number
  | null
  | undefined
  | { v: string | number | null; bold?: boolean };

export interface XlsxSheet {
  /** Nombre de la pestaña (se recorta a 31 caracteres y se limpian los ilegales). */
  name: string;
  rows: XlsxCell[][];
  /** Ancho de cada columna, en caracteres. */
  columnWidths?: number[];
  /** Congelar las primeras N filas (típicamente 1: la de títulos). */
  freezeRows?: number;
}

// ── XML ─────────────────────────────────────────────────────────────────────

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

/** Escapa texto para XML y descarta los caracteres de control que Excel rechaza. */
function esc(value: string): string {
  return value
    // Caracteres de control que Excel rechaza dentro de un <t> (se conservan
    // tab, salto de línea y retorno de carro, que sí son válidos).
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Índice de columna (0) → letra ('A', …, 'Z', 'AA'). */
export function columnLetter(index: number): string {
  let n = index + 1;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/** Excel prohíbe estos caracteres en el nombre de la pestaña, y el largo máximo es 31. */
function sheetName(raw: string, fallback: string): string {
  const clean = (raw || '').replace(/[\\/*?:[\]]/g, ' ').trim().slice(0, 31);
  return clean || fallback;
}

function cellXml(cell: XlsxCell, ref: string): string {
  const obj = (cell !== null && typeof cell === 'object') ? cell : { v: cell as string | number | null };
  const style = (obj as { bold?: boolean }).bold ? ' s="1"' : '';
  const v = obj.v;
  if (v === null || v === undefined || v === '') return `<c r="${ref}"${style}/>`;
  if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"${style}><v>${v}</v></c>`;
  return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`;
}

function sheetXml(sheet: XlsxSheet): string {
  const cols = sheet.columnWidths?.length
    ? `<cols>${sheet.columnWidths
        .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
        .join('')}</cols>`
    : '';
  // Panel congelado: la fila de títulos queda a la vista al desplazarse.
  const freeze = sheet.freezeRows
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${sheet.freezeRows}" topLeftCell="A${sheet.freezeRows + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : '';
  const rows = sheet.rows
    .map((row, r) => {
      const cells = row
        .map((cell, c) => cellXml(cell, `${columnLetter(c)}${r + 1}`))
        .join('');
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join('');
  return `${XML_HEADER}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${freeze}${cols}<sheetData>${rows}</sheetData></worksheet>`;
}

// Dos formatos: 0 = normal, 1 = negrita (la fila de títulos).
const STYLES_XML = `${XML_HEADER}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
  + '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>'
  + '<font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
  + '<fills count="2"><fill><patternFill patternType="none"/></fill>'
  + '<fill><patternFill patternType="gray125"/></fill></fills>'
  + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
  + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
  + '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
  + '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>'
  // Sin el estilo "Normal" declarado, los lectores estrictos avisan que al libro
  // le falta el estilo por defecto.
  + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
  + '</styleSheet>';

// ── ZIP ─────────────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

interface ZipEntry { name: string; bytes: Uint8Array; crc: number; offset: number }

/**
 * Arma un ZIP con entradas sin comprimir. Cada archivo lleva su cabecera local,
 * y al final va el directorio central que apunta a cada una por su offset.
 */
function zip(files: { name: string; content: string }[]): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const entries: ZipEntry[] = [];
  let offset = 0;

  const push = (bytes: Uint8Array) => { chunks.push(bytes); offset += bytes.length; };
  const u16 = (n: number) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff]);
  const u32 = (n: number) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]);
  const join = (parts: Uint8Array[]) => {
    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let at = 0;
    for (const p of parts) { out.set(p, at); at += p.length; }
    return out;
  };

  // Fecha/hora MS-DOS fija: el contenido no depende de cuándo se generó y así
  // dos exportaciones del mismo catálogo dan archivos idénticos.
  const DOS_TIME = 0;
  const DOS_DATE = ((2020 - 1980) << 9) | (1 << 5) | 1;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const bytes = encoder.encode(file.content);
    const crc = crc32(bytes);
    entries.push({ name: file.name, bytes, crc, offset });

    push(join([
      u32(0x04034b50),          // firma de cabecera local
      u16(20), u16(0), u16(0),  // versión, flags, método 0 = sin comprimir
      u16(DOS_TIME), u16(DOS_DATE),
      u32(crc), u32(bytes.length), u32(bytes.length),
      u16(nameBytes.length), u16(0),
    ]));
    push(nameBytes);
    push(bytes);
  }

  const centralStart = offset;
  for (const e of entries) {
    const nameBytes = encoder.encode(e.name);
    push(join([
      u32(0x02014b50),                  // firma del directorio central
      u16(20), u16(20), u16(0), u16(0),
      u16(DOS_TIME), u16(DOS_DATE),
      u32(e.crc), u32(e.bytes.length), u32(e.bytes.length),
      u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(e.offset),
    ]));
    push(nameBytes);
  }

  push(join([
    u32(0x06054b50),                    // fin del directorio central
    u16(0), u16(0),
    u16(entries.length), u16(entries.length),
    u32(offset - centralStart), u32(centralStart), u16(0),
  ]));

  return join(chunks);
}

// ── Libro ───────────────────────────────────────────────────────────────────

/** Arma el .xlsx con una pestaña por hoja. Devuelve el Blob listo para descargar. */
export function buildXlsx(sheets: XlsxSheet[]): Blob {
  const used = new Set<string>();
  const names = sheets.map((s, i) => {
    let name = sheetName(s.name, `Hoja${i + 1}`);
    // Excel rechaza el libro entero si dos pestañas se llaman igual.
    let n = 2;
    while (used.has(name.toLowerCase())) name = `${sheetName(s.name, `Hoja${i + 1}`).slice(0, 28)} ${n++}`;
    used.add(name.toLowerCase());
    return name;
  });

  const files: { name: string; content: string }[] = [
    {
      name: '[Content_Types].xml',
      content: `${XML_HEADER}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        + '<Default Extension="xml" ContentType="application/xml"/>'
        + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        + sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
        + '</Types>',
    },
    {
      name: '_rels/.rels',
      content: `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        + '</Relationships>',
    },
    {
      name: 'xl/workbook.xml',
      content: `${XML_HEADER}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>`
        + names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')
        + '</sheets></workbook>',
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
        + sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
        + `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`
        + '</Relationships>',
    },
    { name: 'xl/styles.xml', content: STYLES_XML },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, content: sheetXml(s) })),
  ];

  const bytes = zip(files);
  // `slice()` desprende el ArrayBuffer del Uint8Array: el Blob se queda con una
  // copia propia y no con una vista sobre el buffer completo.
  return new Blob([bytes.slice().buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
