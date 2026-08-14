import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { format, addDays, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
export function QuickDateSelector({ selectedDate, onDateChange }) {
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
    return (_jsxs("div", { className: "flex flex-wrap gap-3", children: [options.map((option) => (_jsxs("button", { onClick: () => onDateChange(option.date), className: cn("flex-1 min-w-[140px] p-4 rounded-xl border-2 transition-all duration-200", "flex flex-col items-center gap-2", option.isSelected
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"), children: [_jsx(option.icon, { className: cn("w-6 h-6", option.isSelected ? "text-primary" : "text-muted-foreground") }), _jsx("span", { className: cn("font-semibold", option.isSelected ? "text-primary" : "text-foreground"), children: option.label }), _jsx("span", { className: "text-xs text-muted-foreground", children: option.description })] }, option.label))), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs("button", { className: cn("flex-1 min-w-[140px] p-4 rounded-xl border-2 transition-all duration-200", "flex flex-col items-center gap-2", isOtherDate
                                ? "border-primary bg-primary/10 shadow-md"
                                : "border-border hover:border-primary/50 hover:bg-muted/50"), children: [_jsx(CalendarDays, { className: cn("w-6 h-6", isOtherDate ? "text-primary" : "text-muted-foreground") }), _jsx("span", { className: cn("font-semibold", isOtherDate ? "text-primary" : "text-foreground"), children: "Otra fecha" }), _jsx("span", { className: "text-xs text-muted-foreground", children: isOtherDate
                                        ? format(selectedDate, "d 'de' MMMM", { locale: es })
                                        : "Calendario" })] }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "center", children: _jsx(CalendarComponent, { mode: "single", selected: selectedDate, onSelect: (date) => date && onDateChange(date), locale: es }) })] })] }));
}
