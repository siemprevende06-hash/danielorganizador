import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProgressRing } from './ProgressRing';
import { ItemSelector } from './ItemSelector';
import { Book, Music, FolderKanban, GraduationCap, Calendar, Target, Plus, Trash2 } from 'lucide-react';
import type { MonthlyPlanData } from '@/hooks/useMonthlyPlan';

interface SelectableItem {
  id: string;
  title: string;
  subtitle?: string;
}

interface WidgetProps {
  planData: MonthlyPlanData;
  updatePlanData: (updater: (prev: MonthlyPlanData) => MonthlyPlanData) => void;
}

function WidgetCard({ icon, title, count, children }: { icon: React.ReactNode; title: string; count: number; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden border border-gray-200/70 dark:border-gray-800/70 shadow-sm">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
              {icon}
            </div>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              {count > 0 && <p className="text-[11px] text-muted-foreground">{count} seleccionados</p>}
            </div>
          </div>
          <ProgressRing progress={count > 0 ? 100 : 0} size={36} strokeWidth={3} strokeColor="indigo">
            <span className="text-[9px] font-bold text-indigo-500">{count}</span>
          </ProgressRing>
        </div>
        {children}
      </div>
    </Card>
  );
}

export function BookPlannerWidget({ planData, updatePlanData, items }: WidgetProps & { items: SelectableItem[] }) {
  const [goalInput, setGoalInput] = useState(String(planData.books.goal || ''));

  return (
    <WidgetCard icon={<Book className="w-4 h-4" />} title="Libros" count={planData.books.selected.length}>
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Meta:</span>
          <Input
            type="number" min={0} max={50}
            value={goalInput}
            onChange={e => {
              const n = parseInt(e.target.value) || 0;
              setGoalInput(e.target.value);
              updatePlanData(p => ({ ...p, books: { ...p.books, goal: n } }));
            }}
            className="h-7 w-16 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-muted-foreground">libros este mes</span>
        </div>
        <ItemSelector
          items={items}
          selected={planData.books.selected}
          onChange={ids => updatePlanData(p => ({ ...p, books: { ...p.books, selected: ids } }))}
          placeholder="Seleccionar libros..."
          searchPlaceholder="Buscar libro..."
        />
      </div>
    </WidgetCard>
  );
}

interface SongItem {
  id: string;
  title: string;
  artist: string | null;
  instrument: string;
}

export function SongPlannerWidget({ planData, updatePlanData, items }: WidgetProps & { items: SelectableItem[] }) {
  const [goalInput, setGoalInput] = useState(String(planData.songs.goal || ''));
  const songs: SongItem[] = items.map(i => {
    const inst = (i.subtitle || '').includes('guitar') ? 'guitar' : 'piano';
    return { id: i.id, title: i.title, artist: i.subtitle?.split(' · ')[0] || null, instrument: inst };
  });
  const pianoItems = songs.filter(s => s.instrument === 'piano');
  const guitarItems = songs.filter(s => s.instrument === 'guitar');
  const selectItems = (ids: string[]) => {
    const allSelected = [...pianoItems.filter(s => ids.includes(s.id) || planData.songs.selected.includes(s.id)), ...guitarItems.filter(s => ids.includes(s.id) || planData.songs.selected.includes(s.id))].map(s => s.id);
    const merged = [...new Set([...allSelected.filter(id => pianoItems.some(s => s.id === id) || guitarItems.some(s => s.id === id)), ...planData.songs.selected.filter(id => !items.some(i => i.id === id))])];
    updatePlanData(p => ({ ...p, songs: { ...p.songs, selected: merged } }));
  };

  return (
    <WidgetCard icon={<Music className="w-4 h-4" />} title="Canciones" count={planData.songs.selected.length}>
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Meta:</span>
          <Input
            type="number" min={0} max={50}
            value={goalInput}
            onChange={e => {
              const n = parseInt(e.target.value) || 0;
              setGoalInput(e.target.value);
              updatePlanData(p => ({ ...p, songs: { ...p.songs, goal: n } }));
            }}
            className="h-7 w-16 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-muted-foreground">canciones a aprender</span>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">Piano ({pianoItems.length})</p>
            <ItemSelector
              items={pianoItems.map(s => ({ id: s.id, title: s.title, subtitle: s.artist || undefined }))}
              selected={pianoItems.filter(s => planData.songs.selected.includes(s.id)).map(s => s.id)}
              onChange={ids => selectItems(ids)}
              placeholder="Seleccionar piano..."
              searchPlaceholder="Buscar canción de piano..."
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">Guitarra ({guitarItems.length})</p>
            <ItemSelector
              items={guitarItems.map(s => ({ id: s.id, title: s.title, subtitle: s.artist || undefined }))}
              selected={guitarItems.filter(s => planData.songs.selected.includes(s.id)).map(s => s.id)}
              onChange={ids => selectItems(ids)}
              placeholder="Seleccionar guitarra..."
              searchPlaceholder="Buscar canción de guitarra..."
            />
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}

export function ProjectPlannerWidget({ planData, updatePlanData, items }: WidgetProps & { items: SelectableItem[] }) {
  return (
    <WidgetCard icon={<FolderKanban className="w-4 h-4" />} title="Proyectos" count={planData.projects.length}>
      <ItemSelector
        items={items}
        selected={planData.projects}
        onChange={ids => updatePlanData(p => ({ ...p, projects: ids }))}
        placeholder="Seleccionar proyectos..."
        searchPlaceholder="Buscar proyecto..."
      />
    </WidgetCard>
  );
}

export function SubjectPlannerWidget({ planData, updatePlanData, items, topics }: WidgetProps & { items: SelectableItem[]; topics: SelectableItem[] }) {
  return (
    <WidgetCard icon={<GraduationCap className="w-4 h-4" />} title="Asignaturas" count={planData.subjects.length}>
      <ItemSelector
        items={items}
        selected={planData.subjects.map(s => s.subject_id)}
        onChange={ids => updatePlanData(p => ({
          ...p,
          subjects: ids.map(id => ({
            subject_id: id,
            topics: p.subjects.find(s => s.subject_id === id)?.topics || [],
          })),
        }))}
        placeholder="Seleccionar asignaturas..."
        searchPlaceholder="Buscar asignatura..."
      />
    </WidgetCard>
  );
}

export function EventPlannerWidget({ planData, updatePlanData, items }: WidgetProps & { items: SelectableItem[] }) {
  return (
    <WidgetCard icon={<Calendar className="w-4 h-4" />} title="Eventos" count={planData.events.length}>
      <ItemSelector
        items={items}
        selected={planData.events}
        onChange={ids => updatePlanData(p => ({ ...p, events: ids }))}
        placeholder="Seleccionar eventos..."
        searchPlaceholder="Buscar evento..."
      />
    </WidgetCard>
  );
}

export function GoalPlannerWidget({ planData, updatePlanData }: WidgetProps) {
  const [newGoal, setNewGoal] = useState('');

  return (
    <WidgetCard icon={<Target className="w-4 h-4" />} title="Metas Personales" count={planData.personal_goals.length}>
      <div className="space-y-2.5">
        <div className="flex gap-2">
          <Input
            placeholder="Agregar meta..."
            value={newGoal}
            onChange={e => setNewGoal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newGoal.trim()) {
                updatePlanData(p => ({ ...p, personal_goals: [...p.personal_goals, { title: newGoal.trim() }] }));
                setNewGoal('');
              }
            }}
            className="h-8 text-xs"
          />
          <Button
            size="icon" variant="ghost"
            onClick={() => {
              if (newGoal.trim()) {
                updatePlanData(p => ({ ...p, personal_goals: [...p.personal_goals, { title: newGoal.trim() }] }));
                setNewGoal('');
              }
            }}
            className="h-8 w-8 shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {planData.personal_goals.length > 0 && (
          <div className="space-y-1">
            {planData.personal_goals.map((goal, i) => (
              <div key={i} className="flex items-center gap-2 group">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <p className="text-xs flex-1 truncate">{goal.title}</p>
                <button onClick={() => updatePlanData(p => ({ ...p, personal_goals: p.personal_goals.filter((_, idx) => idx !== i) }))} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetCard>
  );
}
