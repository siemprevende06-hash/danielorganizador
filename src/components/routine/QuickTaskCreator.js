import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
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
export function QuickTaskCreator({ selectedDate, onTaskCreated }) {
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
            if (error)
                throw error;
            setTitle('');
            toast.success('Tarea creada');
            onTaskCreated();
        }
        catch (error) {
            console.error('Error creating task:', error);
            toast.error(error.message || 'Error al crear la tarea');
        }
        finally {
            setLoading(false);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading) {
            handleCreate();
        }
    };
    return (_jsxs(Card, { className: "p-4", children: [_jsxs("p", { className: "text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2", children: [_jsx(Plus, { className: "h-4 w-4" }), "Crear Tarea R\u00E1pida"] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx(Input, { placeholder: "T\u00EDtulo de la tarea...", value: title, onChange: (e) => setTitle(e.target.value), onKeyPress: handleKeyPress, className: "flex-1", disabled: loading }), _jsxs(Select, { value: areaId, onValueChange: setAreaId, disabled: loading, children: [_jsx(SelectTrigger, { className: "w-full sm:w-[140px]", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: AREAS.map(area => (_jsx(SelectItem, { value: area.id, children: area.name }, area.id))) })] }), _jsxs(Select, { value: priority, onValueChange: setPriority, disabled: loading, children: [_jsx(SelectTrigger, { className: "w-full sm:w-[100px]", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: PRIORITIES.map(p => (_jsx(SelectItem, { value: p.id, children: p.name }, p.id))) })] }), _jsxs(Button, { onClick: handleCreate, disabled: loading || !title.trim(), children: [loading ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(Plus, { className: "h-4 w-4" }), _jsx("span", { className: "ml-1 hidden sm:inline", children: "Crear" })] })] })] }));
}
