import { describe, expect, it } from 'vitest';
import { buildAnalytics } from '../metrics';
import { computeStageProgress, nextStage } from '../stages';
import type { Venture, VentureData } from '../types';

function venture(overrides: Partial<Venture> = {}): Venture {
  return {
    id: 'venture-1',
    name: 'Test Venture',
    description: null,
    cover_image: null,
    stage: 'idea',
    business_model: null,
    target_market: null,
    currency: 'USD',
    accent_color: '#3b82f6',
    cash_balance: 0,
    monthly_goal: null,
    north_star_key: null,
    north_star_target: null,
    started_at: '2026-01-01',
    stage_entered_at: '2026-01-01',
    archived: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function data(partial: Partial<VentureData> = {}): VentureData {
  return {
    venture: venture(),
    tasks: [],
    goals: [],
    income: [],
    expenses: [],
    customers: [],
    metrics: [],
    experiments: [],
    milestones: [],
    reviews: [],
    focus: [],
    ...partial,
  };
}

const now = new Date(2026, 10, 13, 12, 0, 0);

describe('buildAnalytics', () => {
  it('convierte ingresos en CUP a la moneda base USD', () => {
    const analytics = buildAnalytics(
      data({
        income: [
          {
            id: 'income-1',
            entrepreneurship_id: 'venture-1',
            amount: 36000,
            description: null,
            income_date: '2026-11-05',
            income_type: 'revenue',
            currency: 'CUP',
            exchange_rate: 360,
            customer_id: null,
            created_at: '2026-11-05T00:00:00.000Z',
          },
        ],
      }),
      { now },
    );

    expect(analytics.kpis.revenueMonth).toBe(100);
    expect(analytics.kpis.profitMonth).toBe(100);
  });

  it('calcula burn y runway con los últimos tres meses', () => {
    const expense = (id: string, date: string) => ({
      id,
      entrepreneurship_id: 'venture-1',
      amount: 1000,
      currency: 'USD' as const,
      exchange_rate: 1,
      category: 'operating',
      expense_kind: 'opex' as const,
      vendor: null,
      description: null,
      expense_date: date,
      recurring: false,
      created_at: `${date}T00:00:00.000Z`,
    });

    const analytics = buildAnalytics(
      data({
        venture: venture({ cash_balance: 6000 }),
        expenses: [expense('e1', '2026-09-10'), expense('e2', '2026-10-10'), expense('e3', '2026-11-10')],
      }),
      { now },
    );

    expect(analytics.kpis.burnRate).toBe(1000);
    expect(analytics.kpis.netBurn).toBe(1000);
    expect(analytics.kpis.runwayMonths).toBe(6);
    expect(analytics.kpis.expensesMonth).toBe(1000);
  });

  it('usa el MRR de clientes que pagan y calcula el embudo', () => {
    const customer = (id: string, status: 'lead' | 'paying', mrr: number) => ({
      id,
      entrepreneurship_id: 'venture-1',
      name: id,
      email: null,
      segment: null,
      status,
      plan: null,
      mrr,
      currency: 'USD' as const,
      source: null,
      started_at: '2026-10-01',
      churned_at: null,
      notes: null,
      created_at: '2026-10-01T00:00:00.000Z',
      updated_at: '2026-10-01T00:00:00.000Z',
    });

    const analytics = buildAnalytics(
      data({
        customers: [customer('lead-1', 'lead', 0), customer('paying-1', 'paying', 120), customer('paying-2', 'paying', 80)],
      }),
      { now },
    );

    expect(analytics.kpis.mrr).toBe(200);
    expect(analytics.kpis.payingCustomers).toBe(2);
    expect(analytics.funnel[0].count).toBe(3);
    expect(analytics.funnel[4].count).toBe(2);
    expect(analytics.funnel[4].conversion).toBe(1);
  });

  it('marca el runway como null cuando no hay burn neto', () => {
    const analytics = buildAnalytics(data({ venture: venture({ cash_balance: 1000 }) }), { now });
    expect(analytics.kpis.netBurn).toBe(0);
    expect(analytics.kpis.runwayMonths).toBeNull();
  });
});

describe('etapas', () => {
  it('calcula el progreso solo con hitos de salida completados', () => {
    const progress = computeStageProgress('idea', [
      {
        id: 'm1',
        entrepreneurship_id: 'venture-1',
        template_key: 'idea_interviews_10',
        title: '10 entrevistas',
        stage: 'idea',
        kind: 'exit',
        target_date: null,
        completed_at: '2026-11-01T00:00:00.000Z',
        sort_order: 0,
        created_at: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'm2',
        entrepreneurship_id: 'venture-1',
        template_key: 'idea_segments',
        title: 'Segmentos',
        stage: 'idea',
        kind: 'exit',
        target_date: null,
        completed_at: null,
        sort_order: 1,
        created_at: '2026-11-01T00:00:00.000Z',
      },
    ]);

    expect(progress.done).toBe(1);
    expect(progress.total).toBe(4);
    expect(progress.percent).toBe(25);
  });

  it('no avanza desde la última etapa', () => {
    expect(nextStage('idea')).toBe('validation');
    expect(nextStage('scale')).toBeNull();
  });
});