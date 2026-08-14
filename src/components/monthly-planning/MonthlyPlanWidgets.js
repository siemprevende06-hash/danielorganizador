import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProgressRing } from './ProgressRing';
import { ItemSelector } from './ItemSelector';
import { Book, Music, FolderKanban, GraduationCap, Calendar, Target, Plus, Trash2 } from 'lucide-react';
function WidgetCard({ icon, title, count, children }) {
    return (_jsx(Card, { className: "overflow-hidden border border-gray-200/70 dark:border-gray-800/70 shadow-sm", children: _jsxs("div", { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500", children: icon }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold", children: title }), count > 0 && _jsxs("p", { className: "text-[11px] text-muted-foreground", children: [count, " seleccionados"] })] })] }), _jsx(ProgressRing, { progress: count > 0 ? 100 : 0, size: 36, strokeWidth: 3, strokeColor: "indigo", children: _jsx("span", { className: "text-[9px] font-bold text-indigo-500", children: count }) })] }), children] }) }));
}
function removeFromOtherMonths(p, id, type, activeKey) {
    const keys = ["month1", "month2", "month3"];
    const dist = { ...p.distribution };
    keys.forEach(k => {
        if (k === activeKey)
            return;
        const arr = type === "book" ? [...dist[k].books] : [...dist[k].songs];
        const filtered = arr.filter(x => x !== id);
        if (filtered.length !== (type === "book" ? dist[k].books.length : dist[k].songs.length)) {
            dist[k] = type === "book" ? { ...dist[k], books: filtered } : { ...dist[k], songs: filtered };
        }
    });
    return { ...p, distribution: dist };
}
export function BookPlannerWidget({ planData, updatePlanData, items, monthKey }) {
    const [goalInput, setGoalInput] = useState(String(planData.books.goal || ''));
    const isMonthMode = !!monthKey;
    const count = isMonthMode
        ? planData.distribution?.[monthKey]?.books?.length || 0
        : planData.books.selected.length;
    return (_jsx(WidgetCard, { icon: _jsx(Book, { className: "w-4 h-4" }), title: "Libros", count: count, children: _jsxs("div", { className: "space-y-2.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-muted-foreground shrink-0", children: "Meta:" }), _jsx(Input, { type: "number", min: 0, max: 50, value: goalInput, onChange: e => {
                                const n = parseInt(e.target.value) || 0;
                                setGoalInput(e.target.value);
                                updatePlanData(p => ({ ...p, books: { ...p.books, goal: n } }));
                            }, className: "h-7 w-16 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" }), _jsx("span", { className: "text-xs text-muted-foreground", children: "libros en el trimestre" })] }), _jsx(ItemSelector, { items: items, selected: isMonthMode ? planData.distribution?.[monthKey]?.books || [] : planData.books.selected, onChange: ids => {
                        if (isMonthMode) {
                            updatePlanData(p => {
                                let next = removeFromOtherMonths(p, "", "book", monthKey);
                                ids.forEach(id => { next = removeFromOtherMonths(next, id, "book", monthKey); });
                                return {
                                    ...next,
                                    distribution: {
                                        ...next.distribution,
                                        [monthKey]: { ...next.distribution[monthKey], books: ids },
                                    },
                                };
                            });
                        }
                        else {
                            updatePlanData(p => ({ ...p, books: { ...p.books, selected: ids } }));
                        }
                    }, placeholder: "Seleccionar libros...", searchPlaceholder: "Buscar libro..." })] }) }));
}
export function SongPlannerWidget({ planData, updatePlanData, items, monthKey }) {
    const [goalInput, setGoalInput] = useState(String(planData.songs.goal || ''));
    const isMonthMode = !!monthKey;
    const songs = items.map(i => {
        const inst = (i.subtitle || '').includes('guitar') ? 'guitar' : 'piano';
        return { id: i.id, title: i.title, artist: i.subtitle?.split(' · ')[0] || null, instrument: inst };
    });
    const pianoItems = songs.filter(s => s.instrument === 'piano');
    const guitarItems = songs.filter(s => s.instrument === 'guitar');
    const currentIds = isMonthMode ? planData.distribution?.[monthKey]?.songs || [] : planData.songs.selected;
    const pianoSelected = pianoItems.filter(s => currentIds.includes(s.id)).map(s => s.id);
    const guitarSelected = guitarItems.filter(s => currentIds.includes(s.id)).map(s => s.id);
    const handleChange = (sectionIds, section) => {
        const sectionItems = section === "piano" ? pianoItems : guitarItems;
        const otherSectionIds = section === "piano" ? guitarSelected : pianoSelected;
        const merged = [...new Set([...sectionIds, ...otherSectionIds])];
        if (isMonthMode) {
            updatePlanData(p => {
                let next = { ...p };
                merged.forEach(id => { next = removeFromOtherMonths(next, id, "song", monthKey); });
                return {
                    ...next,
                    distribution: {
                        ...next.distribution,
                        [monthKey]: { ...next.distribution[monthKey], songs: merged },
                    },
                };
            });
        }
        else {
            updatePlanData(p => ({ ...p, songs: { ...p.songs, selected: merged } }));
        }
    };
    return (_jsx(WidgetCard, { icon: _jsx(Music, { className: "w-4 h-4" }), title: "Canciones", count: currentIds.length, children: _jsxs("div", { className: "space-y-2.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-muted-foreground shrink-0", children: "Meta:" }), _jsx(Input, { type: "number", min: 0, max: 50, value: goalInput, onChange: e => {
                                const n = parseInt(e.target.value) || 0;
                                setGoalInput(e.target.value);
                                updatePlanData(p => ({ ...p, songs: { ...p.songs, goal: n } }));
                            }, className: "h-7 w-16 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" }), _jsx("span", { className: "text-xs text-muted-foreground", children: "canciones en el trimestre" })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsxs("p", { className: "text-[10px] font-semibold text-muted-foreground flex items-center gap-1", children: ["Piano (", pianoItems.length, ")"] }), _jsx(ItemSelector, { items: pianoItems.map(s => ({ id: s.id, title: s.title, subtitle: s.artist || undefined })), selected: pianoSelected, onChange: ids => handleChange(ids, "piano"), placeholder: "Seleccionar piano...", searchPlaceholder: "Buscar canci\u00F3n de piano..." })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("p", { className: "text-[10px] font-semibold text-muted-foreground flex items-center gap-1", children: ["Guitarra (", guitarItems.length, ")"] }), _jsx(ItemSelector, { items: guitarItems.map(s => ({ id: s.id, title: s.title, subtitle: s.artist || undefined })), selected: guitarSelected, onChange: ids => handleChange(ids, "guitar"), placeholder: "Seleccionar guitarra...", searchPlaceholder: "Buscar canci\u00F3n de guitarra..." })] })] })] }) }));
}
export function ProjectPlannerWidget({ planData, updatePlanData, items }) {
    return (_jsx(WidgetCard, { icon: _jsx(FolderKanban, { className: "w-4 h-4" }), title: "Proyectos", count: planData.projects.length, children: _jsx(ItemSelector, { items: items, selected: planData.projects, onChange: ids => updatePlanData(p => ({ ...p, projects: ids })), placeholder: "Seleccionar proyectos...", searchPlaceholder: "Buscar proyecto..." }) }));
}
export function SubjectPlannerWidget({ planData, updatePlanData, items, topics }) {
    return (_jsx(WidgetCard, { icon: _jsx(GraduationCap, { className: "w-4 h-4" }), title: "Asignaturas", count: planData.subjects.length, children: _jsx(ItemSelector, { items: items, selected: planData.subjects.map(s => s.subject_id), onChange: ids => updatePlanData(p => ({
                ...p,
                subjects: ids.map(id => ({
                    subject_id: id,
                    topics: p.subjects.find(s => s.subject_id === id)?.topics || [],
                })),
            })), placeholder: "Seleccionar asignaturas...", searchPlaceholder: "Buscar asignatura..." }) }));
}
export function EventPlannerWidget({ planData, updatePlanData, items }) {
    return (_jsx(WidgetCard, { icon: _jsx(Calendar, { className: "w-4 h-4" }), title: "Eventos", count: planData.events.length, children: _jsx(ItemSelector, { items: items, selected: planData.events, onChange: ids => updatePlanData(p => ({ ...p, events: ids })), placeholder: "Seleccionar eventos...", searchPlaceholder: "Buscar evento..." }) }));
}
export function GoalPlannerWidget({ planData, updatePlanData }) {
    const [newGoal, setNewGoal] = useState('');
    return (_jsx(WidgetCard, { icon: _jsx(Target, { className: "w-4 h-4" }), title: "Metas Personales", count: planData.personal_goals.length, children: _jsxs("div", { className: "space-y-2.5", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { placeholder: "Agregar meta...", value: newGoal, onChange: e => setNewGoal(e.target.value), onKeyDown: e => {
                                if (e.key === 'Enter' && newGoal.trim()) {
                                    updatePlanData(p => ({ ...p, personal_goals: [...p.personal_goals, { title: newGoal.trim() }] }));
                                    setNewGoal('');
                                }
                            }, className: "h-8 text-xs" }), _jsx(Button, { size: "icon", variant: "ghost", onClick: () => {
                                if (newGoal.trim()) {
                                    updatePlanData(p => ({ ...p, personal_goals: [...p.personal_goals, { title: newGoal.trim() }] }));
                                    setNewGoal('');
                                }
                            }, className: "h-8 w-8 shrink-0", children: _jsx(Plus, { className: "h-4 w-4" }) })] }), planData.personal_goals.length > 0 && (_jsx("div", { className: "space-y-1", children: planData.personal_goals.map((goal, i) => (_jsxs("div", { className: "flex items-center gap-2 group", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" }), _jsx("p", { className: "text-xs flex-1 truncate", children: goal.title }), _jsx("button", { onClick: () => updatePlanData(p => ({ ...p, personal_goals: p.personal_goals.filter((_, idx) => idx !== i) })), className: "opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(Trash2, { className: "h-3 w-3 text-muted-foreground hover:text-destructive" }) })] }, i))) }))] }) }));
}
