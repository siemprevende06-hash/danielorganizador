import type { Milestone, Stage, StageProgress } from './types';

export interface StageExitItem {
  key: string;
  label: string;
}

export interface StageMeta {
  stage: Exclude<Stage, 'paused'>;
  label: string;
  short: string;
  description: string;
  color: string;
  northStarKey: string;
  northStarLabel: string;
  northStarUnit: string;
  defaultTarget: number;
  exitItems: StageExitItem[];
  healthWeights: { finance: number; product: number; market: number; execution: number };
}

export const STAGE_ORDER: Array<Exclude<Stage, 'paused'>> = [
  'idea',
  'validation',
  'mvp',
  'traction',
  'revenue',
  'scale',
];

export const STAGE_META: Record<Exclude<Stage, 'paused'>, StageMeta> = {
  idea: {
    stage: 'idea',
    label: 'Idea',
    short: 'Idea',
    description: 'Exploras el problema antes de construir nada.',
    color: '#3b82f6',
    northStarKey: 'interviews',
    northStarLabel: 'Entrevistas este mes',
    northStarUnit: 'count',
    defaultTarget: 10,
    exitItems: [
      { key: 'idea_interviews_10', label: '10 entrevistas con potenciales clientes' },
      { key: 'idea_problem_doc', label: 'Problema documentado con evidencia' },
      { key: 'idea_segments', label: '3 segmentos priorizados' },
      { key: 'idea_value_prop', label: 'Propuesta de valor escrita en una frase' },
    ],
    healthWeights: { finance: 0.2, product: 0.3, market: 0.35, execution: 0.15 },
  },
  validation: {
    stage: 'validation',
    label: 'Validación',
    short: 'Validación',
    description: 'Compruebas que alguien pagaría por la solución.',
    color: '#0ea5e9',
    northStarKey: 'preorders',
    northStarLabel: 'Preventas / cartas de intención',
    northStarUnit: 'count',
    defaultTarget: 3,
    exitItems: [
      { key: 'val_interviews_5', label: '5 entrevistas de dolor profundo' },
      { key: 'val_preorders_3', label: '3 preventas o cartas de intención' },
      { key: 'val_pricing_test', label: 'Test de precio realizado' },
      { key: 'val_landing', label: 'Landing con propuesta y CTA publicada' },
    ],
    healthWeights: { finance: 0.2, product: 0.2, market: 0.45, execution: 0.15 },
  },
  mvp: {
    stage: 'mvp',
    label: 'MVP',
    short: 'MVP',
    description: 'Construyes lo mínimo para que el usuario complete el flujo.',
    color: '#14b8a6',
    northStarKey: 'active_users',
    northStarLabel: 'Usuarios activos',
    northStarUnit: 'count',
    defaultTarget: 5,
    exitItems: [
      { key: 'mvp_core_flow', label: 'Flujo principal usable de punta a punta' },
      { key: 'mvp_users_5', label: '5 usuarios reales probando el producto' },
      { key: 'mvp_feedback_10', label: '10 feedbacks accionables registrados' },
      { key: 'mvp_metrics', label: 'Métricas de uso instrumentadas' },
    ],
    healthWeights: { finance: 0.15, product: 0.4, market: 0.3, execution: 0.15 },
  },
  traction: {
    stage: 'traction',
    label: 'Tracción',
    short: 'Tracción',
    description: 'Encuentras un canal que trae usuarios que vuelven.',
    color: '#22c55e',
    northStarKey: 'retention',
    northStarLabel: 'Retención a 4 semanas',
    northStarUnit: '%',
    defaultTarget: 30,
    exitItems: [
      { key: 'trac_customers_10', label: '10 clientes activos o 100 usuarios' },
      { key: 'trac_retention_30', label: 'Retención a 4 semanas ≥ 30%' },
      { key: 'trac_channel', label: 'Un canal de adquisición repetible' },
      { key: 'trac_onboarding', label: 'Onboarding que activa al usuario' },
    ],
    healthWeights: { finance: 0.2, product: 0.25, market: 0.4, execution: 0.15 },
  },
  revenue: {
    stage: 'revenue',
    label: 'Ingresos / PMF',
    short: 'Ingresos',
    description: 'El negocio genera dinero de forma recurrente.',
    color: '#f59e0b',
    northStarKey: 'mrr',
    northStarLabel: 'MRR',
    northStarUnit: 'USD',
    defaultTarget: 500,
    exitItems: [
      { key: 'rev_mrr_positive', label: 'MRR > 0 y primeros clientes pagando' },
      { key: 'rev_growth_3m', label: '3 meses consecutivos de crecimiento' },
      { key: 'rev_churn_10', label: 'Churn mensual < 10%' },
      { key: 'rev_margin_50', label: 'Margen bruto > 50%' },
    ],
    healthWeights: { finance: 0.4, product: 0.2, market: 0.25, execution: 0.15 },
  },
  scale: {
    stage: 'scale',
    label: 'Escalado',
    short: 'Escalado',
    description: 'El crecimiento es repetible y el negocio aguanta.',
    color: '#ec4899',
    northStarKey: 'nrr',
    northStarLabel: 'Net Revenue Retention',
    northStarUnit: '%',
    defaultTarget: 100,
    exitItems: [
      { key: 'scale_processes', label: 'Procesos clave documentados' },
      { key: 'scale_cac_ltv', label: 'LTV:CAC ≥ 3' },
      { key: 'scale_runway_6', label: 'Runway > 6 meses' },
      { key: 'scale_team', label: 'Equipo o automatización para operar' },
    ],
    healthWeights: { finance: 0.4, product: 0.15, market: 0.3, execution: 0.15 },
  },
};

export const PAUSED_META = {
  stage: 'paused' as const,
  label: 'En pausa',
  short: 'Pausa',
  description: 'Proyecto dormido con fecha de revisión.',
  color: '#64748b',
  northStarKey: 'interviews',
  northStarLabel: 'Sin North Star',
  northStarUnit: 'count',
  defaultTarget: 0,
  exitItems: [] as StageExitItem[],
  healthWeights: { finance: 0.25, product: 0.25, market: 0.25, execution: 0.25 },
};

export const ALL_STAGES = [...STAGE_ORDER, 'paused'] as const;

export function getStageMeta(stage?: string | null): StageMeta | typeof PAUSED_META {
  if (stage === 'paused') return PAUSED_META;
  return STAGE_META[(stage as Exclude<Stage, 'paused'>) || 'idea'] || STAGE_META.idea;
}

export function getStageIndex(stage?: string | null): number {
  return STAGE_ORDER.indexOf((stage as Exclude<Stage, 'paused'>) || 'idea');
}

export function nextStage(stage?: string | null): Exclude<Stage, 'paused'> | null {
  const index = getStageIndex(stage);
  if (index < 0 || index >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[index + 1];
}

export function computeStageProgress(stage: Stage | string, milestones: Milestone[]): StageProgress {
  const meta = getStageMeta(stage);
  const doneKeys = new Set(
    milestones
      .filter((m) => m.completed_at && m.kind === 'exit')
      .map((m) => m.template_key)
      .filter(Boolean) as string[],
  );
  const items = meta.exitItems.map((item) => ({
    key: item.key,
    label: item.label,
    done: doneKeys.has(item.key),
  }));
  const done = items.filter((i) => i.done).length;
  const total = items.length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0, items };
}

export const METRIC_CATALOG = [
  { key: 'interviews', label: 'Entrevistas realizadas', unit: 'count' },
  { key: 'preorders', label: 'Preventas / cartas', unit: 'count' },
  { key: 'signups', label: 'Registros', unit: 'count' },
  { key: 'active_users', label: 'Usuarios activos', unit: 'count' },
  { key: 'activation_rate', label: 'Tasa de activación', unit: '%' },
  { key: 'retention', label: 'Retención', unit: '%' },
  { key: 'mrr', label: 'MRR', unit: 'USD' },
  { key: 'nrr', label: 'Net Revenue Retention', unit: '%' },
  { key: 'pmf_score', label: 'Señal PMF (Sean Ellis)', unit: '%' },
  { key: 'website_visits', label: 'Visitas web', unit: 'count' },
] as const;

export function metricLabel(key: string): string {
  return METRIC_CATALOG.find((m) => m.key === key)?.label || key;
}

export function metricUnit(key: string): string {
  return METRIC_CATALOG.find((m) => m.key === key)?.unit || 'count';
}

export const EXPENSE_CATEGORIES = [
  { key: 'operating', label: 'Operación' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'product', label: 'Producto' },
  { key: 'tools', label: 'Herramientas' },
  { key: 'payroll', label: 'Equipo' },
  { key: 'tax', label: 'Impuestos' },
  { key: 'other', label: 'Otros' },
] as const;

export function expenseCategoryLabel(key: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.key === key)?.label || key;
}

export const CUSTOMER_STATUS_META = [
  { key: 'lead', label: 'Lead', color: '#94a3b8' },
  { key: 'contacted', label: 'Contactado', color: '#0ea5e9' },
  { key: 'demo', label: 'Demo', color: '#2563eb' },
  { key: 'trial', label: 'Prueba', color: '#06b6d4' },
  { key: 'paying', label: 'Paga', color: '#22c55e' },
  { key: 'churned', label: 'Baja', color: '#ef4444' },
] as const;

export function customerStatusLabel(key: string): string {
  return CUSTOMER_STATUS_META.find((s) => s.key === key)?.label || key;
}