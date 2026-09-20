#!/usr/bin/env python3
"""
Qué domingos del Tiempo Ordinario tienen un canto distinto para cada AÑO (A, B, C).

Por qué existe: la comunión de muchos domingos cambia según el año del leccionario, y
hasta ahora no había forma de saber CUÁNTOS ni DÓNDE sin mirar el libro página a página.
Esto lo lee del propio Graduale Romanum.

Cómo lo sabe: el libro rotula los años EN TEXTO LEGIBLE, no en la música —"Dom. anno B :",
"Dom. annis A et B :"— y eso el escaneo sí lo conserva. Hay dos formas:

  · IMPRESO AQUÍ — debajo del rótulo viene el canto entero.
  · POR REFERENCIA — el rótulo remite a otra página ("Dom. anno B : Fuit homo, 569"),
    porque ese canto ya está escrito en otro sitio del libro. Es lo que hace que esto no
    se pueda resolver sólo mirando el domingo: hay que ir a buscarlo.

Salida: docs/graduale-anios.md

Uso:  .venv/Scripts/python.exe scripts/anios-graduale.py
"""
import os
import re
import sys

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.exit("Falta PyMuPDF: .venv/Scripts/pip.exe install pymupdf")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "tmp", "graduale", "GR.pdf")
SALIDA = os.path.join(ROOT, "docs", "graduale-anios.md")

# "Dom. anno B :", "Dom. annis A et B :", "Anno C:"… El libro no es uniforme.
ANNO = re.compile(r"\bann?(?:o|is)\s+([ABC])(?:\s*et\s*([ABC]))?\s*:?\s*(.*)$", re.I)
# Una referencia acaba en el folio impreso donde está el canto: "Fuit homo, 569."
REFERENCIA = re.compile(r",\s*(\d{2,3})\s*[.,]?\s*$")
ORDINARIO = re.compile(r"^Hebdomada\s", re.I)

ORDINALES = {
    "prima": 1, "secunda": 2, "tertia": 3, "quarta": 4, "quinta": 5, "sexta": 6,
    "septima": 7, "octava": 8, "nona": 9, "undecima": 11, "duodecima": 12,
    "decima": 10, "vicesima": 20, "vigesima": 20, "tricesima": 30, "trigesima": 30,
}


def numero(titulo: str):
    """'Hebdomada Vigesima Prima' → 21."""
    fichas = [w.lower() for w in titulo.split() if w.lower() in ORDINALES]
    if not fichas:
        return None
    if len(fichas) == 1:
        return ORDINALES[fichas[0]]
    return sum(ORDINALES[w] for w in fichas)


def lineas(doc, p):
    """Las líneas de la página, de arriba abajo."""
    out = []
    for b in doc[p].get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            t = " ".join("".join(s["text"] for s in l["spans"]).split())
            if t:
                out.append((round(l["bbox"][1], 1), t))
    return sorted(out)


def domingos(doc):
    """Los domingos del Tiempo Ordinario, con el rango REAL de cada uno.

    El rango va de su marcador al siguiente marcador que esté en una página posterior.
    Acotarlo con las páginas de los cantos ya detectados sería circular: lo que no se
    detectó queda fuera del rango y por eso nunca se encuentra.
    """
    toc = [(lv, " ".join(str(t).split()), p) for lv, t, p in doc.get_toc() if p >= 1]
    fuera, dentro = [], False
    for i, (lv, titulo, pagina) in enumerate(toc):
        if re.match(r"^Tempus per annum", titulo, re.I):
            dentro = True
            continue
        if dentro and lv <= 1:
            dentro = False
        if dentro and ORDINARIO.match(titulo):
            sig = next((p2 for _, _, p2 in toc[i + 1:] if p2 > pagina), doc.page_count + 1)
            fuera.append((titulo, numero(titulo), pagina, sig))
    return fuera


def main():
    if not os.path.exists(PDF):
        sys.exit(f"Falta {PDF}: corre antes scripts/import-graduale.py")
    doc = fitz.open(PDF)

    filas, conRef, aqui = [], 0, 0
    for titulo, n, ini, fin in domingos(doc):
        marcas = []
        for p in range(ini - 1, min(fin - 1, doc.page_count)):
            for y, txt in lineas(doc, p):
                m = ANNO.search(txt)
                if not m or len(txt) > 70:
                    continue
                años = "".join(a for a in (m.group(1), m.group(2)) if a)
                ref = REFERENCIA.search(txt)
                marcas.append({
                    "años": años, "pagina": p + 1,
                    "folio": int(ref.group(1)) if ref else None,
                    "texto": txt,
                })
                if ref:
                    conRef += 1
                else:
                    aqui += 1
        if marcas:
            filas.append((titulo, n, marcas))

    cubiertos = set()
    for _, _, marcas in filas:
        for m in marcas:
            cubiertos.update(m["años"])

    lineas_md = [
        "# Los años (A, B, C) en el Graduale Romanum",
        "",
        "GENERADO por `scripts/anios-graduale.py` — no editar a mano.",
        "",
        "El año NO se elige: lo pone la fecha de la Misa. Cuando el libro trae un canto",
        "distinto para cada año, la del año que no toca sería otro canto.",
        "",
        f"- Domingos del Tiempo Ordinario con algún año rotulado: **{len(filas)}**",
        f"- Rótulos con el canto IMPRESO ahí mismo: **{aqui}**",
        f"- Rótulos que REMITEN a otra página: **{conRef}**",
        "",
        "Los que remiten son el trabajo de verdad: el canto de ese año está escrito en",
        "otro sitio del libro (en los Comunes, en el Santoral) y hay que ir a buscarlo.",
        "",
        "| Domingo | Años | Dónde |",
        "|---|---|---|",
    ]
    for titulo, n, marcas in filas:
        nombre = f"{n}.º" if n else titulo
        for m in marcas:
            donde = (f"→ folio {m['folio']}" if m["folio"]
                     else f"impreso en p. {m['pagina']} del PDF")
            lineas_md.append(f"| {nombre} | {m['años']} | {donde} |")

    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    open(SALIDA, "w", encoding="utf-8").write("\n".join(lineas_md) + "\n")
    print(f"{len(filas)} domingos con año rotulado · {aqui} impresos · {conRef} por referencia")
    print(f"años que aparecen: {sorted(cubiertos)}")
    print(f"informe: {SALIDA}")
    doc.close()


if __name__ == "__main__":
    main()
