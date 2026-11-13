import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RoutineBlock } from '@/hooks/useRoutineBlocks';
import type { TaskItem } from '@/hooks/useDailyPlanData';
import type { SpeedPlan } from '@/lib/speedPlan';
import {
  autoSystemForBlock,
  describeSystemMinutes,
  minutesBetween,
  parseTimeToMinutes,
} from '@/lib/speedPlan';
import {
  MINUTES_PER_DAY,
  effectiveBlockEndTime,
  formatClockTime,
  formatClockTime24,
  formatDuration,
  routineBlockStateAt,
  routineBlockStaticState,
  routineBlockWindow,
  sortRoutineBlocks,
} from '@/lib/routineTime';
import { getBlockVisual } from '@/lib/routineVisuals';
import { routineBlockCoverId } from '@/lib/routineCovers';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useWorkoutTracking } from '@/hooks/useWorkoutTracking';
import { useReadingLibrary } from '@/hooks/useReadingLibrary';
import { useMusicRepertoire } from '@/hooks/useMusicRepertoire';
import {
  Book,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Gauge,
  Languages,
  ListChecks,
  Maximize2,
  Minimize2,
  Moon,
  Music,
  Pause,
  Play,
  Sun,
  X,
  type LucideIcon,
} from 'lucide-react';

interface Props {
  blocks: RoutineBlock[];
  initialBlockId: string;
  startFollowing: boolean;
  tasksByBlock: Record<string, TaskItem[]>;
  tasks: TaskItem[];
  covers?: Record<string, string>;
  isBlockCompleted: (blockId: string) => boolean;
  onToggleBlock: (blockId: string) => void;
  onToggleTask: (taskId: string) => void;
  speedPlan?: SpeedPlan;
  isToday: boolean;
  selectedDateLabel: string;
  routineLabel?: string;
  languageChoice?: string;
  onClose: () => void;
}

const SPEED_STATE_CLASSES: Record<string, string> = {
  'sin-plan': 'text-white/40',
  'sin-dosis': 'text-red-300',
  racha: 'text-rose-300',
  minimo: 'text-blue-300',
  maximo: 'text-emerald-300',
  extra: 'text-amber-300',
};

type BlockType =
  | 'gym'
  | 'lectura'
  | 'musica'
  | 'idiomas'
  | 'deepwork'
  | 'ajedrez'
  | 'other';

function identifyBlockType(title: string): BlockType {
  const value = title.toLowerCase();
  if (value.includes('gym') || value.includes('entreno')) return 'gym';
  if (value.includes('lectura') || value.includes('podcast')) return 'lectura';
  if (
    value.includes('música') ||
    value.includes('musica') ||
    value.includes('piano') ||
    value.includes('guitarra')
  ) {
    return 'musica';
  }
  if (value.includes('idiomas')) return 'idiomas';
  if (value.includes('ajedrez')) return 'ajedrez';
  if (
    value.includes('deep work') ||
    value.includes('trabajo') ||
    value.includes('focus') ||
    value.includes('bloque')
  ) {
    return 'deepwork';
  }
  return 'other';
}

function ContextLine({
  icon: Icon,
  text,
}: {
  icon: LucideIcon;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/70 sm:text-base">
      <Icon className="h-4 w-4 shrink-0 text-white/50 sm:h-5 sm:w-5" />
      <span className="truncate">{text}</span>
    </div>
  );
}

type WorkoutState = ReturnType<typeof useWorkoutTracking>;
type ReadingState = ReturnType<typeof useReadingLibrary>;
type MusicState = ReturnType<typeof useMusicRepertoire>;

function GymContext({ workout }: { workout: WorkoutState }) {
  const { routine, getTodayWorkout, isLoading } = workout;

  if (isLoading) {
    return <ContextLine icon={Dumbbell} text="Cargando rutina de gym…" />;
  }
  if (!routine) return null;

  const today = getTodayWorkout();
  if (!today.isWorkoutDay) {
    return <ContextLine icon={Dumbbell} text="Hoy es día de descanso" />;
  }

  const groups = Array.from(
    new Set(
      today.exercises
        .map(exercise => exercise.muscle_group || exercise.name)
        .filter(Boolean),
    ),
  ).slice(0, 4);

  return (
    <ContextLine
      icon={Dumbbell}
      text={`${today.dayName}${groups.length > 0 ? ` · ${groups.join(', ')}` : ''}`}
    />
  );
}

function ReadingContext({ reading }: { reading: ReadingState }) {
  const { getCurrentlyReading, loading } = reading;

  if (loading) {
    return <ContextLine icon={Book} text="Cargando libro actual…" />;
  }

  const book = getCurrentlyReading();
  if (!book) return null;

  const pages =
    book.pages_total && book.pages_total > 0
      ? ` · ${book.pages_read || 0}/${book.pages_total} pág.`
      : '';

  return (
    <ContextLine
      icon={Book}
      text={`${book.title}${book.author ? ` — ${book.author}` : ''}${pages}`}
    />
  );
}

function MusicContext({ music }: { music: MusicState }) {
  const { getSongsByStatus, loading } = music;

  if (loading) {
    return <ContextLine icon={Music} text="Cargando canciones…" />;
  }

  const songs = getSongsByStatus('learning');
  if (songs.length === 0) return null;

  const visible = songs
    .slice(0, 2)
    .map(
      song =>
        `${song.title} (${song.instrument === 'piano' ? '🎹' : '🎸'})`,
    )
    .join(' · ');
  const extra = songs.length > 2 ? ` +${songs.length - 2}` : '';

  return <ContextLine icon={Music} text={`${visible}${extra}`} />;
}

function BlockContext({
  block,
  languageChoice,
  workout,
  reading,
  music,
}: {
  block: RoutineBlock;
  languageChoice?: string;
  workout: WorkoutState;
  reading: ReadingState;
  music: MusicState;
}) {
  const type = identifyBlockType(block.title);

  if (type === 'gym') return <GymContext workout={workout} />;
  if (type === 'lectura') return <ReadingContext reading={reading} />;
  if (type === 'musica') return <MusicContext music={music} />;
  if (type === 'idiomas') {
    const label =
      languageChoice === 'italiano'
        ? 'Italiano'
        : languageChoice === 'ingles'
          ? 'Inglés'
          : 'Práctica de idiomas';
    return <ContextLine icon={Languages} text={label} />;
  }

  return null;
}

export function RoutineFullscreenView({
  blocks,
  initialBlockId,
  startFollowing,
  tasksByBlock,
  tasks,
  covers = {},
  isBlockCompleted,
  onToggleBlock,
  onToggleTask,
  speedPlan,
  isToday,
  selectedDateLabel,
  routineLabel,
  languageChoice,
  onClose,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  const close = useCallback(() => onCloseRef.current(), []);

  const [selectedId, setSelectedId] = useState(() => initialBlockId || '');
  const [follow, setFollow] = useState(startFollowing && isToday);
  const [now, setNow] = useState(() => new Date());
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    supported: wakeLockSupported,
    engaged: wakeLockEngaged,
    failed: wakeLockFailed,
    request: requestWakeLock,
  } = useWakeLock(true);

  // Se cargan una sola vez al abrir el modo tablet y se reutilizan al cambiar
  // de bloque, para que el contexto no parpadee con "Cargando…".
  const workout = useWorkoutTracking();
  const reading = useReadingLibrary();
  const music = useMusicRepertoire();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const sortedBlocks = useMemo(() => sortRoutineBlocks(blocks), [blocks]);

  const blockStates = useMemo(
    () =>
      sortedBlocks.map((block, index) => {
        const next = sortedBlocks[index + 1];
        const end = effectiveBlockEndTime(block, speedPlan, next);
        const completed = isBlockCompleted(block.id);
        return {
          block,
          completed,
          state: isToday
            ? routineBlockStateAt(block, now, end)
            : routineBlockStaticState(block, completed),
        };
      }),
    [sortedBlocks, speedPlan, now, isToday, isBlockCompleted],
  );

  const currentIndex = useMemo(
    () => blockStates.findIndex(entry => entry.state.status === 'active'),
    [blockStates],
  );
  const currentBlock =
    currentIndex >= 0 ? blockStates[currentIndex]?.block : undefined;
  const nextUpcoming = blockStates.find(
    entry => entry.state.status === 'future',
  )?.block;

  const selectedIndex = useMemo(() => {
    const index = sortedBlocks.findIndex(block => block.id === selectedId);
    if (index >= 0) return index;
    if (currentIndex >= 0) return currentIndex;
    return 0;
  }, [sortedBlocks, selectedId, currentIndex]);

  const selectedBlock = sortedBlocks[selectedIndex];
  const selectedEntry = blockStates[selectedIndex];
  const selectedState = selectedEntry?.state;

  useEffect(() => {
    if (!follow || !isToday) return;
    const target = currentBlock ?? nextUpcoming;
    if (target && target.id !== selectedId) {
      setSelectedId(target.id);
    }
  }, [follow, isToday, currentBlock, nextUpcoming, selectedId]);

  useEffect(() => {
    if (sortedBlocks.length === 0) return;
    if (selectedBlock) return;
    const fallback = currentBlock ?? sortedBlocks[0];
    if (fallback) setSelectedId(fallback.id);
  }, [sortedBlocks, selectedBlock, currentBlock]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const enterFullscreen = useCallback(async () => {
    const element = overlayRef.current;
    if (!element || document.fullscreenElement) return;
    try {
      await element.requestFullscreen?.();
    } catch (error) {
      console.warn('No se pudo entrar en pantalla completa:', error);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) return;
    try {
      await document.exitFullscreen?.();
    } catch {
      // El navegador ya salió.
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void exitFullscreen();
    else void enterFullscreen();
  }, [enterFullscreen, exitFullscreen]);

  useEffect(() => {
    const onFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    onFullscreenChange();
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    void enterFullscreen();
    return () => {
      void exitFullscreen();
    };
  }, [enterFullscreen, exitFullscreen]);

  const goPrev = useCallback(() => {
    setFollow(false);
    setSelectedId(previous => {
      const index = sortedBlocks.findIndex(block => block.id === previous);
      const target = sortedBlocks[Math.max(0, index - 1)];
      return target?.id ?? previous;
    });
  }, [sortedBlocks]);

  const goNext = useCallback(() => {
    setFollow(false);
    setSelectedId(previous => {
      const index = sortedBlocks.findIndex(block => block.id === previous);
      const target = sortedBlocks[
        Math.min(sortedBlocks.length - 1, index + 1)
      ];
      return target?.id ?? previous;
    });
  }, [sortedBlocks]);

  const selectBlock = useCallback((blockId: string) => {
    setFollow(false);
    setSelectedId(blockId);
  }, []);

  const toggleFollow = useCallback(() => {
    const next = !follow;
    setFollow(next);
    if (next) {
      const target = currentBlock ?? nextUpcoming;
      if (target) setSelectedId(target.id);
    }
  }, [follow, currentBlock, nextUpcoming]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowLeft') goPrev();
      else if (event.key === 'ArrowRight') goNext();
      else if (event.key.toLowerCase() === 'f') toggleFullscreen();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overscrollBehavior = previousOverscroll;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [close, goPrev, goNext, toggleFullscreen]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(
      () => setControlsVisible(false),
      6000,
    );
  }, []);

  useEffect(() => {
    showControls();
    const onActivity = () => showControls();
    const events: Array<keyof WindowEventMap> = [
      'pointermove',
      'pointerdown',
      'touchstart',
      'keydown',
    ];
    events.forEach(event =>
      window.addEventListener(event, onActivity, { passive: true }),
    );
    return () => {
      events.forEach(event => window.removeEventListener(event, onActivity));
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [showControls]);

  const nextBlock = selectedBlock
    ? sortedBlocks[selectedIndex + 1]
    : undefined;
  const displayEnd = selectedBlock
    ? effectiveBlockEndTime(selectedBlock, speedPlan, nextBlock)
    : undefined;

  const visual = selectedBlock
    ? getBlockVisual(selectedBlock)
    : getBlockVisual({
        title: '',
        currentFocus: undefined,
        defaultFocus: undefined,
      });
  const VisualIcon = visual.icon;
  const nextVisual = nextBlock ? getBlockVisual(nextBlock) : null;
  const NextIcon = nextVisual?.icon ?? Clock;

  const cover = selectedBlock
    ? covers[routineBlockCoverId(selectedBlock)] ?? covers[selectedBlock.id]
    : undefined;

  const blockTasks = selectedBlock
    ? tasksByBlock[selectedBlock.id] ?? []
    : [];
  const completedBlockTasks = blockTasks.filter(task => task.completed).length;
  const blockCompleted = selectedEntry?.completed ?? false;

  const completedBlocks = blockStates.filter(entry => entry.completed).length;
  const doneTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  const statusLabel = blockCompleted
    ? 'Completado'
    : !isToday
      ? 'Vista de otro día'
      : selectedState?.status === 'active'
        ? 'En curso'
        : selectedState?.status === 'future'
          ? 'Próximo'
          : 'Pasado';

  const countdownLabel = blockCompleted
    ? 'Estado'
    : !isToday
      ? 'Duración'
      : selectedState?.status === 'active'
        ? 'Quedan'
        : selectedState?.status === 'future'
          ? 'Empieza en'
          : 'Bloque terminado';

  const countdownValue = blockCompleted
    ? 'Completado'
    : !isToday
      ? formatDuration(selectedState?.durationMinutes ?? 0)
      : selectedState?.status === 'active'
        ? formatDuration(selectedState.remainingMinutes)
        : selectedState?.status === 'future'
          ? formatDuration(selectedState.untilStartMinutes)
          : '—';

  const systemDoses = useMemo(() => {
    if (!selectedBlock) return [];

    const entry = speedPlan?.blocks?.[selectedBlock.id];
    if (entry?.kind === 'fragments') {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      return entry.fragments
        .filter(fragment => fragment.systemId)
        .map(fragment => {
          const start = parseTimeToMinutes(fragment.start);
          let end = parseTimeToMinutes(fragment.end);
          if (end <= start) end += MINUTES_PER_DAY;
          const current =
            nowMinutes < start && end > MINUTES_PER_DAY
              ? nowMinutes + MINUTES_PER_DAY
              : nowMinutes;
          return {
            key: fragment.id,
            systemId: fragment.systemId,
            start: fragment.start,
            end: fragment.end,
            minutes: minutesBetween(fragment.start, fragment.end),
            active: current >= start && current < end,
          };
        });
    }

    const systemId =
      entry?.kind === 'whole' ? entry.systemId : autoSystemForBlock(selectedBlock);
    if (!systemId || systemId === 'none') return [];

    return [
      {
        key: selectedBlock.id,
        systemId,
        start: selectedBlock.startTime,
        end: displayEnd,
        minutes: minutesBetween(
          selectedBlock.startTime,
          displayEnd ?? selectedBlock.endTime,
        ),
        active: selectedState?.status === 'active',
      },
    ];
  }, [selectedBlock, speedPlan, now, displayEnd, selectedState?.status]);

  if (!selectedBlock || !selectedState) {
    return createPortal(
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[100] grid place-items-center bg-black p-6 text-white"
      >
        <div className="text-center">
          <p className="text-lg font-semibold">No hay bloques disponibles</p>
          <Button variant="secondary" className="mt-4" onClick={close}>
            Cerrar
          </Button>
        </div>
      </div>,
      document.body,
    );
  }

  const controlButton =
    'grid h-10 w-10 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white';

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Modo tablet: ${selectedBlock.title}`}
      className="fixed inset-0 z-[100] overflow-hidden bg-black text-white select-none"
    >
      <div className="pointer-events-none absolute inset-0">
        {cover ? (
          <>
            <img
              src={cover}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30 lg:bg-gradient-to-r lg:from-black lg:via-black/70 lg:to-black/20" />
            <div className="absolute inset-0 bg-black/20" />
          </>
        ) : (
          <div className={cn('h-full w-full bg-gradient-to-br', visual.gradient)} />
        )}
        {!cover && (
          <div className="absolute -right-24 -bottom-24 opacity-10">
            <VisualIcon className="h-[32rem] w-[32rem]" strokeWidth={0.7} />
          </div>
        )}
      </div>

      <div className="relative z-10 flex h-full flex-col overflow-hidden px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:py-8 lg:px-12 lg:py-10">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55 sm:text-xs">
              {isToday ? 'Hoy' : 'Vista de otro día'} ·{' '}
              <span className="capitalize">{selectedDateLabel}</span>
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/35 sm:text-xs">
              {routineLabel ? `Rutina ${routineLabel}` : 'Rutina del día'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]',
                  blockCompleted
                    ? 'bg-emerald-400/15 text-emerald-200'
                    : selectedState.status === 'active'
                      ? 'bg-white/15 text-white'
                      : 'bg-white/10 text-white/60',
                )}
              >
                {selectedState.status === 'active' && !blockCompleted && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                )}
                {blockCompleted && <CheckCircle2 className="h-3 w-3" />}
                {statusLabel}
              </span>

              {wakeLockSupported ? (
                wakeLockEngaged ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-200">
                    <Sun className="h-3 w-3" /> Pantalla activa
                  </span>
                ) : wakeLockFailed ? (
                  <button
                    type="button"
                    onClick={() => void requestWakeLock()}
                    title="El navegador rechazó mantener la pantalla encendida. Toca para reintentar o usa el bloqueo de pantalla del tablet."
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold text-amber-200 transition-colors hover:bg-amber-400/20"
                  >
                    <Sun className="h-3 w-3" /> Pantalla activa bloqueada · reintentar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void requestWakeLock()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/70 transition-colors hover:bg-white/10"
                  >
                    <Sun className="h-3 w-3" /> Mantener pantalla encendida
                  </button>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold text-amber-200">
                  <Sun className="h-3 w-3" /> Activa el bloqueo de pantalla del tablet
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="font-mono text-4xl font-black leading-none tracking-tight tabular-nums sm:text-5xl">
              {format(now, 'HH:mm')}
              <span className="ml-1 text-base font-bold text-white/45 sm:text-lg">
                :{format(now, 'ss')}
              </span>
            </div>

            <div
              className={cn(
                'flex flex-wrap items-center justify-end gap-1 rounded-full bg-black/35 p-1.5 backdrop-blur-md transition-opacity duration-300',
                controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
              )}
            >
              <button
                type="button"
                onClick={goPrev}
                className={controlButton}
                title="Bloque anterior"
                aria-label="Bloque anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={toggleFollow}
                className={cn(
                  'flex h-10 items-center gap-1.5 rounded-full px-3 text-white/80 transition-colors hover:bg-white/15 hover:text-white',
                  follow && 'bg-white/20 text-white',
                )}
                title={
                  follow
                    ? 'Dejar de seguir el bloque actual'
                    : 'Seguir el bloque actual'
                }
                aria-pressed={follow}
              >
                {follow ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span className="hidden text-xs font-semibold sm:inline">
                  {follow ? 'Siguiendo' : 'Manual'}
                </span>
              </button>

              <button
                type="button"
                onClick={goNext}
                className={controlButton}
                title="Bloque siguiente"
                aria-label="Bloque siguiente"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className={controlButton}
                title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                aria-label={
                  isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'
                }
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </button>

              <button
                type="button"
                onClick={close}
                className={cn(controlButton, 'hover:bg-red-500/20 hover:text-red-200')}
                title="Cerrar modo tablet"
                aria-label="Cerrar modo tablet"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main
          key={selectedBlock.id}
          className="mt-6 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-10"
        >
          <section className="min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 sm:text-xs">
              <span className="rounded-full bg-white/10 px-2.5 py-1">
                Bloque {selectedIndex + 1} / {sortedBlocks.length}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <VisualIcon className={cn('h-3.5 w-3.5', visual.accent)} />
                {visual.label}
              </span>
            </div>

            <h1 className="mt-4 max-w-3xl break-words text-[clamp(2.4rem,7vw,6rem)] font-black leading-[0.95] tracking-tight text-white drop-shadow-lg">
              {selectedBlock.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-base font-medium text-white/80 sm:text-lg">
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-white/50" />
                {formatClockTime(selectedBlock.startTime)} –{' '}
                {formatClockTime(displayEnd ?? selectedBlock.endTime)}
              </span>
              <span className="text-white/25">•</span>
              <span>{formatDuration(selectedState.durationMinutes)}</span>
            </div>

            <div className="mt-6 max-w-3xl space-y-2">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">
                    {countdownLabel}
                  </p>
                  <p className="text-3xl font-black leading-none tabular-nums text-white sm:text-4xl">
                    {countdownValue}
                  </p>
                </div>
                <p className="text-2xl font-black tabular-nums text-white/70 sm:text-3xl">
                  {Math.round(selectedState.progress)}%
                </p>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/15">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    blockCompleted ? 'bg-emerald-400' : 'bg-white',
                  )}
                  style={{ width: `${selectedState.progress}%` }}
                />
              </div>

              <p className="text-xs text-white/50">
                {isToday && selectedState.status === 'active'
                  ? `${Math.round(selectedState.elapsedMinutes)} min transcurridos de ${formatDuration(selectedState.durationMinutes)}`
                  : `${formatClockTime(selectedBlock.startTime)} – ${formatClockTime(displayEnd ?? selectedBlock.endTime)} · ${formatDuration(selectedState.durationMinutes)}`}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {systemDoses.length > 0 ? (
                systemDoses.map(dose => {
                  const info = describeSystemMinutes(dose.systemId, dose.minutes);
                  if (!info) return null;
                  return (
                    <span
                      key={dose.key}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                        dose.active
                          ? 'border-white/40 bg-white/15 text-white'
                          : 'border-white/15 bg-white/5 text-white/65',
                      )}
                    >
                      <Gauge className="h-3 w-3" />
                      {info.name}
                      <span className="font-mono text-[10px] text-white/50">
                        {dose.minutes}′
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-bold',
                          SPEED_STATE_CLASSES[info.state],
                        )}
                      >
                        {info.label}
                      </span>
                      {dose.start && dose.end && (
                        <span className="font-mono text-[10px] text-white/40">
                          {formatClockTime24(dose.start)}–{formatClockTime24(dose.end)}
                        </span>
                      )}
                    </span>
                  );
                })
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/65">
                  <VisualIcon className="h-3 w-3" />
                  {visual.label}
                </span>
              )}
            </div>

            <div className="mt-3 space-y-1.5">
              <BlockContext
                block={selectedBlock}
                languageChoice={languageChoice}
                workout={workout}
                reading={reading}
                music={music}
              />
            </div>
          </section>

          <aside className="flex min-w-0 flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="rounded-3xl border border-white/10 bg-black/35 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 sm:text-sm">
                  <ListChecks className="h-4 w-4" />
                  Tareas del bloque
                </div>
                <span className="font-mono text-sm text-white/50">
                  {completedBlockTasks}/{blockTasks.length}
                </span>
              </div>

              <div className="mt-3 max-h-[28vh] space-y-2 overflow-y-auto pr-1 lg:max-h-[32vh]">
                {blockTasks.length > 0 ? (
                  blockTasks.map(task => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onToggleTask(task.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                        task.completed
                          ? 'bg-white/5 text-white/45'
                          : 'bg-white/10 text-white hover:bg-white/15',
                      )}
                    >
                      <span
                        className={cn(
                          'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
                          task.completed
                            ? 'border-emerald-400 bg-emerald-400 text-black'
                            : 'border-white/40',
                        )}
                      >
                        {task.completed && <Check className="h-4 w-4" />}
                      </span>
                      <span
                        className={cn(
                          'text-base font-medium leading-snug sm:text-lg',
                          task.completed && 'line-through',
                        )}
                      >
                        {task.title}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm italic text-white/45">
                    Sin tareas planificadas para este bloque.
                  </p>
                )}
              </div>

              {selectedBlock.tasks && selectedBlock.tasks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedBlock.tasks.map((task, index) => (
                    <span
                      key={`${task}-${index}`}
                      className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/65"
                    >
                      {task}
                    </span>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => onToggleBlock(selectedBlock.id)}
                className={cn(
                  'mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors sm:text-base',
                  blockCompleted
                    ? 'bg-emerald-400/20 text-emerald-200 hover:bg-emerald-400/30'
                    : 'bg-white text-black hover:bg-white/90',
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                {blockCompleted
                  ? 'Bloque completado · desmarcar'
                  : 'Marcar bloque completado'}
              </button>
            </div>

            {nextBlock ? (
              <button
                type="button"
                onClick={() => {
                  setFollow(false);
                  setSelectedId(nextBlock.id);
                }}
                aria-label={`Ir al siguiente bloque: ${nextBlock.title}`}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/35 p-3 text-left backdrop-blur-md transition-colors hover:bg-black/50"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10">
                  <NextIcon className="h-5 w-5 text-white/80" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                    Siguiente
                  </p>
                  <p className="truncate text-sm font-semibold text-white sm:text-base">
                    {nextBlock.title}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold text-white/80">
                    {formatClockTime(nextBlock.startTime)}
                  </p>
                  <p className="text-[10px] text-white/40">
                    {formatDuration(routineBlockWindow(nextBlock).duration)}
                  </p>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 p-3 text-sm text-white/60 backdrop-blur-md">
                <Moon className="h-5 w-5" />
                Fin de la rutina
              </div>
            )}
          </aside>
        </main>

        <footer className="mt-6 shrink-0 space-y-2">
          <div className="flex items-center justify-between gap-4 text-xs font-medium text-white/50 sm:text-sm">
            <span>
              {completedBlocks}/{sortedBlocks.length} bloques completados
            </span>
            <span>
              {doneTasks}/{totalTasks} tareas del día
            </span>
          </div>
          <div className="-mx-1 flex items-center">
            {blockStates.map(({ block, state, completed }) => (
              <button
                key={block.id}
                type="button"
                onClick={() => selectBlock(block.id)}
                title={`${block.title} · ${formatClockTime(block.startTime)}`}
                aria-label={`${block.title}, ${formatClockTime(block.startTime)}`}
                aria-current={
                  selectedBlock.id === block.id ? 'true' : undefined
                }
                className="group flex h-8 flex-1 items-center px-0.5"
              >
                <span
                  className={cn(
                    'h-2 w-full rounded-full transition-all',
                    completed
                      ? 'bg-emerald-400'
                      : state.status === 'active'
                        ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]'
                        : state.status === 'past'
                          ? 'bg-white/20'
                          : 'bg-white/10',
                    selectedBlock.id === block.id &&
                      'ring-2 ring-white/90 ring-offset-1 ring-offset-black',
                  )}
                />
              </button>
            ))}
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
