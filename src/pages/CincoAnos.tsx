import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CalendarDays,
  Plus,
  ChevronDown,
  ChevronRight,
  Target,
  Trophy,
  Trash2,
  Pencil,
  Check,
  X,
  Sparkles,
  Briefcase,
  GraduationCap,
  Heart,
  Dumbbell,
  DollarSign,
  Star,
  Globe,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VisionItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in-progress' | 'completed';
  progress: number;
  notes: string;
}

const CATEGORIES = [
  { id: 'carrera', label: 'Carrera / Trabajo', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { id: 'finanzas', label: 'Finanzas', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { id: 'educacion', label: 'Educación', icon: GraduationCap, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
  { id: 'salud', label: 'Salud / Cuerpo', icon: Dumbbell, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  { id: 'relaciones', label: 'Relaciones', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
  { id: 'viajes', label: 'Viajes / Experiencias', icon: Globe, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { id: 'habilidades', label: 'Habilidades', icon: Star, color: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
  { id: 'proyectos', label: 'Proyectos Personales', icon: Rocket, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
];

const STORAGE_KEY = 'vision_5anos_items';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function CincoAnos() {
  const [items, setItems] = useState<VisionItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORIES.map(c => c.id)));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VisionItem | null>(null);
  const [newItem, setNewItem] = useState({ title: '', description: '', category: 'carrera' });
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch {}
    }
  }, []);

  const saveItems = (next: VisionItem[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addItem = () => {
    if (!newItem.title.trim()) return;
    const item: VisionItem = {
      id: generateId(),
      title: newItem.title.trim(),
      description: newItem.description.trim(),
      category: newItem.category,
      status: 'pending',
      progress: 0,
      notes: '',
    };
    saveItems([...items, item]);
    setNewItem({ title: '', description: '', category: 'carrera' });
    setDialogOpen(false);
    toast.success('Meta agregada a tu visión de 5 años');
  };

  const updateItem = (id: string, updates: Partial<VisionItem>) => {
    saveItems(items.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteItem = (id: string) => {
    saveItems(items.filter(i => i.id !== id));
    toast.success('Meta eliminada');
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const itemsByCategory = CATEGORIES.map(cat => ({
    ...cat,
    items: items.filter(i => i.category === cat.id),
  }));

  const totalItems = items.length;
  const completedItems = items.filter(i => i.status === 'completed').length;
  const inProgressItems = items.filter(i => i.status === 'in-progress').length;
  const avgProgress = totalItems > 0
    ? Math.round(items.reduce((sum, i) => sum + i.progress, 0) / totalItems)
    : 0;

  const currentYear = new Date().getFullYear();
  const targetYear = currentYear + 5;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <CalendarDays className="h-7 w-7 text-primary" />5 Años
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tu visión a largo plazo: {currentYear} → {targetYear}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />Nueva Meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar meta a 5 años</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">¿Qué quieres lograr?</label>
                  <Input
                    placeholder="Ej: Tener mi propio negocio"
                    value={newItem.title}
                    onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Describe tu visión</label>
                  <Textarea
                    placeholder="¿Cómo se vería tu vida cuando logres esto?"
                    value={newItem.description}
                    onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Categoría</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {CATEGORIES.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setNewItem(p => ({ ...p, category: cat.id }))}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border text-xs text-left transition-all",
                            newItem.category === cat.id
                              ? `${cat.bg} ${cat.border} ${cat.color}`
                              : "border-border/50 hover:bg-muted/40"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button onClick={addItem} className="w-full" disabled={!newItem.title.trim()}>
                  Agregar a mi visión
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{totalItems}</p>
              <p className="text-xs text-muted-foreground">Metas totales</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-500">{inProgressItems}</p>
              <p className="text-xs text-muted-foreground">En progreso</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald-500">{completedItems}</p>
              <p className="text-xs text-muted-foreground">Logradas</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{avgProgress}%</p>
              <p className="text-xs text-muted-foreground">Avance promedio</p>
            </CardContent>
          </Card>
        </div>

        {/* Línea de tiempo visual */}
        <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Línea de Tiempo</h2>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {[0, 1, 2, 3, 4, 5].map(year => {
                const y = currentYear + year;
                const yearItems = items.filter(i => i.status === 'completed');
                const pct = year === 5 ? avgProgress : Math.round((year / 5) * avgProgress);
                return (
                  <div key={year} className="flex-1 min-w-[60px] text-center">
                    <div className={cn(
                      "text-xs font-bold mb-1",
                      year === 0 ? "text-muted-foreground" : year === 5 ? "text-primary" : "text-foreground"
                    )}>
                      {y}
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          year === 5 ? "bg-primary" : "bg-primary/40"
                        )}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    {year === 0 && <p className="text-[9px] text-muted-foreground mt-1">Hoy</p>}
                    {year === 5 && <p className="text-[9px] text-primary mt-1">Meta</p>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Categorías con metas */}
        {itemsByCategory.map(cat => {
          const Icon = cat.icon;
          const expanded = expandedCategories.has(cat.id);
          return (
            <Collapsible key={cat.id} open={expanded} onOpenChange={() => toggleCategory(cat.id)}>
              <Card className={cn("overflow-hidden border-l-4", cat.border)}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors">
                    {expanded ? <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
                    <Icon className={cn("h-5 w-5 shrink-0", cat.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{cat.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {cat.items.length} {cat.items.length === 1 ? 'meta' : 'metas'}
                        {cat.items.filter(i => i.status === 'completed').length > 0 &&
                          ` · ${cat.items.filter(i => i.status === 'completed').length} lograda(s)`}
                      </p>
                    </div>
                    {cat.items.length > 0 && (
                      <Badge variant="secondary" className="shrink-0">
                        {cat.items.length}
                      </Badge>
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="border-t pt-4 pb-4 space-y-3">
                    {cat.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay metas en esta categoría. ¡Agrega una!
                      </p>
                    ) : (
                      cat.items.map(item => (
                        <div key={item.id} className="rounded-xl border p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-semibold text-sm",
                                item.status === 'completed' && "line-through text-muted-foreground"
                              )}>
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] cursor-pointer",
                                  item.status === 'pending' && "bg-muted text-muted-foreground",
                                  item.status === 'in-progress' && "bg-blue-500/15 text-blue-500 border-blue-500/30",
                                  item.status === 'completed' && "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                                )}
                                onClick={() => {
                                  const next = item.status === 'pending' ? 'in-progress' : item.status === 'in-progress' ? 'completed' : 'pending';
                                  updateItem(item.id, { status: next, progress: next === 'completed' ? 100 : next === 'pending' ? 0 : item.progress });
                                }}
                              >
                                {item.status === 'pending' && 'Pendiente'}
                                {item.status === 'in-progress' && 'En progreso'}
                                {item.status === 'completed' && '✓ Lograda'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => deleteItem(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>

                          {/* Progreso */}
                          {item.status !== 'completed' && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">Progreso</span>
                                <span className="text-[10px] font-bold">{item.progress}%</span>
                              </div>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={item.progress}
                                onChange={e => updateItem(item.id, { progress: Number(e.target.value) })}
                                className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-primary"
                              />
                              <div className="flex justify-between text-[9px] text-muted-foreground/60">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                              </div>
                            </div>
                          )}

                          {item.status === 'completed' && (
                            <div className="flex items-center gap-2 text-emerald-500 text-xs">
                              <Trophy className="h-3.5 w-3.5" />
                              <span className="font-medium">¡Lograda! 🎉</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}

        {items.length === 0 && (
          <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="py-14 text-center space-y-3">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-lg font-medium">Visualiza tu futuro</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                ¿Qué quieres lograr en los próximos 5 años? Crea metas por categoría y sigue tu progreso.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />Crear primera meta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
