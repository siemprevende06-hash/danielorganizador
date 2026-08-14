import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cacheImageNow, precacheImages } from "@/lib/imageCache";
import { storeImageFromFile, removeImageBlob } from "@/lib/imageStore";
import { useTextSection } from "@/hooks/useTextSection";
import { cn } from "@/lib/utils";
import { ImagePlus, X, Loader2, Plus, Trash2, ImageIcon, Maximize2 } from "lucide-react";
import { ImageLightbox } from "@/components/ImageLightbox";
import { CachedImage } from "@/components/CachedImage";
import { toast } from "sonner";
function uid() {
    return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
function makeTriple() {
    return {
        vision: Array.from({ length: 3 }, (_, i) => ({
            id: uid(),
            position: i,
            image_url: null,
        })),
        reality: Array.from({ length: 3 }, (_, i) => ({
            id: uid(),
            position: i,
            image_url: null,
        })),
    };
}
export default function VisionVsRealidad() {
    const { data: sections, setData: setSections, loading, saving, saveNow } = useTextSection("vision-vs-realidad-data", []);
    const [uploadingId, setUploadingId] = useState(null);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const inputRefs = useRef(new Map());
    const { uploadImage } = useImageUpload();
    useEffect(() => {
        const urls = sections.flatMap((s) => [...s.vision, ...s.reality].map((c) => c.image_url));
        precacheImages(urls);
    }, [sections]);
    useEffect(() => {
        const urls = sections.flatMap((s) => [...s.vision, ...s.reality].map((c) => c.image_url));
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
        persist([
            ...sections,
            {
                id: uid(),
                name: `Sección ${sections.length + 1}`,
                ...makeTriple(),
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
    const handleFile = async (sectionId, cardId, side, file) => {
        setUploadingId(cardId);
        const folder = side === "vision" ? "vision" : "realidad";
        const url = await uploadImage(file, folder);
        if (url) {
            cacheImageNow(url);
            storeImageFromFile(url, file);
            persist(sections.map((s) => s.id === sectionId
                ? {
                    ...s,
                    [side]: s[side].map((c) => c.id === cardId ? { ...c, image_url: url } : c),
                }
                : s));
        }
        setUploadingId(null);
    };
    const clearImage = (sectionId, cardId, side) => {
        const card = sections.find(s => s.id === sectionId)?.[side].find(c => c.id === cardId);
        if (card?.image_url) {
            removeImageBlob(card.image_url);
        }
        persist(sections.map((s) => s.id === sectionId
            ? {
                ...s,
                [side]: s[side].map((c) => c.id === cardId ? { ...c, image_url: null } : c),
            }
            : s));
    };
    const setInputRef = (cardId, el) => {
        if (el)
            inputRefs.current.set(cardId, el);
        else
            inputRefs.current.delete(cardId);
    };
    const renderCardGrid = (section, side) => {
        const cards = section[side];
        const label = side === "vision" ? "Visión" : "Realidad Actual";
        return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: cn("h-3 w-3 rounded-full shrink-0", side === "vision" ? "bg-blue-500" : "bg-amber-500") }), _jsx("h3", { className: "text-sm font-semibold", children: label })] }), _jsx("div", { className: "grid grid-cols-3 gap-2 md:gap-3", children: cards.map((card) => {
                        const isUploading = uploadingId === card.id;
                        return (_jsxs("div", { className: "relative aspect-square rounded-xl overflow-hidden border-2 border-dashed bg-muted/30 group", children: [_jsx("input", { ref: (el) => setInputRef(card.id, el), type: "file", accept: "image/*,.gif,.mp4,.webm,.mov", className: "hidden", onChange: (e) => {
                                        const f = e.target.files?.[0];
                                        if (f)
                                            handleFile(section.id, card.id, side, f);
                                        e.target.value = "";
                                    } }), card.image_url ? (_jsxs(_Fragment, { children: [_jsx(CachedImage, { src: card.image_url, alt: "", className: "w-full h-full object-cover" }), _jsx("button", { onClick: () => clearImage(section.id, card.id, side), className: "absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20", children: _jsx(X, { className: "h-3 w-3" }) }), _jsx("button", { onClick: () => setLightboxSrc(card.image_url), className: "absolute top-1.5 left-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20", "aria-label": "Ampliar imagen", children: _jsx(Maximize2, { className: "h-3 w-3" }) }), _jsx("button", { onClick: () => inputRefs.current.get(card.id)?.click(), className: "absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors z-10", "aria-label": "Cambiar imagen" })] })) : (_jsx("button", { onClick: () => inputRefs.current.get(card.id)?.click(), disabled: isUploading, className: "absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors", children: isUploading ? (_jsx(Loader2, { className: "h-6 w-6 animate-spin" })) : (_jsxs(_Fragment, { children: [_jsx(ImagePlus, { className: "h-7 w-7" }), _jsx("span", { className: "text-[10px] uppercase tracking-wider font-medium", children: side === "vision" ? "Visión" : "Realidad" })] })) }))] }, card.id));
                    }) })] }));
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-background p-4 md:p-6 pt-20 pb-24 flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-background p-4 md:p-6 pt-20 pb-24", children: [_jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Visi\u00F3n vs Realidad" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Confronta tu visi\u00F3n con tu realidad actual hasta que sean la misma" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { variant: "outline", onClick: saveNow, disabled: saving, children: [saving ? (_jsx(Loader2, { className: "h-4 w-4 mr-1.5 animate-spin" })) : (_jsx(ImagePlus, { className: "h-4 w-4 mr-1.5" })), "Guardar"] }), _jsxs(Button, { onClick: addSection, children: [_jsx(Plus, { className: "h-4 w-4 mr-1.5" }), "Nueva Secci\u00F3n"] })] })] }), sections.length === 0 && (_jsxs(Card, { className: "p-12 text-center", children: [_jsx(ImageIcon, { className: "h-10 w-10 mx-auto mb-3 text-muted-foreground/50" }), _jsx("p", { className: "text-muted-foreground mb-4", children: "No hay secciones a\u00FAn. Crea una para empezar a confrontar tu visi\u00F3n con tu realidad." }), _jsxs(Button, { onClick: addSection, variant: "outline", children: [_jsx(Plus, { className: "h-4 w-4 mr-1.5" }), "Crear Primera Secci\u00F3n"] })] })), sections.map((section) => (_jsxs(Card, { className: "p-4 md:p-5 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsx(Input, { value: section.name, onChange: (e) => updateSection(section.id, { name: e.target.value }), className: "h-9 text-base font-semibold max-w-xs", placeholder: "Nombre de la secci\u00F3n" }), _jsx("span", { className: "text-xs text-muted-foreground/60 ml-auto", children: "3 tarjetas por columna" }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-destructive hover:text-destructive", onClick: () => removeSection(section.id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6", children: [_jsx("div", { className: "space-y-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10", children: renderCardGrid(section, "vision") }), _jsx("div", { className: "space-y-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10", children: renderCardGrid(section, "reality") })] })] }, section.id)))] }), _jsx(ImageLightbox, { src: lightboxSrc, onClose: () => setLightboxSrc(null) })] }));
}
