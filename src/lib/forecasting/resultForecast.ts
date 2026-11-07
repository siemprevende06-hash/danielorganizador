import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

// ---------------------------------------------------------------------------
// Motor de pronóstico de resultados.
//
// A diferencia del motor de esfuerzo (holtWinters.ts), este motor parte de un
// resultado medible (páginas, ELO, XP, kg, canciones, tareas…) y estima:
//   - el ritmo actual,
//   - la fecha en que se alcanza la meta,
//   - un rango realista (P10–P90),
//   - si la tendencia alcanza para la fecha límite,
//   - y la confianza del cálculo.
//
// La serie puede ser acumulada (páginas, XP, metas completadas) o absoluta
// (ELO, peso, fuerza). En ambos casos los días sin actividad cuentan como
// cero: si no, el pronóstico sería demasiado optimista.
// ---------------------------------------------------------------------------

export type ForecastStatus =
  | 'achieved'
  | 'on-track'
  | 'at-risk'
  | 'off-track'
  | 'no-target'
  | 'no-data';

export type ForecastConfidence = 'alta' | 'media' | 'baja' | 'nula';

export type ForecastDirection = 'up' | 'down';

export type ForecastSeriesMode = 'cumulative' | 'absolute';

export interface ForecastPoint {
  /** yyyy-MM-dd */
  date: string;
  value: number;
}

export interface ForecastChartPoint {
  /** yyyy-MM-dd */
  date: string;
  /** Valor real mostrado (peso, ELO, páginas…). */
  actual: number | null;
  /** Proyección central. Null en el pasado. */
  projected: number | null;
  /** Banda de incertidumbre [inferior, superior]. */
  band: [number, number] | null;
}

export interface ForecastInput {
  today: Date;
  /** Nombre del resultado: "Terminar Sapiens", "ELO 1800", "Peso 75 kg". */
  label: string;
  /** Unidad visible: pág, ELO, XP, kg, canciones, tareas, metas, $… */
  unit: string;
  /** Meta total. null = sin meta. */
  target: number | null;
  /** Progreso/valor actual. */
  current: number;
  /** Serie histórica. Puede ser dispersa: el motor rellena los huecos. */
  series: ForecastPoint[];
  /** Fecha en la que empezó el resultado. */
  startedAt?: string | null;
  /** Fecha límite (yyyy-MM-dd). */
  deadline?: string | null;
  /** 'down' para metas de reducción (peso). */
  direction?: ForecastDirection;
  /** Acumulada (páginas) o absoluta (ELO, peso, fuerza). */
  seriesMode?: ForecastSeriesMode;
  /** Valor inicial para metas de reducción. */
  startValue?: number | null;
  /** Techo de confianza para datos ruidosos (ELO, peso, idiomas). */
  maxConfidence?: ForecastConfidence;
  /** Días máximos de historia que se usan. */
  maxHistoryDays?: number;
  /** Mínimo de días de historia para pronosticar. */
  minDays?: number;
  /** Mínimo de días con actividad/cambio para pronosticar. */
  minActiveDays?: number;
  /** De dónde sale la meta (para mostrarlo en el detalle). */
  targetSource?: string;
  /** Supuesto del adaptador (ej. "600 min por tarea"). */
  assumption?: string;
  /** Texto alternativo cuando no hay meta. */
  noTargetReason?: string;
}

export interface ResultForecast {
  label: string;
  unit: string;
  target: number | null;
  current: number;
  /** Valor inicial (para metas de reducción). */
  startValue: number;
  /** Progreso restante en unidades de progreso. */
  remaining: number;
  progressPct: number | null;
  status: ForecastStatus;
  confidence: ForecastConfidence;
  confidenceScore: number;
  etaDate: string | null;
  etaRange: { optimistic: string; pessimistic: string } | null;
  /** Ritmo usado, en unidades de progreso por día. */
  pace: number | null;
  paceRecent: number | null;
  paceTrend: number | null;
  requiredPace: number | null;
  paceRatio: number | null;
  /** Valor mostrado que se proyecta al plazo. */
  projectedAtDeadline: number | null;
  deadline: string | null;
  daysLeft: number | null;
  sampleDays: number;
  activeDays: number;
  /** Coeficiente de variación de los avances diarios. */
  variability: number | null;
  explanation: string[];
  assumptions: string[];
  chart: ForecastChartPoint[];
  targetSource?: string;
  /** Valores visibles para sistemas ordinales (idiomas). */
  displayCurrent?: string;
  displayTarget?: string;
  direction: ForecastDirection;
  seriesMode: ForecastSeriesMode;
}

const EPSILON = 1e-9;
const MAX_ETA_DAYS = 730;

function dateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function parseKey(key: string): Date {
  return new Date(`${String(key).slice(0, 10)}T12:00:00`);
}

function keyFromAny(value: unknown): string | null {
  if (!value) return null;
  const raw = String(value);
  const key = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : null;
}

function maxKey(...keys: Array<string | null | undefined>): string | null {
  const valid = keys.filter((key): key is string => !!key && /^\d{4}-\d{2}-\d{2}$/.test(key));
  if (!valid.length) return null;
  return valid.sort()[valid.length - 1];
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * q;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function fmt(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return String(round(value, digits));
}

function formatDate(key: string | null): string {
  if (!key) return '—';
  const date = parseKey(key);
  return Number.isNaN(date.getTime()) ? key : format(date, "d 'de' MMM yyyy", { locale: es });
}

/** Avance diario limitado al percentil 95 para que un día excepcional no infle el ETA. */
function winsorize(values: number[], percentile = 0.95): number[] {
  if (values.length < 5) return values;
  const sorted = [...values].sort((a, b) => a - b);
  const cap = quantile(sorted, percentile);
  return values.map(value => Math.min(value, cap));
}

/** Pendiente robusta de Theil–Sen: mediana de las pendientes por pares. */
function theilSenSlope(points: Array<{ x: number; y: number }>): number {
  if (points.length < 2) return 0;
  const step = Math.max(1, Math.floor(points.length / 90));
  const sample = points.filter((_, index) => index % step === 0);
  const slopes: number[] = [];
  for (let i = 0; i < sample.length; i++) {
    for (let j = i + 1; j < sample.length; j++) {
      const dx = sample[j].x - sample[i].x;
      if (dx !== 0) slopes.push((sample[j].y - sample[i].y) / dx);
    }
  }
  return slopes.length ? median(slopes) : 0;
}

function rSquared(points: Array<{ x: number; y: number }>): number {
  if (points.length < 3) return 0;
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const meanX = mean(xs);
  const meanY = mean(ys);
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < points.length; i++) {
    numerator += (xs[i] - meanX) * (ys[i] - meanY);
    denominator += (xs[i] - meanX) ** 2;
  }
  if (Math.abs(denominator) < EPSILON) return 0;
  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < points.length; i++) {
    const predicted = slope * xs[i] + intercept;
    ssTot += (ys[i] - meanY) ** 2;
    ssRes += (ys[i] - predicted) ** 2;
  }
  if (ssTot < EPSILON) return 0;
  return clamp(1 - ssRes / ssTot, 0, 1);
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Construye una serie densa (un punto por día) a partir de datos dispersos.
 * Los huecos se rellenan con el último valor conocido; para series acumuladas
 * eso equivale a contar los días sin actividad como cero avance.
 */
function densify(
  points: ForecastPoint[],
  startKey: string,
  todayKey: string,
  initialValue: number,
): ForecastPoint[] {
  const map = new Map<string, number>();
  for (const point of points) {
    const key = keyFromAny(point.date);
    if (!key || key < startKey || key > todayKey) continue;
    map.set(key, point.value);
  }

  const out: ForecastPoint[] = [];
  let last = initialValue;
  for (let date = parseKey(startKey); date <= parseKey(todayKey); date = addDays(date, 1)) {
    const key = dateKey(date);
    if (map.has(key)) last = map.get(key) as number;
    out.push({ date: key, value: last });
  }
  return out;
}

interface BootstrapResult {
  p10Days: number;
  p50Days: number;
  p90Days: number;
  paceP10: number | null;
  paceP90: number | null;
  samples: number;
}

function bootstrapEta(
  increments: number[],
  remaining: number,
  seed: string,
): BootstrapResult | null {
  const history = increments.slice(-56);
  if (history.length < 3 || remaining <= 0) return null;

  const random = mulberry32(hashString(seed));
  const etas: number[] = [];
  const paces: number[] = [];
  const iterations = 500;

  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    for (let j = 0; j < history.length; j++) {
      sum += history[Math.floor(random() * history.length)];
    }
    const sampledPace = sum / history.length;
    if (sampledPace > EPSILON) {
      const days = remaining / sampledPace;
      if (Number.isFinite(days) && days > 0) {
        etas.push(clamp(days, 0.5, MAX_ETA_DAYS));
        paces.push(sampledPace);
      }
    }
  }

  if (etas.length < 20) return null;

  etas.sort((a, b) => a - b);
  paces.sort((a, b) => a - b);
  return {
    p10Days: quantile(etas, 0.1),
    p50Days: quantile(etas, 0.5),
    p90Days: quantile(etas, 0.9),
    paceP10: quantile(paces, 0.9),
    paceP90: quantile(paces, 0.1),
    samples: etas.length,
  };
}

function confidenceLabel(score: number): ForecastConfidence {
  if (score >= 70) return 'alta';
  if (score >= 45) return 'media';
  if (score > 0) return 'baja';
  return 'nula';
}

function capConfidence(
  confidence: ForecastConfidence,
  cap: ForecastConfidence | undefined,
): ForecastConfidence {
  if (!cap) return confidence;
  const order: ForecastConfidence[] = ['nula', 'baja', 'media', 'alta'];
  const currentIndex = order.indexOf(confidence);
  const capIndex = order.indexOf(cap);
  return order[Math.min(currentIndex, capIndex)];
}

function emptyResult(input: ForecastInput, status: ForecastStatus, reason: string): ResultForecast {
  const target = input.target;
  const current = input.current;
  const startValue = input.startValue ?? input.series[0]?.value ?? current;
  const isDown = input.direction === 'down';
  const targetProgress = target == null ? null : isDown ? startValue - target : target;
  const currentProgress = isDown ? startValue - current : current;
  const progressPct = targetProgress != null && targetProgress > 0
    ? clamp((currentProgress / targetProgress) * 100, 0, 100)
    : null;
  const deadline = keyFromAny(input.deadline);

  return {
    label: input.label,
    unit: input.unit,
    target,
    current,
    startValue,
    remaining: targetProgress == null ? 0 : Math.max(0, targetProgress - currentProgress),
    progressPct,
    status,
    confidence: 'nula',
    confidenceScore: 0,
    etaDate: null,
    etaRange: null,
    pace: null,
    paceRecent: null,
    paceTrend: null,
    requiredPace: null,
    paceRatio: null,
    projectedAtDeadline: null,
    deadline,
    daysLeft: deadline ? differenceInCalendarDays(parseKey(deadline), input.today) : null,
    sampleDays: 0,
    activeDays: 0,
    variability: null,
    explanation: [reason],
    assumptions: input.assumption ? [input.assumption] : [],
    chart: [],
    targetSource: input.targetSource,
    direction: isDown ? 'down' : 'up',
    seriesMode: input.seriesMode ?? 'cumulative',
  };
}

export function computeResultForecast(input: ForecastInput): ResultForecast {
  const seriesMode = input.seriesMode ?? 'cumulative';
  const direction = input.direction ?? 'up';
  const isDown = direction === 'down';
  const today = input.today;
  const todayKey = dateKey(today);

  if (input.target == null) {
    return emptyResult(
      input,
      'no-target',
      input.noTargetReason ?? 'No hay una meta numérica definida para este resultado.',
    );
  }

  const validPoints = (input.series ?? [])
    .map(point => ({ ...point, date: keyFromAny(point.date) }))
    .filter((point): point is ForecastPoint => !!point.date && Number.isFinite(point.value))
    .sort((a, b) => a.date.localeCompare(b.date));

  const startValue = input.startValue ?? validPoints[0]?.value ?? input.current;
  const targetProgress = isDown ? startValue - (input.target as number) : (input.target as number);
  const currentProgress = isDown ? startValue - input.current : input.current;

  if (currentProgress >= targetProgress - EPSILON) {
    const result = emptyResult(input, 'achieved', 'Meta alcanzada.');
    result.progressPct = 100;
    result.remaining = 0;
    result.confidence = 'alta';
    result.confidenceScore = 100;
    result.chart = validPoints.slice(-60).map(point => ({
      date: point.date,
      actual: point.value,
      projected: null,
      band: null,
    }));
    return result;
  }

  if (!validPoints.length) {
    return emptyResult(
      input,
      'no-data',
      'Todavía no hay datos de este resultado. Registra actividad para empezar a pronosticar.',
    );
  }

  const maxHistoryDays = Math.max(7, input.maxHistoryDays ?? 180);
  const floorKey = dateKey(addDays(today, -maxHistoryDays));
  const startedAtKey = keyFromAny(input.startedAt);
  const firstKey = validPoints[0].date;
  const startKey = maxKey(firstKey, startedAtKey, floorKey) ?? firstKey;

  const beforeStart = [...validPoints].filter(point => point.date <= startKey).pop();
  const initialValue = seriesMode === 'cumulative'
    ? (beforeStart?.value ?? 0)
    : (beforeStart?.value ?? validPoints[0].value);

  let dense = densify(validPoints, startKey, todayKey, initialValue);

  if (seriesMode === 'cumulative') {
    // La meta acumulada nunca puede retroceder. Si el valor actual es mayor
    // que el último registrado, se incorpora al día de hoy.
    const last = dense[dense.length - 1]?.value ?? 0;
    if (input.current > last) {
      dense[dense.length - 1] = { date: todayKey, value: input.current };
    }
    for (let i = 1; i < dense.length; i++) {
      if (dense[i].value < dense[i - 1].value) dense[i].value = dense[i - 1].value;
    }
  } else {
    // Serie absoluta: el dato más reciente manda (ELO, peso, fuerza).
    dense[dense.length - 1] = { date: todayKey, value: input.current };
  }

  // Convertimos los valores visibles a "progreso" para que una meta de
  // reducción (peso) funcione con la misma matemática que una de aumento.
  const progressSeries = dense.map(point => ({
    date: point.date,
    value: isDown ? startValue - point.value : point.value,
  }));

  const progressValues = progressSeries.map(point => point.value);
  const increments: number[] = [];
  for (let i = 1; i < progressValues.length; i++) {
    const delta = progressValues[i] - progressValues[i - 1];
    increments.push(seriesMode === 'cumulative' ? Math.max(0, delta) : delta);
  }

  const history = increments.slice(-56);
  const recentWindow = Math.min(14, history.length);
  const recentIncrements = history.slice(-recentWindow);
  const paceRecent = recentWindow > 0 ? mean(winsorize(recentIncrements)) : null;
  const trendPoints = progressSeries.slice(-56).map((point, index) => ({ x: index, y: point.value }));
  const paceTrend = theilSenSlope(trendPoints);

  let pace: number;
  if (increments.length < 5) {
    pace = mean(history);
  } else {
    pace = 0.6 * (paceRecent ?? 0) + 0.4 * paceTrend;
  }

  const sampleDays = Math.max(
    1,
    differenceInCalendarDays(parseKey(todayKey), parseKey(progressSeries[0].date)) + 1,
  );
  const activeDays = increments.filter(value => Math.abs(value) > EPSILON).length;
  const avgIncrement = mean(history);
  const variability = Math.abs(avgIncrement) > EPSILON
    ? stdev(history) / Math.abs(avgIncrement)
    : (stdev(history) > EPSILON ? 99 : 0);
  const fit = rSquared(trendPoints);

  const remaining = Math.max(0, targetProgress - currentProgress);

  let etaDays: number | null = null;
  let bootstrap: BootstrapResult | null = null;
  if (remaining > EPSILON && pace > EPSILON) {
    etaDays = clamp(remaining / pace, 0.5, MAX_ETA_DAYS);
    bootstrap = bootstrapEta(increments, remaining, `${input.label}|${input.target}|${input.current}|${history.length}`);
  }

  const extrapolationRatio = etaDays != null ? etaDays / Math.max(1, sampleDays) : null;

  let score = 0;
  score += Math.min(30, sampleDays);
  score += Math.min(25, activeDays * 3);
  if (variability <= 0.7) score += 25;
  else if (variability <= 1.1) score += 18;
  else if (variability <= 1.6) score += 10;
  if (fit >= 0.75) score += 20;
  else if (fit >= 0.5) score += 14;
  else if (fit >= 0.25) score += 7;
  if (extrapolationRatio != null && extrapolationRatio > 3) score -= 25;
  else if (extrapolationRatio != null && extrapolationRatio > 2) score -= 15;
  score = clamp(Math.round(score), 0, 100);

  const minDays = input.minDays ?? 5;
  const minActiveDays = input.minActiveDays ?? 2;
  if (sampleDays < minDays || activeDays < minActiveDays) score = 0;
  if (etaDays == null && remaining > EPSILON) score = 0;

  let confidence = confidenceLabel(score);
  confidence = capConfidence(confidence, input.maxConfidence);

  if (confidence === 'nula') {
    etaDays = null;
  }

  const p10Days = bootstrap?.p10Days ?? (etaDays != null ? Math.max(0.5, etaDays * 0.75) : null);
  const p90Days = bootstrap?.p90Days ?? (etaDays != null ? Math.min(MAX_ETA_DAYS, etaDays * 1.35) : null);

  let etaDate: string | null = etaDays != null ? dateKey(addDays(today, Math.ceil(etaDays))) : null;
  let etaRange: { optimistic: string; pessimistic: string } | null = null;
  if (etaDate && p10Days != null && p90Days != null) {
    const optimistic = dateKey(addDays(today, Math.max(1, Math.floor(p10Days))));
    const pessimistic = dateKey(addDays(today, Math.min(MAX_ETA_DAYS, Math.ceil(p90Days))));
    etaRange = {
      optimistic: optimistic <= etaDate ? optimistic : etaDate,
      pessimistic: pessimistic >= etaDate ? pessimistic : etaDate,
    };
  }

  const deadlineKey = keyFromAny(input.deadline);
  const daysLeft = deadlineKey ? differenceInCalendarDays(parseKey(deadlineKey), today) : null;

  let requiredPace: number | null = null;
  let paceRatio: number | null = null;
  let projectedAtDeadline: number | null = null;

  if (deadlineKey && daysLeft != null) {
    const daysForRequired = Math.max(1, daysLeft);
    requiredPace = remaining / daysForRequired;
    paceRatio = requiredPace > EPSILON ? pace / requiredPace : null;
    const projectedProgress = currentProgress + pace * Math.max(1, daysLeft);
    projectedAtDeadline = isDown ? startValue - projectedProgress : projectedProgress;
  }

  let status: ForecastStatus;
  const hasEnoughData = sampleDays >= minDays && activeDays >= minActiveDays;
  if (!hasEnoughData) {
    status = 'no-data';
  } else if (pace <= EPSILON) {
    // Hay datos, pero el ritmo es plano o negativo: la meta no se está moviendo.
    status = 'off-track';
  } else if (deadlineKey && daysLeft != null) {
    if (daysLeft < 0) {
      status = 'off-track';
    } else {
      const etaDayCount = Math.max(0, differenceInCalendarDays(parseKey(etaDate as string), today));
      const toleranceDays = Math.max(3, Math.round(Math.max(1, daysLeft) * 0.15));
      const ratioOk = paceRatio == null || paceRatio >= 1.02;
      const etaOk = etaDayCount <= daysLeft + toleranceDays;
      if (etaOk && ratioOk) {
        status = 'on-track';
      } else {
        const riskEtaOk = etaDayCount <= daysLeft + Math.max(14, Math.round(daysLeft * 0.3));
        const riskRatioOk = paceRatio == null || paceRatio >= 0.8;
        status = riskEtaOk && riskRatioOk ? 'at-risk' : 'off-track';
      }
    }
  } else {
    status = 'on-track';
  }

  const progressPct = targetProgress > 0
    ? clamp((currentProgress / targetProgress) * 100, 0, 100)
    : 100;

  const explanation: string[] = [];
  if (status === 'no-data') {
    if (activeDays < minActiveDays) {
      explanation.push(`Solo hay ${activeDays} día${activeDays === 1 ? '' : 's'} con actividad registrada en la ventana. Necesito al menos ${minActiveDays} para proyectar.`);
    } else {
      explanation.push('Todavía no hay suficiente historia reciente para calcular una fecha confiable.');
    }
  } else if (pace <= EPSILON) {
    explanation.push('El ritmo reciente es cero o negativo: la tendencia no está acercándote a la meta.');
    explanation.push(`Te faltan ${fmt(remaining)} ${input.unit} para la meta.`);
    if (deadlineKey) explanation.push(`La fecha límite es el ${formatDate(deadlineKey)}.`);
  } else {
    explanation.push(`Avanzas ${fmt(pace)} ${input.unit}/día en los últimos ${Math.max(1, recentWindow)} días.`);
    explanation.push(`Te faltan ${fmt(remaining)} ${input.unit} para la meta.`);
    if (etaDate) explanation.push(`A este ritmo llegarías el ${formatDate(etaDate)}.`);
    if (etaRange) explanation.push(`El 80% de los escenarios cae entre el ${formatDate(etaRange.optimistic)} y el ${formatDate(etaRange.pessimistic)}.`);
  }

  if (deadlineKey && requiredPace != null && daysLeft != null) {
    if (daysLeft < 0) {
      explanation.push(`La fecha límite (${formatDate(deadlineKey)}) ya pasó.`);
    } else {
      explanation.push(`La meta es el ${formatDate(deadlineKey)}: necesitas ${fmt(requiredPace)} ${input.unit}/día y llevas ${fmt(pace)} (${fmt(paceRatio ?? 0, 2)}×).`);
    }
  }

  const assumptions: string[] = [];
  if (input.assumption) assumptions.push(input.assumption);
  if (seriesMode === 'absolute') assumptions.push('Se usa la tendencia de los valores registrados, no un acumulado.');
  if (isDown) assumptions.push('El progreso se mide como reducción desde el valor inicial.');
  if (sampleDays < 14) assumptions.push(`Historia corta: solo ${sampleDays} días desde el inicio del resultado.`);
  if (extrapolationRatio != null && extrapolationRatio > 2) assumptions.push('La fecha estimada está lejos de la historia observada; el rango es amplio a propósito.');
  if (input.maxConfidence) assumptions.push('La confianza está limitada por la naturaleza ruidosa de este dato.');

  // Gráfico: últimos 60 días reales + proyección hasta 120 días.
  const chart: ForecastChartPoint[] = progressSeries.slice(-60).map(point => ({
    date: point.date,
    actual: isDown ? startValue - point.value : point.value,
    projected: null,
    band: null,
  }));

  if (etaDate && pace > EPSILON) {
    if (chart.length) {
      chart[chart.length - 1] = {
        ...chart[chart.length - 1],
        projected: isDown ? startValue - currentProgress : currentProgress,
      };
    }
    const horizonDays = Math.min(120, Math.max(14, Math.ceil(p90Days ?? etaDays ?? 0)));
    const fastPace = bootstrap?.paceP10 ?? pace * 1.5;
    const slowPace = bootstrap?.paceP90 ?? pace * 0.6;
    for (let day = 1; day <= horizonDays; day++) {
      const projectedProgress = currentProgress + pace * day;
      const fastProgress = currentProgress + fastPace * day;
      const slowProgress = currentProgress + slowPace * day;
      const projected = isDown ? startValue - projectedProgress : projectedProgress;
      const a = isDown ? startValue - fastProgress : fastProgress;
      const b = isDown ? startValue - slowProgress : slowProgress;
      chart.push({
        date: dateKey(addDays(today, day)),
        actual: null,
        projected,
        band: [Math.min(a, b), Math.max(a, b)],
      });
    }
  }

  return {
    label: input.label,
    unit: input.unit,
    target: input.target,
    current: input.current,
    startValue,
    remaining,
    progressPct,
    status,
    confidence,
    confidenceScore: score,
    etaDate,
    etaRange,
    pace: Number.isFinite(pace) ? pace : null,
    paceRecent,
    paceTrend: Number.isFinite(paceTrend) ? paceTrend : null,
    requiredPace,
    paceRatio,
    projectedAtDeadline,
    deadline: deadlineKey,
    daysLeft,
    sampleDays,
    activeDays,
    variability: Number.isFinite(variability) ? variability : null,
    explanation,
    assumptions,
    chart,
    targetSource: input.targetSource,
    direction,
    seriesMode,
  };
}
