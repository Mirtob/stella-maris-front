Aqui vive assetlinks.json, el archivo con el que Android comprueba que la app
Android y este dominio son del mismo dueno.

Sin el, el APK (una TWA que abre esta misma web) arranca mostrando la barra de
direcciones del navegador: parece una web metida en una ventana, no una app.

Todavia no esta porque necesita la huella SHA-256 de la clave con la que se firme
el APK, y esa clave aun no existe. El orden es: crear la clave -> sacar su huella
-> escribir aqui assetlinks.json -> compilar el APK.

OJO con el rewrite de vercel.json: la regla que manda todo a index.html excluye
/.well-known/ a proposito. Si se quita esa exclusion, este archivo deja de
servirse como JSON y la verificacion falla en silencio.
