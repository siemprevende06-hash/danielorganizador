import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  GraduationCap, BookOpen, ListTodo, Briefcase, FolderKanban, Mic2, Dumbbell, Trophy, CheckCircle2, Flame, Swords, Heart, TrendingUp, Clock, BedDouble, Droplets, Salad,
} from 'lucide-react';
import {
  AreaRow, ResumenGeneral, CheckItem, ResultRow, StagesBar, MiniStat, BigNumber, AREA_COLORS,
} from './shared';

const pagesWeek = [
  { d: 'L', pag: 22 }, { d: 'M', pag: 30 }, { d: 'X', pag: 18 }, { d: 'J', pag: 35 }, { d: 'V', pag: 26 }, { d: 'S', pag: 40 }, { d: 'D', pag: 46 },
];
const chessDonut = [
  { name: 'Victorias', value: 5 },
  { name: 'Derrotas', value: 2 },
];
const taskDonut = [
  { name: 'Completadas', value: 12 },
  { name: 'Pendientes', value: 3 },
];
const strengthLine = [
  { d: 'L', kg: 60 }, { d: 'M', kg: 62 }, { d: 'X', kg: 61 }, { d: 'J', kg: 64 }, { d: 'V', kg: 65 },
];
const songProgress = [
  { d: 'L', min: 0.5 }, { d: 'M', min: 1.1 }, { d: 'X', min: 1.8 }, { d: 'J', min: 2.5 }, { d: 'V', min: 3.2 }, { d: 'S', min: 3.7 },
];

export function ResultadosSemana() {
  return (
    <div className="space-y-5">
      <ResumenGeneral
        score={78}
        subtitle="Semana completada · 78%"
        badges={['2 exámenes aprobados', '+30 Elo', '2 libros en curso']}
        stats={[['Tareas', '80%'], ['Páginas', '217'], ['Fuerza', '+8%'], ['Partidas', '7']]}
      />

      {/* Universidad */}
      <AreaRow
        title="Universidad"
        color={AREA_COLORS.universidad}
        plan={
          <ul className="space-y-1.5">
            <CheckItem>Cálculo: tema 7 completo</CheckItem>
            <CheckItem>Física: problemas 4.1–4.5</CheckItem>
            <CheckItem done>Álgebra: quiz de matrices</CheckItem>
          </ul>
        }
        result={
          <div className="space-y-1">
            <ResultRow label="Quiz Álgebra" value="Aprobado" ok />
            <ResultRow label="Tema Cálculo 7" value="Leído + ejercicios" ok />
            <ResultRow label="Problemas Física" value="3/5 resueltos" pending />
          </div>
        }
      />

      {/* Lectura */}
      <AreaRow
        title="Lectura"
        color={AREA_COLORS.lectura}
        plan={
          <ul className="space-y-1.5">
            <CheckItem>"Hábitos Atómicos" — 200–240</CheckItem>
            <CheckItem>Meta semanal: 180 páginas</CheckItem>
          </ul>
        }
        result={
          <>
            <BigNumber value="217" fraction="/ 180 pág" label="páginas leídas en la semana" badge="Meta 120% ✓" accent="text-cyan-600" />
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pagesWeek} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="d" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                    formatter={(v: any) => [`${v} pág`, 'Leídas']} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="pag" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        }
      />

      {/* Tareas */}
      <AreaRow
        title="Tareas"
        color={AREA_COLORS.tareas}
        plan={
          <ul className="space-y-1.5">
            <CheckItem done>Formulario U</CheckItem>
            <CheckItem done>Enviar correo profe</CheckItem>
            <CheckItem>Landing cliente A</CheckItem>
          </ul>
        }
        result={
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
              <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 12 completadas</div>
              <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-slate-200" /> 3 pendientes</div>
              <p className="text-[10px] text-muted-foreground pt-1">80% de la semana resuelto</p>
            </div>
          </div>
        }
      />

      {/* Emprendimiento */}
      <AreaRow
        title="Emprendimiento"
        color={AREA_COLORS.emprendimiento}
        plan={
          <ul className="space-y-1.5">
            <CheckItem done>3 posts</CheckItem>
            <CheckItem>Contactar 10 leads</CheckItem>
          </ul>
        }
        result={
          <div className="space-y-1">
            <ResultRow label="Leads contactados" value="8/10" />
            <ResultRow label="Publicados" value="3/3" ok />
            <ResultRow label="Reuniones concretadas" value="2" />
          </div>
        }
      />

      {/* Proyectos */}
      <AreaRow
        title="Proyectos"
        color={AREA_COLORS.proyectos}
        plan={
          <ul className="space-y-1.5">
            <CheckItem done>App organizador: login</CheckItem>
            <CheckItem>Landing cliente A</CheckItem>
          </ul>
        }
        result={
          <div className="space-y-1">
            <ResultRow label="Login implementado" value="✓" ok />
            <ResultRow label="Avance landing" value="60%" />
          </div>
        }
      />

      {/* Música */}
      <AreaRow
        title="Música"
        color={AREA_COLORS.musica}
        plan={
          <ul className="space-y-1.5">
            <CheckItem>"Vals No. 2" — hasta 3:00</CheckItem>
            <CheckItem>Escalas diarias</CheckItem>
          </ul>
        }
        result={
          <>
            <BigNumber value="3:42" fraction="/ 5:10" label='"Vals No. 2"' badge="71% dominado" accent="text-pink-600" />
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={songProgress} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="d" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                    formatter={(v: any) => [`${v} min`, 'Dominados']} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="min" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        }
      />

      {/* Ajedrez */}
      <AreaRow
        title="Ajedrez"
        color={AREA_COLORS.ajedrez}
        plan={
          <ul className="space-y-1.5">
            <CheckItem>7 partidas planificadas</CheckItem>
            <CheckItem done>Tácticas 30 min</CheckItem>
          </ul>
        }
        result={
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chessDonut} dataKey="value" innerRadius={32} outerRadius={46} paddingAngle={3} stroke="none">
                    <Cell fill="#0f172a" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-900" /> 5 victorias</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500" /> 2 derrotas</div>
              <p className="font-semibold text-sm pt-1">Elo 1065 <span className="text-emerald-500 text-xs">▲ +30</span></p>
            </div>
          </div>
        }
      />

      {/* Gym */}
      <AreaRow
        title="Gym"
        color={AREA_COLORS.gym}
        plan={
          <ul className="space-y-1.5">
            <CheckItem done>Press 4×8</CheckItem>
            <CheckItem>Sentadilla 3×12</CheckItem>
            <CheckItem done>Cardio 20 min ×3</CheckItem>
          </ul>
        }
        result={
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-muted/40 p-2.5">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Press banca</p>
                <p className="text-sm font-bold">60 kg <span className="text-emerald-500 text-[10px]">▲ 2kg</span></p>
                <ProgressLite value={75} />
              </div>
              <div className="rounded-xl bg-muted/40 p-2.5">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Sentadilla</p>
                <p className="text-sm font-bold">85 kg <span className="text-emerald-500 text-[10px]">▲ 5kg</span></p>
                <ProgressLite value={60} />
              </div>
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={strengthLine} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="d" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[55, 70]} tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                    formatter={(v: any) => [`${v} kg`, 'Peso']} />
                  <Line type="monotone" dataKey="kg" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <MiniStat label="Sueño" value="7h 10m" icon={<BedDouble className="w-3.5 h-3.5" />} />
              <MiniStat label="Agua" value="14L" icon={<Droplets className="w-3.5 h-3.5" />} />
              <MiniStat label="Comidas" value="21/28" icon={<Salad className="w-3.5 h-3.5" />} />
              <MiniStat label="Ejercicio" value="3.5h" icon={<Clock className="w-3.5 h-3.5" />} />
            </div>
          </>
        }
      />

      {/* Game */}
      <AreaRow
        title="Game"
        color={AREA_COLORS.game}
        plan={
          <ul className="space-y-1.5">
            <CheckItem>Cita con Laura</CheckItem>
            <CheckItem>3 interacciones</CheckItem>
          </ul>
        }
        result={
          <>
            <div className="space-y-1">
              <ResultRow label="Citas concretadas" value="1 ✓" ok />
              <ResultRow label="Interacciones" value="3" />
              <ResultRow label="Número cerrado" value="1" ok />
            </div>
            <StagesBar stages={['Conocí', 'Salí', 'Besé', 'Intimidad']} current={1} />
          </>
        }
      />
    </div>
  );
}

function ProgressLite({ value }: { value: number }) {
  return (
    <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
      <div className="h-full bg-red-500 rounded-full" style={{ width: `${value}%` }} />
    </div>
  );
}