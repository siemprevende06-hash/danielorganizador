import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
const DEFAULT_ICONS = ['⭐', '🥊', '💃', '🎸', '🎹', '🎨', '📸', '✍️', '🗣️', '🧠', '💻', '🔧', '🏋️', '🧘', '🏊', '🚴', '⛰️', '🧭'];
export default function HabilidadesValiosas() {
    const { toast } = useToast();
    const { data: skills, setData: setSkills, loading } = useTextSection('habilidades_valiosas', []);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: '', icon: '⭐', description: '' });
    const saveSkills = (s) => setSkills(s);
    const resetForm = () => {
        setForm({ name: '', icon: '⭐', description: '' });
        setEditingId(null);
    };
    const handleSave = () => {
        if (!form.name.trim()) {
            toast({ title: 'El nombre es obligatorio', variant: 'destructive' });
            return;
        }
        let updated;
        if (editingId) {
            updated = skills.map(s => s.id === editingId
                ? { ...s, name: form.name.trim(), icon: form.icon, description: form.description.trim() }
                : s);
            toast({ title: 'Habilidad actualizada' });
        }
        else {
            const newSkill = {
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
    const handleEdit = (skill) => {
        setForm({ name: skill.name, icon: skill.icon, description: skill.description });
        setEditingId(skill.id);
        setDialogOpen(true);
    };
    const handleDelete = (id) => {
        const updated = skills.filter(s => s.id !== id);
        setSkills(updated);
        saveSkills(updated);
        toast({ title: 'Habilidad eliminada' });
    };
    const adjustProgress = (id, delta) => {
        const updated = skills.map(s => s.id === id ? { ...s, progress: Math.max(0, Math.min(100, s.progress + delta)) } : s);
        setSkills(updated);
        saveSkills(updated);
    };
    if (loading) {
        return (_jsx("div", { className: "container mx-auto px-4 py-24", children: _jsxs("div", { className: "animate-pulse space-y-4", children: [_jsx("div", { className: "h-8 bg-muted rounded w-1/3" }), _jsx("div", { className: "h-64 bg-muted rounded" })] }) }));
    }
    return (_jsxs("div", { className: "container mx-auto px-4 py-24 space-y-6", children: [_jsxs("header", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold flex items-center gap-2", children: [_jsx(Target, { className: "h-8 w-8" }), "Habilidades Valiosas"] }), _jsx("p", { className: "text-muted-foreground mt-1", children: "Habilidades que quiero desarrollar con el tiempo" })] }), _jsxs(Dialog, { open: dialogOpen, onOpenChange: v => { setDialogOpen(v); if (!v)
                            resetForm(); }, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Nueva Habilidad"] }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: editingId ? 'Editar Habilidad' : 'Agregar Habilidad' }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "\u00CDcono" }), _jsx("div", { className: "flex flex-wrap gap-2", children: DEFAULT_ICONS.map(icon => (_jsx("button", { type: "button", className: `text-2xl p-1.5 rounded-md transition-colors ${form.icon === icon ? 'bg-accent ring-2 ring-primary' : 'hover:bg-accent'}`, onClick: () => setForm(f => ({ ...f, icon })), children: icon }, icon))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Nombre" }), _jsx(Input, { value: form.name, onChange: e => setForm(f => ({ ...f, name: e.target.value })), placeholder: "Ej: Boxeo, Bailar, Guitarra..." })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-muted-foreground mb-1 block", children: "Descripci\u00F3n" }), _jsx(Textarea, { value: form.description, onChange: e => setForm(f => ({ ...f, description: e.target.value })), placeholder: "\u00BFPor qu\u00E9 quiero desarrollar esta habilidad?", rows: 3 })] }), _jsx(Button, { onClick: handleSave, className: "w-full", children: editingId ? 'Guardar Cambios' : 'Agregar Habilidad' })] })] })] })] }), skills.length === 0 ? (_jsx(Card, { className: "border-dashed", children: _jsxs(CardContent, { className: "py-16 text-center", children: [_jsx(Target, { className: "h-12 w-12 mx-auto text-muted-foreground/40 mb-4" }), _jsx("p", { className: "text-muted-foreground mb-1", children: "No hay habilidades todav\u00EDa" }), _jsx("p", { className: "text-sm text-muted-foreground/60 mb-4", children: "Agrega habilidades que quieras desarrollar como boxeo, bailar, tocar un instrumento..." }), _jsxs(Button, { onClick: () => setDialogOpen(true), variant: "outline", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Agregar mi primera habilidad"] })] }) })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: _jsxs(Badge, { variant: "secondary", children: [skills.length, " habilidades"] }) }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: skills.map(skill => (_jsx(Card, { className: "border-l-4", style: {
                                borderLeftColor: skill.progress >= 80 ? '#22c55e' : skill.progress >= 40 ? '#f59e0b' : 'hsl(var(--muted))'
                            }, children: _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("span", { className: "text-3xl shrink-0", children: skill.icon }), _jsxs("div", { className: "min-w-0", children: [_jsx("h3", { className: "font-semibold truncate", children: skill.name }), skill.description && (_jsx("p", { className: "text-xs text-muted-foreground line-clamp-2", children: skill.description }))] })] }), _jsxs("div", { className: "flex gap-1 shrink-0", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => handleEdit(skill), children: _jsx(Edit3, { className: "h-3.5 w-3.5" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-destructive", onClick: () => handleDelete(skill.id), children: _jsx(Trash2, { className: "h-3.5 w-3.5" }) })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-xs text-muted-foreground mb-1", children: [_jsx("span", { children: "Progreso" }), _jsxs("span", { children: [skill.progress, "%"] })] }), _jsx(Progress, { value: skill.progress, className: "h-2" })] }), _jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { size: "sm", variant: "outline", className: "h-7 text-xs flex-1", onClick: () => adjustProgress(skill.id, 10), children: "+10%" }), _jsx(Button, { size: "sm", variant: "outline", className: "h-7 text-xs flex-1", onClick: () => adjustProgress(skill.id, -10), children: "-10%" })] })] }) }, skill.id))) })] }))] }));
}
