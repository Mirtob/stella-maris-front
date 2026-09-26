/**
 * pdf.js 5.x usa Map/WeakMap.prototype.getOrInsertComputed (propuesta "upsert"),
 * que Chrome de Android aún no trae en muchos teléfonos: el folleto fallaba con
 * "this[#e].getOrInsertComputed is not a function". El worker de pdf.js carga su
 * propia copia de esto en public/pdf-polyfills.mjs.
 */
for (const C of [Map, WeakMap] as any[]) {
  const p = C.prototype;
  if (typeof p.getOrInsert !== 'function') {
    Object.defineProperty(p, 'getOrInsert', {
      configurable: true, writable: true,
      value(key: any, value: any) {
        if (!this.has(key)) this.set(key, value);
        return this.get(key);
      },
    });
  }
  if (typeof p.getOrInsertComputed !== 'function') {
    Object.defineProperty(p, 'getOrInsertComputed', {
      configurable: true, writable: true,
      value(key: any, fn: (k: any) => any) {
        if (!this.has(key)) this.set(key, fn(key));
        return this.get(key);
      },
    });
  }
}

export {};
