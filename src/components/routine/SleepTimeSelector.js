import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Sun } from "lucide-react";
const WAKE_TIMES = [
    { value: '05:00', label: '5:00 AM' },
    { value: '05:30', label: '5:30 AM' },
    { value: '06:00', label: '6:00 AM' },
    { value: '06:30', label: '6:30 AM' },
    { value: '07:00', label: '7:00 AM' },
];
const SLEEP_TIMES = [
    { value: '21:00', label: '9:00 PM' },
    { value: '21:30', label: '9:30 PM' },
    { value: '22:00', label: '10:00 PM' },
    { value: '22:30', label: '10:30 PM' },
    { value: '23:00', label: '11:00 PM' },
];
export function SleepTimeSelector({ wakeTime, sleepTime, excludeIdiomas, excludeBloqueExtra, onWakeTimeChange, onSleepTimeChange, onExcludeIdiomasChange, onExcludeBloqueExtraChange, }) {
    const calculateSleepHours = () => {
        const [wakeH, wakeM] = wakeTime.split(':').map(Number);
        const [sleepH, sleepM] = sleepTime.split(':').map(Number);
        let wakeMinutes = wakeH * 60 + wakeM;
        let sleepMinutes = sleepH * 60 + sleepM;
        // Add 24 hours to wake time since it's next day
        wakeMinutes += 24 * 60;
        const totalMinutes = wakeMinutes - sleepMinutes;
        return (totalMinutes / 60).toFixed(1);
    };
    const sleepHours = parseFloat(calculateSleepHours());
    const sleepQuality = sleepHours >= 8 ? 'text-green-500' : sleepHours >= 7 ? 'text-yellow-500' : 'text-red-500';
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [_jsx(Moon, { className: "h-5 w-5" }), "Configurar Sue\u00F1o"] }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { className: "flex items-center gap-2", children: [_jsx(Sun, { className: "h-4 w-4 text-amber-500" }), "Despertar"] }), _jsxs(Select, { value: wakeTime, onValueChange: onWakeTimeChange, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: WAKE_TIMES.map(time => (_jsx(SelectItem, { value: time.value, children: time.label }, time.value))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { className: "flex items-center gap-2", children: [_jsx(Moon, { className: "h-4 w-4 text-indigo-500" }), "Dormir"] }), _jsxs(Select, { value: sleepTime, onValueChange: onSleepTimeChange, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: SLEEP_TIMES.map(time => (_jsx(SelectItem, { value: time.value, children: time.label }, time.value))) })] })] })] }), _jsx("div", { className: "flex items-center justify-center p-4 bg-muted/50 rounded-lg", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Horas de sue\u00F1o" }), _jsxs("p", { className: `text-3xl font-bold ${sleepQuality}`, children: [sleepHours, "h"] }), sleepHours < 7 && (_jsx("p", { className: "text-xs text-red-500 mt-1", children: "\u26A0\uFE0F Menos de 7 horas" }))] }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between p-3 bg-muted/30 rounded-lg", children: [_jsxs("div", { children: [_jsx(Label, { className: "font-medium", children: "Eliminar bloque de Idiomas" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "5:30-7:00 AM \u2192 Permite despertar a las 6:30 AM" })] }), _jsx(Switch, { checked: excludeIdiomas, onCheckedChange: (checked) => {
                                            onExcludeIdiomasChange(checked);
                                            if (checked && wakeTime === '05:00') {
                                                onWakeTimeChange('06:30');
                                            }
                                        } })] }), _jsxs("div", { className: "flex items-center justify-between p-3 bg-muted/30 rounded-lg", children: [_jsxs("div", { children: [_jsx(Label, { className: "font-medium", children: "Eliminar bloque extra nocturno" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "9:00-11:00 PM \u2192 Asegura dormir antes de las 9 PM" })] }), _jsx(Switch, { checked: excludeBloqueExtra, onCheckedChange: (checked) => {
                                            onExcludeBloqueExtraChange(checked);
                                            if (checked && sleepTime === '23:00') {
                                                onSleepTimeChange('21:00');
                                            }
                                        } })] })] })] })] }));
}
