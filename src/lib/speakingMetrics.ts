import type { StudyErrorCategory } from './languageStudyPlan';

// ---------------------------------------------------------------------------
// Métricas y comparación de pronunciación del Speaking
//
// Todo es local y puro: no gasta llamadas al modelo. Se usa para el informe de
// sesión (M2), el entrenador de pronunciación (M1/M6) y la cola de errores
// (B15/M3).
// ---------------------------------------------------------------------------

export type SpeakingLevel = 'A2' | 'B1' | 'B2';

export const SPEAKING_LEVELS: SpeakingLevel[] = ['A2', 'B1', 'B2'];

/** 'B1.2' → 'B1'. Si no se reconoce, B1 (el nivel más habitual). */
export function levelBand(level: string | null | undefined): SpeakingLevel {
  const raw = String(level ?? '').toUpperCase();
  const match = raw.match(/\b(A2|B1|B2)\b/);
  return (match?.[1] as SpeakingLevel | undefined) ?? 'B1';
}

/** Distancia entre dos bandas CEFR (0 = mismo nivel). */
export function levelDistance(a: SpeakingLevel, b: SpeakingLevel): number {
  return Math.abs(SPEAKING_LEVELS.indexOf(a) - SPEAKING_LEVELS.indexOf(b));
}

/** Texto comparable: sin mayúsculas, tildes, puntuación ni espacios dobles. */
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/'/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function palabras(texto: string): string[] {
  const limpio = normalizarTexto(texto);
  return limpio ? limpio.split(' ') : [];
}

/** Distancia de Levenshtein entre dos cadenas. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previa = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const actual = [i];
    for (let j = 1; j <= b.length; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      actual[j] = Math.min(actual[j - 1] + 1, previa[j] + 1, previa[j - 1] + coste);
    }
    previa = actual;
  }
  return previa[b.length];
}

/** Similitud 0..1 entre dos palabras (1 = idénticas). */
export function similitudPalabra(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

export interface PronunciationWord {
  word: string;
  heard: string | null;
  ok: boolean;
  similarity: number;
}

export interface PronunciationScore {
  /** 0..100 palabras acertadas ponderadas por similitud. */
  score: number;
  /** Palabras de la frase objetivo, con lo que se entendió. */
  words: PronunciationWord[];
  correct: number;
  total: number;
  confidence: number;
}

const UMBRAL_PALABRA = 0.72;

/**
 * Compara la frase objetivo con lo que entendió el reconocedor.
 *
 * Alinea por palabras con Levenshtein (coste de sustitución = distancia de
 * caracteres normalizada). Así "watter" sigue contando como "water" parcial y
 * una palabra mal oída no hunde toda la frase.
 */
export function compararPronunciacion(
  objetivo: string,
  dicho: string,
  confidence = 0
): PronunciationScore {
  const target = palabras(objetivo);
  const heard = palabras(dicho);
  const total = target.length;

  if (total === 0) {
    return { score: 0, words: [], correct: 0, total: 0, confidence };
  }

  const n = target.length;
  const m = heard.length;
  // dp[i][j] = coste mínimo de alinear target[0..i) con heard[0..j)
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const coste = 1 - similitudPalabra(target[i - 1], heard[j - 1]);
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + coste);
    }
  }

  // Reconstrucción: qué palabra oyó el reconocedor para cada palabra objetivo.
  const words: PronunciationWord[] = Array.from({ length: n }, (_, index) => ({
    word: target[index],
    heard: null,
    ok: false,
    similarity: 0,
  }));

  let i = n;
  let j = m;
  while (i > 0) {
    if (j > 0) {
      const coste = 1 - similitudPalabra(target[i - 1], heard[j - 1]);
      if (dp[i][j] === dp[i - 1][j - 1] + coste) {
        const similitud = 1 - coste;
        words[i - 1] = {
          word: target[i - 1],
          heard: heard[j - 1],
          ok: similitud >= UMBRAL_PALABRA,
          similarity: similitud,
        };
        i -= 1;
        j -= 1;
        continue;
      }
    }
    if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      // Palabra de más: no penaliza la palabra objetivo.
      j -= 1;
      continue;
    }
    i -= 1;
  }

  const correct = words.filter(word => word.ok).length;
  const score = Math.round((correct / total) * 100);

  return { score, words, correct, total, confidence };
}

// ---------------------------------------------------------------------------
// Métricas de la sesión
// ---------------------------------------------------------------------------

export interface SpeakingFeedbackLike {
  status: string;
  corrected?: string;
  explanation?: string;
}

export interface SpeakingMetrics {
  turns: number;
  words: number;
  wpm: number;
  /** % de frases evaluadas como correctas; null si no hay evaluación. */
  correctPct: number | null;
  evaluated: number;
  correct: number;
  incorrect: number;
  fillers: number;
  avgWordsPerTurn: number;
  durationMinutes: number;
}

export function contarMuletillas(texto: string, language: 'english' | 'italian'): number {
  const muletillas =
    language === 'italian'
      ? ['cioe', 'cioè', 'tipo', 'ehm', 'eh', 'allora', 'insomma']
      : ['um', 'uh', 'erm', 'like', 'you know', 'actually', 'basically'];
  const limpio = ` ${normalizarTexto(texto)} `;
  // Variantes acentuadas ('cioè'/'cioe') colapsan al normalizar: se cuentan
  // una sola vez o el total se infla.
  const vistas = new Set<string>();
  let total = 0;
  for (const muletilla of muletillas) {
    const normalizada = normalizarTexto(muletilla);
    if (!normalizada || vistas.has(normalizada)) continue;
    vistas.add(normalizada);
    const objetivo = ` ${normalizada} `;
    let index = limpio.indexOf(objetivo);
    while (index !== -1) {
      total += 1;
      index = limpio.indexOf(objetivo, index + objetivo.length);
    }
  }
  return total;
}

export function computeSpeakingMetrics(input: {
  userTexts: string[];
  feedback: Record<string, SpeakingFeedbackLike | undefined>;
  userMessageIds: string[];
  language: 'english' | 'italian';
  durationMs: number;
}): SpeakingMetrics {
  const { userTexts, feedback, userMessageIds, language, durationMs } = input;
  const turns = userTexts.length;
  const words = userTexts.reduce((sum, text) => sum + palabras(text).length, 0);
  const durationMinutes = Math.max(0, durationMs) / 60_000;
  const wpm = durationMinutes > 0 && words > 0 ? Math.round(words / durationMinutes) : 0;

  let correct = 0;
  let incorrect = 0;
  for (const id of userMessageIds) {
    const review = feedback[id];
    if (!review) continue;
    if (review.status === 'correcto') correct += 1;
    else if (review.status === 'incorrecto') incorrect += 1;
  }
  const evaluated = correct + incorrect;
  const correctPct = evaluated > 0 ? Math.round((correct / evaluated) * 100) : null;
  const fillers = userTexts.reduce((sum, text) => sum + contarMuletillas(text, language), 0);

  return {
    turns,
    words,
    wpm,
    correctPct,
    evaluated,
    correct,
    incorrect,
    fillers,
    avgWordsPerTurn: turns > 0 ? Math.round(words / turns) : 0,
    durationMinutes: Math.round(durationMinutes * 10) / 10,
  };
}

// ---------------------------------------------------------------------------
// Errores del resumen → cuaderno
// ---------------------------------------------------------------------------

export interface SummaryError {
  wrong: string;
  correct: string;
  note: string;
}

function limpiarMarkdown(texto: string): string {
  return texto
    .replace(/\*\*/g, '')
    .replace(/^[-*•]\s*/, '')
    .replace(/`/g, '')
    .trim();
}

/**
 * Extrae los errores del resumen final (`✗ frase → ✓ corrección → por qué`).
 * Si el modelo cambia el formato, devuelve lo que pueda y nunca lanza.
 */
export function parseSummaryErrors(markdown: string): SummaryError[] {
  if (!markdown) return [];
  const salida: SummaryError[] = [];
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = limpiarMarkdown(rawLine);
    if (!line.includes('✗') || !line.includes('→')) continue;
    const partes = line.split('→').map(parte => limpiarMarkdown(parte));
    if (partes.length < 2) continue;
    const wrong = partes[0].replace(/^✗\s*/, '').replace(/^["“]|["”]$/g, '').trim();
    const correct = partes[1].replace(/^✓\s*/, '').replace(/^["“]|["”]$/g, '').trim();
    const note = (partes[2] ?? '').replace(/^✓\s*/, '').trim();
    if (!wrong || !correct) continue;
    if (salida.some(item => item.wrong.toLowerCase() === wrong.toLowerCase())) continue;
    salida.push({ wrong, correct, note });
    if (salida.length >= 6) break;
  }
  return salida;
}

const CATEGORY_HINTS: { id: StudyErrorCategory; words: string[] }[] = [
  { id: 'pronunciacion', words: ['pronunci', 'sonido', 'acento', 'se dice', 'suena'] },
  { id: 'ortografia', words: ['ortograf', 'tilde', 'mayúscula', 'escrib', 'spelling'] },
  { id: 'vocabulario', words: ['palabra', 'vocabul', 'significa', 'término', 'expresión'] },
  { id: 'fluidez', words: ['fluidez', 'natural', 'más corto', 'concis', 'directo'] },
];

/** Mapea una explicación libre a una categoría del cuaderno. */
export function inferErrorCategory(texto: string): StudyErrorCategory {
  const limpio = normalizarTexto(texto);
  for (const hint of CATEGORY_HINTS) {
    if (hint.words.some(word => limpio.includes(normalizarTexto(word)))) return hint.id;
  }
  return 'gramatica';
}

// ---------------------------------------------------------------------------
// Varios
// ---------------------------------------------------------------------------

/** Hash estable y barato para cachear evaluaciones por texto. */
export function hashTexto(texto: string): string {
  let hash = 5381;
  const limpio = normalizarTexto(texto);
  for (let i = 0; i < limpio.length; i++) {
    hash = ((hash << 5) + hash) ^ limpio.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

/** Palabras por minuto legibles; 0 cuando aún no hay datos. */
export function formatWpm(wpm: number): string {
  return wpm > 0 ? `${wpm} ppm` : '—';
}
