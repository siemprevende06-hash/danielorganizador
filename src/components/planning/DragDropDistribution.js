import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Piano, Guitar, ChevronRight, ChevronLeft, X } from "lucide-react";
const MONTH_KEYS = ["month1", "month2", "month3"];
export function DragDropDistribution({ distribution, books, songs, monthLabels, onDistributionChange, onAutoDistribute, }) {
    const allBookIds = books.map(b => b.id);
    const allSongIds = songs.map(s => s.id);
    const assignedBookIds = new Set(MONTH_KEYS.flatMap(k => distribution[k].books));
    const assignedSongIds = new Set(MONTH_KEYS.flatMap(k => distribution[k].songs));
    const unassignedBooks = books.filter(b => !assignedBookIds.has(b.id));
    const unassignedSongs = songs.filter(s => !assignedSongIds.has(s.id));
    const hasUnassigned = unassignedBooks.length > 0 || unassignedSongs.length > 0;
    const moveItem = (itemId, type, fromMonth, toMonth) => {
        const newDist = MONTH_KEYS.reduce((acc, key) => {
            acc[key] = { books: [...distribution[key].books], songs: [...distribution[key].songs] };
            return acc;
        }, {});
        if (fromMonth) {
            if (type === "book")
                newDist[fromMonth].books = newDist[fromMonth].books.filter(id => id !== itemId);
            else
                newDist[fromMonth].songs = newDist[fromMonth].songs.filter(id => id !== itemId);
        }
        if (type === "book")
            newDist[toMonth].books.push(itemId);
        else
            newDist[toMonth].songs.push(itemId);
        onDistributionChange(newDist);
    };
    const removeItem = (itemId, type, fromMonth) => {
        const newDist = MONTH_KEYS.reduce((acc, key) => {
            acc[key] = { books: [...distribution[key].books], songs: [...distribution[key].songs] };
            return acc;
        }, {});
        if (type === "book")
            newDist[fromMonth].books = newDist[fromMonth].books.filter(id => id !== itemId);
        else
            newDist[fromMonth].songs = newDist[fromMonth].songs.filter(id => id !== itemId);
        onDistributionChange(newDist);
    };
    const getBook = (id) => books.find(b => b.id === id);
    const getSong = (id) => songs.find(s => s.id === id);
    const totalItems = allBookIds.length + allSongIds.length;
    if (totalItems === 0) {
        return (_jsx(Card, { className: "border border-dashed border-muted-foreground/30 bg-muted/20 rounded-2xl", children: _jsx(CardContent, { className: "p-6 text-center", children: _jsx("p", { className: "text-xs text-muted-foreground", children: "Selecciona libros o canciones arriba para distribuirlos entre los meses" }) }) }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-1 h-5 rounded-full bg-indigo-400" }), _jsx("span", { className: "text-sm font-semibold", children: "Distribuci\u00F3n por meses" }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-6 text-[10px] text-indigo-500", onClick: onAutoDistribute, children: "Auto-distribuir" })] }), hasUnassigned && (_jsx(Card, { className: "border-2 border-dashed border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10 rounded-2xl", children: _jsxs(CardContent, { className: "p-3 space-y-2", children: [_jsx("p", { className: "text-[10px] font-medium text-amber-600/70", children: "Sin asignar \u2014 elige un mes para cada elemento" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [unassignedBooks.map(book => (_jsxs("div", { className: "flex items-center gap-1.5 p-1.5 pr-1 rounded-xl bg-white dark:bg-zinc-950 border shadow-sm", children: [_jsx("div", { className: "w-7 h-10 rounded overflow-hidden bg-gradient-to-br from-indigo-500/20 shrink-0 flex items-center justify-center", children: book.cover_image_url ? (_jsx("img", { src: book.cover_image_url, alt: book.title, className: "w-full h-full object-cover" })) : (_jsx(BookOpen, { className: "w-3 h-3 text-indigo-400/60" })) }), _jsx("span", { className: "text-[10px] font-medium max-w-[100px] truncate", children: book.title }), _jsx("div", { className: "flex gap-0.5 ml-1", children: MONTH_KEYS.map((key, mi) => (_jsx("button", { onClick: () => moveItem(book.id, "book", null, key), className: "text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 hover:bg-indigo-200 transition-colors whitespace-nowrap", children: monthLabels[mi] }, key))) })] }, book.id))), unassignedSongs.map(song => (_jsxs("div", { className: "flex items-center gap-1 p-1.5 pr-1 rounded-lg bg-white dark:bg-zinc-950 border shadow-sm", children: [song.instrument === "piano" ? _jsx(Piano, { className: "h-3 w-3 text-rose-400" }) : _jsx(Guitar, { className: "h-3 w-3 text-amber-400" }), _jsx("span", { className: "text-[10px] font-medium max-w-[80px] truncate", children: song.title }), _jsx("div", { className: "flex gap-0.5 ml-1", children: MONTH_KEYS.map((key, mi) => (_jsx("button", { onClick: () => moveItem(song.id, "song", null, key), className: "text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 hover:bg-indigo-200 transition-colors whitespace-nowrap", children: monthLabels[mi] }, key))) })] }, song.id)))] })] }) })), _jsx("div", { className: "grid grid-cols-3 gap-3", children: MONTH_KEYS.map((key, mi) => {
                    const month = distribution[key];
                    const monthBooks = month.books.map(id => getBook(id)).filter(Boolean);
                    const monthSongs = month.songs.map(id => getSong(id)).filter(Boolean);
                    const otherMonths = MONTH_KEYS.filter(k => k !== key);
                    return (_jsxs("div", { className: "min-h-[180px] rounded-2xl border-2 border-border/40 bg-white/50 dark:bg-zinc-950/50 p-3 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-semibold", children: monthLabels[mi] }), _jsxs(Badge, { variant: "outline", className: "text-[9px] px-1.5", children: [monthBooks.length + monthSongs.length, " items"] })] }), monthBooks.map(book => (_jsxs("div", { className: "flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-zinc-950 border border-border/50 shadow-sm group", children: [_jsx("div", { className: "w-8 h-11 rounded-md overflow-hidden bg-gradient-to-br from-indigo-500/20 shrink-0 flex items-center justify-center shadow-sm", children: book.cover_image_url ? (_jsx("img", { src: book.cover_image_url, alt: book.title, className: "w-full h-full object-cover" })) : (_jsx(BookOpen, { className: "w-4 h-4 text-indigo-400/60" })) }), _jsx("div", { className: "min-w-0 flex-1", children: _jsx("p", { className: "text-[10px] font-medium leading-tight truncate", children: book.title }) }), _jsxs("div", { className: "flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity", children: [otherMonths.map(ok => {
                                                const oi = MONTH_KEYS.indexOf(ok);
                                                const dir = oi > mi ? "right" : "left";
                                                return (_jsx("button", { onClick: () => moveItem(book.id, "book", key, ok), className: "text-[9px] p-0.5 rounded hover:bg-muted transition-colors", title: `Mover a ${monthLabels[oi]}`, children: dir === "right" ? _jsx(ChevronRight, { className: "h-3 w-3" }) : _jsx(ChevronLeft, { className: "h-3 w-3" }) }, ok));
                                            }), _jsx("button", { onClick: () => removeItem(book.id, "book", key), className: "text-[9px] p-0.5 rounded hover:bg-red-100 hover:text-red-500 transition-colors", title: "Quitar", children: _jsx(X, { className: "h-3 w-3" }) })] })] }, book.id))), monthSongs.map(song => (_jsxs("div", { className: "flex items-center gap-1.5 p-1.5 px-2 rounded-lg bg-white dark:bg-zinc-950 border border-border/50 shadow-sm group", children: [song.instrument === "piano" ? _jsx(Piano, { className: "h-3 w-3 text-rose-400 shrink-0" }) : _jsx(Guitar, { className: "h-3 w-3 text-amber-400 shrink-0" }), _jsx("span", { className: "text-[10px] font-medium flex-1 truncate", children: song.title }), _jsxs("div", { className: "flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity", children: [otherMonths.map(ok => {
                                                const oi = MONTH_KEYS.indexOf(ok);
                                                const dir = oi > mi ? "right" : "left";
                                                return (_jsx("button", { onClick: () => moveItem(song.id, "song", key, ok), className: "text-[9px] p-0.5 rounded hover:bg-muted transition-colors", title: `Mover a ${monthLabels[oi]}`, children: dir === "right" ? _jsx(ChevronRight, { className: "h-3 w-3" }) : _jsx(ChevronLeft, { className: "h-3 w-3" }) }, ok));
                                            }), _jsx("button", { onClick: () => removeItem(song.id, "song", key), className: "text-[9px] p-0.5 rounded hover:bg-red-100 hover:text-red-500 transition-colors", title: "Quitar", children: _jsx(X, { className: "h-3 w-3" }) })] })] }, song.id))), monthBooks.length === 0 && monthSongs.length === 0 && (_jsx("div", { className: "flex items-center justify-center h-16", children: _jsx("p", { className: "text-[10px] text-muted-foreground/40", children: "Vac\u00EDo" }) }))] }, key));
                }) }), _jsxs("div", { className: "flex gap-3 text-[10px] text-muted-foreground justify-center", children: [_jsxs("span", { children: ["\uD83D\uDCDA ", allBookIds.length, " libros"] }), _jsxs("span", { children: ["\uD83C\uDFB5 ", allSongIds.length, " canciones"] }), hasUnassigned && _jsxs("span", { className: "text-amber-600 font-medium", children: ["\u26A0\uFE0F ", unassignedBooks.length + unassignedSongs.length, " sin asignar"] })] })] }));
}
