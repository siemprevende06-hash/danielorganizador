import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cacheImageNow, precacheImages } from "@/lib/imageCache";
import { storeImageFromFile, removeImageBlob } from "@/lib/imageStore";
import { useTextSection } from "@/hooks/useTextSection";
import { ImagePlus, X, Loader2, Plus, Trash2, ImageIcon } from "lucide-react";
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
export default function AntiVisionPage() {
    const { data: sections, setData: setSections } = useTextSection("antivision-data", []);
    const [uploadingId, setUploadingId] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null);
    const inputRefs = useRef(new Map());
    const { uploadImage } = useImageUpload();
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
    const persist = useCallback((next) => {
        setSections(next);
    }, [setSections]);
    const addSection = () => {
        const rows = 3;
        persist([
            ...sections,
            {
                id: uid(),
                name: `Sección ${sections.length + 1}`,
                rows,
                cards: makeCards(rows),
            },
        ]);
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
        const url = await uploadImage(file, "antivision");
        if (url) {
            cacheImageNow(url);
            storeImageFromFile(url, file);
            persist(sections.map((s) => s.id === sectionId
                ? {
                    ...s,
                    cards: s.cards.map((c) => c.id === cardId ? { ...c, image_url: url } : c),
                }
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
            ? {
                ...s,
                cards: s.cards.map((c) => c.id === cardId ? { ...c, image_url: null } : c),
            }
            : s));
    };
    const setInputRef = (cardId, el) => {
        if (el)
            inputRefs.current.set(cardId, el);
        else
            inputRefs.current.delete(cardId);
    };
    return (_jsx("div", { className: "min-h-screen bg-background p-4 md:p-6 pt-20 pb-24", children: _jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Anti-Visi\u00F3n" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Define tu anti-visi\u00F3n con secciones de im\u00E1genes" })] }), _jsxs(Button, { onClick: addSection, children: [_jsx(Plus, { className: "h-4 w-4 mr-1.5" }), "Nueva Secci\u00F3n"] })] }), sections.length > 0 && (_jsx(Card, { className: "p-2 md:p-3", children: _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx(Button, { variant: selectedSection === null ? "default" : "outline", size: "sm", onClick: () => setSelectedSection(null), children: "Todas" }), sections.map((s) => (_jsx(Button, { variant: selectedSection === s.id ? "default" : "outline", size: "sm", onClick: () => setSelectedSection(s.id), children: s.name }, s.id)))] }) })), sections.length === 0 && (_jsxs(Card, { className: "p-12 text-center", children: [_jsx(ImageIcon, { className: "h-10 w-10 mx-auto mb-3 text-muted-foreground/50" }), _jsx("p", { className: "text-muted-foreground mb-4", children: "No hay secciones a\u00FAn. Crea una para empezar a definir tu anti-visi\u00F3n." }), _jsxs(Button, { onClick: addSection, variant: "outline", children: [_jsx(Plus, { className: "h-4 w-4 mr-1.5" }), "Crear Primera Secci\u00F3n"] })] })), (selectedSection ? sections.filter((s) => s.id === selectedSection) : sections).map((section) => (_jsxs(Card, { className: "p-4 md:p-5 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsx(Input, { value: section.name, onChange: (e) => updateSection(section.id, { name: e.target.value }), className: "h-9 text-base font-semibold max-w-xs", placeholder: "Nombre de la secci\u00F3n" }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx("span", { children: "Filas:" }), _jsxs(Select, { value: String(section.rows), onValueChange: (v) => changeRows(section.id, Number(v)), children: [_jsx(SelectTrigger, { className: "h-8 w-16", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: ROW_OPTIONS.map((n) => (_jsx(SelectItem, { value: String(n), children: n }, n))) })] }), _jsxs("span", { className: "text-xs text-muted-foreground/60", children: ["(", section.rows * 3, " tarjetas)"] })] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 ml-auto text-destructive hover:text-destructive", onClick: () => removeSection(section.id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "grid grid-cols-3 gap-2 md:gap-3", children: section.cards.map((card) => {
                                const isUploading = uploadingId === card.id;
                                return (_jsxs("div", { className: "relative aspect-square rounded-xl overflow-hidden border-2 border-dashed bg-muted/30 group", children: [_jsx("input", { ref: (el) => setInputRef(card.id, el), type: "file", accept: "image/*", className: "hidden", onChange: (e) => {
                                                const f = e.target.files?.[0];
                                                if (f)
                                                    handleFile(section.id, card.id, f);
                                                e.target.value = "";
                                            } }), card.image_url ? (_jsxs(_Fragment, { children: [_jsx(CachedImage, { src: card.image_url, alt: "", className: "w-full h-full object-cover" }), _jsx("button", { onClick: () => clearImage(section.id, card.id), className: "absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10", children: _jsx(X, { className: "h-3 w-3" }) }), _jsx("button", { onClick: () => inputRefs.current.get(card.id)?.click(), className: "absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors", "aria-label": "Cambiar imagen" })] })) : (_jsx("button", { onClick: () => inputRefs.current.get(card.id)?.click(), disabled: isUploading, className: "absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors", children: isUploading ? (_jsx(Loader2, { className: "h-6 w-6 animate-spin" })) : (_jsxs(_Fragment, { children: [_jsx(ImagePlus, { className: "h-7 w-7" }), _jsx("span", { className: "text-[10px] uppercase tracking-wider font-medium", children: "Galer\u00EDa" })] })) }))] }, card.id));
                            }) })] }, section.id)))] }) }));
}
