import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { usePlanSystemMetrics } from '@/hooks/usePlanSystemMetrics';
import {
  PILARES_DIRECCION,
  PILAR_DESEOS,
  useMapaDeVida,
} from '@/hooks/useMapaDeVida';
import { useForecastDeadlines, useSystemForecasts } from '@/hooks/useSystemForecasts';
import { usePersonalLists } from '@/hooks/usePersonalLists';
import { readTextSection } from '@/hooks/useTextSection';
import { AREA_SYSTEMS, diagnoseArea } from '@/lib/areaSystemsMap';
import { PLAN_SYSTEM_META, type PlanDayStatus } from '@/lib/planSystems';
import {
  METAS_SYSTEM_BY_ID,
  METAS_SYSTEMS,
  formatGoalDate,
} from '@/lib/metasSistemas';
import { LIFE_STAGE } from '@/data/lifeStage';
import type { SystemGoal } from '@/lib/systemGoals';
import type { Necesidad } from '@/lib/definitions';
import {
  alignmentScore,
  buildAreaLevels,
  buildEffortForecast,
  buildLevels,
  daysUntil,
  goalProgressForList,
  summarizeForecast,
  timeProgress,
  verdictFor,
  type AlignmentAreaLine,
  type AlignmentCounts,
  type AlignmentLevel,
  type EffortForecast,
  type ForecastSummary,
  type FutureSummary,
  type NeedLink,
  type PillarSummary,
  type RewardImage,
  type SystemMapGoal,
  type SystemMapRow,
  type Verdict,
  type VisionPhoto,
} from '@/lib/alignment';

// ---------------------------------------------------------------------------
// Datos de la pestaña Alineación.
//
// Todo es de solo lectura: se reutilizan los hooks que ya alimentan Metas
// Sistemas (métricas anuales, Mapa de Vida, pronósticos, Mi Lista Personal y
// las secciones de fotos). No se escribe nada ni se añaden tablas.
// ---------------------------------------------------------------------------

interface PhotoCard {
  id: string;
  position: number;
  image_url: string | null;
  name?: string;
}

interface PhotoSection {
  id: string;
  name: string;
  rows: number;
  cards: PhotoCard[];
}

interface RewardCard {
  id: string;
  position: number;
  image_url: string | null;
}

interface RewardSection {
  id: string;
  name: string;
  rows: number;
  cards: RewardCard[];
}

export interface AlignmentData {
  today: Date;
  levels: AlignmentLevel[];
  areaLines: AlignmentAreaLine[];
  systemRows: SystemMapRow[];
  forecast: ForecastSummary;
  forecastCards: ReturnType<typeof useSystemForecasts>['cards'];
  future: FutureSummary;
  pillars: PillarSummary[];
  needScores: Record<string, number>;
  needLinks: Record<string, NeedLink>;
  rewards: RewardImage[];
  visionPhotos: VisionPhoto[];
  counts: AlignmentCounts;
  score: number;
  verdict: Verdict;
  /** % del año transcurrido. */
  timePct: number;
  /** % del camino 18 jun 2026 → 2029. */
  lifePct: number;
  strengths: AlignmentAreaLine[];
  blockers: AlignmentAreaLine[];
  todayActions: Array<{
    id: string;
    label: string;
    emoji: string;
    status: PlanDayStatus | null;
  }>;
  effort: EffortForecast | null;
  orphanGoals: SystemMapGoal[];
  systemsWithoutGoal: typeof METAS_SYSTEMS;
  needs: Necesidad[];
  systems: ReturnType<typeof usePlanSystemMetrics>['systems'];
  /** Métricas y Mapa de Vida: sin esto no hay lectura posible. */
  coreLoading: boolean;
  /** Pronósticos por sistema: la sección muestra su propio esqueleto. */
  forecastLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const EMPTY_PHOTOS: PhotoSection[] = [];
const EMPTY_REWARDS: RewardSection[] = [];

function flattenPhotos(sections: PhotoSection[] | null | undefined): VisionPhoto[] {
  const out: VisionPhoto[] = [];
  for (const section of sections ?? []) {
    for (const card of section.cards ?? []) {
      if (!card.image_url) continue;
      out.push({
        id: card.id,
        url: card.image_url,
        name: card.name?.trim() || section.name,
        section: section.name,
      });
    }
  }
  return out;
}

function flattenRewards(sections: RewardSection[] | null | undefined): RewardImage[] {
  const out: RewardImage[] = [];
  for (const section of sections ?? []) {
    for (const card of section.cards ?? []) {
      if (!card.image_url) continue;
      out.push({ id: card.id, url: card.image_url, section: section.name });
    }
  }
  return out;
}

function goalFromSystem(goal: SystemGoal): SystemMapGoal {
  return {
    id: goal.id,
    title: goal.title,
    objective: goal.objective,
    date: goal.date,
    completed: !!goal.completed,
    source: 'system',
    progress: goal.completed ? 100 : null,
  };
}

export function useAlignmentData(goals: SystemGoal[]): AlignmentData {
  const today = useMemo(() => new Date(), []);
  const todayKey = format(today, 'yyyy-MM-dd');

  const metrics = usePlanSystemMetrics('year', today);
  const mapa = useMapaDeVida('month');
  const deadlines = useForecastDeadlines();
  const forecasts = useSystemForecasts({
    goals,
    horizon: 'year',
    deadlines: deadlines.deadlines,
  });
  const personal = usePersonalLists();

  const visionQuery = useQuery({
    queryKey: ['alignment-text-section', 'direccion-daily-sections'],
    queryFn: () => readTextSection<PhotoSection[]>('direccion-daily-sections'),
    staleTime: 60_000,
  });

  const rewardsQuery = useQuery({
    queryKey: ['alignment-text-section', 'motivos-data'],
    queryFn: () => readTextSection<RewardSection[]>('motivos-data'),
    staleTime: 60_000,
  });

  const visionPhotos = useMemo(
    () => flattenPhotos(visionQuery.data ?? EMPTY_PHOTOS),
    [visionQuery.data],
  );

  const rewards = useMemo(
    () => flattenRewards(rewardsQuery.data ?? EMPTY_REWARDS),
    [rewardsQuery.data],
  );

  const levels = useMemo(
    () => buildLevels(metrics.systems, today),
    [metrics.systems, today],
  );

  const areaLines = useMemo<AlignmentAreaLine[]>(() => {
    return mapa.allAreas.map(area => {
      const config = AREA_SYSTEMS[area.id];
      const systems = config?.habits ?? [];
      return {
        id: area.id,
        label: area.label,
        icon: area.icon,
        group: area.group,
        effort: Math.round(area.esfuerzo),
        results: Math.round(area.resultados),
        diagnosis: diagnoseArea(area.esfuerzo, area.resultados),
        levels: buildAreaLevels(systems, metrics.systems, today),
        plan: metrics.areas[area.id] ?? null,
        vision: config?.vision,
        systems,
        sub: area.sub,
      };
    });
  }, [mapa.allAreas, metrics.areas, metrics.systems, today]);

  const areasOnPath = useMemo(
    () => areaLines.filter(area => area.effort >= 50 || area.results >= 50).length,
    [areaLines],
  );

  const forecast = useMemo(
    () => summarizeForecast(forecasts.cards),
    [forecasts.cards],
  );

  const score = useMemo(
    () => alignmentScore(levels, forecast, areasOnPath),
    [levels, forecast, areasOnPath],
  );

  const verdict = useMemo(() => verdictFor(score), [score]);

  const timePct = useMemo(
    () => timeProgress(`${today.getFullYear()}-01-01`, `${today.getFullYear()}-12-31`, today),
    [today],
  );

  const lifePct = useMemo(
    () => timeProgress(LIFE_STAGE.baselineDate, `${LIFE_STAGE.visionYear}-12-31`, today),
    [today],
  );

  const needScores = useMemo(() => {
    const out: Record<string, number> = {};
    for (const node of mapa.nodes) {
      if (node.kind === 'deseo') out[node.id] = Math.round(node.score);
    }
    return out;
  }, [mapa.nodes]);

  const future = useMemo<FutureSummary>(() => {
    const lists = personal.lists;
    const withSystem = lists.filter(list => !!list.system_key);

    const dated = lists
      .filter(list => !!list.target_date)
      .map(list => ({
        list,
        daysLeft: daysUntil(list.target_date as string, today),
        progress: goalProgressForList(list, personal.tasks),
      }))
      .sort((a, b) => String(a.list.target_date).localeCompare(String(b.list.target_date)));

    const nearest = dated.find(item => item.daysLeft >= 0) ?? dated[dated.length - 1] ?? null;
    const furthest = dated[dated.length - 1] ?? null;

    const progressValues = lists
      .map(list => goalProgressForList(list, personal.tasks))
      .filter((value): value is number => value != null);
    const percent = progressValues.length > 0
      ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
      : null;

    const onTrack = dated.filter(item =>
      item.daysLeft >= 0 && item.progress != null && item.progress >= 50,
    ).length;

    const targetKey = nearest?.list.target_date ?? `${LIFE_STAGE.visionYear}-12-31`;

    return {
      lists,
      withSystem,
      onTrack,
      total: lists.length,
      percent,
      nearest,
      furthest,
      targetKey,
      targetLabel: nearest?.list.target_date
        ? formatGoalDate(nearest.list.target_date)
        : `Visión ${LIFE_STAGE.visionYear}`,
      photo: visionPhotos[0]?.url ?? null,
    };
  }, [personal.lists, personal.tasks, visionPhotos, today]);

  const needLinks = useMemo(() => {
    const out: Record<string, NeedLink> = {};
    const areaLabel: Record<string, string> = {};
    for (const area of areaLines) areaLabel[area.id] = area.label;

    for (const need of mapa.necesidades) {
      const edge = mapa.edges.find(item => item.to === need.necesidad_id);
      const areaId = edge?.from ?? null;
      let systemId: string | null = null;
      let systemLabel: string | null = null;

      if (areaId) {
        const config = AREA_SYSTEMS[areaId];
        const habit = config?.habits.find(id => METAS_SYSTEM_BY_ID[id]);
        if (habit) {
          systemId = habit;
          systemLabel = METAS_SYSTEM_BY_ID[habit].label;
        }
      }

      out[need.necesidad_id] = {
        needId: need.necesidad_id,
        areaId,
        areaLabel: areaId ? areaLabel[areaId] ?? areaId : null,
        systemId,
        systemLabel,
      };
    }

    return out;
  }, [mapa.necesidades, mapa.edges, areaLines]);

  const systemRows = useMemo<SystemMapRow[]>(() => {
    return METAS_SYSTEMS.map(system => {
      const planMeta = PLAN_SYSTEM_META[system.id];
      const areaId = planMeta?.areaId ?? system.id;
      const systemMetrics = metrics.systems[system.id] ?? null;
      const areaMetrics = metrics.areas[system.id] ?? null;
      const compliance = systemMetrics?.compliance ?? areaMetrics?.compliance ?? null;
      const card = forecasts.cards.find(item => item.systemId === system.id) ?? null;

      const todayIndex = systemMetrics ? systemMetrics.days.indexOf(todayKey) : -1;
      const todayStatus = todayIndex >= 0 ? systemMetrics?.status[todayIndex] ?? null : null;

      const rowGoals: SystemMapGoal[] = [
        ...goals
          .filter(goal => goal.systemId === system.id)
          .map(goalFromSystem),
        ...personal.lists
          .filter(list => list.system_key === system.id)
          .map(list => ({
            id: list.id,
            title: list.title,
            objective: list.description ?? undefined,
            date: list.target_date,
            completed: false,
            source: 'personal' as const,
            progress: goalProgressForList(list, personal.tasks),
          })),
      ];

      const activeGoals = rowGoals
        .filter(goal => !goal.completed)
        .sort((a, b) => String(a.date ?? '9999-12-31').localeCompare(String(b.date ?? '9999-12-31')));
      const nextGoal = activeGoals[0] ?? rowGoals[0] ?? null;

      const areaIds = [areaId];
      for (const [id, config] of Object.entries(AREA_SYSTEMS)) {
        if (config.habits.includes(system.id)) areaIds.push(id);
      }
      const needIds = new Set(
        mapa.edges
          .filter(edge => areaIds.includes(edge.from))
          .map(edge => edge.to),
      );
      const needs = mapa.necesidades.filter(need => needIds.has(need.necesidad_id));

      const pillarId = PILARES_DIRECCION.find(pillar =>
        (PILAR_DESEOS[pillar.id] ?? []).some(id =>
          needs.some(need => need.necesidad_id === id),
        ),
      )?.id ?? '';

      let tone: SystemMapRow['tone'] = 'grey';
      if (rowGoals.length === 0) {
        // Sin meta no es un error: es un sistema que aún no apunta a ningún lado.
        tone = 'amber';
      } else if (compliance == null) {
        tone = 'grey';
      } else if (compliance >= 80 && card?.forecast.status !== 'off-track') {
        tone = 'green';
      } else if (compliance >= 50) {
        tone = 'amber';
      } else {
        tone = 'red';
      }

      return {
        system,
        metrics: systemMetrics,
        area: areaMetrics,
        compliance,
        forecast: card,
        todayStatus,
        goals: rowGoals,
        nextGoal,
        needs,
        areaId,
        pillarId,
        tone,
      };
    });
  }, [
    metrics.systems,
    metrics.areas,
    forecasts.cards,
    personal.lists,
    personal.tasks,
    mapa.edges,
    mapa.necesidades,
    goals,
    todayKey,
  ]);

  const orphanGoals = useMemo<SystemMapGoal[]>(() => {
    const known = new Set(METAS_SYSTEMS.map(system => system.id));
    const out: SystemMapGoal[] = [];

    for (const goal of goals) {
      if (!known.has(goal.systemId)) out.push(goalFromSystem(goal));
    }

    for (const list of personal.lists) {
      if (list.system_key && known.has(list.system_key)) continue;
      out.push({
        id: list.id,
        title: list.title,
        objective: list.description ?? undefined,
        date: list.target_date,
        completed: false,
        source: 'personal',
        progress: goalProgressForList(list, personal.tasks),
      });
    }

    return out;
  }, [goals, personal.lists, personal.tasks]);

  const systemsWithoutGoal = useMemo(
    () => systemRows.filter(row => row.goals.length === 0).map(row => row.system),
    [systemRows],
  );

  const counts = useMemo<AlignmentCounts>(() => ({
    systems: METAS_SYSTEMS.length,
    areas: areaLines.length,
    needs: mapa.necesidades.length,
    systemGoals: goals.filter(goal => !goal.completed).length,
    futureGoals: personal.lists.length,
    completedGoals: goals.filter(goal => goal.completed).length,
    systemsWithGoal: systemRows.filter(row => row.goals.length > 0).length,
    needsWithSystem: mapa.necesidades.filter(need =>
      mapa.edges.some(edge => edge.to === need.necesidad_id),
    ).length,
  }), [areaLines.length, mapa.necesidades, mapa.edges, goals, personal.lists.length, systemRows]);

  const strengths = useMemo(
    () => [...areaLines]
      .filter(area => area.effort > 0 && area.diagnosis.tone === 'green')
      .sort((a, b) => (b.effort + b.results) - (a.effort + a.results))
      .slice(0, 3),
    [areaLines],
  );

  const blockers = useMemo(() => {
    const rank = (area: AlignmentAreaLine) => {
      if (area.diagnosis.tone === 'red') return 0;
      if (area.diagnosis.tone === 'amber') return 1;
      if (area.diagnosis.tone === 'blue') return 2;
      if (area.diagnosis.tone === 'grey') return 3;
      return 4;
    };
    return [...areaLines]
      .filter(area => area.diagnosis.tone !== 'green')
      .sort((a, b) => rank(a) - rank(b) || (a.effort + a.results) - (b.effort + b.results))
      .slice(0, 3);
  }, [areaLines]);

  const todayActions = useMemo(() => {
    return Object.values(metrics.systems)
      .filter(system => {
        const index = system.days.indexOf(todayKey);
        const status = index >= 0 ? system.status[index] : null;
        return status !== 'done' && status !== 'rest' && status !== 'skip';
      })
      .sort((a, b) => (a.compliance ?? 101) - (b.compliance ?? 101))
      .slice(0, 3)
      .map(system => {
        const index = system.days.indexOf(todayKey);
        return {
          id: system.id,
          label: PLAN_SYSTEM_META[system.id]?.name ?? system.id,
          emoji: PLAN_SYSTEM_META[system.id]?.emoji ?? '⚙️',
          status: index >= 0 ? system.status[index] ?? null : null,
        };
      });
  }, [metrics.systems, todayKey]);

  const pillars = useMemo<PillarSummary[]>(() => {
    return PILARES_DIRECCION.map(pillar => {
      const needs = mapa.necesidades.filter(need =>
        (PILAR_DESEOS[pillar.id] ?? []).includes(need.necesidad_id),
      );
      const pillarScore = needs.length > 0
        ? Math.round(
            needs.reduce(
              (sum, need) => sum + (needScores[need.necesidad_id] ?? need.progreso ?? 0),
              0,
            ) / needs.length,
          )
        : 0;

      return {
        id: pillar.id,
        label: pillar.label,
        short: pillar.short,
        icon: pillar.icon,
        desc: pillar.desc,
        score: pillarScore,
        needs,
      };
    });
  }, [mapa.necesidades, needScores]);

  const effort = useMemo(
    () => buildEffortForecast(metrics.systems, today),
    [metrics.systems, today],
  );

  const coreLoading = metrics.loading || mapa.loading;
  const forecastLoading = forecasts.loading;

  // Solo el pronóstico es crítico para la lectura de Alineación. Las fotos y
  // recompensas son decorativas: si fallan, se muestran vacías sin romper nada.
  const error = forecasts.error;

  const refresh = useCallback(() => {
    forecasts.refresh();
    metrics.refresh();
    void visionQuery.refetch();
    void rewardsQuery.refetch();
  }, [forecasts, metrics, visionQuery, rewardsQuery]);

  return {
    today,
    levels,
    areaLines,
    systemRows,
    forecast,
    forecastCards: forecasts.cards,
    future,
    pillars,
    needScores,
    needLinks,
    rewards,
    visionPhotos,
    counts,
    score,
    verdict,
    timePct,
    lifePct,
    strengths,
    blockers,
    todayActions,
    effort,
    orphanGoals,
    systemsWithoutGoal,
    needs: mapa.necesidades,
    systems: metrics.systems,
    coreLoading,
    forecastLoading,
    error,
    refresh,
  };
}
