import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import {
  useResultadosPeriodo, EMPTY_RESULTADO,
} from '@/hooks/useResultadosPeriodo';
import {
  AreaRow, ResumenGeneral, CheckItem, ResultRow, StagesBar, BigNumber, TaskPlanList, MinutesRow, AreaEmpty, AREA_COLORS,
} from './shared';

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

export function ResultadosDia({ date }: { date: Date }) {
  const { data } = useResultadosPeriodo(date, date);
  const r = data ?? EMPTY_RESULTADO;

  const pct = r.globalTotal > 0 ? Math.round((r.globalDone / r.globalTotal) * 100) : 0;
  const totalMin = r.systems.minutes + r.workoutMin + r.focusMin + Object.values(r.byArea).reduce((a, v) => a + v.minutes, 0);
  const badges = [
    r.globalTotal > 0 && `${r.globalDone}/${r.globalTotal} tareas`,
    r.systems.total > 0 && `${r.systems.done}/${r.systems.total} hábitos`,
    r.lectura.pages > 0 && `${r.lectura.pages} pág leídas`,
    r.ajedrez.elo != null && `${r.ajedrez.elo} Elo`,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      <ResumenGeneral
        score={r.score}
        subtitle={`Día · ${r.score}%`}
        badges={badges}
        stats={[
          ['Tareas', r.globalTotal > 0 ? `${pct}%` : '—'],
          ['Páginas', String(r.lectura.pages)],
          ['Minutos', String(Math.round(totalMin))],
          ['Partidas', String(r.ajedrez.games)],
        ]}
      />

      {/* Universidad */}
      <AreaRow
        title="Universidad"
        color={AREA_COLORS.universidad}
        plan={<TaskPlanList area={r.byArea.universidad} />}
        result={
          <div className="space-y-1">
            <MinutesRow area={r.byArea.universidad} />
            <ResultRow label="Tareas completadas" value={`${r.byArea.universidad.done}/${r.byArea.universidad.total}`} ok={r.byArea.universidad.total > 0 && r.byArea.universidad.done === r.byArea.universidad.total} />
            {r.byArea.universidad.minutes === 0 && r.byArea.universidad.total === 0 && <AreaEmpty>Sin actividades registradas</AreaEmpty>}
          </div>
        }
      />

      {/* Lectura */}
      <AreaRow
        title="Lectura"
        color={AREA_COLORS.lectura}
        plan={
          <ul className="space-y-1.5">
            <CheckItem>Meta de páginas del día</CheckItem>
            <CheckItem done={r.lectura.pages >= r.lectura.pagesGoal && r.lectura.pages > 0}>Leer mínimo {r.lectura.pagesGoal || 25} páginas</CheckItem>
          </ul>
        }
        result={
          <div className="space-y-1">
            <BigNumber
              value={String(r.lectura.pages)}
              fraction={`/ ${r.lectura.pagesGoal || 0} pág`}
              label="páginas leídas"
              badge={r.lectura.pagesGoal > 0 && r.lectura.pages >= r.lectura.pagesGoal ? 'Meta ✓' : r.lectura.pages > 0 ? 'En curso' : undefined}
              progress={r.lectura.pagesGoal > 0 ? (r.lectura.pages / r.lectura.pagesGoal) * 100 : r.lectura.pages > 0 ? 100 : 0}
            />
            <MinutesRow area={{ minutes: r.lectura.minutes, goalMinutes: 0 }} label="Minutos de lectura" />
            {r.lectura.sessions === 0 && <AreaEmpty>Sin sesiones de lectura registradas</AreaEmpty>}
          </div>
        }
      />

      {/* Tareas generales */}
      <AreaRow
        title="Tareas generales"
        color={AREA_COLORS.tareas}
        plan={<TaskPlanList area={r.byArea.general} />}
        result={
          r.byArea.general.total > 0 ? (
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ name: 'Completadas', value: r.byArea.general.done }, { name: 'Pendientes', value: r.byArea.general.total - r.byArea.general.done }]}
                      dataKey="value" innerRadius={32} outerRadius={46} paddingAngle={3} stroke="none">
                      <Cell fill="#10b981" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {r.byArea.general.done} completadas</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-200" /> {r.byArea.general.total - r.byArea.general.done} pendientes</div>
                <p className="text-[10px] text-muted-foreground pt-1">{pct}% del día resuelto</p>
              </div>
            </div>
          ) : (
            <AreaEmpty />
          )
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
            {r.ingreso.amount > 0 && <ResultRow label="Ingresos del período" value={`$${r.ingreso.amount}`} ok />}
            {r.byArea.emprendimiento.minutes === 0 && r.byArea.emprendimiento.total === 0 && r.ingreso.count === 0 && <AreaEmpty />}
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
            {r.byArea.proyectos.minutes === 0 && r.byArea.proyectos.total === 0 && <AreaEmpty />}
          </div>
        }
      />

      {/* Música */}
      <AreaRow
        title="Música"
        color={AREA_COLORS.musica}
        plan={
          <ul className="space-y-1.5">
            <CheckItem done={r.musica.minutes > 0}>Practicar instrumento</CheckItem>
            <CheckItem>Escalas y calentamiento</CheckItem>
          </ul>
        }
        result={
          <div className="space-y-1">
            <BigNumber
              value={`${r.musica.minutes}`}
              fraction="min"
              label="práctica registrada"
              badge={r.musica.songs > 0 ? `${r.musica.songs} piezas` : undefined}
              accent="text-pink-600"
              progress={r.musica.minutes > 0 ? Math.min(r.musica.minutes, 60) * (100 / 60) : 0}
            />
            <ResultRow label="Sesiones de práctica" value={String(r.musica.sessions)} ok={r.musica.sessions > 0} />
            {r.musica.sessions === 0 && <AreaEmpty />}
          </div>
        }
      />

      {/* Ajedrez */}
      <AreaRow
        title="Ajedrez"
        color={AREA_COLORS.ajedrez}
        plan={
          <ul className="space-y-1.5">
            <CheckItem done={r.ajedrez.games > 0}>Partidas del día</CheckItem>
            <CheckItem>Tácticas 15 min</CheckItem>
          </ul>
        }
        result={
          <div className="space-y-1">
            <ResultRow label="Partidas jugadas" value={String(r.ajedrez.games)} ok={r.ajedrez.games > 0} />
            <ResultRow label="Victorias" value={String(r.ajedrez.wins)} ok={r.ajedrez.wins > 0} />
            <ResultRow label="Elo actual" value={r.ajedrez.elo != null ? String(r.ajedrez.elo) : '—'} pending={r.ajedrez.elo == null} />
            <MinutesRow area={r.byArea.ajedrez} />
            {r.ajedrez.games === 0 && r.byArea.ajedrez.minutes === 0 && <AreaEmpty />}
          </div>
        }
      />

      {/* Gym */}
      <AreaRow
        title="Gym"
        color={AREA_COLORS.gym}
        plan={
          <ul className="space-y-1.5">
            <CheckItem done={r.workoutMin > 0}>Entrenamiento del día</CheckItem>
            <CheckItem>Registrar pesos</CheckItem>
          </ul>
        }
        result={
          <div className="space-y-1">
            <ResultRow label="Minutos de entrenamiento" value={`${r.workoutMin} min`} ok={r.workoutMin > 0} />
            <ResultRow label="Ejercicios registrados" value={String(r.gym.logs)} ok={r.gym.logs > 0} />
            {r.gym.maxWeight != null && <ResultRow label="Máximo peso levantado" value={`${r.gym.maxWeight} kg`} ok />}
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
            <CheckItem>Interacciones del día</CheckItem>
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