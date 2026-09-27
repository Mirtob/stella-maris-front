import { useEffect, useState } from 'react';

/**
 * Un porcentaje que avanza solo mientras algo carga y no se sabe cuánto falta.
 *
 * El navegador no dice cuánto lleva bajado un módulo de la app, pero una pantalla de
 * carga quieta hace creer que la app se colgó (pedido del 27-sep-2026). Así que sube
 * rápido al principio y cada vez más lento, sin llegar nunca al 100: ese lo pone quien
 * termina (la pantalla se va, o pasa `listo`).
 *
 * @param activo    mientras sea true, avanza; al volver a true, empieza de cero
 * @param constante ms en que llega a ~60 % (lo que suele tardar lo que se espera)
 */
export function useAvanceEstimado(activo = true, constante = 2500): number {
  const [avance, setAvance] = useState(0);
  useEffect(() => {
    if (!activo) return;
    setAvance(0);
    const inicio = Date.now();
    const id = window.setInterval(() => {
      const t = Date.now() - inicio;
      setAvance(Math.min(95, Math.round(95 * (1 - Math.exp(-t / constante)))));
    }, 150);
    return () => window.clearInterval(id);
  }, [activo, constante]);
  return avance;
}
