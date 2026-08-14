import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateMorningSchedule, getTimeComparison } from "@/lib/routineScheduler";
import { Badge } from "@/components/ui/badge";
export function WakeTimeSettings({ currentSettings, blocks, onSave }) {
    const [open, setOpen] = useState(false);
    const [wakeTime, setWakeTime] = useState("05:00");
    const [morningEndTime, setMorningEndTime] = useState("09:00");
    const [autoAdjust, setAutoAdjust] = useState(true);
    const [preview, setPreview] = useState([]);
    const { toast } = useToast();
    useEffect(() => {
        if (currentSettings) {
            // Convert TIME to HH:MM format
            const wakeTimeStr = currentSettings.wake_time.substring(0, 5);
            const endTimeStr = currentSettings.morning_end_time.substring(0, 5);
            setWakeTime(wakeTimeStr);
            setMorningEndTime(endTimeStr);
            setAutoAdjust(currentSettings.auto_adjust_enabled);
        }
    }, [currentSettings]);
    useEffect(() => {
        if (open) {
            const config = calculateMorningSchedule(wakeTime, morningEndTime, blocks);
            setPreview(config.adjustedBlocks);
        }
    }, [wakeTime, morningEndTime, open, blocks]);
    const handleSave = async () => {
        try {
            await onSave({
                wake_time: wakeTime + ":00",
                morning_end_time: morningEndTime + ":00",
                auto_adjust_enabled: autoAdjust,
            });
            toast({
                title: "Configuración guardada",
                description: autoAdjust
                    ? "Tu rutina matutina se ajustará automáticamente"
                    : "Ajuste automático desactivado",
            });
            setOpen(false);
        }
        catch (error) {
            toast({
                title: "Error",
                description: "No se pudo guardar la configuración",
                variant: "destructive",
            });
        }
    };
    const timeComparison = getTimeComparison(wakeTime);
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(Clock, { className: "h-4 w-4 mr-2" }), "Ajustar Hora de Despertar"] }) }), _jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "\u23F0 Configurar Rutina Matutina" }), _jsx(DialogDescription, { children: "Ajusta tu hora de despertar y la rutina se adaptar\u00E1 autom\u00E1ticamente" })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "wake-time", children: "Hora de Despertar" }), _jsx(Input, { id: "wake-time", type: "time", value: wakeTime, onChange: (e) => setWakeTime(e.target.value) })] }), _jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "end-time", children: "Hora de Fin de Ma\u00F1ana" }), _jsx(Input, { id: "end-time", type: "time", value: morningEndTime, onChange: (e) => setMorningEndTime(e.target.value) })] }), _jsxs("div", { className: "flex items-center justify-between p-4 border rounded-lg", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(Label, { htmlFor: "auto-adjust", children: "Ajuste Autom\u00E1tico" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Adapta los bloques matutinos seg\u00FAn tu hora de despertar" })] }), _jsx(Switch, { id: "auto-adjust", checked: autoAdjust, onCheckedChange: setAutoAdjust })] })] }), _jsx("div", { className: `p-4 rounded-lg ${timeComparison.type === 'late' ? 'bg-orange-500/10 border border-orange-500/20' :
                                    timeComparison.type === 'early' ? 'bg-green-500/10 border border-green-500/20' :
                                        'bg-blue-500/10 border border-blue-500/20'}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(AlertCircle, { className: "h-5 w-5 mt-0.5" }), _jsxs("div", { children: [_jsxs("p", { className: "font-medium", children: [timeComparison.type === 'late' && '⚠️ Despertarás más tarde', timeComparison.type === 'early' && '✅ Despertarás más temprano', timeComparison.type === 'ontime' && '👌 A tiempo'] }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: timeComparison.message })] })] }) }), autoAdjust && (_jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "font-semibold", children: "Vista Previa de Bloques Ajustados" }), _jsx("div", { className: "space-y-2 max-h-64 overflow-y-auto", children: preview.map((block) => (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: block.title }), _jsx("p", { className: "text-sm text-muted-foreground", children: block.time })] }), _jsxs(Badge, { variant: "secondary", children: [block.duration, " min"] })] }, block.id))) })] })), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancelar" }), _jsx(Button, { onClick: handleSave, children: "Guardar Configuraci\u00F3n" })] })] })] })] }));
}
