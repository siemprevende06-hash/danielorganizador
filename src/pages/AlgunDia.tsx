import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Star,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Check,
  MapPin,
  Palette,
  Mountain,
  Utensils,
  BookOpen,
  Heart,
  Music,
  Gamepad2,
  Plane,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DreamItem {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dateAdded: string;
}

const CATEGORIES = [
  { id: 'viajes', label: 'Viajar a...', icon: Plane, color: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  { id: 'experiencias', label: 'Vivir la experiencia...', icon: Mountain, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  { id: 'aprender', label: 'Aprender...', icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
  { id: 'comprar', label: 'Tener / Comprar...', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { id: 'crear', label: 'Crear / Hacer...', icon: Palette, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  { id: 'comida', label: 'Probar / Comer...', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { id: 'musica', label: 'Música / Arte...', icon: Music, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
  { id: 'deportes', label: 'Deportes / Aventura...', icon: Gamepad2, color: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
  { id: 'otros', label: 'Otros sueños...', icon: Heart, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
];

const PRIORITY_META = {
  low: { label: 'Normal', color: 'bg-muted text-muted-foreground' },
  medium: { label: 'Importante', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  high: { label: 'Imprescindible', color: 'bg-rose-500/15 text-rose-600 border-rose-500/30' },
};

const STORAGE_KEY = 'algundia_dreams';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function AlgunDia() {
  const [items, setItems] = useState<DreamItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORIES.map(c => c.id)));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', category: 'viajes', priority: 'medium' as DreamItem['priority'] });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch {}
    }
  }, []);

  const saveItems = (next: DreamItem[]) => {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addItem = () => {
    if (!newItem.title.trim()) return;
    const item: DreamItem = {
      id: generateId(),
      title: newItem.title.trim(),
      description: newItem.description.trim(),
      category: newItem.category,
      completed: false,
      priority: newItem.priority,
      dateAdded: new Date().toISOString(),
    };
    saveItems([...items, item]);
    setNewItem({ title: '', description: '', category: 'viajes', priority: 'medium' });
    setDialogOpen(false);
    toast.success('Sueño agregado a tu lista');
  };

  const toggleCompleted = (id: string) => {
    saveItems(items.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
    const item = items.find(i => i.id === id);
    if (item && !item.completed) toast.success('¡Sueño cumplido! 🎉');
  };

  const deleteItem = (id: string) => {
    saveItems(items.filter(i => i.id !== id));
    toast.success('Sueño eliminado');
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
  const completedItems = items.filter(i => i.completed).length;
  const pendingItems = totalItems - completedItems;
  const highPriorityPending = items.filter(i => !i.completed && i.priority === 'high').length;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Star className="h-7 w-7 text-amber-500" />Algún Día
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tus sueños, deseos y experiencias pendientes — sin fecha límite
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />Nuevo Sueño
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar un sueño</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">¿Qué sueñas con hacer?</label>
                  <Input
                    placeholder="Ej: Visitar Japón"
                    value={newItem.title}
                    onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Detalles (opcional)</label>
                  <Textarea
                    placeholder="¿Por qué quieres esto? ¿Cómo te sentirías?"
                    value={newItem.description}
                    onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Categoría</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {CATEGORIES.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setNewItem(p => ({ ...p, category: cat.id }))}
                          className={cn(
                            "flex items-center gap-1.5 p-2 rounded-lg border text-[10px] text-left transition-all",
                            newItem.category === cat.id
                              ? `${cat.bg} ${cat.border} ${cat.color}`
                              : "border-border/50 hover:bg-muted/40"
                          )}
                        >
                          <Icon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{cat.label.replace(/\.\.\.$/, '')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Prioridad</label>
                  <div className="flex gap-2 mt-1">
                    {(Object.keys(PRIORITY_META) as Array<DreamItem['priority']>).map(p => (
                      <button
                        key={p}
                        onClick={() => setNewItem(pr => ({ ...pr, priority: p }))}
                        className={cn(
                          "flex-1 py-2 rounded-lg border text-xs font-medium transition-all",
                          newItem.priority === p
                            ? `${PRIORITY_META[p].color} border-current`
                            : "border-border/50 hover:bg-muted/40"
                        )}
                      >
                        {PRIORITY_META[p].label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={addItem} className="w-full" disabled={!newItem.title.trim()}>
                  Agregar sueño
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
              <p className="text-xs text-muted-foreground">Sueños totales</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-500">{pendingItems}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald-500">{completedItems}</p>
              <p className="text-xs text-muted-foreground">Cumplidos</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-rose-500">{highPriorityPending}</p>
              <p className="text-xs text-muted-foreground">Imprescindibles</p>
            </CardContent>
          </Card>
        </div>

        {/* Banner motivacional */}
        {completedItems > 0 && (
          <Card className="border-2 border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-background to-background">
            <CardContent className="p-5 text-center">
              <div className="text-4xl mb-2">✨</div>
              <p className="font-bold text-sm">
                {completedItems === totalItems
                  ? '¡Felicidades! Has cumplido todos tus sueños en la lista'
                  : `Llevas ${completedItems} de ${totalItems} sueños cumplidos`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sigue soñando y trabajando por lo que deseas
              </p>
            </CardContent>
          </Card>
        )}

        {/* Categorías con sueños */}
        {itemsByCategory.map(cat => {
          const Icon = cat.icon;
          const expanded = expandedCategories.has(cat.id);
          const pendingInCat = cat.items.filter(i => !i.completed).length;
          const completedInCat = cat.items.filter(i => i.completed).length;
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
                        {pendingInCat > 0 && `${pendingInCat} pendiente(s)`}
                        {pendingInCat > 0 && completedInCat > 0 && ' · '}
                        {completedInCat > 0 && `${completedInCat} cumplido(s)`}
                        {cat.items.length === 0 && 'Sin sueños aún'}
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
                        No hay sueños en esta categoría
                      </p>
                    ) : (
                      cat.items.map(item => (
                        <div
                          key={item.id}
                          className={cn(
                            "rounded-xl border p-4 transition-all",
                            item.completed
                              ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-500/20"
                              : "hover:shadow-sm"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  "font-semibold text-sm",
                                  item.completed && "line-through text-muted-foreground"
                                )}>
                                  {item.title}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={cn("text-[9px] shrink-0", PRIORITY_META[item.priority].color)}
                                >
                                  {PRIORITY_META[item.priority].label}
                                </Badge>
                              </div>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                              )}
                              <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                                Agregado: {new Date(item.dateAdded).toLocaleDateString('es-CU')}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toggleCompleted(item.id)}
                              >
                                {item.completed ? (
                                  <span className="text-emerald-500 text-lg">✓</span>
                                ) : (
                                  <Check className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
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
              <Star className="h-12 w-12 text-amber-400 mx-auto" />
              <p className="text-lg font-medium">¿Qué sueñas con hacer algún día?</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Viajar, aprender algo nuevo, probar una comida, vivir una aventura... 
                Anota todo lo que te gustaría hacer en tu vida.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />Agregar primer sueño
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
