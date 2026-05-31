import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface QuickTaskCreatorProps {
  selectedDate: Date;
  onTaskCreated: () => void;
}

const AREAS = [
  { id: 'universidad', name: 'Universidad', source: 'university' },
  { id: 'emprendimiento', name: 'Emprendimiento', source: 'entrepreneurship' },
  { id: 'proyectos', name: 'Proyectos', source: 'project' },
  { id: 'general', name: 'General', source: 'general' },
];

const PRIORITIES = [
  { id: 'high', name: 'Alta' },
  { id: 'medium', name: 'Media' },
  { id: 'low', name: 'Baja' },
];

export function QuickTaskCreator({ selectedDate, onTaskCreated }: QuickTaskCreatorProps) {
  const [title, setTitle] = useState('');
  const [areaId, setAreaId] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Escribe un título para la tarea');
      return;
    }

    setLoading(true);
    try {
      const area = AREAS.find(a => a.id === areaId);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const { error } = await supabase
        .from('tasks')
        .insert({
          title: title.trim(),
          source: area?.source || 'general',
          area_id: areaId,
          priority,
          due_date: `${dateStr}T12:00:00`,
          completed: false,
          status: 'pendiente',
          user_id: null
        });

      if (error) throw error;

      setTitle('');
      toast.success('Tarea creada');
      onTaskCreated();
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error(error.message || 'Error al crear la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleCreate();
    }
  };

  return (
    <Card className="p-4">
      <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Crear Tarea Rápida
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Título de la tarea..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
          disabled={loading}
        />
        <Select value={areaId} onValueChange={setAreaId} disabled={loading}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AREAS.map(area => (
              <SelectItem key={area.id} value={area.id}>
                {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority} disabled={loading}>
          <SelectTrigger className="w-full sm:w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleCreate} disabled={loading || !title.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span className="ml-1 hidden sm:inline">Crear</span>
        </Button>
      </div>
    </Card>
  );
}