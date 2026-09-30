import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useActiveSelections, type ActiveSelectionsKey } from "@/hooks/useActiveSelections";
import { useUniversity } from "@/hooks/useUniversity";
import { useProjects } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Briefcase, FolderKanban, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface FocusOption {
  id: string;
  label: string;
  done: number;
  total: number;
}

interface AreaConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  chipActive: string;
  selectionKey: ActiveSelectionsKey;
}

const AREA_CONFIG: AreaConfig[] = [
  {
    id: 'universidad',
    label: 'Universidad',
    icon: GraduationCap,
    chipActive: 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400',
    selectionKey: 'activeSubjects',
  },
  {
    id: 'emprendimiento',
    label: 'Emprendimiento',
    icon: Briefcase,
    chipActive: 'bg-purple-500/10 border-purple-500/40 text-purple-600 dark:text-purple-400',
    selectionKey: 'activeEntrepreneurships',
  },
  {
    id: 'proyectos',
    label: 'Proyectos',
    icon: FolderKanban,
    chipActive: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    selectionKey: 'activeProjects',
  },
];

interface EntrepreneurshipRow {
  id: string;
  name: string;
}

interface EntrepreneurshipTaskRow {
  entrepreneurship_id: string | null;
  completed: boolean | null;
}

export function PlanFocusPicker({ activeFocusAreas }: { activeFocusAreas?: string[] }) {
  const { subjects } = useUniversity();
  const { projects } = useProjects();

  const subjectsSel = useActiveSelections('activeSubjects');
  const entSel = useActiveSelections('activeEntrepreneurships');
  const projectsSel = useActiveSelections('activeProjects');

  const selectionsByKey: Record<ActiveSelectionsKey, { values: string[]; toggle: (id: string) => void }> = {
    activeSubjects: subjectsSel,
    activeEntrepreneurships: entSel,
    activeProjects: projectsSel,
  };

  const [entrepreneurships, setEntrepreneurships] = useState<EntrepreneurshipRow[]>([]);
  const [entTaskCounts, setEntTaskCounts] = useState<Record<string, { done: number; total: number }>>({});
  const [loading, setLoading] = useState(true);

  const enabledAreas = useMemo(
    () => (Array.isArray(activeFocusAreas) ? activeFocusAreas : []),
    [activeFocusAreas]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [entsRes, tasksRes] = await Promise.all([
          supabase.from('entrepreneurships').select('id, name').order('created_at', { ascending: true }),
          supabase.from('entrepreneurship_tasks').select('entrepreneurship_id, completed'),
        ]);
        if (cancelled) return;

        setEntrepreneurships((entsRes.data as EntrepreneurshipRow[]) || []);

        const counts: Record<string, { done: number; total: number }> = {};
        for (const row of (tasksRes.data as EntrepreneurshipTaskRow[]) || []) {
          const id = row.entrepreneurship_id;
          if (!id) continue;
          if (!counts[id]) counts[id] = { done: 0, total: 0 };
          counts[id].total += 1;
          if (row.completed) counts[id].done += 1;
        }
        setEntTaskCounts(counts);
      } catch {
        if (!cancelled) {
          setEntrepreneurships([]);
          setEntTaskCounts({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const optionsByArea = useMemo<Record<string, FocusOption[]>>(() => ({
    universidad: subjects.map(s => ({
      id: s.id,
      label: s.name,
      done: s.tasks.filter(t => t.completed).length,
      total: s.tasks.length,
    })),
    emprendimiento: entrepreneurships.map(e => ({
      id: e.id,
      label: e.name,
      done: entTaskCounts[e.id]?.done ?? 0,
      total: entTaskCounts[e.id]?.total ?? 0,
    })),
    proyectos: projects.map(p => ({
      id: p.id,
      label: p.name,
      done: p.tasks.filter(t => t.completed).length,
      total: p.tasks.length,
    })),
  }), [subjects, entrepreneurships, entTaskCounts, projects]);

  const visibleAreas = AREA_CONFIG.filter(a => enabledAreas.includes(a.id));
  const totalSelected = visibleAreas.reduce(
    (sum, a) => sum + (optionsByArea[a.id]?.length ?? 0), 0
  );

  if (loading) return null;

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-400" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-indigo-500" />
          <h2 className="text-sm font-semibold">En qué avanzo hoy</h2>
          {totalSelected > 0 && (
            <span className="ml-auto text-[10px] text-muted-foreground">
              {totalSelected} {totalSelected === 1 ? 'opción' : 'opciones'} en total
            </span>
          )}
        </div>

        {visibleAreas.length === 0 && (
          <p className="text-[11px] text-muted-foreground">
            No hay áreas de enfoque activas hoy. Actívalas más abajo para poder elegir en qué avanzar.
          </p>
        )}

        {visibleAreas.map(area => (
          <AreaPickerRow
            key={area.id}
            config={area}
            options={optionsByArea[area.id] || []}
            selectedIds={selectionsByKey[area.selectionKey].values}
            onToggle={selectionsByKey[area.selectionKey].toggle}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function AreaPickerRow({
  config,
  options,
  selectedIds,
  onToggle,
}: {
  config: AreaConfig;
  options: FocusOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const Icon = config.icon;
  const selectedCount = options.filter(o => selectedIds.includes(o.id)).length;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {config.label}
        </span>
        {options.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground/70">
            {selectedCount} de {options.length} {options.length === 1 ? 'activa' : 'activas'}
          </span>
        )}
      </div>

      {options.length === 0 ? (
        <p className="text-[10px] text-muted-foreground/70 pl-1">
          No hay nada creado en {config.label.toLowerCase()} todavía.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {options.map(opt => {
            const isActive = selectedIds.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onToggle(opt.id)}
                aria-pressed={isActive}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all",
                  isActive
                    ? config.chipActive
                    : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <span className="max-w-[160px] truncate">{opt.label}</span>
                <span className="font-mono text-[9px] opacity-70 tabular-nums">
                  {opt.done}/{opt.total}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PlanFocusPicker;
