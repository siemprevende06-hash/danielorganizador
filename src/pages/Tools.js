import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Image as ImageIcon, CheckCircle2, Trash2, Film } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useTextSection } from '@/hooks/useTextSection';
const INITIAL_CARDS = Array.from({ length: 24 }, (_, i) => ({
    id: `card-${i}`,
    checked: false,
}));
export default function ToolsPage() {
    const { data: visionCards, setData: setVisionCards } = useTextSection('idealPartnerVision', INITIAL_CARDS);
    const { uploadImage, uploading } = useImageUpload();
    useEffect(() => {
        if (visionCards.length === 0) {
            setVisionCards(INITIAL_CARDS);
        }
    }, [visionCards.length, setVisionCards]);
    const handleFileUpload = async (cardId, event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        const imageUrl = await uploadImage(file, 'ideal-partner');
        if (imageUrl) {
            setVisionCards(prev => prev.map(card => card.id === cardId
                ? { ...card, image: imageUrl }
                : card));
        }
    };
    const handleRemoveImage = (cardId) => {
        setVisionCards(prev => prev.map(card => card.id === cardId
            ? { ...card, image: undefined }
            : card));
    };
    const handleToggleCheck = (cardId) => {
        setVisionCards(prev => prev.map(card => card.id === cardId
            ? { ...card, checked: !card.checked }
            : card));
    };
    const isGif = (url) => url?.toLowerCase().endsWith('.gif');
    return (_jsxs("div", { className: "container mx-auto px-4 py-24 space-y-6", children: [_jsxs("header", { children: [_jsxs("h1", { className: "text-3xl font-headline font-bold flex items-center gap-2", children: [_jsx(Wrench, { className: "h-8 w-8" }), "Herramientas"] }), _jsx("p", { className: "text-muted-foreground", children: "Visualiza y manifiesta tus deseos" })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center justify-between", children: [_jsx("span", { children: "Mi Mujer Ideal" }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground font-normal", children: [_jsx(ImageIcon, { className: "h-3.5 w-3.5" }), _jsx("span", { children: "Im\u00E1genes" }), _jsx(Film, { className: "h-3.5 w-3.5 ml-1" }), _jsx("span", { children: "GIFs" })] })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4", children: [uploading && (_jsxs("div", { className: "col-span-full text-center py-4 text-muted-foreground", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" }), "Subiendo archivo..."] })), visionCards.map((card) => (_jsxs("div", { className: "relative group", children: [_jsx("label", { htmlFor: `upload-${card.id}`, className: `block aspect-square rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${card.checked
                                                ? 'border-green-500 ring-2 ring-green-500'
                                                : 'border-border hover:border-primary'} ${!card.image ? 'bg-accent' : 'bg-muted'}`, children: card.image ? (_jsx("img", { src: card.image, alt: `Vision ${card.id}`, className: "w-full h-full object-cover" })) : (_jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center gap-1", children: [_jsx(ImageIcon, { className: "h-6 w-6 text-muted-foreground" }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: "IMG / GIF" })] })) }), _jsx("input", { id: `upload-${card.id}`, type: "file", accept: "image/*,.gif", className: "hidden", onChange: (e) => handleFileUpload(card.id, e) }), _jsx("button", { onClick: () => handleToggleCheck(card.id), className: `absolute -top-2 -right-2 rounded-full p-1 z-10 ${card.checked
                                                ? 'bg-green-500 text-white'
                                                : 'bg-background border-2 border-border'}`, children: _jsx(CheckCircle2, { className: "h-4 w-4" }) }), card.image && (_jsx("button", { onClick: () => handleRemoveImage(card.id), className: "absolute -bottom-1 -left-1 rounded-full p-1 bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10", children: _jsx(Trash2, { className: "h-3 w-3" }) })), isGif(card.image) && (_jsx("span", { className: "absolute bottom-1 right-1 bg-background/80 text-[9px] font-bold px-1 rounded text-muted-foreground", children: "GIF" }))] }, card.id)))] }) })] })] }));
}
