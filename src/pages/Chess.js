import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Crown, Target, Plus, Trash2, Save, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useChessTracking } from "@/hooks/useChessTracking";
import { toast } from "@/hooks/use-toast";
export default function Chess() {
    const { sessions, goals, stats, addSession, upsertGoals, deleteSession, loading } = useChessTracking();
    const [sessionOpen, setSessionOpen] = useState(false);
    const [duration, setDuration] = useState(30);
    const [games, setGames] = useState(3);
    const [wins, setWins] = useState(0);
    const [elo, setElo] = useState("");
    const [platform, setPlatform] = useState("chess.com");
    const [goalOpen, setGoalOpen] = useState(false);
    const [tElo, setTElo] = useState(goals?.target_elo || 1500);
    const [tGames, setTGames] = useState(goals?.target_games_per_month || 30);
    const [tMin, setTMin] = useState(goals?.target_minutes_per_day || 30);
    const [sElo, setSElo] = useState(goals?.starting_elo || 1000);
    const handleSave = async () => {
        await addSession({
            duration_minutes: duration,
            games_played: games,
            games_won: wins,
            current_elo: elo === "" ? null : Number(elo),
            platform,
        });
        toast({ title: "Sesión guardada" });
        setSessionOpen(false);
        setDuration(30);
        setGames(3);
        setWins(0);
        setElo("");
    };
    const handleSaveGoals = async () => {
        await upsertGoals({
            target_elo: tElo, target_games_per_month: tGames,
            target_minutes_per_day: tMin, starting_elo: sElo,
        });
        toast({ title: "Objetivos actualizados" });
        setGoalOpen(false);
    };
    if (loading) {
        return _jsx("div", { className: "min-h-screen flex items-center justify-center pt-24", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) });
    }
    const eloProgress = goals
        ? Math.min(100, Math.round(((stats.currentElo - goals.starting_elo) / (goals.target_elo - goals.starting_elo)) * 100))
        : 0;
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24", children: _jsxs("div", { className: "max-w-3xl mx-auto space-y-5", children: [_jsxs("div", { className: "text-center space-y-1", children: [_jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx(Crown, { className: "h-7 w-7 text-amber-500" }), _jsx("h1", { className: "text-3xl font-bold", children: "Ajedrez" })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "ELO \u00B7 Partidas \u00B7 Tiempo \u00B7 Objetivos" })] }), _jsxs(Card, { className: "p-6 text-center bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30", children: [_jsx("p", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "ELO Actual" }), _jsx("p", { className: "text-5xl font-extrabold text-amber-600", children: stats.currentElo }), goals && (_jsx(_Fragment, { children: _jsxs("div", { className: "mt-4", children: [_jsx(Progress, { value: eloProgress, className: "h-2" }), _jsxs("p", { className: "text-[11px] text-muted-foreground mt-1", children: [goals.starting_elo, " \u2192 ", goals.target_elo, " (", eloProgress, "% del camino)"] })] }) }))] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Dialog, { open: sessionOpen, onOpenChange: setSessionOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { className: "flex-1 gap-2", children: [_jsx(Plus, { className: "h-4 w-4" }), " Nueva sesi\u00F3n"] }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Registrar sesi\u00F3n" }) }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx(Label, { children: "Duraci\u00F3n (min)" }), _jsx(Input, { type: "number", value: duration, onChange: e => setDuration(Number(e.target.value)) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx(Label, { children: "Partidas" }), _jsx(Input, { type: "number", value: games, onChange: e => setGames(Number(e.target.value)) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Victorias" }), _jsx(Input, { type: "number", value: wins, onChange: e => setWins(Number(e.target.value)) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "ELO actual (opcional)" }), _jsx(Input, { type: "number", value: elo, onChange: e => setElo(e.target.value === "" ? "" : Number(e.target.value)) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Plataforma" }), _jsx(Input, { value: platform, onChange: e => setPlatform(e.target.value) })] }), _jsxs(Button, { onClick: handleSave, className: "w-full", children: [_jsx(Save, { className: "h-4 w-4 mr-1" }), " Guardar"] })] })] })] }), _jsxs(Dialog, { open: goalOpen, onOpenChange: setGoalOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: "gap-2", children: [_jsx(Target, { className: "h-4 w-4" }), " Objetivos"] }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Objetivos de Ajedrez" }) }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx(Label, { children: "ELO inicial" }), _jsx(Input, { type: "number", value: sElo, onChange: e => setSElo(Number(e.target.value)) })] }), _jsxs("div", { children: [_jsx(Label, { children: "ELO objetivo" }), _jsx(Input, { type: "number", value: tElo, onChange: e => setTElo(Number(e.target.value)) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Partidas/mes" }), _jsx(Input, { type: "number", value: tGames, onChange: e => setTGames(Number(e.target.value)) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Minutos diarios" }), _jsx(Input, { type: "number", value: tMin, onChange: e => setTMin(Number(e.target.value)) })] }), _jsxs(Button, { onClick: handleSaveGoals, className: "w-full", children: [_jsx(Save, { className: "h-4 w-4 mr-1" }), " Guardar objetivos"] })] })] })] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(StatCard, { label: "Hoy", min: stats.today.minutes, games: stats.today.games, wins: stats.today.wins }), _jsx(StatCard, { label: "Esta semana", min: stats.week.minutes, games: stats.week.games, wins: stats.week.wins }), _jsx(StatCard, { label: "Este mes", min: stats.month.minutes, games: stats.month.games, wins: stats.month.wins })] }), _jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("h3", { className: "font-semibold flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-4 w-4" }), " Historial"] }), _jsx(Badge, { variant: "secondary", children: sessions.length })] }), _jsx("div", { className: "space-y-1.5 max-h-80 overflow-y-auto", children: sessions.length === 0 ? (_jsx("p", { className: "text-xs text-muted-foreground text-center py-6", children: "A\u00FAn no hay sesiones registradas" })) : sessions.map(s => (_jsxs("div", { className: "flex items-center justify-between py-2 px-2 rounded hover:bg-muted/40 group", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-xs font-medium", children: new Date(s.session_date).toLocaleDateString("es", { day: "numeric", month: "short" }) }), _jsxs("div", { className: "flex items-center gap-2 text-[10px] text-muted-foreground", children: [_jsxs("span", { children: [s.duration_minutes, "min"] }), "\u00B7", _jsxs("span", { children: [s.games_played, " part."] }), "\u00B7", _jsxs("span", { children: [s.games_won, " win"] }), s.current_elo && _jsxs(Badge, { variant: "outline", className: "h-4 text-[9px] ml-1", children: ["ELO ", s.current_elo] })] })] }), _jsx(Button, { size: "sm", variant: "ghost", className: "opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-destructive", onClick: () => deleteSession(s.id), children: _jsx(Trash2, { className: "h-3 w-3" }) })] }, s.id))) })] })] }) }));
}
const StatCard = ({ label, min, games, wins }) => (_jsxs(Card, { className: "p-3 text-center", children: [_jsx("p", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: label }), _jsxs("p", { className: "text-xl font-bold mt-1", children: [min, _jsx("span", { className: "text-xs font-normal text-muted-foreground", children: "min" })] }), _jsxs("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: [games, " part \u00B7 ", wins > 0 && `${Math.round((wins / games) * 100)}% W`] })] }));
