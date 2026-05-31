import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV } from "@/lib/exportUtils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ExportDataButton() {
  const exportTasks = async () => {
    const { data } = await supabase.from('tasks').select('title,status,priority,area_id,completed,due_date,created_at');
    if (data?.length) { exportToCSV(data, 'tareas'); toast.success('Tareas exportadas'); }
    else toast.error('No hay tareas');
  };

  const exportGoals = async () => {
    const { data } = await supabase.from('twelve_week_goals').select('title,category,progress_percentage,status,quarter,year');
    if (data?.length) { exportToCSV(data, 'metas'); toast.success('Metas exportadas'); }
    else toast.error('No hay metas');
  };

  const exportFocus = async () => {
    const { data } = await supabase.from('focus_sessions').select('task_title,task_area,duration_minutes,completed,start_time,end_time');
    if (data?.length) { exportToCSV(data, 'focus_sessions'); toast.success('Sesiones exportadas'); }
    else toast.error('No hay sesiones');
  };

  const exportHabits = async () => {
    const { data } = await supabase.from('daily_area_stats').select('area_id,stat_date,time_spent_minutes,completed,pages_done,exercises_done');
    if (data?.length) { exportToCSV(data, 'habitos'); toast.success('Hábitos exportados'); }
    else toast.error('No hay datos');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportTasks}>📋 Tareas</DropdownMenuItem>
        <DropdownMenuItem onClick={exportGoals}>🎯 Metas</DropdownMenuItem>
        <DropdownMenuItem onClick={exportFocus}>⏱️ Sesiones Focus</DropdownMenuItem>
        <DropdownMenuItem onClick={exportHabits}>📊 Hábitos Diarios</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
