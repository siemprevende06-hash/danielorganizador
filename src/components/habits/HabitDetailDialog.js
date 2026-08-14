import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parseISO } from "date-fns";
import { Flame, Award, Clock } from "lucide-react";
import { getMonthTotal } from "@/lib/habitUtils";
import { useToast } from "@/hooks/use-toast";
export const HabitDetailDialog = ({ habit, habitHistory, open, onOpenChange, onSaveDuration, }) => {
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
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center gap-2 text-2xl", children: [_jsx(Icon, { className: "h-6 w-6" }), habit.title] }) }), _jsxs("div", { className: "space-y-6 py-4", children: [_jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { className: "flex flex-col items-center p-4 bg-muted rounded-lg", children: [_jsx(Flame, { className: "h-6 w-6 text-orange-500 mb-2" }), _jsx("span", { className: "text-2xl font-bold", children: history.currentStreak }), _jsx("span", { className: "text-xs text-muted-foreground", children: "Racha Actual" })] }), _jsxs("div", { className: "flex flex-col items-center p-4 bg-muted rounded-lg", children: [_jsx(Award, { className: "h-6 w-6 text-yellow-500 mb-2" }), _jsx("span", { className: "text-2xl font-bold", children: history.longestStreak }), _jsx("span", { className: "text-xs text-muted-foreground", children: "Racha M\u00E1xima" })] }), _jsxs("div", { className: "flex flex-col items-center p-4 bg-muted rounded-lg", children: [_jsx(Clock, { className: "h-6 w-6 text-blue-500 mb-2" }), _jsx("span", { className: "text-2xl font-bold", children: monthTotal }), _jsx("span", { className: "text-xs text-muted-foreground", children: "Min. Este Mes" })] })] }), _jsx("div", { className: "flex justify-center", children: _jsx(Calendar, { mode: "multiple", selected: completedDates, className: "rounded-md border pointer-events-auto", modifiersClassNames: {
                                    selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                                } }) }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "duration", children: "Registrar minutos de hoy" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { id: "duration", type: "number", placeholder: "Ej: 30", value: duration, onChange: (e) => setDuration(e.target.value) }), _jsx(Button, { onClick: handleSaveDuration, children: "Guardar" })] })] })] })] }) }));
};
