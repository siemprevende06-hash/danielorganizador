import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useTextSection } from "@/hooks/useTextSection";
import { Plus, Trash2, Heart, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
function uid() {
    return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
export default function Novia() {
    const { data: lists, setData: setLists, loading } = useTextSection("novia-lists", []);
    const [newListName, setNewListName] = useState("");
    const [newItemText, setNewItemText] = useState({});
    const addList = () => {
        if (!newListName.trim())
            return;
        setLists([...lists, { id: uid(), name: newListName.trim(), items: [] }]);
        setNewListName("");
    };
    const deleteList = (id) => {
        setLists(lists.filter(l => l.id !== id));
    };
    const addItem = (listId) => {
        const text = newItemText[listId]?.trim();
        if (!text)
            return;
        setLists(lists.map(l => l.id === listId ? { ...l, items: [...l.items, { id: uid(), text, checked: false }] } : l));
        setNewItemText(prev => ({ ...prev, [listId]: "" }));
    };
    const toggleItem = (listId, itemId) => {
        setLists(lists.map(l => l.id === listId
            ? { ...l, items: l.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) }
            : l));
    };
    const deleteItem = (listId, itemId) => {
        setLists(lists.map(l => l.id === listId ? { ...l, items: l.items.filter(i => i.id !== itemId) } : l));
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-background p-4 md:p-6 pt-20 pb-24 flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-background p-4 md:p-6 pt-20 pb-24", children: _jsxs("div", { className: "max-w-3xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500", children: _jsx(Heart, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Novia" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Listas de cosas pendientes" })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: newListName, onChange: e => setNewListName(e.target.value), placeholder: "Nombre de la lista...", className: "h-9", onKeyDown: e => { if (e.key === 'Enter')
                                addList(); } }), _jsxs(Button, { onClick: addList, disabled: !newListName.trim(), className: "h-9 shrink-0 gap-1.5", children: [_jsx(Plus, { className: "h-4 w-4" }), " Crear lista"] })] }), lists.length === 0 && (_jsx(Card, { className: "border-dashed", children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-16 gap-3", children: [_jsx(ListChecks, { className: "h-10 w-10 text-muted-foreground/50" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "No hay listas todav\u00EDa. Crea una para empezar." })] }) })), _jsx("div", { className: "space-y-4", children: lists.map(list => {
                        const checkedCount = list.items.filter(i => i.checked).length;
                        return (_jsxs(Card, { className: "overflow-hidden", children: [_jsxs(CardHeader, { className: "pb-3 flex flex-row items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx(CardTitle, { className: "text-base font-semibold truncate", children: list.name }), _jsxs("p", { className: "text-[11px] text-muted-foreground", children: [checkedCount, "/", list.items.length, " completados"] })] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-destructive shrink-0", onClick: () => deleteList(list.id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }), _jsxs(CardContent, { className: "space-y-2 pt-0", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: newItemText[list.id] || "", onChange: e => setNewItemText(prev => ({ ...prev, [list.id]: e.target.value })), placeholder: "Agregar elemento...", className: "h-8 text-sm", onKeyDown: e => { if (e.key === 'Enter')
                                                        addItem(list.id); } }), _jsx(Button, { variant: "outline", size: "icon", className: "h-8 w-8 shrink-0", onClick: () => addItem(list.id), disabled: !newItemText[list.id]?.trim(), children: _jsx(Plus, { className: "h-4 w-4" }) })] }), list.items.length === 0 && (_jsx("p", { className: "text-xs text-muted-foreground text-center py-4 italic", children: "Sin elementos" })), _jsx("div", { className: "space-y-1", children: list.items.map(item => (_jsxs("div", { className: cn("flex items-center gap-2.5 p-2 rounded-lg border border-border/40 text-sm transition-colors group", item.checked && "bg-muted/30 border-muted"), children: [_jsx(Checkbox, { checked: item.checked, onCheckedChange: () => toggleItem(list.id, item.id), className: "h-4 w-4" }), _jsx("span", { className: cn("flex-1 min-w-0 truncate", item.checked && "line-through text-muted-foreground"), children: item.text }), _jsx("button", { onClick: () => deleteItem(list.id, item.id), className: "opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive", children: _jsx(Trash2, { className: "h-3.5 w-3.5" }) })] }, item.id))) })] })] }, list.id));
                    }) })] }) }));
}
