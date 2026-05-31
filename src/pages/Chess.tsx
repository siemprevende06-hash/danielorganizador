import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Crown, Trophy, Target, Plus, Trash2, Save, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useChessTracking } from "@/hooks/useChessTracking";
import { toast } from "@/hooks/use-toast";

export default function Chess() {
  const { sessions, goals, stats, addSession, upsertGoals, deleteSession, loading } = useChessTracking();

  const [sessionOpen, setSessionOpen] = useState(false);
  const [duration, setDuration] = useState(30);
  const [games, setGames] = useState(3);
  const [wins, setWins] = useState(0);
  const [elo, setElo] = useState<number | "">("");
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
    setDuration(30); setGames(3); setWins(0); setElo("");
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
    return <div className="min-h-screen flex items-center justify-center pt-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const eloProgress = goals
    ? Math.min(100, Math.round(((stats.currentElo - goals.starting_elo) / (goals.target_elo - goals.starting_elo)) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Crown className="h-7 w-7 text-amber-500" />
            <h1 className="text-3xl font-bold">Ajedrez</h1>
          </div>
          <p className="text-sm text-muted-foreground">ELO · Partidas · Tiempo · Objetivos</p>
        </div>

        {/* ELO grande */}
        <Card className="p-6 text-center bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">ELO Actual</p>
          <p className="text-5xl font-extrabold text-amber-600">{stats.currentElo}</p>
          {goals && (
            <>
              <div className="mt-4">
                <Progress value={eloProgress} className="h-2" />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {goals.starting_elo} → {goals.target_elo} ({eloProgress}% del camino)
                </p>
              </div>
            </>
          )}
        </Card>

        {/* Botones acción */}
        <div className="flex gap-2">
          <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 gap-2"><Plus className="h-4 w-4" /> Nueva sesión</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar sesión</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Duración (min)</Label><Input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Partidas</Label><Input type="number" value={games} onChange={e => setGames(Number(e.target.value))} /></div>
                  <div><Label>Victorias</Label><Input type="number" value={wins} onChange={e => setWins(Number(e.target.value))} /></div>
                </div>
                <div><Label>ELO actual (opcional)</Label><Input type="number" value={elo} onChange={e => setElo(e.target.value === "" ? "" : Number(e.target.value))} /></div>
                <div><Label>Plataforma</Label><Input value={platform} onChange={e => setPlatform(e.target.value)} /></div>
                <Button onClick={handleSave} className="w-full"><Save className="h-4 w-4 mr-1" /> Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><Target className="h-4 w-4" /> Objetivos</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Objetivos de Ajedrez</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>ELO inicial</Label><Input type="number" value={sElo} onChange={e => setSElo(Number(e.target.value))} /></div>
                <div><Label>ELO objetivo</Label><Input type="number" value={tElo} onChange={e => setTElo(Number(e.target.value))} /></div>
                <div><Label>Partidas/mes</Label><Input type="number" value={tGames} onChange={e => setTGames(Number(e.target.value))} /></div>
                <div><Label>Minutos diarios</Label><Input type="number" value={tMin} onChange={e => setTMin(Number(e.target.value))} /></div>
                <Button onClick={handleSaveGoals} className="w-full"><Save className="h-4 w-4 mr-1" /> Guardar objetivos</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Hoy" min={stats.today.minutes} games={stats.today.games} wins={stats.today.wins} />
          <StatCard label="Esta semana" min={stats.week.minutes} games={stats.week.games} wins={stats.week.wins} />
          <StatCard label="Este mes" min={stats.month.minutes} games={stats.month.games} wins={stats.month.wins} />
        </div>

        {/* Historial */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Historial</h3>
            <Badge variant="secondary">{sessions.length}</Badge>
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Aún no hay sesiones registradas</p>
            ) : sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/40 group">
                <div className="flex-1">
                  <p className="text-xs font-medium">{new Date(s.session_date).toLocaleDateString("es", { day: "numeric", month: "short" })}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{s.duration_minutes}min</span>·
                    <span>{s.games_played} part.</span>·
                    <span>{s.games_won} win</span>
                    {s.current_elo && <Badge variant="outline" className="h-4 text-[9px] ml-1">ELO {s.current_elo}</Badge>}
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-destructive" onClick={() => deleteSession(s.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const StatCard = ({ label, min, games, wins }: { label: string; min: number; games: number; wins: number }) => (
  <Card className="p-3 text-center">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="text-xl font-bold mt-1">{min}<span className="text-xs font-normal text-muted-foreground">min</span></p>
    <p className="text-[10px] text-muted-foreground mt-0.5">
      {games} part · {wins > 0 && `${Math.round((wins / games) * 100)}% W`}
    </p>
  </Card>
);
