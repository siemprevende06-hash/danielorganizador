import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BookOpen, Brain, Flame, Globe, Languages, Music, Sparkles, Target, Timer, Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWeekGoalEffective, setWeekGoal } from '@/lib/hierarchy';
import type { WeeklyAreaData } from '@/hooks/useWeeklyPlanData';
import { Ring } from './WeekMinutesRings';
import { fmtMin } from './AreaRow';

function Tile({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-muted bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className={cn('w-7 h-7 rounded-lg bg-muted/50 grid place-items-center shrink-0', accent)}>{icon}</span>
        <h4 className="text-[11px] font-bold uppercase tracking-wider">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function StatLine({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[10px]">
      <span className="text-muted-foreground truncate">{label}</span>
      <span className="font-semibold tabular-nums shrink-0">
        {value}
        {hint && <span className="text-muted-foreground font-normal ml-1">{hint}</span>}
      </span>
    </div>
  );
}

function GoalInput({ weekStart, area }: { weekStart: Date; area: string }) {
  const [, force] = useState(0);
  const value = getWeekGoalEffective(weekStart, area);
  return (
    <Input
      type="number"
      min={0}
      step={15}
      value={value || ''}
      onChange={e => {
        setWeekGoal(weekStart, area, Math.max(0, parseInt(e.target.value) || 0));
        force(v => v + 1);
      }}
      className="h-6 w-16 text-[10px] tabular-nums text-center"
      title="Objetivo de minutos de la semana"
    />
  );
}

export function PersonalDevelopment({
  weekStart,
  data,
  weekBookId,
  pagesGoal,
  onBookChange,
  onPagesGoalChange,
}: {
  weekStart: Date;
  data: WeeklyAreaData;
  weekBookId: string;
  pagesGoal: number;
  onBookChange: (id: string) => void;
  onPagesGoalChange: (pages: number) => void;
}) {
  const book = data.reading.book;
  const selectedBook = (weekBookId ? data.reading.books.find(b => b.id === weekBookId) : null) ?? book;

  const lecturaGoal = getWeekGoalEffective(weekStart, 'lectura');
  const musicaGoal = getWeekGoalEffective(weekStart, 'musica');
  const ajedrezGoal = getWeekGoalEffective(weekStart, 'ajedrez');
  const inglesGoal = getWeekGoalEffective(weekStart, 'ingles');
  const italianoGoal = getWeekGoalEffective(weekStart, 'italiano');
  const gameGoal = getWeekGoalEffective(weekStart, 'game');
  const gymGoal = getWeekGoalEffective(weekStart, 'gym');

  const idiomasTotal = data.idiomas.inglesMinutes + data.idiomas.italianoMinutes;
  const idiomasGoal = inglesGoal + italianoGoal;

  return (
    <section className="rounded-2xl border-2 border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-background to-background backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-emerald-500/20 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 grid place-items-center">
          <Brain className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold tracking-tight leading-tight">Desarrollo personal</h2>
          <p className="text-[10px] text-muted-foreground">Lectura, idiomas, ajedrez, seducción y música</p>
        </div>
        <Badge variant="outline" className="text-[10px] h-5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
          {fmtMin(data.reading.minutes + data.musica.minutes + data.ajedrez.minutes + idiomasTotal + data.game.minutos)}
          / semana
        </Badge>
      </div>

      <div className="p-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {/* LECTURA */}
        <Tile title="Lectura" icon={<BookOpen className="w-3.5 h-3.5" />} accent="text-cyan-600 dark:text-cyan-400">
          <div className="flex gap-2.5">
            {/* Portada del libro de la semana */}
            <div className="w-16 h-[84px] shrink-0 rounded-md overflow-hidden border bg-muted/40 grid place-items-center">
              {selectedBook?.cover ? (
                <img src={selectedBook.cover} alt={selectedBook.title} className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-5 h-5 text-muted-foreground/50" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <select
                value={selectedBook?.id ?? ''}
                onChange={e => onBookChange(e.target.value)}
                className="h-7 w-full rounded-md border border-input bg-background px-1.5 text-[10px] font-medium outline-none"
              >
                <option value="">Libro de la semana…</option>
                {data.reading.books.map(b => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
              <p className="text-[9px] text-muted-foreground truncate">{selectedBook?.author || 'Sin autor'}</p>
              <StatLine
                label="Páginas leídas"
                value={data.reading.pages}
                hint={selectedBook?.pagesTotal ? `/ ${selectedBook.pagesTotal}` : 'pág'}
              />
              <StatLine label="Sesiones" value={data.reading.sessions} />
            </div>
          </div>

          {/* Minutos dedicados esta semana + objetivo */}
          <div className="flex items-center gap-2.5 pt-1.5 border-t border-muted/40">
            <Ring
              label="Minutos"
              value={data.reading.minutes}
              goal={lecturaGoal}
              size={54}
              stroke={5}
              color="#06b6d4"
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Timer className="w-3 h-3" /> Dedicados esta semana
                </span>
                <span className="text-[10px] font-bold tabular-nums text-cyan-600 dark:text-cyan-400">
                  {fmtMin(data.reading.minutes)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Target className="w-3 h-3" /> Objetivo de minutos
                </span>
                <GoalInput weekStart={weekStart} area="lectura" />
              </div>
              <StatLine
                label="Esperado leer"
                value={
                  <Input
                    type="number"
                    min={0}
                    step={10}
                    value={pagesGoal || ''}
                    onChange={e => onPagesGoalChange(Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-5 w-16 text-[9px] tabular-nums text-center"
                    placeholder={String(selectedBook?.pagesTotal || data.reading.pages)}
                  />
                }
                hint="pág"
              />
            </div>
          </div>

          {data.reading.perDay.length > 0 && (
            <div className="flex gap-0.5 pt-1">
              {data.reading.perDay.map(d => (
                <div
                  key={d.d}
                  className="flex-1 text-center rounded bg-cyan-500/10 py-0.5"
                  title={`${d.d}: ${d.pages} pág · ${d.minutes} min`}
                >
                  <span className="text-[8px] tabular-nums text-cyan-600 dark:text-cyan-400 font-semibold">{d.pages}</span>
                </div>
              ))}
            </div>
          )}
        </Tile>

        {/* IDIOMAS: inglés + italiano */}
        <Tile title="Idiomas" icon={<Languages className="w-3.5 h-3.5" />} accent="text-sky-600 dark:text-sky-400">
          <div className="flex items-center gap-2.5">
            <Ring label="Total" value={idiomasTotal} goal={idiomasGoal} size={58} stroke={5} color="#0ea5e9" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 w-12">Inglés</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-500"
                    style={{ width: `${inglesGoal > 0 ? Math.min(100, (data.idiomas.inglesMinutes / inglesGoal) * 100) : 0}%` }}
                  />
                </div>
                <span className="text-[9px] tabular-nums text-muted-foreground w-16 text-right">
                  {data.idiomas.inglesMinutes}/{inglesGoal}m
                </span>
                <GoalInput weekStart={weekStart} area="ingles" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 w-12">Italiano</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${italianoGoal > 0 ? Math.min(100, (data.idiomas.italianoMinutes / italianoGoal) * 100) : 0}%` }}
                  />
                </div>
                <span className="text-[9px] tabular-nums text-muted-foreground w-16 text-right">
                  {data.idiomas.italianoMinutes}/{italianoGoal}m
                </span>
                <GoalInput weekStart={weekStart} area="italiano" />
              </div>
            </div>
          </div>

          <div className="space-y-1 pt-1.5 border-t border-muted/40">
            <StatLine label="Inglés · sesiones" value={data.idiomas.inglesSessions} />
            <StatLine label="Italiano · sesiones" value={data.idiomas.italianoSessions} />
            <StatLine label="Total dedicado" value={fmtMin(idiomasTotal)} />
          </div>

          <div className="flex gap-1 pt-1">
            {[
              { k: 'ingles', label: 'Inglés', min: data.idiomas.inglesMinutes, goal: inglesGoal, color: 'bg-sky-500' },
              { k: 'italiano', label: 'Italiano', min: data.idiomas.italianoMinutes, goal: italianoGoal, color: 'bg-indigo-500' },
            ].map(l => (
              <div key={l.k} className="flex-1 rounded-lg border border-muted/50 p-1.5 text-center">
                <p className="text-[9px] font-semibold">{l.label}</p>
                <p className="text-[11px] font-bold tabular-nums">{l.min}m</p>
                <div className="h-1 mt-0.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full', l.color)}
                    style={{ width: `${l.goal > 0 ? Math.min(100, (l.min / l.goal) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Tile>

        {/* AJEDREZ */}
        <Tile title="Ajedrez" icon={<Trophy className="w-3.5 h-3.5" />} accent="text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-2.5">
            <Ring label="Minutos" value={data.ajedrez.minutes} goal={ajedrezGoal} size={58} stroke={5} color="#f59e0b" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Timer className="w-3 h-3" /> Objetivo de minutos
                </span>
                <GoalInput weekStart={weekStart} area="ajedrez" />
              </div>
              <StatLine label="Partidas" value={data.ajedrez.games} />
              <StatLine label="Victorias" value={data.ajedrez.wins} />
              <StatLine label="Elo" value={data.ajedrez.elo ?? '—'} />
            </div>
          </div>
          {data.ajedrez.games > 0 && (
            <div className="pt-1.5 border-t border-muted/40">
              <StatLine
                label="Ratio de victorias"
                value={`${Math.round((data.ajedrez.wins / data.ajedrez.games) * 100)}%`}
              />
            </div>
          )}
        </Tile>

        {/* GAME / SEDUCCIÓN */}
        <Tile title="Game · Seducción" icon={<Flame className="w-3.5 h-3.5" />} accent="text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-2.5">
            <Ring label="Minutos" value={data.game.minutos} goal={gameGoal} size={58} stroke={5} color="#f43f5e" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Target className="w-3 h-3" /> Objetivo de minutos
                </span>
                <GoalInput weekStart={weekStart} area="game" />
              </div>
              <StatLine label="Citas" value={data.game.citas} />
              <StatLine label="Eventos / salidas" value={data.game.eventos} />
              <StatLine label="Días de intimidad" value={data.game.intimidad} />
            </div>
          </div>
        </Tile>

        {/* MÚSICA */}
        <Tile title="Música" icon={<Music className="w-3.5 h-3.5" />} accent="text-pink-600 dark:text-pink-400">
          <div className="flex gap-2.5">
            <div className="w-12 h-12 shrink-0 rounded-md overflow-hidden border bg-muted/40 grid place-items-center">
              {data.musica.cover ? (
                <img src={data.musica.cover} alt={data.musica.song ?? ''} className="w-full h-full object-cover" />
              ) : (
                <Music className="w-4 h-4 text-muted-foreground/50" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[11px] font-semibold truncate">{data.musica.song ?? 'Sin pieza en práctica'}</p>
              <StatLine label="Sesiones" value={data.musica.sessions} />
              <StatLine label="Minutos" value={fmtMin(data.musica.minutes)} />
            </div>
          </div>
          <div className="flex items-center gap-2.5 pt-1.5 border-t border-muted/40">
            <Ring label="Minutos" value={data.musica.minutes} goal={musicaGoal} size={48} stroke={5} color="#ec4899" />
            <div className="flex-1 flex items-center justify-between gap-1">
              <span className="text-[10px] text-muted-foreground">Objetivo de minutos</span>
              <GoalInput weekStart={weekStart} area="musica" />
            </div>
          </div>
        </Tile>

        {/* GYM */}
        <Tile title="Gym" icon={<Sparkles className="w-3.5 h-3.5" />} accent="text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2.5">
            <Ring label="Sesiones" value={data.gym.logs} goal={gymGoal} size={58} stroke={5} color="#10b981" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Target className="w-3 h-3" /> Objetivo de la semana
                </span>
                <GoalInput weekStart={weekStart} area="gym" />
              </div>
              <StatLine label="Entrenamientos" value={data.gym.logs} />
              <StatLine label="Minutos" value={fmtMin(data.gym.minutes)} />
            </div>
          </div>
        </Tile>

        {/* Idiomas: resumen de objetivos */}
        <Tile title="Idiomas · objetivos" icon={<Globe className="w-3.5 h-3.5" />} accent="text-violet-600 dark:text-violet-400">
          <p className="text-[10px] text-muted-foreground">
            Ajusta aquí los minutos objetivo de cada idioma; se reflejan en los círculos indicadores de la semana.
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">Inglés</span>
              <GoalInput weekStart={weekStart} area="ingles" />
              <span className="text-[9px] tabular-nums text-muted-foreground">
                {data.idiomas.inglesMinutes}m de {getWeekGoalEffective(weekStart, 'ingles')}m
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">Italiano</span>
              <GoalInput weekStart={weekStart} area="italiano" />
              <span className="text-[9px] tabular-nums text-muted-foreground">
                {data.idiomas.italianoMinutes}m de {getWeekGoalEffective(weekStart, 'italiano')}m
              </span>
            </div>
          </div>
        </Tile>
      </div>
    </section>
  );
}