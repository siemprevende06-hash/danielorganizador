import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSelector } from './LanguageSelector';
import { LanguageSubTasks } from './LanguageSubTasks';
import { useLanguageLearning } from '@/hooks/useLanguageLearning';
import { Loader2 } from 'lucide-react';
export const LanguageBlockManager = ({ blockDurationMinutes, startTime, endTime, }) => {
    const { settings, isLoading, currentLanguage, setLanguage, getSubTasksForDuration, toggleSubTask, getProgress, } = useLanguageLearning();
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-8", children: _jsx(Loader2, { className: "h-6 w-6 animate-spin text-muted-foreground" }) }));
    }
    const blockType = blockDurationMinutes >= 60 ? 'morning' : 'afternoon';
    const subTasks = getSubTasksForDuration(blockDurationMinutes);
    const progress = getProgress();
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-sm font-medium text-muted-foreground", children: "Idioma del d\u00EDa" }), _jsx(LanguageSelector, { currentLanguage: currentLanguage, onLanguageChange: setLanguage, englishLevel: settings?.englishLevel, italianLevel: settings?.italianLevel })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("h4", { className: "text-sm font-medium text-muted-foreground", children: ["Actividades (", startTime, " - ", endTime, ")"] }), _jsx(LanguageSubTasks, { subTasks: subTasks, onToggleTask: toggleSubTask, blockType: blockType, currentLanguage: currentLanguage })] })] }));
};
// Componente compacto para usar en DayPlanner
export const LanguageDaySelector = ({ onLanguageChange }) => {
    const { currentLanguage, setLanguage, settings, isLoading } = useLanguageLearning();
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center py-4", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) }));
    }
    const handleChange = async (lang) => {
        await setLanguage(lang);
        onLanguageChange?.(lang);
    };
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsx(CardTitle, { className: "text-base flex items-center gap-2", children: "\uD83C\uDF0D Idioma del D\u00EDa" }) }), _jsxs(CardContent, { children: [_jsx(LanguageSelector, { currentLanguage: currentLanguage, onLanguageChange: handleChange, englishLevel: settings?.englishLevel, italianLevel: settings?.italianLevel, compact: true }), _jsx("p", { className: "text-xs text-muted-foreground mt-3", children: currentLanguage === 'english'
                            ? 'Inglés: Vocabulario, gramática, conversación, lectura y escucha'
                            : 'Italiano: Vocabulario, gramática, conversación, lectura y escucha' })] })] }));
};
