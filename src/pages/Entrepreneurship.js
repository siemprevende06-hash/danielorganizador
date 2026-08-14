import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Plus, Rocket, CheckCircle2, ListTodo, DollarSign, Edit3, Trash2, ImagePlus, Loader2, X, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useActiveSelections } from '@/hooks/useActiveSelections';
import { cn } from '@/lib/utils';
export default function EntrepreneurshipPage() {
    const [entrepreneurships, setEntrepreneurships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [coverImage, setCoverImage] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const fileInputRef = useRef(null);
    const { uploadImage, uploading } = useImageUpload();
    const navigate = useNavigate();
    const { values: activeEntIds, toggle: toggleActiveEnt } = useActiveSelections('activeEntrepreneurships');
    useEffect(() => { load(); }, []);
    const load = async () => {
        try {
            const { data, error } = await supabase
                .from('entrepreneurships').select('*').order('created_at');
            if (error)
                throw error;
            const enriched = await Promise.all((data || []).map(async (e) => {
                const [{ count: taskCount }, { count: completedCount }, { data: incomeData }] = await Promise.all([
                    supabase.from('entrepreneurship_tasks').select('*', { count: 'exact', head: true }).eq('entrepreneurship_id', e.id),
                    supabase.from('entrepreneurship_tasks').select('*', { count: 'exact', head: true }).eq('entrepreneurship_id', e.id).eq('completed', true),
                    supabase.from('entrepreneurship_income').select('amount').eq('entrepreneurship_id', e.id),
                ]);
                const totalIncome = (incomeData || []).reduce((s, r) => s + Number(r.amount), 0);
                return { ...e, taskCount: taskCount || 0, completedCount: completedCount || 0, totalIncome };
            }));
            setEntrepreneurships(enriched);
        }
        catch {
            toast.error('Error al cargar');
        }
        finally {
            setLoading(false);
        }
    };
    const save = async () => {
        if (!name.trim()) {
            toast.error('Nombre requerido');
            return;
        }
        try {
            let coverUrl = coverImage;
            if (coverFile) {
                const url = await uploadImage(coverFile, 'entrepreneurship');
                if (url)
                    coverUrl = url;
            }
            const payload = {
                name: name.trim(),
                description: description.trim() || null,
                cover_image: coverUrl,
            };
            if (editingId) {
                const { error } = await supabase.from('entrepreneurships')
                    .update(payload).eq('id', editingId);
                if (error)
                    throw error;
                toast.success('Emprendimiento actualizado');
            }
            else {
                const { error } = await supabase.from('entrepreneurships')
                    .insert(payload);
                if (error)
                    throw error;
                toast.success('Emprendimiento creado');
            }
            setDialogOpen(false);
            setEditingId(null);
            setName('');
            setDescription('');
            setCoverImage(null);
            setCoverFile(null);
            load();
        }
        catch {
            toast.error('Error al guardar');
        }
    };
    const deleteEntrepreneurship = async (id, e) => {
        e.stopPropagation();
        try {
            const { error } = await supabase.from('entrepreneurships').delete().eq('id', id);
            if (error)
                throw error;
            setEntrepreneurships(prev => prev.filter(x => x.id !== id));
            toast.success('Eliminado');
        }
        catch {
            toast.error('Error al eliminar');
        }
    };
    const openEdit = (ent, e) => {
        e.stopPropagation();
        setEditingId(ent.id);
        setName(ent.name);
        setDescription(ent.description || '');
        setCoverImage(ent.cover_image);
        setCoverFile(null);
        setDialogOpen(true);
    };
    const totalIncome = entrepreneurships.reduce((s, e) => s + (e.totalIncome || 0), 0);
    const totalTasks = entrepreneurships.reduce((s, e) => s + (e.taskCount || 0), 0);
    const totalCompleted = entrepreneurships.reduce((s, e) => s + (e.completedCount || 0), 0);
    if (loading) {
        return (_jsx("div", { className: "container mx-auto px-4 pt-20 pb-8 flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }));
    }
    return (_jsxs("div", { className: "container mx-auto px-4 pt-20 pb-24 space-y-5", style: { paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 4rem))' }, children: [_jsxs("header", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-foreground flex items-center gap-2", children: [_jsx(Rocket, { className: "h-7 w-7 text-primary" }), "Emprendimientos"] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [entrepreneurships.length, " proyecto", entrepreneurships.length !== 1 ? 's' : ''] })] }), _jsxs(Button, { size: "sm", className: "gap-1.5", onClick: () => { setEditingId(null); setName(''); setDescription(''); setCoverImage(null); setCoverFile(null); setDialogOpen(true); }, children: [_jsx(Plus, { className: "h-4 w-4" }), _jsx("span", { className: "hidden sm:inline", children: "Nuevo" })] })] }), entrepreneurships.length > 0 && (_jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(Card, { className: "bg-card border-border", children: _jsxs(CardContent, { className: "p-3 text-center", children: [_jsx(ListTodo, { className: "h-5 w-5 mx-auto text-primary mb-1" }), _jsxs("div", { className: "text-xl font-bold text-foreground", children: [totalCompleted, "/", totalTasks] }), _jsx("div", { className: "text-[10px] text-muted-foreground", children: "Tareas" })] }) }), _jsx(Card, { className: "bg-card border-border", children: _jsxs(CardContent, { className: "p-3 text-center", children: [_jsx(CheckCircle2, { className: "h-5 w-5 mx-auto text-green-500 mb-1" }), _jsxs("div", { className: "text-xl font-bold text-foreground", children: [totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0, "%"] }), _jsx("div", { className: "text-[10px] text-muted-foreground", children: "Completado" })] }) }), _jsx(Card, { className: "bg-card border-border", children: _jsxs(CardContent, { className: "p-3 text-center", children: [_jsx(DollarSign, { className: "h-5 w-5 mx-auto text-yellow-500 mb-1" }), _jsxs("div", { className: "text-xl font-bold text-foreground", children: ["$", totalIncome.toLocaleString()] }), _jsx("div", { className: "text-[10px] text-muted-foreground", children: "Ingresos" })] }) })] })), _jsx("div", { className: "space-y-3", children: entrepreneurships.map(ent => {
                    const progress = ent.taskCount ? Math.round(((ent.completedCount || 0) / ent.taskCount) * 100) : 0;
                    return (_jsx(Card, { className: cn("cursor-pointer border-border hover:border-primary/50 transition-all active:scale-[0.99]", activeEntIds.includes(ent.id) && "ring-2 ring-primary"), onClick: () => navigate(`/entrepreneurship/${ent.id}`), children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden", children: ent.cover_image ? (_jsx("img", { src: ent.cover_image, alt: ent.name, className: "w-full h-full object-cover" })) : (_jsx(Briefcase, { className: "h-6 w-6 text-primary" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-semibold text-foreground truncate", children: ent.name }), _jsxs("div", { className: "flex gap-1 flex-shrink-0 ml-2", children: [_jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: (e) => { e.stopPropagation(); toggleActiveEnt(ent.id); }, title: activeEntIds.includes(ent.id) ? "Quitar activo" : "Marcar activo", children: _jsx(Star, { className: cn("h-3.5 w-3.5", activeEntIds.includes(ent.id) ? "fill-primary text-primary" : "text-muted-foreground") }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: (e) => openEdit(ent, e), children: _jsx(Edit3, { className: "h-3.5 w-3.5 text-muted-foreground" }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-7 w-7 p-0", onClick: (e) => deleteEntrepreneurship(ent.id, e), children: _jsx(Trash2, { className: "h-3.5 w-3.5 text-destructive" }) })] })] }), ent.description && (_jsx("p", { className: "text-xs text-muted-foreground line-clamp-1 mt-0.5", children: ent.description })), _jsxs("div", { className: "flex items-center gap-3 mt-2", children: [_jsxs(Badge, { variant: "secondary", className: "text-[10px] gap-1", children: [_jsx(ListTodo, { className: "h-3 w-3" }), ent.completedCount, "/", ent.taskCount] }), (ent.totalIncome || 0) > 0 && (_jsxs(Badge, { variant: "secondary", className: "text-[10px] gap-1", children: [_jsx(DollarSign, { className: "h-3 w-3" }), "$", ent.totalIncome?.toLocaleString()] })), _jsx("div", { className: "flex-1 h-1.5 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-primary rounded-full transition-all", style: { width: `${progress}%` } }) }), _jsxs("span", { className: "text-[10px] font-medium text-muted-foreground", children: [progress, "%"] })] })] })] }) }) }, ent.id));
                }) }), entrepreneurships.length === 0 && (_jsx(Card, { className: "border-dashed border-border", children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx(Rocket, { className: "h-10 w-10 text-muted-foreground mb-3" }), _jsx("h3", { className: "font-medium mb-1", children: "Sin emprendimientos" }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Crea tu primer proyecto" }), _jsxs(Button, { onClick: () => setDialogOpen(true), children: [_jsx(Plus, { className: "h-4 w-4 mr-1.5" }), " Crear emprendimiento"] })] }) })), _jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { children: [editingId ? 'Editar' : 'Nuevo', " Emprendimiento"] }) }), _jsxs("div", { className: "space-y-3 mt-3", children: [_jsx(Input, { placeholder: "Nombre", value: name, onChange: e => setName(e.target.value) }), _jsx(Textarea, { placeholder: "Descripci\u00F3n (opcional)", value: description, onChange: e => setDescription(e.target.value), rows: 2 }), _jsx("div", { className: "space-y-2", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0 border border-border", children: (coverFile || coverImage) ? (_jsx("img", { src: coverFile ? URL.createObjectURL(coverFile) : coverImage, alt: "Portada", className: "w-full h-full object-cover" })) : (_jsx(Briefcase, { className: "h-6 w-6 text-muted-foreground" })) }), _jsxs("div", { className: "flex flex-col gap-1.5", children: [_jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", className: "hidden", onChange: (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file)
                                                                setCoverFile(file);
                                                        } }), _jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => fileInputRef.current?.click(), disabled: uploading, children: [uploading ? (_jsx(Loader2, { className: "h-4 w-4 mr-1 animate-spin" })) : (_jsx(ImagePlus, { className: "h-4 w-4 mr-1" })), coverImage || coverFile ? 'Cambiar portada' : 'Subir portada'] }), (coverImage || coverFile) && (_jsxs(Button, { type: "button", variant: "ghost", size: "sm", className: "text-destructive h-7", onClick: () => { setCoverImage(null); setCoverFile(null); if (fileInputRef.current)
                                                            fileInputRef.current.value = ''; }, children: [_jsx(X, { className: "h-3.5 w-3.5 mr-1" }), "Eliminar portada"] }))] })] }) }), _jsxs(Button, { onClick: save, className: "w-full", disabled: uploading, children: [uploading && _jsx(Loader2, { className: "h-4 w-4 mr-1 animate-spin" }), editingId ? 'Guardar' : 'Crear'] })] })] }) })] }));
}
