import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
const LANGUAGES = [
    {
        id: 'english',
        name: 'English',
        flag: '🇬🇧',
        nativeName: 'Inglés',
    },
    {
        id: 'italian',
        name: 'Italiano',
        flag: '🇮🇹',
        nativeName: 'Italiano',
    },
];
const LEVEL_LABELS = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
};
export const LanguageSelector = ({ currentLanguage, onLanguageChange, englishLevel = 'intermediate', italianLevel = 'beginner', compact = false, }) => {
    const getLevel = (langId) => {
        return langId === 'english' ? englishLevel : italianLevel;
    };
    if (compact) {
        return (_jsx("div", { className: "flex gap-2", children: LANGUAGES.map((lang) => (_jsxs("button", { onClick: () => onLanguageChange(lang.id), className: cn("flex items-center gap-2 px-3 py-2 rounded-lg border transition-all", currentLanguage === lang.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-accent border-border"), children: [_jsx("span", { className: "text-xl", children: lang.flag }), _jsx("span", { className: "font-medium text-sm", children: lang.name })] }, lang.id))) }));
    }
    return (_jsx("div", { className: "grid grid-cols-2 gap-3", children: LANGUAGES.map((lang) => {
            const isSelected = currentLanguage === lang.id;
            const level = getLevel(lang.id);
            return (_jsx(Card, { onClick: () => onLanguageChange(lang.id), className: cn("p-4 cursor-pointer transition-all hover:scale-[1.02]", isSelected
                    ? "ring-2 ring-primary bg-primary/5 border-primary"
                    : "hover:bg-accent"), children: _jsxs("div", { className: "text-center space-y-2", children: [_jsx("span", { className: "text-4xl block", children: lang.flag }), _jsx("h3", { className: "font-semibold text-lg", children: lang.name }), _jsx(Badge, { variant: isSelected ? "default" : "secondary", className: "text-xs", children: LEVEL_LABELS[level] || level }), isSelected && (_jsx("p", { className: "text-xs text-primary font-medium", children: "\u2713 Seleccionado" }))] }) }, lang.id));
        }) }));
};
