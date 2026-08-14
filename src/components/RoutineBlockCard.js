import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Flame, Trophy, Clock, ImagePlus, X, ListPlus, BookOpen, Briefcase, FolderKanban, ListTodo, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImageUpload } from "@/hooks/useImageUpload";
import { BlockTaskAssigner } from "@/components/routine/BlockTaskAssigner";
import { BlockFocusSelector, BlockTypeIndicator, getFocusColor } from "@/components/routine/BlockFocusSelector";
import { SubBlockDivider } from "@/components/routine/SubBlockDivider";
import { LanguageBlockManager } from "@/components/language/LanguageBlockManager";
const getSourceIcon = (source) => {
    switch (source) {
        case "university":
            return _jsx(BookOpen, { className: "h-3 w-3" });
        case "entrepreneurship":
            return _jsx(Briefcase, { className: "h-3 w-3" });
        case "project":
            return _jsx(FolderKanban, { className: "h-3 w-3" });
        default:
            return _jsx(ListTodo, { className: "h-3 w-3" });
    }
};
export const RoutineBlockCard = ({ block, onUpdate, onComplete, dailyTasks = [], onAssignTasks, onToggleTaskComplete }) => {
    const [specificTask, setSpecificTask] = useState(block.specificTask || "");
    const [completedGenericTasks, setCompletedGenericTasks] = useState(new Set());
    const [timeProgress, setTimeProgress] = useState(0);
    const [coverImage, setCoverImage] = useState(block.coverImage || "");
    const [effortLevel, setEffortLevel] = useState(block.effortLevel || "normal");
    const [showTaskAssigner, setShowTaskAssigner] = useState(false);
    const fileInputRef = useRef(null);
    const { uploadImage, uploading } = useImageUpload();
    // Get tasks assigned to this block
    const assignedTasks = dailyTasks.filter(t => t.routine_block_id === block.id);
    useEffect(() => {
        const calculateProgress = () => {
            const now = new Date();
            const [startHour, startMin] = block.startTime.split(':').map(Number);
            const [endHour, endMin] = block.endTime.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            if (currentMinutes < startMinutes)
                return 0;
            if (currentMinutes > endMinutes)
                return 100;
            const totalDuration = endMinutes - startMinutes;
            const activeDuration = block.isHalfTime ? totalDuration / 2 : totalDuration;
            const elapsed = currentMinutes - startMinutes;
            // If in half time mode and past the active duration, cap at 50%
            if (block.isHalfTime && elapsed > activeDuration) {
                return 50;
            }
            const progress = ((elapsed) / (totalDuration)) * 100;
            return Math.min(100, Math.max(0, progress));
        };
        setTimeProgress(calculateProgress());
        const interval = setInterval(() => {
            setTimeProgress(calculateProgress());
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [block.startTime, block.endTime, block.isHalfTime]);
    const toggleGenericTask = (index) => {
        const newCompleted = new Set(completedGenericTasks);
        if (newCompleted.has(index)) {
            newCompleted.delete(index);
        }
        else {
            newCompleted.add(index);
        }
        setCompletedGenericTasks(newCompleted);
    };
    const handleSpecificTaskChange = (value) => {
        setSpecificTask(value);
        onUpdate({ ...block, specificTask: value });
    };
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = await uploadImage(file, 'routine-blocks');
            if (imageUrl) {
                setCoverImage(imageUrl);
                onUpdate({ ...block, coverImage: imageUrl });
            }
        }
    };
    const setEffortLevelHandler = (level) => {
        setEffortLevel(level || "normal");
        onUpdate({ ...block, effortLevel: level });
    };
    const removeCoverImage = () => {
        setCoverImage("");
        onUpdate({ ...block, coverImage: "" });
    };
    const isBlockComplete = () => {
        const hasSpecificTask = specificTask.trim() !== "";
        const allGenericComplete = !block.genericTasks ||
            block.genericTasks.length === 0 ||
            completedGenericTasks.size === block.genericTasks.length;
        return hasSpecificTask && allGenericComplete;
    };
    const getBorderColor = () => {
        const today = new Date().getDay();
        const dayIndex = today === 0 ? 6 : today - 1;
        const isNotDone = block.notDone?.[dayIndex] || false;
        if (isNotDone)
            return "border-red-500";
        // Use focus color for configurable/dynamic blocks
        const focus = block.currentFocus || block.defaultFocus;
        if (focus && focus !== 'none' && (block.blockType === 'configurable' || block.blockType === 'dinamico')) {
            return getFocusColor(focus);
        }
        switch (effortLevel) {
            case "minimum":
                return "border-blue-500";
            case "normal":
                return "border-green-500";
            case "maximum":
                return "border-yellow-500";
            default:
                return "border-border";
        }
    };
    const handleMarkNotDone = () => {
        const today = new Date().getDay();
        const dayIndex = today === 0 ? 6 : today - 1;
        const newNotDone = [...(block.notDone || [false, false, false, false, false, false, false])];
        const isCurrentlyNotDone = newNotDone[dayIndex];
        // Toggle the not done status
        newNotDone[dayIndex] = !isCurrentlyNotDone;
        const newWeekly = [...block.weeklyCompletion];
        if (!isCurrentlyNotDone) {
            // Marking as not done, so remove completion
            newWeekly[dayIndex] = false;
        }
        onUpdate({
            ...block,
            notDone: newNotDone,
            weeklyCompletion: newWeekly,
            effortLevel: !isCurrentlyNotDone ? undefined : block.effortLevel, // Reset effort level when marking as not done
        });
    };
    const isMarkedNotDone = () => {
        const today = new Date().getDay();
        const dayIndex = today === 0 ? 6 : today - 1;
        return block.notDone?.[dayIndex] || false;
    };
    return (_jsxs(Card, { className: cn("hover:shadow-lg transition-all overflow-hidden border-2", getBorderColor()), children: [coverImage && (_jsxs("div", { className: "relative w-full h-32 overflow-hidden", children: [_jsx("img", { src: coverImage, alt: `${block.title} cover`, className: "w-full h-full object-cover" }), _jsx(Button, { variant: "destructive", size: "icon", className: "absolute top-2 right-2 h-6 w-6", onClick: removeCoverImage, children: _jsx(X, { className: "h-4 w-4" }) })] })), _jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CardTitle, { className: "text-xl", children: block.title }), block.blockType && (_jsx(BlockTypeIndicator, { blockType: block.blockType, emergencyOnly: block.emergencyOnly }))] }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx(Clock, { className: "h-4 w-4" }), _jsxs("span", { children: [block.startTime, " - ", block.endTime] }), block.notes && (_jsxs("span", { className: "text-xs text-amber-500 flex items-center gap-1", children: [_jsx(AlertTriangle, { className: "h-3 w-3" }), "Nota"] }))] }), block.notes && (_jsx("p", { className: "text-xs text-muted-foreground italic bg-muted/50 p-2 rounded-md mt-2", children: block.notes }))] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Badge, { variant: "outline", className: "flex items-center gap-1", children: [_jsx(Flame, { className: "h-4 w-4 text-orange-500" }), block.currentStreak] }), _jsxs(Badge, { variant: "outline", className: "flex items-center gap-1", children: [_jsx(Trophy, { className: "h-4 w-4 text-yellow-500" }), block.maxStreak] })] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [(block.blockType === 'configurable' || block.blockType === 'dinamico' || block.blockType === 'evitar') && (_jsx(BlockFocusSelector, { currentFocus: (block.currentFocus || block.defaultFocus || 'none'), defaultFocus: (block.defaultFocus || 'none'), blockType: (block.blockType || 'fijo'), emergencyOnly: block.emergencyOnly, onFocusChange: (focus) => onUpdate({ ...block, currentFocus: focus }) })), (block.id === '2' || block.title.toLowerCase().includes('idiomas')) && (_jsx(LanguageBlockManager, { blockDurationMinutes: (() => {
                            const [startH, startM] = block.startTime.split(':').map(Number);
                            const [endH, endM] = block.endTime.split(':').map(Number);
                            return (endH * 60 + endM) - (startH * 60 + startM);
                        })(), startTime: block.startTime, endTime: block.endTime })), block.canSubdivide && !(block.id === '2' || block.title.toLowerCase().includes('idiomas')) && (_jsx(SubBlockDivider, { canSubdivide: block.canSubdivide, subBlocks: block.subBlocks || [], totalDuration: (() => {
                            const [startH, startM] = block.startTime.split(':').map(Number);
                            const [endH, endM] = block.endTime.split(':').map(Number);
                            return (endH * 60 + endM) - (startH * 60 + startM);
                        })(), onSubBlocksChange: (subBlocks) => onUpdate({ ...block, subBlocks }), onToggleSubBlockComplete: (subBlockId) => {
                            const updated = (block.subBlocks || []).map(sb => sb.id === subBlockId ? { ...sb, completed: !sb.completed } : sb);
                            onUpdate({ ...block, subBlocks: updated });
                        } })), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Nivel de Esfuerzo" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: effortLevel === "minimum" ? "default" : "outline", size: "sm", onClick: () => setEffortLevelHandler(effortLevel === "minimum" ? undefined : "minimum"), className: cn("flex-1", effortLevel === "minimum" && "bg-blue-500 hover:bg-blue-600"), children: "M\u00EDnimo" }), _jsx(Button, { variant: effortLevel === "normal" ? "default" : "outline", size: "sm", onClick: () => setEffortLevelHandler(effortLevel === "normal" ? undefined : "normal"), className: cn("flex-1", effortLevel === "normal" && "bg-green-500 hover:bg-green-600"), children: "Normal" }), _jsx(Button, { variant: effortLevel === "maximum" ? "default" : "outline", size: "sm", onClick: () => setEffortLevelHandler(effortLevel === "maximum" ? undefined : "maximum"), className: cn("flex-1", effortLevel === "maximum" && "bg-yellow-500 hover:bg-yellow-600"), children: "M\u00E1ximo" })] })] }), !coverImage && (_jsxs("div", { children: [_jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleImageUpload, className: "hidden" }), _jsxs(Button, { variant: "outline", onClick: () => fileInputRef.current?.click(), className: "w-full", children: [_jsx(ImagePlus, { className: "h-4 w-4 mr-2" }), "Agregar Portada"] })] })), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm text-muted-foreground", children: [_jsxs("span", { children: ["Progreso en tiempo real ", block.isHalfTime && "(Modo reducido)"] }), _jsxs("span", { children: [Math.round(timeProgress), "%"] })] }), block.isHalfTime ? (_jsxs("div", { className: "relative h-2 w-full overflow-hidden rounded-full bg-secondary", children: [_jsx("div", { className: "absolute h-full bg-primary transition-all", style: {
                                            width: `${Math.min(timeProgress * 2, 50)}%`,
                                            left: 0
                                        } }), _jsx("div", { className: "absolute h-full bg-blue-500/50 transition-all", style: {
                                            width: '50%',
                                            left: '50%'
                                        } })] })) : (_jsx(Progress, { value: timeProgress, className: "h-2" }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Tarea Espec\u00EDfica del Bloque" }), _jsx(Input, { value: specificTask, onChange: (e) => handleSpecificTaskChange(e.target.value), placeholder: "\u00BFCu\u00E1l es tu prioridad en este bloque?", className: "w-full" })] }), dailyTasks.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-sm font-medium", children: "Tareas Asignadas" }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowTaskAssigner(true), children: [_jsx(ListPlus, { className: "h-4 w-4 mr-1" }), "Asignar"] })] }), assignedTasks.length === 0 ? (_jsx("p", { className: "text-xs text-muted-foreground py-2", children: "Sin tareas asignadas a este bloque" })) : (_jsx("div", { className: "space-y-2", children: assignedTasks.map((task) => (_jsxs("div", { className: "flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer border border-border", onClick: () => onToggleTaskComplete?.(task.id), children: [_jsx(Checkbox, { checked: task.completed, onCheckedChange: () => onToggleTaskComplete?.(task.id) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: cn("text-sm block truncate", task.completed && "line-through text-muted-foreground"), children: task.title }), _jsxs(Badge, { variant: "outline", className: "text-xs mt-1", children: [getSourceIcon(task.source), _jsx("span", { className: "ml-1", children: task.sourceName || task.source })] })] })] }, task.id))) }))] })), block.genericTasks && block.genericTasks.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Tareas del Bloque" }), _jsx("div", { className: "space-y-2", children: block.genericTasks.map((task, index) => (_jsxs("div", { className: "flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer", onClick: () => toggleGenericTask(index), children: [_jsx(Checkbox, { checked: completedGenericTasks.has(index), onCheckedChange: () => toggleGenericTask(index) }), _jsx("span", { className: cn("text-sm", completedGenericTasks.has(index) && "line-through text-muted-foreground"), children: task })] }, index))) })] })), _jsx(BlockTaskAssigner, { open: showTaskAssigner, onOpenChange: setShowTaskAssigner, blockId: block.id, blockTitle: block.title, dailyTasks: dailyTasks, onAssignTasks: (taskIds) => onAssignTasks?.(block.id, taskIds) }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Esta Semana" }), _jsx("div", { className: "flex gap-2", children: ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => (_jsx("div", { className: cn("w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium border-2", block.weeklyCompletion[index]
                                        ? "bg-green-500 border-green-600 text-white"
                                        : "bg-red-500 border-red-600 text-white"), children: day }, day))) })] }), _jsxs(Button, { onClick: handleMarkNotDone, className: "w-full", variant: isMarkedNotDone() ? "outline" : "destructive", children: [_jsx(X, { className: "h-4 w-4 mr-2" }), isMarkedNotDone() ? "Desmarcar: No lo hice" : "No lo hice"] }), _jsxs(Button, { onClick: onComplete, disabled: !isBlockComplete(), className: "w-full", variant: isBlockComplete() ? "default" : "outline", children: [_jsx(CheckCircle2, { className: "h-4 w-4 mr-2" }), "Marcar Bloque Completo"] })] })] }));
};
