import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
export function AchievementsDisplay() {
    const { achievements, loading, checkAchievements, allDefs } = useAchievements();
    useEffect(() => {
        checkAchievements();
    }, [checkAchievements]);
    if (loading)
        return _jsx(Skeleton, { className: "h-36 w-full" });
    const unlockedKeys = new Set(achievements.map(a => a.achievement_key));
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [_jsx(Trophy, { className: "w-4 h-4 text-yellow-500" }), "Logros (", achievements.length, "/", allDefs.length, ")"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-5 gap-2", children: allDefs.map(def => {
                        const unlocked = unlockedKeys.has(def.key);
                        return (_jsxs("div", { className: `flex flex-col items-center p-1.5 rounded-lg text-center transition-all ${unlocked ? 'bg-primary/10' : 'bg-muted/30 opacity-40 grayscale'}`, title: `${def.title}: ${def.desc}`, children: [_jsx("span", { className: "text-lg", children: def.icon }), _jsx("span", { className: "text-[8px] leading-tight mt-0.5 line-clamp-1", children: def.title })] }, def.key));
                    }) }) })] }));
}
