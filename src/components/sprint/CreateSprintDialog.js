import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
export function CreateSprintDialog({ open, onOpenChange, onCreate }) {
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().split('T')[0];
    });
    const [saving, setSaving] = useState(false);
    const handleCreate = async () => {
        if (!name.trim())
            return;
        setSaving(true);
        try {
            await onCreate(name.trim(), startDate, endDate);
            onOpenChange(false);
            setName('');
        }
        catch (error) {
            console.error(error);
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Plus, { className: "h-4 w-4" }), " Nuevo Sprint"] }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "sprint-name", children: "Nombre del sprint" }), _jsx(Input, { id: "sprint-name", value: name, onChange: e => setName(e.target.value), placeholder: "Ej: Sprint Febrero 2026" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "start-date", children: "Inicio" }), _jsx(Input, { id: "start-date", type: "date", value: startDate, onChange: e => setStartDate(e.target.value) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "end-date", children: "Fin" }), _jsx(Input, { id: "end-date", type: "date", value: endDate, onChange: e => setEndDate(e.target.value) })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancelar" }), _jsx(Button, { onClick: handleCreate, disabled: !name.trim() || saving, children: saving ? 'Creando...' : 'Crear Sprint' })] })] }) }));
}
