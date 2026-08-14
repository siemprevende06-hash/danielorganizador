import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { habits as allHabits } from "@/lib/data";
import { HabitCard } from "../HabitCard";
import { HabitDetailDialog } from "./HabitDetailDialog";
import { SkinCareHabitCard } from "./SkinCareHabitCard";
import { PersonalCareHabitCard } from "./PersonalCareHabitCard";
import { formatISO } from "date-fns";
import { calculateStreaks } from "@/lib/habitUtils";
import { useToast } from "@/hooks/use-toast";
export const HabitTrackerMain = ({ habitHistory, setHabitHistory, }) => {
    const { toast } = useToast();
    const [selectedHabit, setSelectedHabit] = useState(null);
    const updateHabitStatus = (habitId, action) => {
        const todayStr = formatISO(new Date(), { representation: "date" });
        setHabitHistory((prev) => {
            const habitData = prev[habitId] || {
                completedDates: [],
                currentStreak: 0,
                longestStreak: 0,
            };
            const completedDates = [...habitData.completedDates];
            const todayIndex = completedDates.findIndex((e) => e.date === todayStr);
            // If already has this status, remove it (toggle off)
            if (todayIndex > -1 && completedDates[todayIndex].status === action) {
                completedDates.splice(todayIndex, 1);
            }
            else {
                // Remove any existing entry for today and add new one
                if (todayIndex > -1) {
                    completedDates.splice(todayIndex, 1);
                }
                completedDates.push({
                    date: todayStr,
                    status: action,
                    duration: 0,
                });
                // Gamification: Update rewards/punishments balance in backend
                (async () => {
                    try {
                        const { supabase } = await import("@/integrations/supabase/client");
                        const { data: row } = await supabase
                            .from("user_settings")
                            .select("id, rewards_balance, punishments_balance")
                            .maybeSingle();
                        const rewards = row?.rewards_balance ?? 0;
                        const punishments = row?.punishments_balance ?? 0;
                        const patch = action === "completed"
                            ? { rewards_balance: rewards + 1 }
                            : { punishments_balance: punishments + 1 };
                        if (row?.id) {
                            await supabase.from("user_settings").update(patch).eq("id", row.id);
                        }
                        else {
                            await supabase.from("user_settings").insert({ user_id: crypto.randomUUID(), ...patch });
                        }
                    }
                    catch (e) {
                        console.warn("update rewards balance failed", e);
                    }
                })();
                if (action === "completed") {
                    toast({
                        title: "¡Hábito completado! 🎉",
                        description: "+1 recompensa ganada",
                    });
                }
                else {
                    toast({
                        title: "Hábito marcado como fallado",
                        description: "+1 castigo pendiente",
                        variant: "destructive",
                    });
                }
            }
            // Recalculate streaks
            const { currentStreak, longestStreak } = calculateStreaks(completedDates);
            return {
                ...prev,
                [habitId]: {
                    completedDates,
                    currentStreak,
                    longestStreak,
                },
            };
        });
    };
    const handleSaveDuration = (habitId, duration) => {
        const todayStr = formatISO(new Date(), { representation: "date" });
        setHabitHistory((prev) => {
            const habitData = prev[habitId] || {
                completedDates: [],
                currentStreak: 0,
                longestStreak: 0,
            };
            const completedDates = [...habitData.completedDates];
            const todayIndex = completedDates.findIndex((e) => e.date === todayStr);
            if (todayIndex > -1) {
                completedDates[todayIndex] = {
                    ...completedDates[todayIndex],
                    duration,
                };
            }
            else {
                completedDates.push({
                    date: todayStr,
                    status: "completed",
                    duration,
                });
            }
            const { currentStreak, longestStreak } = calculateStreaks(completedDates);
            return {
                ...prev,
                [habitId]: {
                    completedDates,
                    currentStreak,
                    longestStreak,
                },
            };
        });
    };
    // Specialized handlers for SkinCare
    const handleToggleMorning = (habitId) => {
        const todayStr = formatISO(new Date(), { representation: "date" });
        setHabitHistory((prev) => {
            const habitData = prev[habitId] || {
                completedDates: [],
                currentStreak: 0,
                longestStreak: 0,
            };
            const completedDates = [...habitData.completedDates];
            const todayIndex = completedDates.findIndex((e) => e.date === todayStr);
            if (todayIndex > -1) {
                const current = completedDates[todayIndex].healthMetrics?.morningRoutine || false;
                completedDates[todayIndex] = {
                    ...completedDates[todayIndex],
                    healthMetrics: {
                        ...completedDates[todayIndex].healthMetrics,
                        morningRoutine: !current,
                    },
                };
            }
            else {
                completedDates.push({
                    date: todayStr,
                    status: "completed",
                    healthMetrics: { morningRoutine: true },
                });
            }
            const { currentStreak, longestStreak } = calculateStreaks(completedDates);
            return {
                ...prev,
                [habitId]: {
                    completedDates,
                    currentStreak,
                    longestStreak,
                },
            };
        });
    };
    const handleToggleNight = (habitId) => {
        const todayStr = formatISO(new Date(), { representation: "date" });
        setHabitHistory((prev) => {
            const habitData = prev[habitId] || {
                completedDates: [],
                currentStreak: 0,
                longestStreak: 0,
            };
            const completedDates = [...habitData.completedDates];
            const todayIndex = completedDates.findIndex((e) => e.date === todayStr);
            if (todayIndex > -1) {
                const current = completedDates[todayIndex].healthMetrics?.nightRoutine || false;
                completedDates[todayIndex] = {
                    ...completedDates[todayIndex],
                    healthMetrics: {
                        ...completedDates[todayIndex].healthMetrics,
                        nightRoutine: !current,
                    },
                };
            }
            else {
                completedDates.push({
                    date: todayStr,
                    status: "completed",
                    healthMetrics: { nightRoutine: true },
                });
            }
            const { currentStreak, longestStreak } = calculateStreaks(completedDates);
            return {
                ...prev,
                [habitId]: {
                    completedDates,
                    currentStreak,
                    longestStreak,
                },
            };
        });
    };
    // Personal care handlers
    const handleToggleClothes = (habitId) => {
        const todayStr = formatISO(new Date(), { representation: "date" });
        setHabitHistory((prev) => {
            const habitData = prev[habitId] || {
                completedDates: [],
                currentStreak: 0,
                longestStreak: 0,
            };
            const completedDates = [...habitData.completedDates];
            const todayIndex = completedDates.findIndex((e) => e.date === todayStr);
            if (todayIndex > -1) {
                const current = completedDates[todayIndex].healthMetrics?.cleanClothes || false;
                completedDates[todayIndex] = {
                    ...completedDates[todayIndex],
                    healthMetrics: {
                        ...completedDates[todayIndex].healthMetrics,
                        cleanClothes: !current,
                    },
                };
            }
            else {
                completedDates.push({
                    date: todayStr,
                    status: "completed",
                    healthMetrics: { cleanClothes: true },
                });
            }
            const { currentStreak, longestStreak } = calculateStreaks(completedDates);
            return {
                ...prev,
                [habitId]: {
                    completedDates,
                    currentStreak,
                    longestStreak,
                },
            };
        });
    };
    const handleToggleHair = (habitId) => {
        const todayStr = formatISO(new Date(), { representation: "date" });
        setHabitHistory((prev) => {
            const habitData = prev[habitId] || {
                completedDates: [],
                currentStreak: 0,
                longestStreak: 0,
            };
            const completedDates = [...habitData.completedDates];
            const todayIndex = completedDates.findIndex((e) => e.date === todayStr);
            if (todayIndex > -1) {
                const current = completedDates[todayIndex].healthMetrics?.hairGroomed || false;
                completedDates[todayIndex] = {
                    ...completedDates[todayIndex],
                    healthMetrics: {
                        ...completedDates[todayIndex].healthMetrics,
                        hairGroomed: !current,
                    },
                };
            }
            else {
                completedDates.push({
                    date: todayStr,
                    status: "completed",
                    healthMetrics: { hairGroomed: true },
                });
            }
            const { currentStreak, longestStreak } = calculateStreaks(completedDates);
            return {
                ...prev,
                [habitId]: {
                    completedDates,
                    currentStreak,
                    longestStreak,
                },
            };
        });
    };
    const handleTogglePerfume = (habitId) => {
        const todayStr = formatISO(new Date(), { representation: "date" });
        setHabitHistory((prev) => {
            const habitData = prev[habitId] || {
                completedDates: [],
                currentStreak: 0,
                longestStreak: 0,
            };
            const completedDates = [...habitData.completedDates];
            const todayIndex = completedDates.findIndex((e) => e.date === todayStr);
            if (todayIndex > -1) {
                const current = completedDates[todayIndex].healthMetrics?.perfumeApplied || false;
                completedDates[todayIndex] = {
                    ...completedDates[todayIndex],
                    healthMetrics: {
                        ...completedDates[todayIndex].healthMetrics,
                        perfumeApplied: !current,
                    },
                };
            }
            else {
                completedDates.push({
                    date: todayStr,
                    status: "completed",
                    healthMetrics: { perfumeApplied: true },
                });
            }
            const { currentStreak, longestStreak } = calculateStreaks(completedDates);
            return {
                ...prev,
                [habitId]: {
                    completedDates,
                    currentStreak,
                    longestStreak,
                },
            };
        });
    };
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: allHabits.map((habit) => {
                    // Check if this is a special habit type
                    if (habit.id === "skin-care") {
                        return (_jsx(SkinCareHabitCard, { habit: habit, habitHistory: habitHistory, onToggleMorning: handleToggleMorning, onToggleNight: handleToggleNight, onClick: () => setSelectedHabit(habit) }, habit.id));
                    }
                    if (habit.id === "personal-care") {
                        return (_jsx(PersonalCareHabitCard, { habit: habit, habitHistory: habitHistory, onToggleClothes: handleToggleClothes, onToggleHair: handleToggleHair, onTogglePerfume: handleTogglePerfume, onClick: () => setSelectedHabit(habit) }, habit.id));
                    }
                    // Default habit card
                    return (_jsx(HabitCard, { habit: habit, habitHistory: habitHistory, onUpdateStatus: updateHabitStatus, onClick: () => setSelectedHabit(habit) }, habit.id));
                }) }), selectedHabit && (_jsx(HabitDetailDialog, { habit: selectedHabit, habitHistory: habitHistory, open: !!selectedHabit, onOpenChange: (open) => !open && setSelectedHabit(null), onSaveDuration: handleSaveDuration }))] }));
};
