import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { getCubaDate } from '@/lib/cubaTime';
import { normalizeCefr, type LanguageSkillId } from '@/lib/languagePlan';
import { pushSyncKey } from '@/lib/planSync';

// ---------------------------------------------------------------------------
// Plan de estudio de idiomas (inglés / italiano)
//
// Un plan de 4 semanas que se adapta al nivel CEFR y al ritmo diario elegido.
// Las tareas se marcan por ciclo (28 días) y el cuaderno de errores guarda
// las correcciones para repasarlas. Todo vive en localStorage y se sincroniza
// con Supabase mediante `pushSyncKey`.
// ---------------------------------------------------------------------------

export type StudyLanguage = 'english' | 'italian';
export type StudyBand = 'A' | 'B' | 'C';
export type StudyPace = 30 | 60 | 90;

export const STUDY_PACE_OPTIONS: { value: StudyPace; label: string; hint: string }[] = [
  { value: 30, label: 'Ligero', hint: '30 min/día' },
  { value: 60, label: 'Estándar', hint: '60 min/día' },
  { value: 90, label: 'Intenso', hint: '90 min/día' },
];

export interface StudyTask {
  id: string;
  title: string;
  detail: string;
  skill: LanguageSkillId;
  minutes: number;
}

export interface StudyDay {
  id: string;
  label: string;
  theme: string;
  tasks: StudyTask[];
}

export interface StudyWeek {
  week: number;
  title: string;
  focus: string;
  milestone: string;
  days: StudyDay[];
}

export type StudyErrorCategory = 'gramatica' | 'vocabulario' | 'pronunciacion' | 'ortografia' | 'fluidez';

export const STUDY_ERROR_CATEGORIES: { id: StudyErrorCategory; label: string; tone: string }[] = [
  { id: 'gramatica', label: 'Gramática', tone: 'bg-violet-500/15 text-violet-700 dark:text-violet-300' },
  { id: 'vocabulario', label: 'Vocabulario', tone: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  { id: 'pronunciacion', label: 'Pronunciación', tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  { id: 'ortografia', label: 'Ortografía', tone: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  { id: 'fluidez', label: 'Fluidez', tone: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
];

export interface StudyErrorEntry {
  id: string;
  wrong: string;
  correct: string;
  note: string;
  category: StudyErrorCategory;
  createdAt: string;
  reviewed: boolean;
}

export interface StudyPlanState {
  version: 1;
  startDate: string;
  pace: StudyPace;
  completed: Record<string, boolean>;
  errors: StudyErrorEntry[];
}

export interface StudyCommonError {
  wrong: string;
  correct: string;
  note: string;
  category: StudyErrorCategory;
}

// ---------------------------------------------------------------------------
// Perfil por nivel
// ---------------------------------------------------------------------------

interface LevelProfile {
  band: StudyBand;
  label: string;
  vocabularyTarget: number;
  readingWords: number;
  writingWords: number;
  speakingMinutes: number;
  tip: string;
}

function profileFor(level: string): LevelProfile {
  const cefr = normalizeCefr(level, 'B1.1');
  const band: StudyBand = cefr.startsWith('A') ? 'A' : cefr.startsWith('B') ? 'B' : 'C';
  if (band === 'A') {
    return {
      band,
      label: 'Base A1–A2',
      vocabularyTarget: 8,
      readingWords: 150,
      writingWords: 60,
      speakingMinutes: 2,
      tip: 'Frases cortas, vocabulario cotidiano y pronunciación clara. Mejor poco y bien que mucho y con dudas.',
    };
  }
  if (band === 'C') {
    return {
      band,
      label: 'Avanzado C1–C2',
      vocabularyTarget: 15,
      readingWords: 500,
      writingWords: 250,
      speakingMinutes: 8,
      tip: 'Prioriza matiz, registro y naturalidad. Sustituye palabras comodín y argumenta con precisión.',
    };
  }
  return {
    band,
    label: 'Intermedio B1–B2',
    vocabularyTarget: 12,
    readingWords: 300,
    writingWords: 150,
    speakingMinutes: 5,
    tip: 'Conecta ideas, gana fluidez y persigue precisión. El objetivo es dejar de traducir mentalmente.',
  };
}

const GRAMMAR_FOCUS: Record<StudyLanguage, Record<StudyBand, string[]>> = {
  english: {
    A: [
      'present simple vs. present continuous',
      'past simple: regulares e irregulares',
      'artículos, plurales y preposiciones básicas',
      'preguntas y negaciones en el presente',
    ],
    B: [
      'present perfect vs. past simple',
      'condicionales 0–2 y futuro',
      'reported speech y relative clauses',
      'phrasal verbs y conectores frecuentes',
    ],
    C: [
      'inversión y estructuras de énfasis',
      'subjuntivo y registro formal',
      'collocations y precisión léxica',
      'cohesión, estilo y argumentación',
    ],
  },
  italian: {
    A: [
      'presente indicativo y verbos irregulares',
      'passato prossimo con essere y avere',
      'artículos, plurales y preposiciones',
      'preguntas y negaciones básicas',
    ],
    B: [
      'imperfetto vs. passato prossimo',
      'congiuntivo presente y condizionale',
      'pronomi diretti, indiretti e combinati',
      'conectores y periodo ipotetico',
    ],
    C: [
      'congiuntivo passato y trapassato',
      'periodo ipotetico avanzado',
      'registro formal y fórmulas de cortesía',
      'modismos, collocazioni y estilo',
    ],
  },
};

const LANGUAGE_LABEL: Record<StudyLanguage, string> = {
  english: 'inglés',
  italian: 'italiano',
};

interface PlanContext extends LevelProfile {
  language: StudyLanguage;
  languageName: string;
  grammar: string;
}

type DetailFn = (ctx: PlanContext) => string;

interface TaskSeed {
  id: string;
  title: string;
  skill: LanguageSkillId;
  minutes: number;
  detail: DetailFn;
}

interface DaySeed {
  id: string;
  label: string;
  theme: string;
  tasks: TaskSeed[];
}

interface WeekSeed {
  title: string;
  focus: string;
  milestone: DetailFn;
  days: DaySeed[];
}

const WEEK_SEEDS: WeekSeed[] = [
  {
    title: 'Base y diagnóstico',
    focus: 'Detectar puntos débiles y ordenar las bases',
    milestone: c =>
      `Grabar un monólogo de ${c.speakingMinutes} min y escribir ${c.writingWords} palabras sin traductor.`,
    days: [
      {
        id: 'lun',
        label: 'Lunes',
        theme: 'Punto de partida',
        tasks: [
          {
            id: 'test-speaking',
            title: 'Test de habla',
            skill: 'speaking',
            minutes: 15,
            detail: c =>
              `Graba ${c.speakingMinutes} min presentándote en ${c.languageName}. Improvisa, no leas. Guarda el audio.`,
          },
          {
            id: 'test-writing',
            title: 'Test de escritura',
            skill: 'escritura',
            minutes: 20,
            detail: c => `Escribe ${c.writingWords} palabras sobre tu rutina. Sin traductor y sin corregir mientras escribes.`,
          },
          {
            id: 'error-hunt',
            title: 'Caza de errores',
            skill: 'gramatica',
            minutes: 15,
            detail: () =>
              'Pasa el texto y el audio por el Tutor IA. Anota los 5 errores que más se repiten en tu cuaderno.',
          },
        ],
      },
      {
        id: 'mar',
        label: 'Martes',
        theme: 'Gramática clave',
        tasks: [
          {
            id: 'grammar-rule',
            title: 'Regla del día',
            skill: 'gramatica',
            minutes: 25,
            detail: c => `Estudia ${c.grammar}. Después escribe 5 frases propias, no copiadas.`,
          },
          {
            id: 'vocab-new',
            title: 'Palabras nuevas',
            skill: 'vocabulario',
            minutes: 15,
            detail: c => `Añade ${c.vocabularyTarget} palabras a Anki o Quizlet. Prioriza las de tu día a día.`,
          },
          {
            id: 'listen-warm',
            title: 'Oído despierto',
            skill: 'listening',
            minutes: 15,
            detail: c =>
              `Escucha 10–15 min de un podcast o video en ${c.languageName} con subtítulos. Apunta 3 expresiones.`,
          },
        ],
      },
      {
        id: 'mie',
        label: 'Miércoles',
        theme: 'Escucha activa',
        tasks: [
          {
            id: 'immersion',
            title: 'Inmersión',
            skill: 'listening',
            minutes: 30,
            detail: c => `Mira 20–30 min de una serie o video en ${c.languageName} con subtítulos en ${c.languageName}.`,
          },
          {
            id: 'shadowing',
            title: 'Shadowing',
            skill: 'speaking',
            minutes: 15,
            detail: () => 'Repite en voz alta 10 frases del video imitando ritmo, pausas y entonación.',
          },
          {
            id: 'collect',
            title: 'Recolección',
            skill: 'vocabulario',
            minutes: 15,
            detail: c => `Guarda 5 expresiones nuevas del video con su frase de ejemplo en ${c.languageName}.`,
          },
        ],
      },
      {
        id: 'jue',
        label: 'Jueves',
        theme: 'Vocabulario en contexto',
        tasks: [
          {
            id: 'vocab-block',
            title: 'Bloque de palabras',
            skill: 'vocabulario',
            minutes: 20,
            detail: c => `Aprende ${c.vocabularyTarget} palabras y escribe una frase con cada una.`,
          },
          {
            id: 'own-paragraph',
            title: 'Párrafo propio',
            skill: 'escritura',
            minutes: 20,
            detail: c => `Escribe un párrafo de ${c.writingWords} palabras usando al menos 8 palabras nuevas.`,
          },
          {
            id: 'short-read',
            title: 'Lectura corta',
            skill: 'lectura-l',
            minutes: 20,
            detail: c => `Lee un artículo de unas ${c.readingWords} palabras y subraya lo que no entiendas.`,
          },
        ],
      },
      {
        id: 'vie',
        label: 'Viernes',
        theme: 'Habla sin miedo',
        tasks: [
          {
            id: 'tutor-talk',
            title: 'Conversación con el Tutor',
            skill: 'speaking',
            minutes: 30,
            detail: c => `Habla ${c.speakingMinutes} min con el Tutor IA sobre tu semana. Que no te corrija hasta el final.`,
          },
          {
            id: 'guided-fix',
            title: 'Corrección guiada',
            skill: 'gramatica',
            minutes: 20,
            detail: () => 'Pide al tutor que corrija tus 3 errores principales y explica la regla con tus palabras.',
          },
          {
            id: 'quick-review',
            title: 'Repaso rápido',
            skill: 'vocabulario',
            minutes: 10,
            detail: () => 'Repasa las tarjetas pendientes de Anki durante 10 min. Marca las que falles.',
          },
        ],
      },
      {
        id: 'sab',
        label: 'Sábado',
        theme: 'Lectura + resumen',
        tasks: [
          {
            id: 'active-read',
            title: 'Lectura activa',
            skill: 'lectura-l',
            minutes: 25,
            detail: c => `Lee un texto de ${c.readingWords} palabras de tu nivel. No traduzcas todo: busca la idea general.`,
          },
          {
            id: 'summary',
            title: 'Resumen',
            skill: 'escritura',
            minutes: 25,
            detail: () => 'Resume el texto en 5 frases. Revisa artículos, plurales y concordancia verbal.',
          },
          {
            id: 'listen-summary',
            title: 'Escucha tu resumen',
            skill: 'listening',
            minutes: 10,
            detail: () => 'Escucha tu resumen con texto a voz o un audio corto y corrige lo que suene raro.',
          },
        ],
      },
      {
        id: 'dom',
        label: 'Domingo',
        theme: 'Repaso y test',
        tasks: [
          {
            id: 'mini-test',
            title: 'Mini test',
            skill: 'gramatica',
            minutes: 20,
            detail: c => `Haz 10 ejercicios de ${c.grammar}. Anota cada fallo con su explicación.`,
          },
          {
            id: 'fluency-test',
            title: 'Test de fluidez',
            skill: 'speaking',
            minutes: 20,
            detail: () => 'Habla 3 min sobre lo aprendido sin mirar apuntes. Luego escúchate y anota 2 mejoras.',
          },
          {
            id: 'weekly-review',
            title: 'Repaso semanal',
            skill: 'vocabulario',
            minutes: 20,
            detail: () => 'Repasa todas las tarjetas de la semana. Las difíciles márcalas para el lunes.',
          },
        ],
      },
    ],
  },
  {
    title: 'Comprensión real',
    focus: 'Entrenar el oído y leer sin traducir',
    milestone: c =>
      `Entender un video de 10 min en ${c.languageName} sin subtítulos en español y resumirlo en 5 frases.`,
    days: [
      {
        id: 'lun',
        label: 'Lunes',
        theme: 'Escucha profunda',
        tasks: [
          {
            id: 'deep-listen',
            title: 'Escucha profunda',
            skill: 'listening',
            minutes: 30,
            detail: c => `Escucha 20 min de un podcast en ${c.languageName}. Primero sin texto y después con transcripción.`,
          },
          {
            id: 'listen-vocab',
            title: 'Vocabulario del audio',
            skill: 'vocabulario',
            minutes: 15,
            detail: c => `Extrae ${c.vocabularyTarget} palabras o expresiones del audio y guárdalas con su contexto.`,
          },
          {
            id: 'listen-summary',
            title: 'Resumen escrito',
            skill: 'escritura',
            minutes: 15,
            detail: () => 'Escribe qué entendiste en 5 frases. No busques perfección: busca ideas completas.',
          },
        ],
      },
      {
        id: 'mar',
        label: 'Martes',
        theme: 'Lectura guiada',
        tasks: [
          {
            id: 'guided-read',
            title: 'Lectura guiada',
            skill: 'lectura-l',
            minutes: 30,
            detail: c => `Lee un texto de ${c.readingWords} palabras. Marca conectores y palabras que se repitan.`,
          },
          {
            id: 'read-vocab',
            title: 'Vocabulario en contexto',
            skill: 'vocabulario',
            minutes: 15,
            detail: () => 'Elige 8 palabras del texto y escribe una frase nueva con cada una.',
          },
          {
            id: 'read-grammar',
            title: 'Gramática del texto',
            skill: 'gramatica',
            minutes: 15,
            detail: c => `Busca 5 ejemplos de ${c.grammar} en el texto y explica por qué se usan así.`,
          },
        ],
      },
      {
        id: 'mie',
        label: 'Miércoles',
        theme: 'Inmersión total',
        tasks: [
          {
            id: 'series',
            title: 'Serie o película',
            skill: 'listening',
            minutes: 30,
            detail: c => `Ve 20–30 min en ${c.languageName} con subtítulos en ${c.languageName}. Apunta 5 expresiones.`,
          },
          {
            id: 'shadow',
            title: 'Shadowing',
            skill: 'speaking',
            minutes: 20,
            detail: () => 'Repite 10 frases de la escena imitando el ritmo. Grábate y compara.',
          },
          {
            id: 'phrases',
            title: 'Frases útiles',
            skill: 'vocabulario',
            minutes: 10,
            detail: () => 'Guarda 5 frases completas, no palabras sueltas. El contexto manda.',
          },
        ],
      },
      {
        id: 'jue',
        label: 'Jueves',
        theme: 'Gramática en contexto',
        tasks: [
          {
            id: 'grammar-context',
            title: 'Gramática aplicada',
            skill: 'gramatica',
            minutes: 25,
            detail: c => `Repasa ${c.grammar} y escribe 8 frases sobre tu vida real usando esa estructura.`,
          },
          {
            id: 'read-article',
            title: 'Artículo corto',
            skill: 'lectura-l',
            minutes: 20,
            detail: c => `Lee un artículo de ${c.readingWords} palabras y escribe la idea principal en una frase.`,
          },
          {
            id: 'error-review',
            title: 'Cuaderno de errores',
            skill: 'escritura',
            minutes: 15,
            detail: () => 'Abre tu cuaderno de errores y reescribe 5 frases corrigiéndolas sin mirar la solución.',
          },
        ],
      },
      {
        id: 'vie',
        label: 'Viernes',
        theme: 'Voz propia',
        tasks: [
          {
            id: 'monologue',
            title: 'Monólogo',
            skill: 'speaking',
            minutes: 30,
            detail: c => `Habla ${c.speakingMinutes} min sobre un tema que te interese. Grábate y anota 3 mejoras.`,
          },
          {
            id: 'listen-back',
            title: 'Escucha crítica',
            skill: 'listening',
            minutes: 15,
            detail: () => 'Escucha tu grabación y detecta muletillas, pausas largas y pronunciación a mejorar.',
          },
          {
            id: 'new-words',
            title: 'Palabras para el monólogo',
            skill: 'vocabulario',
            minutes: 15,
            detail: c => `Añade ${c.vocabularyTarget} palabras que te faltaron al hablar y úsalas en 3 frases.`,
          },
        ],
      },
      {
        id: 'sab',
        label: 'Sábado',
        theme: 'Leer y escribir',
        tasks: [
          {
            id: 'read-long',
            title: 'Lectura larga',
            skill: 'lectura-l',
            minutes: 25,
            detail: c => `Lee ${c.readingWords * 2} palabras de un libro o artículo largo. Divide la lectura en dos tandas.`,
          },
          {
            id: 'write-opinion',
            title: 'Opinión escrita',
            skill: 'escritura',
            minutes: 25,
            detail: c => `Escribe ${c.writingWords} palabras dando tu opinión sobre lo leído con conectores.`,
          },
          {
            id: 'listen-close',
            title: 'Cierre de oído',
            skill: 'listening',
            minutes: 10,
            detail: () => 'Escucha 10 min de algo que disfrutes sin apuntar nada. Solo disfruta y observa cuánto entiendes.',
          },
        ],
      },
      {
        id: 'dom',
        label: 'Domingo',
        theme: 'Repaso y test',
        tasks: [
          {
            id: 'test-grammar',
            title: 'Test de gramática',
            skill: 'gramatica',
            minutes: 20,
            detail: c => `Haz 10 ejercicios de ${c.grammar}. Corrige y explica cada fallo.`,
          },
          {
            id: 'test-speak',
            title: 'Test de habla',
            skill: 'speaking',
            minutes: 20,
            detail: () => 'Habla 4 min sin parar sobre la semana. Cuenta las veces que bloqueas.',
          },
          {
            id: 'test-write',
            title: 'Test de escritura',
            skill: 'escritura',
            minutes: 20,
            detail: c => `Escribe ${c.writingWords} palabras sobre lo aprendido. Revisa con el Tutor IA.`,
          },
        ],
      },
    ],
  },
  {
    title: 'Producción real',
    focus: 'Hablar y escribir como lo harías de verdad',
    milestone: c =>
      `Mantener una conversación de ${c.speakingMinutes} min y escribir un email de ${c.writingWords} palabras sin traductor.`,
    days: [
      {
        id: 'lun',
        label: 'Lunes',
        theme: 'Email real',
        tasks: [
          {
            id: 'real-email',
            title: 'Email real',
            skill: 'escritura',
            minutes: 30,
            detail: c => `Escribe un email de ${c.writingWords} palabras a un amigo o compañero. Tema: algo que te haya pasado.`,
          },
          {
            id: 'email-grammar',
            title: 'Revisión gramatical',
            skill: 'gramatica',
            minutes: 15,
            detail: c => `Revisa tu email buscando errores de ${c.grammar}. Corrige y anota las reglas.`,
          },
          {
            id: 'email-vocab',
            title: 'Vocabulario útil',
            skill: 'vocabulario',
            minutes: 15,
            detail: () => 'Guarda 8 expresiones que hayas necesitado y no supieras decir.',
          },
        ],
      },
      {
        id: 'mar',
        label: 'Martes',
        theme: 'Monólogo con estructura',
        tasks: [
          {
            id: 'structured-talk',
            title: 'Monólogo estructurado',
            skill: 'speaking',
            minutes: 30,
            detail: c =>
              `Habla ${c.speakingMinutes} min: introduce, da 3 ideas y concluye. Grábate y escucha después.`,
          },
          {
            id: 'model-listen',
            title: 'Modelo nativo',
            skill: 'listening',
            minutes: 15,
            detail: c => `Escucha a un nativo hablando del mismo tema en ${c.languageName} y copia 5 expresiones.`,
          },
          {
            id: 'error-fix',
            title: 'Errores del monólogo',
            skill: 'gramatica',
            minutes: 15,
            detail: () => 'Transcribe 1 min de tu audio y corrige los errores con el Tutor IA.',
          },
        ],
      },
      {
        id: 'mie',
        label: 'Miércoles',
        theme: 'Tutor IA',
        tasks: [
          {
            id: 'tutor-conv',
            title: 'Conversación libre',
            skill: 'speaking',
            minutes: 30,
            detail: c => `Habla ${c.speakingMinutes} min con el Tutor IA sobre un tema nuevo. Pídele corrección al final.`,
          },
          {
            id: 'tutor-vocab',
            title: 'Palabras del tutor',
            skill: 'vocabulario',
            minutes: 15,
            detail: () => 'Guarda las 8 palabras que el tutor usó y tú no conocías.',
          },
          {
            id: 'tutor-write',
            title: 'Resumen de la charla',
            skill: 'escritura',
            minutes: 15,
            detail: () => 'Escribe 5 frases resumiendo la conversación. Revisa que no haya calcos del español.',
          },
        ],
      },
      {
        id: 'jue',
        label: 'Jueves',
        theme: 'Resumen oral',
        tasks: [
          {
            id: 'read-and-talk',
            title: 'Lee y cuenta',
            skill: 'lectura-l',
            minutes: 20,
            detail: c => `Lee un texto de ${c.readingWords} palabras y cuéntalo en voz alta sin mirar.`,
          },
          {
            id: 'oral-summary',
            title: 'Resumen oral',
            skill: 'speaking',
            minutes: 20,
            detail: c =>
              `Graba un resumen de ${c.speakingMinutes} min. Usa conectores en ${c.languageName}: ${
                c.language === 'english' ? 'first, then, however, finally' : 'prima, poi, tuttavia, infine'
              }.`,
          },
          {
            id: 'compare-errors',
            title: 'Compara errores',
            skill: 'escritura',
            minutes: 20,
            detail: () => 'Escucha la grabación y escribe 3 frases que dirías mejor. Añádelas a tu cuaderno.',
          },
        ],
      },
      {
        id: 'vie',
        label: 'Viernes',
        theme: 'Opinión escrita',
        tasks: [
          {
            id: 'opinion-essay',
            title: 'Texto de opinión',
            skill: 'escritura',
            minutes: 30,
            detail: c => `Escribe ${c.writingWords} palabras con estructura: introducción, 2 argumentos y conclusión.`,
          },
          {
            id: 'connector-grammar',
            title: 'Conectores',
            skill: 'gramatica',
            minutes: 15,
            detail: c => `Revisa los conectores de ${c.grammar}. Subraya los que uses y añade dos más.`,
          },
          {
            id: 'listen-podcast',
            title: 'Podcast del tema',
            skill: 'listening',
            minutes: 15,
            detail: c => `Escucha 10–15 min sobre el mismo tema en ${c.languageName}. Apunta argumentos nuevos.`,
          },
        ],
      },
      {
        id: 'sab',
        label: 'Sábado',
        theme: 'Debate',
        tasks: [
          {
            id: 'debate',
            title: 'Debate con el Tutor',
            skill: 'speaking',
            minutes: 30,
            detail: c => `Debate ${c.speakingMinutes} min con el Tutor IA. Defiende una postura y rebate la contraria.`,
          },
          {
            id: 'debate-vocab',
            title: 'Léxico de debate',
            skill: 'vocabulario',
            minutes: 15,
            detail: () => 'Aprende 8 fórmulas para dar opinión, matizar y rebatir. Úsalas en tu próximo debate.',
          },
          {
            id: 'debate-errors',
            title: 'Errores del debate',
            skill: 'gramatica',
            minutes: 15,
            detail: () => 'Pide al tutor los 5 errores más graves del debate y escríbelos con su corrección.',
          },
        ],
      },
      {
        id: 'dom',
        label: 'Domingo',
        theme: 'Test de producción',
        tasks: [
          {
            id: 'prod-write',
            title: 'Test escrito',
            skill: 'escritura',
            minutes: 30,
            detail: c => `Escribe ${c.writingWords} palabras en 30 min. Después revisa con el Tutor IA.`,
          },
          {
            id: 'prod-speak',
            title: 'Test oral',
            skill: 'speaking',
            minutes: 30,
            detail: c => `Habla ${c.speakingMinutes} min sobre un tema sorpresa. Grábate y evalúa fluidez y precisión.`,
          },
          {
            id: 'prod-fix',
            title: 'Repaso de fallos',
            skill: 'gramatica',
            minutes: 30,
            detail: () => 'Revisa los fallos de la semana y repite las estructuras que más se te resistan.',
          },
        ],
      },
    ],
  },
  {
    title: 'Integración y examen',
    focus: 'Simular una prueba real y detectar el siguiente salto',
    milestone: c =>
      `Completar un simulacro de las 4 habilidades y actualizar tu nivel CEFR en el plan mensual.`,
    days: [
      {
        id: 'lun',
        label: 'Lunes',
        theme: 'Simulacro de escucha',
        tasks: [
          {
            id: 'mock-listen',
            title: 'Simulacro de escucha',
            skill: 'listening',
            minutes: 30,
            detail: c => `Escucha un audio de ${c.languageName} de 10–15 min y responde 5 preguntas que tú mismo escribas.`,
          },
          {
            id: 'mock-vocab',
            title: 'Vocabulario del simulacro',
            skill: 'vocabulario',
            minutes: 15,
            detail: () => 'Guarda las palabras que te impidieron entender. No más de 10.',
          },
          {
            id: 'mock-errors',
            title: 'Errores de comprensión',
            skill: 'escritura',
            minutes: 15,
            detail: () => 'Apunta por qué fallaste: velocidad, vocabulario, conectores o pronunciación.',
          },
        ],
      },
      {
        id: 'mar',
        label: 'Martes',
        theme: 'Simulacro de lectura',
        tasks: [
          {
            id: 'mock-read',
            title: 'Simulacro de lectura',
            skill: 'lectura-l',
            minutes: 30,
            detail: c => `Lee ${c.readingWords * 2} palabras en 20 min y escribe la idea principal de cada párrafo.`,
          },
          {
            id: 'read-grammar',
            title: 'Gramática del texto',
            skill: 'gramatica',
            minutes: 15,
            detail: c => `Identifica 8 estructuras de ${c.grammar} en el texto y explica su función.`,
          },
          {
            id: 'read-vocab',
            title: 'Vocabulario del texto',
            skill: 'vocabulario',
            minutes: 15,
            detail: () => 'Guarda 8 palabras del texto y escribe una frase nueva con cada una.',
          },
        ],
      },
      {
        id: 'mie',
        label: 'Miércoles',
        theme: 'Simulacro de escritura',
        tasks: [
          {
            id: 'mock-write',
            title: 'Simulacro de escritura',
            skill: 'escritura',
            minutes: 40,
            detail: c => `Escribe ${c.writingWords} palabras en 30 min sobre un tema que no hayas preparado.`,
          },
          {
            id: 'write-check',
            title: 'Autocorrección',
            skill: 'gramatica',
            minutes: 15,
            detail: () => 'Revisa el texto con una lista: tiempos verbales, artículos, preposiciones y concordancia.',
          },
          {
            id: 'write-errors',
            title: 'Errores nuevos',
            skill: 'escritura',
            minutes: 5,
            detail: () => 'Añade al cuaderno solo los errores nuevos. Los repetidos ya los conoces.',
          },
        ],
      },
      {
        id: 'jue',
        label: 'Jueves',
        theme: 'Simulacro de habla',
        tasks: [
          {
            id: 'mock-speak',
            title: 'Simulacro de habla',
            skill: 'speaking',
            minutes: 30,
            detail: c => `Habla ${c.speakingMinutes} min con el Tutor IA como en un examen. Sin pausas largas.`,
          },
          {
            id: 'speak-listen',
            title: 'Escucha tu examen',
            skill: 'listening',
            minutes: 15,
            detail: () => 'Escucha la grabación y anota 3 fortalezas y 3 puntos a mejorar.',
          },
          {
            id: 'speak-vocab',
            title: 'Palabras que faltaron',
            skill: 'vocabulario',
            minutes: 15,
            detail: () => 'Guarda las palabras que buscaste mentalmente y úsalas en 3 frases.',
          },
        ],
      },
      {
        id: 'vie',
        label: 'Viernes',
        theme: 'Día de reparación',
        tasks: [
          {
            id: 'repair-grammar',
            title: 'Repara la gramática',
            skill: 'gramatica',
            minutes: 25,
            detail: () => 'Elige los 3 errores más repetidos de tu cuaderno y haz 5 frases correctas con cada uno.',
          },
          {
            id: 'repair-write',
            title: 'Reescribe',
            skill: 'escritura',
            minutes: 20,
            detail: () => 'Reescribe un texto antiguo corrigiendo todos los errores que puedas detectar.',
          },
          {
            id: 'repair-speak',
            title: 'Repite en voz alta',
            skill: 'speaking',
            minutes: 15,
            detail: () => 'Di las frases corregidas en voz alta 5 veces. La boca también memoriza.',
          },
        ],
      },
      {
        id: 'sab',
        label: 'Sábado',
        theme: 'Simulacro completo',
        tasks: [
          {
            id: 'full-listen',
            title: 'Listening',
            skill: 'listening',
            minutes: 20,
            detail: c => `Escucha 15 min en ${c.languageName} y responde 5 preguntas.`,
          },
          {
            id: 'full-read',
            title: 'Reading',
            skill: 'lectura-l',
            minutes: 20,
            detail: c => `Lee ${c.readingWords} palabras y resume en 3 frases.`,
          },
          {
            id: 'full-write',
            title: 'Writing',
            skill: 'escritura',
            minutes: 20,
            detail: c => `Escribe ${c.writingWords} palabras en 20 min.`,
          },
          {
            id: 'full-speak',
            title: 'Speaking',
            skill: 'speaking',
            minutes: 20,
            detail: c => `Habla ${c.speakingMinutes} min sobre el tema del día.`,
          },
        ],
      },
      {
        id: 'dom',
        label: 'Domingo',
        theme: 'Evaluación y siguiente ciclo',
        tasks: [
          {
            id: 'final-speak',
            title: 'Evaluación oral',
            skill: 'speaking',
            minutes: 30,
            detail: c => `Repite el test de habla del día 1 y compáralo. ¿Qué ha cambiado en ${c.speakingMinutes} min?`,
          },
          {
            id: 'final-write',
            title: 'Evaluación escrita',
            skill: 'escritura',
            minutes: 30,
            detail: c => `Repite el test de escritura del día 1 con ${c.writingWords} palabras.`,
          },
          {
            id: 'final-plan',
            title: 'Actualiza tu plan',
            skill: 'gramatica',
            minutes: 20,
            detail: () =>
              'Revisa tu cuaderno de errores, cuenta los resueltos y actualiza tu nivel en el plan mensual y trimestral.',
          },
        ],
      },
    ],
  },
];

/** Reparte el ritmo diario entre las tareas del día. */
function scaleTasks(tasks: StudyTask[], pace: number): StudyTask[] {
  if (tasks.length === 0) return tasks;
  const total = tasks.reduce((sum, task) => sum + task.minutes, 0);
  if (total <= 0) return tasks;

  const raw = tasks.map(task => (task.minutes * pace) / total);
  const rounded = raw.map(value => Math.max(5, Math.round(value / 5) * 5));
  let diff = pace - rounded.reduce((sum, value) => sum + value, 0);

  // Ajusta la tarea más larga para que el día sume exactamente el ritmo elegido.
  let index = 0;
  rounded.forEach((value, i) => {
    if (value > rounded[index]) index = i;
  });
  rounded[index] = Math.max(5, rounded[index] + diff);

  // Si el ajuste dejó el total desviado (por el mínimo de 5), corrige de nuevo.
  diff = pace - rounded.reduce((sum, value) => sum + value, 0);
  if (diff !== 0) {
    const other = rounded.findIndex((value, i) => i !== index && value + diff >= 5);
    if (other >= 0) rounded[other] += diff;
  }

  return tasks.map((task, i) => ({ ...task, minutes: rounded[i] }));
}

export function buildStudyPlan(language: StudyLanguage, level: string, pace: StudyPace): StudyWeek[] {
  const profile = profileFor(level);
  const grammarFocus = GRAMMAR_FOCUS[language][profile.band];
  const languageName = LANGUAGE_LABEL[language];

  return WEEK_SEEDS.map((seed, weekIndex) => {
    const ctx: PlanContext = {
      ...profile,
      language,
      languageName,
      grammar: grammarFocus[weekIndex % grammarFocus.length],
    };

    return {
      week: weekIndex + 1,
      title: seed.title,
      focus: `${capitalize(ctx.grammar)} · ${seed.focus}`,
      milestone: seed.milestone(ctx),
      days: seed.days.map(day => ({
        id: day.id,
        label: day.label,
        theme: day.theme,
        tasks: scaleTasks(
          day.tasks.map(task => ({
            id: task.id,
            title: task.title,
            detail: task.detail(ctx),
            skill: task.skill,
            minutes: task.minutes,
          })),
          pace
        ),
      })),
    };
  });
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getStudyProfile(level: string): { band: StudyBand; label: string; tip: string } {
  const profile = profileFor(level);
  return { band: profile.band, label: profile.label, tip: profile.tip };
}

// ---------------------------------------------------------------------------
// Estado y progreso
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = 'language_study_plan_v1_';

function storageKey(language: StudyLanguage): string {
  return `${STORAGE_PREFIX}${language}`;
}

export function defaultStudyPlanState(): StudyPlanState {
  return {
    version: 1,
    startDate: getCubaDate(),
    pace: 60,
    completed: {},
    errors: [],
  };
}

export function loadStudyPlanState(language: StudyLanguage): StudyPlanState {
  try {
    const raw = localStorage.getItem(storageKey(language));
    if (!raw) return defaultStudyPlanState();
    const parsed = JSON.parse(raw) as Partial<StudyPlanState>;
    const fallback = defaultStudyPlanState();
    return {
      version: 1,
      startDate: typeof parsed.startDate === 'string' && parsed.startDate ? parsed.startDate : fallback.startDate,
      pace: parsed.pace === 30 || parsed.pace === 90 ? parsed.pace : 60,
      completed: parsed.completed && typeof parsed.completed === 'object' ? parsed.completed : {},
      errors: Array.isArray(parsed.errors)
        ? parsed.errors.filter(
            (entry): entry is StudyErrorEntry =>
              !!entry &&
              typeof entry.id === 'string' &&
              typeof entry.wrong === 'string' &&
              typeof entry.correct === 'string'
          )
        : [],
    };
  } catch {
    return defaultStudyPlanState();
  }
}

export function saveStudyPlanState(language: StudyLanguage, state: StudyPlanState): void {
  const key = storageKey(language);
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Sin almacenamiento: el estado seguirá vivo en memoria mientras dure la sesión.
  }
  pushSyncKey(key);
}

export interface StudyCycleInfo {
  cycleStart: string;
  cycleNumber: number;
  weekIndex: number;
  weekStart: string;
  dayIndex: number;
}

function parseLocalDate(date: string): Date {
  return new Date(`${date}T12:00:00`);
}

export function getStudyCycleInfo(startDate: string, today = getCubaDate()): StudyCycleInfo {
  const start = parseLocalDate(startDate);
  const now = parseLocalDate(today);
  const validStart = Number.isNaN(start.getTime()) ? parseLocalDate(today) : start;
  const daysSince = Math.max(0, differenceInCalendarDays(now, validStart));
  const cycleNumber = Math.floor(daysSince / 28);
  const cycleStartDate = addDays(validStart, cycleNumber * 28);
  const cycleStart = format(cycleStartDate, 'yyyy-MM-dd');
  const daysIntoCycle = Math.max(0, differenceInCalendarDays(now, cycleStartDate));
  const weekIndex = Math.min(3, Math.floor(daysIntoCycle / 7));
  const weekStart = format(addDays(cycleStartDate, weekIndex * 7), 'yyyy-MM-dd');
  const dayIndex = (now.getDay() + 6) % 7;

  return { cycleStart, cycleNumber, weekIndex, weekStart, dayIndex };
}

export function studyTaskKey(cycleStart: string, week: number, dayId: string, taskId: string): string {
  return `${cycleStart}|${week}|${dayId}|${taskId}`;
}

export function countWeekProgress(
  week: StudyWeek,
  completed: Record<string, boolean>,
  cycleStart: string
): { done: number; total: number; percent: number } {
  let done = 0;
  let total = 0;
  for (const day of week.days) {
    for (const task of day.tasks) {
      total += 1;
      if (completed[studyTaskKey(cycleStart, week.week, day.id, task.id)]) done += 1;
    }
  }
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function countDayProgress(
  week: StudyWeek,
  day: StudyDay,
  completed: Record<string, boolean>,
  cycleStart: string
): { done: number; total: number; minutesDone: number } {
  let done = 0;
  let minutesDone = 0;
  for (const task of day.tasks) {
    if (completed[studyTaskKey(cycleStart, week.week, day.id, task.id)]) {
      done += 1;
      minutesDone += task.minutes;
    }
  }
  return { done, total: day.tasks.length, minutesDone };
}

export function createErrorEntry(
  input: Pick<StudyErrorEntry, 'wrong' | 'correct' | 'note' | 'category'>
): StudyErrorEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    wrong: input.wrong.trim(),
    correct: input.correct.trim(),
    note: input.note.trim(),
    category: input.category,
    createdAt: new Date().toISOString(),
    reviewed: false,
  };
}

// ---------------------------------------------------------------------------
// Errores frecuentes de hispanohablantes
// ---------------------------------------------------------------------------

export const COMMON_ERRORS: Record<StudyLanguage, StudyCommonError[]> = {
  english: [
    {
      wrong: 'I have 20 years',
      correct: 'I am 20 years old',
      note: 'La edad se dice con el verbo be, no con have.',
      category: 'gramatica',
    },
    {
      wrong: 'He don’t like it',
      correct: 'He doesn’t like it',
      note: 'Tercera persona singular: doesn’t + verbo en infinitivo.',
      category: 'gramatica',
    },
    {
      wrong: 'I didn’t went',
      correct: 'I didn’t go',
      note: 'Después de didn’t el verbo vuelve al infinitivo.',
      category: 'gramatica',
    },
    {
      wrong: 'I am agree',
      correct: 'I agree',
      note: 'Agree es un verbo, no un adjetivo.',
      category: 'gramatica',
    },
    {
      wrong: 'People is friendly',
      correct: 'People are friendly',
      note: 'People es plural en inglés.',
      category: 'gramatica',
    },
    {
      wrong: 'Explain me',
      correct: 'Explain to me',
      note: 'Explain lleva la preposición to cuando hay persona.',
      category: 'gramatica',
    },
    {
      wrong: 'Depend of',
      correct: 'Depend on',
      note: 'La preposición que acompaña a depend es on.',
      category: 'vocabulario',
    },
    {
      wrong: 'Actually',
      correct: 'Currently / At the moment',
      note: 'Actually significa en realidad, no actualmente.',
      category: 'vocabulario',
    },
    {
      wrong: 'I’m boring',
      correct: 'I’m bored',
      note: 'boring describe la causa; bored describe cómo te sientes.',
      category: 'vocabulario',
    },
    {
      wrong: 'Make a photo',
      correct: 'Take a photo',
      note: 'Colocación correcta: take a photo.',
      category: 'vocabulario',
    },
  ],
  italian: [
    {
      wrong: 'Io sono 20 anni',
      correct: 'Ho 20 anni',
      note: 'La edad se dice con avere: ho 20 anni.',
      category: 'gramatica',
    },
    {
      wrong: 'Ho andato al cinema',
      correct: 'Sono andato al cinema',
      note: 'Los verbos de movimiento usan essere en passato prossimo.',
      category: 'gramatica',
    },
    {
      wrong: 'Penso che è facile',
      correct: 'Penso che sia facile',
      note: 'Después de penso che se usa el congiuntivo.',
      category: 'gramatica',
    },
    {
      wrong: 'Mi piace i libri',
      correct: 'Mi piacciono i libri',
      note: 'El verbo concuerda con el sujeto plural: piacciono.',
      category: 'gramatica',
    },
    {
      wrong: 'Un amica',
      correct: 'Un’amica',
      note: 'Los femeninos que empiezan por vocal llevan apóstrofo.',
      category: 'ortografia',
    },
    {
      wrong: 'Qual’è',
      correct: 'Qual è',
      note: 'Qual è se escribe sin apóstrofo: es un troncamento, no una elisión.',
      category: 'ortografia',
    },
    {
      wrong: 'Un pò',
      correct: 'Un po’',
      note: 'Po’ se escribe con apóstrofo y sin acento.',
      category: 'ortografia',
    },
    {
      wrong: 'C’è due persone',
      correct: 'Ci sono due persone',
      note: 'Con un sujeto plural se usa ci sono.',
      category: 'gramatica',
    },
  ],
};
