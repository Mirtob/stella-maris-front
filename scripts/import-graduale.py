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

    # ── Santoral (Proprium Sanctorum) ────────────────────────────────────────
    # Doce solemnidades y fiestas que el Simplex trae completas y que hasta ahora no se
    # emparejaban con nada: el emparejador sabía de domingos y de las solemnidades del
    # Señor, pero no de éstas, así que quedaban en el índice sin celebración y la app no
    # las ofrecía nunca.
    #
    # Los tres nombres en inglés NO son un descuido: son los que hoy tiene el calendario
    # de la app (quedan unas treinta celebraciones sin traducir). Se escriben tal como
    # están porque la clave del índice de la app ES el nombre de la celebración, y si no
    # coincide exactamente el canto no aparece. El día que se traduzcan, el comprobador
    # de `render-graduale-webp.py` avisará de que estas claves quedaron huérfanas.
    "in praesentatione domini": "Presentación del Señor",
    "santi ioseph sponsi b mariae virginis": "San José, Esposo de la Virgen María",
    "sancti ioseph sponsi b mariae virginis": "San José, Esposo de la Virgen María",
    "in annuntiatione domini": "Anunciación del Señor",
    "in nativitate sancti ioannis baptistae": "Natividad de San Juan Bautista",
    "sanctorum petri et pauli apostolorum": "San Pedro y San Pablo, Apóstoles",
    "in transfiguratione domini": "Transfiguración del Señor",
    "in assumptione b mariae virginis": "Asunción de la Virgen María",
    "in nativitate b mariae virginis": "Birth of the Blessed Virgin Mary",
    "in exaltatione sanctae crucis": "The Exaltation of the Holy Cross",
    "ss michaelis gabrielis et raphaelis archangelorum":
        "Saints Michael, Gabriel and Raphael, Archangels",
    "omnium sanctorum": "Todos los Santos",
    "in conceptione immaculata b mariae virginis":
        "Inmaculada Concepción de la Virgen María",
}

# Cómo llama el CALENDARIO DE LA APP a lo que el libro nombra de otra manera.
#
# La clave del índice de la app es el nombre de la celebración, así que un nombre que el
# calendario no usa deja el canto inalcanzable: nadie lo ve y nada falla. Estos dos los
# encontró el comprobador de `render-graduale-webp.py`, y los dos son la misma
# celebración con distinto nombre, no dos días diferentes:
#
#  · el 34.º y último domingo del Tiempo Ordinario ES Jesucristo Rey del Universo;
#  · el 2.º de Pascua, el de la Divina Misericordia.
#
# Al renombrarlos coinciden con la entrada que el libro ya traía por su nombre propio, y
# entonces decide la regla de más abajo: gana la que traiga más cantos.
ALIAS_CALENDARIO = {
    "34.º Domingo del Tiempo Ordinario": "Jesucristo, Rey del Universo",
    "2.º Domingo de Pascua": "Domingo de la Divina Misericordia (2.º de Pascua)",
}

# Misas que el libro ofrece para VARIAS celebraciones a la vez.
#
# El Simplex titula "Dominica II & III" una sola Misa que sirve para los dos domingos de
# Cuaresma. El emparejador leía el primer número romano y se quedaba con el 2.º, así que
# el 3.º de Cuaresma no tenía Simplex — no por falta de música, sino porque nadie le
# había dicho que era la misma.
TAMBIEN_SIRVE = {
    ("simplex", "dominica ii iii"): ["3.º Domingo de Cuaresma"],
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
    nombre = f"{numero}.º Domingo {tiempo}"
    return ALIAS_CALENDARIO.get(nombre, nombre)


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


# El libro rotula los años EN TEXTO, no en la música: "Dom. anno B :", "Dom. annis A et
# B :". El escaneo lo conserva, así que se pueden leer.
ANIO = re.compile(r"\bann?(?:o|is)\s+([ABC])(?:\s*et\s*([ABC]))?\s*:?\s*(.*)$", re.I)
# CÓMO SE SABE SI EL CANTO ESTÁ AQUÍ O EN OTRA PÁGINA.
#
# Cuando el canto viene debajo, el rótulo es sólo el rótulo: "Dom. anno B :". Cuando está
# en otro sitio, el libro pone su comienzo y a dónde ir: "Dom. anno B : Fuit homo, 569."
# Así que basta con mirar si hay ALGO detrás de los dos puntos.
#
# Se probó primero a buscar el número de folio del final, y no sirve: el escaneo lo
# destroza ("In nomine Domini, I 55-" por "155."). Esa referencia se coló como si el
# canto estuviera ahí y recortó TRES PÁGINAS de música de otros domingos. Mirar si hay
# texto detrás es inmune a eso, porque da igual cómo salga escrito.
LETRAS = re.compile(r"[A-Za-zÀ-ÿ0-9]")
MINIMO_PARA_SER_REFERENCIA = 3

# Cuánto puede separar a un rótulo de año del canto al que manda, en puntos. Van pegados
# (25-35 pt en el libro); con más distancia ya no se sabe si el canto es suyo o del
# siguiente, y poner un canto en el año que no es sería peor que no ponerlo.
CERCA_DEL_ANIO = 60

# Alto mínimo de un canto, en puntos. Sirve para no cortar un recorte por el propio
# rótulo cuando el OCR lo repite un par de líneas más abajo.
ALTO_MINIMO = 40

# Cuántos rótulos de año se aprovecharon y cuántos no. Se informa en cada corrida: lo
# que queda fuera es lo que NO se puede dar por bueno, y conviene tenerlo a la vista.
CUENTA_ANIOS = {"vistos": 0, "aplicados": 0, "sinCanto": 0}

# Cuánto pueden tocarse dos recortes sin que se considere que uno se come al otro, en
# puntos. Por debajo de esto es el roce normal del margen entre canto y canto.
SOLAPE_TOLERADO = 30


def regiones_entre(doc, p0: int, y0: float, p1: int, y1: float) -> list:
    """De (página, altura) a (página, altura), las regiones a recortar."""
    fuera = []
    for p in range(p0, min(p1 + 1, doc.page_count)):
        alto = doc[p].rect.height
        desde = max(0.0, y0) if p == p0 else 0.0
        hasta = min(y1, alto) if p == p1 else alto
        if hasta - desde > 2:
            fuera.append({"p": p, "y0": round(desde, 1), "y1": round(hasta, 1)})
    return fuera


def rotulos_crudos(pagina, cantos: list) -> list:
    """TODOS los rótulos de canto de la página, sin quitar los repetidos: [(tipo, y)].

    `rotulos_de_pagina` se queda con uno por tipo y página, y hace bien: así no se cuela
    la basura del OCR en la detección normal. Pero por eso mismo no sirve aquí — cuando
    una página trae dos comuniones, la del año B y la del C, la segunda no existe para
    ella. Esta versión las ve todas, y se usa SÓLO pegada a un rótulo de año, que es
    donde se sabe que empieza un canto de verdad.
    """
    # SIN distinguir mayúsculas, y esto es lo que hacía falta: en las páginas con dos
    # comuniones el escaneo escribe "co." en minúscula, y la detección normal —que sí
    # distingue— no veía ninguna de las dos. Aquí se puede permitir porque lo que se
    # encuentre sólo vale si cae pegado a un rótulo de año.
    texto = pagina.get_text()
    hallados = []
    for tipo, patron in cantos:
        for m in re.finditer(patron, texto, re.I):
            for caja in pagina.search_for(m.group(0)):
                hallados.append((tipo, round(caja.y0, 1)))
    # El mismo literal puede aparecer varias veces en la misma línea: se agrupa.
    fuera, vistos = [], set()
    for tipo, y in sorted(hallados, key=lambda x: x[1]):
        clave = (tipo, round(y))
        if clave in vistos:
            continue
        vistos.add(clave)
        fuera.append((tipo, y))
    return fuera


# Dónde ACABA un canto, además de en el rótulo siguiente.
#
# Un canto de año es el último de su Misa muchas veces, y entonces no hay rótulo detrás
# que lo corte: el recorte se comía las referencias a las ferias y hasta el encabezado de
# la Misa siguiente. Estas dos líneas son el final de verdad:
#
#   · el encabezado de la Misa siguiente, en mayúsculas ("HEBDOMADA TERTIA");
#   · las remisiones a los días de entre semana ("Feria 5 : Multitudo languentium, 471").
#
# El encabezado se exige como DOS PALABRAS enteras en mayúsculas ("HEBDOMADA TERTIA").
# Con un patrón más suelto —cualquier línea en mayúsculas— el ruido del escaneo pasaba
# por encabezado y cortaba el canto por la mitad: la comunión del año C perdía su último
# pentagrama.
CIERRA_LA_MISA = re.compile(
    r"^(?:Feria\s+\d|[-—]\s*\d\s*:)"
    r"|^[A-ZÁÉÍÓÚÆŒ]{3,}(?:\s+[A-ZÁÉÍÓÚÆŒ]{2,})+\s*$")


ALTO_CABECERA = 26   # alto de la cabecera corrida de la página, en puntos


def cierres_de_pagina(pagina) -> list:
    """Las alturas donde acaba un bloque de cantos en esta página.

    Se ignora la franja de arriba: ahí va la CABECERA CORRIDA ("TEMPUS PER ANNUM"), que
    tiene la misma forma que el encabezado de una Misa y se colaba como final. Con ella,
    un canto que seguía en la página siguiente se cortaba en el primer milímetro.
    """
    fuera = []
    for b in pagina.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            y = round(l["bbox"][1], 1)
            if y < ALTO_CABECERA:
                continue
            t = " ".join("".join(s["text"] for s in l["spans"]).split())
            if t and len(t) < 60 and CIERRA_LA_MISA.match(t):
                fuera.append(y)
    return sorted(fuera)


def anios_de_pagina(pagina) -> list:
    """Los rótulos de año de la página: [(y, 'AB')], sólo los que traen el canto debajo.

    Se descartan los que remiten a otro folio: ahí no empieza ningún canto, y si se
    tomaran, el año acabaría apuntando al canto siguiente, que es de otro.
    """
    fuera = []
    for b in pagina.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            t = " ".join("".join(s["text"] for s in l["spans"]).split())
            if not t or len(t) > 70:
                continue
            m = ANIO.search(t)
            if not m:
                continue
            # Si detrás de los dos puntos hay texto, el canto está en otra página.
            if len(LETRAS.findall(m.group(3) or "")) >= MINIMO_PARA_SER_REFERENCIA:
                continue
            fuera.append((round(l["bbox"][1], 1),
                          "".join(a.upper() for a in (m.group(1), m.group(2)) if a)))
    return sorted(fuera)


def recortes_de_misa(doc, desde: int, hasta: int, cantos: list,
                     anios_usados: set = None) -> tuple:
    """Las regiones a recortar de cada canto de la Misa, y las variantes por año.

    Un canto va de su rótulo al siguiente. Si el siguiente está en otra página, el
    canto sigue hasta el pie y continúa en las páginas de en medio: por eso cada canto
    guarda una LISTA de regiones, no una sola.

    LAS VARIANTES POR AÑO YA ESTABAN AQUÍ, y se tiraban. Muchos domingos del Tiempo
    Ordinario traen un canto distinto según el año del leccionario, y el libro lo avisa
    con un rótulo de texto justo encima. Como este recorrido se quedaba con el PRIMER
    canto de cada tipo y descartaba el resto, la segunda comunión —la de otro año— se
    perdía sin que nada lo dijera. Ahora, cuando un canto viene precedido de un rótulo de
    año, se guarda aparte, bajo ese año.
    """
    # Todos los rótulos del rango, en orden, con su página.
    marcas, crudas, anios = [], [], []
    for p in range(desde, hasta):
        if p >= doc.page_count:
            break
        for tipo, y in rotulos_de_pagina(doc[p], cantos):
            marcas.append({"tipo": tipo, "pagina": p, "y": y})

    # EL RÓTULO QUE CIERRA EL ÚLTIMO CANTO ESTÁ FUERA DEL RANGO.
    # Un canto va de su rótulo al siguiente, pero el último de la Misa no tenía
    # siguiente: el rango de páginas del marcador termina antes, y el canto se quedaba
    # cortado en el salto de página. El ofertorio del 26.º Domingo (Super flumina
    # Babylonis, p341) salía con dos líneas y media y el resto se perdía; reportado el
    # 24-sep-2026. La página siguiente ya se mira para las variantes por año —por esta
    # misma razón, escrita ahí abajo—, así que aquí se mira también.
    #
    # Se usa SOLO PARA CERRAR: no entra en `marcas`, porque los rótulos de esa página
    # pueden ser ya de la Misa siguiente y adoptarlos daría cantos ajenos. Basta el
    # primero, que es donde acaba lo nuestro, venga de quien venga.
    cierre_fuera_de_rango = None
    if hasta < doc.page_count:
        primeros = rotulos_de_pagina(doc[hasta], cantos)
        if primeros:
            tipo, y = primeros[0]
            cierre_fuera_de_rango = {"tipo": tipo, "pagina": hasta, "y": y}

    # Para los años se mira UNA PÁGINA MÁS, porque el último canto de una Misa suele
    # seguir en la página donde ya empieza la siguiente. Como esa página la recorren las
    # dos, se reparte por orden de lectura: el rótulo de año que ya tomó la Misa anterior
    # no lo vuelve a tomar la siguiente — está por encima de su encabezado, así que es
    # cola de la anterior.
    usados = anios_usados if anios_usados is not None else set()
    cierres = []
    for p in range(desde, min(hasta + 1, doc.page_count)):
        for tipo, y in rotulos_crudos(doc[p], cantos):
            crudas.append({"tipo": tipo, "pagina": p, "y": y})
        for y in cierres_de_pagina(doc[p]):
            cierres.append((p, y))
        for y, letras in anios_de_pagina(doc[p]):
            if (p, y) in usados:
                continue
            usados.add((p, y))
            anios.append({"pagina": p, "y": y, "anios": letras})

    porAnio = {}
    for a in anios:
        # El canto de ese año empieza en el rótulo que va JUSTO debajo del de año.
        inicio = next((c for c in crudas
                       if c["pagina"] == a["pagina"]
                       and 0 < c["y"] - a["y"] < CERCA_DEL_ANIO), None)
        CUENTA_ANIOS["vistos"] += 1
        if not inicio:
            # El rótulo está, pero debajo no arranca ningún canto: o remite a otro folio
            # (y eso ya se filtró) o el escaneo no dejó leer su abreviatura. Se cuenta
            # para saber cuánto queda fuera, que es lo que no se puede dar por bueno.
            CUENTA_ANIOS["sinCanto"] += 1
            continue
        # Y termina donde empieza lo siguiente: otro canto, otro año, o el fin de la Misa.
        # Se exige alguna distancia para no cortar por el propio rótulo repetido.
        siguientes = [(c["pagina"], c["y"]) for c in crudas
                      if (c["pagina"], c["y"]) > (inicio["pagina"], inicio["y"] + ALTO_MINIMO)]
        siguientes += [(x["pagina"], x["y"]) for x in anios
                       if (x["pagina"], x["y"]) > (inicio["pagina"], inicio["y"] + ALTO_MINIMO)]
        siguientes += [c for c in cierres
                       if c > (inicio["pagina"], inicio["y"] + ALTO_MINIMO)]
        fin = min(siguientes) if siguientes else (min(hasta, doc.page_count), 0.0)
        regiones = regiones_entre(doc, inicio["pagina"], inicio["y"] - MARGEN_ARRIBA,
                                  fin[0], fin[1] - MARGEN_ABAJO)
        if regiones:
            CUENTA_ANIOS["aplicados"] += 1
            for letra in a["anios"]:
                porAnio.setdefault(letra, {}).setdefault(inicio["tipo"], regiones)

    salida = {}
    for i, marca in enumerate(marcas):
        sig = marcas[i + 1] if i + 1 < len(marcas) else cierre_fuera_de_rango
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
        salida.setdefault(marca["tipo"], regiones)

    return salida, porAnio


def se_solapan(a: list, b: list) -> float:
    """Cuánto se pisan dos recortes, en puntos. 0 si no se tocan."""
    total = 0.0
    for ra in a or []:
        for rb in b or []:
            if ra["p"] != rb["p"]:
                continue
            total += max(0.0, min(ra["y1"], rb["y1"]) - max(ra["y0"], rb["y0"]))
    return total


def quitar_generales_que_pisan(indice: dict) -> int:
    """La versión general de un canto no puede contener la de un año.

    Cuando el libro trae un canto por año, la detección normal —que no sabe de años— se
    queda con un recorte largo que se come dos o tres de esas versiones. Si ese recorte
    queda como "general", los años sin versión propia acabarían mostrándolo: un revoltijo
    con el canto de otro año dentro. Mejor sin canto que con el canto equivocado.

    Se hace AL FINAL, sobre el índice ya completo, y no al detectar: la planilla
    rellenada a mano se aplica después y volvía a meter esos recortes largos. Aquí da
    igual de dónde venga cada uno.

    Se permite un roce pequeño: dos recortes seguidos se tocan por el margen, y eso no es
    pisarse.
    """
    quitados = 0
    for libro in indice.values():
        for misa in libro.values():
            for tipo, regiones in list(misa.get("cantos", {}).items()):
                for cantos_del_anio in (misa.get("cantosPorCiclo") or {}).values():
                    if se_solapan(regiones, cantos_del_anio.get(tipo)) > SOLAPE_TOLERADO:
                        del misa["cantos"][tipo]
                        quitados += 1
                        break
    return quitados


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


def aplicar_planilla(indice: dict, docs: dict, ruta: str, redirecciones: dict) -> dict:
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
        # Si esa Misa se fundió con otra al resolver un duplicado, se sigue el rastro:
        # lo anotado a mano vale para la celebración, no para la entrada del libro.
        vistas = set()
        while clave in redirecciones and clave not in indice[libro] and clave not in vistas:
            vistas.add(clave)
            clave = redirecciones[clave]
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
    # Claves de Misa que dejaron de existir al resolver un duplicado, y a cuál apuntan
    # ahora. La planilla va por clave y se aplica después: sin esto, sus filas se caen.
    redirecciones = {}

    for clave, libro in LIBROS.items():
        ruta = descargar(libro, args.cache)
        doc = fitz.open(ruta)
        docs[clave] = doc
        print(f"\n{libro['titulo']}: {doc.page_count} páginas")

        misas = misas_del_libro(doc)
        conMisa, sinNada = {}, []
        # Compartido por todas las Misas del libro: ver el reparto en recortes_de_misa.
        anios_usados = set()
        for m in misas:
            cantos, porAnio = recortes_de_misa(
                doc, m["desde"], m["hasta"], CANTOS_POR_LIBRO[clave], anios_usados)
            if not cantos and not porAnio:
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
            # Las variantes por año que trae el libro. El año NO se elige: lo pone la
            # fecha de la Misa, así que esto es un dato, no una opción.
            if porAnio:
                entrada["cantosPorCiclo"] = porAnio
            if celebracion:
                entrada["celebracion"] = celebracion
            # Una misma Misa puede servir a más de un domingo (ver TAMBIEN_SIRVE).
            tambien = TAMBIEN_SIRVE.get((clave, norm(m["titulo"])))
            if tambien:
                entrada["tambien"] = list(tambien)
            # Si dos entradas apuntan al mismo domingo (la semana y su hijo
            # `Dominica`, como en Cuaresma), gana la que traiga MÁS cantos.
            #
            # La que pierde deja una REDIRECCIÓN, y esto no es un detalle: la planilla
            # rellenada a mano se aplica DESPUÉS, y va por clave de Misa. Sin la
            # redirección, las filas que apuntaban a la entrada perdedora se caían —
            # pasó con Cristo Rey, donde se perdieron dos cantos anotados a mano.
            previa = next((k for k, v in conMisa.items()
                           if v.get("celebracion") == celebracion), None) if celebracion else None
            if previa and len(conMisa[previa]["cantos"]) >= len(cantos):
                redirecciones[clave_misa] = previa
                continue
            if previa:
                redirecciones[previa] = clave_misa
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
    print("")
    print(f"variantes por año: {CUENTA_ANIOS['aplicados']} de {CUENTA_ANIOS['vistos']} "
          f"rótulos ({CUENTA_ANIOS['sinCanto']} sin canto legible debajo)")

    res = aplicar_planilla(indice, docs, args.planilla, redirecciones)
    for d in docs.values():
        d.close()
    print(f"\nde la planilla: {res['aplicadas']} cantos aplicados, "
          f"{res['porCiclo']} variantes por ciclo, {res['noExisten']} marcados como inexistentes")
    for msg in res["descartadas"][:10]:
        print(f"   descartada {msg}")

    quitados = quitar_generales_que_pisan(indice)
    if quitados:
        print(f"quitadas {quitados} versiones generales que contenían la de un año")

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
  /** Otras celebraciones a las que sirve esta misma Misa ("Dominica II & III"). */
  tambien?: string[];
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
