import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, Plus, Rocket, CheckCircle2, 
  ListTodo, DollarSign, Edit3, Trash2, ImagePlus, Loader2, X, Star,
  Clock, Target, TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useActiveSelections } from '@/hooks/useActiveSelections';
import { cn } from '@/lib/utils';

interface Entrepreneurship {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  taskCount?: number;
  completedCount?: number;
  improvementCount?: number;
  totalIncome?: number;
  goalsCompleted?: number;
  goalsTotal?: number;
  focusMinutes?: number;
}

export default function EntrepreneurshipPage() {
  const [entrepreneurships, setEntrepreneurships] = useState<Entrepreneurship[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading } = useImageUpload();
  const navigate = useNavigate();
  const { values: activeEntIds, toggle: toggleActiveEnt } = useActiveSelections('activeEntrepreneurships');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('entrepreneurships').select('*').order('created_at');
      if (error) throw error;

      const [tasksRes, sessionsRes] = await Promise.all([
        supabase.from('tasks').select('id, source_id').eq('source', 'entrepreneurship'),
        supabase.from('focus_sessions').select('task_id, task_ids, duration_minutes').eq('task_area', 'emprendimiento'),
      ]);

      const entForTask: Record<string, string> = {};
      (tasksRes.data || []).forEach((t: any) => { if (t.source_id) entForTask[t.id] = t.source_id; });
      const focusMinutes: Record<string, number> = {};
      (sessionsRes.data || []).forEach((s: any) => {
        const ids: string[] = Array.isArray(s.task_ids) && (s.task_ids as string[]).length > 0
          ? (s.task_ids as string[]).filter((x: any) => typeof x === 'string')
          : (s.task_id ? [s.task_id] : []);
        ids.forEach((tid) => {
          const entId = entForTask[tid];
          if (entId) focusMinutes[entId] = (focusMinutes[entId] || 0) + (s.duration_minutes || 0);
        });
      });

      const enriched = await Promise.all((data || []).map(async (e) => {
        const [{ count: taskCount }, { count: completedCount }, { count: improvementCount }, { data: incomeData }, { count: goalsCompleted }, { count: goalsTotal }] = await Promise.all([
          supabase.from('entrepreneurship_tasks').select('*', { count: 'exact', head: true }).eq('entrepreneurship_id', e.id),
          supabase.from('entrepreneurship_tasks').select('*', { count: 'exact', head: true }).eq('entrepreneurship_id', e.id).eq('completed', true),
          supabase.from('entrepreneurship_tasks').select('*', { count: 'exact', head: true }).eq('entrepreneurship_id', e.id).eq('task_type', 'improvement'),
          supabase.from('entrepreneurship_income').select('amount').eq('entrepreneurship_id', e.id),
          supabase.from('entrepreneurship_goals').select('*', { count: 'exact', head: true }).eq('entrepreneurship_id', e.id).eq('completed', true),
          supabase.from('entrepreneurship_goals').select('*', { count: 'exact', head: true }).eq('entrepreneurship_id', e.id),
        ]);
        const totalIncome = (incomeData || []).reduce((s, r) => s + Number(r.amount), 0);
        return {
          ...e,
          taskCount: taskCount || 0,
          completedCount: completedCount || 0,
          improvementCount: improvementCount || 0,
          totalIncome,
          goalsCompleted: goalsCompleted || 0,
          goalsTotal: goalsTotal || 0,
          focusMinutes: focusMinutes[e.id] || 0,
        };
      }));

      setEntrepreneurships(enriched);
    } catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!name.trim()) { toast.error('Nombre requerido'); return; }
    try {
      let coverUrl = coverImage;
      if (coverFile) {
        const url = await uploadImage(coverFile, 'entrepreneurship');
        if (url) coverUrl = url;
      }

      const payload: Record<string, any> = {
        name: name.trim(),
        description: description.trim() || null,
        cover_image: coverUrl,
      };

      if (editingId) {
        const { error } = await supabase.from('entrepreneurships')
          .update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Emprendimiento actualizado');
      } else {
        const { error } = await supabase.from('entrepreneurships')
          .insert(payload as any);
        if (error) throw error;
        toast.success('Emprendimiento creado');
      }
      setDialogOpen(false);
      setEditingId(null);
      setName('');
      setDescription('');
      setCoverImage(null);
      setCoverFile(null);
      load();
    } catch { toast.error('Error al guardar'); }
  };

  const deleteEntrepreneurship = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('entrepreneurships').delete().eq('id', id);
      if (error) throw error;
      setEntrepreneurships(prev => prev.filter(x => x.id !== id));
      toast.success('Eliminado');
    } catch { toast.error('Error al eliminar'); }
  };

  const openEdit = (ent: Entrepreneurship, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(ent.id);
    setName(ent.name);
    setDescription(ent.description || '');
    setCoverImage(ent.cover_image);
    setCoverFile(null);
    setDialogOpen(true);
  };

  const totalIncome = entrepreneurships.reduce((s, e) => s + (e.totalIncome || 0), 0);
  const totalTasks = entrepreneurships.reduce((s, e) => s + (e.taskCount || 0), 0);
  const totalCompleted = entrepreneurships.reduce((s, e) => s + (e.completedCount || 0), 0);
  const totalFocusMinutes = entrepreneurships.reduce((s, e) => s + (e.focusMinutes || 0), 0);
  const formatMinutes = (m: number) => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-20 pb-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-20 pb-24 space-y-5" style={{ paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 4rem))' }}>
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Rocket className="h-7 w-7 text-primary" />
            Emprendimientos
          </h1>
          <p className="text-sm text-muted-foreground">{entrepreneurships.length} proyecto{entrepreneurships.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => { setEditingId(null); setName(''); setDescription(''); setCoverImage(null); setCoverFile(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo</span>
        </Button>
      </header>

      {/* Stats */}
      {entrepreneurships.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-3 text-center">
              <ListTodo className="h-5 w-5 mx-auto text-primary mb-1" />
              <div className="text-xl font-bold text-foreground">{totalCompleted}/{totalTasks}</div>
              <div className="text-[10px] text-muted-foreground">Tareas</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="h-5 w-5 mx-auto text-green-500 mb-1" />
              <div className="text-xl font-bold text-foreground">
                {totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0}%
              </div>
              <div className="text-[10px] text-muted-foreground">Completado</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3 text-center">
              <DollarSign className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
              <div className="text-xl font-bold text-foreground">${totalIncome.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">Ingresos</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-3 text-center">
              <Clock className="h-5 w-5 mx-auto text-blue-500 mb-1" />
              <div className="text-xl font-bold text-foreground">{formatMinutes(totalFocusMinutes)}</div>
              <div className="text-[10px] text-muted-foreground">Tiempo dedicado</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Project Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {entrepreneurships.map(ent => {
          const progress = ent.taskCount ? Math.round(((ent.completedCount || 0) / ent.taskCount) * 100) : 0;
          const focusTime = ent.focusMinutes || 0;
          return (
            <Card
              key={ent.id}
              className={cn(
                "cursor-pointer border-border hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.99] overflow-hidden",
                activeEntIds.includes(ent.id) && "ring-2 ring-primary"
              )}
              onClick={() => navigate(`/entrepreneurship/${ent.id}`)}
            >
              <div className="relative h-28 w-full bg-gradient-to-br from-purple-500/20 via-amber-500/10 to-transparent">
                {ent.cover_image ? (
                  <img src={ent.cover_image} alt={ent.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center">
                    <Briefcase className="h-10 w-10 text-primary/70" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
              <CardContent className="p-4 -mt-8 relative">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground truncate text-base">{ent.name}</h3>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); toggleActiveEnt(ent.id); }} title={activeEntIds.includes(ent.id) ? "Quitar activo" : "Marcar activo"}>
                      <Star className={cn("h-3.5 w-3.5", activeEntIds.includes(ent.id) ? "fill-primary text-primary" : "text-muted-foreground")} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => openEdit(ent, e)}>
                      <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => deleteEntrepreneurship(ent.id, e)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                {ent.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ent.description}</p>
                )}
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <ListTodo className="h-3 w-3" />
                    {ent.completedCount}/{ent.taskCount}
                  </Badge>
                  {(ent.improvementCount || 0) > 0 && (
                    <Badge variant="outline" className="text-[10px] gap-1 text-purple-600">
                      <TrendingUp className="h-3 w-3" />
                      {ent.improvementCount} mejoras
                    </Badge>
                  )}
                  {(ent.goalsTotal || 0) > 0 && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Target className="h-3 w-3" />
                      {ent.goalsCompleted}/{ent.goalsTotal} metas
                    </Badge>
                  )}
                  {focusTime > 0 && (
                    <Badge variant="outline" className="text-[10px] gap-1 text-blue-600">
                      <Clock className="h-3 w-3" />
                      {formatMinutes(focusTime)}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px] gap-1 text-yellow-600">
                    <DollarSign className="h-3 w-3" />
                    ${Number(ent.totalIncome || 0).toLocaleString()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2.5">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">{progress}%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {entrepreneurships.length === 0 && (
        <Card className="border-dashed border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Rocket className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">Sin emprendimientos</h3>
            <p className="text-sm text-muted-foreground mb-4">Crea tu primer proyecto</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Crear emprendimiento
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Nuevo'} Emprendimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-3">
            <Input placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} />
            <Textarea placeholder="Descripción (opcional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            
            {/* Cover Image Upload */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0 border border-border">
                  {(coverFile || coverImage) ? (
                    <img
                      src={coverFile ? URL.createObjectURL(coverFile) : coverImage!}
                      alt="Portada"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Briefcase className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setCoverFile(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4 mr-1" />
                    )}
                    {coverImage || coverFile ? 'Cambiar portada' : 'Subir portada'}
                  </Button>
                  {(coverImage || coverFile) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-7"
                      onClick={() => { setCoverImage(null); setCoverFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Eliminar portada
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Button onClick={save} className="w-full" disabled={uploading}>
              {uploading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingId ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
