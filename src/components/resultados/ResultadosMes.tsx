import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  GraduationCap, BookOpen, Mic2, Briefcase, Swords, Dumbbell, Flame, BedDouble, Droplets, Salad, Clock,
} from 'lucide-react';
import {
  AreaRow, ResumenGeneral, CheckItem, ResultRow, StagesBar, AREA_COLORS,
} from './shared';

const pagesByWeek = [
  { w: 'S1', pag: 217 }, { w: 'S2', pag: 190 }, { w: 'S3', pag: 240 }, { w: 'S4', pag: 265 },
];
const booksDonut = [
  { name: 'Leídos', value: 2 },
  { name: 'En curso', value: 1 },
  { name: 'Pendientes', value: 1 },
];
const songsDonut = [
  { name: 'Aprendidas', value: 3 },
  { name: 'En progreso', value: 2 },
];
const chessMonthly = [
  { w: 'S1', elo: 1050 }, { w: 'S2', elo: 1065 }, { w: 'S3', elo: 1078 }, { w: 'S4', elo: 1090 },
];
const gymMonth = [
  { s: 'S1', kg: 60 }, { s: 'S2', kg: 63 }, { s: 'S3', kg: 65 }, { s: 'S4', kg: 68 },
];
const examDonut = [
  { name: 'Aprobados', value: 3 },
  { name: 'Entregados', value: 2 },
  { name: 'Pendientes', value: 1 },
];

export function ResultadosMes() {
  return (
    <div className="space-y-5">
      <ResumenGeneral
        score={85}
        subtitle="Mes completado · 85%"
        badges={['2 libros terminados', '3 canciones aprendidas', '3 exámenes aprobados']}
        stats={[['Páginas', '912'], ['Libros', '2/4'], ['Fuerza', '+13%'], ['Elo', '1090']]}
      />

      {/* Universidad */}
      <AreaRow
        title="Universidad"
        color={AREA_COLORS.universidad}
        plan={
          <ul className="space-y-1.5">
            <CheckItem>Cálculo: temas 7–10</CheckItem>
            <CheckItem>Física: unidad 4</CheckItem>
            <CheckItem done>Álgebra: unidades 1–2</CheckItem>
          </ul>
        }
        result={
          <>
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={examDonut} dataKey="value" innerRadius={32} outerRadius={46} paddingAngle={3} stroke="none">
                      <Cell fill="#10b981" />
                      <Cell fill="#06b6d4" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 3 aprobados</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-500" /> 2 entregados</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-200" /> 1 pendiente</div>
              </div>
            </div>
            <div className="space-y-1">
              <ResultRow label="Parcial Cálculo" value="4.2/5" ok />
              <ResultRow label="Trabajo Física" value="Entregado" ok />
            </div>
          </>
        }
      />

      {/* Lectura */}
      <AreaRow
        title="Lectura"
        color={AREA_COLORS.lectura}
        plan={
          <ul className="space-y-1.5">
            <CheckItem done>"Hábitos Atómicos" (plan mes)</CheckItem>
            <CheckItem done>"El Quinto Acuerdo" (plan mes)</CheckItem>
            <CheckItem>"Padre Rico" (trimestre)</CheckItem>
          </ul>
        }
        result={
          <>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tabular-nums">912 <span className="text-sm text-muted-foreground">pág / 800 meta</span></p>
              <Badge variant="outline" className="text-[10px] text-cyan-600">114% ✓</Badge>
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pagesByWeek} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="w" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                    formatter={(v: any) => [`${v} pág`, 'Leídas']} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="pag" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={booksDonut} dataKey="value" innerRadius={22} outerRadius={32} paddingAngle={3} stroke="none">
                      <Cell fill="#10b981" />
                      <Cell fill="#06b6d4" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 2 leídos</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-500" /> 1 en curso</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-200" /> 1 pendiente</div>
              </div>
            </div>
          </>
        }
      />

      {/* Música */}
      <AreaRow
        title="Música"
        color={AREA_COLORS.musica}
        plan={
          <ul className="space-y-1.5">
            <CheckItem done>"Vals No. 2" (plan mes)</CheckItem>
            <CheckItem done>"Canon en Re" (plan mes)</CheckItem>
            <CheckItem>"Asturias" (trimestre)</CheckItem>
          </ul>
        }
        result={
          <>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={songsDonut} dataKey="value" innerRadius={22} outerRadius={32} paddingAngle={3} stroke="none">
                      <Cell fill="#ec4899" />
                      <Cell fill="#f9a8d4" />
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-pink-500" /> 3 aprendidas</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-pink-200" /> 2 en progreso</div>
                <p className="text-[9px] text-muted-foreground pt-1">"Vals No. 2" al 71% · min 3:42/5:10</p>
              </div>
            </div>
          </>
        }
      />

      {/* Emprendimiento */}
      <AreaRow
        title="Emprendimiento"
        color={AREA_COLORS.emprendimiento}
        plan={
          <ul className="space-y-1.5">
            <CheckItem>10 posts</CheckItem>
            <CheckItem>40 leads</CheckItem>
          </ul>
        }
        result={
          <div className="space-y-1">
            <ResultRow label="Publicados" value="10/10" ok />
            <ResultRow label="Leads nuevos" value="26/40" />
            <ResultRow label="Clientes cerrados" value="2" ok />
          </div>
        }
      />

      {/* Ajedrez */}
      <AreaRow
        title="Ajedrez"
        color={AREA_COLORS.ajedrez}
        plan={
          <ul className="space-y-1.5">
            <CheckItem>30 partidas planificadas</CheckItem>
            <CheckItem done>Tácticas diarias</CheckItem>
          </ul>
        }
        result={
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Elo actual</span>
              <span className="font-semibold text-sm">1090 <span className="text-emerald-500 text-xs">▲ +40 este mes</span></span>
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chessMonthly} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="w" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[1040, 1100]} tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                    formatter={(v: any) => [`${v}`, 'Elo']} />
                  <Line type="monotone" dataKey="elo" stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        }
      />

      {/* Gym */}
      <AreaRow
        title="Gym"
        color={AREA_COLORS.gym}
        plan={
          <ul className="space-y-1.5">
            <CheckItem>12 entrenamientos</CheckItem>
            <CheckItem>Subir press 5kg</CheckItem>
          </ul>
        }
        result={
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-muted/40 p-2.5">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Press banca</p>
                <p className="text-sm font-bold">68 kg <span className="text-emerald-500 text-[10px]">▲ 8kg</span></p>
                <ProgressLite value={80} color="bg-red-500" />
              </div>
              <div className="rounded-xl bg-muted/40 p-2.5">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Sentadilla</p>
                <p className="text-sm font-bold">90 kg <span className="text-emerald-500 text-[10px]">▲ 5kg</span></p>
                <ProgressLite value={65} color="bg-red-500" />
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Evolución press banca</p>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gymMonth} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="s" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[55, 72]} tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                    formatter={(v: any) => [`${v} kg`, 'Peso']} />
                  <Line type="monotone" dataKey="kg" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <MiniStatMock icon={<BedDouble className="w-3.5 h-3.5" />} value="7h 05m" label="Sueño" />
              <MiniStatMock icon={<Droplets className="w-3.5 h-3.5" />} value="60L" label="Agua" />
              <MiniStatMock icon={<Salad className="w-3.5 h-3.5" />} value="84/112" label="Comidas" />
              <MiniStatMock icon={<Clock className="w-3.5 h-3.5" />} value="14h" label="Ejercicio" />
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
            <CheckItem>4 citas</CheckItem>
            <CheckItem>15 interacciones</CheckItem>
          </ul>
        }
        result={
          <>
            <div className="space-y-1">
              <ResultRow label="Citas concretadas" value="4/4" ok />
              <ResultRow label="Interacciones" value="12/15" />
              <ResultRow label="Citas de repetición" value="2" ok />
            </div>
            <StagesBar stages={['Conocí', 'Salí', 'Besé', 'Intimidad']} current={2} />
          </>
        }
      />
    </div>
  );
}

function ProgressLite({ value, color }: { value: number; color?: string }) {
  return (
    <div className={cn('h-1 bg-muted rounded-full mt-1 overflow-hidden')}>
      <div className={cn('h-full rounded-full', color || 'bg-primary')} style={{ width: `${value}%` }} />
    </div>
  );
}

function MiniStatMock({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl border border-muted/50 p-2">
      <div className="flex items-center justify-center text-muted-foreground">{icon}</div>
      <p className="text-[11px] font-bold mt-0.5 text-center">{value}</p>
      <p className="text-[8px] text-muted-foreground text-center">{label}</p>
    </div>
  );
}