import { useState, useEffect } from "react";
import type { HabitHistory } from "@/lib/definitions";
import { HabitTrackerMain } from "@/components/habits/HabitTrackerMain";
import HabitAreasSummary from "@/components/dashboard/HabitAreasSummary";

const Habits = () => {
  const [habitHistory, setHabitHistory] = useState<HabitHistory>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedHistory = localStorage.getItem("habitHistory");
    if (storedHistory) {
      try {
        setHabitHistory(JSON.parse(storedHistory));
      } catch (e) {
        setHabitHistory({});
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("habitHistory", JSON.stringify(habitHistory));
    }
  }, [habitHistory, isClient]);

  if (!isClient) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header>
        <h1 className="text-3xl font-headline font-bold">
          Seguimiento de Hábitos
        </h1>
        <p className="text-muted-foreground">
          El centro de control para tu disciplina diaria
        </p>
      </header>

      {/* Summary by Areas */}
      <HabitAreasSummary habitHistory={habitHistory} />

      {/* Main Habit Tracker */}
      <HabitTrackerMain
        habitHistory={habitHistory}
        setHabitHistory={setHabitHistory}
      />
    </div>
  );
};

export default Habits;
