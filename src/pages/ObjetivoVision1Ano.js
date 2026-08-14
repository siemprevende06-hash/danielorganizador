import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cacheImageNow, precacheImages } from "@/lib/imageCache";
import { storeImageFromFile, removeImageBlob } from "@/lib/imageStore";
import { useTextSection } from "@/hooks/useTextSection";
import { ImagePlus, X, Loader2, Plus, Trash2, ImageIcon, ChevronDown, ChevronUp, StickyNote, Maximize2 } from "lucide-react";
import { ImageLightbox } from "@/components/ImageLightbox";
import { CachedImage } from "@/components/CachedImage";
import { toast } from "sonner";
function uid() {
    return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
function makeCards(rows) {
    return Array.from({ length: rows * 3 }, (_, i) => ({
        id: uid(),
        position: i,
        image_url: null,
    }));
}
const ROW_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10];
const START_DATE = new Date(2026, 6, 16);
const END_DATE = new Date(2027, 6, 16);
const TOTAL_DAYS = 365;
function getDayNumber(today) {
    const diff = today.getTime() - START_DATE.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(0, Math.min(days, TOTAL_DAYS));
}
function getMonthsInRange() {
    const months = [];
    const start = new Date(START_DATE.getFullYear(), START_DATE.getMonth(), 1);
    const end = new Date(END_DATE.getFullYear(), END_DATE.getMonth() + 1, 0);
    let current = new Date(start);
    while (current <= end) {
        const year = current.getFullYear();
        const month = current.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        months.push({ year, month, days: lastDay });
        current = new Date(year, month + 1, 1);
    }
    return months;
}
const MONTH_NAMES_SHORT = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];
export default function ObjetivoVision1Ano() {
    const { data: sections, setData: setSections, loading, saving, saveNow } = useTextSection("objetivo-vision-data", []);
    const [uploadingId, setUploadingId] = useState(null);
    const { data: notesText, setData: setNotesText } = useTextSection("objetivo-vision-notas", "");
    const [selectedSection, setSelectedSection] = useState(null);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const [today, setToday] = useState(new Date());
    const [showAllMonths, setShowAllMonths] = useState(false);
    const notesTimerRef = useRef();
    const inputRefs = useRef(new Map());
    const { uploadImage } = useImageUpload();
    useEffect(() => {
        const interval = setInterval(() => setToday(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        const urls = sections.flatMap((s) => s.cards.map((c) => c.image_url));
        precacheImages(urls);
    }, [sections]);
    useEffect(() => {
        const urls = sections.flatMap((s) => s.cards.map((c) => c.image_url));
        const valid = urls.filter(Boolean);
        if (valid.length === 0)
            return;
        Promise.allSettled(valid.map(async (url) => {
            const { getImageBlob } = await import("@/lib/imageStore");
            const existing = await getImageBlob(url);
            if (existing)
                return;
            try {
                const response = await fetch(url, { mode: "cors" });
                if (response.ok) {
                    const blob = await response.blob();
                    const { storeImageBlob } = await import("@/lib/imageStore");
                    await storeImageBlob(url, blob);
                }
            }
            catch { }
        }));
    }, [sections]);
    const dayNumber = useMemo(() => getDayNumber(today), [today]);
    const progress = (dayNumber / TOTAL_DAYS) * 100;
    const months = useMemo(() => getMonthsInRange(), []);
    const currentMonthIndex = useMemo(() => {
        const cm = today.getMonth();
        const cy = today.getFullYear();
        return months.findIndex((m) => m.year === cy && m.month === cm);
    }, [today, months]);
    const visibleMonths = showAllMonths
        ? months
        : months.filter((_, i) => i === currentMonthIndex);
    const handleNotesChange = (val) => {
        if (notesTimerRef.current)
            clearTimeout(notesTimerRef.current);
        notesTimerRef.current = setTimeout(() => setNotesText(val), 800);
    };
    const persist = useCallback((next) => {
        setSections(next);
    }, [setSections]);
    const addSection = () => {
        const rows = 3;
        persist([...sections, { id: uid(), name: `Sección ${sections.length + 1}`, rows, cards: makeCards(rows) }]);
    };
    const updateSection = (id, patch) => {
        persist(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    };
    const removeSection = (id) => {
        persist(sections.filter((s) => s.id !== id));
        toast.success("Sección eliminada");
    };
    const changeRows = (sectionId, newRows) => {
        const section = sections.find((s) => s.id === sectionId);
        if (!section)
            return;
        const oldTotal = section.rows * 3;
        const newTotal = newRows * 3;
        let cards = [...section.cards];
        if (newTotal > oldTotal) {
            for (let i = oldTotal; i < newTotal; i++) {
                cards.push({ id: uid(), position: i, image_url: null });
            }
        }
        else if (newTotal < oldTotal) {
            cards = cards.slice(0, newTotal);
        }
        updateSection(sectionId, { rows: newRows, cards });
    };
    const handleFile = async (sectionId, cardId, file) => {
        setUploadingId(cardId);
        const url = await uploadImage(file, "objetivo-vision");
        if (url) {
            cacheImageNow(url);
            storeImageFromFile(url, file);
            persist(sections.map((s) => s.id === sectionId
                ? { ...s, cards: s.cards.map((c) => (c.id === cardId ? { ...c, image_url: url } : c)) }
                : s));
        }
        setUploadingId(null);
    };
    const clearImage = (sectionId, cardId) => {
        const card = sections.find(s => s.id === sectionId)?.cards.find(c => c.id === cardId);
        if (card?.image_url) {
            removeImageBlob(card.image_url);
        }
        persist(sections.map((s) => s.id === sectionId
            ? { ...s, cards: s.cards.map((c) => (c.id === cardId ? { ...c, image_url: null } : c)) }
            : s));
    };
    const setInputRef = (cardId, el) => {
        if (el)
            inputRefs.current.set(cardId, el);
        else
            inputRefs.current.delete(cardId);
    };
    const isDayInRange = (year, month, day) => {
        const date = new Date(year, month, day);
        return date >= START_DATE && date <= END_DATE;
    };
    const isDayTicked = (year, month, day) => {
        const date = new Date(year, month, day);
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return isDayInRange(year, month, day) && date < todayStart;
    };
    const isTodayDay = (year, month, day) => {
        return year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
    };
    const formatDate = (date) => {
        return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-background p-4 md:p-6 pt-20 pb-24 flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-background p-4 md:p-6 pt-20 pb-24", children: [_jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Objetivo Visi\u00F3n 1 A\u00F1o" }), _jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [formatDate(START_DATE), " \u2192 ", formatDate(END_DATE), " \u00B7 365 d\u00EDas de visi\u00F3n"] })] }), _jsxs(Card, { className: "p-6", children: [_jsxs("div", { className: "text-center mb-4", children: [_jsx("span", { className: "text-5xl font-bold tracking-tight", children: dayNumber > 0 && dayNumber <= TOTAL_DAYS ? dayNumber : 0 }), _jsxs("span", { className: "text-xl text-muted-foreground ml-2", children: ["/ ", TOTAL_DAYS] })] }), _jsx("div", { className: "text-center text-sm text-muted-foreground mb-4", children: dayNumber >= TOTAL_DAYS
                                    ? "¡Objetivo cumplido!"
                                    : dayNumber <= 0
                                        ? "Aún no comienza"
                                        : `Día ${dayNumber} de 365` }), _jsx("div", { className: "w-full h-3 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-primary rounded-full transition-all duration-500", style: { width: `${Math.min(Math.max(progress, 0), 100)}%` } }) })] }), _jsxs(Card, { className: "p-4 md:p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Progreso Mensual" }), _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => setShowAllMonths(!showAllMonths), className: "text-xs gap-1", children: [showAllMonths ? "Ver menos" : "Ver todos", showAllMonths ? _jsx(ChevronUp, { className: "h-3 w-3" }) : _jsx(ChevronDown, { className: "h-3 w-3" })] })] }), _jsx("div", { className: "space-y-3", children: visibleMonths.map(({ year, month, days }) => {
                                    const firstDay = new Date(year, month, 1).getDay();
                                    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
                                    const hasToday = isTodayDay(year, month, new Date().getDate());
                                    return (_jsxs("div", { className: "border rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsxs("h3", { className: "text-sm font-semibold", children: [MONTH_NAMES_SHORT[month], " ", year] }), hasToday && (_jsx("span", { className: "text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium", children: "Hoy" }))] }), _jsxs("div", { className: "grid grid-cols-7 gap-[2px]", children: [["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (_jsx("div", { className: "text-center text-[9px] text-muted-foreground/40 font-semibold pb-1", children: d }, i))), Array.from({ length: startOffset }).map((_, i) => (_jsx("div", {}, `e-${i}`))), Array.from({ length: days }, (_, i) => {
                                                        const day = i + 1;
                                                        const inRange = isDayInRange(year, month, day);
                                                        const ticked = isDayTicked(year, month, day);
                                                        const isTodayDayFlag = isTodayDay(year, month, day);
                                                        if (!inRange) {
                                                            return _jsx("div", {}, day);
                                                        }
                                                        return (_jsx("div", { className: `
                            aspect-square rounded-sm flex items-center justify-center text-[11px] font-medium
                            transition-colors select-none
                            ${ticked
                                                                ? "bg-green-500/25 text-green-700 dark:text-green-300 border border-green-500/20"
                                                                : isTodayDayFlag
                                                                    ? "bg-primary/15 text-primary border border-primary/30 font-bold"
                                                                    : "bg-muted/40 text-muted-foreground/70"}
                            ${isTodayDayFlag ? "ring-1 ring-primary" : ""}
                          `, children: day }, day));
                                                    })] })] }, `${year}-${month}`));
                                }) })] }), _jsxs(Card, { className: "p-4 md:p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(StickyNote, { className: "h-5 w-5 text-muted-foreground" }), _jsx("h2", { className: "text-lg font-semibold", children: "Notas y Reflexiones" })] }), _jsx(Textarea, { defaultValue: notesText, onChange: (e) => handleNotesChange(e.target.value), placeholder: "Escribe tus notas, reflexiones y aprendizajes durante este a\u00F1o de visi\u00F3n...", className: "min-h-[150px] resize-y text-sm leading-relaxed" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold", children: "Tablero de Visi\u00F3n" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Im\u00E1genes que representan tu objetivo a 1 a\u00F1o" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { variant: "outline", onClick: saveNow, disabled: saving, children: [saving ? (_jsx(Loader2, { className: "h-4 w-4 mr-1.5 animate-spin" })) : (_jsx(ImagePlus, { className: "h-4 w-4 mr-1.5" })), "Guardar"] }), _jsxs(Button, { onClick: addSection, children: [_jsx(Plus, { className: "h-4 w-4 mr-1.5" }), "Nueva Secci\u00F3n"] })] })] }), sections.length > 0 && (_jsx(Card, { className: "p-2 md:p-3", children: _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx(Button, { variant: selectedSection === null ? "default" : "outline", size: "sm", onClick: () => setSelectedSection(null), children: "Todas" }), sections.map((s) => (_jsx(Button, { variant: selectedSection === s.id ? "default" : "outline", size: "sm", onClick: () => setSelectedSection(s.id), children: s.name }, s.id)))] }) })), sections.length === 0 && (_jsxs(Card, { className: "p-12 text-center", children: [_jsx(ImageIcon, { className: "h-10 w-10 mx-auto mb-3 text-muted-foreground/50" }), _jsx("p", { className: "text-muted-foreground mb-4", children: "No hay secciones a\u00FAn. Crea una para empezar a a\u00F1adir im\u00E1genes de visi\u00F3n." }), _jsxs(Button, { onClick: addSection, variant: "outline", children: [_jsx(Plus, { className: "h-4 w-4 mr-1.5" }), "Crear Primera Secci\u00F3n"] })] })), (selectedSection ? sections.filter((s) => s.id === selectedSection) : sections).map((section) => (_jsxs(Card, { className: "p-4 md:p-5 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsx(Input, { value: section.name, onChange: (e) => updateSection(section.id, { name: e.target.value }), className: "h-9 text-base font-semibold max-w-xs", placeholder: "Nombre de la secci\u00F3n" }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx("span", { children: "Filas:" }), _jsxs(Select, { value: String(section.rows), onValueChange: (v) => changeRows(section.id, Number(v)), children: [_jsx(SelectTrigger, { className: "h-8 w-16", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: ROW_OPTIONS.map((n) => (_jsx(SelectItem, { value: String(n), children: n }, n))) })] }), _jsxs("span", { className: "text-xs text-muted-foreground/60", children: ["(", section.rows * 3, " tarjetas)"] })] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 ml-auto text-destructive hover:text-destructive", onClick: () => removeSection(section.id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "grid grid-cols-3 gap-2 md:gap-3", children: section.cards.map((card) => {
                                    const isUploading = uploadingId === card.id;
                                    return (_jsxs("div", { className: "relative aspect-square rounded-xl overflow-hidden border-2 border-dashed bg-muted/30 group", children: [_jsx("input", { ref: (el) => setInputRef(card.id, el), type: "file", accept: "image/*", className: "hidden", onChange: (e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f)
                                                        handleFile(section.id, card.id, f);
                                                    e.target.value = "";
                                                } }), card.image_url ? (_jsxs(_Fragment, { children: [_jsx(CachedImage, { src: card.image_url, alt: "", className: "w-full h-full object-cover" }), _jsx("button", { onClick: () => clearImage(section.id, card.id), className: "absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20", children: _jsx(X, { className: "h-3 w-3" }) }), _jsx("button", { onClick: () => setLightboxSrc(card.image_url), className: "absolute top-1.5 left-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20", "aria-label": "Ampliar imagen", children: _jsx(Maximize2, { className: "h-3 w-3" }) }), _jsx("button", { onClick: () => inputRefs.current.get(card.id)?.click(), className: "absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors z-10", "aria-label": "Cambiar imagen" })] })) : (_jsx("button", { onClick: () => inputRefs.current.get(card.id)?.click(), disabled: isUploading, className: "absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors", children: isUploading ? (_jsx(Loader2, { className: "h-6 w-6 animate-spin" })) : (_jsxs(_Fragment, { children: [_jsx(ImagePlus, { className: "h-7 w-7" }), _jsx("span", { className: "text-[10px] uppercase tracking-wider font-medium", children: "Galer\u00EDa" })] })) }))] }, card.id));
                                }) })] }, section.id)))] }), _jsx(ImageLightbox, { src: lightboxSrc, onClose: () => setLightboxSrc(null) })] }));
}
