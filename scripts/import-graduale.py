"""Índice de los propios cantados: Graduale Romanum y Graduale Simplex.

QUÉ PRODUCE
`src/data/gradualeIndex.data.ts`: para cada Misa del libro, dónde está cada canto
(introito, gradual, aleluya/tracto, ofertorio, comunión) — página y RECORTE, porque
el 38 % de las páginas lleva dos o más cantos y pegar la página entera dejaría los
neumas ilegibles en un folleto.

CÓMO LO SACA, Y POR QUÉ ASÍ
Los dos PDF son escaneos con una capa de OCR muy pobre: el texto corrido de los cantos
sale como ruido. Pero hay dos cosas que sí son fiables, y el importador se apoya solo
en ellas:

  1. Los MARCADORES del PDF (325 en el Romanum, 143 en el Simplex) son texto real,
     tecleado, con jerarquía y página. De ahí salen las Misas y sus rangos.
  2. Los RÓTULOS de cada canto son abreviaturas cortas —IN. GR. AL. TR. OF. CO.— y
     sobreviven al OCR CON SUS COORDENADAS. De ahí sale el recorte: cada canto va de
     su rótulo al siguiente.

Nunca se lee el canto en sí; solo se ubica. Por eso la mala calidad del OCR no importa.

EL SIMPLEX NO ES COMO EL ROMANUM
El Romanum trae un propio por día. El Simplex ofrece Misas por TIEMPO litúrgico, y
varias numeradas (`Missa I`…`Missa VIII` para el Ordinario, `Dominica II & III`
compartiendo una en Cuaresma). Por eso el índice guarda el título tal cual del libro y
NO intenta adivinar a qué domingo corresponde: esa correspondencia la decide el coro en
la app, que es lo pedido.

Uso:  .venv/Scripts/python.exe scripts/import-graduale.py [--cache DIR]
      Si los PDF no están en el cache, los baja con la API key de .env.local.
"""
import argparse
import io
import json
import os
import re
import sys
import unicodedata
import urllib.request

try:
    import fitz  # pymupdf
except ImportError:
    sys.exit("Falta pymupdf: .venv/Scripts/pip.exe install pymupdf")

OUT = "src/data/gradualeIndex.data.ts"

LIBROS = {
    "romanum": {
        "archivo": "GR.pdf",
        "driveId": "1SuphjjDZmZMDfEjxDhIjfhTS14LaASS4",
        "titulo": "Graduale Romanum (1974)",
    },
    "simplex": {
        "archivo": "GS.pdf",
        "driveId": "1gK9ZfqsJ2N6humiWGh3-_6XemT9-izOh",
        "titulo": "Graduale Simplex (2007)",
    },
}

# CADA LIBRO ROTULA A SU MANERA, y esto no es un detalle: con los rótulos del Romanum,
# el Simplex daba CERO cantos.
#
#  · Romanum (1974) — abreviaturas: IN. GR. AL. TR. OF. CO. Se toleran las confusiones
#    típicas del OCR (O↔0, I↔l↔1).
#  · Simplex (2007) — palabras completas y nomenclatura moderna: "Antiphona ad
#    introitum", "Psalmus responsorius"… Su OCR además es bastante mejor.
#
# El Simplex no tiene gradual ni aleluya como tales: en su lugar van el salmo
# responsorial y el salmo aleluyático (o la antífona de aclamación antes del Evangelio).
# Se mapean a los mismos tipos para que la app no tenga que saber de esta diferencia.
CANTOS_POR_LIBRO = {
    # EL ROMANUM USA LAS DOS CONVENCIONES, y esto costó encontrarlo.
    #
    # La mayor parte del libro abrevia (IN. GR. OF. CO.), pero las Misas restauradas
    # tras el Concilio —el Domingo de Pascua, la Ascensión, Pentecostés— llevan la
    # forma moderna completa, la misma del Simplex ("Antiphona ad introitum").
    # Buscando solo la abreviatura, esos días salían vacíos y parecían huecos del OCR
    # cuando el canto estaba justo ahí.
    #
    # Se descubrió porque el usuario los rellenó a mano y su página no cuadraba con la
    # que yo había detectado: él decía p193 y yo p196. Tenía razón él.
    "romanum": [
        ("introitus",   r"\b[I1l]N\s*\.|Antiph[o0]n[as]{1,2}\s+ad\s+intr[o0]itum"),
        ("graduale",    r"\bGR\s*\.|Psalmus\s+resp[o0]ns[o0]rius"),
        # El TRACTO no es un canto aparte: es lo que se canta EN LUGAR del Aleluya
        # durante la Cuaresma. Ocupa el mismo sitio en la Misa, así que ocupa el mismo
        # hueco aquí. Tenerlo como tipo propio obligaba a marcar "no existe" en la
        # mitad de las filas de la planilla, que es trabajo inventado.
        ("alleluia",    r"\bAL\s*\.|\bTR\s*\.|Psalmus\s+allelui[a-z]*"
                        r"|Antiph[o0]n[as]{1,2}\s+acclamati[o0]nis"),
        ("offertorium", r"\b[O0]F\s*\.|Antiph[o0]n[as]{1,2}\s+ad\s+[o0]ffert[o0]rium"),
        ("communio",    r"\bC[O0]\s*\.|Antiph[o0]n[as]{1,2}\s+ad\s+communi[o0]nem"),
    ],
    "simplex": [
        ("introitus",   r"Antiphona\s+ad\s+intr[o0]itum"),
        ("graduale",    r"Psalmus\s+resp[o0]ns[o0]rius"),
        # "Alleluia" a secas NO sirve de rótulo: aparece cientos de veces dentro del
        # propio canto. Solo valen los dos encabezados de verdad.
        ("alleluia",    r"Psalmus\s+allelui[a-z]*|Antiphona\s+acclamati[o0]nis"),
        ("offertorium", r"Antiphona\s+ad\s+[o0]ffert[o0]rium"),
        ("communio",    r"Antiphona\s+ad\s+communi[o0]nem"),
    ],
}

# Margen alrededor del recorte, en puntos: el rótulo va a la izquierda del canto y la
# primera línea de neumas queda algo por encima de su línea de base.
MARGEN_ARRIBA = 14
MARGEN_ABAJO = 6


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def slug(s: str) -> str:
    return norm(s).replace(" ", "-")[:70]



# ── Del latín del libro a la celebración del calendario de la app ────────────
#
# Los títulos son regulares, pero el número del domingo viene en ORDINAL LATINO y el
# tiempo litúrgico NO está en el título: está en la ruta de marcadores. "Hebdomada
# Secunda" es el 2.º domingo de Pascua o del Tiempo Ordinario según de qué sección
# cuelgue.
#
# Ojo con Cuaresma: ahí el domingo cuelga como hijo `Dominica` de su semana, así que
# esa entrada es la que trae los cantos del domingo y gana sobre la de la semana.

# Ordinales femeninos, que es como concuerdan con "hebdomada" y "dominica".
UNIDADES = {
    "prima": 1, "secunda": 2, "tertia": 3, "quarta": 4, "quinta": 5,
    "sexta": 6, "septima": 7, "octava": 8, "nona": 9,
}
# Solo los que NO se descomponen. "decima" sí se descompone ("Decima Quinta" = 15),
# así que va en DECENAS, no aquí.
ENTEROS = {"undecima": 11, "duodecima": 12}
# El libro escribe "Vigesima" y "Trigesima" con G. Se aceptan las dos grafías: con la
# clásica (vicesima/tricesima) el importador leía "Vigesima Prima" como 1 en vez de 21
# — y poner los cantos del domingo 21 en el primero es peor que no ponerlos.
DECENAS = {
    "decima": 10,
    "vicesima": 20, "vigesima": 20,
    "tricesima": 30, "trigesima": 30,
}
ROMANOS_ORD = {
    "i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7, "viii": 8, "ix": 9,
    "x": 10, "xi": 11, "xii": 12, "xiii": 13, "xiv": 14, "xv": 15, "xvi": 16,
    "xvii": 17, "xviii": 18, "xix": 19, "xx": 20, "xxi": 21, "xxii": 22, "xxiii": 23,
    "xxiv": 24, "xxv": 25, "xxvi": 26, "xxvii": 27, "xxviii": 28, "xxix": 29,
    "xxx": 30, "xxxi": 31, "xxxii": 32, "xxxiii": 33, "xxxiv": 34,
}

# Tiempo litúrgico → cómo lo nombra el calendario de la app.
TIEMPOS = {
    "adventus": "de Adviento",
    "quadragesimae": "de Cuaresma",
    "paschae": "de Pascua",
    "paschale": "de Pascua",
    "per annum": "del Tiempo Ordinario",
}

# Solemnidades que se celebran con VARIAS Misas, cada una con sus propios cantos.
# La Navidad tiene cuatro (vigilia, noche, aurora, día) y en el libro cuelgan de
# "In Nativitate Domini" como hijas. Sin esto, las cuatro quedaban sin emparejar y la
# solemnidad más importante del año se resolvía con una entrada casi vacía.
#
# El sufijo sigue la convención que ya usa el índice de salmos de la app
# ("Natividad del Señor (Misa de la vigilia)"), para que las dos fuentes hablen igual.
SUB_MISAS = {
    "ad missam in vigilia": "(Misa de la vigilia)",
    "ad missam in nocte": "(Misa de la noche)",
    "ad missam in aurora": "(Misa de la aurora)",
    "ad missam in die": "(Misa del día)",
}

# ERRATAS DEL PROPIO PDF, corregidas a mano.
#
# El marcador "Hebdomada Undecima" aparece DOS VECES (p288 y p291) y no hay ninguno
# para la duodécima: el siguiente salta a la decimotercera. Resultado: el 11.º domingo
# tenía dos entradas y el 12.º no existía en el índice — nunca llegó a la planilla, así
# que tampoco se podía rellenar a mano. La segunda es en realidad la duodécima.
#
# Se corrige por PÁGINA y no por título, que es lo único que distingue a las dos.
MARCADOR_CORREGIDO = {
    ("romanum", 291): "12.º Domingo del Tiempo Ordinario",
}

# Las que no siguen ningún patrón: se nombran una por una.
FIESTAS = {
    "in nativitate domini": "Natividad del Señor",
    "sanctae familiae iesu mariae et ioseph": "Sagrada Familia",
    "s familiae iesu mariae et ioseph": "Sagrada Familia",
    "sollemnitas sanctae dei genetricis mariae": "Santa María, Madre de Dios",
    "dominica secunda post nativitatem": "2.º Domingo después de Navidad",
    "in epiphania domini": "Epifanía del Señor",
    "in baptismate domini": "Bautismo del Señor",
    "dominica in palmis de passione domini": "Domingo de Ramos",
    "dominica paschae in resurrectione domini": "Domingo de Resurrección",
    "dominica resurrectionis": "Domingo de Resurrección",
    "in ascensione domini": "Ascensión del Señor",
    "dominica pentecostes": "Pentecostés",
    "sanctissimae trinitatis": "Santísima Trinidad",
    "ss mi corporis et sanguinis christi": "Corpus Christi",
    "sacratissimi cordis iesu": "Sagrado Corazón de Jesús",
    "domini nostri iesu christi universorum regis": "Jesucristo, Rey del Universo",
    # El libro lo abrevia: "D. N. Iesu Christi universorum Regis".
    "d n iesu christi universorum regis": "Jesucristo, Rey del Universo",
}


def numero_ordinal(texto: str):
    """'Vicesima Prima' → 21. 'XXI' → 21. None si no hay ordinal."""
    palabras = norm(texto).split()
    # Romano suelto ("Hebdomada XXI").
    for w in palabras:
        if w in ROMANOS_ORD and len(palabras) <= 4:
            return ROMANOS_ORD[w]
    # Los ordinales que aparecen en el título, en orden.
    fichas = [w for w in palabras if w in ENTEROS or w in DECENAS or w in UNIDADES]
    if not fichas:
        return None
    # "Undecima", "Duodecima": una pieza, no se suman con nada.
    if len(fichas) == 1 and fichas[0] in ENTEROS:
        return ENTEROS[fichas[0]]
    # El resto se suma: "Decima Quinta" = 10+5, "Vigesima Prima" = 20+1,
    # "Trigesima Quarta" = 30+4.
    total = sum(DECENAS.get(w) or UNIDADES.get(w) or 0 for w in fichas)
    return total or None


def tiempo_de(titulo: str, ruta: list):
    """El tiempo litúrgico sale de la ruta; el título casi nunca lo dice."""
    todo = norm(" ".join(list(ruta) + [titulo]))
    for clave, nombre in TIEMPOS.items():
        if clave in todo:
            return nombre
    return None


def celebracion_de(titulo: str, ruta: list):
    """Nombre de la celebración en el calendario de la app, o None."""
    # Una Misa concreta de una solemnidad: hereda el nombre de su madre y le añade cuál
    # de sus Misas es ("Natividad del Señor (Misa de la noche)").
    plano_sub = norm(titulo)
    if plano_sub in SUB_MISAS and ruta:
        madre = celebracion_de(ruta[-1], ruta[:-1])
        if madre:
            return f"{madre} {SUB_MISAS[plano_sub]}"
        return None
    # "Dominica I post Pentecosten — Sanctissimae Trinitatis": la fiesta es lo que va
    # tras el guión; lo de delante es solo su posición en el calendario.
    for separador in ("—", "–", " - "):
        if separador in titulo:
            despues = titulo.split(separador)[-1].strip()
            if norm(despues) in FIESTAS:
                return FIESTAS[norm(despues)]
    plano = norm(titulo)
    if plano in FIESTAS:
        return FIESTAS[plano]
    for clave, nombre in FIESTAS.items():
        if plano and (plano == clave or plano.startswith(clave)):
            return nombre

    # Un domingo: hace falta el número y el tiempo.
    esDomingo = plano.startswith("dominica") or plano.startswith("hebdomada")
    if not esDomingo:
        return None
    tiempo = tiempo_de(titulo, ruta)
    if not tiempo:
        return None
    # "Dominica" a secas: el número lo lleva la semana que la contiene.
    numero = numero_ordinal(titulo)
    if numero is None and ruta:
        numero = numero_ordinal(ruta[-1])
    if not numero:
        return None
    # En Adviento y Cuaresma el libro empieza la cuenta en la semana; coincide con el
    # domingo salvo en el Tiempo Ordinario, donde la Hebdomada N es el domingo N.
    return f"{numero}.º Domingo {tiempo}"


def descargar(libro: dict, cache: str) -> str:
    os.makedirs(cache, exist_ok=True)
    destino = os.path.join(cache, libro["archivo"])
    if os.path.exists(destino):
        return destino
    key = ""
    try:
        for linea in io.open(".env.local", encoding="utf-8"):
            if linea.startswith("VITE_GOOGLE_DRIVE_API_KEY="):
                key = linea.split("=", 1)[1].strip()
    except OSError:
        pass
    if not key:
        sys.exit(f"Falta {destino} y no hay VITE_GOOGLE_DRIVE_API_KEY en .env.local")
    url = (f"https://www.googleapis.com/drive/v3/files/{libro['driveId']}"
           f"?alt=media&key={key}")
    print(f"  bajando {libro['archivo']} (puede tardar, son decenas de MB)…")
    urllib.request.urlretrieve(url, destino)
    return destino


def misas_del_libro(doc) -> list:
    """Cada marcador con su rango de páginas [desde, hasta).

    Los encabezados de sección (que no son Misas) se filtran solos: su rango llega solo
    hasta su primer hijo, donde no hay ningún rótulo de canto.
    """
    toc = doc.get_toc()
    salida = []
    # Pila de ancestros por nivel. Hace falta porque muchos títulos NO significan nada
    # sueltos: "Feria Secunda" o "Missa I" solo se entienden dentro de su tiempo
    # ("Tempus Adventus › Hebdomada Secunda Adventus › Feria Secunda"), y el Simplex
    # repite "Missa I" en varios tiempos. Sin la ruta, la correspondencia con el
    # calendario es imposible.
    pila = {}
    for i, (nivel, titulo, pagina) in enumerate(toc):
        limpio = " ".join(str(titulo).split())
        pila[nivel] = limpio
        for hondo in [k for k in pila if k > nivel]:
            del pila[hondo]
        if pagina < 1:
            continue
        siguiente = doc.page_count + 1
        for _, _, p2 in toc[i + 1:]:
            if p2 > pagina:
                siguiente = p2
                break
        salida.append({
            "nivel": nivel,
            "titulo": limpio,
            "ruta": [pila[k] for k in sorted(pila)],
            "desde": pagina - 1,          # índice 0 para fitz
            "hasta": min(siguiente - 1, doc.page_count),
        })
    return salida


def rotulos_de_pagina(pagina, cantos: list) -> list:
    """Los cantos rotulados en una página, ordenados de arriba abajo.

    Devuelve [(tipo, y)] . Se busca el literal que vio el OCR para poder pedirle a
    fitz su rectángulo: es lo que da la coordenada del recorte.
    """
    texto = pagina.get_text()
    hallados = []
    for tipo, patron in cantos:
        for m in re.finditer(patron, texto):
            literal = m.group(0)
            for caja in pagina.search_for(literal):
                hallados.append((tipo, round(caja.y0, 1)))
            break   # una aparición por tipo y página basta
    # Sin duplicados por tipo, y en orden de lectura.
    vistos = set()
    unicos = []
    for tipo, y in sorted(hallados, key=lambda x: x[1]):
        if tipo in vistos:
            continue
        vistos.add(tipo)
        unicos.append((tipo, y))
    return unicos


def recortes_de_misa(doc, desde: int, hasta: int, cantos: list) -> dict:
    """Para cada canto de la Misa, las regiones de página que hay que recortar.

    Un canto va de su rótulo al siguiente. Si el siguiente está en otra página, el
    canto sigue hasta el pie y continúa en las páginas de en medio: por eso cada canto
    guarda una LISTA de regiones, no una sola.
    """
    # Todos los rótulos del rango, en orden, con su página.
    marcas = []
    for p in range(desde, hasta):
        if p >= doc.page_count:
            break
        for tipo, y in rotulos_de_pagina(doc[p], cantos):
            marcas.append({"tipo": tipo, "pagina": p, "y": y})

    cantos = {}
    for i, marca in enumerate(marcas):
        sig = marcas[i + 1] if i + 1 < len(marcas) else None
        alto = doc[marca["pagina"]].rect.height
        regiones = []
        if sig and sig["pagina"] == marca["pagina"]:
            regiones.append({"p": marca["pagina"], "y0": max(0, marca["y"] - MARGEN_ARRIBA),
                             "y1": sig["y"] - MARGEN_ABAJO})
        else:
            fin = sig["pagina"] if sig else min(hasta, doc.page_count)
            regiones.append({"p": marca["pagina"], "y0": max(0, marca["y"] - MARGEN_ARRIBA),
                             "y1": round(alto, 1)})
            for p in range(marca["pagina"] + 1, fin):
                regiones.append({"p": p, "y0": 0, "y1": round(doc[p].rect.height, 1)})
            if sig:
                regiones.append({"p": sig["pagina"], "y0": 0,
                                 "y1": max(0, sig["y"] - MARGEN_ABAJO)})
        # El primero de cada tipo manda (una Misa no repite su introito).
        cantos.setdefault(marca["tipo"], regiones)
    return cantos


# Posiciones de la planilla → fracción de la altura de la página. Excel guarda unas
# selecciones como texto ("1/3") y otras convertidas a número (0.333): valen las dos.
POSICIONES = {
    "arriba del todo": 0.0, "1/6": 1 / 6, "1/4": 0.25, "1/3": 1 / 3,
    "a la mitad": 0.5, "2/3": 2 / 3, "3/4": 0.75, "5/6": 5 / 6, "al final": 1.0,
}

# Holgura del recorte, en fracción de página. Las posiciones de la planilla se señalan
# a ojo ("más o menos por aquí"), así que se recorta ANCHO a propósito: que sobre un
# poco de página es inofensivo; que el canto salga cortado, no.
HOLGURA = 0.04


def fraccion(valor):
    """La posición tal como la guardó Excel → fracción 0..1. None si no hay dato."""
    if isinstance(valor, str):
        return POSICIONES.get(valor.strip())
    if isinstance(valor, (int, float)):
        v = float(valor)
        return v if 0.0 <= v <= 1.0 else None
    return None


def regiones_desde_planilla(doc, p_ini, f_ini, p_fin, f_fin):
    """Las regiones a recortar a partir de lo señalado a mano.

    Un canto puede cruzar de página: empieza en el último tercio de una y termina en el
    primero de la siguiente. En ese caso son varias regiones —desde donde empieza hasta
    el pie, las páginas de en medio enteras, y la cabecera de la última—, que es
    exactamente lo que la planilla permite expresar con sus cuatro columnas.
    """
    ini = int(p_ini) - 1
    fin = int(p_fin) - 1 if p_fin else ini
    if ini < 0 or ini >= doc.page_count:
        return None
    fin = max(ini, min(fin, doc.page_count - 1))
    alto_ini = doc[ini].rect.height

    y0 = max(0.0, (f_ini - HOLGURA) * alto_ini) if f_ini is not None else 0.0
    if fin == ini:
        y1 = min(alto_ini, (f_fin + HOLGURA) * alto_ini) if f_fin is not None else alto_ini
        if y1 <= y0:
            y1 = alto_ini
        return [{"p": ini, "y0": round(y0, 1), "y1": round(y1, 1)}]

    regiones = [{"p": ini, "y0": round(y0, 1), "y1": round(alto_ini, 1)}]
    for p in range(ini + 1, fin):
        regiones.append({"p": p, "y0": 0, "y1": round(doc[p].rect.height, 1)})
    alto_fin = doc[fin].rect.height
    y1 = min(alto_fin, (f_fin + HOLGURA) * alto_fin) if f_fin is not None else alto_fin
    regiones.append({"p": fin, "y0": 0, "y1": round(y1, 1)})
    return regiones


def aplicar_planilla(indice: dict, docs: dict, ruta: str) -> dict:
    """Vuelca en el índice lo rellenado a mano. Devuelve un resumen de lo aplicado.

    Lo manual MANDA sobre lo detectado: si alguien se tomó el trabajo de mirar la
    página, su dato vale más que el mío. Las filas marcadas "no existe" se anotan para
    que el informe de huecos deje de pedirlas.
    """
    resumen = {"aplicadas": 0, "porCiclo": 0, "noExisten": 0, "descartadas": []}
    if not ruta or not os.path.exists(ruta):
        print(f"  (sin planilla en {ruta}: se usa solo lo detectado)")
        return resumen
    try:
        from openpyxl import load_workbook
    except ImportError:
        sys.exit("Falta openpyxl: .venv/Scripts/pip.exe install openpyxl")

    ws = load_workbook(ruta, data_only=True)["Huecos"]
    # La clave viaja en la última columna; su número cambió al añadir la del ciclo.
    col_clave = 13 if str(ws.cell(row=1, column=10).value or "").startswith("→ Ciclo") else 12
    col_ciclo = 10 if col_clave == 13 else None

    for r in range(2, ws.max_row + 1):
        libro = ws.cell(row=r, column=1).value
        canto = ws.cell(row=r, column=3).value
        clave = ws.cell(row=r, column=col_clave).value
        if not libro or not clave or libro not in indice:
            continue
        misa = indice[libro].get(clave)
        if not misa:
            resumen["descartadas"].append(f"f{r}: {clave} ya no está en el índice")
            continue

        p_ini = ws.cell(row=r, column=6).value
        f_ini = fraccion(ws.cell(row=r, column=7).value)
        p_fin = ws.cell(row=r, column=8).value
        f_fin = fraccion(ws.cell(row=r, column=9).value)
        ciclo = (str(ws.cell(row=r, column=col_ciclo).value or "").strip().upper()
                 if col_ciclo else "")
        noexiste = ws.cell(row=r, column=col_clave - 2).value

        if noexiste:
            misa.setdefault("noExisten", [])
            if canto not in misa["noExisten"]:
                misa["noExisten"].append(canto)
            resumen["noExisten"] += 1
            continue
        if not p_ini:
            continue

        regiones = regiones_desde_planilla(docs[libro], p_ini, f_ini, p_fin, f_fin)
        if not regiones:
            resumen["descartadas"].append(f"f{r}: página {p_ini} fuera del documento")
            continue

        if ciclo in ("A", "B", "C"):
            misa.setdefault("cantosPorCiclo", {}).setdefault(ciclo, {})[canto] = regiones
            resumen["porCiclo"] += 1
        else:
            misa["cantos"][canto] = regiones
            resumen["aplicadas"] += 1
    return resumen


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", default=os.path.join("tmp", "graduale"))
    ap.add_argument("--planilla", default=os.path.join(
        os.path.expanduser("~"), "Desktop", "Huecos-Graduale.xlsx"),
        help="planilla rellenada a mano que se fusiona con lo detectado")
    args = ap.parse_args()

    indice = {}
    informe = {}
    docs = {}

    for clave, libro in LIBROS.items():
        ruta = descargar(libro, args.cache)
        doc = fitz.open(ruta)
        docs[clave] = doc
        print(f"\n{libro['titulo']}: {doc.page_count} páginas")

        misas = misas_del_libro(doc)
        conMisa, sinNada = {}, []
        for m in misas:
            cantos = recortes_de_misa(doc, m["desde"], m["hasta"], CANTOS_POR_LIBRO[clave])
            if not cantos:
                sinNada.append(m["titulo"])
                continue
            clave_misa = slug(m["titulo"])
            # Dos marcadores pueden llamarse igual ("Missa I" en varios tiempos):
            # se desempata con la página, que es única.
            if clave_misa in conMisa:
                clave_misa = f"{clave_misa}-p{m['desde'] + 1}"
            celebracion = (MARCADOR_CORREGIDO.get((clave, m["desde"] + 1))
                           or celebracion_de(m["titulo"], m["ruta"][:-1]))
            entrada = {
                "titulo": m["titulo"],
                # Sin los ancestros no hay forma de saber de qué tiempo es esta Misa.
                "ruta": m["ruta"][:-1],
                "pagina": m["desde"] + 1,
                "cantos": cantos,
            }
            if celebracion:
                entrada["celebracion"] = celebracion
            # Si dos entradas apuntan al mismo domingo (la semana y su hijo
            # `Dominica`, como en Cuaresma), gana la que traiga MÁS cantos.
            previa = next((k for k, v in conMisa.items()
                           if v.get("celebracion") == celebracion), None) if celebracion else None
            if previa and len(conMisa[previa]["cantos"]) >= len(cantos):
                continue
            if previa:
                del conMisa[previa]
            conMisa[clave_misa] = entrada
        indice[clave] = conMisa

        # Informe: qué falta, para repasarlo a mano.
        completas = sum(1 for v in conMisa.values()
                        if "introitus" in v["cantos"] and "communio" in v["cantos"])
        porTipo = {}
        for v in conMisa.values():
            for t in v["cantos"]:
                porTipo[t] = porTipo.get(t, 0) + 1
        informe[clave] = {"misas": len(conMisa), "completas": completas,
                          "porTipo": porTipo, "sinCantos": len(sinNada)}
        print(f"  Misas con cantos: {len(conMisa)}   (con introito Y comunión: {completas})")
        print(f"  por tipo: {porTipo}")
        print(f"  marcadores sin ningún canto (secciones, prólogos…): {len(sinNada)}")

    # ── Lo rellenado a mano, encima de lo detectado ─────────────────────────
    res = aplicar_planilla(indice, docs, args.planilla)
    for d in docs.values():
        d.close()
    print(f"\nde la planilla: {res['aplicadas']} cantos aplicados, "
          f"{res['porCiclo']} variantes por ciclo, {res['noExisten']} marcados como inexistentes")
    for msg in res["descartadas"][:10]:
        print(f"   descartada {msg}")

    cabecera = """// ARCHIVO GENERADO por scripts/import-graduale.py — NO editar a mano.
// Dónde está cada canto propio en el Graduale Romanum y en el Graduale Simplex:
// página y RECORTE, porque muchas páginas llevan dos o más cantos.
//
// La clave es el título del libro (en latín) convertido a slug. NO se traduce a las
// celebraciones de la app aquí: el Simplex ofrece Misas por tiempo litúrgico
// (`Missa I`…`Missa VIII`), así que la correspondencia con el domingo la elige el coro.
//
// `y0`/`y1` van en puntos PDF, medidos sobre la página `p` (índice 0).

/** Una región de página a recortar. */
export interface RecorteGraduale { p: number; y0: number; y1: number; }

/** Los cantos de una Misa del libro. Cada canto puede ocupar varias regiones. */
export interface MisaGraduale {
  titulo: string;
  /** Cantos que NO existen en esta Misa (comprobado a mano sobre el libro). */
  noExisten?: string[];
  /** Variantes por ciclo litúrgico, solo donde el libro las trae. El canto normal
   *  sigue en `cantos`; esto lo sustituye cuando el año coincide. */
  cantosPorCiclo?: Partial<Record<'A' | 'B' | 'C', Record<string, RecorteGraduale[]>>>;
  /** Celebración del calendario de la app, cuando se pudo emparejar. El Simplex casi
   *  nunca la trae: ofrece Misas por tiempo, y el domingo lo elige el coro. */
  celebracion?: string;
  /** Secciones que la contienen, de fuera a dentro ("Proprium de Tempore", "Tempus
   *  Adventus"…). Sin esto, "Feria Secunda" o "Missa I" son ambiguos. */
  ruta: string[];
  pagina: number;
  cantos: Partial<Record<
    'introitus' | 'graduale' | 'alleluia' | 'tractus' | 'offertorium' | 'communio',
    RecorteGraduale[]
  >>;
}

export const GRADUALE_INDEX_DATA: Record<'romanum' | 'simplex', Record<string, MisaGraduale>> =
"""
    io.open(OUT, "w", encoding="utf-8").write(
        cabecera + json.dumps(indice, ensure_ascii=False, indent=1) + " as const;\n"
    )
    print(f"\nescrito {OUT}")
    print(json.dumps(informe, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
