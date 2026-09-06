import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, CheckCircle2, Circle, Sun, Moon, Utensils, BedDouble, BedSingle, Sofa, Bath, Boxes, Loader2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HOUSE_AREAS, ORGANIZACION_MOMENTS, areaLabel, type OrganizacionGroup, type OrganizacionMoment } from '@/hooks/useOrganizacion';

const AREA_ICONS: Record<string, typeof Utensils> = {
  cocina: Utensils,
  'cuarto-daniel': BedDouble,
  'cuarto-alfredo': BedSingle,
  sala: Sofa,
  bano: Bath,
  'cuarto-desahogo': Boxes,
};

const MOMENT_META: Record<OrganizacionMoment, { label: string; icon: typeof Sun; gradient: string; soft: string }> = {
  manana: {
    label: 'Mañana',
    icon: Sun,
    gradient: 'from-amber-500/20 to-orange-500/10',
    soft: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  noche: {
    label: 'Noche',
    icon: Moon,
    gradient: 'from-indigo-500/20 to-violet-500/10',
    soft: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  },
};

function CreateGroupDialog({ moment, onCreate }: { moment: OrganizacionMoment; onCreate: (p: Partial<OrganizacionGroup>) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [area, setArea] = useState(HOUSE_AREAS[0].id);
  const meta = MOMENT_META[moment];

  const submit = () => {
    if (!title.trim()) return;
    onCreate({ title: title.trim(), area, moment });
    setTitle(''); setArea(HOUSE_AREAS[0].id); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Nuevo grupo</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <meta.icon className={cn('h-4 w-4', moment === 'manana' ? 'text-amber-500' : 'text-indigo-500')} />
            Nuevo grupo · {meta.label}
          </DialogTitle>
          <DialogDescription>Crea una lista de tareas y elige el área de la casa a la que pertenece.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Nombre del grupo</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Ordenar despensa" autoFocus />
          </div>
          <div className="grid gap-2">
            <Label>Área de la casa</Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOUSE_AREAS.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!title.trim()}>Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GroupCard({
  group, tasks, onDeleteGroup, onCreateTask, onToggleTask, onDeleteTask,
}: {
  group: OrganizacionGroup;
  tasks: { id: string; title: string; completed: boolean; position: number }[];
  onDeleteGroup: (id: string) => void;
  onCreateTask: (p: { group_id: string; title: string }) => void;
  onToggleTask: (id: string, completed: boolean) => void;
  onDeleteTask: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const AreaIcon = AREA_ICONS[group.area] || ClipboardList;
  const done = tasks.filter(t => t.completed).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const add = () => {
    if (!title.trim()) return;
    onCreateTask({ group_id: group.id, title: title.trim() });
    setTitle('');
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', MOMENT_META[group.moment].soft)}>
              <AreaIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold leading-tight truncate">{group.title}</h3>
              <Badge variant="outline" className="mt-0.5 text-[10px] font-normal">
                {areaLabel(group.area)}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDeleteGroup(group.id)}>
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tareas</span><span>{done}/{tasks.length}</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        <div className="space-y-1.5">
          {tasks.map(t => (
            <div key={t.id} className="flex items-center gap-2 rounded-md border border-border/60 p-1.5">
              <button onClick={() => onToggleTask(t.id, !t.completed)} aria-label="Marcar tarea">
                {t.completed
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  : <Circle className="h-4 w-4 text-muted-foreground" />}
              </button>
              <span className={cn('flex-1 text-sm', t.completed && 'line-through text-muted-foreground')}>
                {t.title}
              </span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onDeleteTask(t.id)}>
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-xs text-muted-foreground">Aún no hay tareas en este grupo.</p>}
        </div>

        <div className="flex gap-2">
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nueva tarea..."
            className="h-9"
            onKeyDown={e => e.key === 'Enter' && add()}
          />
          <Button className="h-9 w-9 px-0" onClick={add} disabled={!title.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Organizacion() {
  const {
    groups, tasks, isLoading,
    createGroup, deleteGroup, createTask, toggleTask, deleteTask,
  } = useOrganizacion();

  const renderSection = (moment: OrganizacionMoment) => {
    const meta = MOMENT_META[moment];
    const sectionGroups = groups.filter(g => g.moment === moment);
    return (
      <section className={cn('rounded-xl border border-border/60 bg-gradient-to-b p-4', meta.gradient)}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', meta.soft)}>
              <meta.icon className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-semibold">{meta.label}</h2>
            <Badge variant="secondary" className="text-[10px]">{sectionGroups.length}</Badge>
          </div>
          <CreateGroupDialog moment={moment} onCreate={p => createGroup.mutate(p)} />
        </div>

        {sectionGroups.length === 0 && !isLoading ? (
          <p className="text-sm text-muted-foreground py-4">
            No hay grupos de tareas para {meta.label.toLowerCase()}. Crea el primero.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sectionGroups.map(g => (
              <GroupCard
                key={g.id}
                group={g}
                tasks={tasks.filter(t => t.group_id === g.id)}
                onDeleteGroup={id => deleteGroup.mutate(id)}
                onCreateTask={p => createTask.mutate(p)}
                onToggleTask={(id, completed) => toggleTask.mutate({ id, completed })}
                onDeleteTask={id => deleteTask.mutate(id)}
              />
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Organización</h1>
          <p className="text-sm text-muted-foreground">
            Listas de tareas del hogar por área de la casa, para la mañana y la noche.
          </p>
        </div>
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}

      {!isLoading && groups.length === 0 && (
        <Card><CardContent className="p-8 text-center space-y-2">
          <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Todavía no hay grupos. Crea tu primera lista de tareas en "Mañana" o "Noche".
          </p>
        </CardContent></Card>
      )}

      <div className="space-y-6">
        {ORGANIZACION_MOMENTS.map(m => (
          <div key={m.id}>{renderSection(m.id)}</div>
        ))}
      </div>
    </div>
  );
}