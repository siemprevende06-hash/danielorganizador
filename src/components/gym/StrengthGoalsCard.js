import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Save, Edit3 } from "lucide-react";
import { useStrengthGoals, MAIN_LIFTS } from "@/hooks/useStrengthGoals";
import { toast } from "@/hooks/use-toast";
export const StrengthGoalsCard = () => {
    const { goals, loading, upsertGoal } = useStrengthGoals();
    const [editing, setEditing] = useState(null);
    const [cw, setCw] = useState(0);
    const [cr, setCr] = useState(0);
    const [tw, setTw] = useState(0);
    const [tr, setTr] = useState(0);
    const open = (lift) => {
        const existing = goals.find(g => g.exercise_key === lift.key);
        setEditing(lift);
        setCw(existing?.current_weight_kg || 0);
        setCr(existing?.current_reps || 0);
        setTw(existing?.target_weight_kg || 0);
        setTr(existing?.target_reps || 0);
    };
    const save = async () => {
        if (!editing)
            return;
        await upsertGoal({
            exercise_key: editing.key, exercise_name: editing.name,
            current_weight_kg: cw, current_reps: cr,
            target_weight_kg: tw, target_reps: tr,
        });
        toast({ title: "Objetivo guardado" });
        setEditing(null);
    };
    if (loading)
        return _jsx(Card, { className: "p-4", children: _jsx("p", { className: "text-xs text-muted-foreground", children: "Cargando..." }) });
    return (_jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Trophy, { className: "h-4 w-4 text-amber-500" }), _jsx("h3", { className: "text-sm font-semibold", children: "Objetivos de Fuerza" })] }), _jsx("div", { className: "space-y-2", children: MAIN_LIFTS.map(lift => {
                    const g = goals.find(x => x.exercise_key === lift.key);
                    const wpct = g && g.target_weight_kg > 0 ? Math.min(100, Math.round((g.current_weight_kg / g.target_weight_kg) * 100)) : 0;
                    return (_jsxs("div", { className: "p-2.5 rounded-lg border hover:bg-muted/30 transition-colors", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "text-sm font-medium", children: lift.name }), _jsx(Button, { size: "sm", variant: "ghost", className: "h-6 w-6 p-0", onClick: () => open(lift), children: _jsx(Edit3, { className: "h-3 w-3" }) })] }), g ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-between text-[10px] text-muted-foreground mb-1", children: [_jsxs("span", { children: [g.current_weight_kg, "kg \u00D7 ", g.current_reps] }), _jsxs("span", { children: ["\u2192 ", g.target_weight_kg, "kg \u00D7 ", g.target_reps] })] }), _jsx(Progress, { value: wpct, className: "h-1.5" })] })) : (_jsx("p", { className: "text-[10px] text-muted-foreground italic", children: "Sin objetivo. Toca para definir." }))] }, lift.key));
                }) }), _jsx(Dialog, { open: editing !== null, onOpenChange: o => !o && setEditing(null), children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: editing?.name }) }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx(Label, { children: "Peso actual (kg)" }), _jsx(Input, { type: "number", value: cw, onChange: e => setCw(Number(e.target.value)) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Reps actuales" }), _jsx(Input, { type: "number", value: cr, onChange: e => setCr(Number(e.target.value)) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx(Label, { children: "Peso objetivo (kg)" }), _jsx(Input, { type: "number", value: tw, onChange: e => setTw(Number(e.target.value)) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Reps objetivo" }), _jsx(Input, { type: "number", value: tr, onChange: e => setTr(Number(e.target.value)) })] })] }), _jsxs(Button, { onClick: save, className: "w-full gap-2", children: [_jsx(Save, { className: "h-4 w-4" }), " Guardar"] })] })] }) })] }));
};
