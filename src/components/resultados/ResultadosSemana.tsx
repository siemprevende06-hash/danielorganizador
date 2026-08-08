import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid,
} from 'recharts';
import { endOfWeek } from 'date-fns';
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

export function ResultadosSemana({ weekStart }: { weekStart: Date }) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const { data } = useResultadosPeriodo(weekStart, weekEnd);
  const r = data ?? EMPTY_RESULTADO;

  const pct = r.globalTotal > 0 ? Math.round((r.globalDone / r.globalTotal) * 100) : 0;
  const totalMin = r.systems.minutes + r.workoutMin + r.focusMin + Object.values(r.byArea).reduce((a, v) => a + v.minutes, 0);
  const badges = [
    r.globalTotal > 0 && `${r.globalDone}/${r.globalTotal} tareas`,
    r.systems.total > 0 && `${r.systems.done} hábitos/día`,
    r.lectura.pages > 0 && `${r.lectura.pages} pág`,
    r.ajedrez.games > 0 && `${r.ajedrez.games} partidas`,
  ].filter(Boolean) as string[];

  const dayName = (d: string) => d.slice(8, 10);

  return (
    <div className="space-y-5">
      <ResumenGeneral
        score={r.score}
        subtitle={`Semana · ${r.score}%`}
        badges={badges}
        stats={[
          ['Tareas', r.globalTotal > 0 ? `${pct}%` : '—'],
          ['Páginas', String(r.lectura.pages)],
          ['Horas', String(Math.round(totalMin / 60))],
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
            <CheckItem>Meta semanal de páginas</CheckItem>
            <CheckItem done={r.lectura.pages >= r.lectura.pagesGoal && r.lectura.pages > 0}>Leer {r.lectura.pagesGoal || 150} páginas en la semana</CheckItem>
          </ul>
        }
        result={
          <>
            <BigNumber
              value={String(r.lectura.pages)}
              fraction={`/ ${r.lectura.pagesGoal || 0} pág`}
              label="páginas leídas en la semana"
              badge={r.lectura.pagesGoal > 0 && r.lectura.pages >= r.lectura.pagesGoal ? 'Meta ✓' : undefined}
              accent="text-cyan-600"
              progress={r.lectura.pagesGoal > 0 ? (r.lectura.pages / r.lectura.pagesGoal) * 100 : 0}
            />
            {r.lectura.perDay.length > 0 && (
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={r.lectura.perDay.map(p => ({ ...p, d: dayName(p.d) }))} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="d" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                      formatter={(v: any) => [`${v} pág`, 'Leídas']} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="pag" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {r.lectura.sessions === 0 && <AreaEmpty>Sin sesiones de lectura en la semana</AreaEmpty>}
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
            {r.ingreso.amount > 0 && <ResultRow label="Ingresos" value={`$${r.ingreso.amount}`} ok />}
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
            <CheckItem done={r.musica.minutes > 0}>Practicar instrumento</CheckItem>
            <CheckItem>Escalas diarias</CheckItem>
          </ul>
        }
        result={
          <>
            <BigNumber
              value={`${r.musica.minutes}`}
              fraction="min"
              label="práctica en la semana"
              badge={r.musica.songs > 0 ? `${r.musica.songs} piezas` : undefined}
              accent="text-pink-600"
              progress={r.musica.minutes > 0 ? Math.min(r.musica.minutes / 5, 100) : 0}
            />
            {r.musica.perDay.length > 0 && (
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={r.musica.perDay.map(p => ({ ...p, d: dayName(p.d) }))} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="d" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                      formatter={(v: any) => [`${v} min`, 'Práctica']} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="min" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
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
            <CheckItem done={r.ajedrez.games > 0}>Partidas de la semana</CheckItem>
            <CheckItem>Tácticas 15 min/día</CheckItem>
          </ul>
        }
        result={
          <>
            <ResultRow label="Partidas jugadas" value={String(r.ajedrez.games)} ok={r.ajedrez.games > 0} />
            <ResultRow label="Victorias" value={String(r.ajedrez.wins)} ok={r.ajedrez.wins > 0} />
            <ResultRow label="Elo actual" value={r.ajedrez.elo != null ? String(r.ajedrez.elo) : '—'} pending={r.ajedrez.elo == null} />
            {r.ajedrez.history.length > 1 && (
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={r.ajedrez.history} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="d" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                    <YAxis domain={['dataMin - 20', 'dataMax + 20']} tick={{ fontSize: 8 }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }}
                      formatter={(v: any) => [`${v}`, 'Elo']} />
                    <Line type="monotone" dataKey="elo" stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
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
            <CheckItem done={r.workoutMin > 0}>Entrenamientos de la semana</CheckItem>
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
            <CheckItem>Interacciones de la semana</CheckItem>
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