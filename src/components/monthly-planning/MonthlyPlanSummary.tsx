import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Book, Music, FolderKanban, GraduationCap, Calendar, Target, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MonthlyPlanData } from '@/hooks/useMonthlyPlan';
import { ProgressRing } from './ProgressRing';

const STORAGE_PREFIX = 'monthly_plan_';

function loadFromLocal(monthStr: string): MonthlyPlanData | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + monthStr);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

interface SummaryItem {
  icon: React.ReactNode;
  label: string;
  count: number;
  goal?: number;
  color: string;
  textColor: string;
}

export function MonthlyPlanSummary({ currentMonth }: { currentMonth: Date }) {
  const [planData, setPlanData] = useState<MonthlyPlanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const monthStr = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const local = loadFromLocal(monthStr);
    setPlanData(local);
    setLoading(false);
  }, [currentMonth]);

  if (loading) return null;

  if (!planData || (
    planData.books.goal === 0 &&
    planData.songs.goal === 0 &&
    planData.projects.length === 0 &&
    planData.subjects.length === 0 &&
    planData.events.length === 0 &&
    planData.personal_goals.length === 0
  )) {
    return (
      <Card className="border border-gray-200/70 dark:border-gray-800/70 shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4" />
            Sin planificación para {format(currentMonth, 'MMMM', { locale: es })}
          </div>
          <Link
            to="/monthly-planning"
            className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1"
          >
            Crear plan <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </Card>
    );
  }

  const items: SummaryItem[] = [
    { icon: <Book className="w-3.5 h-3.5" />, label: 'Libros', count: planData.books.selected.length, goal: planData.books.goal, color: 'indigo', textColor: 'text-indigo-500' },
    { icon: <Music className="w-3.5 h-3.5" />, label: 'Canciones', count: planData.songs.selected.length, goal: planData.songs.goal, color: 'emerald', textColor: 'text-emerald-500' },
    { icon: <FolderKanban className="w-3.5 h-3.5" />, label: 'Proyectos', count: planData.projects.length, color: 'amber', textColor: 'text-amber-500' },
    { icon: <GraduationCap className="w-3.5 h-3.5" />, label: 'Asignaturas', count: planData.subjects.length, color: 'blue', textColor: 'text-blue-500' },
    { icon: <Calendar className="w-3.5 h-3.5" />, label: 'Eventos', count: planData.events.length, color: 'rose', textColor: 'text-rose-500' },
    { icon: <Target className="w-3.5 h-3.5" />, label: 'Metas', count: planData.personal_goals.length, color: 'purple', textColor: 'text-purple-500' },
  ];

  return (
    <Card className="border border-gray-200/70 dark:border-gray-800/70 shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold">Plan Mensual</span>
          </div>
          <Link
            to="/monthly-planning"
            className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1"
          >
            Editar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1">
          {items.filter(i => i.goal ? i.goal > 0 : i.count > 0).map(item => (
            <div key={item.label} className="flex items-center gap-2 shrink-0">
              <ProgressRing
                progress={item.goal && item.goal > 0 ? Math.round((item.count / item.goal) * 100) : item.count > 0 ? 100 : 0}
                size={40}
                strokeWidth={3}
                strokeColor={item.color}
              >
                <span className={`text-[9px] font-bold ${item.textColor}`}>
                  {item.goal ? `${item.count}/${item.goal}` : item.count}
                </span>
              </ProgressRing>
              <div>
                <p className="text-[11px] font-medium">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">
                  {item.goal ? `${item.count} de ${item.goal}` : `${item.count} items`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
