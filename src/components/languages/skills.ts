import { BookText, Headphones, MessageCircle, PenLine, Sparkles, type LucideIcon } from 'lucide-react';
import { LANGUAGE_SKILLS as CANONICAL_SKILLS, type LanguageSkillId } from '@/lib/languagePlan';

export type { LanguageSkillId };

export type SkillTone = 'info' | 'focus' | 'success' | 'warning';

export type LanguageSkillDef = {
  id: LanguageSkillId;
  label: string;
  short: string;
  Icon: LucideIcon;
  tone: SkillTone;
  resource: string;
  url?: string | null;
  /** Minutos orientativos de una sesión completa de esta habilidad. */
  durationMinutes: number;
};

const SKILL_META: Record<
  LanguageSkillId,
  { Icon: LucideIcon; tone: SkillTone; resource: string; url?: string | null; durationMinutes: number }
> = {
  gramatica: {
    Icon: PenLine,
    tone: 'focus',
    resource: 'Duolingo / Tutor IA',
    url: 'https://www.duolingo.com/',
    durationMinutes: 15,
  },
  vocabulario: {
    Icon: Sparkles,
    tone: 'info',
    resource: 'Anki / Quizlet',
    url: 'https://apps.ankiweb.net/',
    durationMinutes: 10,
  },
  'lectura-l': {
    Icon: BookText,
    tone: 'warning',
    resource: 'Artículos / Libros',
    url: null,
    durationMinutes: 15,
  },
  listening: {
    Icon: Headphones,
    tone: 'info',
    resource: 'Netflix / YouTube',
    url: 'https://www.youtube.com/',
    durationMinutes: 20,
  },
  speaking: {
    Icon: MessageCircle,
    tone: 'success',
    resource: 'Tutor IA',
    url: null,
    durationMinutes: 15,
  },
  escritura: {
    Icon: PenLine,
    tone: 'focus',
    resource: 'Tutor IA / Diario',
    url: null,
    durationMinutes: 15,
  },
};

export const LANGUAGE_SKILLS: LanguageSkillDef[] = CANONICAL_SKILLS.map(skill => ({
  id: skill.id as LanguageSkillId,
  label: skill.name,
  short: skill.short,
  ...SKILL_META[skill.id as LanguageSkillId],
}));

export function toneTextClass(tone: SkillTone) {
  switch (tone) {
    case 'info':
      return 'text-info';
    case 'focus':
      return 'text-focus';
    case 'success':
      return 'text-success';
    case 'warning':
      return 'text-warning';
  }
}

export function toneBgClass(tone: SkillTone) {
  switch (tone) {
    case 'info':
      return 'bg-info/10';
    case 'focus':
      return 'bg-focus/10';
    case 'success':
      return 'bg-success/10';
    case 'warning':
      return 'bg-warning/10';
  }
}

export const SKILL_LABELS: Record<LanguageSkillId, string> = LANGUAGE_SKILLS.reduce(
  (acc, skill) => ({ ...acc, [skill.id]: skill.label }),
  {} as Record<LanguageSkillId, string>
);

export const SKILL_DURATIONS: Record<LanguageSkillId, number> = LANGUAGE_SKILLS.reduce(
  (acc, skill) => ({ ...acc, [skill.id]: skill.durationMinutes }),
  {} as Record<LanguageSkillId, number>
);
