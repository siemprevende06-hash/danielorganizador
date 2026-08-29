import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Plus, Trash2, ImagePlus, CheckCircle2, Circle, ChevronDown, ChevronRight, ListChecks, Loader2, Pencil, GraduationCap, Briefcase, FolderKanban, BookOpen, Globe, Crown, Dumbbell, Gamepad2, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useImageUpload } from '@/hooks/useImageUpload';
import { usePersonalLists, LIFE_AREAS, DAILY_SYSTEMS, type PersonalList, type PersonalListTask } from '@/hooks/usePersonalLists';

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-muted text-foreground border-border',
  low: 'bg-muted/50 text-muted-foreground border-border',
};
const PRIORITY_LABEL: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Baja' };

const SYSTEM_ICONS: Record<string, JSX.Element> = {
  universidad: <GraduationCap className="h-4 w-4" />,
  emprendimiento: <Briefcase className="h-4 w-4" />,
  proyectos: <FolderKanban className="h-4 w-4" />,
  lectura: <BookOpen className="h-4 w-4" />,
  musica: <Music className="h-4 w-4" />,
  idiomas: <Globe className="h-4 w-4" />,
  ajedrez: <Crown className="h-4 w-4" />,
  gym: <Dumbbell className="h-4 w-4" />,
  game: <Gamepad2 className="h-4 w-4" />,
};

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

function EditListDialog({
  list, onSave, open, onOpenChange,
}: {
  list: PersonalList;
  onSave: (p: Partial<PersonalList>) => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [title, setTitle] = useState(list.title);
  const [description, setDescription] = useState(list.description || '');
  const [areaId, setAreaId] = useState(list.area_id);
  const [subArea, setSubArea] = useState(list.sub_area || '');
  const [systemKey, setSystemKey] = useState(list.system_key || 'none');
  const [cover, setCover] = useState<string | null>(list.cover_image_url);
  const { uploadImage, uploading } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(list.title);
    setDescription(list.description || '');
    setAreaId(list.area_id);
    setSubArea(list.sub_area || '');
    setSystemKey(list.system_key || 'none');
    setCover(list.cover_image_url);
  }, [list, open]);

  const submit = () => {
    if (!title.trim()) return;
    onSave({
      id: list.id,
      title: title.trim(),
      description: description.trim() || null,
      area_id: areaId,
      sub_area: subArea.trim() || null,
      cover_image_url: cover,
      system_key: systemKey === 'none' ? null : systemKey,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar lista</DialogTitle>
          <DialogDescription>Modifica los datos de la lista personal.</DialogDescription>
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
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!title.trim()}>Guardar</Button>
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
  list, tasks, system, onDelete, onEdit, onCreateTask, onToggleTask, onDeleteTask,
}: {
  list: PersonalList;
  tasks: PersonalListTask[];
  system?: { completed: boolean; minutes: number; goal: number };
  onDelete: (id: string) => void;
  onEdit: (p: Partial<PersonalList>) => void;
  onCreateTask: (p: Partial<PersonalListTask>) => void;
  onToggleTask: (t: PersonalListTask) => void;
  onDeleteTask: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [editing, setEditing] = useState(false);

  const roots = tasks.filter(t => !t.parent_id);
  const done = roots.filter(t => t.completed).length;
  const pct = roots.length ? Math.round((done / roots.length) * 100) : 0;
  const systemMeta = DAILY_SYSTEMS.find(s => s.id === list.system_key);
  const systemPct = system
    ? system.completed
      ? 100
      : system.goal > 0
        ? Math.min(100, Math.round((system.minutes / system.goal) * 100))
        : 0
    : 0;

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
        <img src={list.cover_image_url} alt={`Portada de ${list.title}`} loading="lazy" className="h-24 w-full object-cover" />
      ) : (
        <div className="h-24 w-full bg-muted flex items-center justify-center">
          <ListChecks className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold leading-tight text-base truncate">{list.title}</h3>
            <p className="text-[11px] text-muted-foreground">
              {areaLabel(list.area_id)}{list.sub_area ? ` · ${list.sub_area}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(list.id)}>
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {list.description && <p className="text-xs text-muted-foreground line-clamp-2">{list.description}</p>}

        {systemMeta && (
          <div className={cn(
            'relative rounded-2xl p-2.5 flex items-center gap-2.5 border-0 backdrop-blur-xl overflow-hidden transition-all',
            system?.completed
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'bg-white/80 dark:bg-zinc-950/80 shadow-sm'
          )}>
            <span className={cn('text-base shrink-0', system?.completed ? 'text-primary-foreground' : 'text-primary')}>
              {SYSTEM_ICONS[systemMeta.id]}
            </span>
            <div className="relative w-8 h-8 shrink-0">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="12" fill="none" stroke={system?.completed ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)'} strokeWidth="3" />
                <circle cx="16" cy="16" r="12" fill="none" stroke={system?.completed ? 'rgba(255,255,255,0.85)' : 'currentColor'} strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 12}`}
                  strokeDashoffset={`${2 * Math.PI * 12 * (1 - systemPct / 100)}`}
                  className={cn(system?.completed ? '' : 'text-primary')} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold tabular-nums">{systemPct}%</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold leading-tight truncate">{systemMeta.label}</div>
              <div className={cn('text-[9px] mt-0.5 flex items-center gap-1', system?.completed ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                {system?.completed ? 'Cumplido hoy' : 'No cumplido hoy'}
                {system && system.goal > 0 ? ` · ${system.minutes}/${system.goal} min` : ''}
              </div>
            </div>
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
      {editing && (
        <EditListDialog list={list} open={editing} onOpenChange={setEditing} onSave={onEdit} />
      )}
    </Card>
  );
}

const PERIODS = [
  { id: 'dia', label: 'Día' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mes' },
  { id: 'trimestre', label: 'Trimestre' },
] as const;
type PeriodId = (typeof PERIODS)[number]['id'];

export default function MiListaPersonal() {
  const {
    lists, tasks, systems, isLoading,
    createList, deleteList, updateList, createTask, updateTask, deleteTask,
  } = usePersonalLists();

  const [period, setPeriod] = useState<PeriodId>('mes');
  const [refDate, setRefDate] = useState<Date>(new Date());

  const range = useMemo(() => {
    let s: Date, e: Date;
    if (period === 'dia') { s = startOfDay(refDate); e = endOfDay(refDate); }
    else if (period === 'semana') { s = startOfWeek(refDate, { weekStartsOn: 1 }); e = endOfWeek(refDate, { weekStartsOn: 1 }); }
    else if (period === 'mes') { s = startOfMonth(refDate); e = endOfMonth(refDate); }
    else { s = startOfQuarter(refDate); e = endOfQuarter(refDate); }
    return {
      start: format(s, 'yyyy-MM-dd'),
      end: format(e, 'yyyy-MM-dd'),
      label: `${format(s, 'd MMM', { locale: es })} – ${format(e, 'd MMM yyyy', { locale: es })}`,
    };
  }, [period, refDate]);

  const inRange = (t: PersonalListTask) =>
    !!t.due_date && t.due_date >= range.start && t.due_date <= range.end;

  const grouped = useMemo(() => {
    const byArea = new Map<string, Map<string, PersonalList[]>>();
    lists.forEach(l => {
      const hasInRange = tasks.some(t => t.list_id === l.id && inRange(t));
      if (!hasInRange) return;
      const sub = l.sub_area?.trim() || 'General';
      if (!byArea.has(l.area_id)) byArea.set(l.area_id, new Map());
      const m = byArea.get(l.area_id)!;
      if (!m.has(sub)) m.set(sub, []);
      m.get(sub)!.push(l);
    });
    return byArea;
  }, [lists, tasks, range]);

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

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-border/60 bg-muted/40 p-1 gap-1">
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                period === p.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}>
              {p.label}
            </button>
          ))}
        </div>
        <Input
          type="date"
          value={format(refDate, 'yyyy-MM-dd')}
          onChange={e => setRefDate(e.target.value ? new Date(`${e.target.value}T12:00:00`) : new Date())}
          className="h-9 w-auto"
        />
        <span className="text-xs text-muted-foreground">{range.label}</span>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando listas...</p>}

      {!isLoading && lists.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          Todavía no tienes listas. Crea la primera con "Crear lista".
        </CardContent></Card>
      )}

      {!isLoading && lists.length > 0 && Object.keys(grouped).length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          No hay objetivos con fecha en el periodo seleccionado ({range.label}).
        </CardContent></Card>
      )}

      {[...grouped.entries()].map(([areaId, subs]) => (
        <section key={areaId} className="space-y-4">
          <h2 className="text-lg font-semibold border-b border-border pb-1">{areaLabel(areaId)}</h2>
          {[...subs.entries()].map(([sub, items]) => (
            <div key={sub} className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{sub}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(l => (
                  <ListCard
                    key={l.id}
                    list={l}
                    tasks={tasks.filter(t => t.list_id === l.id && inRange(t))}
                    system={l.system_key ? systems[l.system_key] : undefined}
                    onDelete={id => deleteList.mutate(id)}
                    onEdit={p => updateList.mutate({ ...p, id: l.id })}
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
