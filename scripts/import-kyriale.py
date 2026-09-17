#!/usr/bin/env python3
"""
Las Misas del ORDINARIO en gregoriano: Kyrie, Gloria, Sanctus y Agnus Dei.

De dónde salen: el Kyriale está DENTRO del Graduale Romanum (18 Misas, páginas 700-758
del PDF) y del Graduale Simplex (Ordinarium I-V). No hace falta ningún libro más.

Cómo se encuentra cada parte. La letra cantada no sirve de referencia: "Kyrie" aparece
cien veces dentro del propio Kyrie, así que dice dónde SUENA pero no dónde EMPIEZA. Lo
que sí marca el comienzo es la INICIAL DECORADA —la K, la G, la S, la A enormes pegadas
al margen—, que el PDF trae en cuerpo 24 mientras que lo que el OCR confunde con letras
(los rabos de las neumas) no pasa de 10. Un umbral de cuerpo las separa limpiamente.

Y la Misa no empieza en su primera inicial sino en su ENCABEZADO: varias Misas traen dos
formas del Kyrie (A y B), y de la XI sólo se detecta la inicial de la B — arrancar ahí
se comía el Kyrie A entero.

Uso:  .venv/Scripts/python.exe scripts/import-kyriale.py

Requiere: PyMuPDF (fitz), Pillow, y los PDF en tmp/graduale/ (los baja import-graduale.py).
"""
import importlib.util
import io
import json
import os
import re
import sys

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.exit("Falta PyMuPDF: .venv/Scripts/pip.exe install pymupdf pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(ROOT, "public", "kyriale")
DATOS = os.path.join(ROOT, "src", "data", "kyrialeIndex.data.ts")
PDFS = {"romanum": os.path.join(ROOT, "tmp", "graduale", "GR.pdf"),
        "simplex": os.path.join(ROOT, "tmp", "graduale", "GS.pdf")}

# El recorte y el binarizado son los mismos que para los propios; se reutilizan en vez
# de copiarlos, para que una mejora en la calidad de imagen valga para los dos.
_spec = importlib.util.spec_from_file_location(
    "facsimil", os.path.join(ROOT, "scripts", "render-graduale-webp.py"))
facsimil = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(facsimil)

PARTES = ["kyrie", "gloria", "sanctus", "agnus"]
INICIALES = {"K": "kyrie", "G": "gloria", "S": "sanctus", "A": "agnus"}
CUERPO_INICIAL = 20      # la inicial decorada mide ~24; el ruido del OCR, 10 o menos

# Cuanto hay que subir desde la inicial para empezar ENCIMA del tetragrama.
#
# La inicial decorada se apoya en la linea de la letra, y el tetragrama de esa misma
# frase va por encima. Cortando a la altura de la inicial, cada parte se quedaba con el
# primer pentagrama de la siguiente colgando al pie. Un tetragrama del libro mide unos
# 30 puntos; se sube eso.
SOBRE_EL_TETRAGRAMA = 32

# Dónde vive el Kyriale dentro de cada libro, y qué nivel de marcador lista sus Misas.
KYRIALE = {
    "romanum": {"desde": 700, "hasta": 759, "nivel": 3},
    "simplex": {"desde": 34, "hasta": 51, "nivel": 2},
}

# El libro dice para qué sirve cada Misa, en latín. El coro no tiene por qué saberlo.
USO = {
    "Tempore paschali": "Tiempo pascual",
    "In festis Apostolorum": "Fiestas de los Apóstoles",
    "In Solemnitatibus et Festis B. M. V.": "Solemnidades y fiestas de la Virgen",
    "In festis et memoriis B. M. V.": "Fiestas y memorias de la Virgen",
    "In Dominicis per annum": "Domingos del Tiempo Ordinario",
    "In feriis per annum": "Ferias del Tiempo Ordinario",
    "In Dominicis Adventus et Quadragesimae": "Domingos de Adviento y Cuaresma",
    "In feriis Adventus et Quadragesimae et ad Missam pro defunctis":
        "Ferias de Adviento y Cuaresma, y Misa de difuntos",
}

# El PADRE NUESTRO no es una Misa del Kyriale: vive en "V. Ad ritus communionis" y el
# libro ofrece TRES TONOS, uno por pagina, cada uno completo (desde "Praeceptis
# salutaribus moniti" hasta "sed libera nos a malo"). Las paginas estan medidas sobre el
# PDF; el OCR de esas hojas esta demasiado roto para buscar nada en el texto, asi que se
# anotan y se comprueban mirandolas.
PATER_NOSTER = {"romanum": {"A": 802, "B": 803, "C": 804}}

NOMBRE_ENTRE_PARENTESIS = re.compile(r"\(\s*([A-ZÆŒ][^)]{3,40})\)")
ROMANO = re.compile(r"^[IVX]+$")

# El nombre lo pone el LIBRO; esto solo arregla lo que el escaner rompio.
#
# Se corrige la ortografia, no el dato: si manana el nombre se leyera bien, esta tabla
# no lo cambiaria. Poner los dieciocho nombres a mano seria mas comodo, pero entonces
# una Misa mal emparejada llevaria un nombre creible y equivocado, que es peor que uno
# con una errata evidente.
ORTOGRAFIA = {
    "Kyrie fans bonitatis": "Kyrie fons bonitatis",
    "Kyrie Deus sempirerne": "Kyrie Deus sempiterne",
    "Kyrie magna Deus potentia": "Kyrie magnae Deus potentiae",
    "De angel is": "De Angelis",
    "Stelhferi conditor orbis": "Stelliferi Conditor orbis",
    "Deus genitor alme": "Deus Genitor alme",
}


def numero_de(titulo: str) -> str:
    """El numeral romano del marcador. En el Simplex va detras ("Ordinarium I")."""
    for palabra in titulo.replace("-", " ").split():
        limpia = palabra.strip(".")
        if ROMANO.match(limpia):
            return limpia
    return titulo.split()[0].rstrip(".")


def iniciales_de(pagina) -> list:
    """Las iniciales decoradas de la página: [(y, parte)], de arriba abajo."""
    fuera = []
    for b in pagina.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            for s in l["spans"]:
                t = s["text"].strip()
                if (len(t) == 1 and t.upper() in INICIALES
                        and s["bbox"][0] < 70 and s["size"] > CUERPO_INICIAL):
                    fuera.append((round(s["bbox"][1], 1), INICIALES[t.upper()]))
    return sorted(fuera)


def encabezado_de(pagina, numero: str):
    """Dónde acaba el encabezado de la Misa en su página. `None` si no se reconoce."""
    romano = re.compile(r"^" + re.escape(numero) + r"\b")
    mejor = None
    for b in pagina.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            t = " ".join("".join(s["text"] for s in l["spans"]).split())
            if not t:
                continue
            if (romano.match(t) or re.match(r"^\(\s*[A-ZÆŒ]", t)
                    or re.match(r"^(IN|AD)\s+[A-Z]", t)):
                y = round(l["bbox"][1], 1)
                if mejor is None or y < mejor[0]:
                    mejor = (y, round(l["bbox"][3], 1))
    return mejor[1] if mejor else None


def nombre_de(doc, pagina: int) -> str:
    """El nombre tradicional ("Orbis factor"), entre parentesis en la PRIMERA pagina.

    Solo en la primera: buscandolo por todo el rango de la Misa, la XVI se quedaba con
    el nombre de la XVII, que empieza en la pagina siguiente.
    """
    if pagina - 1 >= doc.page_count:
        return ""
    m = NOMBRE_ENTRE_PARENTESIS.search(doc[pagina - 1].get_text())
    if not m:
        return ""
    leido = " ".join(m.group(1).split()).replace("/", "l")
    return ORTOGRAFIA.get(leido, leido)


def regiones(doc, ini: tuple, fin: tuple) -> list:
    """De (página, altura) a (página, altura) → las regiones a recortar."""
    salida = []
    for p in range(ini[0] - 1, fin[0]):
        if p >= doc.page_count:
            break
        alto = doc[p].rect.height
        y0 = ini[1] if p == ini[0] - 1 else 0.0
        y1 = fin[1] if p == fin[0] - 1 else alto
        if y1 - y0 > 2:
            salida.append({"p": p, "y0": round(y0, 1), "y1": round(y1, 1)})
    return salida


def misas_del_libro(doc, libro: str) -> list:
    """Las Misas del Kyriale, con el rango de cada una de sus partes."""
    cfg = KYRIALE[libro]
    marcadores = [(" ".join(str(e[1]).replace("—", "-").split()), e[2])
                  for e in doc.get_toc(simple=False)
                  if e[0] == cfg["nivel"] and cfg["desde"] <= e[2] < cfg["hasta"]]
    todas = [(p + 1, y, n) for p in range(cfg["desde"] - 1, cfg["hasta"] - 1)
             for y, n in iniciales_de(doc[p])]

    # El comienzo de cada Misa: su encabezado, no su primera inicial.
    arranques = []
    for titulo, pagina in marcadores:
        numero = numero_de(titulo)
        y = encabezado_de(doc[pagina - 1], numero)
        arranques.append((pagina, y if y is not None else 0.0))

    salida = []
    for i, (titulo, pagina) in enumerate(marcadores):
        numero = numero_de(titulo)
        ini = arranques[i]
        fin = arranques[i + 1] if i + 1 < len(marcadores) else (cfg["hasta"], 0.0)

        # Cada parte empieza en su inicial, después de la parte anterior.
        cortes, desde = [], ini
        for parte in PARTES[1:]:                  # el Kyrie empieza en el encabezado
            sig = next(((p, y) for p, y, n in todas
                        if n == parte and desde <= (p, y) < fin), None)
            if sig:
                # Se sube por encima del tetragrama, sin llegar a morder la parte
                # anterior (en el peor caso el corte se queda donde estaba).
                arriba = (sig[0], max(sig[1] - SOBRE_EL_TETRAGRAMA,
                                      desde[1] + 1 if desde[0] == sig[0] else 0.0))
                cortes.append((parte, arriba))
                desde = arriba

        # Y termina donde empieza la siguiente que exista (o donde acaba la Misa).
        arranca = [("kyrie", ini)] + cortes
        partes = {}
        for j, (parte, comienzo) in enumerate(arranca):
            siguiente = arranca[j + 1][1] if j + 1 < len(arranca) else fin
            if siguiente <= comienzo:
                continue
            partes[parte] = regiones(doc, comienzo, siguiente)

        salida.append({
            "numero": numero,
            "nombre": nombre_de(doc, pagina),
            "uso": USO.get(titulo.split(" - ", 1)[1].strip(), "") if " - " in titulo else "",
            "pagina": pagina,
            "partes": partes,
        })
    return salida


CABECERA = """// ARCHIVO GENERADO por scripts/import-kyriale.py - NO editar a mano.
//
// Las Misas del ordinario en gregoriano (Kyriale). Cada una trae su Kyrie, su Gloria,
// su Sanctus y su Agnus; las que no traen Gloria es porque no lo llevan - en ferias,
// Adviento y Cuaresma el Gloria no se canta.
//
// La imagen de cada parte es /kyriale/<libro>/<numero>/<parte>.webp

export interface MisaKyriale {
  /** Numero romano con que el libro la nombra ("XI"). */
  numero: string;
  /** Nombre tradicional, el que usa todo el mundo ("Orbis factor"). */
  nombre: string;
  /** Para que la propone el libro, en castellano. Vacio si el libro no lo dice. */
  uso: string;
  /** Pagina del PDF donde empieza. */
  pagina: number;
  /** Partes que existen y tienen imagen. */
  partes: readonly string[];
}

export const KYRIALE_DATA: Record<'romanum' | 'simplex', Record<string, MisaKyriale>> =
"""

CABECERA_PATER = """
/** Un tono del Padre Nuestro. La imagen es /kyriale/<libro>/pater/<tono>.webp */
export interface TonoPaterNoster {
  /** Como lo rotula el libro: "A", "B", "C". */
  tono: string;
  /** Pagina del PDF. */
  pagina: number;
}

export const PATER_NOSTER_DATA: Record<string, readonly TonoPaterNoster[]> =
"""


def main():
    catalogo, paters = {}, {}
    for libro, ruta in PDFS.items():
        if not os.path.exists(ruta):
            print(f"[{libro}] falta {ruta}: corre antes scripts/import-graduale.py")
            continue
        doc = fitz.open(ruta)
        misas = misas_del_libro(doc, libro)
        marcos, hechas, total, fallos = {}, {}, 0, []

        for misa in misas:
            clave = misa["numero"]
            ficha = {"numero": clave, "nombre": misa["nombre"], "uso": misa["uso"],
                     "pagina": misa["pagina"], "partes": []}
            for parte, regs in misa["partes"].items():
                try:
                    for r in regs:
                        if r["p"] not in marcos:
                            marcos[r["p"]] = facsimil.marco_de_pagina(doc[r["p"]])
                    trozos = [facsimil.trozo(doc, marcos, r) for r in regs]
                    carpeta = os.path.join(SALIDA, libro, clave)
                    os.makedirs(carpeta, exist_ok=True)
                    destino = os.path.join(carpeta, f"{parte}.webp")
                    facsimil.coser(trozos).save(destino, "WEBP", lossless=True, method=6)
                    total += os.path.getsize(destino)
                    ficha["partes"].append(parte)
                except Exception as e:            # noqa: BLE001 - se informa y sigue
                    fallos.append(f"{clave}/{parte}: {e}")
            hechas[clave] = ficha

        # El Padre Nuestro: pagina entera, que la cabecera y el folio ya los quita el
        # recorte compartido.
        tonos = []
        for tono, pagina in PATER_NOSTER.get(libro, {}).items():
            try:
                r = {"p": pagina - 1, "y0": 0.0, "y1": doc[pagina - 1].rect.height}
                marcos.setdefault(r["p"], facsimil.marco_de_pagina(doc[r["p"]]))
                carpeta = os.path.join(SALIDA, libro, "pater")
                os.makedirs(carpeta, exist_ok=True)
                destino = os.path.join(carpeta, f"{tono}.webp")
                facsimil.coser([facsimil.trozo(doc, marcos, r)]).save(
                    destino, "WEBP", lossless=True, method=6)
                tonos.append({"tono": tono, "pagina": pagina})
            except Exception as e:                # noqa: BLE001
                fallos.append(f"pater/{tono}: {e}")
        if tonos:
            print(f"[{libro}] Padre Nuestro: {len(tonos)} tonos")

        doc.close()
        catalogo[libro] = hechas
        paters[libro] = tonos
        completas = sum(1 for f in hechas.values() if len(f["partes"]) == 4)
        partes = sum(len(f["partes"]) for f in hechas.values())
        print(f"[{libro}] {len(hechas)} Misas - {partes} partes - {total // 1024} KB "
              f"({completas} con las cuatro)")
        for f in fallos[:8]:
            print(f"   FALLO {f}")

    io.open(DATOS, "w", encoding="utf-8").write(
        CABECERA + json.dumps(catalogo, ensure_ascii=False, indent=1) + " as const;" + chr(10)
        + CABECERA_PATER + json.dumps(paters, ensure_ascii=False, indent=1)
        + " as const;" + chr(10))
    print(f"indice: {os.path.getsize(DATOS) // 1024} KB")


if __name__ == "__main__":
    main()
