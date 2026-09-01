import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioTrack } from '../services/songAudio';
import { MEZCLA } from '../services/songAudio';

/**
 * Mezclador de voces: reproduce a la vez las pistas de un canto, cada una con su
 * propio volumen.
 *
 * Funciona porque MuseScore exporta cada voz SOLA, todas con la misma duración y
 * empezando en el mismo instante: sumadas dan la obra completa (verificado midiendo
 * la energía de los archivos reales — cada voz suena ~54 % del tiempo, la mezcla 76 %).
 *
 * DECISIONES
 *
 *  · Se usan elementos <audio> y no buffers decodificados. Decodificar cuatro voces de
 *    tres minutos son ~120 MB en RAM, que en un teléfono modesto en medio de un ensayo
 *    es exactamente el momento en que no se puede fallar. Los <audio> transmiten y
 *    apenas ocupan memoria.
 *  · Como cada elemento lleva su propio reloj, pueden separarse entre sí. Se vigila la
 *    deriva contra la primera pista y se corrige cuando pasa de 120 ms, que es donde
 *    un coro empieza a oír el eco.
 *  · La pista de MEZCLA se carga pero arranca en silencio: está para quien quiere oír
 *    la obra entera de una vez, y se sube desde su propio fader.
 */

export interface VoiceLevel {
  part: string;
  volumen: number;   // 0..1
  silenciada: boolean;
}

export type MixerEstado = 'vacio' | 'cargando' | 'listo' | 'error';

/** Deriva a partir de la cual se recoloca una pista (segundos). */
const DERIVA_MAX = 0.12;

export function useVoiceMixer(tracks: AudioTrack[], vozPropia?: string) {
  const [estado, setEstado] = useState<MixerEstado>('vacio');
  const [sonando, setSonando] = useState(false);
  const [posicion, setPosicion] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [niveles, setNiveles] = useState<VoiceLevel[]>([]);
  const [progresoCarga, setProgresoCarga] = useState(0);

  const audios = useRef<Map<string, HTMLAudioElement>>(new Map());
  const ctx = useRef<AudioContext | null>(null);
  const ganancias = useRef<Map<string, GainNode>>(new Map());
  const raf = useRef<number | null>(null);

  /** Suelta todo: sin esto, cambiar de canto deja pistas sonando de fondo. */
  const soltar = useCallback(() => {
    if (raf.current !== null) { cancelAnimationFrame(raf.current); raf.current = null; }
    audios.current.forEach((a) => { a.pause(); a.src = ''; a.load(); });
    audios.current.clear();
    ganancias.current.clear();
    if (ctx.current && ctx.current.state !== 'closed') void ctx.current.close();
    ctx.current = null;
    setSonando(false);
    setPosicion(0);
    setDuracion(0);
    setEstado('vacio');
    setProgresoCarga(0);
  }, []);

  useEffect(() => soltar, [soltar]);

  /** Descarga y engancha las pistas. NADA de esto pasa hasta que se llama. */
  const cargar = useCallback(async () => {
    if (tracks.length === 0) return;
    setEstado('cargando');
    setProgresoCarga(0);
    try {
      // El AudioContext se crea aquí, dentro del gesto del usuario: creado antes,
      // iOS lo deja suspendido y no suena nada sin que se entienda por qué.
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const contexto: AudioContext = new AC();
      ctx.current = contexto;

      let listas = 0;
      await Promise.all(tracks.map((t) => new Promise<void>((resolve) => {
        const a = new Audio();
        a.crossOrigin = 'anonymous';
        a.preload = 'auto';
        a.src = t.url;
        const ok = () => {
          const fuente = contexto.createMediaElementSource(a);
          const g = contexto.createGain();
          // La mezcla completa entra callada: quien la quiera, la sube.
          const esMezcla = t.part === MEZCLA;
          g.gain.value = esMezcla ? 0 : 1;
          fuente.connect(g).connect(contexto.destination);
          audios.current.set(t.part, a);
          ganancias.current.set(t.part, g);
          listas++;
          setProgresoCarga(Math.round((listas / tracks.length) * 100));
          resolve();
        };
        a.addEventListener('canplaythrough', ok, { once: true });
        // Si una pista falla, el mezclador sigue con las demás: mejor tres voces que
        // una pantalla de error en medio del ensayo.
        a.addEventListener('error', () => { listas++; resolve(); }, { once: true });
        a.load();
      })));

      if (audios.current.size === 0) { setEstado('error'); return; }

      const primera = audios.current.values().next().value as HTMLAudioElement;
      setDuracion(Number.isFinite(primera.duration) ? primera.duration : 0);

      setNiveles(tracks
        .filter((t) => audios.current.has(t.part))
        .map((t) => ({
          part: t.part,
          // La voz del corista entra al máximo y el resto a la mitad: se oye a sí mismo
          // por encima del conjunto, que es para lo que se abre esto.
          volumen: t.part === MEZCLA ? 0 : vozPropia && t.part === vozPropia ? 1 : 0.5,
          silenciada: false,
        })));
      setEstado('listo');
    } catch {
      setEstado('error');
    }
  }, [tracks, vozPropia]);

  // Los niveles del estado mandan sobre las ganancias reales.
  useEffect(() => {
    for (const n of niveles) {
      const g = ganancias.current.get(n.part);
      if (g) g.gain.value = n.silenciada ? 0 : n.volumen;
    }
  }, [niveles]);

  const tick = useCallback(() => {
    const lista = [...audios.current.values()];
    if (lista.length === 0) return;
    const guia = lista[0];
    setPosicion(guia.currentTime);
    // Cada <audio> lleva su reloj: si alguno se separa, se recoloca.
    for (const a of lista.slice(1)) {
      if (Math.abs(a.currentTime - guia.currentTime) > DERIVA_MAX) a.currentTime = guia.currentTime;
    }
    raf.current = requestAnimationFrame(tick);
  }, []);

  const reproducir = useCallback(async () => {
    if (ctx.current?.state === 'suspended') await ctx.current.resume();
    const lista = [...audios.current.values()];
    if (lista.length === 0) return;
    // Todas al mismo punto ANTES de arrancar: si una quedó atrasada de la vez pasada,
    // empezar sin igualarlas suena a canon.
    const t0 = lista[0].currentTime;
    for (const a of lista) a.currentTime = t0;
    await Promise.all(lista.map((a) => a.play().catch(() => undefined)));
    setSonando(true);
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  const pausar = useCallback(() => {
    audios.current.forEach((a) => a.pause());
    setSonando(false);
    if (raf.current !== null) { cancelAnimationFrame(raf.current); raf.current = null; }
  }, []);

  const irA = useCallback((segundos: number) => {
    audios.current.forEach((a) => { a.currentTime = segundos; });
    setPosicion(segundos);
  }, []);

  const cambiarVolumen = useCallback((part: string, v: number) => {
    setNiveles((prev) => prev.map((n) => (n.part === part ? { ...n, volumen: v, silenciada: false } : n)));
  }, []);

  const alternarSilencio = useCallback((part: string) => {
    setNiveles((prev) => prev.map((n) => (n.part === part ? { ...n, silenciada: !n.silenciada } : n)));
  }, []);

  /** Solo esta voz: lo que pide un corista para aprenderse su línea. */
  const solo = useCallback((part: string) => {
    setNiveles((prev) => {
      const yaEsSolo = prev.every((n) => (n.part === part) !== n.silenciada);
      return prev.map((n) => ({ ...n, silenciada: yaEsSolo ? false : n.part !== part }));
    });
  }, []);

  return {
    estado, sonando, posicion, duracion, niveles, progresoCarga,
    cargar, soltar, reproducir, pausar, irA, cambiarVolumen, alternarSilencio, solo,
  };
}
