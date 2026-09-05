/// <reference types="vite/client" />

/**
 * Declaraciones de tipos del entorno. Faltaban por completo: el proyecto tenía
 * `tsconfig.json` en modo `strict` pero NUNCA tuvo instalado el compilador, así que
 * nadie las echó de menos. Sin ellas, `import.meta.env` y los imports de imágenes daban
 * error en cuanto se encendía el chequeo (50 de los 149 errores iniciales).
 *
 * La referencia a `vite/client` de arriba trae `import.meta.env` y los tipos de los
 * assets normales (.png, .webp, .svg…).
 */

/**
 * Assets importados con el prefijo `figma:asset/`, que resuelve el plugin de
 * vite.config.ts contra src/assets/. Sin esta declaración, TypeScript no puede saber
 * que ese esquema existe: es un invento del plugin, no del bundler.
 */
declare module 'figma:asset/*' {
  const src: string;
  export default src;
}
