import { BookOpen, Headphones, MessageCircle, PenTool } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type LanguageSkillId = 'vocabulary' | 'grammar' | 'speaking' | 'reading' | 'listening';
export type SkillTone = 'info' | 'focus' | 'success' | 'warning';

export type LanguageSkillDef = {
  id: LanguageSkillId;
  label: string;
  Icon: LucideIcon;
  tone: SkillTone;
  resource: string;
  url?: string | null;
};

export const LANGUAGE_SKILLS: LanguageSkillDef[] = [
  { id: 'vocabulary', label: 'Vocabulario', Icon: BookOpen, tone: 'info', resource: 'Anki / Quizlet', url: 'https://apps.ankiweb.net/' },
  { id: 'grammar', label: 'Gramática', Icon: PenTool, tone: 'focus', resource: 'Duolingo', url: 'https://www.duolingo.com/' },
  { id: 'speaking', label: 'Speaking', Icon: MessageCircle, tone: 'success', resource: 'ChatGPT', url: 'https://chat.openai.com/' },
  { id: 'reading', label: 'Lectura', Icon: BookOpen, tone: 'info', resource: 'Artículos', url: null },
  { id: 'listening', label: 'Escucha', Icon: Headphones, tone: 'warning', resource: 'Netflix / YouTube', url: 'https://www.youtube.com/' },
];

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
