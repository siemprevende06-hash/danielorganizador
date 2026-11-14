import type { NextAction, VentureAnalytics, VentureData } from './types';
import { daysBetween, todayISO, weekStartISO } from './formatters';

export function buildNextActions(data: VentureData, analytics: VentureAnalytics): NextAction[] {
  const { kpis, stageProgress } = analytics;
  const actions: NextAction[] = [];
  const today = todayISO();

  const reviewRecent = data.reviews.some((r) => r.week_start >= weekStartISO());
  const activeExperiments = data.experiments.filter((e) => e.status === 'running').length;
  const daysInStage = daysBetween(data.venture.stage_entered_at || today, today);

  if (stageProgress.percent === 100 && data.venture.stage !== 'scale' && data.venture.stage !== 'paused') {
    actions.push({
      id: 'advance-stage',
      title: 'Estás listo para avanzar de etapa',
      description: `Cumpliste ${stageProgress.done}/${stageProgress.total} criterios. Revisa el siguiente nivel y actualiza tu etapa.`,
      tone: 'success',
      tab: 'overview',
      cta: 'Revisar etapa',
    });
  }

  if (kpis.runwayMonths !== null && kpis.runwayMonths < 4) {
    actions.push({
      id: 'runway',
      title: 'Runway crítico',
      description: `Tienes ${kpis.runwayMonths.toFixed(1)} meses de caja. Recorta gastos o define un plan de ingresos esta semana.`,
      tone: 'danger',
      tab: 'finance',
      cta: 'Ver finanzas',
    });
  }

  if (kpis.overdueTasks > 0) {
    actions.push({
      id: 'overdue',
      title: `${kpis.overdueTasks} tarea${kpis.overdueTasks === 1 ? '' : 's'} vencida${kpis.overdueTasks === 1 ? '' : 's'}`,
      description: 'Cierra, reprograma o elimina lo que ya no aporta. Un backlog limpio es velocidad.',
      tone: 'warning',
      tab: 'product',
      cta: 'Limpiar backlog',
    });
  }

  if (kpis.revenueMonth === 0 && data.venture.stage !== 'idea') {
    actions.push({
      id: 'no-revenue',
      title: 'Sin ingresos este mes',
      description: 'Registra el primer cobro o revisa tu propuesta de precio. Sin ingresos no hay negocio.',
      tone: 'danger',
      tab: 'finance',
      cta: 'Registrar ingreso',
    });
  }

  if (!reviewRecent) {
    actions.push({
      id: 'review',
      title: 'Haz tu revisión semanal',
      description: '10 minutos: qué ganaste, qué te bloqueó y cuál es el foco de la próxima semana.',
      tone: 'info',
      tab: 'review',
      cta: 'Abrir revisión',
    });
  }

  if (kpis.focusHoursWeek < 3) {
    actions.push({
      id: 'focus',
      title: 'Poco tiempo de foco',
      description: `Solo ${kpis.focusHoursWeek.toFixed(1)} h esta semana. Bloquea una sesión de foco profundo para avanzar.`,
      tone: 'warning',
      tab: 'product',
      cta: 'Planificar foco',
    });
  }

  if (data.customers.length === 0) {
    actions.push({
      id: 'first-customer',
      title: 'Tu embudo está vacío',
      description: 'Añade tu primer lead y define el siguiente paso. El mercado se mide, no se imagina.',
      tone: 'info',
      tab: 'customers',
      cta: 'Añadir lead',
    });
  }

  if (activeExperiments === 0 && data.customers.length > 0) {
    actions.push({
      id: 'experiment',
      title: 'Lanza un experimento',
      description: 'Una hipótesis, un canal, una métrica. Sin experimentos no hay aprendizaje.',
      tone: 'info',
      tab: 'experiments',
      cta: 'Crear experimento',
    });
  }

  if (daysInStage > 45 && data.venture.stage !== 'paused' && data.venture.stage !== 'scale') {
    actions.push({
      id: 'stale-stage',
      title: `${daysInStage} días en la misma etapa`,
      description: 'Define el criterio que falta y ponle fecha. Si no avanzas, pivota o pausa el proyecto.',
      tone: 'warning',
      tab: 'overview',
      cta: 'Ver criterios',
    });
  }

  return actions.slice(0, 4);
}