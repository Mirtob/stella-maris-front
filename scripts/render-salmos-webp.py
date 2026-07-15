#!/usr/bin/env python3
"""
Renderiza las páginas del libro de salmos (Año A/B/C) a imágenes WebP estáticas.

Por qué: las partituras del libro están escaneadas con JBIG2 y pdf.js NO las dibuja bajo
la CSP estricta de producción (requeriría 'unsafe-eval', inseguro). En vez de pdf.js,
servimos cada página como imagen en public/salmos/<ciclo>/<páginaPDF>.webp y la app la
muestra con un simple <img> (sin WASM, sin eval, sin problemas de CSP).

Genera SOLO las páginas que el índice necesita (las que tienen `page` en psalmIndex.data.ts),
aplicando el pageOffset del ciclo. El nombre del archivo es la página REAL del PDF, que es
justo lo que devuelve resolvePsalm() y lo que pide psalmPageImageUrl().

Uso:  .venv/Scripts/python.exe scripts/render-salmos-webp.py [A|B|C ...]
      (sin argumentos = todos los ciclos con PDF configurado)

Requiere: PyMuPDF (fitz), Pillow. El PDF se baja por el proxy de producción.
"""
import os, re, sys, urllib.request
import fitz  # PyMuPDF

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_TS = os.path.join(ROOT, "src", "data", "psalmIndex.data.ts")
INDEX_TS = os.path.join(ROOT, "src", "data", "psalmIndex.ts")

DPI = 125           # nítido para leer música, liviano (~80 KB/página)
QUALITY = 72
PROXY = "https://stella-maris-front.vercel.app/api/pdf?id={id}&v={ver}"


def read_books_and_version():
    """Lee PSALM_BOOKS (driveFileId + pageOffset) y PSALM_BOOK_VERSION de psalmIndex.ts."""
    src = open(INDEX_TS, encoding="utf-8").read()
    ver = re.search(r"PSALM_BOOK_VERSION\s*=\s*'([^']+)'", src).group(1)
    books = {}
    block = src.split("PSALM_BOOKS", 1)[1]
    for cy, fid, off in re.findall(
        r"(\w):\s*\{\s*driveFileId:\s*'([^']*)',\s*pageOffset:\s*(\d+)", block):
        books[cy] = {"id": fid, "offset": int(off)}
    return books, ver


def printed_pages_for_cycle(cycle):
    """Páginas IMPRESAS (con su pageEnd) del índice para un ciclo."""
    data = open(DATA_TS, encoding="utf-8").read()
    # Aísla el bloque del ciclo (A: { ... }, hasta el siguiente ciclo o cierre)
    m = re.search(rf"\b{cycle}:\s*\{{", data)
    if not m:
        return set()
    block = data[m.end():]
    # corta en el próximo "  X: {" de otro ciclo
    nxt = re.search(r"\n\s{2}[ABC]:\s*\{", block)
    if nxt:
        block = block[:nxt.start()]
    pages = set()
    for mm in re.finditer(r"page:\s*(\d+)(?:,\s*pageEnd:\s*(\d+))?", block):
        pages.add(int(mm.group(1)))
        if mm.group(2):
            pages.add(int(mm.group(2)))
    return pages


def main():
    books, ver = read_books_and_version()
    cycles = [c.upper() for c in sys.argv[1:]] or list(books.keys())
    for cycle in cycles:
        book = books.get(cycle)
        if not book or not book["id"]:
            print(f"[{cycle}] sin PDF configurado, se omite")
            continue
        printed = printed_pages_for_cycle(cycle)
        if not printed:
            print(f"[{cycle}] el índice no tiene páginas todavía, se omite")
            continue
        pdf_pages = sorted({p + book["offset"] for p in printed})
        url = PROXY.format(id=book["id"], ver=ver)
        print(f"[{cycle}] bajando PDF… ({len(pdf_pages)} páginas a renderizar)")
        doc = fitz.open(stream=urllib.request.urlopen(url).read(), filetype="pdf")
        outdir = os.path.join(ROOT, "public", "salmos", cycle)
        os.makedirs(outdir, exist_ok=True)
        total = 0
        for pno in pdf_pages:
            if 1 <= pno <= doc.page_count:
                pix = doc[pno - 1].get_pixmap(dpi=DPI, colorspace=fitz.csGRAY)
                pix.pil_save(os.path.join(outdir, f"{pno}.webp"),
                             format="WEBP", quality=QUALITY, method=6)
                total += os.path.getsize(os.path.join(outdir, f"{pno}.webp"))
        doc.close()
        print(f"[{cycle}] {len(pdf_pages)} imágenes · {total // 1024} KB "
              f"(promedio {total // max(1, len(pdf_pages)) // 1024} KB)")


if __name__ == "__main__":
    main()
