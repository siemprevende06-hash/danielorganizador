import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Layers, Book, Music, FolderKanban, GraduationCap, Target } from 'lucide-react';
import { useState } from 'react';

interface TrimestralSummary {
  books: { goal: number; selected: number };
  songs: { goal: number; selected: number };
  projects: number;
  subjects: number;
  personal_goals: number;
  monthIndex: number;
  quarterLabel: string;
}

interface InheritedBannerProps {
  trimestral: TrimestralSummary | null;
  onImport: (category: string) => void;
}

export function InheritedBanner({ trimestral, onImport }: InheritedBannerProps) {
  const [expanded, setExpanded] = useState(true);

  if (!trimestral) return null;

  const categories = [
    { key: 'books', icon: <Book className="w-3 h-3" />, label: 'Libros', total: trimestral.books.goal, selected: trimestral.books.selected },
    { key: 'songs', icon: <Music className="w-3 h-3" />, label: 'Canciones', total: trimestral.songs.goal, selected: trimestral.songs.selected },
    { key: 'projects', icon: <FolderKanban className="w-3 h-3" />, label: 'Proyectos', total: trimestral.projects, selected: trimestral.projects },
    { key: 'subjects', icon: <GraduationCap className="w-3 h-3" />, label: 'Asignaturas', total: trimestral.subjects, selected: trimestral.subjects },
    { key: 'goals', icon: <Target className="w-3 h-3" />, label: 'Metas', total: trimestral.personal_goals, selected: trimestral.personal_goals },
  ];

  return (
    <Card className="border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/40 dark:bg-indigo-950/20">
      <div className="p-3">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold">Plan {trimestral.quarterLabel}</span>
            <Badge variant="secondary" className="text-[10px] h-5">Meta general</Badge>
          </div>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {categories.map(cat => (
                <div key={cat.key} className="flex items-center justify-between bg-white/60 dark:bg-zinc-900/40 rounded-lg px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{cat.icon}</span>
                    <span className="text-xs">{cat.label}</span>
                  </div>
                  <span className="text-xs font-semibold">{cat.selected}/{cat.total}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => onImport('all')}>
                Importar todo al mes
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-[11px] text-indigo-500" onClick={() => onImport('auto')}>
                Distribuir automáticamente
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
