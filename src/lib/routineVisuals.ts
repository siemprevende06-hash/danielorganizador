import {
  Book,
  BookOpen,
  Briefcase,
  Clock,
  Coffee,
  Dumbbell,
  FolderKanban,
  Gamepad2,
  Languages,
  Moon,
  Music,
  Sun,
  Target,
  type LucideIcon,
} from 'lucide-react';
import type { RoutineBlock } from '@/hooks/useRoutineBlocks';

export interface FocusVisual {
  label: string;
  border: string;
  bg: string;
  dot: string;
  accent: string;
  gradient: string;
  icon: LucideIcon;
}

/**
 * Colores e iconos compartidos por la vista de tarjetas y el modo tablet.
 * Las clases están escritas de forma literal para que Tailwind no las elimine.
 */
export const FOCUS_VISUALS: Record<string, FocusVisual> = {
  universidad: {
    label: 'Universidad',
    border: 'border-l-blue-500',
    bg: 'bg-blue-500/10',
    dot: 'bg-blue-500',
    accent: 'text-blue-300',
    gradient: 'from-blue-950 via-blue-900/80 to-slate-950',
    icon: BookOpen,
  },
  emprendimiento: {
    label: 'Emprendimiento',
    border: 'border-l-purple-500',
    bg: 'bg-purple-500/10',
    dot: 'bg-purple-500',
    accent: 'text-purple-300',
    gradient: 'from-purple-950 via-purple-900/80 to-slate-950',
    icon: Briefcase,
  },
  proyectos: {
    label: 'Proyectos',
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/10',
    dot: 'bg-emerald-500',
    accent: 'text-emerald-300',
    gradient: 'from-emerald-950 via-emerald-900/80 to-slate-950',
    icon: FolderKanban,
  },
  idiomas: {
    label: 'Idiomas',
    border: 'border-l-teal-500',
    bg: 'bg-teal-500/10',
    dot: 'bg-teal-500',
    accent: 'text-teal-300',
    gradient: 'from-teal-950 via-teal-900/80 to-slate-950',
    icon: Languages,
  },
  musica: {
    label: 'Música',
    border: 'border-l-pink-500',
    bg: 'bg-pink-500/10',
    dot: 'bg-pink-500',
    accent: 'text-pink-300',
    gradient: 'from-pink-950 via-pink-900/80 to-slate-950',
    icon: Music,
  },
  lectura: {
    label: 'Lectura',
    border: 'border-l-indigo-500',
    bg: 'bg-indigo-500/10',
    dot: 'bg-indigo-500',
    accent: 'text-indigo-300',
    gradient: 'from-indigo-950 via-indigo-900/80 to-slate-950',
    icon: Book,
  },
  tareas: {
    label: 'Tareas generales',
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/10',
    dot: 'bg-amber-500',
    accent: 'text-amber-300',
    gradient: 'from-amber-950 via-amber-900/80 to-slate-950',
    icon: Target,
  },
  descanso: {
    label: 'Descanso',
    border: 'border-l-slate-500',
    bg: 'bg-slate-500/10',
    dot: 'bg-slate-500',
    accent: 'text-slate-300',
    gradient: 'from-slate-900 via-slate-800/80 to-slate-950',
    icon: Moon,
  },
  ocio: {
    label: 'Ocio',
    border: 'border-l-orange-500',
    bg: 'bg-orange-500/10',
    dot: 'bg-orange-500',
    accent: 'text-orange-300',
    gradient: 'from-orange-950 via-orange-900/80 to-slate-950',
    icon: Coffee,
  },
  entretenimiento: {
    label: 'Entretenimiento',
    border: 'border-l-orange-500',
    bg: 'bg-orange-500/10',
    dot: 'bg-orange-500',
    accent: 'text-orange-300',
    gradient: 'from-orange-950 via-orange-900/80 to-slate-950',
    icon: Gamepad2,
  },
  gym: {
    label: 'Gym',
    border: 'border-l-orange-500',
    bg: 'bg-orange-500/10',
    dot: 'bg-orange-500',
    accent: 'text-orange-300',
    gradient: 'from-orange-950 via-orange-900/80 to-slate-950',
    icon: Dumbbell,
  },
  estructural: {
    label: 'Estructural',
    border: 'border-l-indigo-500',
    bg: 'bg-indigo-500/10',
    dot: 'bg-indigo-500',
    accent: 'text-indigo-300',
    gradient: 'from-indigo-950 via-indigo-900/80 to-slate-950',
    icon: Sun,
  },
  alimentacion: {
    label: 'Alimentación',
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/10',
    dot: 'bg-amber-500',
    accent: 'text-amber-300',
    gradient: 'from-amber-950 via-amber-900/80 to-slate-950',
    icon: Coffee,
  },
  hobbys: {
    label: 'Hobbys',
    border: 'border-l-pink-500',
    bg: 'bg-pink-500/10',
    dot: 'bg-pink-500',
    accent: 'text-pink-300',
    gradient: 'from-pink-950 via-pink-900/80 to-slate-950',
    icon: Music,
  },
  ajedrez: {
    label: 'Ajedrez',
    border: 'border-l-slate-500',
    bg: 'bg-slate-500/10',
    dot: 'bg-slate-500',
    accent: 'text-slate-300',
    gradient: 'from-slate-900 via-slate-800/80 to-slate-950',
    icon: Target,
  },
  game: {
    label: 'Game',
    border: 'border-l-orange-500',
    bg: 'bg-orange-500/10',
    dot: 'bg-orange-500',
    accent: 'text-orange-300',
    gradient: 'from-orange-950 via-orange-900/80 to-slate-950',
    icon: Gamepad2,
  },
  default: {
    label: 'Otros',
    border: 'border-l-muted-foreground/30',
    bg: 'bg-muted/30',
    dot: 'bg-muted-foreground',
    accent: 'text-slate-300',
    gradient: 'from-slate-950 via-slate-900 to-black',
    icon: Clock,
  },
};

export function getBlockFocus(
  block: Pick<RoutineBlock, 'title' | 'currentFocus' | 'defaultFocus'>,
): string {
  const focus = block.currentFocus || block.defaultFocus;
  if (focus && focus !== 'none') return focus;

  const title = block.title.toLowerCase();
  if (title.includes('gym') || title.includes('entreno')) return 'gym';
  if (
    title.includes('activación') ||
    title.includes('alistamiento') ||
    title.includes('desactivación') ||
    title.includes('dormir') ||
    title.includes('skincare') ||
    title.includes('bañ')
  ) {
    return 'estructural';
  }
  if (
    title.includes('almuerzo') ||
    title.includes('comida') ||
    title.includes('desayuno') ||
    title.includes('merienda')
  ) {
    return 'alimentacion';
  }
  if (title.includes('lectura') || title.includes('podcast')) return 'lectura';
  if (
    title.includes('música') ||
    title.includes('musica') ||
    title.includes('piano') ||
    title.includes('guitarra')
  ) {
    return 'musica';
  }
  if (title.includes('idiomas')) return 'idiomas';
  if (title.includes('ajedrez')) return 'ajedrez';
  if (title.includes('ocio')) return 'ocio';
  return 'default';
}

export function getBlockVisual(
  block: Pick<RoutineBlock, 'title' | 'currentFocus' | 'defaultFocus'>,
): FocusVisual {
  return FOCUS_VISUALS[getBlockFocus(block)] ?? FOCUS_VISUALS.default;
}
