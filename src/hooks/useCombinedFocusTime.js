import { useCallback, useMemo } from "react";
import { useSystemsTracking } from "./useSystemsTracking";
import { useDailyAreaStats } from "./useDailyAreaStats";
const AREAS_CONFIG = [
    { id: "universidad", name: "Universidad" },
    { id: "emprendimiento", name: "Emprendimiento" },
    { id: "proyectos", name: "Proyectos" },
];
export function useCombinedFocusTime() {
    const { data: systemsData, loading: systemsLoading, setTimeValue, } = useSystemsTracking();
    const { stats: areaStats, isLoading: areaStatsLoading, addTime, } = useDailyAreaStats();
    const setManualTime = useCallback((areaId, newValue) => {
        const oldManual = systemsData.timeData[areaId] || 0;
        const diff = newValue - oldManual;
        setTimeValue(areaId, newValue);
        if (diff !== 0) {
            const currentTotal = areaStats[areaId]?.time_spent_minutes || 0;
            const clampedDiff = Math.max(-currentTotal, diff);
            if (clampedDiff !== 0) {
                addTime(areaId, clampedDiff);
            }
        }
    }, [systemsData.timeData, areaStats, setTimeValue, addTime]);
    const areas = useMemo(() => {
        return AREAS_CONFIG.map((area) => {
            const manualMinutes = systemsData.timeData[area.id] || 0;
            const totalMinutes = areaStats[area.id]?.time_spent_minutes || 0;
            const focusMinutes = Math.max(0, totalMinutes - manualMinutes);
            const goalMinutes = areaStats[area.id]?.time_goal_minutes || 60;
            const progress = goalMinutes > 0
                ? Math.min(100, Math.round((totalMinutes / goalMinutes) * 100))
                : 0;
            return {
                id: area.id,
                name: area.name,
                manualMinutes,
                focusMinutes,
                totalMinutes,
                goalMinutes,
                progress,
            };
        });
    }, [systemsData.timeData, areaStats]);
    const loading = systemsLoading || areaStatsLoading;
    return {
        areas,
        loading,
        setManualTime,
    };
}
