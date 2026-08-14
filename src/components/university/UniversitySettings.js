import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Calendar, Clock, Save } from 'lucide-react';
export function UniversitySettings({ currentYear, currentSemester, academicSchedule, onSave }) {
    const [isOpen, setIsOpen] = useState(false);
    const [year, setYear] = useState(currentYear.toString());
    const [semester, setSemester] = useState(currentSemester.toString());
    const [scheduleText, setScheduleText] = useState(academicSchedule.length > 0
        ? JSON.stringify(academicSchedule, null, 2)
        : `[
  { "day": "Lunes", "start": "08:00", "end": "10:00", "subject": "" },
  { "day": "Martes", "start": "08:00", "end": "10:00", "subject": "" }
]`);
    const handleSave = async () => {
        let parsedSchedule = [];
        try {
            parsedSchedule = JSON.parse(scheduleText);
        }
        catch (e) {
            parsedSchedule = academicSchedule;
        }
        const success = await onSave({
            current_year: parseInt(year) || 1,
            current_semester: parseInt(semester) || 1,
            academic_schedule: parsedSchedule
        });
        if (success) {
            setIsOpen(false);
        }
    };
    return (_jsxs(Dialog, { open: isOpen, onOpenChange: setIsOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(Settings, { className: "h-4 w-4 mr-2" }), "Configuraci\u00F3n"] }) }), _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Settings, { className: "h-5 w-5" }), "Configuraci\u00F3n Universidad"] }), _jsx(DialogDescription, { children: "Configura tu a\u00F1o, semestre y horario acad\u00E9mico" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "text-sm font-medium flex items-center gap-1", children: [_jsx(Calendar, { className: "h-4 w-4" }), "A\u00F1o"] }), _jsxs(Select, { value: year, onValueChange: setYear, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "1", children: "1\u00B0 A\u00F1o" }), _jsx(SelectItem, { value: "2", children: "2\u00B0 A\u00F1o" }), _jsx(SelectItem, { value: "3", children: "3\u00B0 A\u00F1o" }), _jsx(SelectItem, { value: "4", children: "4\u00B0 A\u00F1o" }), _jsx(SelectItem, { value: "5", children: "5\u00B0 A\u00F1o" })] })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "text-sm font-medium flex items-center gap-1", children: [_jsx(Clock, { className: "h-4 w-4" }), "Semestre"] }), _jsxs(Select, { value: semester, onValueChange: setSemester, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "1", children: "1\u00B0 Semestre" }), _jsx(SelectItem, { value: "2", children: "2\u00B0 Semestre" })] })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Horario Acad\u00E9mico (JSON)" }), _jsx("p", { className: "text-xs text-muted-foreground mb-2", children: "Define tu horario de clases en formato JSON" }), _jsx(Textarea, { value: scheduleText, onChange: (e) => setScheduleText(e.target.value), rows: 8, className: "font-mono text-xs", placeholder: '[{"day": "Lunes", "start": "08:00", "end": "10:00", "subject": "C\u00E1lculo I"}]' })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setIsOpen(false), children: "Cancelar" }), _jsxs(Button, { onClick: handleSave, children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Guardar"] })] })] })] }));
}
