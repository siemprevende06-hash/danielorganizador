// ---------------------------------------------------------------------------
// Reglas de los sistemas diarios.
// Una regla es el estándar del sistema, no la velocidad elegida para hoy:
// el verde de la caja significa "regla cumplida", aunque la tarjeta esté
// configurada en mínimo. Si el plan real exige más, la regla sube con él.
//
// Hay tres familias de sistemas:
//  - minutos: Lectura, Música, Ajedrez, Game, Idiomas...
//  - bloques: Universidad (bloques de estudio) y Emprendimiento (bloques de trabajo).
//  - tareas: Proyectos (tareas del proyecto realizadas).
// Gym usa su propio plan semanal de grupos musculares (Gym 2.0) + minutos.
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

/** Orden de los cinco sistemas con caja de regla de minutos. */
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

function evaluateStatus(
  actual: number,
  target: number,
  minimum: number,
  skipped?: boolean,
): SystemRuleStatusResult {
  if (target <= 0) {
    return { status: "sin-meta", label: "Sin meta", met: false };
  }
  if (skipped) {
    return { status: "saltado", label: "Saltado", met: false };
  }

  const done = Math.max(0, Math.round(actual || 0));

  if (done >= target) {
    return { status: "cumplido", label: "Cumplido", met: true };
  }
  if (minimum > 0 && done >= minimum) {
    return { status: "minimo", label: "Mínimo", met: false };
  }
  if (done > 0) {
    return { status: "en-progreso", label: "En curso", met: false };
  }
  return { status: "sin-registro", label: "Sin registro", met: false };
}

export function getSystemRuleStatus(
  rule: SystemRule,
  input: { minutes: number; skipped?: boolean },
): SystemRuleStatusResult {
  return evaluateStatus(
    input.minutes,
    rule.targetMinutes,
    rule.minMinutes,
    input.skipped,
  );
}

// ---------------------------------------------------------------------------
// Vista genérica de una regla: sirve para minutos, bloques y tareas.
// ---------------------------------------------------------------------------

export interface SystemRuleView {
  id: string;
  name: string;
  text: string;
  detail?: string;
  actual: number;
  target: number;
  unit: string;
  status: SystemRuleStatus;
  label: string;
  met: boolean;
  progress: number;
}

function percent(actual: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((actual / target) * 100)));
}

export interface BuildRuleViewInput {
  id: string;
  name: string;
  text: string;
  detail?: string;
  actual: number;
  target: number;
  unit: string;
  minimum?: number;
  skipped?: boolean;
  /** Texto y etiqueta cuando no hay nada programado (target 0). */
  emptyText?: string;
  emptyLabel?: string;
}

export function buildRuleView(input: BuildRuleViewInput): SystemRuleView {
  const actual = Math.max(0, Math.round(input.actual || 0));
  const target = Math.max(0, Math.round(input.target || 0));
  const base = {
    id: input.id,
    name: input.name,
    text: target > 0 ? input.text : (input.emptyText ?? "Sin meta definida"),
    detail: input.detail,
    actual,
    target,
    unit: input.unit,
    progress: percent(actual, target),
  };

  if (target <= 0) {
    return {
      ...base,
      status: "sin-meta",
      label: input.emptyLabel ?? "Sin meta",
      met: false,
    };
  }

  const result = evaluateStatus(
    actual,
    target,
    input.minimum ?? 0,
    input.skipped,
  );
  return { ...base, ...result };
}

/** Caja de minutos de los cinco sistemas con regla fija (incluye Idiomas). */
export function buildMinuteRuleView(
  habitId: string,
  minutes: number,
  options?: { skipped?: boolean; planTargetMinutes?: number },
): SystemRuleView | null {
  const rule = getSystemRule(habitId, options?.planTargetMinutes);
  if (!rule) return null;

  const actual = Math.max(0, Math.round(minutes || 0));
  const result = getSystemRuleStatus(rule, {
    minutes: actual,
    skipped: options?.skipped,
  });

  return {
    id: rule.id,
    name: rule.name,
    text: rule.text,
    actual,
    target: rule.targetMinutes,
    unit: "min",
    status: result.status,
    label: result.label,
    met: result.met,
    progress: percent(actual, rule.targetMinutes),
  };
}

/** Universidad = bloques de estudio. Emprendimiento = bloques de trabajo. */
export function buildBlocksRuleView(input: {
  id: string;
  name: string;
  /** Cuántos bloques tiene programados el día (rutina real). */
  total: number;
  /** Cuántos de esos bloques ya se completaron. */
  completed: number;
  noun: "estudio" | "trabajo";
  skipped?: boolean;
}): SystemRuleView {
  const total = Math.max(0, Math.round(input.total || 0));
  const completed = Math.min(
    total,
    Math.max(0, Math.round(input.completed || 0)),
  );
  const noun = input.noun;

  return buildRuleView({
    id: input.id,
    name: input.name,
    text: `Completar los ${total} ${total === 1 ? "bloque" : "bloques"} de ${noun} de hoy`,
    emptyText: `Sin bloques de ${noun} programados hoy`,
    emptyLabel: "Sin bloques",
    actual: completed,
    target: total,
    unit: "bloques",
    skipped: input.skipped,
  });
}

/** Proyectos = cantidad de tareas del proyecto realizadas hoy. */
export function buildProjectTasksRuleView(input: {
  done: number;
  total: number;
  skipped?: boolean;
}): SystemRuleView {
  const total = Math.max(0, Math.round(input.total || 0));
  const done = Math.min(total, Math.max(0, Math.round(input.done || 0)));

  return buildRuleView({
    id: "proyectos",
    name: "Proyectos",
    text: `Completar las ${total} ${total === 1 ? "tarea" : "tareas"} del proyecto de hoy`,
    emptyText: "Sin tareas del proyecto para hoy",
    emptyLabel: "Sin tareas",
    actual: done,
    target: total,
    unit: "tareas",
    skipped: input.skipped,
  });
}

// ---------------------------------------------------------------------------
// Gym: la regla sale de la planificación semanal de Gym 2.0
// (grupos musculares del día) + los minutos reales de entrenamiento.
// ---------------------------------------------------------------------------

export interface GymDayPlanSummary {
  status: "sin-plan" | "descanso" | "rutina";
  routineName?: string;
  muscles?: string[];
  muscleCount?: number;
}

export function buildGymRuleView(input: {
  plan: GymDayPlanSummary | null;
  minutes: number;
  targetMinutes?: number;
  minimumMinutes?: number;
  done?: boolean;
  rest?: boolean;
  skipped?: boolean;
}): SystemRuleView | null {
  const plan = input.plan;
  if (!plan) return null;

  const minutes = Math.max(0, Math.round(input.minutes || 0));
  const target = Math.max(0, Math.round(input.targetMinutes ?? 60));
  // Solo hay mínimo si se define explícitamente (no se inventan umbrales).
  const minimum = Math.max(0, Math.round(input.minimumMinutes ?? 0));

  if (input.rest || plan.status === "descanso") {
    return {
      id: "gym",
      name: "Gym",
      text: "Hoy descanso programado en Gym 2.0",
      detail: "El descanso también es parte del sistema de entrenamiento.",
      actual: minutes,
      target: 0,
      unit: "min",
      status: "sin-meta",
      label: "Descanso",
      met: false,
      progress: 0,
    };
  }

  if (plan.status === "sin-plan") {
    return {
      id: "gym",
      name: "Gym",
      text: "Sin plan semanal cargado en Gym 2.0",
      detail: "Carga tus rutinas y grupos musculares para ver el sistema del día.",
      actual: minutes,
      target: 0,
      unit: "min",
      status: "sin-meta",
      label: "Sin plan",
      met: false,
      progress: 0,
    };
  }

  const muscles = plan.muscles ?? [];
  const totalMuscles = Math.max(plan.muscleCount ?? muscles.length, muscles.length);
  const detail = muscles.length
    ? `${muscles.join(" · ")}${
        totalMuscles > muscles.length ? ` +${totalMuscles - muscles.length}` : ""
      }`
    : "Rutina sin grupos musculares configurados";

  const view = buildRuleView({
    id: "gym",
    name: "Gym",
    text: `Hoy toca ${plan.routineName ?? "entrenamiento"}`,
    detail,
    actual: minutes,
    target,
    unit: "min",
    minimum,
    skipped: input.skipped,
  });

  if (input.done && !input.skipped && view.status !== "cumplido") {
    return {
      ...view,
      actual: Math.max(minutes, target),
      status: "cumplido",
      label: "Cumplido",
      met: true,
      progress: 100,
    };
  }

  return view;
}
