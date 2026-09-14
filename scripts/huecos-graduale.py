"""Qué le falta al índice del Graduale, para cerrarlo a mano.

El OCR de los dos escaneos se salta rótulos, y afinar el detector tocó techo: se
probaron dos variantes (por líneas y unión de ambas) y ninguna mejoró la medición.
Lo honesto es decir exactamente qué falta y dónde mirarlo.

Genera `docs/graduale-huecos.md`: por celebración, qué cantos no se encontraron y en
qué páginas del PDF están. Con eso se completan a mano en OVERRIDES (ver abajo) sin
tener que recorrer 900 páginas.

Uso:  .venv/Scripts/python.exe scripts/huecos-graduale.py
"""
import io
import json
import re

INDICE = "src/data/gradualeIndex.data.ts"
SALIDA = "docs/graduale-huecos.md"

TIPOS = ["introitus", "graduale", "alleluia", "tractus", "offertorium", "communio"]
# En Cuaresma el Tracto sustituye al Aleluya: no tener los dos es lo normal.
ALTERNATIVOS = {("alleluia", "tractus")}


def cargar() -> dict:
    t = io.open(INDICE, encoding="utf-8").read()
    i = t.index("GRADUALE_INDEX_DATA")
    i = t.index("{", t.index("=", i))
    return json.loads(t[i:t.rindex("} as const;") + 1])


def faltantes(cantos: dict) -> list:
    tiene = set(cantos)
    falta = []
    for tipo in TIPOS:
        if tipo in tiene:
            continue
        # El Aleluya y el Tracto se excluyen mutuamente.
        if any(tipo in par and (set(par) & tiene) for par in ALTERNATIVOS):
            continue
        falta.append(tipo)
    return falta


def main():
    d = cargar()
    lineas = [
        "# Huecos del índice del Graduale",
        "",
        "Generado por `scripts/huecos-graduale.py`. **No editar a mano**: se regenera.",
        "",
        "Los dos PDF son escaneos y su capa de OCR se salta rótulos de canto. Aquí está",
        "lo que el importador no encontró, con la página del PDF donde mirarlo.",
        "",
        "El Aleluya y el Tracto no se cuentan como hueco cuando está el otro: en Cuaresma",
        "el Tracto sustituye al Aleluya, así que tener uno solo es lo correcto.",
        "",
    ]

    for libro, titulo in (("romanum", "Graduale Romanum 1974"),
                          ("simplex", "Graduale Simplex 2007")):
        misas = d[libro]
        # Lo que de verdad importa son las celebraciones que la app sabe resolver por
        # fecha: los domingos y las solemnidades. Las ferias (días de semana) están en
        # el libro, pero un coro no arma cantoral para ellas, así que sus huecos no
        # bloquean nada — se separan para no inflar la lista de trabajo.
        conCelebracion = {k: v for k, v in misas.items() if v.get("celebracion")}
        ferias = {k: v for k, v in misas.items() if not v.get("celebracion")}

        for grupo, nombre, urgencia in (
            (conCelebracion, "Domingos y solemnidades", "hay que cerrarlos"),
            (ferias, "Ferias y otras Misas del libro", "no bloquean nada"),
        ):
            conHuecos = [(k, v, faltantes(v["cantos"])) for k, v in grupo.items()
                         if faltantes(v["cantos"])]
            completas = len(grupo) - len(conHuecos)
            lineas += [
                f"## {titulo} — {nombre}",
                "",
                f"- Misas: **{len(grupo)}**",
                f"- Completas: **{completas}**",
                f"- Con algún hueco: **{len(conHuecos)}** ({urgencia})",
                "",
            ]
            if not conHuecos:
                lineas += ["Ninguna. ✅", ""]
                continue
            lineas += [
                "| Celebración | Título del libro | Pág. | Faltan |",
                "|---|---|---|---|",
            ]
            for clave, v, falta in sorted(conHuecos, key=lambda x: x[1]["pagina"]):
                cel = v.get("celebracion", "—")
                lineas.append(
                    f"| {cel} | {v['titulo'][:46]} | {v['pagina']} | {', '.join(falta)} |"
                )
            lineas.append("")

    lineas += [
        "## Cómo cerrar un hueco",
        "",
        "En `scripts/import-graduale.py`, en `OVERRIDES`, se anota la coordenada real:",
        "",
        "```python",
        "OVERRIDES = {",
        "    # libro: { clave-de-la-misa: { canto: [{'p': pagina0, 'y0': .., 'y1': ..}] } }",
        "    'romanum': {",
        "        'hebdomada-prima-adventus': {",
        "            'communio': [{'p': 11, 'y0': 300, 'y1': 460}],",
        "        },",
        "    },",
        "}",
        "```",
        "",
        "`p` es el índice de página (base 0, o sea la página del visor menos uno) y",
        "`y0`/`y1` son puntos desde el borde superior. La página del Romanum mide 519 pt",
        "de alto y la del Simplex 576 pt, así que la mitad de la página ronda y=260 y",
        "y=288 respectivamente.",
        "",
    ]

    io.open(SALIDA, "w", encoding="utf-8").write("\n".join(lineas) + "\n")
    print(f"escrito {SALIDA}")
    for libro in ("romanum", "simplex"):
        conCel = [v for v in d[libro].values() if v.get("celebracion")]
        huecos = [v for v in conCel if faltantes(v["cantos"])]
        print(f"  {libro}: {len(conCel)} celebraciones del calendario | "
              f"{len(conCel) - len(huecos)} completas | {len(huecos)} por repasar")


if __name__ == "__main__":
    main()
