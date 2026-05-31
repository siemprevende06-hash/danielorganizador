import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatISO, parseISO } from "date-fns";
import type { Habit, HabitHistory } from "@/lib/definitions";
import { Flame, Award, Clock } from "lucide-react";
import { getMonthTotal } from "@/lib/habitUtils";
import { useToast } from "@/hooks/use-toast";

interface HabitDetailDialogProps {
  habit: Habit;
  habitHistory: HabitHistory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveDuration: (habitId: string, duration: number) => void;
}

export const HabitDetailDialog = ({
  habit,
  habitHistory,
  open,
  onOpenChange,
  onSaveDuration,
}: HabitDetailDialogProps) => {
  const { toast } = useToast();
  const [duration, setDuration] = useState("");

  const history = habitHistory[habit.id] || {
    completedDates: [],
    currentStreak: 0,
    longestStreak: 0,
  };

  const completedDates = history.completedDates
    .filter((entry) => entry.status === "completed")
    .map((entry) => parseISO(entry.date));

  const monthTotal = getMonthTotal(history);

  const handleSaveDuration = () => {
    const mins = parseInt(duration);
    if (isNaN(mins) || mins <= 0) {
      toast({
        title: "Error",
        description: "Ingresa un número válido de minutos",
        variant: "destructive",
      });
      return;
    }

    onSaveDuration(habit.id, mins);
    setDuration("");
    toast({
      title: "Duración guardada",
      description: `${mins} minutos registrados para hoy`,
    });
  };

  const Icon = habit.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Icon className="h-6 w-6" />
            {habit.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Metrics Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <Flame className="h-6 w-6 text-orange-500 mb-2" />
              <span className="text-2xl font-bold">{history.currentStreak}</span>
              <span className="text-xs text-muted-foreground">Racha Actual</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <Award className="h-6 w-6 text-yellow-500 mb-2" />
              <span className="text-2xl font-bold">{history.longestStreak}</span>
              <span className="text-xs text-muted-foreground">Racha Máxima</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <Clock className="h-6 w-6 text-blue-500 mb-2" />
              <span className="text-2xl font-bold">{monthTotal}</span>
              <span className="text-xs text-muted-foreground">Min. Este Mes</span>
            </div>
          </div>

          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="multiple"
              selected={completedDates}
              className="rounded-md border pointer-events-auto"
              modifiersClassNames={{
                selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              }}
            />
          </div>

          {/* Duration Input */}
          <div className="space-y-2">
            <Label htmlFor="duration">Registrar minutos de hoy</Label>
            <div className="flex gap-2">
              <Input
                id="duration"
                type="number"
                placeholder="Ej: 30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <Button onClick={handleSaveDuration}>Guardar</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
