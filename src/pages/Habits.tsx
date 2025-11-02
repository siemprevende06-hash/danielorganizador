import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { HabitHistory, Task } from "@/lib/definitions";
import HabitTracker from "@/components/dashboard/HabitTracker";
import HabitAreasSummary from "@/components/dashboard/HabitAreasSummary";
import { isToday, parseISO } from "date-fns";

const Habits = () => {
  const [habitHistory, setHabitHistory] = useState<HabitHistory>({});
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedHabits = localStorage.getItem('habitHistory');
    if (storedHabits) {
      try {
        setHabitHistory(JSON.parse(storedHabits));
      } catch (e) {
        setHabitHistory({});
      }
    }
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      try {
        setAllTasks(JSON.parse(storedTasks));
      } catch (e) {
        setAllTasks([]);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('habitHistory', JSON.stringify(habitHistory));
    }
  }, [habitHistory, isClient]);

  const todayTasks = useMemo(() =>
    allTasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
      return isToday(dueDate);
    }), [allTasks]
  );

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header>
          <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
            Seguimiento de Hábitos
          </h1>
          <p className="text-muted-foreground mt-2">
            Tu centro de mando para la disciplina diaria
          </p>
        </header>

        {isClient && <HabitAreasSummary habitHistory={habitHistory} />}

        <Separator />

        {isClient && <HabitTracker habitHistory={habitHistory} setHabitHistory={setHabitHistory} todayTasks={todayTasks} />}
      </div>
    </div>
  );
};

export default Habits;
