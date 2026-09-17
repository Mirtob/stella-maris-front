#!/usr/bin/env python3
"""
Recorta del Graduale Romanum y del Simplex cada canto propio y lo deja como imagen
en public/graduale/<libro>/<clave>/<canto>.webp

Por qué imagen y no el PDF: los dos libros son escaneos, y bajo la CSP estricta de
producción pdf.js no los dibuja (pediría 'unsafe-eval'). Es la misma razón por la que el
salmo del libro va como <img> — ver scripts/render-salmos-webp.py.

Por qué BLANCO Y NEGRO sin pérdida y no gris con pérdida: esto es tinta sobre papel, no
una fotografía. Binarizado pesa CINCO VECES MENOS que el gris con pérdida (~12 MB los
1016 cantos, contra ~63 MB) y además se lee más nítido, porque el JPEG/WebP con pérdida
emborrona justo lo que importa: las líneas del tetragrama y los puntos de las neumas.

Un canto puede cruzar de página. En ese caso se cosen las regiones una debajo de otra
para que salga UNA sola imagen continua: quien canta no tiene por qué pasar página.
En las costuras se quitan la cabecera y el folio, que no son parte del canto.

Uso:  .venv/Scripts/python.exe scripts/render-graduale-webp.py [--libro romanum]
      [--muestra 20] [--dpi 170]

Requiere: PyMuPDF (fitz), Pillow, y los PDF ya bajados en tmp/graduale/ (los deja ahí
scripts/import-graduale.py).
"""
import argparse
import io
import json
import os
import re
import sys

try:
    import fitz  # PyMuPDF
    from PIL import Image
except ImportError:
    sys.exit("Faltan dependencias: .venv/Scripts/pip.exe install pymupdf pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDICE = os.path.join(ROOT, "src", "data", "gradualeIndex.data.ts")
SALIDA = os.path.join(ROOT, "public", "graduale")
APP = os.path.join(ROOT, "src", "data", "gradualeApp.data.ts")
PDFS = {"romanum": os.path.join(ROOT, "tmp", "graduale", "GR.pdf"),
        "simplex": os.path.join(ROOT, "tmp", "graduale", "GS.pdf")}

DPI = 170          # el libro es pequeño (359×519 pt): a 170 ppp una página son ~850 px
UMBRAL = 176       # gris por encima de esto = papel; por debajo = tinta
MARGEN = 8         # px de aire alrededor de la mancha, para que no quede ahogado

# Cabecera de página del libro: el tiempo o la semana en mayúsculas, con el número de
# folio pegado a un lado o al otro según la página sea par o impar ("16 TEMPUS ADVENTUS").
FOLIO = re.compile(r"^\d{1,3}\s+|\s+\d{1,3}$")
CABECERA = re.compile(r"^(?:[IVXLC]+|\d{1,3}|[A-ZÆŒ][A-ZÆŒ\s.,:'-]{3,})$")


def es_cabecera(texto: str) -> bool:
    """Si esa línea es el título corrido de la página y no letra de canto."""
    return bool(CABECERA.match(FOLIO.sub("", texto).strip()))


def leer_indice() -> dict:
    """El índice generado, leído como JSON (el archivo es TypeScript pero el dato no)."""
    t = io.open(INDICE, encoding="utf-8").read()
    i = t.index("GRADUALE_INDEX_DATA")
    i = t.index("{", t.index("=", i))
    fin = t.rindex("} as const;") + 1 if "} as const;" in t else t.rindex("};") + 1
    return json.loads(t[i:fin])


def lineas_de(pagina):
    """Las líneas de texto de la página, de arriba abajo: [(y0, y1, texto)]."""
    palabras = sorted(pagina.get_text("words"), key=lambda w: (round(w[1], 1), w[0]))
    lineas = []
    for x0, y0, _x1, y1, palabra, *_ in palabras:
        if lineas and abs(y0 - lineas[-1][0]) < 3.5:
            lineas[-1][1] = max(lineas[-1][1], y1)
            lineas[-1][2].append(palabra)
        else:
            lineas.append([y0, y1, [palabra]])
    return [(a, b, " ".join(t).strip()) for a, b, t in lineas]


def marco_de_pagina(pagina) -> tuple:
    """Dónde acaba la cabecera y dónde empieza el folio, en esta página concreta.

    Se mira el texto real en vez de suponer una banda fija, y se miran DOS líneas por
    cada lado: el folio no siempre es la última: debajo suele llevar la cita del salmo
    con que sigue la página siguiente. Una línea sólo cuenta como cabecera si es corta y
    va en mayúsculas o es un número; la letra de un canto nunca tiene esa forma, así que
    en la duda no se corta nada.
    """
    lineas = lineas_de(pagina)
    if len(lineas) < 4:
        return 0.0, pagina.rect.height
    arriba, abajo = 0.0, pagina.rect.height
    for y0, y1, texto in lineas[:2]:
        if es_cabecera(texto):
            arriba = y1 + 2
    for y0, y1, texto in reversed(lineas[-2:]):
        if es_cabecera(texto):
            abajo = y0 - 2
    return arriba, abajo


def trozo(doc, marcos, region):
    """Una región de página ya rasterizada en blanco y negro.

    La cabecera y el folio se quitan SIEMPRE, no sólo en las costuras: el título corrido
    de la página y el número no son parte de ningún canto, y el índice recorta ancho a
    propósito (ver HOLGURA en import-graduale.py), así que se cuelan por los dos lados.
    """
    pagina = doc[region["p"]]
    arriba, abajo = marcos[region["p"]]
    y0 = max(float(region["y0"]), arriba)
    y1 = min(float(region["y1"]), abajo)
    y0 = max(0.0, min(y0, pagina.rect.height))
    y1 = max(y0 + 1, min(y1, pagina.rect.height))
    px = pagina.get_pixmap(dpi=DPI, colorspace=fitz.csGRAY,
                           clip=fitz.Rect(0, y0, pagina.rect.width, y1))
    return Image.frombytes("L", (px.width, px.height), px.samples)


# Alto máximo de un WebP. Pasarse no es un problema de formato: quiere decir que esa
# entrada del índice no es un canto sino una sección entera del libro (un "Commune" que
# se comió sus 19 páginas), y conviene enterarse en vez de guardar un mamotreto.
LIMITE_WEBP = 16383


def coser(imagenes):
    """Las regiones, una debajo de otra, binarizadas y sin márgenes en blanco."""
    ancho = max(i.width for i in imagenes)
    alto = sum(i.height for i in imagenes)
    if alto > LIMITE_WEBP:
        raise ValueError(f"ocupa {len(imagenes)} páginas ({alto} px): eso no es un canto, "
                         "es una sección del libro — hay que acotar esa entrada del índice")
    lienzo = Image.new("L", (ancho, alto), 255)
    y = 0
    for im in imagenes:
        lienzo.paste(im, (0, y))
        y += im.height
    bn = lienzo.point(lambda v: 255 if v > UMBRAL else 0)
    caja = bn.point(lambda v: 0 if v else 255).getbbox()   # dónde hay tinta
    if caja:
        bn = bn.crop((max(0, caja[0] - MARGEN), max(0, caja[1] - MARGEN),
                      min(ancho, caja[2] + MARGEN), min(alto, caja[3] + MARGEN)))
    return bn.convert("1")


def escribir_indice_app(hechas: dict) -> None:
    """El índice ESBELTO que se lleva la app: sólo lo que de verdad hay dibujado.

    El índice grande (gradualeIndex.data.ts) lleva los recortes página a página, que son
    unos 200 KB y sólo sirven aquí, para recortar. Metido en el navegador engordaba el
    paquete de TODO el mundo —también el del pueblo fiel, que nunca abre el constructor—
    con datos que nadie iba a mirar.

    Así que la app recibe otra cosa: qué celebración tiene qué cantos en qué libro. Y se
    escribe DESPUÉS de dibujar, a partir de lo que se dibujó: si una imagen falló, no
    aparece, y el coro no ve un botón que lleva a una imagen rota.
    """
    cabecera = """// ARCHIVO GENERADO por scripts/render-graduale-webp.py — NO editar a mano.
//
// Qué propio gregoriano hay para cada celebración, en cada libro. Es el índice que se
// lleva el navegador: sólo los nombres, sin los recortes (esos viven en
// gradualeIndex.data.ts, que se queda en el repositorio y no se empaqueta).
//
// Cada canto vale `1` si sirve para los tres ciclos, o la lista de ciclos para los que
// el libro trae melodía propia (pasa sobre todo en las comuniones del Tiempo Ordinario).
// La imagen es /graduale/<libro>/<clave>/<canto>[-<ciclo>].webp

export interface MisaApp {
  /** Carpeta de las imágenes, y clave de la Misa en el índice grande. */
  clave: string;
  /** Título latino tal como lo trae el libro. */
  titulo: string;
  /** Página impresa donde empieza, para quien quiera ir al libro de papel. */
  pagina: number;
  cantos: Record<string, 1 | readonly string[]>;
}

export const GRADUALE_APP: Record<'romanum' | 'simplex', Record<string, MisaApp>> =
"""
    cuerpo = json.dumps(hechas, ensure_ascii=False, indent=1)
    io.open(APP, "w", encoding="utf-8").write(cabecera + cuerpo + " as const;" + chr(10))
    total = sum(len(v) for v in hechas.values())
    print("")
    print(f"índice de la app: {total} celebraciones · {os.path.getsize(APP) // 1024} KB")


def main():
    global DPI
    ap = argparse.ArgumentParser()
    ap.add_argument("--libro", choices=list(PDFS), help="sólo uno de los dos libros")
    ap.add_argument("--muestra", type=int, help="sólo los N primeros cantos, para probar")
    ap.add_argument("--dpi", type=int, default=DPI)
    args = ap.parse_args()
    DPI = args.dpi

    indice = leer_indice()
    libros = [args.libro] if args.libro else list(PDFS)
    app = {}
    for libro in libros:
        ruta = PDFS[libro]
        if not os.path.exists(ruta):
            print(f"[{libro}] falta {ruta}: corre antes scripts/import-graduale.py")
            continue
        doc = fitz.open(ruta)
        marcos = {}

        # Qué hay que dibujar: el canto normal, y aparte cada variante de ciclo.
        tareas = []
        for clave, misa in indice[libro].items():
            for canto, regiones in misa["cantos"].items():
                tareas.append((clave, canto, regiones))
            for ciclo, cantos in (misa.get("cantosPorCiclo") or {}).items():
                for canto, regiones in cantos.items():
                    tareas.append((clave, f"{canto}-{ciclo}", regiones))
        if args.muestra:
            tareas = tareas[:args.muestra]

        total, hechos, fallos = 0, 0, []
        logradas = {}
        for clave, nombre, regiones in tareas:
            try:
                for r in regiones:
                    if r["p"] not in marcos:
                        marcos[r["p"]] = marco_de_pagina(doc[r["p"]])
                partes = [trozo(doc, marcos, r) for r in regiones]
                carpeta = os.path.join(SALIDA, libro, clave)
                os.makedirs(carpeta, exist_ok=True)
                destino = os.path.join(carpeta, f"{nombre}.webp")
                coser(partes).save(destino, "WEBP", lossless=True, method=6)
                total += os.path.getsize(destino)
                hechos += 1
                # Sólo las Misas atadas a una celebración del calendario llegan a la
                # app: el Simplex ofrece además Misas por tiempo ("Missa I"…), que no
                # corresponden a un domingo concreto y las elige el coro a mano.
                misa = indice[libro][clave]
                celebracion = misa.get("celebracion")
                if celebracion:
                    ficha = logradas.setdefault(celebracion, {
                        "clave": clave, "titulo": misa["titulo"],
                        "pagina": misa["pagina"], "cantos": {},
                    })
                    base, _, ciclo = nombre.partition("-")
                    if ciclo:
                        previo = ficha["cantos"].get(base)
                        ficha["cantos"][base] = sorted(
                            set(previo if isinstance(previo, list) else []) | {ciclo})
                    else:
                        ficha["cantos"].setdefault(base, 1)
            except Exception as e:                      # noqa: BLE001 — se informa y sigue
                fallos.append(f"{clave}/{nombre}: {e}")
        doc.close()

        app[libro] = logradas
        print(f"[{libro}] {hechos} imágenes · {total // 1024} KB "
              f"(media {total // max(1, hechos) // 1024} KB)")
        for f in fallos[:10]:
            print(f"   FALLÓ {f}")
        if len(fallos) > 10:
            print(f"   … y {len(fallos) - 10} más")

    # Sólo se reescribe el índice de la app cuando se dibujaron LOS DOS libros: con
    # --libro se está probando, y guardar medio índice dejaría la app sin el otro.
    if len(libros) == len(PDFS):
        escribir_indice_app(app)
    else:
        print("(sólo un libro: no se toca el índice de la app)")


if __name__ == "__main__":
    main()
