import { Briefcase, Coffee, PlaneTakeoff, Scale, ShoppingBag, Stethoscope, UserRound, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Language } from '@/hooks/useLanguageLearning';

export interface SpeakingScenario {
  id: string;
  Icon: LucideIcon;
  label: Record<Language, string>;
  goal: Record<Language, string>;
}

export const SPEAKING_SCENARIOS: SpeakingScenario[] = [
  {
    id: 'intro',
    Icon: UserRound,
    label: { english: 'Preséntate', italian: 'Presentati' },
    goal: {
      english: 'Introduce yourself, your work and your goals in 60 seconds',
      italian: 'Presentati, parla del tuo lavoro e dei tuoi obiettivi in 60 secondi',
    },
  },
  {
    id: 'cafe',
    Icon: Coffee,
    label: { english: 'Café & restaurant', italian: 'Caffè & ristorante' },
    goal: {
      english: 'Order, ask about the menu and pay the bill',
      italian: 'Ordina, chiedi il menù e paga il conto',
    },
  },
  {
    id: 'travel',
    Icon: PlaneTakeoff,
    label: { english: 'Airport & hotel', italian: 'Aeroporto & hotel' },
    goal: {
      english: 'Check in, ask for directions and solve a problem',
      italian: 'Fai il check-in, chiedi indicazioni e risolvi un problema',
    },
  },
  {
    id: 'interview',
    Icon: Briefcase,
    label: { english: 'Job interview', italian: 'Colloquio di lavoro' },
    goal: {
      english: 'Introduce yourself and answer interview questions',
      italian: 'Presentati e rispondi alle domande del colloquio',
    },
  },
  {
    id: 'doctor',
    Icon: Stethoscope,
    label: { english: 'At the doctor', italian: 'Dal medico' },
    goal: {
      english: 'Describe symptoms and understand the advice',
      italian: 'Descrivi i sintomi e capisci i consigli',
    },
  },
  {
    id: 'shopping',
    Icon: ShoppingBag,
    label: { english: 'Shopping', italian: 'Shopping' },
    goal: {
      english: 'Ask for sizes, prices and return an item',
      italian: 'Chiedi taglie, prezzi e restituisci un capo',
    },
  },
  {
    id: 'smalltalk',
    Icon: Users,
    label: { english: 'Small talk', italian: 'Conocer gente' },
    goal: {
      english: 'Meet someone, talk about yourself and keep the conversation',
      italian: 'Conosci qualcuno, parla di te e mantieni la conversazione',
    },
  },
  {
    id: 'opinion',
    Icon: Scale,
    label: { english: 'Debate & opinión', italian: 'Dibattito & opinione' },
    goal: {
      english: 'Give your opinion, defend it with reasons and examples',
      italian: 'Dai la tua opinione, difendila con ragioni ed esempi',
    },
  },
];

/**
 * Mensaje interno que arranca la simulación. No se muestra en el chat: el
 * tutor debe abrir la conversación con su primera intervención.
 */
export const SCENARIO_START_MSG: Record<Language, string> = {
  english: 'Start the role-play now. You speak first and lead the conversation.',
  italian: 'Inizia il role-play adesso. Parla tu per primo e guida la conversazione.',
};

export const SCENARIO_END_MSG =
  'Termina la simulación y dame el resumen final: errores clave, lo que hice bien y 3 frases nuevas que deba reutilizar.';

/**
 * Cierre de una sesión libre de speaking. El tutor sale del rol, responde en
 * español y deja un plan corto para la próxima vez.
 */
export const SESSION_END_MSG =
  'Termina la sesión de conversación y dame el resumen final en español: 1) qué hice bien, 2) mis 3 errores clave con la corrección, 3) 3 frases nuevas que deba reutilizar y 4) una recomendación concreta para la próxima sesión. No me hagas más preguntas.';

