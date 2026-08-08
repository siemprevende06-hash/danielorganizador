import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  GraduationCap, BookOpen, ListTodo, Briefcase, FolderKanban, Mic2, Dumbbell, Trophy, CheckCircle2, Circle, Clock, ArrowUpRight, Flame, BedDouble, Droplets, Salad, Swords, Heart, TrendingUp,
} from 'lucide-react';

const AREA_COLORS: Record<string, string> = {
  universidad: 'from-blue-600 to-indigo-500',
  lectura: 'from-cyan-500 to-sky-500',
  tareas: 'from-emerald-500 to-teal-500',
  emprendimiento: 'from-purple-500 to-fuchsia-500',
  proyectos: 'from-amber-500 to-orange-500',
  musica: 'from-pink-500 to-rose-500',
  ajedrez: 'from-slate-600 to-zinc-600',
  gym: 'from-red-500 to-orange-500',
  game: 'from-rose-500 to-red-500',
};

function AreaCard({ title, icon, color, children }: {
  title: string;
  icon?: React.ReactNode;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      {color && <div className={cn('h-1 bg-gradient-to-r', color)} />}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{icon}</span>
          <h3 className="text-sm font-bold tracking-tight">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function CheckItem({ done, children }: { done?: boolean; children: React.ReactNode }) {
  return (
    <li className={cn('flex items-start gap-2 text-xs', done && 'opacity-60')}>
      {done
        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
        : <Circle className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />}
      <span className={cn(done && 'line-through')}>{children}</span>
    </li>
  );
}

function ResultRow({ label, value, ok, pending }: { label: string; value: string; ok?: boolean; pending?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-muted/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 font-semibold">
        {pending && <Circle className="h-3 w-3 text-amber-500" />}
        {ok && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
        {value}
      </span>
    </div>
  );
}

const pagesWeek = [
  { d: 'L', pag: 22 }, { d: 'M', pag: 30 }, { d: 'X', pag: 18 }, { d: 'J', pag: 35 }, { d: 'V', pag: 26 }, { d: 'S', pag: 40 }, { d: 'D', pag: 22 },
];
const chessDonut = [
  { name: 'Victorias', value: 2 },
  { name: 'Derrotas', value: 1 },
];
const taskDonut = [
  { name: 'Completadas', value: 4 },
  { name: 'Pendientes', value: 1 },
];
const strengthLine = [
  { s: 'S1', kg: 60 }, { s: 'S2', kg: 62 }, { s: 'S3', kg: 62 }, { s: 'S4', kg: 65 }, { s: 'S5', kg: 68 },
];
const stages = ['Conocí', 'Salí', 'Besé', 'Intimidad'];

export function ResultadosDia() {
  return (
    <div className="space-y-5">
      {/* ===== RESUMEN GENERAL ===== */}
      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />
        <CardContent className="p-4 flex items-center gap-4 flex-wrap">
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="4" />
              <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" className="text-primary" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={`${2 * Math.PI * 16 * (1 - 0.82)}`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">82</span>
          </div>
          <div className="flex-1 min-w-[220px]">
            <p className="text-sm font-semibold">Día completado · 82%</p>
            <p className="text-xs text-muted-foreground">Resultados alcanzados frente a lo planificado</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge variant="default" className="text-[10px]">1 examen aprobado</Badge>
              <Badge variant="secondary" className="text-[10px]">+15 Elo</Badge>
              <Badge variant="secondary" className="text-[10px]">2 libros en curso</Badge>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[['Tareas', '80%'], ['Páginas', '26'], ['Fuerza', '+8%'], ['Partidas', '3']].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-muted/40 px-2 py-2">
                <p className="text-sm font-bold tabular-nums">{v}</p>
                <p className="text-[9px] text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ===== COLUMNA: LO PLANIFICADO ===== */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Lo planificado</p>

          {/* Universidad */}
          <AreaCard title="Universidad — lo que hay que hacer" icon={<GraduationCap className="h-4 w-4 text-blue-500" />} color={AREA_COLORS.universidad}>
            <ul className="space-y-1.5">
              <CheckItem>Cálculo: leer tema 7 "Integrales"</CheckItem>
              <CheckItem>Física: resolver problema 4.2</CheckItem>
              <CheckItem>Cálculo: 20 ejercicios tema 6</CheckItem>
              <CheckItem done>Cálculo: quiz de derivadas</CheckItem>
            </ul>
          </AreaCard>

          {/* Tareas */}
          <AreaCard title="Tareas generales" icon={<ListTodo className="h-4 w-4 text-emerald-500" />} color={AREA_COLORS.tareas}>
            <ul className="space-y-1.5">
              <CheckItem done>Completar formulario de la U</CheckItem>
              <CheckItem>Enviar correo al profe</CheckItem>
              <CheckItem done>Llenar rutina de mañana</CheckItem>
            </ul>
          </AreaCard>

          {/* Emprendimiento */}
          <AreaCard title="Emprendimiento — acciones" icon={<Briefcase className="h-4 w-4 text-purple-500" />} color={AREA_COLORS.emprendimiento}>
            <ul className="space-y-1.5">
              <CheckItem done>Responder mensajes de clientes</CheckItem>
              <CheckItem>Segmentar audiencia</CheckItem>
              <CheckItem>Escribir post de la semana</CheckItem>
            </ul>
          </AreaCard>

          {/* Proyectos */}
          <AreaCard title="Proyectos — los que atiendo" icon={<FolderKanban className="h-4 w-4 text-amber-500" />} color={AREA_COLORS.proyectos}>
            <ul className="space-y-1.5">
              <CheckItem done>App organizador: arreglar bug del guardado</CheckItem>
              <CheckItem>Landing para cliente A: sección hero</CheckItem>
            </ul>
          </AreaCard>

          {/* Gym */}
          <AreaCard title="Gym — plan del entrenamiento" icon={<Dumbbell className="h-4 w-4 text-red-500" />} color={AREA_COLORS.gym}>
            <ul className="space-y-1.5">
              <CheckItem>Press de banca: 4 series × 8 (60 kg)</CheckItem>
              <CheckItem>Sentadilla: 3 × 12</CheckItem>
              <CheckItem done>Cardio 20 min</CheckItem>
            </ul>
          </AreaCard>

          {/* Game */}
          <AreaCard title="Game — plan de la semana" icon={<Flame className="h-4 w-4 text-rose-500" />} color={AREA_COLORS.game}>
            <ul className="space-y-1.5">
              <CheckItem>Cita con Laura (café 7pm)</CheckItem>
              <CheckItem>Interacciones: 3</CheckItem>
              <CheckItem done>Aproximación en el gym</CheckItem>
            </ul>
          </AreaCard>
        </div>

        {/* ===== COLUMNA: EL RESULTADO ===== */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">El resultado</p>

          {/* Universidad resultado */}
          <AreaCard title="Universidad — resultados" icon={<Trophy className="h-4 w-4 text-blue-500" />} color={AREA_COLORS.universidad}>
            <div className="space-y-1">
              <ResultRow label="Quiz de derivadas" value="Aprobado" ok />
              <ResultRow label="Tema 6 (4 ej. restantes)" value="En curso" pending />
              <ResultRow label="Problema Física 4.2" value="Pendiente" pending />
            </div>
          </AreaCard>

          {/* Lectura resultado */}
          <AreaCard title="Lectura — páginas del día" icon={<BookOpen className="h-4 w-4 text-cyan-500" />} color={AREA_COLORS.lectura}>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold tabular-nums">26 <span className="text-sm text-muted-foreground">/ 350 pág</span></p>
                <p className="text-[10px] text-muted-foreground">"Hábitos Atómicos" · 7% del libro</p>
              </div>
              <Badge variant="outline" className="text-[10px]">Meta 25 ✓</Badge>
            </div>
            <Progress value={7} className="h-1.5" />
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pagesWeek} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="d" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)' }}
                    formatter={(v: any) => [`${v} pág`, 'Leídas']}
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  />
                  <Bar dataKey="pag" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AreaCard>

          {/* Tareas resultado */}
          <AreaCard title="Tareas — cumplimiento" icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} color={AREA_COLORS.tareas}>
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={taskDonut} dataKey="value" innerRadius={32} outerRadius={46} paddingAngle={3} stroke="none">
                      <Cell fill="#10b981" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 4 completadas</div>
                <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-slate-200" /> 1 pendiente</div>
                <p className="text-[10px] text-muted-foreground pt-1">80% del día resuelto</p>
              </div>
            </div>
          </AreaCard>

          {/* Emprendimiento resultado */}
          <AreaCard title="Emprendimiento — logros" icon={<TrendingUp className="h-4 w-4 text-purple-500" />} color={AREA_COLORS.emprendimiento}>
            <div className="space-y-1">
              <ResultRow label="Mensajes respondidos" value="2/2" ok />
              <ResultRow label="Nuevos leads" value="3 contactos" />
              <ResultRow label="Publicación semanal" value="Borrador listo" pending />
            </div>
          </AreaCard>

          {/* Música */}
          <AreaCard title="Música — avance de la canción" icon={<Mic2 className="h-4 w-4 text-pink-500" />} color={AREA_COLORS.musica}>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold tabular-nums">3:42 <span className="text-sm text-muted-foreground">/ 5:10</span></p>
                <p className="text-[10px] text-muted-foreground">"Vals No. 2" · el viernes se la supo toda</p>
              </div>
              <Badge variant="outline" className="text-[10px]">71% dominado</Badge>
            </div>
            <Progress value={71} className="h-1.5 bg-pink-500/20 [&>div]:bg-pink-500" />
          </AreaCard>

          {/* Ajedrez */}
          <AreaCard title="Ajedrez — resultado de las partidas" icon={<Swords className="h-4 w-4 text-slate-500" />} color={AREA_COLORS.ajedrez}>
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chessDonut} dataKey="value" innerRadius={32} outerRadius={46} paddingAngle={3} stroke="none">
                      <Cell fill="#0f172a" />
                      <Cell fill="#f43f5e" />
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-900" /> 2 victorias</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500" /> 1 derrota</div>
                <p className="font-semibold text-sm pt-1">Elo 1050 <span className="text-emerald-500 text-xs">▲ +15</span></p>
              </div>
            </div>
          </AreaCard>

          {/* Gym resultado */}
          <AreaCard title="Gym — progreso de fuerza" icon={<ArrowUpRight className="h-4 w-4 text-red-500" />} color={AREA_COLORS.gym}>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-muted/40 p-2.5">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Press banca</p>
                <p className="text-sm font-bold">60 kg <span className="text-emerald-500 text-[10px]">▲ 2kg</span></p>
                <Progress value={75} className="h-1 mt-1" />
              </div>
              <div className="rounded-xl bg-muted/40 p-2.5">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Sentadilla</p>
                <p className="text-sm font-bold">85 kg <span className="text-emerald-500 text-[10px]">▲ 5kg</span></p>
                <Progress value={60} className="h-1 mt-1" />
              </div>
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={strengthLine} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="s" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[55, 70]} tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                    formatter={(v: any) => [`${v} kg`, 'Peso']} />
                  <Line type="monotone" dataKey="kg" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[['Sueño', '7h 20m', BedDouble], ['Agua', '2.1L', Droplets], ['Comidas', '3/4', Salad], ['Ejercicio', '45m', Clock]].map(([l, v, Icon]) => (
                <div key={l as string} className="rounded-xl border border-muted/50 p-2">
                  <Icon className="w-3.5 h-3.5 mx-auto text-muted-foreground" />
                  <p className="text-[11px] font-bold mt-0.5">{v}</p>
                  <p className="text-[8px] text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
          </AreaCard>

          {/* Game resultado */}
          <AreaCard title="Game — citas y progresión" icon={<Heart className="h-4 w-4 text-rose-500" />} color={AREA_COLORS.game}>
            <div className="space-y-1">
              <ResultRow label="Citas concretadas" value="1 ✓" ok />
              <ResultRow label="Interacciones" value="3" />
              <ResultRow label="Aproximaciones" value="1" pending />
            </div>
            <div className="flex items-center gap-1 mt-2">
              {stages.map((s, i) => (
                <div key={s} className="flex-1">
                  <div className={cn('h-1 rounded-full', i <= 1 ? 'bg-rose-500' : 'bg-muted')} />
                  <p className={cn('text-[8px] text-center mt-1', i === 1 && 'font-bold text-rose-500', i > 1 && 'text-muted-foreground')}>{s}</p>
                </div>
              ))}
            </div>
          </AreaCard>
        </div>
      </div>
    </div>
  );
}