import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent } from '@/components/ui/card';
export function LanguageTipCard({ currentLanguage }) {
    return (_jsx(Card, { className: "bg-primary/5 border-primary/20", children: _jsx(CardContent, { className: "p-3 sm:p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("span", { className: "text-xl sm:text-2xl", children: "\uD83D\uDCA1" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-xs sm:text-sm", children: "Consejo" }), _jsx("p", { className: "text-xs sm:text-sm text-muted-foreground", children: currentLanguage === 'english'
                                    ? 'Try thinking in English during daily activities. Label objects around you!'
                                    : 'Prova a pensare in italiano! Etichetta gli oggetti intorno a te.' })] })] }) }) }));
}
