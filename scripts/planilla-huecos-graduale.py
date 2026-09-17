"""Planilla rellenable con los huecos del Graduale.

Una fila por HUECO (celebración × canto que falta), que es la unidad de trabajo real.
Lo que ya se sabe viene puesto; solo hay tres celdas que rellenar por fila, y una
cuarta para los casos en que el canto sencillamente no existe en esa Misa.

Misma idea que la planilla del índice de salmos: la persona trabaja en Excel y un
importador lee el resultado, sin tocar código.

Uso:  .venv/Scripts/python.exe scripts/planilla-huecos-graduale.py
"""
import io
import json
import os

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

INDICE = "src/data/gradualeIndex.data.ts"
SALIDA = os.path.join("tmp", "graduale-revision", "Huecos-Graduale.xlsx")

# Los cinco cantos propios que la app pone a disposición. El TRACTO no está: es la
# forma cuaresmal del Aleluya y ocupa su mismo hueco (ver import-graduale.py).
TIPOS = ["introitus", "graduale", "alleluia", "offertorium", "communio"]
ALTERNATIVOS = set()
ALTO_PUNTOS = {"romanum": 519, "simplex": 576}
DPI_IMAGENES = 120
ALTO_PIXELES = {k: round(v * DPI_IMAGENES / 72) for k, v in ALTO_PUNTOS.items()}

# NO SE MIDE: SE SEÑALA POR DÓNDE.
#
# Pedir píxeles obligaba a medir sobre una imagen con alguna herramienta, y eso es
# trabajo inventado: el recorte lleva margen de sobra, así que basta con decir si el
# canto empieza a un tercio, a la mitad o a tres cuartos de la página. Se elige de una
# lista y el importador convierte.
#
# La resolución es de un doceavo de página (~7%), que es más fina que el margen que se
# le añade al recorte, así que señalar "más o menos por aquí" siempre alcanza.
POSICIONES = [
    ("arriba del todo", 0.0),
    ("1/6", 1 / 6),
    ("1/4", 0.25),
    ("1/3", 1 / 3),
    ("a la mitad", 0.5),
    ("2/3", 2 / 3),
    ("3/4", 0.75),
    ("5/6", 5 / 6),
    ("al final", 1.0),
]
ETIQUETAS_POSICION = [e for e, _ in POSICIONES]

AZUL = "1F3864"
RELLENAR = PatternFill("solid", fgColor="FFF2CC")   # ámbar: lo que hay que escribir
DADO = PatternFill("solid", fgColor="EDEDED")       # gris: ya viene puesto
CABECERA = PatternFill("solid", fgColor=AZUL)
BORDE = Border(*[Side(style="thin", color="BFBFBF")] * 4)


def cargar() -> dict:
    t = io.open(INDICE, encoding="utf-8").read()
    i = t.index("GRADUALE_INDEX_DATA")
    i = t.index("{", t.index("=", i))
    return json.loads(t[i:t.rindex("} as const;") + 1])


def faltantes(cantos: dict) -> list:
    tiene = set(cantos)
    return [t for t in TIPOS
            if t not in tiene
            and not any(t in par and (set(par) & tiene) for par in ALTERNATIVOS)]


def paginas_de(misa: dict) -> list:
    paginas = {r["p"] for regiones in misa["cantos"].values() for r in regiones}
    if not paginas:
        paginas = {misa["pagina"] - 1}
    return sorted({p + 1 for p in paginas} | {max(paginas) + 2})


COLUMNAS = [
    ("Libro", 10),
    ("Celebración", 34),
    ("Canto que falta", 15),
    ("Páginas donde mirar", 20),
    ("Ya encontrado en esta Misa", 34),
    ("→ EMPIEZA\nen la página", 14),
    ("→ EMPIEZA\npor dónde", 18),
    ("→ TERMINA\nen la página\n(si es otra)", 15),
    ("→ TERMINA\npor dónde", 18),
    ("→ Ciclo\n(A, B o C)", 13),
    ("→ No existe", 12),
    ("Notas", 26),
    ("clave (no tocar)", 30),
]


def hoja_instrucciones(wb: Workbook) -> None:
    ws = wb.create_sheet("Instrucciones", 0)
    ws.column_dimensions["A"].width = 100
    textos = [
        ("Cómo rellenar esta planilla", True),
        ("", False),
        ("Cada fila es UN canto que no se encontró en el escaneo. Las columnas grises ya", False),
        ("vienen puestas; solo hay que rellenar las ámbar, marcadas con →.", False),
        ("", False),
        ("Las imágenes están en esta misma carpeta, en romanum/ y simplex/, una por página", False),
        ("y numeradas (p0056__...png = página 56). Sobre cada una va marcado EN VERDE lo que", False),
        ("ya se encontró, con su altura. Solo hay que buscar lo que falta.", False),
        ("", False),
("EMPIEZA en la página   el número del NOMBRE DEL ARCHIVO de la imagen:", False),
        ("                       p0056__hebdomada-quinta-paschae.png  ->  escribe 56", False),
        ("", False),
        ("                       NO uses el número impreso en la esquina de la página del", False),
        ("                       libro: son distintos y el desfase NO es constante.", False),
        ("", False),
        ("EMPIEZA por dónde      se ELIGE DE LA LISTA (arriba, 1/3, a la mitad, 2/3…).", False),
        ("                       No hay que medir nada: basta con señalar más o menos por", False),
        ("                       dónde, porque el recorte lleva margen de sobra.", False),
        ("", False),
        ("TERMINA en la página   SOLO si el canto sigue en la página SIGUIENTE. Si empieza y", False),
        ("                       termina en la misma, déjala vacía.", False),
        ("TERMINA por dónde      dónde acaba. Si se deja vacío, el canto llega hasta el canto", False),
        ("                       siguiente o hasta el pie de la página.", False),
        ("", False),
        ("Ciclo                  SOLO si el libro marca 'anno A', 'anno B' o 'anno C'", False),
        ("                       junto a ese canto. Vacío = sirve para los tres años.", False),
        ("", False),
        ("                       Cuando un canto tiene variante por ciclo, se rellena UNA", False),
        ("                       FILA POR CADA AÑO que aparezca: se duplica la fila a mano", False),
        ("                       (copiar y pegar) y se cambia el ciclo y la posición.", False),
        ("                       Lo urgente es el AÑO A, que es el que viene.", False),
        ("", False),
        ("No existe              una X si ese canto no está en esa Misa.", False),
        ("", False),
        ("Un canto que cruza de página", True),
        ("Pasa a menudo: empieza en el último tercio de una página y termina en el primer", False),
        ("tercio de la siguiente. Se anota así:", False),
        ("", False),
        ("   EMPIEZA en la página 56   EMPIEZA por dónde: 2/3", False),
        ("   TERMINA en la página 57   TERMINA por dónde: 1/3", False),
        ("", False),
        ("El programa recorta desde esa altura hasta el pie de la 56, sigue por las páginas", False),
        ("de en medio si las hubiera, y termina en el primer tercio de la 57. No hay que", False),
        ("hacer nada más ni partirlo en dos filas.", False),
        ("", False),
        ("No hace falta puntería", True),
        ("El recorte se hace con margen, así que señalar 'más o menos por aquí' alcanza.", False),
        ("Ante la duda, tira hacia afuera: es mejor que sobre un poco de la página que", False),
        ("cortar el canto por la mitad.", False),
        ("", False),
        ("Las líneas verdes de las imágenes marcan lo que ya se encontró. Sirven de", False),
        ("referencia visual: ignora el número que llevan escrito y fíjate solo en dónde", False),
        ("cae la línea.", False),
        ("", False),
        ("El Aleluya en Cuaresma", True),
        ("En Cuaresma no se canta el Aleluya: en su lugar va el TRACTO, rotulado 'TR.' en", False),
        ("el libro. Ocupa el mismo sitio de la Misa, así que va en la misma fila: si en la", False),
        ("página ves un 'TR.', eso ES el aleluya de ese domingo. No hace falta distinguirlo.", False),
        ("", False),
        ("Por dónde empezar", True),
        ("Ordena por 'Celebración' y empieza por las que tienen una sola fila: se cierran", False),
        ("rápido y la cobertura sube enseguida.", False),
    ]
    for i, (texto, negrita) in enumerate(textos, start=1):
        c = ws.cell(row=i, column=1, value=texto)
        c.font = Font(bold=negrita, size=13 if negrita else 11,
                      color=AZUL if negrita else "000000")


def etiqueta_mas_cercana(fraccion: float) -> str:
    """La posición de la lista que mejor describe una fracción de página."""
    return min(POSICIONES, key=lambda x: abs(x[1] - fraccion))[0]


def previos(ruta: str) -> dict:
    """Lo ya rellenado en una planilla anterior, por (libro, clave, canto).

    Se empareja por CONTENIDO y no por número de fila: entre una versión y otra las
    filas se mueven (al quitar el tracto desaparecieron 51), y casar por posición
    habría mezclado los datos de unas celebraciones con otras.

    MIGRA la planilla vieja, la que pedía PÍXELES en dos columnas (y0, y1). Se detecta
    por su cabecera y se convierte a la posición equivalente de la lista. Sin esto, un
    "500" iría a parar a una celda que ahora espera "a la mitad", y el trabajo ya hecho
    se perdería sin avisar.
    """
    if not ruta or not os.path.exists(ruta):
        return {}
    from openpyxl import load_workbook
    ws = load_workbook(ruta, data_only=True)["Huecos"]
    cabecera7 = str(ws.cell(row=1, column=7).value or "")
    formato_viejo = "PÍXELES" in cabecera7 or "y0" in cabecera7
    # Cada versión de la planilla añadió una columna, así que la clave se ha ido
    # corriendo. Se localiza por la cabecera en vez de por un número fijo.
    col_clave = 11 if formato_viejo else (
        13 if str(ws.cell(row=1, column=10).value or "").startswith("→ Ciclo") else 12)

    guardado = {}
    for r in range(2, ws.max_row + 1):
        libro = ws.cell(row=r, column=1).value
        canto = ws.cell(row=r, column=3).value
        clave = ws.cell(row=r, column=col_clave).value
        if not libro or not clave:
            continue

        if formato_viejo:
            pagina, y0, y1, noexiste, notas = [
                ws.cell(row=r, column=c).value for c in (6, 7, 8, 9, 10)]
            alto = ALTO_PIXELES.get(libro, 866)
            # En el formato viejo y1 era de la MISMA página, así que la de término
            # queda vacía: el canto no cruzaba.
            datos = [
                pagina,
                etiqueta_mas_cercana(y0 / alto) if isinstance(y0, (int, float)) else None,
                None,
                etiqueta_mas_cercana(y1 / alto) if isinstance(y1, (int, float)) else None,
                None,       # ciclo: no existía en aquella versión
                noexiste,
                notas,
            ]
        elif col_clave == 13:
            datos = [ws.cell(row=r, column=c).value for c in (6, 7, 8, 9, 10, 11, 12)]
        else:
            # Planilla sin columna de ciclo: se inserta vacía en su sitio.
            v = [ws.cell(row=r, column=c).value for c in (6, 7, 8, 9, 10, 11)]
            datos = v[:4] + [None] + v[4:]

        if any(x not in (None, "") for x in datos):
            guardado[(libro, clave, canto)] = datos
    return guardado


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--previo", default=os.path.join(
        os.path.expanduser("~"), "Desktop", "Huecos-Graduale.xlsx"),
        help="planilla anterior de la que conservar lo ya rellenado")
    args = ap.parse_args()
    anteriores = previos(args.previo)

    d = cargar()
    wb = Workbook()
    ws = wb.active
    ws.title = "Huecos"

    for j, (titulo, ancho) in enumerate(COLUMNAS, start=1):
        c = ws.cell(row=1, column=j, value=titulo)
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = CABECERA
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        ws.column_dimensions[get_column_letter(j)].width = ancho
    ws.row_dimensions[1].height = 30
    ws.freeze_panes = "A2"

    fila = 2
    for libro in ("romanum", "simplex"):
        pendientes = [(k, v) for k, v in d[libro].items()
                      if v.get("celebracion") and faltantes(v["cantos"])]
        pendientes.sort(key=lambda x: x[1]["pagina"])
        for clave, misa in pendientes:
            encontrado = ", ".join(
                f"{t} y={int(r[0]['y0'])}" for t, r in sorted(misa["cantos"].items())
            ) or "(ninguno)"
            paginas = ", ".join(str(p) for p in paginas_de(misa))
            for tipo in faltantes(misa["cantos"]):
                ya = anteriores.get((libro, clave, tipo), [None] * 7)
                valores = [libro, misa["celebracion"], tipo, paginas, encontrado,
                           *ya, clave]
                for j, v in enumerate(valores, start=1):
                    c = ws.cell(row=fila, column=j, value=v)
                    c.border = BORDE
                    c.alignment = Alignment(vertical="top", wrap_text=j in (2, 5, 12))
                    # Ámbar lo que se rellena; gris lo que ya viene dado.
                    c.fill = RELLENAR if 6 <= j <= 12 else DADO
                fila += 1

    ultima = fila - 1
    ws.auto_filter.ref = f"A1:M{ultima}"

    # Ayudas de validación: evita erratas que luego hay que perseguir.
    v_pag = DataValidation(type="whole", operator="between", formula1=1, formula2=902,
                           allow_blank=True, showErrorMessage=True,
                           errorTitle="Página fuera de rango",
                           error="Escribe el número de página del nombre del archivo (1–902).")
    # Lista desplegable: no hay que escribir nada, se elige.
    v_pos = DataValidation(type="list", formula1='"' + ",".join(ETIQUETAS_POSICION) + '"',
                           allow_blank=True, showErrorMessage=True,
                           errorTitle="Elige de la lista",
                           error="Despliega la celda y elige por dónde empieza el canto.")
    v_x = DataValidation(type="list", formula1='"X"', allow_blank=True)
    for v in (v_pag, v_pos, v_x):
        ws.add_data_validation(v)
    v_pag.add(f"F2:F{ultima}")
    v_pag.add(f"H2:H{ultima}")
    v_pos.add(f"G2:G{ultima}")
    v_pos.add(f"I2:I{ultima}")
    v_ciclo = DataValidation(type="list", formula1='"A,B,C"', allow_blank=True)
    ws.add_data_validation(v_ciclo)
    v_ciclo.add(f"J2:J{ultima}")
    v_x.add(f"K2:K{ultima}")

    hoja_instrucciones(wb)
    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    wb.save(SALIDA)

    print(f"escrito {SALIDA}")
    print(f"  filas: {ultima - 1}")
    if anteriores:
        conservadas = sum(
            1 for r in range(2, fila)
            if ws.cell(row=r, column=6).value not in (None, "")
            or ws.cell(row=r, column=9).value not in (None, "")
        )
        print(f"  conservadas de la planilla anterior: {conservadas} "
              f"(de {len(anteriores)} que traía)")
    porLibro = {}
    for r in range(2, fila):
        k = ws.cell(row=r, column=1).value
        porLibro[k] = porLibro.get(k, 0) + 1
    print("  por libro:", porLibro)


if __name__ == "__main__":
    main()
