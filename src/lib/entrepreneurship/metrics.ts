import {
  clamp,
  formatCurrency,
  monthLabel,
  norm,
  todayISO,
  toISODate,
  weekStartISO,
} from './formatters';
import { computeStageProgress, expenseCategoryLabel, getStageMeta, metricLabel, metricUnit } from './stages';
import type {
  CategorySlice,
  CustomerStatus,
  Expense,
  FunnelStep,
  HealthBreakdown,
  Income,
  MonthlyPoint,
  NorthStar,
  VentureAnalytics,
  VentureData,
  VentureKpis,
  WeekPoint,
} from './types';

const STATUS_ORDER: CustomerStatus[] = ['lead', 'contacted', 'demo', 'trial', 'paying'];

function monthKeyOf(value?: string | null): string {
  return (value || '').slice(0, 7);
}

function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonths(count: number, now: Date): string[] {
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return Array.from({ length: count }, (_, i) => shiftMonth(current, i - (count - 1)));
}

function rateFor(row: { currency?: string; exchange_rate?: number }, defaultRate: number): number {
  const raw = Number(row.exchange_rate);
  if (row.currency === 'CUP' && (!Number.isFinite(raw) || raw <= 1)) return defaultRate;
  return Number.isFinite(raw) && raw > 0 ? raw : defaultRate;
}

export function buildAnalytics(data: VentureData, options?: { now?: Date; defaultRate?: number }): VentureAnalytics {
  const now = options?.now ?? new Date();
  const defaultRate = options?.defaultRate && options.defaultRate > 0 ? options.defaultRate : 360;
  const baseCurrency = data.venture.currency || 'USD';

  const toBase = (amount: number, currency?: string, rate?: number) => {
    const value = Number(amount) || 0;
    const from = currency || 'USD';
    const r = Number(rate) > 1 ? Number(rate) : defaultRate;
    if (from === baseCurrency) return value;
    if (baseCurrency === 'USD' && from === 'CUP') return value / r;
    if (baseCurrency === 'CUP' && from === 'USD') return value * r;
    return value;
  };

  const operatingIncome = (row: Income) =>
    row.income_type === 'investment' || row.income_type === 'refund'
      ? 0
      : toBase(row.amount, row.currency, rateFor(row, defaultRate));

  const incomeValue = (row: Income) => toBase(row.amount, row.currency, rateFor(row, defaultRate));
  const expenseValue = (row: Expense) => toBase(row.amount, row.currency, rateFor(row, defaultRate));

  // ---------- series mensual ----------
  const monthKeys = buildMonths(12, now);
  const monthMap = new Map<string, MonthlyPoint>(
    monthKeys.map((key) => [key, { key, label: monthLabel(key), revenue: 0, expenses: 0, profit: 0 }]),
  );

  data.income.forEach((row) => {
    const key = monthKeyOf(row.income_date);
    const point = monthMap.get(key);
    if (point) point.revenue += operatingIncome(row);
  });
  data.expenses.forEach((row) => {
    const key = monthKeyOf(row.expense_date);
    const point = monthMap.get(key);
    if (point) point.expenses += expenseValue(row);
  });
  monthMap.forEach((point) => {
    point.profit = point.revenue - point.expenses;
  });
  const monthly = monthKeys.map((key) => monthMap.get(key)!);

  const currentKey = monthKeys[monthKeys.length - 1];
  const prevKey = monthKeys[monthKeys.length - 2];
  const current = monthMap.get(currentKey)!;
  const previous = monthMap.get(prevKey)!;

  const revenueMonth = current.revenue;
  const revenuePrevMonth = previous.revenue;
  const expensesMonth = current.expenses;
  const profitMonth = revenueMonth - expensesMonth;
  const profitMargin = revenueMonth > 0 ? profitMonth / revenueMonth : 0;
  const cogsMonth = data.expenses
    .filter((row) => row.expense_kind === 'cogs' && monthKeyOf(row.expense_date) === currentKey)
    .reduce((sum, row) => sum + expenseValue(row), 0);
  const grossMargin = revenueMonth > 0 ? (revenueMonth - cogsMonth) / revenueMonth : 0;
  const revenueTotal = data.income.reduce((sum, row) => sum + operatingIncome(row), 0);

  const growthMoM =
    revenuePrevMonth > 0
      ? (revenueMonth - revenuePrevMonth) / revenuePrevMonth
      : revenueMonth > 0
        ? 1
        : 0;

  // ---------- clientes ----------
  const payingCustomers = data.customers.filter((c) => c.status === 'paying');
  const mrrFromCustomers = payingCustomers.reduce(
    (sum, c) => sum + toBase(c.mrr, c.currency, defaultRate),
    0,
  );
  const lastThreeRevenue = monthly.slice(-3).reduce((sum, point) => sum + point.revenue, 0);
  const fallbackMrr = lastThreeRevenue / 3;
  const mrr = mrrFromCustomers > 0 ? mrrFromCustomers : fallbackMrr;

  const churnedThisMonth = data.customers.filter(
    (c) => c.churned_at && monthKeyOf(c.churned_at) === currentKey,
  ).length;
  const activeAtStart = payingCustomers.length + churnedThisMonth;
  const churnRate = activeAtStart > 0 ? churnedThisMonth / activeAtStart : 0;
  const arpu = payingCustomers.length > 0 ? mrr / payingCustomers.length : 0;
  const ltv = churnRate > 0 ? arpu / churnRate : arpu * 12;

  const newCustomersMonth = data.customers.filter(
    (c) => c.started_at && monthKeyOf(c.started_at) === currentKey,
  ).length;

  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyKey = toISODate(ninetyDaysAgo);
  const marketingSpend = data.expenses
    .filter((row) => row.category === 'marketing' && row.expense_date >= ninetyKey)
    .reduce((sum, row) => sum + expenseValue(row), 0);
  const newPaying90 = data.customers.filter(
    (c) => c.status === 'paying' && c.started_at && c.started_at >= ninetyKey,
  ).length;
  const cac = newPaying90 > 0 ? marketingSpend / newPaying90 : 0;

  // ---------- burn / runway ----------
  const burnRate = monthly.slice(-3).reduce((sum, point) => sum + point.expenses, 0) / 3;
  const avgRevenue = lastThreeRevenue / 3;
  const netBurn = burnRate - avgRevenue;
  const cash = Number(data.venture.cash_balance) || 0;
  const runwayMonths = netBurn > 0 ? cash / netBurn : null;

  // ---------- tareas / foco ----------
  const openTasks = data.tasks.filter((t) => !t.completed);
  const completedTasks = data.tasks.filter((t) => t.completed).length;
  const overdueTasks = openTasks.filter((t) => t.due_date && t.due_date < todayISO()).length;
  const emptyDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const backlogAges = openTasks.map((t) => {
    const created = new Date(t.created_at);
    return Math.max(0, Math.round((emptyDay.getTime() - created.getTime()) / 86400000));
  });
  const avgBacklogAge = backlogAges.length
    ? backlogAges.reduce((a, b) => a + b, 0) / backlogAges.length
    : 0;

  const focusByDay: Record<string, number> = {};
  data.focus.forEach((entry) => {
    focusByDay[entry.date] = (focusByDay[entry.date] || 0) + entry.minutes;
  });
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    return toISODate(d);
  });
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    return toISODate(d);
  });
  const focusMinutesWeek = last7.reduce((sum, key) => sum + (focusByDay[key] || 0), 0);
  const focusMinutesMonth = last30.reduce((sum, key) => sum + (focusByDay[key] || 0), 0);

  // ---------- etapa ----------
  const stageProgress = computeStageProgress(data.venture.stage, data.milestones);

  // ---------- embudo ----------
  const funnel: FunnelStep[] = STATUS_ORDER.map((status, index) => {
    const reached = data.customers.filter((customer) => {
      if (customer.status === 'churned') return false;
      return STATUS_ORDER.indexOf(customer.status) >= index;
    }).length;
    return {
      key: status,
      label: status === 'lead' ? 'Leads' : status === 'contacted' ? 'Contactados' : status === 'demo' ? 'Demo' : status === 'trial' ? 'Prueba' : 'Pagan',
      count: index === 0 ? data.customers.filter((c) => c.status !== 'churned').length : reached,
      conversion: index === 0 ? 1 : 0,
    };
  });
  funnel.forEach((step, index) => {
    if (index === 0) return;
    const prev = funnel[index - 1].count;
    step.conversion = prev > 0 ? step.count / prev : 0;
  });

  const leads = funnel[0]?.count || 0;
  const paid = funnel[4]?.count || 0;
  const conversion = leads > 0 ? paid / leads : 0;
  const retention = payingCustomers.length + churnedThisMonth > 0
    ? payingCustomers.length / (payingCustomers.length + churnedThisMonth)
    : 0;

  const latestMetric = (key: string): number | null => {
    const rows = data.metrics
      .filter((m) => m.metric_key === key)
      .sort((a, b) => b.period_date.localeCompare(a.period_date));
    return rows.length ? Number(rows[0].value) : null;
  };

  // ---------- throughput semanal ----------
  const weeks: WeekPoint[] = Array.from({ length: 8 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (7 - i) * 7);
    const key = weekStartISO(date);
    return { key, label: key.slice(5).replace('-', '/'), created: 0, completed: 0 };
  });
  const weekMap = new Map(weeks.map((w) => [w.key, w]));
  data.tasks.forEach((task) => {
    const createdKey = weekStartISO(new Date(task.created_at));
    const createdWeek = weekMap.get(createdKey);
    if (createdWeek) createdWeek.created += 1;
    if (task.completed) {
      const doneKey = weekStartISO(new Date(task.updated_at || task.created_at));
      const doneWeek = weekMap.get(doneKey);
      if (doneWeek) doneWeek.completed += 1;
    }
  });

  // ---------- gastos por categoría (mes actual) ----------
  const categoryMap = new Map<string, number>();
  data.expenses
    .filter((row) => monthKeyOf(row.expense_date) === currentKey)
    .forEach((row) => {
      const key = row.category || 'other';
      categoryMap.set(key, (categoryMap.get(key) || 0) + expenseValue(row));
    });
  const expensesByCategory: CategorySlice[] = [...categoryMap.entries()]
    .map(([key, value]) => ({ key, label: expenseCategoryLabel(key), value }))
    .sort((a, b) => b.value - a.value);

  // ---------- salud ----------
  const throughputTrend = (() => {
    const last4 = weeks.slice(-4).reduce((sum, w) => sum + w.completed, 0);
    const prev4 = weeks.slice(0, 4).reduce((sum, w) => sum + w.completed, 0);
    if (prev4 === 0) return last4 > 0 ? 1 : 0.5;
    return clamp(last4 / prev4, 0, 1.5) / 1.5;
  })();

  const pmf = latestMetric('pmf_score');
  const financeScore =
    100 * (0.4 * (runwayMonths === null ? 1 : norm(runwayMonths, 0, 6)) +
      0.3 * norm(growthMoM, -0.2, 0.15) +
      0.3 * norm(profitMargin, 0, 0.5));
  const productScore =
    100 * (0.4 * (stageProgress.percent / 100) +
      0.3 * throughputTrend +
      0.3 * (openTasks.length ? norm(30 - avgBacklogAge, 0, 30) : 1));
  const marketScore =
    100 * (0.4 * norm(conversion, 0, 0.25) +
      0.4 * retention +
      0.2 * (pmf === null ? 0.5 : clamp(pmf / 100, 0, 1)));
  const activeExperiments = data.experiments.filter((e) => e.status === 'running').length;
  const lastReview = data.reviews
    .map((r) => r.week_start)
    .sort()
    .pop();
  const reviewRecent = lastReview ? lastReview >= weekStartISO(new Date(now.getTime() - 7 * 86400000)) : false;
  const executionScore =
    100 * (0.5 * norm(focusMinutesWeek / 60, 0, 10) +
      0.3 * (reviewRecent ? 1 : 0) +
      0.2 * (activeExperiments > 0 ? 1 : 0));

  const meta = getStageMeta(data.venture.stage);
  const weights = meta.healthWeights;
  const healthBreakdown: HealthBreakdown = {
    finance: Math.round(clamp(financeScore, 0, 100)),
    product: Math.round(clamp(productScore, 0, 100)),
    market: Math.round(clamp(marketScore, 0, 100)),
    execution: Math.round(clamp(executionScore, 0, 100)),
  };
  const healthScore = Math.round(
    healthBreakdown.finance * weights.finance +
      healthBreakdown.product * weights.product +
      healthBreakdown.market * weights.market +
      healthBreakdown.execution * weights.execution,
  );

  // ---------- North Star ----------
  const northStarKey = data.venture.north_star_key || meta.northStarKey;
  const northStarValue = (() => {
    switch (northStarKey) {
      case 'interviews':
        return latestMetric('interviews') ?? 0;
      case 'preorders':
        return latestMetric('preorders') ?? 0;
      case 'active_users':
        return latestMetric('active_users') ?? data.customers.filter((c) => c.status === 'trial' || c.status === 'paying').length;
      case 'retention':
        return latestMetric('retention') ?? Math.round(retention * 100);
      case 'mrr':
        return mrr;
      case 'nrr':
        return latestMetric('nrr') ?? 100;
      default:
        return latestMetric(northStarKey) ?? 0;
    }
  })();
  const northStarTarget = data.venture.north_star_target ?? meta.defaultTarget;
  const northStar: NorthStar = {
    key: northStarKey,
    label: northStarKey === meta.northStarKey ? meta.northStarLabel : metricLabel(northStarKey),
    value: northStarValue,
    target: northStarTarget,
    unit: northStarKey === meta.northStarKey ? meta.northStarUnit : metricUnit(northStarKey),
    percent: northStarTarget > 0 ? clamp((northStarValue / northStarTarget) * 100, 0, 100) : 0,
  };

  // ---------- KPIs ----------
  const kpis: VentureKpis = {
    mrr,
    mrrDelta: growthMoM,
    revenueMonth,
    revenuePrevMonth,
    revenueTotal,
    expensesMonth,
    profitMonth,
    profitMargin,
    grossMargin,
    burnRate,
    netBurn,
    runwayMonths,
    cashBalance: cash,
    payingCustomers: payingCustomers.length,
    totalCustomers: data.customers.filter((c) => c.status !== 'churned').length,
    newCustomersMonth,
    churnRate,
    arpu,
    ltv,
    cac,
    growthMoM,
    focusHoursWeek: focusMinutesWeek / 60,
    focusHoursMonth: focusMinutesMonth / 60,
    healthScore,
    stageProgress: stageProgress.percent,
    openTasks: openTasks.length,
    overdueTasks,
    completedTasks,
    totalTasks: data.tasks.length,
  };

  // ---------- alertas ----------
  const alerts: string[] = [];
  if (runwayMonths !== null && runwayMonths < 4) {
    alerts.push(`Runway de ${runwayMonths.toFixed(1)} meses: reduce gastos o acelera ingresos.`);
  }
  if (overdueTasks > 0) {
    alerts.push(`${overdueTasks} tarea${overdueTasks === 1 ? '' : 's'} vencida${overdueTasks === 1 ? '' : 's'} sin cerrar.`);
  }
  if (revenueMonth === 0 && data.venture.stage !== 'idea') {
    alerts.push('Sin ingresos registrados este mes.');
  }
  if (avgBacklogAge > 30) {
    alerts.push(`El backlog abierto promedia ${Math.round(avgBacklogAge)} días: limpia lo viejo.`);
  }
  if (!reviewRecent) {
    alerts.push('No has hecho la revisión semanal. Son 10 minutos.');
  }
  if (stageProgress.percent === 100 && data.venture.stage !== 'scale' && data.venture.stage !== 'paused') {
    alerts.push('Cumpliste todos los criterios de la etapa: puedes avanzar.');
  }

  return {
    kpis,
    monthly,
    expensesByCategory,
    funnel,
    weeklyThroughput: weeks,
    focusByDay,
    healthBreakdown,
    stageProgress,
    northStar,
    alerts,
  };
}

export function northStarDisplay(northStar: NorthStar, currency = 'USD'): string {
  if (northStar.unit === '%') return `${Math.round(northStar.value)}%`;
  if (northStar.unit === 'USD') return formatCurrency(northStar.value, currency, true);
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(northStar.value);
}

export function metricHistory(data: VentureData, key: string) {
  return data.metrics
    .filter((m) => m.metric_key === key)
    .sort((a, b) => a.period_date.localeCompare(b.period_date))
    .map((m) => ({ date: m.period_date, label: m.period_date.slice(5).replace('-', '/'), value: Number(m.value) }));
}

export { metricLabel, metricUnit };