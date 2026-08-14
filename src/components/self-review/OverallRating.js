import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Star } from "lucide-react";
export function OverallRating({ rating, onRatingChange }) {
    const getRatingLabel = (rating) => {
        if (rating === 0)
            return 'Sin calificar';
        if (rating <= 2)
            return 'Día difícil';
        if (rating <= 4)
            return 'Por debajo del objetivo';
        if (rating <= 6)
            return 'Día normal';
        if (rating <= 8)
            return 'Buen día';
        return 'Día excepcional';
    };
    const getRatingColor = (rating) => {
        if (rating === 0)
            return 'text-muted-foreground';
        if (rating <= 3)
            return 'text-destructive';
        if (rating <= 6)
            return 'text-foreground';
        return 'text-success';
    };
    return (_jsxs("div", { className: "bg-card rounded-lg border border-border p-6", children: [_jsx("h3", { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4 text-center", children: "Calificaci\u00F3n General del D\u00EDa" }), _jsx("div", { className: "flex justify-center gap-2 mb-4", children: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (_jsx("button", { onClick: () => onRatingChange(star), className: "p-1 hover:scale-125 transition-all", children: _jsx(Star, { className: `w-6 h-6 md:w-8 md:h-8 ${rating >= star
                            ? 'fill-foreground text-foreground'
                            : 'text-muted-foreground hover:text-foreground/50'}` }) }, star))) }), _jsxs("div", { className: "text-center", children: [_jsxs("span", { className: `text-4xl font-bold ${getRatingColor(rating)}`, children: [rating, "/10"] }), _jsx("p", { className: `text-sm mt-1 ${getRatingColor(rating)}`, children: getRatingLabel(rating) })] }), rating > 0 && (_jsx("div", { className: "mt-4 pt-4 border-t border-border text-center", children: _jsx("p", { className: "text-xs text-muted-foreground", children: rating >= 7
                        ? '¡Sigue así! Mantén este ritmo.'
                        : rating >= 5
                            ? 'Día aceptable. Busca mejorar mañana.'
                            : 'Analiza qué falló y haz ajustes.' }) }))] }));
}
