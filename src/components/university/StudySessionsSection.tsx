import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlarmClock, TrendingUp, BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

interface StudyByDay {
  day: string;
  minutes: number;
}

interface StudyByTask {
  taskId: string;
  taskTitle: string;
  subjectName: string;
  count: number;
  minutes: number;
  estimated?: number;
}

interface StudyTask {
  id: string;
  title: string;
  subjectName: string;
}

interface StudySessionsSectionProps {
  todayMinutes: number;
  studyByDay: StudyByDay[];
  sessionsTotal: number;
  minutesTotal: number;
  targetTotal: number;
  byTask: StudyByTask[];
  studyTasks?: StudyTask[];
  onAddSession?: (taskId: string, minutes: number, dateIso: string) => void;
}

export function StudySessionsSection({
  todayMinutes,
  studyByDay,
  sessionsTotal,
  minutesTotal,
  targetTotal,
  byTask,
  studyTasks = [],
  onAddSession,
}: StudySessionsSectionProps) {
  const studyTotalPeriod = studyByDay.reduce((sum, d) => sum + d.minutes, 0);
  const hoursPeriod = Math.round((studyTotalPeriod / 60) * 10) / 10;
  const hoursTotal = Math.round((minutesTotal / 60) * 10) / 10;
  const progressPct = targetTotal > 0 ? Math.min(100, Math.round((minutesTotal / targetTotal) * 100)) : 0;

  const [open, setOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [minutes, setMinutes] = useState(30);
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 16));

  const handleAdd = () => {
    if (!selectedTaskId || minutes <= 0) return;
    const date = new Date(sessionDate);
    onAddSession?.(selectedTaskId, Math.round(minutes), date.toISOString());
    setOpen(false);
    setSelectedTaskId('');
    setMinutes(30);
    setSessionDate(new Date().toISOString().slice(0, 16));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Sesiones de estudio
        </h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar sesión
        </Button>
      </div>

      {/* Quick stats estudio */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-sky-500 text-white p-3 shadow-sm">
          <p className="text-2xl font-extrabold leading-none">{todayMinutes}m</p>
          <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Estudio hoy
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white p-3 shadow-sm">
          <p className="text-2xl font-extrabold leading-none">{sessionsTotal}</p>
          <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1">
            <AlarmClock className="h-3 w-3" /> Sesiones acumuladas
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-3 shadow-sm">
          <p className="text-2xl font-extrabold leading-none">{hoursTotal}h</p>
          <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Total invertido
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 text-white p-3 shadow-sm">
          <p className="text-2xl font-extrabold leading-none">{progressPct}%</p>
          <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Progreso objetivo
          </p>
          {targetTotal > 0 && (
            <p className="text-[9px] text-white/80 mt-0.5">
              {minutesTotal}m / {targetTotal}m
            </p>
          )}
        </div>
      </div>

      {/* Gráfica por días */}
      {studyByDay.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Minutos de estudio (últimos {studyByDay.length} días)
              {studyTotalPeriod > 0 && (
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {hoursPeriod}h total
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 sm:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studyByDay} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 12 }}
                    formatter={(v: any) => [`${v} min`, 'Estudio']}
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  />
                  <Bar dataKey="minutes" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desglose por tareas de estudio */}
      {byTask.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Sesiones por tarea de estudio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {byTask.map((bt) => {
              const pct = bt.estimated && bt.estimated > 0
                ? Math.min(100, Math.round((bt.minutes / bt.estimated) * 100))
                : 0;
              return (
                <div
                  key={bt.taskId}
                  className="flex flex-col gap-1 rounded-xl border border-border/40 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm p-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{bt.taskTitle}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{bt.subjectName}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold tabular-nums">{bt.minutes} min</p>
                        <p className="text-[10px] text-muted-foreground">{bt.count} sesión(es)</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        onClick={() => {
                          setSelectedTaskId(bt.taskId);
                          setOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Sesión
                      </Button>
                    </div>
                  </div>
                  {bt.estimated && bt.estimated > 0 && (
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Progreso estimado</span>
                      <span className={pct >= 100 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                        {pct}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {studyByDay.length === 0 && byTask.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Aún no hay sesiones de estudio registradas</p>
            <p className="text-xs text-muted-foreground mt-1">
              Inicia un temporizador o registra una sesión manualmente
            </p>
            <Button className="mt-3" size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar primera sesión
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar sesión de estudio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tarea de estudio</Label>
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tarea" />
                </SelectTrigger>
                <SelectContent>
                  {studyTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title} {t.subjectName && `· ${t.subjectName}`}
                    </SelectItem>
                  ))}
                  {studyTasks.length === 0 && (
                    <SelectItem value="" disabled>
                      No hay tareas de estudio
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Minutos</Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha y hora</Label>
              <Input
                type="datetime-local"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={!selectedTaskId || minutes <= 0}>
              Guardar sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}