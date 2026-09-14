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

TIPOS = ["introitus", "graduale", "alleluia", "tractus", "offertorium", "communio"]
ALTERNATIVOS = {("alleluia", "tractus")}
ALTO_PAGINA = {"romanum": 519, "simplex": 576}

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
    ("→ Página", 10),
    ("→ y0 (empieza)", 14),
    ("→ y1 (termina)", 14),
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
        ("→ Página     el número de la página donde empieza el canto (el del nombre del archivo)", False),
        ("→ y0         la altura donde EMPIEZA, medida desde el borde de ARRIBA", False),
        ("→ y1         la altura donde TERMINA. Se puede dejar vacía: si está vacía, el canto", False),
        ("             llega hasta el canto siguiente o hasta el pie de la página.", False),
        ("→ No existe  escribe X si ese canto no está en esa Misa (ver la nota del Aleluya).", False),
        ("", False),
        ("Cómo estimar la altura", True),
        ("Las líneas verdes de las imágenes llevan escrita su altura (por ejemplo 'communio", False),
        ("y=458'). Sirven de regla: si el canto que falta está más o menos a media altura", False),
        ("entre dos marcas, un valor intermedio basta. No hace falta precisión al punto:", False),
        ("el recorte lleva un margen.", False),
        ("La página del Graduale Romanum mide 519 puntos de alto y la del Simplex 576.", False),
        ("Arriba del todo es 0.", False),
        ("", False),
        ("El Aleluya y el Tracto", True),
        ("Aparecen los dos en la lista, pero en la mayoría de las Misas SOLO EXISTE UNO:", False),
        ("en Cuaresma el Tracto sustituye al Aleluya. Si solo ves uno en la página, rellena", False),
        ("ese y marca el otro con X en 'No existe'. Es lo correcto, no un error.", False),
        ("", False),
        ("Por dónde empezar", True),
        ("Ordena por 'Celebración' y empieza por las que tienen una sola fila: se cierran", False),
        ("rápido y la cobertura sube enseguida.", False),
    ]
    for i, (texto, negrita) in enumerate(textos, start=1):
        c = ws.cell(row=i, column=1, value=texto)
        c.font = Font(bold=negrita, size=13 if negrita else 11,
                      color=AZUL if negrita else "000000")


def main():
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
                valores = [libro, misa["celebracion"], tipo, paginas, encontrado,
                           None, None, None, None, None, clave]
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
    v_y = DataValidation(type="decimal", operator="between", formula1=0, formula2=600,
                         allow_blank=True, showErrorMessage=True,
                         errorTitle="Altura fuera de rango",
                         error="La altura va de 0 (arriba) a 519 en el Romanum y 576 en el Simplex.")
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
    print(f"  filas por rellenar: {ultima - 1}")
    porLibro = {}
    for r in range(2, fila):
        k = ws.cell(row=r, column=1).value
        porLibro[k] = porLibro.get(k, 0) + 1
    print("  por libro:", porLibro)


if __name__ == "__main__":
    main()
