import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Layers, Book, Music, FolderKanban, GraduationCap, Target } from 'lucide-react';
import { useState } from 'react';
export function InheritedBanner({ trimestral, onImport }) {
    const [expanded, setExpanded] = useState(true);
    if (!trimestral)
        return null;
    const categories = [
        { key: 'books', icon: _jsx(Book, { className: "w-3 h-3" }), label: 'Libros', total: trimestral.books.goal, selected: trimestral.books.selected },
        { key: 'songs', icon: _jsx(Music, { className: "w-3 h-3" }), label: 'Canciones', total: trimestral.songs.goal, selected: trimestral.songs.selected },
        { key: 'projects', icon: _jsx(FolderKanban, { className: "w-3 h-3" }), label: 'Proyectos', total: trimestral.projects, selected: trimestral.projects },
        { key: 'subjects', icon: _jsx(GraduationCap, { className: "w-3 h-3" }), label: 'Asignaturas', total: trimestral.subjects, selected: trimestral.subjects },
        { key: 'goals', icon: _jsx(Target, { className: "w-3 h-3" }), label: 'Metas', total: trimestral.personal_goals, selected: trimestral.personal_goals },
    ];
    return (_jsx(Card, { className: "border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/40 dark:bg-indigo-950/20", children: _jsxs("div", { className: "p-3", children: [_jsxs("button", { onClick: () => setExpanded(!expanded), className: "flex items-center justify-between w-full", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Layers, { className: "w-4 h-4 text-indigo-500" }), _jsxs("span", { className: "text-sm font-semibold", children: ["Plan ", trimestral.quarterLabel] }), _jsx(Badge, { variant: "secondary", className: "text-[10px] h-5", children: "Meta general" })] }), expanded ? _jsx(ChevronUp, { className: "w-3.5 h-3.5 text-muted-foreground" }) : _jsx(ChevronDown, { className: "w-3.5 h-3.5 text-muted-foreground" })] }), expanded && (_jsxs("div", { className: "mt-3 space-y-2", children: [_jsx("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-2", children: categories.map(cat => (_jsxs("div", { className: "flex items-center justify-between bg-white/60 dark:bg-zinc-950/40 rounded-lg px-2.5 py-1.5", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "text-muted-foreground", children: cat.icon }), _jsx("span", { className: "text-xs", children: cat.label })] }), _jsxs("span", { className: "text-xs font-semibold", children: [cat.selected, "/", cat.total] })] }, cat.key))) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "outline", className: "h-7 text-[11px] gap-1", onClick: () => onImport('all'), children: "Importar todo al mes" }), _jsx(Button, { size: "sm", variant: "ghost", className: "h-7 text-[11px] text-indigo-500", onClick: () => onImport('auto'), children: "Distribuir autom\u251C\u00EDticamente" })] })] }))] }) }));
}
