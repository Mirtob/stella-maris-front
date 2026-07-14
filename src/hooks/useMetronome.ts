import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Metrónomo con Web Audio API. Usa un planificador "lookahead" (el patrón estándar):
 * un temporizador cada 25 ms agenda los clics de los próximos 100 ms contra el reloj de
 * audio (`AudioContext.currentTime`), lo que da un tempo estable sin la deriva de
 * `setInterval`. El AudioContext se crea al primer arranque (gesto del usuario), para
 * cumplir la política de autoplay del navegador.
 */
const MIN_BPM = 40;
const MAX_BPM = 240;
const BEATS_PER_BAR = 4;

export function useMetronome(initialBpm = 90) {
  const [bpm, setBpm] = useState(initialBpm);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const nextNoteRef = useRef(0);
  const beatInBarRef = useRef(0);
  const timerRef = useRef<number | undefined>(undefined);
  const bpmRef = useRef(bpm);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  const click = (ctx: AudioContext, time: number, accent: boolean) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1500 : 900;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.28, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);
  };

  const scheduler = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    while (nextNoteRef.current < ctx.currentTime + 0.1) {
      const b = beatInBarRef.current;
      const when = nextNoteRef.current;
      click(ctx, when, b === 0);
      const delayMs = Math.max(0, (when - ctx.currentTime) * 1000);
      window.setTimeout(() => setBeat(b), delayMs);
      nextNoteRef.current += 60 / bpmRef.current;
      beatInBarRef.current = (b + 1) % BEATS_PER_BAR;
    }
  }, []);

  const start = useCallback(() => {
    let ctx = ctxRef.current;
    if (!ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      ctxRef.current = ctx;
    }
    if (ctx.state === 'suspended') ctx.resume();
    beatInBarRef.current = 0;
    nextNoteRef.current = ctx.currentTime + 0.06;
    setRunning(true);
    timerRef.current = window.setInterval(scheduler, 25);
  }, [scheduler]);

  const stop = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = undefined; }
    setRunning(false);
    setBeat(0);
  }, []);

  const toggle = useCallback(() => { if (timerRef.current) stop(); else start(); }, [start, stop]);

  const changeBpm = useCallback((v: number) => {
    setBpm(Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(v))));
  }, []);

  // Tap tempo: promedia los intervalos de los últimos toques (ventana de 2 s).
  const tapsRef = useRef<number[]>([]);
  const tap = useCallback(() => {
    const now = performance.now();
    const taps = [...tapsRef.current.filter((t) => now - t < 2000), now];
    tapsRef.current = taps;
    if (taps.length >= 2) {
      let sum = 0;
      for (let i = 1; i < taps.length; i++) sum += taps[i] - taps[i - 1];
      changeBpm(60000 / (sum / (taps.length - 1)));
    }
  }, [changeBpm]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try { ctxRef.current?.close(); } catch { /* ya cerrado */ }
  }, []);

  return { bpm, running, beat, beatsPerBar: BEATS_PER_BAR, start, stop, toggle, tap, setBpm: changeBpm };
}
