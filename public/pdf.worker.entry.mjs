// Entrada del worker de pdf.js: primero el polyfill (Chrome Android viejo), luego el worker.
import './pdf-polyfills.mjs';
import './pdf.worker.min.mjs';
