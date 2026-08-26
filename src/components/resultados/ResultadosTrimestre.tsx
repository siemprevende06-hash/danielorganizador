import {
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  useResultadosPeriodo, EMPTY_RESULTADO, AREA_ORDER,
} from '@/hooks/useResultadosPeriodo';
import {
  ResultadoColumnas, GrupoResultados, AreaRowCols, ResumenGeneral, CheckItem, ResultRow,
  StagesBar, BigNumber, TaskPlanList, MinutesRow, AreaEmpty, PlanDelMes, AREA_COLORS,
  UniversityPlan, UniversityObjetivos, EntPlan, EntObjetivos, ProyectosPlan, ProyectosObjetivos, OtherTasksList,
} from './shared';
import { CreateTaskPeriodButton } from '@/components/tasks/CreateTaskPeriodButton';

const AREA_BAR: Record<string, string> = {
  universidad: '#3b82f6', emprendimiento: '#a855f7', proyectos: '#f59e0b',
  lectura: '#06b6d4', musica: '#ec4899', ajedrez: '#334155',
  game: '#f43f5e', idiomas: '#10b981', gym: '#ef4444', general: '#94a3b8',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-28 bg-muted/40 rounded-2xl animate-pulse" />
      <div className="h-64 bg-muted/40 rounded-2xl animate-pulse" />
    </div>
  );
}

export function ResultadosTrimestre({ quarter, year }: { quarter: number; year: number }) {
  const start = new Date(year, (quarter - 1) * 3, 1);
  const end = new Date(year, quarter * 3, 0);
  const { data } = useResultadosPeriodo(start, end);
  const r = data ?? EMPTY_RESULTADO;

  const pct = r.globalTotal > 0 ? Math.round((r.globalDone / r.globalTotal) * 100) : 0;
  const totalMin = r.systems.minutes + r.workoutMin + r.focusMin + Object.values(r.byArea).reduce((a, v) => a + v.minutes, 0);
  const badges = [
    r.globalTotal > 0 && `${r.globalDone}/${r.globalTotal} tareas`,
    r.lectura.pages > 0 && `${r.lectura.pages} pág leídas`,
    r.musica.songs > 0 && `${r.musica.songs} piezas`,
    r.ajedrez.games > 0 && `${r.ajedrez.games} partidas`,
    r.ingreso.amount > 0 && `$${r.ingreso.amount} ingresos`,
  ].filter(Boolean) as string[];

  const hoursByArea = AREA_ORDER
    .map(k => ({ area: k, hrs: Math.round(r.byArea[k].minutes / 60), fill: AREA_BAR[k] || '#94a3b8' }))
    .filter(x => x.hrs > 0);

  return (
    <div className="space-y-5">
      <ResumenGeneral
        score={r.score}
        subtitle={`Trimestre Q${quarter} ${year} · ${r.score}%`}
        badges={badges}
        stats={[
          ['Tareas', r.globalTotal > 0 ? `${pct}%` : '—'],
          ['Páginas', String(r.lectura.pages)],
          ['Horas', String(Math.round(totalMin / 60))],
          ['Elo', r.ajedrez.elo != null ? String(r.ajedrez.elo) : '—'],
        ]}
      />

      {/* Plan trimestral */}
      <PlanDelMes books={r.books} songs={r.songs} title={`Plan trimestral Q${quarter} ${year}`} />

      {/* Tiempo por área */}
      {hoursByArea.length > 0 && (
        <div className="rounded-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Horas del trimestre</p>
            <Badge variant="outline" className="text-[10px]">{Math.round(totalMin / 60)}h invertidas</Badge>
          </div>
          <div className="h-48">
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

      <div className="flex justify-end">
        <CreateTaskPeriodButton start={start} end={end} periodLabel={`Q${quarter} ${year}`} defaultDate={start} />
      </div>

      <ResultadoColumnas>
        <GrupoResultados label="Prioridades">
          {/* Universidad */}
          <AreaRowCols
            title="Universidad"
            color={AREA_COLORS.universidad}
            plan={<><UniversityPlan data={r.university.subjects} /><OtherTasksList tasks={r.university.otherTasks} /></>}
            objetivo={
              <div className="space-y-1">
                <UniversityObjetivos data={r.university.subjects} />
                <MinutesRow area={r.byArea.universidad} />
                <ResultRow label="Tareas completadas" value={`${r.byArea.universidad.done}/${r.byArea.universidad.total}`} ok={r.byArea.universidad.total > 0 && r.byArea.universidad.done === r.byArea.universidad.total} />
                {r.byArea.universidad.minutes === 0 && r.byArea.universidad.total === 0 && <AreaEmpty />}
              </div>
            }
          />

          {/* Emprendimiento */}
          <AreaRowCols
            title="Emprendimiento"
            color={AREA_COLORS.emprendimiento}
            plan={<><EntPlan data={r.entrepreneurships.businesses} /><OtherTasksList tasks={r.entrepreneurships.otherTasks} /></>}
            objetivo={
              <div className="space-y-1">
                <EntObjetivos data={r.entrepreneurships.businesses} />
                <MinutesRow area={r.byArea.emprendimiento} />
                <ResultRow label="Tareas completadas" value={`${r.byArea.emprendimiento.done}/${r.byArea.emprendimiento.total}`} ok={r.byArea.emprendimiento.total > 0 && r.byArea.emprendimiento.done === r.byArea.emprendimiento.total} />
                {r.ingreso.amount > 0 && <ResultRow label="Ingresos del trimestre" value={`$${r.ingreso.amount}`} ok />}
                {r.byArea.emprendimiento.total === 0 && r.ingreso.count === 0 && <AreaEmpty />}
              </div>
            }
          />

          {/* Proyectos */}
          <AreaRowCols
            title="Proyectos"
            color={AREA_COLORS.proyectos}
            plan={<><ProyectosPlan data={r.projects.list} /><OtherTasksList tasks={r.projects.otherTasks} /></>}
            objetivo={
              <div className="space-y-1">
                <ProyectosObjetivos data={r.projects.list} />
                <MinutesRow area={r.byArea.proyectos} />
                <ResultRow label="Tareas completadas" value={`${r.byArea.proyectos.done}/${r.byArea.proyectos.total}`} ok={r.byArea.proyectos.total > 0 && r.byArea.proyectos.done === r.byArea.proyectos.total} />
                {r.byArea.proyectos.total === 0 && r.byArea.proyectos.minutes === 0 && <AreaEmpty />}
              </div>
            }
          />

          {/* Idiomas */}
          <AreaRowCols
            title="Idiomas"
            color={AREA_COLORS.idiomas}
            plan={<TaskPlanList area={r.byArea.idiomas} />}
            objetivo={
              <div className="space-y-1">
                <MinutesRow area={r.byArea.idiomas} />
                <ResultRow label="Tareas completadas" value={`${r.byArea.idiomas.done}/${r.byArea.idiomas.total}`} ok={r.byArea.idiomas.total > 0 && r.byArea.idiomas.done === r.byArea.idiomas.total} />
                {r.byArea.idiomas.minutes === 0 && r.byArea.idiomas.total === 0 && <AreaEmpty />}
              </div>
            }
          />

          {/* Gym */}
          <AreaRowCols
            title="Gym"
            color={AREA_COLORS.gym}
            plan={
              <ul className="space-y-1.5">
                <CheckItem done={r.workoutMin > 0}>Entrenamientos del trimestre</CheckItem>
                <CheckItem>Registrar pesos</CheckItem>
              </ul>
            }
            objetivo={
              <div className="space-y-1">
                <ResultRow label="Minutos de entrenamiento" value={`${r.workoutMin} min`} ok={r.workoutMin > 0} />
                <ResultRow label="Ejercicios registrados" value={String(r.gym.logs)} ok={r.gym.logs > 0} />
                <ResultRow label="Series registradas" value={String(r.gym.sets)} ok={r.gym.sets > 0} />
                {r.gym.maxWeight != null && <ResultRow label="Máximo peso" value={`${r.gym.maxWeight} kg`} ok />}
                {r.workoutMin === 0 && r.gym.logs === 0 && <AreaEmpty />}
              </div>
            }
          />
        </GrupoResultados>

        <GrupoResultados label="Acumulativos">
          {/* Lectura */}
          <AreaRowCols
            title="Lectura"
            color={AREA_COLORS.lectura}
            plan={
              <ul className="space-y-1.5">
                <CheckItem>Meta trimestral de páginas</CheckItem>
                <CheckItem done={r.lectura.pages >= r.lectura.pagesGoal && r.lectura.pages > 0}>Leer {r.lectura.pagesGoal || 1500} páginas</CheckItem>
              </ul>
            }
            objetivo={
              <>
                <BigNumber
                  value={String(r.lectura.pages)}
                  fraction={`/ ${r.lectura.pagesGoal || 0} pág`}
                  label="páginas en el trimestre"
                  badge={r.lectura.pagesGoal > 0 && r.lectura.pages >= r.lectura.pagesGoal ? 'Meta ✓' : undefined}
                  accent="text-cyan-600"
                  progress={r.lectura.pagesGoal > 0 ? (r.lectura.pages / r.lectura.pagesGoal) * 100 : 0}
                />
                <MinutesRow area={{ minutes: r.lectura.minutes, goalMinutes: 0 }} label="Minutos de lectura" />
                {r.lectura.sessions === 0 && <AreaEmpty />}
              </>
            }
          />

          {/* Música */}
          <AreaRowCols
            title="Música"
            color={AREA_COLORS.musica}
            plan={
              <ul className="space-y-1.5">
                <CheckItem done={r.musica.minutes > 0}>Práctica trimestral</CheckItem>
                <CheckItem>Escalas diarias</CheckItem>
              </ul>
            }
            objetivo={
              <>
                <BigNumber
                  value={`${r.musica.minutes}`}
                  fraction="min"
                  label="práctica en el trimestre"
                  badge={r.musica.songs > 0 ? `${r.musica.songs} piezas` : undefined}
                  accent="text-pink-600"
                  progress={r.musica.minutes > 0 ? Math.min(r.musica.minutes, 600) * (100 / 600) : 0}
                />
                {r.musica.sessions === 0 && <AreaEmpty />}
              </>
            }
          />

          {/* Ajedrez */}
          <AreaRowCols
            title="Ajedrez"
            color={AREA_COLORS.ajedrez}
            plan={
              <ul className="space-y-1.5">
                <CheckItem done={r.ajedrez.games > 0}>Partidas del trimestre</CheckItem>
                <CheckItem>Tácticas 15 min/día</CheckItem>
              </ul>
            }
            objetivo={
              <>
                <ResultRow label="Partidas jugadas" value={String(r.ajedrez.games)} ok={r.ajedrez.games > 0} />
                <ResultRow label="Victorias" value={String(r.ajedrez.wins)} ok={r.ajedrez.wins > 0} />
                <ResultRow label="Elo actual" value={r.ajedrez.elo != null ? String(r.ajedrez.elo) : '—'} pending={r.ajedrez.elo == null} />
                {r.ajedrez.history.length > 1 && (
                  <div className="h-20">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={r.ajedrez.history} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                        <XAxis dataKey="d" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} interval={2} />
                        <YAxis domain={['dataMin - 20', 'dataMax + 20']} tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={32} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                          formatter={(v: any) => [`${v}`, 'Elo']} />
                        <Line type="monotone" dataKey="elo" stroke="#0f172a" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {r.ajedrez.games === 0 && r.byArea.ajedrez.minutes === 0 && <AreaEmpty />}
              </>
            }
          />

          {/* Game */}
          <AreaRowCols
            title="Game"
            color={AREA_COLORS.game}
            plan={
              <ul className="space-y-1.5">
                <CheckItem>Interacciones del trimestre</CheckItem>
                <CheckItem done={r.game.citas > 0}>Citas</CheckItem>
              </ul>
            }
            objetivo={
              <div className="space-y-1">
                <ResultRow label="Citas" value={String(r.game.citas)} ok={r.game.citas > 0} />
                <ResultRow label="Eventos sociales" value={String(r.game.eventos)} ok={r.game.eventos > 0} />
                <ResultRow label="Registros de intimidad" value={String(r.game.intimidad)} ok={r.game.intimidad > 0} />
                <StagesBar stages={['Conocí', 'Salí', 'Besé', 'Intimidad']} current={r.game.intimidad > 0 ? 3 : r.game.citas > 0 ? 1 : 0} />
              </div>
            }
          />
        </GrupoResultados>

        <GrupoResultados label="Tareas generales">
          {/* Tareas generales */}
          <AreaRowCols
            title="Tareas generales"
            color={AREA_COLORS.tareas}
            plan={<TaskPlanList area={r.byArea.general} />}
            objetivo={
              <div className="space-y-1">
                <ResultRow label="Completadas" value={`${r.byArea.general.done}/${r.byArea.general.total}`} ok={r.byArea.general.total > 0 && r.byArea.general.done === r.byArea.general.total} />
                {r.byArea.general.total === 0 && <AreaEmpty />}
              </div>
            }
          />
        </GrupoResultados>
      </ResultadoColumnas>
    </div>
  );
}