/**
 * Motor de pronostico para series diarias con estacionalidad semanal.
 *
 * Holt-Winters triple (nivel + tendencia + estacionalidad aditiva), con
 * busqueda de parametros por grid y seleccion del modelo via backtesting
 * walk-forward contra baselines ingenuas. Los intervalos de confianza se
 * derivan de los residuos observados durante el backtesting, no de una
 * formula asumida.
 */

export const SEASON_LENGTH = 7;

export interface ForecastOptions {
  horizon: number;
  /** Numero de origenes usados en el backtesting walk-forward. */
  backtestOrigins?: number;
  /** Minimo de observaciones necesarias para Pronostico confiable. */
  minObservations?: number;
}

export interface ForecastBand {
  lower80: number;
  upper80: number;
  lower95: number;
  upper95: number;
}

export interface ForecastResult {
  /** Serie ajustada in-sample, alineada 1:1 con la entrada. */
  fitted: number[];
  /** Valores pronosticos para horizon pasos futuros. */
  forecast: number[];
  /** Ancho de banda por paso futuro. */
  bands: ForecastBand[];
  /** MAPE (%) del modelo elegido en backtesting. */
  mape: number;
  /** RMSE del modelo elegido en backtesting. */
  rmse: number;
  /** Modelo que gano la seleccion. */
  model: HoltWintersModelName;
  /** Baseline con mejor MAPE, para contexto de calidad. */
  bestBaseline: { name: string; mape: number } | null;
  /** Componentes de tendencia y estacionalidad semanal del ajuste final. */
  level: number;
  trend: number;
  seasonal: number[];
  /** calidad del pronostico segun error observado. */
  confidence: ForecastConfidence;
  /** true cuando hay datos suficientes para Pronosticar. */
  reliable: boolean;
  /** Razon por la que no es confiable, si aplica. */
  reason: string | null;
}

export type ForecastConfidence = 'alta' | 'media' | 'baja' | 'nula';

export type HoltWintersModelName = 'holt-winters' | 'holt' | 'sesional-naive' | 'naive' | 'drift';

export const MODEL_LABELS: Record<HoltWintersModelName, string> = {
  'holt-winters': 'Holt-Winters (triple, estacionalidad semanal)',
  holt: 'Holt (doble, sin estacionalidad)',
  'sesional-naive': 'Estacional naive (mismo día de la semana pasada)',
  naive: 'Naive (último valor)',
  drift: 'Drift (tendencia lineal)',
};

const ALPHA_GRID = [0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95];
const BETA_GRID = [0.02, 0.1, 0.3, 0.5];
const GAMMA_GRID = [0.05, 0.2, 0.4, 0.6];

const EPSILON = 1e-9;

interface FittedState {
  level: number;
  trend: number;
  seasonal: number[];
}

function seasonalInit(y: number[], m: number): number[] {
  const s = new Array<number>(m).fill(0);
  if (y.length < m) return s;
  const mean = y.slice(0, m).reduce((acc, v) => acc + v, 0) / m;
  for (let i = 0; i < m; i++) s[i] = y[i] - mean;
  // centramos para que la estacionalidad tenga media cero
  const sMean = s.reduce((acc, v) => acc + v, 0) / m;
  for (let i = 0; i < m; i++) s[i] -= sMean;
  return s;
}

/** Ajuste aditivo sin estacionalidad (Holt doble). */
function fitHolt(y: number[], alpha: number, beta: number): { fitted: number[]; state: FittedState } {
  const fitted = new Array<number>(y.length).fill(0);
  let level = y[0];
  let trend = y.length > 1 ? y[1] - y[0] : 0;
  for (let t = 1; t < y.length; t++) {
    const prevLevel = level;
    const levelHat = alpha * y[t] + (1 - alpha) * (level + trend);
    trend = beta * (levelHat - prevLevel) + (1 - beta) * trend;
    level = levelHat;
    fitted[t] = level + trend;
  }
  return { fitted, state: { level, trend, seasonal: [] } };
}

/** Ajuste aditivo con estacionalidad de periodo m (Holt-Winters triple). */
function fitHoltWinters(y: number[], alpha: number, beta: number, gamma: number, m: number): { fitted: number[]; state: FittedState } {
  const fitted = new Array<number>(y.length).fill(0);
  let level = y[0];
  let trend = y.length > 1 ? (y[m] ?? y[y.length - 1]) - (y[0] ?? 0) : 0;
  const seasonal = seasonalInit(y, m);
  for (let t = m; t < y.length; t++) {
    const idx = t % m;
    const prevLevel = level;
    const levelHat = alpha * (y[t] - seasonal[idx]) + (1 - alpha) * (level + trend);
    trend = beta * (levelHat - prevLevel) + (1 - beta) * trend;
    seasonal[idx] = gamma * (y[t] - levelHat) + (1 - gamma) * seasonal[idx];
    level = levelHat;
    fitted[t] = level + trend + seasonal[idx];
  }
  for (let t = 0; t < m; t++) fitted[t] = y[t];
  return { fitted, state: { level, trend, seasonal } };
}

function project(state: FittedState, steps: number, startIndex: number, m: number, seasonalOn: boolean): number[] {
  const out: number[] = [];
  for (let i = 1; i <= steps; i++) {
    const base = state.level + i * state.trend;
    out.push(seasonalOn ? base + state.seasonal[(startIndex + i) % m] : base);
  }
  return out;
}

function projectNaive(y: number[], steps: number): number[] {
  return new Array<number>(steps).fill(y[y.length - 1]);
}

function projectSeasonalNaive(y: number[], steps: number, m: number): number[] {
  const out: number[] = [];
  for (let i = 1; i <= steps; i++) {
    const back = y[y.length - (m - ((i - 1) % m)) - 1];
    out.push(back ?? y[y.length - 1]);
  }
  return out;
}

function projectDrift(y: number[], steps: number): number[] {
  const n = y.length;
  const drift = n > 1 ? (y[n - 1] - y[0]) / (n - 1) : 0;
  return new Array<number>(steps).fill(0).map((_, i) => y[n - 1] + drift * (i + 1));
}

interface ErrorStats {
  mape: number;
  rmse: number;
  /** Errores por paso de horizonte (indice 0 = un paso adelante). */
  residualsByStep: number[][];
}

function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function score(actual: number[], predicted: number[], horizon: number, residualsByStep: number[][]): ErrorStats {
  const errs: number[] = [];
  const pctErrs: number[] = [];
  const n = Math.min(actual.length, predicted.length);
  for (let i = 0; i < n; i++) {
    const err = predicted[i] - actual[i];
    errs.push(err);
    const denom = Math.abs(actual[i]);
    if (denom > EPSILON) pctErrs.push(Math.abs(err) / denom);
    const step = Math.min(i, horizon - 1);
    residualsByStep[step].push(err);
  }
  const rmse = Math.sqrt(mean(errs.map(e => e * e)));
  const mape = pctErrs.length ? (mean(pctErrs) * 100) : Infinity;
  return { mape, rmse, residualsByStep };
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function residualStats(residualsByStep: number[][]): { p10: number; p90: number; p025: number; p975: number } {
  const all = residualsByStep.flat().filter(v => Number.isFinite(v)).sort((a, b) => a - b);
  return {
    p10: quantile(all, 0.1),
    p90: quantile(all, 0.9),
    p025: quantile(all, 0.025),
    p975: quantile(all, 0.975),
  };
}

function confidenceFromMape(mape: number): ForecastConfidence {
  if (!Number.isFinite(mape)) return 'nula';
  if (mape <= 20) return 'alta';
  if (mape <= 40) return 'media';
  if (mape <= 70) return 'baja';
  return 'nula';
}

interface Candidate {
  name: HoltWintersModelName;
  mape: number;
  rmse: number;
  residualsByStep: number[][];
  level: number;
  trend: number;
  seasonal: number[];
  fit: (train: number[], steps: number) => number[];
  refit: (train: number[]) => { fitted: number[]; state: FittedState };
}

function emptyResult(y: number[], reason: string, horizon: number): ForecastResult {
  const level = y.length ? mean(y.slice(-Math.min(7, y.length))) : 0;
  return {
    fitted: [...y],
    forecast: new Array<number>(horizon).fill(level),
    bands: new Array<ForecastBand>(horizon).fill(null).map(() => ({ lower80: level, upper80: level, lower95: level, upper95: level })),
    mape: Infinity,
    rmse: Infinity,
    model: 'naive',
    bestBaseline: null,
    level,
    trend: 0,
    seasonal: [],
    confidence: 'nula',
    reliable: false,
    reason,
  };
}

/**
 * Pronostica `horizon` pasos futuros con seleccion de modelo por backtesting.
 *
 * La serie debe estar densamente muestreada (un valor por dia, 0 si no hay
 * actividad). Devuelve tambien los residuos de backtesting para construir
 * intervalos de confianza empiricos.
 */
export function forecastSeries(y: number[], options: ForecastOptions): ForecastResult {
  const horizon = Math.max(1, options.horizon);
  const minObs = options.minObservations ?? 14;
  const series = y.map(v => (Number.isFinite(v) ? v : 0));

  if (series.length < minObs) {
    return emptyResult(series, `Solo ${series.length} días con datos (mínimo ${minObs}). No se puedepronosticar.`, horizon);
  }

  const m = SEASON_LENGTH;
  const hasSeasonality = series.length >= m * 3;
  const origins = Math.max(2, Math.min(options.backtestOrigins ?? 4, Math.floor(series.length / m)));
  const backtestStep = Math.max(m, Math.floor((series.length - m) / origins));

  const candidates: Candidate[] = [];

  const runBacktest = (
    name: HoltWintersModelName,
    train: (train: number[], steps: number) => { predicted: number[]; level: number; trend: number; seasonal: number[] },
    refit: (train: number[]) => { fitted: number[]; state: FittedState },
  ) => {
    const residualsByStep: number[][] = Array.from({ length: horizon }, () => [] as number[]);
    const actual: number[] = [];
    const predicted: number[] = [];
    let last = { predicted: [] as number[], level: 0, trend: 0, seasonal: [] as number[] };

    const cutPoints: number[] = [];
    for (let k = 1; k <= origins; k++) {
      const cut = series.length - k * backtestStep;
      if (cut >= m) cutPoints.push(cut);
    }
    if (!cutPoints.length) cutPoints.push(series.length - m);

    for (const cut of cutPoints) {
      const trainSeries = series.slice(0, cut);
      const steps = Math.min(horizon, series.length - cut);
      if (steps <= 0) continue;
      const out = train(trainSeries, steps);
      last = { predicted: out.predicted, level: out.level, trend: out.trend, seasonal: out.seasonal };
      for (let i = 0; i < steps; i++) {
        actual.push(series[cut + i]);
        predicted.push(out.predicted[i]);
      }
    }

    const stats = score(actual, predicted, horizon, residualsByStep);
    return {
      name,
      mape: stats.mape,
      rmse: stats.rmse,
      residualsByStep,
      level: last.level,
      trend: last.trend,
      seasonal: last.seasonal,
      fit: (trainSeries: number[], steps: number) => train(trainSeries, steps).predicted,
      refit,
    };
  };

  // --- candidatos parametricos (grid search) ---
  if (hasSeasonality) {
    for (const alpha of ALPHA_GRID) {
      for (const beta of BETA_GRID) {
        for (const gamma of GAMMA_GRID) {
          const c = runBacktest(
            'holt-winters',
            (trainSeries, steps) => {
              const { state } = fitHoltWinters(trainSeries, alpha, beta, gamma, m);
              return {
                predicted: project(state, steps, trainSeries.length, m, true),
                level: state.level,
                trend: state.trend,
                seasonal: state.seasonal,
              };
            },
            trainSeries => fitHoltWinters(trainSeries, alpha, beta, gamma, m),
          );
          candidates.push(c);
        }
      }
    }
  }

  for (const alpha of ALPHA_GRID) {
    for (const beta of BETA_GRID) {
      candidates.push(
        runBacktest(
          'holt',
          (trainSeries, steps) => {
            const { state } = fitHolt(trainSeries, alpha, beta);
            return {
              predicted: project(state, steps, trainSeries.length, m, false),
              level: state.level,
              trend: state.trend,
              seasonal: [],
            };
          },
          trainSeries => fitHolt(trainSeries, alpha, beta),
        ),
      );
    }
  }

  const passthroughRefit = (trainSeries: number[]) => ({
    fitted: [...trainSeries],
    state: { level: trainSeries[trainSeries.length - 1], trend: 0, seasonal: [] },
  });

  candidates.push(
    runBacktest(
      'sesional-naive',
      (trainSeries, steps) => ({
        predicted: hasSeasonality ? projectSeasonalNaive(trainSeries, steps, m) : projectNaive(trainSeries, steps),
        level: trainSeries[trainSeries.length - 1],
        trend: 0,
        seasonal: [],
      }),
      passthroughRefit,
    ),
    runBacktest(
      'naive',
      (trainSeries, steps) => ({ predicted: projectNaive(trainSeries, steps), level: trainSeries[trainSeries.length - 1], trend: 0, seasonal: [] }),
      passthroughRefit,
    ),
    runBacktest(
      'drift',
      (trainSeries, steps) => ({ predicted: projectDrift(trainSeries, steps), level: trainSeries[trainSeries.length - 1], trend: 0, seasonal: [] }),
      passthroughRefit,
    ),
  );

  const scored = candidates.filter(c => Number.isFinite(c.mape));
  if (!scored.length) return emptyResult(series, 'No fue posible validar ningún modelo con los datos disponibles.', horizon);

  scored.sort((a, b) => a.mape - b.mape);
  const best = scored[0];

  const baselineNames: HoltWintersModelName[] = ['naive', 'sesional-naive', 'drift'];
  const bestBaseline = scored
    .filter(c => baselineNames.includes(c.name))
    .reduce<typeof scored[number] | null>((acc, c) => (!acc || c.mape < acc.mape ? c : acc), null);

  // Ajuste final sobre toda la serie con los parametros ganadores.
  const full = best.fit(series, horizon);
  const res = residualStats(best.residualsByStep);

  const bands: ForecastBand[] = full.map((value, i) => {
    const widen = 1 + i * 0.06;
    return {
      lower95: value + res.p025 * widen,
      upper95: value + res.p975 * widen,
      lower80: value + res.p10 * widen,
      upper80: value + res.p90 * widen,
    };
  });

  const confidence = confidenceFromMape(best.mape);
  const reliable = confidence === 'alta' || confidence === 'media';
  const reason = reliable
    ? null
    : `Error de validación ${Number.isFinite(best.mape) ? best.mape.toFixed(0) : '—'}% — el pronóstico no es confiable todavía.`;

  return {
    fitted: best.refit(series).fitted,
    forecast: full,
    bands,
    mape: best.mape,
    rmse: best.rmse,
    model: best.name,
    bestBaseline: bestBaseline ? { name: bestBaseline.name, mape: bestBaseline.mape } : null,
    level: best.level,
    trend: best.trend,
    seasonal: best.seasonal,
    confidence,
    reliable,
    reason,
  };
}