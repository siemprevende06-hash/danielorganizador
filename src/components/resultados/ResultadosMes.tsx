import {
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { endOfMonth } from 'date-fns';
import {
  useResultadosPeriodo, EMPTY_RESULTADO, AREA_ORDER,
} from '@/hooks/useResultadosPeriodo';
import { Badge } from '@/components/ui/badge';
import {
  AreaRow, ResumenGeneral, CheckItem, ResultRow, StagesBar, BigNumber, TaskPlanList, MinutesRow, AreaEmpty, PlanDelMes, AREA_COLORS,
} from './shared';

const AREA_BAR: Record<string, string> = {
  universidad: '#3b82f6', emprendimiento: '#a855f7', proyectos: '#f59e0b',
  lectura: '#06b6d4', musica: '#ec4899', ajedrez: '#334155',
  game: '#f43f5e', idiomas: '#10b981', gym: '#ef4444', general: '#94a3b8',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-28 bg-muted/40 rounded-2xl animate-pulse" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="grid gap-4 lg:grid-cols-2">
          <div className="h-32 bg-muted/40 rounded-2xl animate-pulse" />
          <div className="h-32 bg-muted/40 rounded-2xl animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function ResultadosMes({ month }: { month: Date }) {
  const monthEnd = endOfMonth(month);
  const { data } = useResultadosPeriodo(month, monthEnd);
  const r = data ?? EMPTY_RESULTADO;

  const pct = r.globalTotal > 0 ? Math.round((r.globalDone / r.globalTotal) * 100) : 0;
  const totalMin = r.systems.minutes + r.workoutMin + r.focusMin + Object.values(r.byArea).reduce((a, v) => a + v.minutes, 0);
  const badges = [
    r.globalTotal > 0 && `${r.globalDone}/${r.globalTotal} tareas`,
    r.lectura.pages > 0 && `${r.lectura.pages} pág leídas`,
    r.musica.songs > 0 && `${r.musica.songs} piezas`,
    r.ajedrez.games > 0 && `${r.ajedrez.games} partidas`,
  ].filter(Boolean) as string[];

  const hoursByArea = AREA_ORDER
    .map(k => ({ area: k, hrs: Math.round(r.byArea[k].minutes / 60), fill: AREA_BAR[k] || '#94a3b8' }))
    .filter(x => x.hrs > 0);

  return (
    <div className="space-y-5">
      <ResumenGeneral
        score={r.score}
        subtitle={`Mes · ${r.score}%`}
        badges={badges}
        stats={[
          ['Tareas', r.globalTotal > 0 ? `${pct}%` : '—'],
          ['Páginas', String(r.lectura.pages)],
          ['Horas', String(Math.round(totalMin / 60))],
          ['Partidas', String(r.ajedrez.games)],
        ]}
      />

      {/* Tiempo por área */}
      {hoursByArea.length > 0 && (
        <div className="rounded-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horas del mes</p>
            <Badge variant="outline" className="text-[10px]">{Math.round(totalMin / 60)}h invertidas</Badge>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursByArea} layout="vertical" margin={{ top: 0, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis type="number" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="area" width={86} tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                  formatter={(v: any) => [`${v} h`, 'Invertidas']} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="hrs" radius={[0, 4, 4, 0]}>
                  {hoursByArea.map(e => <Cell key={e.area} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Plan trimestral del mes */}
      <PlanDelMes books={r.books} songs={r.songs} />

      {/* Universidad */}
      <AreaRow
        title="Universidad"
        color={AREA_COLORS.universidad}
        plan={<TaskPlanList area={r.byArea.universidad} />}
        result={
          <div className="space-y-1">
            <MinutesRow area={r.byArea.universidad} />
            <ResultRow label="Tareas completadas" value={`${r.byArea.universidad.done}/${r.byArea.universidad.total}`} ok={r.byArea.universidad.total > 0 && r.byArea.universidad.done === r.byArea.universidad.total} />
            {r.byArea.universidad.minutes === 0 && r.byArea.universidad.total === 0 && <AreaEmpty />}
          </div>
        }
      />

      {/* Lectura */}
      <AreaRow
        title="Lectura"
        color={AREA_COLORS.lectura}
        plan={
          <ul className="space-y-1.5">
            <CheckItem>Meta mensual de páginas</CheckItem>
            <CheckItem done={r.lectura.pages >= r.lectura.pagesGoal && r.lectura.pages > 0}>Leer {r.lectura.pagesGoal || 600} páginas en el mes</CheckItem>
          </ul>
        }
        result={
          <>
            <BigNumber
              value={String(r.lectura.pages)}
              fraction={`/ ${r.lectura.pagesGoal || 0} pág`}
              label="páginas en el mes"
              badge={r.lectura.pagesGoal > 0 && r.lectura.pages >= r.lectura.pagesGoal ? 'Meta ✓' : undefined}
              accent="text-cyan-600"
              progress={r.lectura.pagesGoal > 0 ? (r.lectura.pages / r.lectura.pagesGoal) * 100 : 0}
            />
            {r.lectura.perDay.length > 0 && (
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={r.lectura.perDay} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="d" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                      formatter={(v: any) => [`${v} pág`, 'Leídas']} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="pag" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {r.lectura.sessions === 0 && <AreaEmpty />}
          </>
        }
      />

      {/* Tareas generales */}
      <AreaRow
        title="Tareas generales"
        color={AREA_COLORS.tareas}
        plan={<TaskPlanList area={r.byArea.general} />}
        result={
          <div className="space-y-1">
            <ResultRow label="Completadas" value={`${r.byArea.general.done}/${r.byArea.general.total}`} ok={r.byArea.general.total > 0 && r.byArea.general.done === r.byArea.general.total} />
            {r.byArea.general.total === 0 && <AreaEmpty />}
          </div>
        }
      />

      {/* Emprendimiento */}
      <AreaRow
        title="Emprendimiento"
        color={AREA_COLORS.emprendimiento}
        plan={<TaskPlanList area={r.byArea.emprendimiento} />}
        result={
          <div className="space-y-1">
            <MinutesRow area={r.byArea.emprendimiento} />
            <ResultRow label="Tareas completadas" value={`${r.byArea.emprendimiento.done}/${r.byArea.emprendimiento.total}`} ok={r.byArea.emprendimiento.total > 0 && r.byArea.emprendimiento.done === r.byArea.emprendimiento.total} />
            {r.ingreso.amount > 0 && <ResultRow label="Ingresos del mes" value={`$${r.ingreso.amount}`} ok />}
            {r.byArea.emprendimiento.total === 0 && r.ingreso.count === 0 && <AreaEmpty />}
          </div>
        }
      />

      {/* Proyectos */}
      <AreaRow
        title="Proyectos"
        color={AREA_COLORS.proyectos}
        plan={<TaskPlanList area={r.byArea.proyectos} />}
        result={
          <div className="space-y-1">
            <MinutesRow area={r.byArea.proyectos} />
            <ResultRow label="Tareas completadas" value={`${r.byArea.proyectos.done}/${r.byArea.proyectos.total}`} ok={r.byArea.proyectos.total > 0 && r.byArea.proyectos.done === r.byArea.proyectos.total} />
            {r.byArea.proyectos.total === 0 && r.byArea.proyectos.minutes === 0 && <AreaEmpty />}
          </div>
        }
      />

      {/* Música */}
      <AreaRow
        title="Música"
        color={AREA_COLORS.musica}
        plan={
          <ul className="space-y-1.5">
            <CheckItem done={r.musica.minutes > 0}>Práctica mensual</CheckItem>
            <CheckItem>Escalas diarias</CheckItem>
          </ul>
        }
        result={
          <>
            <BigNumber
              value={`${r.musica.minutes}`}
              fraction="min"
              label="práctica en el mes"
              badge={r.musica.songs > 0 ? `${r.musica.songs} piezas` : undefined}
              accent="text-pink-600"
              progress={r.musica.minutes > 0 ? Math.min(r.musica.minutes / 2, 100) : 0}
            />
            {r.musica.sessions === 0 && <AreaEmpty />}
          </>
        }
      />

      {/* Ajedrez */}
      <AreaRow
        title="Ajedrez"
        color={AREA_COLORS.ajedrez}
        plan={
          <ul className="space-y-1.5">
            <CheckItem done={r.ajedrez.games > 0}>Partidas del mes</CheckItem>
            <CheckItem>Tácticas 15 min/día</CheckItem>
          </ul>
        }
        result={
          <>
            <ResultRow label="Partidas jugadas" value={String(r.ajedrez.games)} ok={r.ajedrez.games > 0} />
            <ResultRow label="Victorias" value={String(r.ajedrez.wins)} ok={r.ajedrez.wins > 0} />
            <ResultRow label="Elo actual" value={r.ajedrez.elo != null ? String(r.ajedrez.elo) : '—'} pending={r.ajedrez.elo == null} />
            {r.ajedrez.games === 0 && r.byArea.ajedrez.minutes === 0 && <AreaEmpty />}
          </>
        }
      />

      {/* Gym */}
      <AreaRow
        title="Gym"
        color={AREA_COLORS.gym}
        plan={
          <ul className="space-y-1.5">
            <CheckItem done={r.workoutMin > 0}>Entrenamientos del mes</CheckItem>
            <CheckItem>Registrar pesos</CheckItem>
          </ul>
        }
        result={
          <div className="space-y-1">
            <ResultRow label="Minutos de entrenamiento" value={`${r.workoutMin} min`} ok={r.workoutMin > 0} />
            <ResultRow label="Ejercicios registrados" value={String(r.gym.logs)} ok={r.gym.logs > 0} />
            <ResultRow label="Series registradas" value={String(r.gym.sets)} ok={r.gym.sets > 0} />
            {r.gym.maxWeight != null && <ResultRow label="Máximo peso" value={`${r.gym.maxWeight} kg`} ok />}
            {r.workoutMin === 0 && r.gym.logs === 0 && <AreaEmpty />}
          </div>
        }
      />

      {/* Game */}
      <AreaRow
        title="Game"
        color={AREA_COLORS.game}
        plan={
          <ul className="space-y-1.5">
            <CheckItem>Interacciones del mes</CheckItem>
            <CheckItem done={r.game.citas > 0}>Citas</CheckItem>
          </ul>
        }
        result={
          <div className="space-y-1">
            <ResultRow label="Citas" value={String(r.game.citas)} ok={r.game.citas > 0} />
            <ResultRow label="Eventos sociales" value={String(r.game.eventos)} ok={r.game.eventos > 0} />
            <ResultRow label="Registros de intimidad" value={String(r.game.intimidad)} ok={r.game.intimidad > 0} />
            <StagesBar stages={['Conocí', 'Salí', 'Besé', 'Intimidad']} current={r.game.intimidad > 0 ? 3 : r.game.citas > 0 ? 1 : 0} />
          </div>
        }
      />
    </div>
  );
}