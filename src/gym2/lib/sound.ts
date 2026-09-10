let audioCtx: AudioContext | null = null;

export function beep(
  enabled: boolean,
  freq?: number,
  dur?: number,
  when?: number
) {
  if (!enabled) return;
  try {
    const AC: typeof AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = audioCtx || new AC();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.frequency.value = freq || 880;
    o.type = "sine";
    const t0 = audioCtx.currentTime + (when || 0);
    g.gain.setValueAtTime(0.001, t0);
    g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + (dur || 0.18));
    o.start(t0);
    o.stop(t0 + (dur || 0.18) + 0.05);
  } catch {
    /* audio unavailable */
  }
}

export function vibrate(p: number | number[]) {
  try {
    if (navigator.vibrate) navigator.vibrate(p);
  } catch {
    /* not supported */
  }
}