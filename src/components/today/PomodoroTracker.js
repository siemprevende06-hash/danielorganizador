import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
export function PomodoroTracker({ blockStartTime, blockEndTime, cycleDuration = 30 }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [cycles, setCycles] = useState([]);
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); // Update every second for smooth timer
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        calculateCycles();
    }, [blockStartTime, blockEndTime, currentTime]);
    const parseTime = (time) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };
    const formatTimeFromMinutes = (totalMinutes) => {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
    };
    const calculateCycles = () => {
        const startMinutes = parseTime(blockStartTime);
        const endMinutes = parseTime(blockEndTime);
        const totalBlockMinutes = endMinutes - startMinutes;
        const numCycles = Math.ceil(totalBlockMinutes / cycleDuration);
        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const currentSeconds = currentTime.getSeconds();
        const newCycles = [];
        for (let i = 0; i < numCycles; i++) {
            const cycleStartMinutes = startMinutes + (i * cycleDuration);
            const cycleEndMinutes = Math.min(cycleStartMinutes + cycleDuration, endMinutes);
            let status = 'pending';
            let progress = 0;
            if (currentMinutes >= cycleEndMinutes) {
                status = 'completed';
                progress = 100;
            }
            else if (currentMinutes >= cycleStartMinutes && currentMinutes < cycleEndMinutes) {
                status = 'active';
                const elapsedMinutes = currentMinutes - cycleStartMinutes;
                const elapsedSeconds = elapsedMinutes * 60 + currentSeconds;
                const totalCycleSeconds = (cycleEndMinutes - cycleStartMinutes) * 60;
                progress = (elapsedSeconds / totalCycleSeconds) * 100;
            }
            const startH = Math.floor(cycleStartMinutes / 60);
            const startM = cycleStartMinutes % 60;
            const endH = Math.floor(cycleEndMinutes / 60);
            const endM = cycleEndMinutes % 60;
            newCycles.push({
                index: i + 1,
                startTime: `${startH}:${startM.toString().padStart(2, '0')}`,
                endTime: `${endH}:${endM.toString().padStart(2, '0')}`,
                startMinutes: cycleStartMinutes,
                endMinutes: cycleEndMinutes,
                status,
                progress
            });
        }
        setCycles(newCycles);
    };
    const getActiveCycle = () => cycles.find(c => c.status === 'active');
    const formatRemainingTime = (cycle) => {
        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const currentSeconds = currentTime.getSeconds();
        const totalSecondsRemaining = (cycle.endMinutes - currentMinutes) * 60 - currentSeconds;
        if (totalSecondsRemaining <= 0)
            return "0:00";
        const minutes = Math.floor(totalSecondsRemaining / 60);
        const seconds = totalSecondsRemaining % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
    const activeCycle = getActiveCycle();
    const completedCount = cycles.filter(c => c.status === 'completed').length;
    return (_jsxs("div", { className: "space-y-4 p-4 bg-muted/30 rounded-lg border border-border", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Timer, { className: "w-4 h-4 text-primary" }), _jsx("span", { className: "text-sm font-medium", children: "Ciclos de Trabajo" })] }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [completedCount, "/", cycles.length, " completados"] })] }), _jsx("div", { className: "space-y-3", children: cycles.map((cycle) => (_jsxs("div", { className: cn("rounded-lg p-3 transition-all", cycle.status === 'active'
                        ? "bg-primary/10 border-2 border-primary shadow-sm"
                        : cycle.status === 'completed'
                            ? "bg-muted/50 border border-border"
                            : "bg-card border border-border/50"), children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [cycle.status === 'completed' ? (_jsx(CheckCircle2, { className: "w-4 h-4 text-success" })) : cycle.status === 'active' ? (_jsx("div", { className: "w-4 h-4 rounded-full bg-primary animate-pulse" })) : (_jsx(Clock, { className: "w-4 h-4 text-muted-foreground" })), _jsxs("span", { className: cn("text-sm font-medium", cycle.status === 'completed' && "text-muted-foreground"), children: ["Ciclo ", cycle.index] }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [formatTimeFromMinutes(cycle.startMinutes), " - ", formatTimeFromMinutes(cycle.endMinutes)] })] }), cycle.status === 'active' && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg font-mono font-bold text-primary", children: formatRemainingTime(cycle) }), _jsx("span", { className: "text-xs text-muted-foreground", children: "restante" })] })), cycle.status === 'completed' && (_jsx("span", { className: "text-xs text-success font-medium", children: "\u2713 Completado" }))] }), _jsx(Progress, { value: cycle.progress, className: cn("h-2", cycle.status === 'completed' && "[&>div]:bg-success") })] }, cycle.index))) }), activeCycle && (_jsx("div", { className: "text-center pt-2 border-t border-border", children: _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Enf\u00F3cate los pr\u00F3ximos ", _jsx("span", { className: "font-bold text-foreground", children: formatRemainingTime(activeCycle) }), " minutos"] }) }))] }));
}
