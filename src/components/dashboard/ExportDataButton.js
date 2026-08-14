import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV } from "@/lib/exportUtils";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
export function ExportDataButton() {
    const exportTasks = async () => {
        const { data } = await supabase.from('tasks').select('title,status,priority,area_id,completed,due_date,created_at');
        if (data?.length) {
            exportToCSV(data, 'tareas');
            toast.success('Tareas exportadas');
        }
        else
            toast.error('No hay tareas');
    };
    const exportGoals = async () => {
        const { data } = await supabase.from('twelve_week_goals').select('title,category,progress_percentage,status,quarter,year');
        if (data?.length) {
            exportToCSV(data, 'metas');
            toast.success('Metas exportadas');
        }
        else
            toast.error('No hay metas');
    };
    const exportFocus = async () => {
        const { data } = await supabase.from('focus_sessions').select('task_title,task_area,duration_minutes,completed,start_time,end_time');
        if (data?.length) {
            exportToCSV(data, 'focus_sessions');
            toast.success('Sesiones exportadas');
        }
        else
            toast.error('No hay sesiones');
    };
    const exportHabits = async () => {
        const { data } = await supabase.from('daily_area_stats').select('area_id,stat_date,time_spent_minutes,completed,pages_done,exercises_done');
        if (data?.length) {
            exportToCSV(data, 'habitos');
            toast.success('Hábitos exportados');
        }
        else
            toast.error('No hay datos');
    };
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", children: [_jsx(Download, { className: "w-4 h-4" }), "Exportar CSV"] }) }), _jsxs(DropdownMenuContent, { children: [_jsx(DropdownMenuItem, { onClick: exportTasks, children: "\uD83D\uDCCB Tareas" }), _jsx(DropdownMenuItem, { onClick: exportGoals, children: "\uD83C\uDFAF Metas" }), _jsx(DropdownMenuItem, { onClick: exportFocus, children: "\u23F1\uFE0F Sesiones Focus" }), _jsx(DropdownMenuItem, { onClick: exportHabits, children: "\uD83D\uDCCA H\u00E1bitos Diarios" })] })] }));
}
