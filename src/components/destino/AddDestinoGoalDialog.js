import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { lifeAreas } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
export function AddDestinoGoalDialog({ defaultAreaId, onCreate }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [dailySystem, setDailySystem] = useState('');
    const [areaId, setAreaId] = useState(defaultAreaId || '');
    const [targetDate, setTargetDate] = useState('');
    const [planItems, setPlanItems] = useState('');
    const reset = () => {
        setTitle('');
        setDailySystem('');
        setAreaId(defaultAreaId || '');
        setTargetDate('');
        setPlanItems('');
    };
    const handleSubmit = async () => {
        if (!title.trim()) {
            toast({ title: 'Falta el título', description: 'Escribe qué meta quieres alcanzar', variant: 'destructive' });
            return;
        }
        try {
            await onCreate({
                title: title.trim(),
                dailySystem: dailySystem.trim(),
                areaId: areaId || null,
                targetDate,
                planItems: planItems.split('\n').map(l => l.trim()).filter(Boolean),
            });
            toast({ title: 'Meta creada 🎯' });
            setOpen(false);
            reset();
        }
        catch (error) {
            toast({ title: 'Error', description: error instanceof Error ? error.message : 'Ocurrió un error', variant: 'destructive' });
        }
    };
    return (_jsxs(Dialog, { open: open, onOpenChange: (v) => { setOpen(v); if (v)
            reset(); }, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "A\u00F1adir Meta"] }) }), _jsxs(DialogContent, { className: "max-w-lg max-h-[90vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Nueva meta de destino" }), _jsx(DialogDescription, { children: "Define el destino, el sistema diario que te lleva all\u00ED y el plan desglosado" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "\uD83C\uDFAF La meta" }), _jsx(Input, { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Ej: Aprender 10 canciones de piano", className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { className: "flex items-center gap-1", children: "\uD83D\uDD04 Sistema diario" }), _jsx(Input, { value: dailySystem, onChange: (e) => setDailySystem(e.target.value), placeholder: "Ej: 30 minutos de pr\u00E1ctica diaria", className: "mt-1" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { children: "\u00C1rea de vida" }), _jsxs(Select, { value: areaId || undefined, onValueChange: setAreaId, children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, { placeholder: "Selecciona un \u00E1rea" }) }), _jsx(SelectContent, { children: lifeAreas.map(a => _jsx(SelectItem, { value: a.id, children: a.name }, a.id)) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Fecha objetivo" }), _jsx(Input, { type: "date", value: targetDate, onChange: (e) => setTargetDate(e.target.value), className: "mt-1" })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "\u2705 Plan desglosado" }), _jsx("p", { className: "text-xs text-muted-foreground mt-1 mb-1", children: "Un item por l\u00EDnea (ej: las canciones que quieres aprender)" }), _jsx(Textarea, { value: planItems, onChange: (e) => setPlanItems(e.target.value), placeholder: 'Clair de Lune\nFür Elise\nRiver Flows in You', rows: 4 })] }), _jsx(Button, { onClick: handleSubmit, className: "w-full", children: "Crear meta" })] })] })] }));
}
