import { BookMarked, BookOpen, Headphones, MessageCircle, PenLine, SquarePen, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Language } from '@/hooks/useLanguageLearning';

export type TutorSkill = 'grammar' | 'vocabulary' | 'reading' | 'listening' | 'speaking' | 'writing';

export interface TutorModeDef {
  id: TutorSkill;
  label: string;
  Icon: LucideIcon;
  /** Columna de language_sessions donde se guardan los minutos de esta habilidad. */
  statId: string;
  placeholder: string;
  quick: Record<Language, string[]>;
}

export const TUTOR_MODES: TutorModeDef[] = [
  {
    id: 'grammar',
    label: 'Gramática',
    Icon: PenLine,
    statId: 'grammar',
    placeholder: 'Pregúntame una regla o pídeme ejercicios...',
    quick: {
      english: ['Explícame el present perfect', 'Ponme 5 ejercicios de condicionales', 'Revisa mi texto y corrige los errores'],
      italian: ['Spiegami il passato prossimo', 'Dammi 5 esercizi di imperativo e condizionale', 'Rivedi il mio testo e correggi gli errori'],
    },
  },
  {
    id: 'vocabulary',
    label: 'Vocabulario',
    Icon: BookOpen,
    statId: 'vocabulary',
    placeholder: 'Dime un tema y aprendo palabras contigo...',
    quick: {
      english: ['20 palabras sobre viajes', 'Repasa las palabras que guardé', 'Palabras que siempre confundo'],
      italian: ['20 parole sulla cucina', 'Ripassa le parole che ho salvato', 'Parole che confondo sempre'],
    },
  },
  {
    id: 'reading',
    label: 'Lectura',
    Icon: BookMarked,
    statId: 'reading',
    placeholder: 'Pásame un texto y lo trabajamos juntos...',
    quick: {
      english: ['Dame un texto corto y pregúntame', 'Traduce este texto', 'Crea un texto para mi nivel'],
      italian: ['Dammi un testo breve e fammi domande', 'Traduci questo testo', 'Crea un testo per il mio livello'],
    },
  },
  {
    id: 'listening',
    label: 'Escucha',
    Icon: Headphones,
    statId: 'listening',
    placeholder: 'Simula algo para que practique escuchando...',
    quick: {
      english: ['Simula una entrevista de trabajo', 'Diálogo en un aeropuerto', 'Explica una canción que me guste'],
      italian: ['Simula un colloquio di lavoro', 'Dialogo in aeroporto', 'Spiegami una canzone'],
    },
  },
  {
    id: 'speaking',
    label: 'Speaking',
    Icon: MessageCircle,
    statId: 'speaking',
    placeholder: 'Pulsa el micro y habla conmigo...',
    quick: {
      english: ['Start a conversation about my day', 'Practice a job interview', 'Correct my pronunciation'],
      italian: ['Iniziamo a parlare della mia giornata', 'Simuliamo un colloquio', 'Correggi la mia pronuncia'],
    },
  },
  {
    id: 'writing',
    label: 'Escritura',
    Icon: SquarePen,
    statId: 'grammar',
    placeholder: 'Escribe algo y te lo corrijo con explicación...',
    quick: {
      english: ['Write me an email to my boss', 'Write a paragraph about my week', 'Correct my text and explain each mistake'],
      italian: ['Scrivi una mail al mio capo', 'Scrivi un paragrafo sulla mia settimana', 'Correggi il mio testo e spiega ogni errore'],
    },
  },
];

/** Atajos que funcionan con cualquier habilidad seleccionada. */
export const TUTOR_GENERAL: Record<Language, string[]> = {
  english: ['Evalúa mi progreso y dime qué practise', 'Examen de nivel: ¿qué me falta?', 'Dame una rutina de 15 minutos'],
  italian: ['Valuta i miei progressi e dimmi cosa praticare', 'Esame di livello: che cosa mi manca?', 'Dammi una routine di 15 minuti'],
};

export const TUTOR_EMPTY: Record<Language, string> = {
  english:
    'Soy tu Tutor IA de inglés. Puedo trabajar las 6 habilidades: gramática, vocabulario, lectura, escucha, speaking y escritura. Elige una arriba o simplemente empieza a chatear.',
  italian:
    'Sono il tuo Tutor IA di italiano. Posso lavorare tutte e 6 le abilità: grammatica, vocabolario, lettura, ascolto, speaking e scrittura. Scegli una sopra o semplicemente inizia a chattare.',
};

export const TUTOR_HEADER: Record<Language, { flag: string; name: string }> = {
  english: { flag: '🇺🇸', name: 'Inglés' },
  italian: { flag: '🇮🇹', name: 'Italiano' },
};
