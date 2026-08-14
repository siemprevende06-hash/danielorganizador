import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useRecompensas } from "@/hooks/useRecompensas";
import { CATEGORIAS } from "@/data/recompensas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTimeframe } from "@/contexts/TimeframeContext";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import { Sparkles, ShoppingCart, History, Trophy, TrendingUp, Gift, ScrollText, Coins, Plus, Pencil, Trash2, } from "lucide-react";
const emptyForm = { nombre: "", descripcion: "", icono: "🎁", costo: 0, categoria: "ocio" };
export default function Recompensas() {
    const { timeframe, view } = useTimeframe();
    const { balance, canjes, scores, scoresLoading, dailyScore, catalogo, puntosGanadosHoy, puntosGastadosHoy, canjearRecompensa, guardarFeedback, agregarRecompensa, editarRecompensa, eliminarRecompensa, } = useRecompensas();
    const [filtro, setFiltro] = useState(null);
    const [mostrarCanjes, setMostrarCanjes] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [feedbackCanje, setFeedbackCanje] = useState(null);
    const [disfrute, setDisfrute] = useState(0);
    const [tiempo, setTiempo] = useState(0);
    const recompensasFiltradas = filtro
        ? catalogo.filter((r) => r.categoria === filtro)
        : catalogo;
    const totalGastado = canjes.reduce((sum, c) => sum + c.costo, 0);
    function abrirNueva() {
        setEditandoId(null);
        setForm(emptyForm);
        setDialogOpen(true);
    }
    function abrirEditar(r) {
        setEditandoId(r.id);
        setForm({ nombre: r.nombre, descripcion: r.descripcion, icono: r.icono, costo: r.costo, categoria: r.categoria });
        setDialogOpen(true);
    }
    function guardar() {
        if (!form.nombre.trim()) {
            toast({ title: "El nombre es obligatorio", variant: "destructive" });
            return;
        }
        if (form.costo <= 0) {
            toast({ title: "El costo debe ser mayor a 0", variant: "destructive" });
            return;
        }
        if (editandoId) {
            editarRecompensa(editandoId, form);
            toast({ title: "Recompensa actualizada" });
        }
        else {
            agregarRecompensa(form);
            toast({ title: "Recompensa creada" });
        }
        setDialogOpen(false);
    }
    function confirmarEliminar(id, nombre) {
        if (window.confirm(`¿Eliminar "${nombre}"?`)) {
            eliminarRecompensa(id);
            toast({ title: "Recompensa eliminada" });
        }
    }
    const handleCanjear = (id) => {
        const canje = canjearRecompensa(id);
        if (canje) {
            setDisfrute(0);
            setTiempo(0);
            setFeedbackCanje({ id: canje.id, nombre: canje.nombre, icono: canje.icono });
        }
        else {
            toast({ title: "Puntos insuficientes", description: "Sigue esforzándote para ganar más puntos.", variant: "destructive" });
        }
    };
    const guardarPreguntas = () => {
        if (!feedbackCanje)
            return;
        guardarFeedback(feedbackCanje.id, disfrute, tiempo);
        setFeedbackCanje(null);
        toast({ title: "Recompensa canjeada", description: "¡Disfrútala! Te lo has ganado." });
    };
    if (scoresLoading) {
        return (_jsxs("div", { className: "container mx-auto px-4 py-24 space-y-8", children: [_jsx(Skeleton, { className: "h-12 w-64 mx-auto" }), _jsx(Skeleton, { className: "h-32 w-full max-w-md mx-auto" }), _jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [1, 2, 3, 4, 5, 6].map((i) => (_jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsx(Skeleton, { className: "h-24 w-full" }) }) }, i))) })] }));
    }
    return (_jsxs("div", { className: "container mx-auto px-4 py-24 space-y-8", children: [_jsxs("header", { className: "text-center space-y-3", children: [_jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-full", children: [_jsx(Sparkles, { className: "h-5 w-5 text-amber-500" }), _jsx("span", { className: "font-semibold text-amber-500", children: "RECOMPENSAS" })] }), _jsx("h1", { className: "text-4xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent", children: "Tienda de Recompensas" }), _jsx("p", { className: "text-muted-foreground max-w-lg mx-auto", children: "Acumula puntos con tu esfuerzo diario y c\u00E1mbialos por ocio y recompensas." })] }), _jsx(TimeframeSelector, {}), _jsx("div", { className: "max-w-md mx-auto", children: _jsx(Card, { className: "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20 overflow-hidden", children: _jsxs(CardContent, { className: "p-6 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Coins, { className: "h-5 w-5 text-amber-500" }), _jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Tu saldo" })] }), _jsxs(Badge, { variant: "outline", className: "gap-1", children: [_jsx(History, { className: "h-3 w-3" }), totalGastado, " gastados"] })] }), _jsxs("div", { className: "text-center", children: [_jsx("span", { className: "text-5xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent", children: balance }), _jsx("span", { className: "text-xl text-muted-foreground ml-2", children: "pts" })] }), _jsxs("div", { className: "flex justify-center gap-4 text-sm", children: [_jsxs("div", { className: "text-center", children: [_jsxs("p", { className: "text-green-500 font-bold", children: ["+", puntosGanadosHoy] }), _jsx("p", { className: "text-muted-foreground text-xs", children: "hoy" })] }), _jsxs("div", { className: "text-center", children: [_jsxs("p", { className: "text-red-500 font-bold", children: ["-", puntosGastadosHoy] }), _jsx("p", { className: "text-muted-foreground text-xs", children: "gastados hoy" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-amber-500 font-bold", children: dailyScore.loading ? "..." : `${dailyScore.total}` }), _jsx("p", { className: "text-muted-foreground text-xs", children: "pts hoy" })] })] })] }) }) }), _jsxs(Card, { className: "border-amber-500/10", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [_jsx(TrendingUp, { className: "h-4 w-4 text-amber-500" }), "Composici\u00F3n del puntaje"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "text-center pb-2 border-b border-border/50", children: [_jsx("span", { className: "text-xs text-muted-foreground", children: "Puntaje de hoy" }), _jsx("div", { className: "text-3xl font-bold text-amber-500", children: dailyScore.loading ? "..." : `${dailyScore.total} pts` })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { children: "\uD83D\uDD04" }), _jsx("span", { className: "font-medium", children: "Sosten" }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: "10%" })] }), _jsxs("span", { className: "font-bold tabular-nums text-xs text-green-500", children: [dailyScore.sosten, "%"] })] }), _jsx("div", { className: "h-1.5 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full bg-green-500", style: { width: `${dailyScore.sosten}%` } }) }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "H\u00E1bitos y rutinas cumplidas" })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { children: "\uD83D\uDCC8" }), _jsx("span", { className: "font-medium", children: "Acumulativos" }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: "40%" })] }), _jsxs("span", { className: "font-bold tabular-nums text-xs text-blue-500", children: [dailyScore.acumulativos, "%"] })] }), _jsx("div", { className: "h-1.5 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full bg-blue-500", style: { width: `${dailyScore.acumulativos}%` } }) }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Gym, idiomas, lectura, ajedrez, piano, guitarra" })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { children: "\uD83C\uDFAF" }), _jsx("span", { className: "font-medium", children: "Focus" }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: "50%" })] }), _jsxs("span", { className: "font-bold tabular-nums text-xs text-purple-500", children: [dailyScore.focus, "%"] })] }), _jsx("div", { className: "h-1.5 bg-muted rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full bg-purple-500", style: { width: `${dailyScore.focus}%` } }) }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Universidad, emprendimiento, proyectos" })] }), _jsx("div", { className: "text-center pt-1", children: _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Sosten \u00D7 10% + Acumulativos \u00D7 40% + Focus \u00D7 50%" }) })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [_jsxs(Button, { variant: filtro === null ? "default" : "outline", size: "sm", onClick: () => setFiltro(null), className: "gap-1.5", children: [_jsx(Gift, { className: "h-4 w-4" }), "Todas"] }), CATEGORIAS.map((cat) => (_jsxs(Button, { variant: filtro === cat.key ? "default" : "outline", size: "sm", onClick: () => setFiltro(cat.key), className: "gap-1.5", children: [_jsx("span", { children: cat.icono }), cat.label] }, cat.key))), _jsxs(Button, { variant: mostrarCanjes ? "default" : "outline", size: "sm", onClick: () => setMostrarCanjes(!mostrarCanjes), className: "gap-1.5", children: [_jsx(ScrollText, { className: "h-4 w-4" }), "Historial"] }), _jsxs(Button, { size: "sm", onClick: abrirNueva, className: "gap-1.5 ml-auto", children: [_jsx(Plus, { className: "h-4 w-4" }), "Nueva"] })] }), mostrarCanjes ? (
            /* Redemption History */
            _jsxs("div", { className: "space-y-3", children: [_jsxs("h2", { className: "text-lg font-semibold flex items-center gap-2", children: [_jsx(History, { className: "h-4 w-4 text-muted-foreground" }), "Historial de canjes"] }), canjes.length === 0 ? (_jsx(Card, { children: _jsxs(CardContent, { className: "p-8 text-center text-muted-foreground", children: [_jsx(ShoppingCart, { className: "h-8 w-8 mx-auto mb-2 opacity-50" }), _jsx("p", { children: "A\u00FAn no has canjeado ninguna recompensa" }), _jsx("p", { className: "text-sm", children: "\u00A1Sigue esforz\u00E1ndote para ganar puntos!" })] }) })) : (_jsx("div", { className: "space-y-2", children: canjes.map((canje) => (_jsx(Card, { className: "border-amber-500/10", children: _jsxs(CardContent, { className: "p-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", children: canje.icono }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm", children: canje.nombre }), _jsx("p", { className: "text-xs text-muted-foreground", children: new Date(canje.fecha).toLocaleDateString("es-ES", {
                                                            day: "numeric", month: "long", year: "numeric",
                                                            hour: "2-digit", minute: "2-digit",
                                                        }) }), canje.disfrute ? (_jsxs("p", { className: "text-xs mt-0.5", children: [_jsx("span", { className: "text-amber-500", children: "⭐".repeat(canje.disfrute) }), canje.tiempo ? _jsxs("span", { className: "text-muted-foreground", children: [" \u00B7 ", canje.tiempo, " min"] }) : null] })) : null] })] }), _jsxs(Badge, { variant: "secondary", className: "text-red-500 font-bold", children: ["-", canje.costo, " pts"] })] }) }, canje.id))) }))] })) : (
            /* Rewards Grid */
            _jsx(_Fragment, { children: CATEGORIAS.map((cat) => {
                    const items = recompensasFiltradas.filter((r) => r.categoria === cat.key);
                    if (items.length === 0)
                        return null;
                    return (_jsxs("section", { className: "space-y-3", children: [_jsxs("h2", { className: "text-lg font-semibold flex items-center gap-2", children: [_jsx("span", { children: cat.icono }), cat.label] }), _jsx("div", { className: "grid gap-3 md:grid-cols-2 lg:grid-cols-3", children: items.map((recompensa) => {
                                    const puedeCanjear = balance >= recompensa.costo;
                                    return (_jsxs(Card, { className: cn("transition-all hover:shadow-md relative group", puedeCanjear ? "border-amber-500/20" : "opacity-60"), children: [_jsxs("div", { className: "absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => abrirEditar(recompensa), children: _jsx(Pencil, { className: "h-3.5 w-3.5" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-red-500 hover:text-red-600", onClick: () => confirmarEliminar(recompensa.id, recompensa.nombre), children: _jsx(Trash2, { className: "h-3.5 w-3.5" }) })] }), _jsxs(CardContent, { className: "p-5 space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsx("span", { className: "text-3xl", children: recompensa.icono }), _jsxs(Badge, { variant: "secondary", className: cn("font-bold", puedeCanjear ? "text-amber-500" : "text-muted-foreground"), children: [recompensa.costo, " pts"] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-sm", children: recompensa.nombre }), _jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: recompensa.descripcion })] }), _jsxs(Button, { size: "sm", className: "w-full gap-1.5", variant: puedeCanjear ? "default" : "outline", disabled: !puedeCanjear, onClick: () => handleCanjear(recompensa.id), children: [_jsx(Gift, { className: "h-4 w-4" }), puedeCanjear ? "Canjear" : `Faltan ${recompensa.costo - balance} pts`] })] })] }, recompensa.id));
                                }) })] }, cat.key));
                }) })), _jsx("div", { className: "text-center pb-8", children: _jsxs("div", { className: "inline-flex items-center gap-2 text-xs text-muted-foreground", children: [_jsx(Trophy, { className: "h-3 w-3" }), "Sigue trabajando en tus \u00E1reas para ganar m\u00E1s puntos", _jsx(Sparkles, { className: "h-3 w-3" })] }) }), _jsx(Dialog, { open: !!feedbackCanje, onOpenChange: (o) => !o && setFeedbackCanje(null), children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-2xl", children: feedbackCanje?.icono }), feedbackCanje?.nombre] }) }), _jsxs("div", { className: "space-y-4 py-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "\u00BFCu\u00E1nto lo disfrutaste?" }), _jsx("div", { className: "flex gap-1.5", children: [1, 2, 3, 4, 5].map((n) => (_jsxs(Button, { type: "button", variant: disfrute === n ? "default" : "outline", size: "sm", className: "flex-1", onClick: () => setDisfrute(n), children: [n, "\u2B50"] }, n))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "feedback-tiempo", children: "\u00BFCu\u00E1ntos minutos le dedicaste?" }), _jsx(Input, { id: "feedback-tiempo", type: "number", min: 0, placeholder: "Ej: 30", value: tiempo || "", onChange: (e) => setTiempo(parseInt(e.target.value) || 0) })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => {
                                        guardarFeedback(feedbackCanje.id, 0, 0);
                                        setFeedbackCanje(null);
                                        toast({ title: "Recompensa canjeada", description: "¡Disfrútala! Te lo has ganado." });
                                    }, children: "Omitir" }), _jsx(Button, { onClick: guardarPreguntas, disabled: disfrute === 0, children: "Guardar" })] })] }) }), _jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: editandoId ? "Editar recompensa" : "Nueva recompensa" }) }), _jsxs("div", { className: "space-y-4 py-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "nombre", children: "Nombre" }), _jsx(Input, { id: "nombre", value: form.nombre, onChange: (e) => setForm({ ...form, nombre: e.target.value }), placeholder: "Ej: 1 hora de gaming" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "descripcion", children: "Descripci\u00F3n" }), _jsx(Textarea, { id: "descripcion", value: form.descripcion, onChange: (e) => setForm({ ...form, descripcion: e.target.value }), placeholder: "Describe la recompensa...", rows: 2 })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "icono", children: "Icono (emoji)" }), _jsx(Input, { id: "icono", value: form.icono, onChange: (e) => setForm({ ...form, icono: e.target.value }), placeholder: "\uD83C\uDFAE", maxLength: 4 })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "costo", children: "Costo (puntos)" }), _jsx(Input, { id: "costo", type: "number", min: 1, value: form.costo, onChange: (e) => setForm({ ...form, costo: parseInt(e.target.value) || 0 }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "categoria", children: "Categor\u00EDa" }), _jsxs(Select, { value: form.categoria, onValueChange: (v) => setForm({ ...form, categoria: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Selecciona una categor\u00EDa" }) }), _jsxs(SelectContent, { children: [CATEGORIAS.map((cat) => (_jsxs(SelectItem, { value: cat.key, children: [cat.icono, " ", cat.label] }, cat.key))), _jsx(SelectItem, { value: "otro", children: "\uD83C\uDF0D Otro" })] })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setDialogOpen(false), children: "Cancelar" }), _jsx(Button, { onClick: guardar, children: editandoId ? "Guardar cambios" : "Crear" })] })] }) })] }));
}
