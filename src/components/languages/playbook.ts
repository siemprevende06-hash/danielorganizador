import type { StudyTask } from '@/lib/languageStudyPlan';
import { LANGUAGE_SKILLS, type LanguageSkillDef, type LanguageSkillId } from './skills';

// ---------------------------------------------------------------------------
// Playbook de las 6 habilidades
//
// Cada habilidad tiene UNA táctica concreta (no una lista de recursos), sus
// micro-pasos, lo que debe hacer el Tutor IA y cómo se mide el progreso.
// La tarjeta de habilidad, el paso de la sesión diaria y el arranque del tutor
// leen de aquí para que el método sea el mismo en toda la página.
// ---------------------------------------------------------------------------

/** Variable CSS del acento de cada habilidad (definida en index.css). */
export const SKILL_VAR: Record<LanguageSkillId, string> = {
  gramatica: '--skill-grammar',
  vocabulario: '--skill-vocab',
  'lectura-l': '--skill-reading',
  listening: '--skill-listening',
  speaking: '--skill-speaking',
  escritura: '--skill-writing',
};

/** Color del acento listo para usar en estilos inline y en recharts. */
export function skillColor(id: LanguageSkillId, alpha = 1): string {
  return `hsl(var(${SKILL_VAR[id]}) / ${alpha})`;
}

export interface SkillPlaybook {
  /** Qué se persigue con esta habilidad. */
  goal: string;
  /** Nombre de la técnica. */
  tactic: string;
  /** Micro-pasos de una sesión. */
  steps: string[];
  /** Cómo se mide el progreso sin inventar datos. */
  metric: string;
  /** Minutos recomendados de una sesión completa. */
  minutes: number;
  /** Prompt con el que arranca el Tutor IA en esta habilidad. */
  prompt: string;
}

export const PLAYBOOK: Record<LanguageSkillId, SkillPlaybook> = {
  gramatica: {
    goal: 'Automatizar una regla hasta usarla sin pensar.',
    tactic: 'Notar → manipular → usar',
    steps: ['Ve 3 ejemplos y deduce la regla', 'Transforma 5 frases', 'Úsala 3 veces hablando'],
    metric: 'Aciertos en los ejercicios y usos espontáneos al hablar',
    minutes: 15,
    prompt:
      'Modo gramática (nivel {nivel}). Elige una regla útil para mi nivel y: 1) dame 3 ejemplos cortos, 2) hazme deducir la regla, 3) ponme 5 frases para transformar y 4) al final hazme usar la regla en 3 frases sobre mi vida. Corrige cada respuesta explicando el porqué en español.',
  },
  vocabulario: {
    goal: 'Recordar la palabra cuando la necesitas, no cuando la ves.',
    tactic: 'Repaso espaciado + recuperación activa',
    steps: ['Repasa 8 tarjetas que vencen hoy', 'Escribe una frase de tu vida con cada una', 'Úsalas hoy en el tutor'],
    metric: 'Palabras dominadas por semana',
    minutes: 10,
    prompt:
      'Modo vocabulario (nivel {nivel}). Tema: mi día a día. 1) Dame 8 palabras o expresiones nuevas con una frase de ejemplo cada una. 2) Después hazme un test de recuperación: me das el significado y yo escribo la palabra. 3) Con las que falle, invéntate una historia corta. No me des la traducción hasta que lo intente.',
  },
  'lectura-l': {
    goal: 'Leer sin traducir y quedarte con la idea.',
    tactic: 'Lectura i+1 en cuatro pasos',
    steps: ['Predice el tema', 'Lee sin traducir', 'Resume en 2 frases', 'Responde 3 preguntas'],
    metric: 'Comprensión de las preguntas y velocidad de lectura',
    minutes: 15,
    prompt:
      'Modo lectura (nivel {nivel}). 1) Dame un texto de unas 150 palabras sobre un tema interesante, sin traducirlo. 2) Después hazme 3 preguntas de comprensión y 1 de inferencia. 3) Al final, pídeme un resumen de dos frases y corrígelo.',
  },
  listening: {
    goal: 'Entrenar el oído con textos que casi entiendes.',
    tactic: 'Tres pasadas + dictado',
    steps: ['Escucha la idea general', 'Escucha el detalle', 'Dictado y comparación'],
    metric: 'Porcentaje de palabras correctas en el dictado',
    minutes: 20,
    prompt:
      'Modo escucha (nivel {nivel}). Dicta 5 frases cortas, una por una, esperando a que yo escriba cada una antes de seguir. Cuando envíe mi transcripción, corrígeme palabra por palabra, marca lo que fallé y repite solo esas frases. No me enseñes el texto antes de que lo intente.',
  },
  speaking: {
    goal: 'Hablar sin guion y corregir sobre la marcha.',
    tactic: 'Shadowing → roleplay → corrección',
    steps: ['Imita 3 frases (shadowing)', 'Responde 60 s sin guion', 'Corrige y repite'],
    metric: 'Minutos hablados y errores por turno',
    minutes: 15,
    prompt:
      'Modo speaking (nivel {nivel}). Empezamos un roleplay: tú eres mi interlocutor y yo tengo que resolver la situación. Hazme una pregunta a la vez y espera mi respuesta. Corrige solo lo importante al final de cada turno, con una versión mejor de mi frase para que la repita.',
  },
  escritura: {
    goal: 'Escribir mejor en cada versión, no en la primera.',
    tactic: 'Escritura procesual',
    steps: ['Estudia un modelo', 'Escribe un borrador', 'Corrige 1 error por frase', 'Reescribe'],
    metric: 'Errores por 100 palabras y calidad de la versión 2',
    minutes: 15,
    prompt:
      'Modo escritura (nivel {nivel}). 1) Proponme un tema y una extensión (80-120 palabras) para mi nivel. 2) Cuando te envíe mi texto, corrige con una explicación por error y sin reescribirlo todo por mí. 3) Pídeme que lo reescriba yo y compara las dos versiones.',
  },
};

export function tacticPrompt(skill: LanguageSkillId, level: string): string {
  return PLAYBOOK[skill].prompt.replace('{nivel}', level);
}

export interface SkillMeta extends LanguageSkillDef {
  playbook: SkillPlaybook;
  color: string;
}

/** Las 6 habilidades con su método, listas para pintar. */
export const SKILL_CATALOG: SkillMeta[] = LANGUAGE_SKILLS.map(skill => ({
  ...skill,
  playbook: PLAYBOOK[skill.id],
  color: skillColor(skill.id),
}));

// ---------------------------------------------------------------------------
// Sesión guiada del día
// ---------------------------------------------------------------------------

export type SessionStepKind = 'task' | 'focus' | 'close';

export interface SessionStep {
  id: string;
  kind: SessionStepKind;
  skill: LanguageSkillId | null;
  title: string;
  detail: string;
  minutes: number;
  /** Tarea del plan de 4 semanas a la que corresponde, si existe. */
  taskId?: string;
}

const CLOSE_STEP: SessionStep = {
  id: 'session-close',
  kind: 'close',
  skill: null,
  title: 'Cierre: errores y una frase nueva',
  detail: 'Repasa lo que falló, guarda un error en el cuaderno y di en voz alta una frase que hayas aprendido hoy.',
  minutes: 3,
};

const MAX_TASK_STEPS = 5;

/**
 * Ordena el día como una mini-lección: las tareas del plan (que ya vienen
 * generadas por nivel y ritmo) + el foco elegido + un cierre reflexivo.
 * Si el foco no aparece en el plan, entra como paso propio.
 */
export function composeSession(tasks: StudyTask[], focus: LanguageSkillId | null): SessionStep[] {
  const steps: SessionStep[] = tasks.slice(0, MAX_TASK_STEPS).map(task => ({
    id: `task-${task.id}`,
    kind: 'task',
    skill: task.skill,
    title: task.title,
    detail: task.detail,
    minutes: task.minutes,
    taskId: task.id,
  }));

  if (focus && !steps.some(step => step.skill === focus)) {
    const meta = SKILL_CATALOG.find(skill => skill.id === focus);
    if (meta) {
      steps.splice(Math.min(1, steps.length), 0, {
        id: `focus-${focus}`,
        kind: 'focus',
        skill: focus,
        title: `Foco: ${meta.label}`,
        detail: meta.playbook.tactic,
        minutes: meta.playbook.minutes,
      });
    }
  }

  return [...steps, CLOSE_STEP];
}

export function sessionMinutes(steps: SessionStep[]): number {
  return steps.reduce((sum, step) => sum + step.minutes, 0);
}
