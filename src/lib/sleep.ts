/**
 * Calcula las horas de sueño a partir de la hora de despertar y la hora de
 * acostarse (formato "HH:MM"). Si no hay datos o son inválidos devuelve 0.
 */
export function calcSleepHours(wakeTime: string, sleepTime: string | undefined | null): number {
  if (!wakeTime || !sleepTime) return 0;
  const [wh, wm] = wakeTime.split(":").map(Number);
  const [sh, sm] = sleepTime.split(":").map(Number);
  if (isNaN(wh) || isNaN(wm) || isNaN(sh) || isNaN(sm)) return 0;
  const wakeMins = wh * 60 + wm;
  const sleepMins = sh * 60 + sm;
  const diff = sleepMins > wakeMins
    ? (24 * 60 - sleepMins + wakeMins)
    : (wakeMins - sleepMins);
  return Math.round((diff / 60) * 10) / 10;
}

/** Formatea horas de sueño como "7.5 h" o "—" si no hay dato. */
export function formatSleepHours(hours: number): string {
  if (!hours || hours <= 0) return "—";
  const whole = Math.floor(hours);
  const dec = Math.round((hours - whole) * 2) / 2;
  const total = whole + dec;
  return `${Number.isInteger(total) ? total : total.toFixed(1)} h`;
}