// ---------------------------------------------------------------------------
// Reglas de los sistemas diarios de Desarrollo.
// Una regla es el estándar del sistema, no la velocidad elegida para hoy:
// el verde de la caja significa "regla cumplida", aunque la tarjeta esté
// configurada en mínimo. Si el plan real exige más, la regla sube con él.
// ---------------------------------------------------------------------------

export type SystemRuleStatus =
  | "cumplido"
  | "minimo"
  | "en-progreso"
  | "sin-registro"
  | "saltado"
  | "sin-meta";

export interface SystemRuleStatusResult {
  status: SystemRuleStatus;
  label: string;
  met: boolean;
}

interface BaseRule {
  name: string;
  targetMinutes: number;
  minMinutes: number;
  text: (target: number) => string;
}

const BASE_RULES: Record<string, BaseRule> = {
  lectura: {
    name: "Lectura",
    targetMinutes: 30,
    minMinutes: 15,
    text: target => `${target} min de lectura diaria`,
  },
  musica: {
    name: "Música",
    targetMinutes: 30,
    minMinutes: 15,
    text: target => `${target} min de práctica diaria`,
  },
  ajedrez: {
    name: "Ajedrez",
    targetMinutes: 20,
    minMinutes: 10,
    text: target => `${target} min entre aprendizaje y partida diaria`,
  },
  game: {
    name: "Game",
    targetMinutes: 20,
    minMinutes: 10,
    text: target => `${target} min de práctica diaria`,
  },
  idiomas: {
    name: "Idiomas",
    targetMinutes: 30,
    minMinutes: 15,
    text: target => `${target} min diarios entre inglés e italiano`,
  },
};

/** Orden de los cinco sistemas con caja de regla. */
export const SYSTEM_RULE_IDS = [
  "lectura",
  "ajedrez",
  "game",
  "idiomas",
  "musica",
] as const;

export type SystemRuleId = (typeof SYSTEM_RULE_IDS)[number];

export interface SystemRule {
  id: string;
  name: string;
  text: string;
  targetMinutes: number;
  minMinutes: number;
}

/**
 * Regla del sistema. `planTargetMinutes` solo puede subir el estándar
 * (por ejemplo, un plan de idiomas de 40 min/día), nunca inventarlo.
 */
export function getSystemRule(
  id: string,
  planTargetMinutes?: number,
): SystemRule | null {
  const base = BASE_RULES[id];
  if (!base) return null;

  const plan = Number(planTargetMinutes) || 0;
  const target = Math.max(base.targetMinutes, Math.round(plan));

  return {
    id,
    name: base.name,
    text: base.text(target),
    targetMinutes: target,
    minMinutes: Math.min(base.minMinutes, target),
  };
}

export function getSystemRuleStatus(
  rule: SystemRule,
  input: { minutes: number; skipped?: boolean },
): SystemRuleStatusResult {
  if (rule.targetMinutes <= 0) {
    return { status: "sin-meta", label: "Sin meta", met: false };
  }
  if (input.skipped) {
    return { status: "saltado", label: "Saltado", met: false };
  }

  const minutes = Math.max(0, Math.round(input.minutes || 0));

  if (minutes >= rule.targetMinutes) {
    return { status: "cumplido", label: "Cumplido", met: true };
  }
  if (minutes >= rule.minMinutes) {
    return { status: "minimo", label: "Mínimo", met: false };
  }
  if (minutes > 0) {
    return { status: "en-progreso", label: "En curso", met: false };
  }
  return { status: "sin-registro", label: "Sin registro", met: false };
}
