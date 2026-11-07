import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, Flame, Gauge, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Timeframe } from "@/contexts/TimeframeContext";
import { useAreaScores } from "@/hooks/useAreaScores";
import { useLifeOverview } from "@/hooks/useLifeOverview";
import { useDailyPlanData } from "@/hooks/useDailyPlanData";
import { Badge } from "@/components/ui/badge";
import { PeriodSwitch, PERIOD_LABEL } from "@/components/inicio2/PeriodSwitch";
import { LifeSummarySection } from "@/components/inicio2/LifeSummarySection";
import { TodayRoutineCard } from "@/components/inicio2/TodayRoutineCard";
import { DailyGoalsCard } from "@/components/inicio2/DailyGoalsCard";
import { SystemsSummaryCard } from "@/components/inicio2/SystemsSummaryCard";
import { FinanceSummaryCard } from "@/components/inicio2/FinanceSummaryCard";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Buenas noches";
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function Inicio2() {
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
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

  const lifeScore = Math.round((averages.esfuerzo + averages.resultados) / 2);
  const firstName = profile.name.split(" ")[0] || "Organizador";
  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });
  const periodLabel = PERIOD_LABEL[timeframe] || "este periodo";
  const routineLoading = !blocksLoaded || completionsLoading;

  return (
    <div className="min-h-screen bg-background p-4 pt-16 md:p-6 lg:pt-6">
      <div className="mx-auto max-w-[1400px] space-y-8">
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

        <LifeSummarySection
          timeframe={timeframe}
          areas={areas}
          averages={averages}
          loading={areasLoading}
          overview={overview}
        />

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

        <SystemsSummaryCard systems={overview.systems} loading={overview.loading} timeframe={timeframe} />

        <FinanceSummaryCard />

        <footer className="flex items-center gap-1.5 pb-2 text-[10px] text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          Inicio 2.0 · datos en tiempo real de tu Segundo Cerebro
        </footer>
      </div>
    </div>
  );
}
