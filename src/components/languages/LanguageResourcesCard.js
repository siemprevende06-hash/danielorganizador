import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
export function LanguageResourcesCard() {
    const resources = [
        { name: 'Duolingo', url: 'https://www.duolingo.com/', icon: '🟢' },
        { name: 'Anki Flashcards', url: 'https://apps.ankiweb.net/', icon: '📚' },
        { name: 'YouTube Immersion', url: 'https://www.youtube.com/', icon: '🎬' },
        { name: 'ChatGPT Speaking', url: 'https://chat.openai.com/', icon: '🤖' },
        { name: 'Netflix + Subtítulos', url: 'https://www.netflix.com/', icon: '🎥' },
    ];
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-base sm:text-lg", children: "\uD83D\uDD17 Recursos R\u00E1pidos" }) }), _jsx(CardContent, { className: "space-y-2", children: resources.map(resource => (_jsxs("button", { onClick: () => window.open(resource.url, '_blank'), className: "w-full flex items-center gap-3 p-2 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left", children: [_jsx("span", { className: "text-base sm:text-lg", children: resource.icon }), _jsx("span", { className: "text-xs sm:text-sm font-medium", children: resource.name }), _jsx(ExternalLink, { className: "w-3 h-3 ml-auto text-muted-foreground" })] }, resource.name))) })] }));
}
