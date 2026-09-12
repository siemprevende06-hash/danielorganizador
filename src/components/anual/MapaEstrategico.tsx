import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Compass, Target, Eye, Layers, ChevronDown, BookOpen, Music, Timer, ListChecks, Flag } from 'lucide-react';
import { useTextSection } from '@/hooks/useTextSection';
import type { BoardSection } from '@/components/vision/BoardSectionEditor';
import { loadQuarterPlan, QUARTER_MONTH_KEYS } from '@/lib/hierarchy';
import { MISSION_STATEMENT, VISION_PILLARS } from '@/data/purposeStatement';
import { cn } from '@/lib/utils';

const QUARTER_NAMES = ['Q1', 'Q2', 'Q3', 'Q4'];

export function MapaEstrategico({ year }: { year: number }) {
  const { data: visionSections } = useTextSection<BoardSection[]>('objetivo-vision-data', []);

  const quarterNodes = QUARTER_NAMES.map((name, idx) => {
    const q = idx + 1;
    const plan = loadQuarterPlan(q, year);
    let minutes = 0;
    QUARTER_MONTH_KEYS.forEach(mk => {
      Object.entries((plan?.timeGoals || {})[mk] || {}).forEach(([, v]) => { minutes += Number(v) || 0; });
      Object.entries((plan?.areaTimeGoals || {})[mk] || {}).forEach(([, v]) => { minutes += Number(v) || 0; });
    });
    const books = plan?.distribution
      ? QUARTER_MONTH_KEYS.reduce((s, mk) => s + (plan.distribution?.[mk]?.books || []).length, 0)
      : (plan?.books?.goal || 0);
    const songs = plan?.distribution
      ? QUARTER_MONTH_KEYS.reduce((s, mk) => s + (plan.distribution?.[mk]?.songs || []).length, 0)
      : (plan?.songs?.goal || 0);
    return { name, minutes, books, songs, goals: (plan?.personal_goals || []).length, hasPlan: !!plan };
  });

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold">Mapa estratégico {year}</h2>
        </div>

        {/* Misión */}
        <div className="rounded-2xl border border-amber-200/50 bg-amber-50/40 dark:bg-amber-950/10 p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Flag className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Misión</span>
          </div>
          <p className="text-xs leading-relaxed text-foreground/90">{MISSION_STATEMENT}</p>
        </div>

        {/* Visión */}
        <div className="rounded-2xl border border-sky-200/50 bg-sky-50/40 dark:bg-sky-950/10 p-3.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Eye className="h-3.5 w-3.5 text-sky-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">Visión {year}</span>
          </div>
          {visionSections.length > 0 ? (
            <div className="space-y-1.5">
              {visionSections.map(sec => (
                <div key={sec.id} className="flex items-start gap-2 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500 mt-1 shrink-0" />
                  <span className="text-foreground/90">{sec.name}</span>
                  <Badge variant="outline" className="text-[9px] ml-auto shrink-0">
                    {sec.cards.filter(c => c.image_url).length} img
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Sin visión definida. Configúrala en <b>Objetivo Visión 1 Año {'>'} Tablero de Visión</b>.
            </p>
          )}
        </div>

        {/* Pilares */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {VISION_PILLARS.map(p => (
            <div key={p.title} className="rounded-xl border border-border/50 bg-card/40 p-3">
              <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1.5"><Target className="h-3 w-3" />{p.title}</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>

        {/* Cascada en trimestres */}
        {quarterNodes.some(q => q.hasPlan) && (
          <>
            <div className="flex items-center gap-2 pt-1">
              <Layers className="h-3.5 w-3.5 text-orange-500" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cascada: del propósito al trimestre</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {quarterNodes.map((q, i) => (
                <div key={q.name} className="relative rounded-2xl border border-orange-200/40 bg-orange-50/30 dark:bg-orange-950/10 p-3">
                  {i > 0 && (
                    <ChevronDown className="hidden md:block absolute -top-4 left-1/2 -translate-x-1/2 h-3.5 w-3.5 text-orange-400" />
                  )}
                  <p className="text-sm font-bold text-orange-600">{q.name}</p>
                  {q.hasPlan ? (
                    <div className="mt-1.5 space-y-0.5 text-[10px] text-muted-foreground">
                      <p className="flex items-center gap-1"><Timer className="h-3 w-3" />{q.minutes}min meta</p>
                      <p className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{q.books} libros</p>
                      <p className="flex items-center gap-1"><Music className="h-3 w-3" />{q.songs} canciones</p>
                      <p className="flex items-center gap-1"><ListChecks className="h-3 w-3" />{q.goals} metas</p>
                    </div>
                  ) : (
                    <p className={cn('text-[10px] text-muted-foreground mt-1.5')}>Sin plan definido</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}