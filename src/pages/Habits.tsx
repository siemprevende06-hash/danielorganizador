import { useHabitHistory } from "@/hooks/useHabitHistory";
import { HabitTrackerMain } from "@/components/habits/HabitTrackerMain";
import HabitAreasSummary from "@/components/dashboard/HabitAreasSummary";

const Habits = () => {
  const { habitHistory, setHabitHistory, isLoading } = useHabitHistory();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 space-y-6">
        <header>
          <h1 className="text-3xl font-headline font-bold">
            Seguimiento de Hábitos
          </h1>
          <p className="text-muted-foreground">Cargando...</p>
        </header>
      </div>
    );
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
