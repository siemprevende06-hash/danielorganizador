import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, Trash2, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTextSection } from '@/hooks/useTextSection';

interface Skill {
  id: string;
  name: string;
  icon: string;
  description: string;
  progress: number;
  createdAt: string;
}

const DEFAULT_ICONS = ['⭐', '🥊', '💃', '🎸', '🎹', '🎨', '📸', '✍️', '🗣️', '🧠', '💻', '🔧', '🏋️', '🧘', '🏊', '🚴', '⛰️', '🧭'];

export default function HabilidadesValiosas() {
  const { toast } = useToast();
  const { data: skills, setData: setSkills, loading } = useTextSection<Skill[]>('habilidades_valiosas', []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', icon: '⭐', description: '' });

  const saveSkills = (s: Skill[]) => setSkills(s);



  const resetForm = () => {
    setForm({ name: '', icon: '⭐', description: '' });
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: 'El nombre es obligatorio', variant: 'destructive' });
      return;
    }

    let updated: Skill[];
    if (editingId) {
      updated = skills.map(s =>
        s.id === editingId
          ? { ...s, name: form.name.trim(), icon: form.icon, description: form.description.trim() }
          : s
      );
      toast({ title: 'Habilidad actualizada' });
    } else {
      const newSkill: Skill = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        icon: form.icon,
        description: form.description.trim(),
        progress: 0,
        createdAt: new Date().toISOString(),
      };
      updated = [...skills, newSkill];
      toast({ title: 'Habilidad agregada' });
    }

    setSkills(updated);
    saveSkills(updated);
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (skill: Skill) => {
    setForm({ name: skill.name, icon: skill.icon, description: skill.description });
    setEditingId(skill.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = skills.filter(s => s.id !== id);
    setSkills(updated);
    saveSkills(updated);
    toast({ title: 'Habilidad eliminada' });
  };

  const adjustProgress = (id: string, delta: number) => {
    const updated = skills.map(s =>
      s.id === id ? { ...s, progress: Math.max(0, Math.min(100, s.progress + delta)) } : s
    );
    setSkills(updated);
    saveSkills(updated);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            Habilidades Valiosas
          </h1>
          <p className="text-muted-foreground mt-1">Habilidades que quiero desarrollar con el tiempo</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nueva Habilidad</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Habilidad' : 'Agregar Habilidad'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Ícono</label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`text-2xl p-1.5 rounded-md transition-colors ${form.icon === icon ? 'bg-accent ring-2 ring-primary' : 'hover:bg-accent'}`}
                      onClick={() => setForm(f => ({ ...f, icon }))}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Boxeo, Bailar, Guitarra..."
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Descripción</label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="¿Por qué quiero desarrollar esta habilidad?"
                  rows={3}
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                {editingId ? 'Guardar Cambios' : 'Agregar Habilidad'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {skills.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-1">No hay habilidades todavía</p>
            <p className="text-sm text-muted-foreground/60 mb-4">Agrega habilidades que quieras desarrollar como boxeo, bailar, tocar un instrumento...</p>
            <Button onClick={() => setDialogOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />Agregar mi primera habilidad
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{skills.length} habilidades</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map(skill => (
              <Card key={skill.id} className="border-l-4" style={{
                borderLeftColor: skill.progress >= 80 ? '#22c55e' : skill.progress >= 40 ? '#f59e0b' : 'hsl(var(--muted))'
              }}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-3xl shrink-0">{skill.icon}</span>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{skill.name}</h3>
                        {skill.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{skill.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(skill)}>
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(skill.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progreso</span>
                      <span>{skill.progress}%</span>
                    </div>
                    <Progress value={skill.progress} className="h-2" />
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => adjustProgress(skill.id, 10)}>
                      +10%
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => adjustProgress(skill.id, -10)}>
                      -10%
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
