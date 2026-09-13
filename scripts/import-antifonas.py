"""Importa las antífonas de entrada y comunión del Misal y regenera
src/data/antiphonIndex.data.ts.

FUENTE
Los propios del año, publicados en PDF por liturgiapapal.org, uno por tiempo
litúrgico. Cada celebración trae, en este orden: antífona de entrada, oración
colecta, oración sobre las ofrendas, antífona de comunión, oración después de la
comunión. La antífona suele venir con su cita ("Cf. Sal 65, 4") y la de comunión
a menudo trae una segunda opción tras un "O bien:".

POR QUÉ UN IMPORTADOR Y NO TECLEARLO
Son más de 80 celebraciones con dos antífonas cada una. Tecleadas se cometen
erratas en un texto litúrgico, y no habría forma de rehacerlas cuando el sitio
corrija algo. El archivo generado NO se edita a mano: se corrige aquí y se vuelve
a correr.

Uso:  .venv/Scripts/python.exe scripts/import-antifonas.py [--cache DIR]
      (baja los PDF si no están en el cache; por defecto, tmp/antifonas)
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

BASE = "https://liturgiapapal.org/attachments/article/1029"
TIEMPOS = ["Adviento", "Navidad", "Cuaresma", "Triduo", "Pascua", "Ordinario"]
OUT = "src/data/antiphonIndex.data.ts"
CALENDARIO = "src/data/liturgicalCalendar.generated.json"

ROMANOS = {
    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8,
    "IX": 9, "X": 10, "XI": 11, "XII": 12, "XIII": 13, "XIV": 14, "XV": 15,
    "XVI": 16, "XVII": 17, "XVIII": 18, "XIX": 19, "XX": 20, "XXI": 21,
    "XXII": 22, "XXIII": 23, "XXIV": 24, "XXV": 25, "XXVI": 26, "XXVII": 27,
    "XXVIII": 28, "XXIX": 29, "XXX": 30, "XXXI": 31, "XXXII": 32, "XXXIII": 33,
    "XXXIV": 34,
}

# El PDF y la app nombran distinto varias celebraciones. Igual que CELEBRATION_ALIASES
# en psalmIndex.ts: título del PDF (normalizado) → nombre de la celebración en la app.
ALIAS = {
    "el santisimo cuerpo y sangre de cristo": "Corpus Christi",
    "la santisima trinidad": "Santísima Trinidad",
    "nuestro senor jesucristo rey del universo": "Jesucristo, Rey del Universo",
    "sagrado corazon de jesus": "Sagrado Corazón de Jesús",
    "domingo de pentecostes": "Pentecostés",
    "sagrada familia jesus maria y jose": "Sagrada Familia",
    "domingo segundo despues de navidad": "2.º Domingo después de Navidad",
    "la ascension del senor": "Ascensión del Señor",
    "solemnidad de santa maria madre de dios": "Santa María, Madre de Dios",
    "la transfiguracion del senor": "Transfiguración del Señor",
    "la sagrada familia de jesus maria y jose": "Sagrada Familia",
    "domingo de ramos en la pasion del senor": "Domingo de Ramos",
}

# Excepciones de estructura: la antífona no cuelga del título de la celebración.
#
# El Domingo de Resurrección es el caso: su bloque empieza con las rúbricas de la
# Vigilia (páginas de instrucciones, sin antífona), y la antífona de la Misa del día
# aparece bajo el subtítulo "LITURGIA EUCARÍSTICA". Sin esto, el domingo más
# importante del año se quedaba fuera.
ALIAS_POR_TIEMPO = {
    ("Pascua", "liturgia eucaristica"): "Domingo de Resurrección",
}

# Subtítulos que NO son celebraciones: partes de un rito, dentro de otro bloque.
SUBTITULOS = {
    "liturgia de la palabra",
    "liturgia bautismal",
    "lucernario o solemne comienzo de la vigilia",
}


def norm(s: str) -> str:
    """Igual que normKey en psalmIndex.ts: sin acentos, sin puntuación, minúsculas."""
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def titulo_a_nombre(titulo: str, tiempo: str = "") -> str:
    """'II DOMINGO DEL TIEMPO ORDINARIO' → '2.º Domingo del Tiempo Ordinario'."""
    t = " ".join(titulo.split())
    n = norm(t)
    if (tiempo, n) in ALIAS_POR_TIEMPO:
        return ALIAS_POR_TIEMPO[(tiempo, n)]
    if n in ALIAS:
        return ALIAS[n]
    m = re.match(r"^([IVXL]+)\s+DOMINGO\s+(.*)$", t, re.I)
    if m and m.group(1).upper() in ROMANOS:
        resto = m.group(2).strip().lower()
        resto = resto.replace("del tiempo ordinario", "del Tiempo Ordinario")
        resto = resto.replace("de adviento", "de Adviento")
        resto = resto.replace("de cuaresma", "de Cuaresma")
        resto = resto.replace("de pascua", "de Pascua")
        return f"{ROMANOS[m.group(1).upper()]}.º Domingo {resto}"
    return t


# Rúbricas que el Misal imprime junto a la antífona pero NO son la antífona: se
# cantan menos que nunca. Si se quedan pegadas, el folleto del pueblo termina
# diciendo "…por los siglos de los siglos. Se dice Gloria".
RUBRICAS = re.compile(
    r"\s*(?:(?:No\s+)?[Ss]e\s+dice\s+(?:el\s+)?(?:Gloria|Credo)"
    r"|Se\s+omite\s+el\s+(?:Gloria|Credo)"
    r"|Esta\s+ant[ií]fona\s+se\s+dice[^.]*)\.?\s*$"
)


def limpiar(texto: str, quitar_numero: bool = True) -> str:
    """Une los saltos de línea del PDF y quita lo que no es la antífona.

    `quitar_numero` se apaga para las CITAS: una cita termina justo en un número
    (`Cf. Sal 65, 4`) y la limpieza del número de página se le comía el versículo.
    """
    t = texto.replace("­", "")
    t = re.sub(r"_{5,}", " ", t)
    t = " ".join(t.split())
    # Número de página suelto al final del bloque (el PDF los intercala).
    if quitar_numero:
        t = re.sub(r"\s+\d{1,3}$", "", t)
    # Puede haber varias rúbricas encadenadas ("Se dice Gloria. Se dice Credo").
    anterior = None
    while anterior != t:
        anterior = t
        t = RUBRICAS.sub("", t).strip()
        if quitar_numero:
            t = re.sub(r"\s+\d{1,3}$", "", t)
    return t.strip(" .;·-")


# Cita bíblica: 'Cf. Sal 65, 4', 'Ap 5, 12; 1, 6', '1 Jn 4, 16', 'Cf. Rom 5, 5; 8, 11'.
# Admite el punto y coma y los tramos encadenados, que antes cortaban la cita por la
# mitad y dejaban el resto ("12; 1, 6") pegado al principio del texto.
CITA = re.compile(
    r"^((?:Cf\.?\s*)?(?:[1-3]\s*)?[A-ZÁÉÍÓÚ][a-záéíóúñ]{1,12}\.?"
    r"\s*\d+\s*,?[\d,;\s\.\-–ab]*?)(?=[A-ZÁÉÍÓÚ«¡¿])(.*)$",
    re.S,
)


def partir_cita(bloque: str):
    """Separa la cita bíblica del texto: 'Cf. Sal 65, 4 Que se postre…'."""
    b = limpiar(bloque)
    m = CITA.match(b)
    if m and len(m.group(1)) <= 40:
        return limpiar(m.group(1), quitar_numero=False), limpiar(m.group(2))
    return "", b


def partir_o_bien(bloque: str):
    """Las antífonas traen a menudo una segunda opción tras un 'O bien:'."""
    partes = re.split(r"\bO\s+bien\s*:?", bloque)
    return [p for p in (partir_cita(x) for x in partes) if p[1]]


def descargar(tiempo: str, cache: str) -> str:
    os.makedirs(cache, exist_ok=True)
    destino = os.path.join(cache, f"{tiempo}.pdf")
    if not os.path.exists(destino):
        print(f"  bajando {tiempo}.pdf…")
        urllib.request.urlretrieve(f"{BASE}/{tiempo}.pdf", destino)
    return destino


# Un título de celebración es una línea en mayúsculas. Se admite comillas y paréntesis
# porque los llevan varios ("DOMINGO DE RAMOS 'EN LA PASIÓN DEL SEÑOR'").
TITULO = re.compile(
    r"^[ \t]*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9 \.,:;ºI\"'“”()\-]{6,80})[ \t]*$", re.M
)


# El PREFACIO va impreso entero entre la oración sobre las ofrendas y la antífona de
# comunión, y lleva su propio título en mayúsculas ("LAS TENTACIONES DEL SEÑOR", "EL
# MISTERIO DE LA SANTÍSIMA TRINIDAD"). Como cualquier línea en mayúsculas abre bloque,
# la antífona de comunión caía DENTRO del prefacio y se perdía: se quedaban sin ella los
# cinco domingos de Cuaresma, la Santísima Trinidad, el Sagrado Corazón y Cristo Rey.
# Se reconocen porque vienen justo después de la palabra "Prefacio".
PREFACIO = re.compile(
    r"(Prefacio\s*(?:[IVX]+|\d+)?\s*\n+[ \t]*)"
    r"([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9 \.,:;ºI\"'“”()\-]{6,80})(?=[ \t]*\n)"
)


def extraer(pdf: str, tiempo: str) -> dict:
    doc = fitz.open(pdf)
    texto = "\n".join(doc[i].get_text() for i in range(doc.page_count))
    # El título del prefacio deja de parecer un título de celebración.
    texto = PREFACIO.sub(lambda m: m.group(1) + m.group(2).capitalize(), texto)
    piezas = TITULO.split(texto)
    salida = {}
    # Un título puede venir partido en dos líneas ("NUESTRO SEÑOR JESUCRISTO," +
    # "REY DEL UNIVERSO"): se arrastra el anterior si el bloque entre ambos es vacío.
    arrastre = ""
    for i in range(1, len(piezas) - 1, 2):
        titulo, cuerpo = " ".join(piezas[i].split()), piezas[i + 1]
        if not cuerpo.strip():
            arrastre = f"{arrastre} {titulo}".strip()
            continue
        titulo = f"{arrastre} {titulo}".strip() if arrastre else titulo
        arrastre = ""
        # Un subtítulo de rito no abre celebración, salvo que sea una excepción
        # conocida (la Misa del día de Pascua cuelga de "LITURGIA EUCARÍSTICA").
        if norm(titulo) in SUBTITULOS and (tiempo, norm(titulo)) not in ALIAS_POR_TIEMPO:
            continue

        ent = re.search(
            r"Ant[ií]fona de entrada(.*?)(?=Oraci[óo]n colecta|Ant[ií]fona de comuni|\Z)",
            cuerpo, re.S)
        com = re.search(
            r"Ant[ií]fona de comuni[óo]n(.*?)(?=Oraci[óo]n despu[ée]s|Ant[ií]fona de entrada|\Z)",
            cuerpo, re.S)
        if not ent and not com:
            continue

        entradas = partir_o_bien(ent.group(1)) if ent else []
        opciones = partir_o_bien(com.group(1)) if com else []
        if not entradas and not opciones:
            continue

        nombre = titulo_a_nombre(titulo, tiempo)
        entry = {"tiempo": tiempo, "titulo": titulo}
        if entradas:
            entry["entrada"] = entradas[0][1]
            if entradas[0][0]:
                entry["entradaCita"] = entradas[0][0]
            if len(entradas) > 1:
                entry["entradaAlt"] = entradas[1][1]
                if entradas[1][0]:
                    entry["entradaAltCita"] = entradas[1][0]
        if opciones:
            entry["comunion"] = opciones[0][1]
            if opciones[0][0]:
                entry["comunionCita"] = opciones[0][0]
            if len(opciones) > 1:
                entry["comunionAlt"] = opciones[1][1]
                if opciones[1][0]:
                    entry["comunionAltCita"] = opciones[1][0]
        # El primero gana: dentro de un tiempo, el título más específico va antes.
        salida.setdefault(nombre, entry)
    return salida


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", default=os.path.join("tmp", "antifonas"))
    args = ap.parse_args()

    todo = {}
    for tiempo in TIEMPOS:
        pdf = descargar(tiempo, args.cache)
        parcial = extraer(pdf, tiempo)
        print(f"  {tiempo:10} {len(parcial):3} celebraciones")
        for k, v in parcial.items():
            todo.setdefault(k, v)

    # ── Cobertura contra el calendario de la app ────────────────────────────
    cal = json.load(io.open(CALENDARIO, encoding="utf-8"))
    celebs = sorted({x["name"] for x in cal})
    indice = {norm(k): k for k in todo}
    cubiertas = [c for c in celebs if norm(c) in indice]
    faltan = [c for c in celebs if norm(c) not in indice]

    print(f"\ncelebraciones con antifona: {len(todo)}")
    print(f"del calendario, cubiertas:  {len(cubiertas)} de {len(celebs)}")
    if faltan:
        print("sin antifona (normal en el santoral, que no esta en estos PDF):")
        for c in faltan[:40]:
            print(f"   - {c}")

    # ── Archivo generado ───────────────────────────────────────────────────
    filas = []
    for nombre in sorted(todo):
        e = todo[nombre]
        campos = []
        for clave in ("entrada", "entradaCita", "entradaAlt", "entradaAltCita",
                      "comunion", "comunionCita", "comunionAlt", "comunionAltCita"):
            if e.get(clave):
                campos.append(f"{clave}: {json.dumps(e[clave], ensure_ascii=False)}")
        filas.append(f"  {json.dumps(nombre, ensure_ascii=False)}: {{ {', '.join(campos)} }},")

    cabecera = f"""// ARCHIVO GENERADO por scripts/import-antifonas.py — NO editar a mano.
// Antífonas de entrada y de comunión del Misal, por celebración.
// Fuente: los propios del año en PDF de liturgiapapal.org ({', '.join(TIEMPOS)}).
// Para corregir algo, se arregla el importador y se vuelve a correr.
export interface AntiphonEntryData {{
  entrada?: string;
  entradaCita?: string;
  /** Segunda opción de la antífona de entrada ("O bien" en el Misal). */
  entradaAlt?: string;
  entradaAltCita?: string;
  comunion?: string;
  comunionCita?: string;
  /** Segunda opción de la antífona de comunión ("O bien" en el Misal). */
  comunionAlt?: string;
  comunionAltCita?: string;
}}

export const ANTIPHON_INDEX_DATA: Record<string, AntiphonEntryData> = {{
"""
    io.open(OUT, "w", encoding="utf-8").write(cabecera + "\n".join(filas) + "\n};\n")
    print(f"\nescrito {OUT} ({len(filas)} celebraciones)")


if __name__ == "__main__":
    main()
