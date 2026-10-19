#!/usr/bin/env python3
"""
Las Misas del ORDINARIO en gregoriano: Kyrie, Gloria, Sanctus y Agnus Dei.

De dónde salen: el Kyriale está DENTRO del Graduale Romanum (18 Misas, páginas 700-758
del PDF) y del Graduale Simplex (Ordinarium I-V). No hace falta ningún libro más.
De los mismos libros salen los Credos (Romanum I-VI, Simplex I-IV), los cantos ad
libitum del Romanum (Kyries, Glorias, Sanctus y Agnus sueltos) y los tonos del Padre
Nuestro de los dos libros.

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

# Partes cuya inicial el OCR no ve: (libro, Misa) → {parte: (página, altura)} donde
# empieza, medido sobre el PDF. La Misa IV del Simplex trae DOS Agnus a elegir (n.º 52 y
# 53); sin la inicial del 52, el Sanctus se lo quedaba pegado al pie (19-oct-2026).
INICIO_A_MANO = {
    ("simplex", "IV"): {"agnus": (45, 452.0)},
}

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

# El Padre Nuestro del SIMPLEX no ocupa una pagina por tono: los tres van seguidos
# (paginas 22-25 del PDF), asi que se recorta de (pagina, altura) a (pagina, altura).
# Alto del título corrido del Simplex ("AD RITUS COMMUNIONIS  9"), que el marco no reconoce.
CABECERA_SIMPLEX = 55

PATER_NOSTER_TRAMOS = {
    "simplex": {"A": ((22, 302), (23, 320)),
                "B": ((23, 345), (24, 372)),
                "C": ((24, 405), (25, 450))},
}

# Los CREDOS (18-oct-2026). El OCR de esas hojas no da una inicial fiable, asi que, como
# el Padre Nuestro, se miden sobre el PDF: de (pagina, altura) del encabezado hasta
# (pagina, altura) donde empieza el siguiente. (p, 0.0) = hasta el final de la anterior.
CREDOS = {
    "romanum": {"I":   ((759, 58),  (761, 282)),
                "II":  ((761, 325), (764, 92)),
                "III": ((764, 105), (766, 360)),
                "IV":  ((766, 365), (769, 130)),
                "V":   ((769, 140), (772, 55)),
                "VI":  ((772, 55),  (775, 0.0))},
    "simplex": {"I":   ((51, 85),   (54, 0.0)),
                "II":  ((54, 85),   (57, 0.0)),
                "III": ((57, 85),   (60, 0.0)),
                "IV":  ((60, 85),   (63, 0.0))},
}

# Los CANTUS AD LIBITUM del Romanum: Kyries, Glorias, Sanctus y Agnus sueltos, que no
# forman Misa y se cantan en lugar de los de la Misa elegida. Varios no se reimprimen
# ("Cf. supra, XI A, 748"): se recortan de donde el libro remite, y el tercer campo lo
# dice. Falta el Agnus I: el escaneo trae en blanco el pie de la pagina 786, donde
# empieza, y medio Agnus no sirve para cantar.
AD_LIBITUM = {
    "kyrie": [
        ("I",    "Clemens rector",           "",                   (775, 92),  (776, 155)),
        ("II",   "Summe Deus",               "",                   (776, 172), (777, 85)),
        ("III",  "Rector cosmi pie",         "Misa III, Kyrie A",  (711, 85),  (711, 418)),
        ("IV",   "Kyrie altissime",          "",                   (777, 140), (778, 92)),
        ("V",    "Conditor Kyrie omnium",    "Misa I, Kyrie B",    (701, 268), (702, 255)),
        ("VI",   "Te Christe rex supplices", "Misa I, Kyrie A",    (700, 272), (701, 265)),
        ("VII",  "Splendor aeterne",         "",                   (778, 145), (778, 405)),
        ("VIII", "Firmator sancte",          "",                   (778, 406), (779, 165)),
        ("IX",   "O Pater excelse",          "",                   (779, 178), (779, 405)),
        ("X",    "Orbis factor",             "Misa XI, Kyrie A",   (738, 112), (738, 310)),
        ("XI",   "Kyrie salve",              "Misa XVII, Kyrie A", (754, 225), (754, 432)),
    ],
    "gloria": [
        ("I",   "",                "",                   (780, 70),  (781, 400)),
        ("II",  "",                "",                   (781, 405), (783, 232)),
        ("III", "",                "Misa III, Gloria B", (711, 425), (713, 418)),
        ("IV",  "More ambrosiano", "",                   (783, 255), (785, 0.0)),
    ],
    "sanctus": [
        ("I",   "", "", (785, 86),  (785, 312)),
        ("II",  "", "", (785, 318), (786, 92)),
        ("III", "", "", (786, 100), (786, 395)),
    ],
    "agnus": [
        ("II",  "", "", (787, 262), (788, 0.0)),
    ],
}

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


def encabezado_de(pagina, numero: str, tope: bool = False):
    """Dónde acaba el encabezado de la Misa en su página. `None` si no se reconoce.

    Con `tope`, dónde EMPIEZA: es donde termina la Misa anterior. Cortando la anterior
    donde acaba el encabezado, el Agnus de la VIII se llevaba el «IX» de la siguiente
    (19-oct-2026).
    """
    # Sin distinguir mayúsculas: el OCR lee la «V» de la Misa V como «v».
    romano = re.compile(r"^" + re.escape(numero) + r"\b", re.IGNORECASE)
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
    return (mejor[0] if tope else mejor[1]) if mejor else None


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


def marco_de(pagina) -> tuple:
    """El marco de la página (cabecera, folio), sin comerse la última línea de letra.

    El OCR lee las notas de una pauta como basura sin minúsculas («� V �� �. �») y el
    marco compartido la tomaba por el folio: en la p. 714 el Agnus de la Misa I perdía
    el «dona nobis pacem» que va debajo (19-oct-2026). Si bajo ese supuesto folio hay
    letra cantada (minúsculas), no era el folio.
    """
    arriba, abajo = facsimil.marco_de_pagina(pagina)
    lineas = facsimil.lineas_de(pagina)
    if any(y0 > abajo and any(c.islower() for c in texto) for y0, _, texto in lineas):
        abajo = pagina.rect.height
    # En el Simplex, bajo el título corrido puede venir sólo el número de la pieza
    # («46»): son cifras sin minúsculas y el marco las tomaba por cabecera, comiéndose el
    # número y el borde de la pauta del Sanctus de la Misa III.
    if (len(lineas) >= 2 and re.fullmatch(r"\d{2,3}", lineas[1][2].strip())
            and arriba >= lineas[1][1]):
        arriba = lineas[0][1] + 2
    return arriba, abajo


def sin_restos(img):
    """Quita el renglón de letra de la parte ANTERIOR que asoma arriba de la imagen.

    Red de seguridad de `corte_en_blanco`: si aun así queda arriba un renglón pegado al
    borde, sin líneas de pauta y ancho, es la última letra de la parte anterior. El
    «XII. s.» del ángulo es angosto y no se toca. Sólo para el Romanum: en el Simplex
    ese renglón es el número de la pieza.
    """
    ancho, alto = img.size
    px = img.load()
    def tinta(y):
        return sum(1 for x in range(0, ancho, 2) if px[x, y] < 128) * 2
    filas = [tinta(y) for y in range(min(alto, 120))]
    hay = [t > max(1, ancho * 0.004) for t in filas]
    if not hay or not any(hay[:3]):
        return img
    y = 0
    while y < len(hay) and hay[y]:
        y += 1
    fin_bloque = y
    while y < len(hay) and not hay[y]:
        y += 1
    if y - fin_bloque < 6 or y >= len(hay):
        return img
    if any(t >= ancho * 0.45 for t in filas[:fin_bloque]):
        return img
    cols = [x for x in range(0, ancho, 2)
            if any(px[x, yy] < 128 for yy in range(fin_bloque))]
    if not cols or (cols[-1] - cols[0]) / ancho < 0.3:
        return img
    return img.crop((0, (fin_bloque + y) // 2, ancho, alto))


def recortar(doc, marcos, ini: tuple, fin: tuple, destino: str) -> None:
    """Recorta de (pagina, altura) a (pagina, altura) y lo guarda en `destino`."""
    regs = regiones(doc, ini, fin)
    # Estos tramos se midieron a mano, así que el fin manda: el marco automático confundía
    # el último sistema del Agnus II («dona nobis pacem») con el folio y lo cortaba. De él
    # sólo se toma la cabecera, y donde no la reconoce (el Simplex) se salta la banda fija
    # del título corrido, que si no se colaba en medio del Credo y del Pater noster.
    propios = {}
    for r in regs:
        pagina = doc[r["p"]]
        arriba, _ = facsimil.marco_de_pagina(pagina)
        if arriba == 0.0 and pagina.rect.height > 560:      # Simplex: 576 de alto
            arriba = CABECERA_SIMPLEX
        propios[r["p"]] = (arriba, pagina.rect.height)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    facsimil.coser([facsimil.trozo(doc, propios, r) for r in regs]).save(
        destino, "WEBP", lossless=True, method=6)


def corte_en_blanco(pagina, y: float, inicial: float) -> float:
    """Dónde cortar entre dos partes: justo bajo la última letra de la anterior.

    Subir una medida fija sobre la inicial caía a veces en medio de la última línea de
    letra de la parte anterior (el Gloria X perdía la mitad de «in gloria Dei Patris.
    Amen» y la otra mitad asomaba sobre el Sanctus), o la dejaba entera arriba de la
    parte nueva (19-oct-2026). El OCR de estas hojas es demasiado ruidoso para fiarse de
    él, así que se mira la imagen: se busca el tetragrama de la parte nueva y, subiendo
    por la franja CENTRAL (a la izquierda va el número de modo, a la derecha el siglo),
    el primer renglón es la letra de la anterior. Sin renglón a la vista, el corte
    queda donde estaba.
    """
    escala = 4                                       # píxeles por punto
    arriba = max(0.0, inicial - 90)
    abajo = min(pagina.rect.height, inicial + 8)     # la inicial cuelga del tetragrama
    px = pagina.get_pixmap(matrix=fitz.Matrix(escala, escala), colorspace=fitz.csGRAY,
                           clip=fitz.Rect(0, arriba, pagina.rect.width, abajo))
    datos, ancho, paso = px.samples, px.width, px.stride
    c0, c1 = int(ancho * 0.15), int(ancho * 0.62)

    def tinta(f, desde, hasta):
        return sum(1 for x in range(desde, hasta, 2) if datos[f * paso + x] < 128)

    def trazo(f):
        """El tramo continuo de tinta más largo de la fila (salvando cortes de 4 px)."""
        mejor = largo = blanco = 0
        for x in range(ancho):
            if datos[f * paso + x] < 128:
                largo += blanco + 1
                blanco = 0
            elif largo:
                blanco += 1
                if blanco > 4:
                    mejor, largo, blanco = max(mejor, largo), 0, 0
        return max(mejor, largo)

    # Una línea de pauta es un TRAZO largo; la letra, por densa que sea, no lo tiene. (Mirar
    # la tinta total confundía un renglón apretado con una línea tenue del escaneo.)
    lineas = [f for f in range(px.height) if trazo(f) >= ancho * 0.25]
    if not lineas:
        return y
    # El tetragrama nuevo: el grupo de líneas más bajo. De una a otra hay ~5-8 puntos,
    # pero alguna tenue no se detecta; entre una pauta y la siguiente hay más de 35.
    tope = lineas[-1]
    grupo = []
    for f in reversed(lineas):
        if tope - f > 20 * escala:
            break
        tope = f
        grupo.append(f)
    # Un filete suelto (el libro separa a veces las partes con una raya) no es pauta: en
    # una pauta hay otra línea a menos de 9 puntos.
    pautas = [f for f in grupo if any(0 < g - f <= 9 * escala for g in grupo)]
    if pautas:
        tope = min(pautas)
    centro = [tinta(f, c0, c1) > 0 for f in range(px.height)]
    f = tope - 1
    while f >= 0:
        while f >= 0 and centro[f]:                  # lo pegado arriba es de la nueva
            f -= 1
        g = f
        while f >= 0 and not centro[f]:
            f -= 1
        if f < 0:
            return y
        if g - f < 1 * escala:                       # un respiro de nada: sigue la nueva
            continue
        pie = f
        while f >= 0 and centro[f]:
            f -= 1
        alto = (pie - f) / escala
        if 3 <= alto <= 14:                          # un renglón de letra (con tildes)
            filetes = [r for r in lineas if pie < r < tope - 18 * escala]
            if filetes:                              # y el filete, con la letra de arriba
                return round(arriba + (max(filetes) + 2) / escala, 1)
            # En medio del blanco que la separa de lo primero que haya debajo (en todo el
            # ancho: el «XII. s.» del ángulo va a veces pegado a esa letra).
            sig = pie + 1
            while sig < tope and tinta(sig, 0, ancho) == 0:
                sig += 1
            return round(arriba + (pie + 1 + sig) / 2 / escala, 1)
        if alto > 14:                                # otra pauta: no se ve la letra
            return y
    return y


def sobre_el_numero(pagina, y: float, inicial: float) -> float:
    """En el Simplex cada pieza lleva su número encima («52  ed. Vat. ad lib. II»).

    El corte fijo lo partía por la mitad: medio número al pie de la parte anterior y
    medio arriba de la suya (19-oct-2026). El OCR lo lee bien, así que se corta justo
    encima de él.
    """
    arriba = []
    for y0, _, texto in facsimil.lineas_de(pagina):
        if not inicial - 60 < y0 < inicial - 10:
            continue
        if re.search(r"[A-Z]{4}", texto):            # el título corrido («29 ORDINARIUM»)
            continue
        if re.match(r"^\d{2,3}\b", texto.strip()):
            arriba.append(y0 - 3)
        # A veces el OCR pega el número a la basura de la pauta («G�--f--- 57»); el
        # «ed. Vat. X» de la derecha va a su altura, con letra más chica.
        elif re.search(r"ed\.\s*Vat|more\s+\w", texto):
            arriba.append(y0 - 6)
    if arriba:
        return round(min(arriba), 1)
    # Sin número legible (el «56» de la Misa V no sale en el OCR): justo bajo la última
    # letra de la parte anterior, que sí se lee; el número está entre ella y la pauta.
    pies = [y1 for y0, y1, texto in facsimil.lineas_de(pagina)
            if inicial - 70 < y1 < inicial - 15 and y1 - y0 <= 18
            and sum(c.islower() for c in texto) >= 3]
    return round(min(y, max(pies) + 2), 1) if pies else y


def misas_del_libro(doc, libro: str) -> list:
    """Las Misas del Kyriale, con el rango de cada una de sus partes."""
    cfg = KYRIALE[libro]
    marcadores = [(" ".join(str(e[1]).replace("—", "-").split()), e[2])
                  for e in doc.get_toc(simple=False)
                  if e[0] == cfg["nivel"] and cfg["desde"] <= e[2] < cfg["hasta"]]
    todas = [(p + 1, y, n) for p in range(cfg["desde"] - 1, cfg["hasta"] - 1)
             for y, n in iniciales_de(doc[p])]

    # El comienzo de cada Misa: su encabezado, no su primera inicial.
    arranques, topes = [], []
    for titulo, pagina in marcadores:
        numero = numero_de(titulo)
        y = encabezado_de(doc[pagina - 1], numero)
        arranques.append((pagina, y if y is not None else 0.0))
        t = encabezado_de(doc[pagina - 1], numero, tope=True)
        # Un poco por encima del numeral, que el renglón del PDF lo recorta justo.
        topes.append((pagina, max(t - 4, 0.0) if t is not None else 0.0))

    salida = []
    for i, (titulo, pagina) in enumerate(marcadores):
        numero = numero_de(titulo)
        ini = arranques[i]
        fin = topes[i + 1] if i + 1 < len(marcadores) else (cfg["hasta"], 0.0)

        # Cada parte empieza en su inicial, después de la parte anterior.
        cortes, desde = [], ini
        a_mano = INICIO_A_MANO.get((libro, numero), {})
        for parte in PARTES[1:]:                  # el Kyrie empieza en el encabezado
            if parte in a_mano:
                cortes.append((parte, a_mano[parte]))
                desde = a_mano[parte]
                continue
            sig = next(((p, y) for p, y, n in todas
                        if n == parte and desde <= (p, y) < fin), None)
            if sig:
                # Se sube por encima del tetragrama, sin llegar a morder la parte
                # anterior (en el peor caso el corte se queda donde estaba).
                corte = sig[1] - SOBRE_EL_TETRAGRAMA
                if libro == "romanum":
                    corte = corte_en_blanco(doc[sig[0] - 1], corte, sig[1])
                else:
                    corte = sobre_el_numero(doc[sig[0] - 1], corte, sig[1])
                arriba = (sig[0], max(corte,
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

CABECERA_CREDO = """
/** Un Credo del libro. La imagen es /kyriale/<libro>/credo/<numero>.webp */
export interface CredoKyriale {
  /** Numero romano con que el libro lo nombra ("III"). */
  numero: string;
  /** Pagina del PDF donde empieza. */
  pagina: number;
}

export const CREDO_DATA: Record<string, readonly CredoKyriale[]> =
"""

CABECERA_AD_LIBITUM = """
/**
 * Un canto "ad libitum" del Romanum: un Kyrie, Gloria, Sanctus o Agnus suelto, que no
 * forma Misa. La imagen es /kyriale/romanum/ad-libitum/<parte>/<numero>.webp
 */
export interface PiezaAdLibitum {
  numero: string;
  /** Nombre tradicional ("Clemens rector"); vacio si el libro no le da uno. */
  nombre: string;
  /** Cuando el libro no lo reimprime y remite a una Misa ("Misa XI, Kyrie A"). */
  ref: string;
  pagina: number;
}

export const AD_LIBITUM_DATA: Record<string, readonly PiezaAdLibitum[]> =
"""


def main():
    catalogo, paters, credos, sueltas = {}, {}, {}, {}
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
                            marcos[r["p"]] = marco_de(doc[r["p"]])
                    trozos = [facsimil.trozo(doc, marcos, r) for r in regs]
                    carpeta = os.path.join(SALIDA, libro, clave)
                    os.makedirs(carpeta, exist_ok=True)
                    destino = os.path.join(carpeta, f"{parte}.webp")
                    imagen = facsimil.coser(trozos)
                    if libro == "romanum" and parte != "kyrie":
                        imagen = sin_restos(imagen)
                    imagen.save(destino, "WEBP", lossless=True, method=6)
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
                marcos.setdefault(r["p"], marco_de(doc[r["p"]]))
                carpeta = os.path.join(SALIDA, libro, "pater")
                os.makedirs(carpeta, exist_ok=True)
                destino = os.path.join(carpeta, f"{tono}.webp")
                facsimil.coser([facsimil.trozo(doc, marcos, r)]).save(
                    destino, "WEBP", lossless=True, method=6)
                tonos.append({"tono": tono, "pagina": pagina})
            except Exception as e:                # noqa: BLE001
                fallos.append(f"pater/{tono}: {e}")
        for tono, (ini, fin) in PATER_NOSTER_TRAMOS.get(libro, {}).items():
            try:
                recortar(doc, marcos, ini, fin,
                         os.path.join(SALIDA, libro, "pater", f"{tono}.webp"))
                tonos.append({"tono": tono, "pagina": ini[0]})
            except Exception as e:                # noqa: BLE001
                fallos.append(f"pater/{tono}: {e}")
        if tonos:
            print(f"[{libro}] Padre Nuestro: {len(tonos)} tonos")

        # Los Credos: uno por imagen, en /kyriale/<libro>/credo/<numero>.webp
        hechos = []
        for numero, (ini, fin) in CREDOS.get(libro, {}).items():
            try:
                recortar(doc, marcos, ini, fin,
                         os.path.join(SALIDA, libro, "credo", f"{numero}.webp"))
                hechos.append({"numero": numero, "pagina": ini[0]})
            except Exception as e:                # noqa: BLE001
                fallos.append(f"credo/{numero}: {e}")
        credos[libro] = hechos
        print(f"[{libro}] Credo: {len(hechos)}")

        # Los cantos ad libitum (solo el Romanum los trae).
        if libro == "romanum":
            for parte, piezas in AD_LIBITUM.items():
                lista = []
                for numero, nombre, ref, ini, fin in piezas:
                    try:
                        recortar(doc, marcos, ini, fin, os.path.join(
                            SALIDA, libro, "ad-libitum", parte, f"{numero}.webp"))
                        lista.append({"numero": numero, "nombre": nombre, "ref": ref,
                                      "pagina": ini[0]})
                    except Exception as e:        # noqa: BLE001
                        fallos.append(f"ad-libitum/{parte}/{numero}: {e}")
                sueltas[parte] = lista
            print(f"[{libro}] ad libitum: "
                  + ", ".join(f"{p} {len(l)}" for p, l in sueltas.items()))

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
        + " as const;" + chr(10)
        + CABECERA_CREDO + json.dumps(credos, ensure_ascii=False, indent=1)
        + " as const;" + chr(10)
        + CABECERA_AD_LIBITUM + json.dumps(sueltas, ensure_ascii=False, indent=1)
        + " as const;" + chr(10))
    print(f"indice: {os.path.getsize(DATOS) // 1024} KB")


if __name__ == "__main__":
    main()
