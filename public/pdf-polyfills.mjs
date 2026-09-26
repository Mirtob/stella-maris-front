// Copia de src/utils/polyfills.ts para el worker de pdf.js (ver pdf.worker.entry.mjs).
for (const C of [Map, WeakMap]) {
  const p = C.prototype;
  if (typeof p.getOrInsert !== 'function') {
    Object.defineProperty(p, 'getOrInsert', {
      configurable: true, writable: true,
      value(key, value) {
        if (!this.has(key)) this.set(key, value);
        return this.get(key);
      },
    });
  }
  if (typeof p.getOrInsertComputed !== 'function') {
    Object.defineProperty(p, 'getOrInsertComputed', {
      configurable: true, writable: true,
      value(key, fn) {
        if (!this.has(key)) this.set(key, fn(key));
        return this.get(key);
      },
    });
  }
}
