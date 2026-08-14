import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
export function ItemSelector({ items, selected, onChange, placeholder = 'Seleccionar...', searchPlaceholder = 'Buscar...', emptyMessage = 'Sin resultados', triggerLabel, }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const filtered = items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()) ||
        (i.subtitle && i.subtitle.toLowerCase().includes(search.toLowerCase())));
    const toggle = (id) => {
        if (selected.includes(id)) {
            onChange(selected.filter(s => s !== id));
        }
        else {
            onChange([...selected, id]);
        }
    };
    const selectedItems = items.filter(i => selected.includes(i.id));
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: "w-full justify-between h-auto min-h-[2.5rem]", children: [selectedItems.length > 0 ? (_jsxs("div", { className: "flex flex-wrap gap-1", children: [selectedItems.slice(0, 3).map(item => (_jsx(Badge, { variant: "secondary", className: "text-[11px] font-normal", children: item.title }, item.id))), selectedItems.length > 3 && (_jsxs(Badge, { variant: "outline", className: "text-[11px]", children: ["+", selectedItems.length - 3] }))] })) : (_jsx("span", { className: "text-sm text-muted-foreground", children: placeholder })), triggerLabel && (_jsx("span", { className: "text-xs text-muted-foreground shrink-0 ml-2", children: triggerLabel }))] }) }), _jsxs(DialogContent, { className: "sm:max-w-lg", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { className: "text-base font-semibold", children: triggerLabel || placeholder }) }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: searchPlaceholder, value: search, onChange: e => setSearch(e.target.value), className: "pl-9", autoFocus: true })] }), _jsxs("div", { className: "max-h-64 overflow-y-auto space-y-0.5 -mx-2", children: [filtered.length === 0 && (_jsx("p", { className: "text-sm text-muted-foreground text-center py-8", children: emptyMessage })), filtered.map(item => {
                                const isSelected = selected.includes(item.id);
                                return (_jsxs("button", { onClick: () => toggle(item.id), className: cn('w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded-lg transition-colors', isSelected
                                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                                        : 'hover:bg-muted'), children: [_jsx("div", { className: cn('w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors', isSelected
                                                ? 'bg-indigo-500 border-indigo-500 text-white'
                                                : 'border-muted-foreground/30'), children: isSelected && _jsx(Check, { className: "h-3 w-3" }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "truncate font-medium", children: item.title }), item.subtitle && (_jsx("p", { className: "truncate text-xs text-muted-foreground", children: item.subtitle }))] })] }, item.id));
                            })] }), _jsxs("div", { className: "flex items-center justify-between border-t pt-3 -mx-6 px-6", children: [_jsxs("span", { className: "text-xs text-muted-foreground", children: [selected.length, " seleccionados"] }), _jsx(Button, { size: "sm", onClick: () => setOpen(false), children: "Listo" })] })] })] }));
}
