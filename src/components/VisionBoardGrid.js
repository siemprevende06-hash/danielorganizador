import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';
import { useVisionBoard } from '@/hooks/useVisionBoard';
import { useImageUpload } from '@/hooks/useImageUpload';
export const VisionBoardGrid = () => {
    const { cards, isLoading, updateCard } = useVisionBoard('main');
    const { uploadImage, uploading } = useImageUpload();
    const fileInputRefs = useRef({});
    const handleImageUpload = async (cardId, file) => {
        const imageUrl = await uploadImage(file);
        if (imageUrl) {
            updateCard(cardId, { image: imageUrl });
        }
    };
    const handleCheckChange = (cardId, checked) => {
        updateCard(cardId, { checked });
    };
    if (isLoading) {
        return (_jsx("div", { className: "grid grid-cols-6 gap-4", children: Array.from({ length: 18 }).map((_, i) => (_jsx(Card, { className: "aspect-square animate-pulse bg-muted" }, i))) }));
    }
    return (_jsx("div", { className: "grid grid-cols-6 gap-4", children: cards.map((card) => (_jsxs(Card, { className: cn("relative aspect-square overflow-hidden transition-all cursor-pointer hover:shadow-lg", card.checked && "border-2 border-green-500 ring-2 ring-green-500/20"), onClick: () => {
                if (!card.image) {
                    fileInputRefs.current[card.id]?.click();
                }
            }, children: [_jsx("input", { ref: (el) => (fileInputRefs.current[card.id] = el), type: "file", accept: "image/*", className: "hidden", onChange: (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            handleImageUpload(card.id, file);
                        }
                    } }), card.image ? (_jsxs(_Fragment, { children: [_jsx("img", { src: card.image, alt: "Vision", className: "w-full h-full object-cover" }), _jsx("div", { className: "absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded p-1", children: _jsx(Checkbox, { checked: card.checked, onCheckedChange: (checked) => handleCheckChange(card.id, checked), onClick: (e) => e.stopPropagation() }) })] })) : (_jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center text-muted-foreground", children: [_jsx(Upload, { className: "h-8 w-8 mb-2" }), _jsx("span", { className: "text-xs", children: uploading ? 'Subiendo...' : 'Subir imagen' })] }))] }, card.id))) }));
};
