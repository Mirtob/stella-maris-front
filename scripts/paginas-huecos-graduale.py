"""Imágenes de las páginas que hay que repasar a mano en el Graduale.

POR QUÉ
El OCR de los escaneos se salta rótulos de canto, y afinar el detector tocó techo
(se midieron tres variantes). Quedan celebraciones con huecos, y cerrarlas exige que
una persona mire la página. Navegar un PDF de 900 páginas buscando 54 sitios es la
forma lenta; esto deja solo las páginas que importan, en orden y numeradas.

QUÉ HACE, Y LO QUE LO HACE ÚTIL
Marca sobre la imagen lo que el importador YA encontró: una línea con el nombre del
canto en la altura exacta donde lo detectó. Así no hay que revisar la página entera,
solo buscar el canto que falta y anotar a qué altura empieza.

Las imágenes son material de trabajo: van a `tmp/` (ignorado por git) y no se publican.

Uso:  .venv/Scripts/python.exe scripts/paginas-huecos-graduale.py
"""
import io
import json
import os

import fitz

INDICE = "src/data/gradualeIndex.data.ts"
CACHE = os.path.join("tmp", "graduale")
SALIDA = os.path.join("tmp", "graduale-revision")
DPI = 120                  # suficiente para leer los rótulos sin engordar el archivo

TIPOS = ["introitus", "graduale", "alleluia", "tractus", "offertorium", "communio"]
ALTERNATIVOS = {("alleluia", "tractus")}

ARCHIVOS = {"romanum": "GR.pdf", "simplex": "GS.pdf"}


def cargar_indice() -> dict:
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
        if any(tipo in par and (set(par) & tiene) for par in ALTERNATIVOS):
            continue
        falta.append(tipo)
    return falta


def paginas_de(misa: dict) -> list:
    """Las páginas que ocupa la Misa, según los recortes ya detectados."""
    paginas = set()
    for regiones in misa["cantos"].values():
        for r in regiones:
            paginas.add(r["p"])
    if not paginas:
        paginas.add(misa["pagina"] - 1)
    # Una página más por si el canto que falta cayó justo después.
    return sorted(paginas | {max(paginas) + 1})


def marcar(pagina, misa: dict) -> None:
    """Dibuja sobre la página lo que YA se detectó, para no volver a buscarlo."""
    for tipo, regiones in misa["cantos"].items():
        for r in regiones:
            if r["p"] != pagina.number:
                continue
            y = r["y0"]
            pagina.draw_line(fitz.Point(0, y), fitz.Point(pagina.rect.width, y),
                             color=(0.1, 0.5, 0.1), width=1.2)
            pagina.insert_text(fitz.Point(4, max(9, y - 3)), f"{tipo} y={int(y)}",
                               fontsize=7, color=(0.1, 0.5, 0.1))


def main():
    indice = cargar_indice()
    os.makedirs(SALIDA, exist_ok=True)
    fichas = []
    total_img = 0

    for libro, archivo in ARCHIVOS.items():
        ruta = os.path.join(CACHE, archivo)
        if not os.path.exists(ruta):
            print(f"  falta {ruta} — corre antes scripts/import-graduale.py")
            continue
        doc = fitz.open(ruta)
        carpeta = os.path.join(SALIDA, libro)
        os.makedirs(carpeta, exist_ok=True)

        # Solo lo que la app resuelve por fecha: domingos y solemnidades.
        pendientes = [(k, v, faltantes(v["cantos"])) for k, v in indice[libro].items()
                      if v.get("celebracion") and faltantes(v["cantos"])]
        pendientes.sort(key=lambda x: x[1]["pagina"])

        for clave, misa, falta in pendientes:
            for p in paginas_de(misa):
                if p >= doc.page_count:
                    continue
                pagina = doc[p]
                marcar(pagina, misa)
                pix = pagina.get_pixmap(dpi=DPI)
                nombre = f"p{p + 1:04d}__{clave[:42]}.png"
                pix.save(os.path.join(carpeta, nombre))
                total_img += 1
            fichas.append({
                "libro": libro,
                "celebracion": misa["celebracion"],
                "titulo": misa["titulo"],
                "clave": clave,
                "paginas": [p + 1 for p in paginas_de(misa) if p < doc.page_count],
                "faltan": falta,
            })
        doc.close()
        print(f"  {libro}: {len(pendientes)} celebraciones por repasar")

    # Hoja de ruta junto a las imágenes.
    lineas = [
        "# Repaso de los huecos del Graduale",
        "",
        "Las imágenes están en esta misma carpeta, una por página, ordenadas por número.",
        "Sobre cada página va marcado en verde lo que el importador YA encontró, con la",
        "altura (`y=`) a la que lo detectó. **Solo hay que buscar lo que falta.**",
        "",
        "Para cada hueco, anota el nombre del archivo y a qué altura empieza ese canto.",
        "La altura se mide desde el borde de ARRIBA; la página del Romanum tiene 519",
        "puntos de alto y la del Simplex 576, así que la mitad ronda y=260 y y=288.",
        "",
        "| Libro | Celebración | Faltan | Páginas |",
        "|---|---|---|---|",
    ]
    for f in fichas:
        pags = ", ".join(str(p) for p in f["paginas"])
        lineas.append(f"| {f['libro']} | {f['celebracion']} | {', '.join(f['faltan'])} | {pags} |")
    io.open(os.path.join(SALIDA, "REPASO.md"), "w", encoding="utf-8").write(
        "\n".join(lineas) + "\n")

    peso = sum(
        os.path.getsize(os.path.join(dp, f))
        for dp, _, fs in os.walk(SALIDA) for f in fs
    )
    print(f"\n{total_img} imágenes en {SALIDA}  ({round(peso / 1048576, 1)} MB)")
    print(f"guía: {os.path.join(SALIDA, 'REPASO.md')}")


if __name__ == "__main__":
    main()
