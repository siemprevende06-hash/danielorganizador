import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Target, TrendingUp } from 'lucide-react';
export function ScoreSummary({ effortScore, resultScore, overallRating, effortCount, resultCount, onRatingChange }) {
    const combinedScore = effortScore !== null && resultScore !== null
        ? Math.round((effortScore + resultScore) / 2)
        : effortScore ?? resultScore ?? null;
    const getScoreColor = (score) => {
        if (score === null)
            return 'text-muted-foreground';
        if (score >= 80)
            return 'text-green-600';
        if (score >= 60)
            return 'text-yellow-600';
        return 'text-destructive';
    };
    const getScoreBg = (score) => {
        if (score === null)
            return 'bg-muted/50';
        if (score >= 80)
            return 'bg-green-500/10';
        if (score >= 60)
            return 'bg-yellow-500/10';
        return 'bg-destructive/10';
    };
    return (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3", children: [_jsx(Card, { className: getScoreBg(effortScore), children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsx(Flame, { className: "h-6 w-6 mx-auto text-orange-500 mb-1" }), _jsx("p", { className: `text-3xl font-bold ${getScoreColor(effortScore)}`, children: effortScore !== null ? `${Math.round(effortScore)}%` : '—' }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Esfuerzo" }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: [effortCount, " objetivos"] })] }) }), _jsx(Card, { className: getScoreBg(resultScore), children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsx(Target, { className: "h-6 w-6 mx-auto text-primary mb-1" }), _jsx("p", { className: `text-3xl font-bold ${getScoreColor(resultScore)}`, children: resultScore !== null ? `${Math.round(resultScore)}%` : '—' }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Resultados" }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: [resultCount, " objetivos"] })] }) }), _jsx(Card, { className: "border-primary/20", children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsx(TrendingUp, { className: "h-6 w-6 mx-auto text-primary mb-1" }), _jsx("p", { className: `text-3xl font-bold ${getScoreColor(combinedScore)}`, children: combinedScore !== null ? `${combinedScore}%` : '—' }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Puntuaci\u00F3n Total" }), _jsx("div", { className: "flex justify-center gap-0.5 mt-2", children: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (_jsx("button", { onClick: () => onRatingChange(n), className: `w-5 h-5 rounded-full text-[10px] font-bold transition-all ${overallRating !== null && n <= overallRating
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20'}`, children: n }, n))) })] }) })] }));
}
