import { useEffect, useRef, useState } from 'react';

/**
 * Nivel de entrada del micrófono (0..1) para el badge REC (U4).
 * Usa Web Audio y se apaga en cuanto deja de escuchar: sin coste y sin
 * mantener el micro abierto cuando no toca.
 */
export function useMicLevel(active: boolean): number {
  const [level, setLevel] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setLevel(0);
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        const AudioCtx =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        context = new AudioCtx();
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (cancelled) return;
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const average = sum / data.length;
          // Curva suave: el habla normal ronda 20-60 de media.
          setLevel(Math.min(1, Math.max(0, average / 55)));
          rafRef.current = window.requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // Permiso denegado: el ASR ya muestra su propio aviso.
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      stream?.getTracks().forEach(track => track.stop());
      if (context && context.state !== 'closed') void context.close().catch(() => undefined);
      setLevel(0);
    };
  }, [active]);

  return level;
}
