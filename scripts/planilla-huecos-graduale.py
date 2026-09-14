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
# Alto de la página en PUNTOS (el PDF) y en PÍXELES (la imagen que se mira).
#
# Se pide el valor EN PÍXELES, y esto no es un detalle: las imágenes se generan a 120
# ppp, así que la página del Romanum mide 519 puntos pero 866 píxeles. Pedir puntos
# obligaba a convertir a ojo sobre una imagen — y la primera tanda de datos llegó, como
# era de esperar, en píxeles (un y=560 imposible en una página de 519 puntos).
# Se mide lo que se ve; la conversión la hace el importador.
ALTO_PUNTOS = {"romanum": 519, "simplex": 576}
DPI_IMAGENES = 120
ALTO_PIXELES = {k: round(v * DPI_IMAGENES / 72) for k, v in ALTO_PUNTOS.items()}

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
    ("→ Página del PDF\n(la del nombre del archivo)", 18),
    ("→ y0 en PÍXELES\n(dónde empieza)", 18),
    ("→ y1 en PÍXELES\n(dónde termina)", 18),
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
        ("→ Página     el número que va en el NOMBRE DEL ARCHIVO de la imagen:", False),
        ("             p0056__hebdomada-quinta-paschae.png  ->  escribe 56", False),
        ("", False),
        ("             NO uses el número impreso en la esquina de la página del libro. Son", False),
        ("             distintos, y el desfase entre uno y otro NO es constante (cambia a lo", False),
        ("             largo del volumen). El programa trabaja con la página del PDF, que es", False),
        ("             la del nombre del archivo: con ella no hay conversión posible de errar.", False),
        ("→ y0         la altura donde EMPIEZA el canto, EN PÍXELES DE LA IMAGEN, contando", False),
        ("             desde el borde de ARRIBA (0 = arriba del todo).", False),
        ("→ y1         la altura donde TERMINA, también en píxeles. Se puede dejar vacía: si", False),
        ("             está vacía, el canto llega hasta el canto siguiente o hasta el pie.", False),
        ("→ No existe  escribe X si ese canto no está en esa Misa (ver la nota del Aleluya).", False),
        ("", False),
        ("Cómo medir la altura", True),
        ("En PÍXELES, tal como los da cualquier visor de imágenes. La imagen del Romanum", False),
        ("mide 866 píxeles de alto y la del Simplex 960. Arriba del todo es 0.", False),
        ("", False),
        ("No hace falta precisión: el recorte lleva un margen. Si el canto empieza más o", False),
        ("menos a la mitad, 430 es un valor perfectamente bueno.", False),
        ("", False),
        ("Las líneas verdes de las imágenes llevan escrita su altura, pero OJO: esa cifra", False),
        ("está en PUNTOS del PDF, no en píxeles (es la que usa el programa por dentro).", False),
        ("Para compararla con lo que mides, multiplícala por 1,67 — o simplemente ignórala", False),
        ("y fíjate en dónde cae la línea, que para eso está dibujada.", False),
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


def previos(ruta: str) -> dict:
    """Lo ya rellenado en una planilla anterior, por (libro, clave, canto).

    Se empareja por CONTENIDO y no por número de fila: entre una versión y otra las
    filas se mueven (al quitar el tracto desaparecieron 51), y casar por posición
    habría mezclado los datos de unas celebraciones con otras.
    """
    if not ruta or not os.path.exists(ruta):
        return {}
    from openpyxl import load_workbook
    ws = load_workbook(ruta, data_only=True)["Huecos"]
    guardado = {}
    for r in range(2, ws.max_row + 1):
        libro = ws.cell(row=r, column=1).value
        canto = ws.cell(row=r, column=3).value
        clave = ws.cell(row=r, column=11).value
        datos = [ws.cell(row=r, column=c).value for c in (6, 7, 8, 9, 10)]
        if libro and clave and any(x not in (None, "") for x in datos):
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
                ya = anteriores.get((libro, clave, tipo), [None] * 5)
                valores = [libro, misa["celebracion"], tipo, paginas, encontrado,
                           *ya, clave]
                for j, v in enumerate(valores, start=1):
                    c = ws.cell(row=fila, column=j, value=v)
                    c.border = BORDE
                    c.alignment = Alignment(vertical="top", wrap_text=j in (2, 5, 10))
                    # Ámbar lo que se rellena; gris lo que ya viene dado.
                    c.fill = RELLENAR if 6 <= j <= 10 else DADO
                fila += 1

    ultima = fila - 1
    ws.auto_filter.ref = f"A1:K{ultima}"

    # Ayudas de validación: evita erratas que luego hay que perseguir.
    v_pag = DataValidation(type="whole", operator="between", formula1=1, formula2=902,
                           allow_blank=True, showErrorMessage=True,
                           errorTitle="Página fuera de rango",
                           error="Escribe el número de página del nombre del archivo (1–902).")
    v_y = DataValidation(type="decimal", operator="between", formula1=0,
                         formula2=max(ALTO_PIXELES.values()), allow_blank=True,
                         showErrorMessage=True, errorTitle="Altura fuera de rango",
                         error=("En PÍXELES de la imagen: 0 arriba, hasta "
                                f"{ALTO_PIXELES['romanum']} en el Romanum y "
                                f"{ALTO_PIXELES['simplex']} en el Simplex."))
    v_x = DataValidation(type="list", formula1='"X"', allow_blank=True)
    for v in (v_pag, v_y, v_x):
        ws.add_data_validation(v)
    v_pag.add(f"F2:F{ultima}")
    v_y.add(f"G2:H{ultima}")
    v_x.add(f"I2:I{ultima}")

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
