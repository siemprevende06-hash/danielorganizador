import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link2, Target } from "lucide-react";
export function GoalBlockConnector({ goalId, goalTitle, availableBlocks, currentConnections, onUpdate, }) {
    const [open, setOpen] = useState(false);
    const [selectedBlocks, setSelectedBlocks] = useState(currentConnections);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const handleToggle = (blockId) => {
        setSelectedBlocks(prev => prev.includes(blockId)
            ? prev.filter(id => id !== blockId)
            : [...prev, blockId]);
    };
    const handleSave = async () => {
        try {
            setSaving(true);
            await supabase
                .from('goal_block_connections')
                .delete()
                .eq('goal_id', goalId);
            if (selectedBlocks.length > 0) {
                const connections = selectedBlocks.map(blockId => {
                    const block = availableBlocks.find(b => b.id === blockId);
                    return {
                        goal_id: goalId,
                        block_id: blockId,
                        block_name: block?.title || '',
                        contribution_percentage: Math.round(100 / selectedBlocks.length),
                    };
                });
                const { error } = await supabase
                    .from('goal_block_connections')
                    .insert(connections);
                if (error)
                    throw error;
            }
            toast({
                title: "Conexiones actualizadas",
                description: `${selectedBlocks.length} bloques conectados a la meta`,
            });
            onUpdate();
            setOpen(false);
        }
        catch (error) {
            console.error('Error saving connections:', error);
            toast({
                title: "Error",
                description: "No se pudieron guardar las conexiones",
                variant: "destructive",
            });
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => setOpen(true), children: [_jsx(Link2, { className: "h-4 w-4 mr-2" }), "Conectar Bloques (", currentConnections.length, ")"] }), _jsx(Dialog, { open: open, onOpenChange: setOpen, children: _jsxs(DialogContent, { className: "max-w-lg", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Target, { className: "h-5 w-5" }), "Conectar Bloques a Meta"] }), _jsxs(DialogDescription, { children: ["Selecciona los bloques de rutina que contribuyen a: ", _jsx("strong", { children: goalTitle })] })] }), _jsx("div", { className: "space-y-4 max-h-96 overflow-y-auto", children: availableBlocks.map((block) => (_jsxs("div", { className: "flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors", children: [_jsx(Checkbox, { id: `block-${block.id}`, checked: selectedBlocks.includes(block.id), onCheckedChange: () => handleToggle(block.id) }), _jsx(Label, { htmlFor: `block-${block.id}`, className: "flex-1 cursor-pointer", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "font-medium", children: block.title }), block.duration && (_jsxs("span", { className: "text-sm text-muted-foreground", children: [block.duration, " min"] }))] }) })] }, block.id))) }), _jsxs("div", { className: "flex justify-end gap-2 pt-4 border-t", children: [_jsx(Button, { variant: "outline", onClick: () => setOpen(false), children: "Cancelar" }), _jsx(Button, { onClick: handleSave, disabled: saving, children: saving ? "Guardando..." : "Guardar Conexiones" })] })] }) })] }));
}
