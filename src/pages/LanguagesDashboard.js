import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguageLearning } from '@/hooks/useLanguageLearning';
import { useLanguageWeeklyStats } from '@/hooks/useLanguageWeeklyStats';
import { LanguageHeader } from '@/components/languages/LanguageHeader';
import { LanguageQuickStats } from '@/components/languages/LanguageQuickStats';
import { LanguageSkillsChecklist } from '@/components/languages/LanguageSkillsChecklist';
import { LanguagePracticeTimerCard } from '@/components/languages/LanguagePracticeTimerCard';
import { LanguageResourcesCard } from '@/components/languages/LanguageResourcesCard';
import { LanguageStatsTab } from '@/components/languages/LanguageStatsTab';
import { LanguageTipCard } from '@/components/languages/LanguageTipCard';
import { LANGUAGE_SKILLS } from '@/components/languages/skills';
export default function LanguagesDashboard() {
    const { settings, todaySession, isLoading, currentLanguage, setLanguage, getSubTasksForDuration, toggleSubTask, getProgress, logPracticeMinutes } = useLanguageLearning();
    const { weeklyData, streak, loading: weeklyLoading } = useLanguageWeeklyStats(currentLanguage);
    const [activeTab, setActiveTab] = useState('today');
    const [timerActive, setTimerActive] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [activeSkill, setActiveSkill] = useState('vocabulary');
    const intervalRef = useRef(null);
    const weeklyGoal = 300;
    const dailyGoal = 45;
    const todayMinutes = todaySession?.totalDuration || 0;
    const progress = getProgress();
    const subTasks = getSubTasksForDuration(90);
    const weeklyTotal = useMemo(() => weeklyData.reduce((sum, d) => sum + d.minutes, 0), [weeklyData]);
    const weeklyPercent = Math.min((weeklyTotal / weeklyGoal) * 100, 100);
    const pieData = useMemo(() => [
        { name: 'Completadas', value: progress.completed, color: 'hsl(var(--success))' },
        { name: 'Pendientes', value: progress.total - progress.completed, color: 'hsl(var(--muted))' },
    ].filter(d => d.value > 0), [progress]);
    useEffect(() => {
        if (timerActive) {
            intervalRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
        }
        else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current)
                clearInterval(intervalRef.current);
        };
    }, [timerActive]);
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    const startTimer = () => {
        setTimerSeconds(0);
        setTimerActive(true);
    };
    const completeTimer = async () => {
        setTimerActive(false);
        const minutes = Math.ceil(timerSeconds / 60);
        if (minutes > 0) {
            await logPracticeMinutes(activeSkill, minutes, 'morning');
        }
        setTimerSeconds(0);
    };
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-background p-4 pt-20 pb-24", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-4", children: [_jsx(Skeleton, { className: "h-8 w-1/3" }), _jsx(Skeleton, { className: "h-64 w-full" })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-background p-4 pt-20 pb-24", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsx(LanguageHeader, { currentLanguage: currentLanguage, onSetLanguage: setLanguage, streak: streak }), _jsx(LanguageQuickStats, { progress: progress, todayMinutes: todayMinutes, dailyGoal: dailyGoal, weeklyTotal: weeklyTotal, weeklyPercent: weeklyPercent }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "today", className: "text-xs sm:text-sm", children: "\uD83D\uDCDD Hoy" }), _jsx(TabsTrigger, { value: "practice", className: "text-xs sm:text-sm", children: "\u23F1\uFE0F Pr\u00E1ctica" }), _jsx(TabsTrigger, { value: "stats", className: "text-xs sm:text-sm", children: "\uD83D\uDCCA Stats" })] }), _jsxs(TabsContent, { value: "today", className: "space-y-4", children: [_jsx(LanguageSkillsChecklist, { skills: LANGUAGE_SKILLS, subTasks: subTasks, activeSkillId: timerActive ? activeSkill : null, onToggle: (id) => toggleSubTask(id, 'morning'), onStartTimer: (id) => {
                                        setActiveSkill(id);
                                        setActiveTab('practice');
                                        setTimerSeconds(0);
                                        setTimerActive(true);
                                    } }), _jsx(LanguageTipCard, { currentLanguage: currentLanguage })] }), _jsxs(TabsContent, { value: "practice", className: "space-y-4", children: [_jsx(LanguagePracticeTimerCard, { skills: LANGUAGE_SKILLS, timerActive: timerActive, timerSeconds: timerSeconds, selectedSkill: activeSkill, onSelectSkill: setActiveSkill, onStart: startTimer, onComplete: completeTimer, formatTime: formatTime }), _jsx(LanguageResourcesCard, {})] }), _jsx(TabsContent, { value: "stats", className: "space-y-4", children: weeklyLoading ? (_jsxs("div", { className: "space-y-3", children: [_jsx(Skeleton, { className: "h-[220px] w-full" }), _jsx(Skeleton, { className: "h-[220px] w-full" })] })) : (_jsx(LanguageStatsTab, { weeklyData: weeklyData, pieData: pieData, progress: progress, settings: settings })) })] })] }) }));
}
