import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ImagePlus, Plus, X, ListTodo, Target, ExternalLink } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useGoalProgress } from '@/hooks/useGoalProgress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
const VISION_GOALS_KEY = 'visionGoalsBoard';
// Map area_ids to categories
const AREA_TO_CATEGORY = {
    'emprendimiento': 'professional',
    'universidad': 'professional',
    'finanzas': 'professional',
    'salud': 'hobbiesFisicos',
    'hobbies': 'hobbiesArtisticos',
    'desarrollo-personal': 'hobbiesIntelectuales',
};
export const VisionGoalsBoard = () => {
    const fileInputRefs = useRef({});
    const { uploadImage, uploading } = useImageUpload();
    const { goals: dbGoals, loading, fetchGoals, fetchGoalTasks, updateGoalProgress } = useGoalProgress();
    const { toast } = useToast();
    const [goalTasks, setGoalTasks] = useState(new Map());
    const [newTaskInputs, setNewTaskInputs] = useState({});
    const [visionCards, setVisionCards] = useState({
        professional: [
            { id: 'prof-1', completionLevel: 'none' },
            { id: 'prof-2', completionLevel: 'none' },
            { id: 'prof-3', completionLevel: 'none' },
        ],
        hobbiesArtisticos: [
            { id: 'hobby-art-1', completionLevel: 'none' },
            { id: 'hobby-art-2', completionLevel: 'none' },
            { id: 'hobby-art-3', completionLevel: 'none' },
        ],
        hobbiesIntelectuales: [
            { id: 'hobby-int-1', completionLevel: 'none' },
            { id: 'hobby-int-2', completionLevel: 'none' },
            { id: 'hobby-int-3', completionLevel: 'none' },
        ],
        hobbiesFisicos: [
            { id: 'hobby-fis-1', completionLevel: 'none' },
            { id: 'hobby-fis-2', completionLevel: 'none' },
            { id: 'hobby-fis-3', completionLevel: 'none' },
        ],
    });
    // Load vision cards from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(VISION_GOALS_KEY);
        if (stored) {
            setVisionCards(JSON.parse(stored));
        }
    }, []);
    // Save vision cards to localStorage
    useEffect(() => {
        localStorage.setItem(VISION_GOALS_KEY, JSON.stringify(visionCards));
    }, [visionCards]);
    // Fetch tasks for all goals
    useEffect(() => {
        if (dbGoals.length > 0) {
            dbGoals.forEach(async (goal) => {
                const tasks = await fetchGoalTasks(goal.id);
                setGoalTasks(prev => new Map(prev).set(goal.id, tasks));
            });
        }
    }, [dbGoals]);
    const handleImageUpload = async (category, id, file) => {
        const imageUrl = await uploadImage(file, `vision-goals/${category}`);
        if (imageUrl) {
            setVisionCards(prev => ({
                ...prev,
                [category]: prev[category].map(card => card.id === id ? { ...card, image: imageUrl } : card),
            }));
        }
    };
    const updateCompletionLevel = (category, id, level) => {
        setVisionCards(prev => ({
            ...prev,
            [category]: prev[category].map(card => card.id === id ? { ...card, completionLevel: level } : card),
        }));
    };
    const linkGoalToCard = (category, cardId, goalId) => {
        setVisionCards(prev => ({
            ...prev,
            [category]: prev[category].map(card => card.id === cardId ? { ...card, goalId } : card),
        }));
    };
    const addTaskToGoal = async (goalId) => {
        const title = newTaskInputs[goalId]?.trim();
        if (!title)
            return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({
                    title: "Error",
                    description: "Debes iniciar sesión para agregar tareas",
                    variant: "destructive",
                });
                return;
            }
            const { error } = await supabase
                .from('goal_tasks')
                .insert({
                goal_id: goalId,
                user_id: user.id,
                title,
                completed: false,
            });
            if (error)
                throw error;
            // Refresh tasks
            const tasks = await fetchGoalTasks(goalId);
            setGoalTasks(prev => new Map(prev).set(goalId, tasks));
            await updateGoalProgress(goalId);
            fetchGoals();
            setNewTaskInputs(prev => ({ ...prev, [goalId]: '' }));
            toast({
                title: "Tarea agregada",
                description: "Nueva tarea añadida a la meta",
            });
        }
        catch (error) {
            console.error('Error adding task:', error);
            toast({
                title: "Error",
                description: "No se pudo agregar la tarea",
                variant: "destructive",
            });
        }
    };
    const toggleTask = async (goalId, task) => {
        try {
            const { error } = await supabase
                .from('goal_tasks')
                .update({ completed: !task.completed })
                .eq('id', task.id);
            if (error)
                throw error;
            // Refresh tasks
            const tasks = await fetchGoalTasks(goalId);
            setGoalTasks(prev => new Map(prev).set(goalId, tasks));
            await updateGoalProgress(goalId);
            fetchGoals();
        }
        catch (error) {
            console.error('Error toggling task:', error);
        }
    };
    const deleteTask = async (goalId, taskId) => {
        try {
            const { error } = await supabase
                .from('goal_tasks')
                .delete()
                .eq('id', taskId);
            if (error)
                throw error;
            // Refresh tasks
            const tasks = await fetchGoalTasks(goalId);
            setGoalTasks(prev => new Map(prev).set(goalId, tasks));
            await updateGoalProgress(goalId);
            fetchGoals();
            toast({
                title: "Tarea eliminada",
            });
        }
        catch (error) {
            console.error('Error deleting task:', error);
        }
    };
    const getCardColor = (level) => {
        switch (level) {
            case 'none':
                return 'bg-red-500/10 border-red-500 border-2';
            case 'minimum':
                return 'bg-yellow-500/10 border-yellow-500 border-2';
            case 'normal':
                return 'bg-blue-500/10 border-blue-500 border-2';
            case 'maximum':
                return 'bg-green-500/10 border-green-500 border-2';
            default:
                return 'bg-card border-border';
        }
    };
    const getUnlinkedGoals = (category) => {
        const linkedGoalIds = new Set(Object.values(visionCards).flat().filter(c => c.goalId).map(c => c.goalId));
        return dbGoals.filter(goal => !linkedGoalIds.has(goal.id));
    };
    const renderGoalCard = (card, category) => {
        const linkedGoal = card.goalId ? dbGoals.find(g => g.id === card.goalId) : null;
        const tasks = linkedGoal ? goalTasks.get(linkedGoal.id) || [] : [];
        const completedTasks = tasks.filter(t => t.completed).length;
        const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
        const unlinkedGoals = getUnlinkedGoals(category);
        return (_jsx(Card, { className: cn("transition-all overflow-hidden", getCardColor(card.completionLevel)), children: _jsxs(CardContent, { className: "p-0", children: [_jsxs("div", { className: "relative aspect-square cursor-pointer bg-muted hover:bg-muted/80 transition-colors", onClick: () => !uploading && fileInputRefs.current[card.id]?.click(), children: [uploading ? (_jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center text-muted-foreground", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }), _jsx("span", { className: "text-xs mt-2", children: "Subiendo..." })] })) : card.image ? (_jsx("img", { src: card.image, alt: "Vision goal", className: "w-full h-full object-cover" })) : (_jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center text-muted-foreground", children: [_jsx(ImagePlus, { className: "h-8 w-8 mb-2" }), _jsx("span", { className: "text-xs", children: "Subir imagen" })] })), _jsx("input", { ref: (el) => (fileInputRefs.current[card.id] = el), type: "file", accept: "image/*", className: "hidden", onChange: (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        handleImageUpload(category, card.id, file);
                                    }
                                } })] }), _jsx("div", { className: "p-3 space-y-2 border-b border-border/50", children: linkedGoal ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h4", { className: "font-semibold text-sm truncate flex-1", children: linkedGoal.title }), _jsx(Link, { to: "/goals", children: _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", children: _jsx(ExternalLink, { className: "h-3 w-3" }) }) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Progress, { value: progress, className: "h-2 flex-1" }), _jsxs("span", { className: "text-xs font-medium", children: [progress, "%"] })] }), linkedGoal.target_date && (_jsxs(Badge, { variant: "outline", className: "text-xs", children: ["Meta: ", new Date(linkedGoal.target_date).toLocaleDateString()] }))] })) : (_jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [_jsx(Target, { className: "h-3 w-3" }), "Vincular meta"] }), unlinkedGoals.length > 0 ? (_jsxs("select", { className: "w-full text-xs p-2 rounded border border-border bg-background", onChange: (e) => {
                                        if (e.target.value) {
                                            linkGoalToCard(category, card.id, e.target.value);
                                        }
                                    }, defaultValue: "", children: [_jsx("option", { value: "", children: "Seleccionar meta..." }), unlinkedGoals.map(goal => (_jsx("option", { value: goal.id, children: goal.title }, goal.id)))] })) : (_jsx(Link, { to: "/goals", className: "text-xs text-primary hover:underline", children: "Crear meta \u2192" }))] })) }), _jsx("div", { className: "p-3 space-y-2", children: _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx(Button, { size: "sm", variant: card.completionLevel === 'none' ? 'default' : 'outline', onClick: () => updateCompletionLevel(category, card.id, 'none'), className: cn("text-xs", card.completionLevel === 'none' && "bg-red-500 hover:bg-red-600 text-white"), children: "No Hecho" }), _jsx(Button, { size: "sm", variant: card.completionLevel === 'minimum' ? 'default' : 'outline', onClick: () => updateCompletionLevel(category, card.id, 'minimum'), className: cn("text-xs", card.completionLevel === 'minimum' && "bg-yellow-500 hover:bg-yellow-600 text-white"), children: "M\u00EDnimo" }), _jsx(Button, { size: "sm", variant: card.completionLevel === 'normal' ? 'default' : 'outline', onClick: () => updateCompletionLevel(category, card.id, 'normal'), className: cn("text-xs", card.completionLevel === 'normal' && "bg-blue-500 hover:bg-blue-600 text-white"), children: "Normal" }), _jsx(Button, { size: "sm", variant: card.completionLevel === 'maximum' ? 'default' : 'outline', onClick: () => updateCompletionLevel(category, card.id, 'maximum'), className: cn("text-xs", card.completionLevel === 'maximum' && "bg-green-500 hover:bg-green-600 text-white"), children: "M\u00E1ximo" })] }) }), linkedGoal && (_jsxs("div", { className: "px-3 pb-3 space-y-2 border-t border-border/50 pt-3", children: [_jsx("div", { className: "flex items-center justify-between text-sm font-medium text-muted-foreground", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ListTodo, { className: "h-4 w-4" }), _jsxs("span", { children: ["Tareas (", completedTasks, "/", tasks.length, ")"] })] }) }), _jsx("div", { className: "space-y-1 max-h-32 overflow-y-auto", children: tasks.map(task => (_jsxs("div", { className: "flex items-center gap-2 group", children: [_jsx(Checkbox, { checked: task.completed, onCheckedChange: () => toggleTask(linkedGoal.id, task), className: "h-4 w-4" }), _jsx("span", { className: cn("text-xs flex-1", task.completed && "line-through text-muted-foreground"), children: task.title }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity", onClick: () => deleteTask(linkedGoal.id, task.id), children: _jsx(X, { className: "h-3 w-3" }) })] }, task.id))) }), _jsxs("div", { className: "flex gap-1", children: [_jsx(Input, { placeholder: "Nueva tarea...", value: newTaskInputs[linkedGoal.id] || '', onChange: (e) => setNewTaskInputs(prev => ({ ...prev, [linkedGoal.id]: e.target.value })), onKeyDown: (e) => e.key === 'Enter' && addTaskToGoal(linkedGoal.id), className: "text-xs h-7" }), _jsx(Button, { size: "icon", variant: "ghost", className: "h-7 w-7", onClick: () => addTaskToGoal(linkedGoal.id), children: _jsx(Plus, { className: "h-3 w-3" }) })] })] }))] }) }, card.id));
    };
    if (loading) {
        return _jsx("div", { className: "text-center py-8 text-muted-foreground", children: "Cargando metas..." });
    }
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-2xl font-bold", children: "Profesional-Acad\u00E9mico" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: visionCards.professional.map(card => renderGoalCard(card, 'professional')) })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-2xl font-bold", children: "Desarrollo Personal" }), _jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "text-base font-semibold text-muted-foreground", children: "Hobbies Art\u00EDsticos" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: visionCards.hobbiesArtisticos.map(card => renderGoalCard(card, 'hobbiesArtisticos')) })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "text-base font-semibold text-muted-foreground", children: "Hobbies Intelectuales" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: visionCards.hobbiesIntelectuales.map(card => renderGoalCard(card, 'hobbiesIntelectuales')) })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "text-base font-semibold text-muted-foreground", children: "Hobbies F\u00EDsicos" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: visionCards.hobbiesFisicos.map(card => renderGoalCard(card, 'hobbiesFisicos')) })] })] })] }));
};
