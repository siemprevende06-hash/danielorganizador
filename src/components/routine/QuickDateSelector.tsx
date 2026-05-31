import { format, addDays, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, CalendarDays, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface QuickDateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function QuickDateSelector({ selectedDate, onDateChange }: QuickDateSelectorProps) {
  const today = new Date();
  const tomorrow = addDays(today, 1);

  const options = [
    {
      label: "Hoy",
      date: today,
      icon: Sun,
      isSelected: isToday(selectedDate),
      description: format(today, "d 'de' MMMM", { locale: es })
    },
    {
      label: "Mañana",
      date: tomorrow,
      icon: Moon,
      isSelected: isTomorrow(selectedDate),
      description: format(tomorrow, "d 'de' MMMM", { locale: es })
    }
  ];

  const isOtherDate = !isToday(selectedDate) && !isTomorrow(selectedDate);

  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <button
          key={option.label}
          onClick={() => onDateChange(option.date)}
          className={cn(
            "flex-1 min-w-[140px] p-4 rounded-xl border-2 transition-all duration-200",
            "flex flex-col items-center gap-2",
            option.isSelected
              ? "border-primary bg-primary/10 shadow-md"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <option.icon className={cn(
            "w-6 h-6",
            option.isSelected ? "text-primary" : "text-muted-foreground"
          )} />
          <span className={cn(
            "font-semibold",
            option.isSelected ? "text-primary" : "text-foreground"
          )}>
            {option.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {option.description}
          </span>
        </button>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex-1 min-w-[140px] p-4 rounded-xl border-2 transition-all duration-200",
              "flex flex-col items-center gap-2",
              isOtherDate
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <CalendarDays className={cn(
              "w-6 h-6",
              isOtherDate ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "font-semibold",
              isOtherDate ? "text-primary" : "text-foreground"
            )}>
              Otra fecha
            </span>
            <span className="text-xs text-muted-foreground">
              {isOtherDate 
                ? format(selectedDate, "d 'de' MMMM", { locale: es })
                : "Calendario"
              }
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateChange(date)}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
