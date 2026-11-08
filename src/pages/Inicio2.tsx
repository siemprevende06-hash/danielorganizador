import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Flame,
  Gauge,
  Layers,
  LayoutDashboard,
  Sparkles,
  Sun,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Timeframe } from "@/contexts/TimeframeContext";
import { useAreaScores } from "@/hooks/useAreaScores";
import { useLifeOverview } from "@/hooks/useLifeOverview";
import { useDailyPlanData } from "@/hooks/useDailyPlanData";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PeriodSwitch, PERIOD_LABEL } from "@/components/inicio2/PeriodSwitch";
import { LifeSummarySection } from "@/components/inicio2/LifeSummarySection";
import { TodayRoutineCard } from "@/components/inicio2/TodayRoutineCard";
import { DailyGoalsCard } from "@/components/inicio2/DailyGoalsCard";
import { SystemsSummaryCard } from "@/components/inicio2/SystemsSummaryCard";
import { SystemDataCards } from "@/components/inicio2/SystemDataCards";
import { FinanceSummaryCard } from "@/components/inicio2/FinanceSummaryCard";

const SCREENS = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "hoy", label: "Hoy", icon: Sun },
  { id: "sistemas", label: "Sistemas", icon: Layers },
  { id: "finanzas", label: "Finanzas", icon: Wallet },
] as const;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Buenas noches";
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function Inicio2() {
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [screenIndex, setScreenIndex] = useState(0);
  const pagerRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<{ name: string; email: string; initials: string }>({
    name: "",
    email: "",
    initials: "US",
  });

  const { scores: areas, averages, loading: areasLoading } = useAreaScores(timeframe, "ambos");
  const overview = useLifeOverview(timeframe);
  const {
    blocks,
    blocksLoaded,
    tasks,
    tasksLoading,
    tasksByBlock,
    completedBlocks,
    completedTasks,
    dayScore,
    isBlockCompleted,
    toggleBlockComplete,
    toggleTaskDone,
    completionsLoading,
  } = useDailyPlanData(new Date());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user;
      const email = user?.email || "";
      const rawName = (user?.user_metadata?.name as string) || email.split("@")[0] || "";
      const name = rawName
        .split(/[\s.]+/)
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
        .join(" ");
      const initials = (rawName || "Usuario").slice(0, 2).toUpperCase();
      setProfile({ name, email, initials });
    });
  }, []);

  const goToScreen = useCallback((index: number) => {
    const pager = pagerRef.current;
    if (!pager) return;
    const next = Math.max(0, Math.min(SCREENS.length - 1, index));
    pager.scrollTo({ left: next * pager.clientWidth, behavior: "smooth" });
    setScreenIndex(next);

    // Si el usuario viene de leer una pantalla larga, vuelve a la zona del pager.
    const top = pager.getBoundingClientRect().top;
    if (top < 0) {
      window.scrollTo({
        top: window.scrollY + top - 64,
        behavior: "smooth",
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const pager = pagerRef.current;
    if (!pager) return;
    const index = Math.round(pager.scrollLeft / Math.max(1, pager.clientWidth));
    setScreenIndex(Math.max(0, Math.min(SCREENS.length - 1, index)));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToScreen(screenIndex + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToScreen(screenIndex - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToScreen, screenIndex]);

  useEffect(() => {
    const onResize = () => {
      const pager = pagerRef.current;
      if (!pager) return;
      pager.scrollTo({ left: screenIndex * pager.clientWidth, behavior: "auto" });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [screenIndex]);

  const lifeScore = Math.round((averages.esfuerzo + averages.resultados) / 2);
  const firstName = profile.name.split(" ")[0] || "Organizador";
  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });
  const periodLabel = PERIOD_LABEL[timeframe] || "este periodo";
  const routineLoading = !blocksLoaded || completionsLoading;

  return (
    <div className="min-h-screen bg-background p-4 pt-16 md:p-6 lg:pt-6">
      <div className="mx-auto max-w-[1400px]">
        <header className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/[0.08] via-background to-background p-5 md:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-base font-bold text-primary shadow-sm">
                {profile.initials}
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Sparkles className="h-3 w-3" /> Tu resumen de vida
                </p>
                <h1 className="mt-0.5 truncate text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {getGreeting()}, {firstName}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs capitalize text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> {todayLabel}
                  </span>
                  <span className="hidden sm:inline">·</span>
                  <span className="normal-case">Resumen de {periodLabel}</span>
                  {profile.email ? (
                    <>
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden truncate normal-case sm:inline">{profile.email}</span>
                    </>
                  ) : null}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
              <PeriodSwitch value={timeframe} onChange={setTimeframe} />
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/5 text-[10px] font-semibold">
                  <Gauge className="h-3 w-3" /> Score {lifeScore}/100
                </Badge>
                <Badge variant="outline" className="gap-1 border-amber-500/20 bg-amber-500/5 text-[10px] font-semibold">
                  <Flame className="h-3 w-3 text-orange-500" /> Racha {overview.currentStreak}{" "}
                  {overview.currentStreak === 1 ? "día" : "días"}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <nav className="sticky top-12 z-30 mt-4 lg:top-0" aria-label="Pantallas de Inicio">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background/90 p-1.5 shadow-sm backdrop-blur-md">
            <div
              role="tablist"
              aria-label="Navegación entre pantallas"
              className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {SCREENS.map((screen, index) => {
                const Icon = screen.icon;
                const active = index === screenIndex;
                return (
                  <button
                    key={screen.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`inicio-screen-${screen.id}`}
                    onClick={() => goToScreen(index)}
                    className={cn(
                      "flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all",
                      active
                        ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {screen.label}
                  </button>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <span className="hidden text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
                Desliza
              </span>
              <span className="min-w-[30px] text-center text-[10px] font-semibold tabular-nums text-muted-foreground">
                {screenIndex + 1}/{SCREENS.length}
              </span>
              <button
                type="button"
                onClick={() => goToScreen(screenIndex - 1)}
                disabled={screenIndex === 0}
                aria-label="Pantalla anterior"
                className="grid h-7 w-7 place-items-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => goToScreen(screenIndex + 1)}
                disabled={screenIndex === SCREENS.length - 1}
                aria-label="Pantalla siguiente"
                className="grid h-7 w-7 place-items-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </nav>

        <div
          ref={pagerRef}
          onScroll={handleScroll}
          className="mt-4 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SCREENS.map((screen, index) => (
            <section
              key={screen.id}
              id={`inicio-screen-${screen.id}`}
              aria-label={screen.label}
              className="w-full shrink-0 snap-start"
            >
              <div className={cn(index < SCREENS.length - 1 && "pr-2 md:pr-4")}>
                {screen.id === "resumen" ? (
                  <LifeSummarySection
                    timeframe={timeframe}
                    areas={areas}
                    averages={averages}
                    loading={areasLoading}
                    overview={overview}
                  />
                ) : null}

                {screen.id === "hoy" ? (
                  <div className="grid gap-8 xl:grid-cols-2">
                    <TodayRoutineCard
                      blocks={blocks}
                      tasksByBlock={tasksByBlock}
                      isBlockCompleted={isBlockCompleted}
                      toggleBlockComplete={toggleBlockComplete}
                      loading={routineLoading}
                    />
                    <DailyGoalsCard
                      tasks={tasks}
                      completedTasks={completedTasks}
                      blocks={blocks}
                      completedBlocks={completedBlocks}
                      dayScore={dayScore}
                      toggleTaskDone={toggleTaskDone}
                      loading={tasksLoading || routineLoading}
                    />
                  </div>
                ) : null}

                {screen.id === "sistemas" ? (
                  <div className="space-y-8">
                    <SystemsSummaryCard
                      systems={overview.systems}
                      loading={overview.loading}
                      timeframe={timeframe}
                    />
                    <SystemDataCards timeframe={timeframe} />
                  </div>
                ) : null}

                {screen.id === "finanzas" ? <FinanceSummaryCard /> : null}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-6 flex items-center gap-1.5 pb-2 text-[10px] text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          Inicio 2.0 · datos en tiempo real de tu Segundo Cerebro
        </footer>
      </div>
    </div>
  );
}
