import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, BookOpen, Briefcase, FolderKanban, GraduationCap,
  CalendarDays, Loader2, Rows3,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUniversity } from '@/hooks/useUniversity';
import { cn } from '@/lib/utils';

interface PendingTask {
  id: string;
  title: string;
  source: 'university' | 'entrepreneurship' | 'project';
  sourceName?: string;
}

interface Props {
  activeSubjectsProp?: { id: string; name: string }[];
}

const SOURCE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  university: { label: 'Universidad', color: 'text-emerald-400', icon: <BookOpen className="h-3 w-3" /> },
  entrepreneurship: { label: 'Emprendimiento', color: 'text-purple-400', icon: <Briefcase className="h-3 w-3" /> },
  project: { label: 'Proyecto', color: 'text-orange-400', icon: <FolderKanban className="h-3 w-3" /> },
};

export function UniEntrepreneurshipProjectPanel({ activeSubjectsProp = [] }: Props) {
  const { getSubjectsByCurrentSemester } = useUniversity();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [universityTasks, setUniversityTasks] = useState<PendingTask[]>([]);
  const [entrepreneurshipTasks, setEntrepreneurshipTasks] = useState<PendingTask[]>([]);
  const [projectTasks, setProjectTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);

  const activeSubjects = useMemo(() => {
    if (activeSubjectsProp.length > 0) return activeSubjectsProp;
    return getSubjectsByCurrentSemester()
      .filter(s => !s.approved)
      .map(s => ({ id: s.id, name: s.name }));
  }, [activeSubjectsProp, getSubjectsByCurrentSemester]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    try {
      const queries: any[] = [
        supabase
          .from('entrepreneurship_tasks')
          .select('id, title, entrepreneurship_id, entrepreneurships(name)')
          .eq('completed', false)
          .lte('due_date', `${todayStr}T23:59:59`),
        supabase
          .from('tasks')
          .select('id, title')
          .eq('source', 'project')
          .eq('completed', false)
          .lte('due_date', `${todayStr}T23:59:59`),
      ];

      if (selectedSubjectId !== 'all') {
        queries.push(
          supabase
            .from('tasks')
            .select('id, title')
            .eq('source', 'university')
            .eq('source_id', selectedSubjectId)
            .eq('completed', false)
            .lte('due_date', `${todayStr}T23:59:59`)
        );
      }

      const [entRes, projRes, uniRes] = await Promise.all(queries);

      setEntrepreneurshipTasks((entRes.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        source: 'entrepreneurship' as const,
        sourceName: t.entrepreneurships?.name,
      })));
      setProjectTasks((projRes.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        source: 'project' as const,
      })));
      setUniversityTasks(
        selectedSubjectId !== 'all'
          ? (uniRes?.data || []).map((t: any) => ({
              id: t.id,
              title: t.title,
              source: 'university' as const,
              sourceName: activeSubjects.find(s => s.id === selectedSubjectId)?.name,
            }))
          : []
      );
    } catch (error) {
      console.error('Error loading panel tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, activeSubjects]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const allTasks = useMemo(
    () => [...universityTasks, ...entrepreneurshipTasks, ...projectTasks],
    [universityTasks, entrepreneurshipTasks, projectTasks]
  );

  const query = searchQuery.trim().toLowerCase();
  const filterQuery = (list: PendingTask[]) =>
    query ? list.filter(t => t.title.toLowerCase().includes(query)) : list;

  const sections = useMemo(
    () => [
      { id: 'university', label: 'Universidad', tasks: filterQuery(universityTasks) },
      { id: 'entrepreneurship', label: 'Emprendimiento', tasks: filterQuery(entrepreneurshipTasks) },
      { id: 'project', label: 'Proyecto', tasks: filterQuery(projectTasks) },
    ],
    [universityTasks, entrepreneurshipTasks, projectTasks, query]
  );

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
      <div className="p-2.5 border-b shrink-0">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-foreground flex items-center gap-2 mb-2">
          <GraduationCap className="h-3 w-3 text-primary" />
          Uni · Emprendimiento · Proyecto
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 ml-auto">
            {allTasks.length}
          </Badge>
        </h3>

        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3 shrink-0 text-muted-foreground" />
          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
            <SelectTrigger className="h-7 w-full text-[10px]">
              <SelectValue placeholder="Asignatura del día" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todas las asignaturas</SelectItem>
              {activeSubjects.map(subject => (
                <SelectItem key={subject.id} value={subject.id} className="text-xs">
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative mt-2">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && allTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Rows3 className="h-4 w-4 mb-2 opacity-40" />
              <p className="text-[10px]">Sin tareas pendientes 🎯</p>
            </div>
          )}
          {sections.map(section => {
            if (section.tasks.length === 0) return null;
            const cfg = SOURCE_CONFIG[section.id] || {
              label: section.label,
              color: 'text-muted-foreground',
              icon: null,
            };
            return (
              <div key={section.id}>
                <div className="flex items-center gap-1.5 px-1">
                  <span className={cfg.color}>{cfg.icon}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {cfg.label}
                  </span>
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 ml-auto">
                    {section.tasks.length}
                  </Badge>
                </div>
                <div className="space-y-0.5">
                  {section.tasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={e => handleDragStart(e, task.id)}
                      className="flex items-center gap-2 p-2 rounded-md border cursor-grab active:cursor-grabbing transition-all hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{task.title}</p>
                        {task.sourceName && (
                          <p className="text-[9px] text-muted-foreground truncate">{task.sourceName}</p>
                        )}
                      </div>
                      <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-2 border-t text-[9px] text-muted-foreground text-center shrink-0">
        Arrastra tareas a los bloques de deep work
      </div>
    </Card>
  );
}
