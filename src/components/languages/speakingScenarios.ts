import { Briefcase, Coffee, PlaneTakeoff, ShoppingBag, Stethoscope, Users } from 'lucide-react';
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
];

export const SCENARIO_START_MSG =
  'Quiero practicar speaking con un simulacro. Empieza tú la conversación.';

export const SCENARIO_END_MSG =
  'Termina la simulación y dame el resumen final: errores clave, lo que hice bien y 3 frases nuevas que deba reutilizar.';
