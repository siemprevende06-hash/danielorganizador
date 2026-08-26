import { useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ImagePlus, CheckCircle2, Circle, ChevronDown, ChevronRight, ListChecks, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useImageUpload } from '@/hooks/useImageUpload';
import { usePersonalLists, LIFE_AREAS, DAILY_SYSTEMS, type PersonalList, type PersonalListTask } from '@/hooks/usePersonalLists';

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-muted text-foreground border-border',
  low: 'bg-muted/50 text-muted-foreground border-border',
};
const PRIORITY_LABEL: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Baja' };

function areaLabel(id: string) {
  return LIFE_AREAS.find(a => a.id === id)?.label || id;
}

function CreateListDialog({ onCreate }: { onCreate: (p: Partial<PersonalList>) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [areaId, setAreaId] = useState(LIFE_AREAS[0].id);
  const [subArea, setSubArea] = useState('');
  const [systemKey, setSystemKey] = useState('none');
  const [cover, setCover] = useState<string | null>(null);
  const { uploadImage, uploading } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      description: description.trim() || null,
      area_id: areaId,
      sub_area: subArea.trim() || null,
      cover_image_url: cover,
      system_key: systemKey === 'none' ? null : systemKey,
    });
    setTitle(''); setDescription(''); setSubArea(''); setCover(null); setSystemKey('none');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1.5" />Crear lista</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva lista personal</DialogTitle>
          <DialogDescription>Elige el área de vida, una subárea y opcionalmente un sistema diario.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Rutina de lectura profunda" />
          </div>
          <div className="grid gap-2">
            <Label>Área de vida</Label>
            <Select value={areaId} onValueChange={setAreaId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LIFE_AREAS.map(a => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Subárea (texto libre)</Label>
            <Input value={subArea} onChange={e => setSubArea(e.target.value)} placeholder="Ej: Hábitos de estudio" />
          </div>
          <div className="grid gap-2">
            <Label>Sistema diario vinculado</Label>
            <Select value={systemKey} onValueChange={setSystemKey}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                {DAILY_SYSTEMS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Descripción</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid gap-2">
            <Label>Foto de portada</Label>
            {cover && <img src={cover} alt="Portada de la lista" className="h-32 w-full object-cover rounded-lg" />}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async e => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = await uploadImage(f, 'personal-lists');
                if (url) setCover(url);
              }}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <ImagePlus className="h-4 w-4 mr-1.5" />}
              {cover ? 'Cambiar foto' : 'Subir foto'}
            </Button>
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

function TaskRow({
  task, subtasks, onToggle, onDelete, onAddSub,
}: {
  task: PersonalListTask;
  subtasks: PersonalListTask[];
  onToggle: (t: PersonalListTask) => void;
  onDelete: (id: string) => void;
  onAddSub: (parentId: string, title: string) => void;
}) {
  const [openSubs, setOpenSubs] = useState(false);
  const [subTitle, setSubTitle] = useState('');
  const doneSubs = subtasks.filter(s => s.completed).length;

  return (
    <div className="rounded-lg border border-border/60">
      <div className="flex items-center gap-2 p-2">
        <button onClick={() => onToggle(task)} aria-label="Marcar tarea">
          {task.completed
            ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            : <Circle className="h-4 w-4 text-muted-foreground" />}
        </button>
        <span className={cn('flex-1 text-sm', task.completed && 'line-through text-muted-foreground')}>
          {task.title}
        </span>
        {task.due_date && (
          <Badge variant="outline" className="text-[10px]">
            {format(new Date(`${task.due_date}T12:00:00`), 'd MMM', { locale: es })}
          </Badge>
        )}
        <Badge variant="outline" className={cn('text-[10px]', PRIORITY_STYLES[task.priority])}>
          {PRIORITY_LABEL[task.priority]}
        </Badge>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setOpenSubs(v => !v)}>
          {openSubs ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(task.id)}>
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
      {subtasks.length > 0 && !openSubs && (
        <p className="px-3 pb-2 text-[11px] text-muted-foreground">{doneSubs}/{subtasks.length} subtareas</p>
      )}
      {openSubs && (
        <div className="border-t border-border/60 p-2 space-y-1.5">
          {subtasks.map(s => (
            <div key={s.id} className="flex items-center gap-2 pl-4">
              <button onClick={() => onToggle(s)} aria-label="Marcar subtarea">
                {s.completed
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  : <Circle className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
              <span className={cn('flex-1 text-xs', s.completed && 'line-through text-muted-foreground')}>{s.title}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onDelete(s.id)}>
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2 pl-4">
            <Input
              value={subTitle}
              onChange={e => setSubTitle(e.target.value)}
              placeholder="Nueva subtarea..."
              className="h-8 text-xs"
              onKeyDown={e => {
                if (e.key === 'Enter' && subTitle.trim()) { onAddSub(task.id, subTitle.trim()); setSubTitle(''); }
              }}
            />
            <Button
              size="sm"
              className="h-8"
              disabled={!subTitle.trim()}
              onClick={() => { onAddSub(task.id, subTitle.trim()); setSubTitle(''); }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ListCard({
  list, tasks, system, onDelete, onCreateTask, onToggleTask, onDeleteTask,
}: {
  list: PersonalList;
  tasks: PersonalListTask[];
  system?: { completed: boolean; minutes: number; goal: number };
  onDelete: (id: string) => void;
  onCreateTask: (p: Partial<PersonalListTask>) => void;
  onToggleTask: (t: PersonalListTask) => void;
  onDeleteTask: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');

  const roots = tasks.filter(t => !t.parent_id);
  const done = roots.filter(t => t.completed).length;
  const pct = roots.length ? Math.round((done / roots.length) * 100) : 0;
  const systemMeta = DAILY_SYSTEMS.find(s => s.id === list.system_key);

  const add = () => {
    if (!title.trim()) return;
    onCreateTask({
      list_id: list.id,
      title: title.trim(),
      due_date: dueDate || null,
      priority: priority as PersonalListTask['priority'],
      parent_id: null,
    });
    setTitle(''); setDueDate('');
  };

  return (
    <Card className="overflow-hidden">
      {list.cover_image_url ? (
        <img src={list.cover_image_url} alt={`Portada de ${list.title}`} loading="lazy" className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-muted flex items-center justify-center">
          <ListChecks className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold leading-tight">{list.title}</h3>
            <p className="text-xs text-muted-foreground">
              {areaLabel(list.area_id)}{list.sub_area ? ` · ${list.sub_area}` : ''}
            </p>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onDelete(list.id)}>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {list.description && <p className="text-sm text-muted-foreground">{list.description}</p>}

        {systemMeta && (
          <div className={cn(
            'rounded-lg border p-2.5 text-xs flex items-center justify-between',
            system?.completed
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          )}>
            <span className="font-medium">Sistema: {systemMeta.label}</span>
            <span>
              {system?.completed ? 'Cumplido hoy' : 'No cumplido hoy'}
              {system && system.goal > 0 ? ` · ${system.minutes}/${system.goal} min` : ''}
            </span>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tareas</span><span>{done}/{roots.length}</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        <div className="space-y-2">
          {roots.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              subtasks={tasks.filter(s => s.parent_id === t.id)}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
              onAddSub={(parentId, subTitle) => onCreateTask({ list_id: list.id, parent_id: parentId, title: subTitle, priority: 'medium' })}
            />
          ))}
          {roots.length === 0 && <p className="text-xs text-muted-foreground">Aún no hay tareas en esta lista.</p>}
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nueva tarea..." className="h-9"
            onKeyDown={e => e.key === 'Enter' && add()} />
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-9 w-full sm:w-[140px]" />
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-9 w-full sm:w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
            </SelectContent>
          </Select>
          <Button className="h-9" onClick={add} disabled={!title.trim()}><Plus className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MiListaPersonal() {
  const {
    lists, tasks, systems, isLoading,
    createList, deleteList, createTask, updateTask, deleteTask,
  } = usePersonalLists();

  const grouped = useMemo(() => {
    const byArea = new Map<string, Map<string, PersonalList[]>>();
    lists.forEach(l => {
      const sub = l.sub_area?.trim() || 'General';
      if (!byArea.has(l.area_id)) byArea.set(l.area_id, new Map());
      const m = byArea.get(l.area_id)!;
      if (!m.has(sub)) m.set(sub, []);
      m.get(sub)!.push(l);
    });
    return byArea;
  }, [lists]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mi Lista Personal</h1>
          <p className="text-sm text-muted-foreground">
            Listas por área de vida y subárea, con sistemas diarios, tareas y subtareas.
          </p>
        </div>
        <CreateListDialog onCreate={p => createList.mutate(p)} />
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando listas...</p>}

      {!isLoading && lists.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          Todavía no tienes listas. Crea la primera con "Crear lista".
        </CardContent></Card>
      )}

      {[...grouped.entries()].map(([areaId, subs]) => (
        <section key={areaId} className="space-y-4">
          <h2 className="text-lg font-semibold border-b border-border pb-1">{areaLabel(areaId)}</h2>
          {[...subs.entries()].map(([sub, items]) => (
            <div key={sub} className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{sub}</p>
              <div className="grid gap-4 md:grid-cols-2">
                {items.map(l => (
                  <ListCard
                    key={l.id}
                    list={l}
                    tasks={tasks.filter(t => t.list_id === l.id)}
                    system={l.system_key ? systems[l.system_key] : undefined}
                    onDelete={id => deleteList.mutate(id)}
                    onCreateTask={p => createTask.mutate(p)}
                    onToggleTask={t => updateTask.mutate({ id: t.id, completed: !t.completed })}
                    onDeleteTask={id => deleteTask.mutate(id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
