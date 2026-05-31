import { useState } from "react";
import type { Habit, HabitHistory } from "@/lib/definitions";
import { habits as allHabits } from "@/lib/data";
import { HabitCard } from "../HabitCard";
import { HabitDetailDialog } from "./HabitDetailDialog";
import { SkinCareHabitCard } from "./SkinCareHabitCard";
import { PersonalCareHabitCard } from "./PersonalCareHabitCard";
import { formatISO } from "date-fns";
import { calculateStreaks, getTodayCompletion } from "@/lib/habitUtils";
import { useToast } from "@/hooks/use-toast";

interface HabitTrackerMainProps {
  habitHistory: HabitHistory;
  setHabitHistory: React.Dispatch<React.SetStateAction<HabitHistory>>;
}

export const HabitTrackerMain = ({
  habitHistory,
  setHabitHistory,
}: HabitTrackerMainProps) => {
  const { toast } = useToast();
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const updateHabitStatus = (habitId: string, action: "completed" | "failed") => {
    const todayStr = formatISO(new Date(), { representation: "date" });

    setHabitHistory((prev: HabitHistory): HabitHistory => {
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
      } else {
        // Remove any existing entry for today and add new one
        if (todayIndex > -1) {
          completedDates.splice(todayIndex, 1);
        }
        completedDates.push({
          date: todayStr,
          status: action,
          duration: 0,
        });

        // Gamification: Update rewards/punishments balance
        const rewardsBalance = parseInt(localStorage.getItem("rewardsBalance") || "0");
        const punishmentsBalance = parseInt(
          localStorage.getItem("punishmentsBalance") || "0"
        );

        if (action === "completed") {
          localStorage.setItem("rewardsBalance", String(rewardsBalance + 1));
          toast({
            title: "¡Hábito completado! 🎉",
            description: "+1 recompensa ganada",
          });
        } else {
          localStorage.setItem("punishmentsBalance", String(punishmentsBalance + 1));
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

  const handleSaveDuration = (habitId: string, duration: number) => {
    const todayStr = formatISO(new Date(), { representation: "date" });

    setHabitHistory((prev: HabitHistory): HabitHistory => {
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
      } else {
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
  const handleToggleMorning = (habitId: string) => {
    const todayStr = formatISO(new Date(), { representation: "date" });
    setHabitHistory((prev: HabitHistory): HabitHistory => {
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
      } else {
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

  const handleToggleNight = (habitId: string) => {
    const todayStr = formatISO(new Date(), { representation: "date" });
    setHabitHistory((prev: HabitHistory): HabitHistory => {
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
      } else {
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
  const handleToggleClothes = (habitId: string) => {
    const todayStr = formatISO(new Date(), { representation: "date" });
    setHabitHistory((prev: HabitHistory): HabitHistory => {
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
      } else {
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

  const handleToggleHair = (habitId: string) => {
    const todayStr = formatISO(new Date(), { representation: "date" });
    setHabitHistory((prev: HabitHistory): HabitHistory => {
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
      } else {
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

  const handleTogglePerfume = (habitId: string) => {
    const todayStr = formatISO(new Date(), { representation: "date" });
    setHabitHistory((prev: HabitHistory): HabitHistory => {
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
      } else {
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

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allHabits.map((habit) => {
          // Check if this is a special habit type
          if (habit.id === "skin-care") {
            return (
              <SkinCareHabitCard
                key={habit.id}
                habit={habit}
                habitHistory={habitHistory}
                onToggleMorning={handleToggleMorning}
                onToggleNight={handleToggleNight}
                onClick={() => setSelectedHabit(habit)}
              />
            );
          }

          if (habit.id === "personal-care") {
            return (
              <PersonalCareHabitCard
                key={habit.id}
                habit={habit}
                habitHistory={habitHistory}
                onToggleClothes={handleToggleClothes}
                onToggleHair={handleToggleHair}
                onTogglePerfume={handleTogglePerfume}
                onClick={() => setSelectedHabit(habit)}
              />
            );
          }

          // Default habit card
          return (
            <HabitCard
              key={habit.id}
              habit={habit}
              habitHistory={habitHistory}
              onUpdateStatus={updateHabitStatus}
              onClick={() => setSelectedHabit(habit)}
            />
          );
        })}
      </div>

      {selectedHabit && (
        <HabitDetailDialog
          habit={selectedHabit}
          habitHistory={habitHistory}
          open={!!selectedHabit}
          onOpenChange={(open) => !open && setSelectedHabit(null)}
          onSaveDuration={handleSaveDuration}
        />
      )}
    </>
  );
};
