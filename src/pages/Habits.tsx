import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, PlusCircle, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatISO, isToday, parseISO } from "date-fns";
import type { HabitHistory } from "@/lib/definitions";

interface Habit {
  id: string;
  title: string;
}

const Habits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitHistory, setHabitHistory] = useState<HabitHistory>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const storedHabits = localStorage.getItem('userHabits');
    if (storedHabits) {
      try {
        setHabits(JSON.parse(storedHabits));
      } catch (e) {
        setHabits([]);
      }
    }
    const storedHistory = localStorage.getItem('habitHistory');
    if (storedHistory) {
      try {
        setHabitHistory(JSON.parse(storedHistory));
      } catch (e) {
        setHabitHistory({});
      }
    }
  }, []);

  useEffect(() => {
    if (isClient && habits.length > 0) {
      localStorage.setItem('userHabits', JSON.stringify(habits));
    }
  }, [habits, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('habitHistory', JSON.stringify(habitHistory));
    }
  }, [habitHistory, isClient]);

  const handleCreateHabit = () => {
    if (!newHabitTitle.trim()) return;

    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title: newHabitTitle,
    };

    setHabits(prev => [...prev, newHabit]);
    setHabitHistory(prev => ({
      ...prev,
      [newHabit.id]: {
        completedDates: [],
        currentStreak: 0,
        longestStreak: 0,
      }
    }));
    setNewHabitTitle("");
    setIsDialogOpen(false);
    toast({ title: 'Hábito creado', description: `${newHabitTitle} ha sido añadido.` });
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setHabitHistory(prev => {
      const newHistory = { ...prev };
      delete newHistory[habitId];
      return newHistory;
    });
    toast({ title: 'Hábito eliminado', description: 'El hábito ha sido eliminado.' });
  };

  const toggleHabit = (habitId: string) => {
    const todayStr = formatISO(new Date(), { representation: 'date' });
    
    setHabitHistory(prev => {
      const habitData = prev[habitId] || { completedDates: [], currentStreak: 0, longestStreak: 0 };
      const completedDates = [...(habitData.completedDates || [])];
      const todayIndex = completedDates.findIndex(d => d.date === todayStr);

      if (todayIndex > -1) {
        completedDates.splice(todayIndex, 1);
      } else {
        completedDates.push({ date: todayStr, status: 'completed' as const });
      }

      const currentStreak = calculateStreak(completedDates);
      const longestStreak = Math.max(habitData.longestStreak, currentStreak);

      return {
        ...prev,
        [habitId]: {
          completedDates,
          currentStreak,
          longestStreak,
        }
      };
    });
  };

  const calculateStreak = (completedDates: any[]) => {
    if (completedDates.length === 0) return 0;
    
    const sortedDates = completedDates
      .map(d => parseISO(d.date))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);
      
      const hasDate = sortedDates.some(d => {
        const entryDate = new Date(d);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === checkDate.getTime();
      });
      
      if (hasDate) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const isHabitCompleted = (habitId: string) => {
    const todayStr = formatISO(new Date(), { representation: 'date' });
    const habitData = habitHistory[habitId];
    if (!habitData) return false;
    return (habitData.completedDates || []).some(d => d.date === todayStr);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <header>
          <h1 className="text-3xl font-headline font-bold">Seguimiento de Hábitos</h1>
          <p className="text-muted-foreground">Construye rachas y mantén tus hábitos consistentes</p>
        </header>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Hábito
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Hábito</DialogTitle>
              <DialogDescription>Define tu nuevo hábito diario.</DialogDescription>
            </DialogHeader>
            <div>
              <label className="text-sm font-medium">Nombre del Hábito</label>
              <Input
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                placeholder="Ej: Meditar 10 minutos"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleCreateHabit}>Crear Hábito</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {habits.map((habit) => {
          const habitData = habitHistory[habit.id] || { completedDates: [], currentStreak: 0, longestStreak: 0 };
          const isCompleted = isHabitCompleted(habit.id);
          
          return (
            <Card key={habit.id} className={isCompleted ? 'border-green-500 border-2' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {habit.title}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        Racha: {habitData.currentStreak} días
                      </span>
                      <span className="text-xs">
                        Mejor: {habitData.longestStreak}
                      </span>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteHabit(habit.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => toggleHabit(habit.id)}
                  />
                  <span className="text-sm">Completar hoy</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {habits.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No tienes hábitos aún. Crea tu primer hábito para comenzar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Habits;
