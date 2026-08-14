import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReminders } from '@/hooks/useReminders';
export default function RemindersPage() {
    const { reminders, isLoading, addReminder, toggleReminder, deleteReminder } = useReminders();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dateTime, setDateTime] = useState('');
    const { toast } = useToast();
    const handleCreateReminder = async () => {
        if (!title.trim())
            return;
        const result = await addReminder({ title, description, dateTime });
        if (result) {
            setTitle('');
            setDescription('');
            setDateTime('');
            setIsDialogOpen(false);
            toast({ title: 'Recordatorio creado', description: `${title} ha sido añadido.` });
        }
    };
    const handleToggleReminder = async (reminderId) => {
        await toggleReminder(reminderId);
    };
    const handleDeleteReminder = async (reminderId) => {
        await deleteReminder(reminderId);
        toast({ title: 'Recordatorio eliminado' });
    };
    if (isLoading) {
        return (_jsx("div", { className: "container mx-auto px-4 py-24 space-y-6", children: _jsxs("header", { children: [_jsxs("h1", { className: "text-3xl font-headline font-bold flex items-center gap-2", children: [_jsx(Bell, { className: "h-8 w-8" }), "Recordatorios"] }), _jsx("p", { className: "text-muted-foreground", children: "Cargando..." })] }) }));
    }
    return (_jsxs("div", { className: "container mx-auto px-4 py-24 space-y-6", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("header", { children: [_jsxs("h1", { className: "text-3xl font-headline font-bold flex items-center gap-2", children: [_jsx(Bell, { className: "h-8 w-8" }), "Recordatorios"] }), _jsx("p", { className: "text-muted-foreground", children: "No olvides lo importante" })] }), _jsxs(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(PlusCircle, { className: "mr-2 h-4 w-4" }), "Nuevo Recordatorio"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Crear Nuevo Recordatorio" }), _jsx(DialogDescription, { children: "Define tu recordatorio." })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "T\u00EDtulo" }), _jsx(Input, { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Ej: Llamar al doctor" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Descripci\u00F3n" }), _jsx(Textarea, { value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Detalles..." })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Fecha y hora" }), _jsx(Input, { type: "datetime-local", value: dateTime, onChange: (e) => setDateTime(e.target.value) })] })] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: handleCreateReminder, children: "Crear Recordatorio" }) })] })] })] }), _jsx("div", { className: "grid gap-4", children: reminders.map((reminder) => (_jsx(Card, { className: reminder.completed ? 'opacity-60' : '', children: _jsx(CardHeader, { children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start gap-3 flex-1", children: [_jsx(Checkbox, { checked: reminder.completed, onCheckedChange: () => handleToggleReminder(reminder.id) }), _jsxs("div", { className: "flex-1", children: [_jsx(CardTitle, { className: `text-lg ${reminder.completed ? 'line-through text-muted-foreground' : ''}`, children: reminder.title }), reminder.description && (_jsx("p", { className: "text-sm text-muted-foreground mt-1", children: reminder.description })), reminder.dateTime && (_jsx("p", { className: "text-xs text-muted-foreground mt-2", children: new Date(reminder.dateTime).toLocaleString('es-ES') }))] })] }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => handleDeleteReminder(reminder.id), children: _jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })] }) }) }, reminder.id))) }), reminders.length === 0 && (_jsx(Card, { children: _jsx(CardContent, { className: "py-12 text-center", children: _jsx("p", { className: "text-muted-foreground", children: "No tienes recordatorios a\u00FAn." }) }) }))] }));
}
