import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Edit3,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  LineChart,
  ListTodo,
  Plus,
  Rocket,
  Settings2,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { useEntrepreneurshipData } from '@/hooks/useEntrepreneurshipData';
import {
  buildNextActions,
} from '@/lib/entrepreneurship/nextActions';
import { metricHistory, northStarDisplay } from '@/lib/entrepreneurship/metrics';
import {
  customerStatusLabel,
  CUSTOMER_STATUS_META,
  expenseCategoryLabel,
  getStageMeta,
  METRIC_CATALOG,
  metricUnit,
} from '@/lib/entrepreneurship/stages';
import {
  errorMessage,
  formatCurrency,
  formatDate,
  formatDateShort,
  formatHours,
  formatMonths,
  formatNumber,
  formatPercent,
  hexWithAlpha,
  todayISO,
  weekStartISO,
} from '@/lib/entrepreneurship/formatters';
import type {
  Customer,
  CustomerStatus,
  EntrepreneurshipTask,
  Experiment,
  Stage,
  Subtask,
  VentureAnalytics,
  VentureData,
} from '@/lib/entrepreneurship/types';
import { EmptyState, GlassCard, HealthRing, KpiCard, ProgressBar, SectionTitle, SetupBanner, Sparkline, StageChip } from './ui';
import { ExpenseDonut, FocusHeatmap, FunnelBars, HealthRadar, MetricLine, RevenueExpenseChart, RunwayGauge, ThroughputChart } from './charts';
import { StageTracker } from './StageTracker';
import { NextBestActions } from './NextBestActions';
import { CustomerDialog, ExperimentDialog, MetricDialog, MovementDialog, ReviewDialog, VentureDialog } from './forms';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { id: 'finance', label: 'Finanzas', icon: Wallet },
  { id: 'customers', label: 'Clientes', icon: Users },
  { id: 'metrics', label: 'Métricas', icon: LineChart },
  { id: 'product', label: 'Producto', icon: ListTodo },
  { id: 'experiments', label: 'Experimentos', icon: FlaskConical },
  { id: 'review', label: 'Revisión', icon: Gauge },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface Props {
  data: VentureData;
  analytics: VentureAnalytics;
  defaultRate: number;
  missingTables: string[];
  actions: ReturnType<typeof useEntrepreneurshipData>;
}

export function VentureDashboard({ data, analytics, defaultRate, missingTables, actions }: Props) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : 'overview';
  const setTab = (next: TabId) => setSearchParams(next === 'overview' ? {} : { tab: next }, { replace: true });

  const { venture } = data;
  const meta = getStageMeta(venture.stage);
  const accent = venture.accent_color || meta.color;
  const analyticsData = analytics;
  const kpis = analyticsData.kpis;
  const actionsList = useMemo(() => buildNextActions(data, analyticsData), [data, analyticsData]);

  const [movementOpen, setMovementOpen] = useState(false);
  const [movementKind, setMovementKind] = useState<'income' | 'expense'>('income');
  const [customerOpen, setCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [experimentOpen, setExperimentOpen] = useState(false);
  const [editingExperiment, setEditingExperiment] = useState<Experiment | null>(null);
  const [metricOpen, setMetricOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [ventureOpen, setVentureOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EntrepreneurshipTask | null>(null);
  const [taskType, setTaskType] = useState<'normal' | 'improvement'>('normal');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [productFilter, setProductFilter] = useState<'all' | 'open' | 'overdue' | 'done'>('open');
  const [movementFilter, setMovementFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedMetric, setSelectedMetric] = useState('mrr');

  const requiresMigration = (table: string) => missingTables.includes(table);

  const openMovement = (kind: 'income' | 'expense') => {
    if (kind === 'expense' && requiresMigration('entrepreneurship_expenses')) {
      toast.info('Aplica la migración para registrar gastos.');
      return;
    }
    setMovementKind(kind);
    setMovementOpen(true);
  };

  const openCustomer = (customer?: Customer | null) => {
    if (requiresMigration('entrepreneurship_customers')) {
      toast.info('Aplica la migración para gestionar clientes.');
      return;
    }
    setEditingCustomer(customer || null);
    setCustomerOpen(true);
  };

  const openExperiment = (experiment?: Experiment | null) => {
    if (requiresMigration('entrepreneurship_experiments')) {
      toast.info('Aplica la migración para gestionar experimentos.');
      return;
    }
    setEditingExperiment(experiment || null);
    setExperimentOpen(true);
  };

  const openMetric = () => {
    if (requiresMigration('entrepreneurship_metrics')) {
      toast.info('Aplica la migración para registrar métricas.');
      return;
    }
    setMetricOpen(true);
  };

  const openReview = () => {
    if (requiresMigration('entrepreneurship_reviews')) {
      toast.info('Aplica la migración para guardar revisiones semanales.');
      return;
    }
    setReviewOpen(true);
  };

  const openTask = (type: 'normal' | 'improvement', task?: EntrepreneurshipTask) => {
    setEditingTask(task || null);
    setTaskType(task?.task_type || type);
    setTaskTitle(task?.title || '');
    setTaskDesc(task?.description || '');
    setTaskDue(task?.due_date || '');
    setTaskOpen(true);
  };

  const saveTask = async () => {
    if (!taskTitle.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    try {
      if (editingTask) {
        await actions.updateTask(editingTask.id, { title: taskTitle.trim(), description: taskDesc.trim(), due_date: taskDue || null });
        toast.success('Tarea actualizada');
      } else {
        await actions.addTask(venture.id, {
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          due_date: taskDue || null,
          task_type: taskType,
        });
        toast.success(taskType === 'improvement' ? 'Mejora añadida' : 'Tarea creada');
      }
      setTaskOpen(false);
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo guardar'));
    }
  };

  const changeStage = async (stage: Stage) => {
    try {
      const result = await actions.updateVenture(venture.id, { stage, stage_entered_at: todayISO() });
      if (result.skipped.includes('stage')) {
        throw new Error('Aplica la migración del dashboard para guardar la etapa.');
      }
      toast.success(`Etapa actualizada: ${getStageMeta(stage).label}`);
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo cambiar la etapa'));
    }
  };

  const toggleStageItem = async (key: string, title: string, done: boolean) => {
    if (requiresMigration('entrepreneurship_milestones')) {
      toast.info('Aplica la migración para guardar los criterios de etapa.');
      return;
    }
    try {
      await actions.toggleMilestone(venture.id, venture.stage, key, title, done);
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo guardar el criterio'));
    }
  };

  const removeMovement = async (kind: 'income' | 'expense', id: string) => {
    try {
      if (kind === 'income') await actions.deleteIncome(id);
      else await actions.deleteExpense(id);
      toast.success('Movimiento eliminado');
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo eliminar'));
    }
  };

  const removeTask = async (id: string) => {
    try {
      await actions.deleteTask(id);
      toast.success('Tarea eliminada');
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo eliminar'));
    }
  };

  const removeCustomer = async (id: string) => {
    try {
      await actions.deleteCustomer(id);
      toast.success('Cliente eliminado');
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo eliminar'));
    }
  };

  const removeExperiment = async (id: string) => {
    try {
      await actions.deleteExperiment(id);
      toast.success('Experimento eliminado');
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo eliminar'));
    }
  };

  const todayOpenTasks = data.tasks
    .filter((t) => !t.completed)
    .sort((a, b) => {
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return b.created_at.localeCompare(a.created_at);
    })
    .slice(0, 5);

  const movements = useMemo(() => {
    const rows = [
      ...data.income.map((row) => ({
        id: row.id,
        kind: 'income' as const,
        date: row.income_date,
        description: row.description || 'Ingreso',
        category: row.income_type,
        amount: Number(row.amount),
        currency: row.currency,
      })),
      ...data.expenses.map((row) => ({
        id: row.id,
        kind: 'expense' as const,
        date: row.expense_date,
        description: row.description || 'Gasto',
        category: expenseCategoryLabel(row.category),
        amount: Number(row.amount),
        currency: row.currency,
      })),
    ];
    return rows
      .filter((row) => movementFilter === 'all' || row.kind === movementFilter)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.income, data.expenses, movementFilter]);

  const monthlySpark = analyticsData.monthly.map((m) => m.revenue);
  const latestMetric = (key: string) => {
    const rows = data.metrics.filter((m) => m.metric_key === key).sort((a, b) => b.period_date.localeCompare(a.period_date));
    return rows[0]?.value;
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-4 px-4 pb-24 pt-20" style={{ paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 4rem))' }}>
      {/* Hero */}
      <GlassCard className="overflow-hidden" accent={accent}>
        <div
          className="relative border-b border-border/50 px-4 pb-4 pt-5 sm:px-5"
          style={{ background: `linear-gradient(120deg, ${hexWithAlpha(accent, 0.16)}, transparent 60%)` }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate('/entrepreneurship')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <StageChip label={meta.label} color={meta.color} />
                {venture.archived && <Badge variant="outline" className="text-[9px]">Archivado</Badge>}
              </div>
              <h1 className="mt-1.5 flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                <span className="truncate">{venture.name}</span>
                <Button variant="ghost" size="sm" className="h-7 w-7 shrink-0 p-0" onClick={() => setVentureOpen(true)}>
                  <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </h1>
              <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                {venture.description || 'Sin descripción'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                {venture.business_model && <Badge variant="secondary" className="text-[9px]">{venture.business_model}</Badge>}
                {venture.target_market && <Badge variant="outline" className="text-[9px]">{venture.target_market}</Badge>}
                {venture.started_at && <span>Desde {formatDate(venture.started_at)}</span>}
                <span>· {formatHours(kpis.focusHoursMonth * 60)} de foco este mes</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <HealthRing score={kpis.healthScore} />
              <div className="hidden w-40 space-y-1.5 sm:block">
                {[
                  { label: 'Finanzas', value: analyticsData.healthBreakdown.finance },
                  { label: 'Producto', value: analyticsData.healthBreakdown.product },
                  { label: 'Mercado', value: analyticsData.healthBreakdown.market },
                  { label: 'Ejecución', value: analyticsData.healthBreakdown.execution },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>{item.label}</span>
                      <span className="tabular-nums">{item.value}</span>
                    </div>
                    <ProgressBar value={item.value} className="mt-0.5 h-1" color={item.value >= 70 ? '#22c55e' : item.value >= 40 ? '#f59e0b' : '#ef4444'} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" className="gap-1.5" style={{ background: accent, color: '#fff' }} onClick={() => openMovement('income')}>
              <Plus className="h-3.5 w-3.5" /> Ingreso
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openMovement('expense')}>
              <TrendingDown className="h-3.5 w-3.5" /> Gasto
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openCustomer()}>
              <Users className="h-3.5 w-3.5" /> Cliente
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => openTask('normal')}>
              <ListTodo className="h-3.5 w-3.5" /> Tarea
            </Button>
            <Button size="sm" variant="ghost" className="ml-auto gap-1.5 text-muted-foreground" onClick={() => setVentureOpen(true)}>
              <Settings2 className="h-3.5 w-3.5" /> Ajustes
            </Button>
          </div>
        </div>

        <div className="grid gap-3 px-4 py-3 sm:grid-cols-3 sm:px-5">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">North Star · {analyticsData.northStar.label}</p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-xl font-semibold tabular-nums">{northStarDisplay(analyticsData.northStar, venture.currency)}</span>
              {analyticsData.northStar.target ? (
                <span className="text-xs text-muted-foreground">/ {analyticsData.northStar.target}</span>
              ) : null}
            </div>
            <ProgressBar value={analyticsData.northStar.percent} className="mt-1.5" color={accent} />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Caja disponible</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums">{formatCurrency(kpis.cashBalance, venture.currency)}</p>
            <p className="text-[10px] text-muted-foreground">
              {kpis.runwayMonths === null ? (kpis.revenueMonth > 0 ? 'Sin burn: operación rentable' : 'Sin burn registrado') : `Runway ${formatMonths(kpis.runwayMonths)}`}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Criterios de etapa</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums">{analyticsData.stageProgress.percent}%</p>
            <p className="text-[10px] text-muted-foreground">
              {analyticsData.stageProgress.done}/{analyticsData.stageProgress.total} completados
            </p>
          </div>
        </div>
      </GlassCard>

      <SetupBanner tables={missingTables} />

      {/* Tabs */}
      <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-border/60 bg-card/60 p-1 backdrop-blur-sm">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                active ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="MRR" value={formatCurrency(kpis.mrr, venture.currency, true)} delta={kpis.growthMoM} icon={TrendingUp} accent="#3b82f6" spark={monthlySpark} hint="recurrente mensual" />
            <KpiCard
              label="Runway"
              value={kpis.runwayMonths === null ? 'Sin burn' : formatMonths(kpis.runwayMonths)}
              icon={Wallet}
              accent={kpis.runwayMonths !== null && kpis.runwayMonths < 4 ? '#ef4444' : '#0ea5e9'}
              hint={`burn ${formatCurrency(kpis.burnRate, venture.currency, true)}/mes`}
            />
            <KpiCard label="Clientes pagos" value={kpis.payingCustomers} icon={Users} accent="#f59e0b" hint={`${kpis.newCustomersMonth} nuevos este mes`} />
            <KpiCard
              label="Utilidad del mes"
              value={formatCurrency(kpis.profitMonth, venture.currency, true)}
              delta={kpis.profitMargin}
              icon={DollarSign}
              accent={kpis.profitMonth >= 0 ? '#22c55e' : '#ef4444'}
              hint={`margen ${formatPercent(kpis.profitMargin, 0)}`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              <GlassCard className="p-4">
                <SectionTitle
                  title="Ingresos vs gastos"
                  subtitle="Últimos 12 meses · moneda del negocio"
                  icon={BarChart3}
                  action={
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Ingresos</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Gastos</span>
                    </div>
                  }
                />
                <div className="mt-2">
                  <RevenueExpenseChart data={analyticsData.monthly} currency={venture.currency} />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 border-t border-border/50 pt-2 text-center">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Ingresos mes</p>
                    <p className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(kpis.revenueMonth, venture.currency, true)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Gastos mes</p>
                    <p className="text-sm font-semibold tabular-nums text-red-500">{formatCurrency(kpis.expensesMonth, venture.currency, true)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Utilidad</p>
                    <p className={cn('text-sm font-semibold tabular-nums', kpis.profitMonth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                      {formatCurrency(kpis.profitMonth, venture.currency, true)}
                    </p>
                  </div>
                </div>
              </GlassCard>

              <StageTracker data={data} analytics={analyticsData} onChangeStage={changeStage} onToggleItem={toggleStageItem} />

              <div className="grid gap-4 sm:grid-cols-2">
                <GlassCard className="p-4">
                  <SectionTitle title="Embudo de clientes" subtitle={`Conversión global ${formatPercent(kpis.payingCustomers / Math.max(kpis.totalCustomers, 1), 0)}`} icon={Users} />
                  <div className="mt-3"><FunnelBars steps={analyticsData.funnel} /></div>
                </GlassCard>
                <GlassCard className="p-4">
                  <SectionTitle title="Foco profundo" subtitle={`${formatHours(kpis.focusHoursWeek * 60)} esta semana`} icon={Clock} />
                  <div className="mt-3"><FocusHeatmap data={analyticsData.focusByDay} accent={accent} /></div>
                </GlassCard>
              </div>

              <GlassCard className="p-4">
                <SectionTitle
                  title="Hoy en el negocio"
                  subtitle="Tareas abiertas por fecha de vencimiento"
                  icon={ListTodo}
                  action={<Button size="sm" variant="outline" className="h-7 gap-1 text-[10px]" onClick={() => openTask('normal')}><Plus className="h-3 w-3" /> Nueva</Button>}
                />
                <div className="mt-3 space-y-1.5">
                  {todayOpenTasks.length === 0 && <EmptyState icon={CheckCircle2} title="Sin tareas pendientes" description="Añade la siguiente acción que mueve el negocio." />}
                  {todayOpenTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 rounded-lg border border-border/50 px-2.5 py-1.5">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={async () => {
                          try {
                            await actions.toggleTask(task);
                          } catch (e) {
                            toast.error(errorMessage(e, 'No se pudo actualizar'));
                          }
                        }}
                      />
                      <span className="min-w-0 flex-1 truncate text-xs text-foreground">{task.title}</span>
                      {task.task_type === 'improvement' && <Badge variant="outline" className="text-[9px] text-blue-600 dark:text-blue-400">Mejora</Badge>}
                      {task.due_date && (
                        <span className={cn('flex items-center gap-1 text-[10px]', task.due_date < todayISO() ? 'text-red-500' : 'text-muted-foreground')}>
                          <Calendar className="h-3 w-3" /> {formatDateShort(task.due_date)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            <div className="space-y-4 lg:col-span-4">
              <GlassCard className="p-4">
                <SectionTitle title="Runway" subtitle="Meses de caja al ritmo actual" icon={Wallet} />
                <div className="mt-2"><RunwayGauge months={kpis.runwayMonths} cash={kpis.cashBalance} currency={venture.currency} /></div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-muted/40 py-1.5">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Burn</p>
                    <p className="text-xs font-semibold tabular-nums">{formatCurrency(kpis.burnRate, venture.currency, true)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 py-1.5">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Net burn</p>
                    <p className={cn('text-xs font-semibold tabular-nums', kpis.netBurn > 0 ? 'text-red-500' : 'text-emerald-600')}>{formatCurrency(kpis.netBurn, venture.currency, true)}</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <SectionTitle title="Gastos del mes" subtitle="Por categoría" icon={BarChart3} />
                <div className="mt-3"><ExpenseDonut data={analyticsData.expensesByCategory} currency={venture.currency} /></div>
              </GlassCard>

              <GlassCard className="p-4">
                <SectionTitle title="Salud del negocio" subtitle="4 dimensiones, 100 puntos" icon={Gauge} />
                <HealthRadar breakdown={analyticsData.healthBreakdown} />
              </GlassCard>

              <NextBestActions actions={actionsList} onAction={(nextTab) => setTab(nextTab as TabId)} />
            </div>
          </div>
        </div>
      )}

      {tab === 'finance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Ingresos del mes" value={formatCurrency(kpis.revenueMonth, venture.currency, true)} delta={kpis.growthMoM} icon={TrendingUp} accent="#22c55e" spark={monthlySpark} />
            <KpiCard label="Gastos del mes" value={formatCurrency(kpis.expensesMonth, venture.currency, true)} icon={TrendingDown} accent="#ef4444" hint={`burn ${formatCurrency(kpis.burnRate, venture.currency, true)}`} />
            <KpiCard label="Utilidad" value={formatCurrency(kpis.profitMonth, venture.currency, true)} delta={kpis.profitMargin} icon={DollarSign} accent={kpis.profitMonth >= 0 ? '#22c55e' : '#ef4444'} hint={`margen ${formatPercent(kpis.profitMargin, 0)}`} />
            <KpiCard label="MRR" value={formatCurrency(kpis.mrr, venture.currency, true)} icon={Wallet} accent="#3b82f6" hint={`ARPU ${formatCurrency(kpis.arpu, venture.currency, true)}`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <GlassCard className="p-4 lg:col-span-8">
              <SectionTitle title="Flujo de caja" subtitle="Ingresos, gastos y utilidad de los últimos 12 meses" icon={BarChart3} />
              <div className="mt-2"><RevenueExpenseChart data={analyticsData.monthly} currency={venture.currency} /></div>
            </GlassCard>
            <div className="space-y-4 lg:col-span-4">
              <GlassCard className="p-4">
                <SectionTitle title="Runway" subtitle={`Caja: ${formatCurrency(kpis.cashBalance, venture.currency)}`} icon={Wallet} />
                <RunwayGauge months={kpis.runwayMonths} cash={kpis.cashBalance} currency={venture.currency} />
                <Button variant="outline" size="sm" className="mt-2 w-full text-[10px]" onClick={() => setVentureOpen(true)}>
                  Actualizar caja
                </Button>
              </GlassCard>
              <GlassCard className="p-4">
                <SectionTitle title="Gastos por categoría" subtitle="Mes actual" icon={BarChart3} />
                <div className="mt-2"><ExpenseDonut data={analyticsData.expensesByCategory} currency={venture.currency} /></div>
              </GlassCard>
            </div>
          </div>

          <GlassCard className="p-4">
            <SectionTitle
              title="Movimientos"
              subtitle={`${movements.length} registros`}
              icon={ListTodo}
              action={
                <div className="flex flex-wrap items-center gap-1.5">
                  <select className="h-7 rounded-md border border-input bg-background px-2 text-[10px]" value={movementFilter} onChange={(e) => setMovementFilter(e.target.value as typeof movementFilter)}>
                    <option value="all">Todos</option>
                    <option value="income">Ingresos</option>
                    <option value="expense">Gastos</option>
                  </select>
                  <Button size="sm" className="h-7 gap-1 text-[10px]" style={{ background: accent, color: '#fff' }} onClick={() => openMovement('income')}>
                    <Plus className="h-3 w-3" /> Ingreso
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-[10px]" onClick={() => openMovement('expense')}>
                    <Plus className="h-3 w-3" /> Gasto
                  </Button>
                </div>
              }
            />
            <div className="mt-3 divide-y divide-border/50">
              {movements.length === 0 && <EmptyState icon={Wallet} title="Sin movimientos" description="Registra tu primer ingreso o gasto para activar las métricas financieras." />}
              {movements.map((row) => (
                <div key={`${row.kind}-${row.id}`} className="flex items-center gap-3 border-b border-border/40 py-2 last:border-0">
                  <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', row.kind === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500')}>
                    {row.kind === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{row.description}</p>
                    <p className="text-[10px] text-muted-foreground">{row.category} · {formatDate(row.date)}</p>
                  </div>
                  <span className={cn('text-xs font-semibold tabular-nums', row.kind === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                    {row.kind === 'income' ? '+' : '−'}{formatCurrency(row.amount, row.currency)}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeMovement(row.kind, row.id)}>
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {tab === 'customers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <KpiCard label="Leads" value={analyticsData.funnel[0]?.count || 0} icon={Users} accent="#94a3b8" />
            <KpiCard label="En prueba" value={analyticsData.funnel[3]?.count || 0} icon={Clock} accent="#06b6d4" />
            <KpiCard label="Pagan" value={kpis.payingCustomers} icon={CheckCircle2} accent="#22c55e" />
            <KpiCard label="Churn mensual" value={formatPercent(kpis.churnRate, 1)} icon={TrendingDown} accent="#ef4444" />
            <KpiCard label="ARPU" value={formatCurrency(kpis.arpu, venture.currency, true)} icon={DollarSign} accent="#f59e0b" hint={`LTV ${formatCurrency(kpis.ltv, venture.currency, true)}`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <GlassCard className="p-4 lg:col-span-7">
              <SectionTitle
                title="Embudo"
                subtitle="De lead a cliente pago"
                icon={Users}
                action={<Button size="sm" className="h-7 gap-1 text-[10px]" style={{ background: accent, color: '#fff' }} onClick={() => openCustomer()}><Plus className="h-3 w-3" /> Cliente</Button>}
              />
              <div className="mt-4"><FunnelBars steps={analyticsData.funnel} /></div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-center">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Conversión</p>
                  <p className="text-sm font-semibold tabular-nums">{formatPercent(kpis.payingCustomers / Math.max(kpis.totalCustomers, 1), 0)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">LTV:CAC</p>
                  <p className="text-sm font-semibold tabular-nums">{kpis.cac > 0 ? (kpis.ltv / kpis.cac).toFixed(1) : '—'}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Nuevos mes</p>
                  <p className="text-sm font-semibold tabular-nums">{kpis.newCustomersMonth}</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4 lg:col-span-5">
              <SectionTitle title="Cohortes" subtitle="Salud de la base de clientes" icon={BarChart3} />
              <div className="mt-3 space-y-2">
                {CUSTOMER_STATUS_META.map((status) => {
                  const count = data.customers.filter((c) => c.status === status.key).length;
                  const total = Math.max(data.customers.length, 1);
                  return (
                    <div key={status.key}>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">{status.label}</span>
                        <span className="tabular-nums">{count}</span>
                      </div>
                      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${(count / total) * 100}%`, background: status.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-[10px] text-muted-foreground">
                Retención estimada: <span className="font-semibold text-foreground">{formatPercent(kpis.payingCustomers / Math.max(kpis.payingCustomers + data.customers.filter((c) => c.status === 'churned').length, 1), 0)}</span>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-4">
            <SectionTitle title="Clientes" subtitle={`${data.customers.length} contactos`} icon={Users} />
            <div className="mt-3 overflow-x-auto">
              {data.customers.length === 0 ? (
                <EmptyState icon={Users} title="Sin clientes todavía" description="Añade tu primer lead y muévelo por el embudo." action={<Button size="sm" onClick={() => openCustomer()}><Plus className="mr-1 h-3.5 w-3.5" /> Añadir lead</Button>} />
              ) : (
                <table className="w-full min-w-[640px] text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-[9px] uppercase tracking-wider text-muted-foreground">
                      <th className="py-1.5 pr-2">Cliente</th>
                      <th className="px-2 py-1.5">Estado</th>
                      <th className="px-2 py-1.5">Segmento</th>
                      <th className="px-2 py-1.5">Plan</th>
                      <th className="px-2 py-1.5 text-right">MRR</th>
                      <th className="px-2 py-1.5">Desde</th>
                      <th className="px-2 py-1.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.customers.map((customer) => (
                      <tr key={customer.id} className="border-b border-border/40 last:border-0">
                        <td className="py-2 pr-2">
                          <p className="font-medium text-foreground">{customer.name}</p>
                          {customer.email && <p className="text-[10px] text-muted-foreground">{customer.email}</p>}
                        </td>
                        <td className="px-2 py-2">
                          <select
                            className="h-7 rounded-md border border-input bg-background px-1.5 text-[10px]"
                            value={customer.status}
                            onChange={async (e) => {
                              const status = e.target.value as CustomerStatus;
                              try {
                                await actions.updateCustomer(customer.id, { status, churned_at: status === 'churned' ? todayISO() : null });
                              } catch (err) {
                                toast.error(errorMessage(err, 'No se pudo actualizar'));
                              }
                            }}
                          >
                            {CUSTOMER_STATUS_META.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">{customer.segment || '—'}</td>
                        <td className="px-2 py-2 text-muted-foreground">{customer.plan || '—'}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(customer.mrr, customer.currency, true)}</td>
                        <td className="px-2 py-2 text-muted-foreground">{formatDateShort(customer.started_at)}</td>
                        <td className="px-2 py-2">
                          <div className="flex justify-end gap-0.5">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openCustomer(customer)}><Edit3 className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeCustomer(customer.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {tab === 'metrics' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Métricas del negocio</h2>
              <p className="text-xs text-muted-foreground">Snapshots manuales para ver tendencia real, no solo el último dato.</p>
            </div>
            <Button size="sm" className="gap-1.5" style={{ background: accent, color: '#fff' }} onClick={() => openMetric()}>
              <Plus className="h-3.5 w-3.5" /> Registrar métrica
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {METRIC_CATALOG.slice(0, 8).map((metric) => {
              const rows = metricHistory(data, metric.key);
              const latest = latestMetric(metric.key);
              return (
                <button
                  key={metric.key}
                  type="button"
                  onClick={() => setSelectedMetric(metric.key)}
                  className={cn(
                    'rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5',
                    selectedMetric === metric.key ? 'border-foreground/25 bg-card shadow-sm' : 'border-border/60 bg-card/50',
                  )}
                >
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{metric.label}</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">
                    {latest === undefined ? '—' : formatNumber(latest)}
                    <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">{metric.unit === '%' ? '%' : ''}</span>
                  </p>
                  {rows.length > 1 ? <Sparkline values={rows.map((r) => r.value)} color={accent} height={24} /> : <div className="mt-2 text-[9px] text-muted-foreground">Sin historial</div>}
                </button>
              );
            })}
          </div>

          <GlassCard className="p-4">
            <SectionTitle
              title={METRIC_CATALOG.find((m) => m.key === selectedMetric)?.label || selectedMetric}
              subtitle={`Evolución · unidad ${metricUnit(selectedMetric)}`}
              icon={LineChart}
              action={<Button size="sm" variant="outline" className="h-7 gap-1 text-[10px]" onClick={() => openMetric()}><Plus className="h-3 w-3" /> Añadir</Button>}
            />
            <div className="mt-3">
              {metricHistory(data, selectedMetric).length > 0 ? (
                <MetricLine data={metricHistory(data, selectedMetric)} unit={metricUnit(selectedMetric)} color={accent} />
              ) : (
                <EmptyState icon={LineChart} title="Sin datos para esta métrica" description="Registra el primer snapshot y empieza a ver la tendencia." />
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <SectionTitle title="Últimos registros" subtitle="Historial de snapshots" icon={Clock} />
            <div className="mt-2 space-y-1">
              {data.metrics.slice(0, 12).map((metric) => (
                <div key={metric.id} className="flex items-center gap-2 border-b border-border/40 py-1.5 text-xs last:border-0">
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{METRIC_CATALOG.find((m) => m.key === metric.metric_key)?.label || metric.metric_key}</span>
                  <span className="font-medium tabular-nums">{formatNumber(metric.value)}{metric.unit === '%' ? '%' : ''}</span>
                  <span className="w-16 text-right text-[10px] text-muted-foreground">{formatDateShort(metric.period_date)}</span>
                </div>
              ))}
              {data.metrics.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">Aún no hay métricas registradas.</p>}
            </div>
          </GlassCard>
        </div>
      )}

      {tab === 'product' && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <GlassCard className="p-4">
              <SectionTitle
                title="Backlog del producto"
                subtitle={`${kpis.openTasks} abiertas · ${kpis.overdueTasks} vencidas · ${kpis.completedTasks} completadas`}
                icon={ListTodo}
                action={
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-[10px]" onClick={() => openTask('improvement')}><SparklesIcon /> Mejora</Button>
                    <Button size="sm" className="h-7 gap-1 text-[10px]" style={{ background: accent, color: '#fff' }} onClick={() => openTask('normal')}><Plus className="h-3 w-3" /> Tarea</Button>
                  </div>
                }
              />
              <div className="mt-3 flex gap-1 overflow-x-auto">
                {[
                  { key: 'open', label: 'Abiertas' },
                  { key: 'overdue', label: 'Vencidas' },
                  { key: 'done', label: 'Completadas' },
                  { key: 'all', label: 'Todas' },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setProductFilter(filter.key as typeof productFilter)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors',
                      productFilter === filter.key ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                {filteredTasks(data.tasks, productFilter).map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    accent={accent}
                    onToggle={async () => {
                      try { await actions.toggleTask(task); } catch (e) { toast.error(errorMessage(e, 'No se pudo actualizar')); }
                    }}
                    onEdit={() => openTask(task.task_type, task)}
                    onDelete={() => removeTask(task.id)}
                    onAddSubtask={async (title) => {
                      try { await actions.addSubtask(task.id, title); } catch (e) { toast.error(errorMessage(e, 'No se pudo añadir')); }
                    }}
                    onToggleSubtask={async (subtask) => {
                      try { await actions.toggleSubtask(subtask); } catch (e) { toast.error(errorMessage(e, 'No se pudo actualizar')); }
                    }}
                    onDeleteSubtask={async (id) => {
                      try { await actions.deleteSubtask(id); } catch (e) { toast.error(errorMessage(e, 'No se pudo eliminar')); }
                    }}
                  />
                ))}
                {filteredTasks(data.tasks, productFilter).length === 0 && (
                  <EmptyState icon={ListTodo} title="Nada por aquí" description="Cambia el filtro o crea la siguiente acción." />
                )}
              </div>
            </GlassCard>
          </div>

          <div className="space-y-4 lg:col-span-4">
            <GlassCard className="p-4">
              <SectionTitle title="Objetivos" subtitle={`${data.goals.filter((g) => g.completed).length}/${data.goals.length} completados`} icon={Target} />
              <GoalSection data={data} actions={actions} />
            </GlassCard>

            <GlassCard className="p-4">
              <SectionTitle title="Throughput" subtitle="Tareas creadas vs completadas por semana" icon={BarChart3} />
              <ThroughputChart data={analyticsData.weeklyThroughput} />
            </GlassCard>
          </div>
        </div>
      )}

      {tab === 'experiments' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Experimentos</h2>
              <p className="text-xs text-muted-foreground">Hipótesis → ejecución → aprendizaje. Sin experimentos no hay crecimiento.</p>
            </div>
            <Button size="sm" className="gap-1.5" style={{ background: accent, color: '#fff' }} onClick={() => openExperiment()}>
              <Plus className="h-3.5 w-3.5" /> Nuevo experimento
            </Button>
          </div>

          {data.experiments.length === 0 ? (
            <GlassCard className="p-6">
              <EmptyState icon={FlaskConical} title="Sin experimentos" description="Empieza con una hipótesis pequeña y medible esta semana." action={<Button size="sm" onClick={() => openExperiment()}><Plus className="mr-1 h-3.5 w-3.5" /> Crear experimento</Button>} />
            </GlassCard>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(['running', 'planned', 'done', 'discarded'] as const).map((status) => {
                const items = data.experiments.filter((e) => e.status === status);
                const statusMeta = {
                  running: { label: 'En curso', color: '#0ea5e9' },
                  planned: { label: 'Planificados', color: '#94a3b8' },
                  done: { label: 'Terminados', color: '#22c55e' },
                  discarded: { label: 'Descartados', color: '#ef4444' },
                }[status];
                return (
                  <GlassCard key={status} className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-1.5 text-xs font-semibold">
                        <span className="h-2 w-2 rounded-full" style={{ background: statusMeta.color }} />
                        {statusMeta.label}
                      </h3>
                      <Badge variant="secondary" className="text-[9px]">{items.length}</Badge>
                    </div>
                    <div className="mt-2 space-y-2">
                      {items.length === 0 && <p className="py-3 text-center text-[10px] text-muted-foreground">Vacío</p>}
                      {items.map((experiment) => (
                        <div key={experiment.id} className="rounded-lg border border-border/50 bg-background/40 p-2.5">
                          <p className="text-xs font-medium leading-snug text-foreground">{experiment.hypothesis}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[9px] text-muted-foreground">
                            {experiment.channel && <span className="rounded bg-muted px-1.5 py-0.5">{experiment.channel}</span>}
                            {experiment.cost > 0 && <span>{formatCurrency(experiment.cost, experiment.currency, true)}</span>}
                            {experiment.start_date && <span>{formatDateShort(experiment.start_date)}</span>}
                          </div>
                          {experiment.result && <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">Resultado: {experiment.result}</p>}
                          {experiment.learning && <p className="mt-0.5 line-clamp-2 text-[10px] text-emerald-700 dark:text-emerald-400">Aprendizaje: {experiment.learning}</p>}
                          <div className="mt-2 flex items-center justify-between">
                            <select
                              className="h-6 rounded border border-input bg-background px-1 text-[9px]"
                              value={experiment.status}
                              onChange={async (e) => {
                                try { await actions.updateExperiment(experiment.id, { status: e.target.value as Experiment['status'] }); }
                                catch (err) { toast.error(errorMessage(err, 'No se pudo actualizar')); }
                              }}
                            >
                              <option value="planned">Planificado</option>
                              <option value="running">En curso</option>
                              <option value="done">Terminado</option>
                              <option value="discarded">Descartado</option>
                            </select>
                            <div className="flex gap-0.5">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openExperiment(experiment)}><Edit3 className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeExperiment(experiment.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'review' && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <GlassCard className="p-4">
              <SectionTitle
                title="Revisión semanal"
                subtitle="El ritual de 10 minutos que mantiene el rumbo"
                icon={Gauge}
                action={<Button size="sm" className="h-7 gap-1 text-[10px]" style={{ background: accent, color: '#fff' }} onClick={() => openReview()}><Plus className="h-3 w-3" /> Nueva revisión</Button>}
              />
              {data.reviews.length === 0 ? (
                <EmptyState icon={Gauge} title="Aún no hay revisiones" description="Cierra la semana con wins, bloqueos y foco. Es lo que separa ejecutar de improvisar." action={<Button size="sm" onClick={() => openReview()}>Hacer revisión</Button>} />
              ) : (
                <div className="mt-3 space-y-3">
                  {data.reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-border/60 bg-background/40 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Semana del {formatDate(review.week_start)}</span>
                        {review.confidence && (
                          <Badge variant={review.confidence >= 7 ? 'default' : 'secondary'} className="text-[9px]">
                            Confianza {review.confidence}/10
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        <ReviewBlock label="Ganamos" value={review.wins} />
                        <ReviewBlock label="Bloqueos" value={review.blockers} />
                        <ReviewBlock label="Foco" value={review.next_focus} />
                      </div>
                      {(review.mrr_snapshot !== null || review.users_snapshot !== null) && (
                        <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground">
                          {review.mrr_snapshot !== null && <span>MRR: {formatCurrency(review.mrr_snapshot, venture.currency)}</span>}
                          {review.users_snapshot !== null && <span>Usuarios: {review.users_snapshot}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          <div className="space-y-4 lg:col-span-4">
            <GlassCard className="p-4">
              <SectionTitle title="Ritmo de la semana" subtitle="Tu pulso actual" icon={Clock} />
              <div className="mt-3 space-y-3">
                <PulseRow label="Foco profundo" value={`${formatHours(kpis.focusHoursWeek * 60)}`} percent={Math.min(100, (kpis.focusHoursWeek / 10) * 100)} color={accent} />
                <PulseRow label="Tareas cerradas" value={`${kpis.completedTasks}/${kpis.totalTasks}`} percent={kpis.totalTasks ? (kpis.completedTasks / kpis.totalTasks) * 100 : 0} color="#22c55e" />
                <PulseRow label="Criterios de etapa" value={`${analyticsData.stageProgress.percent}%`} percent={analyticsData.stageProgress.percent} color={meta.color} />
                <PulseRow label="Salud del negocio" value={`${kpis.healthScore}/100`} percent={kpis.healthScore} color={kpis.healthScore >= 70 ? '#22c55e' : kpis.healthScore >= 40 ? '#f59e0b' : '#ef4444'} />
              </div>
            </GlassCard>

            <NextBestActions actions={actionsList} onAction={(nextTab) => setTab(nextTab as TabId)} />
          </div>
        </div>
      )}

      {/* Diálogos */}
      <MovementDialog
        open={movementOpen}
        onOpenChange={setMovementOpen}
        ventureId={venture.id}
        kind={movementKind}
        baseCurrency={venture.currency}
        defaultRate={defaultRate}
        legacyMode={missingTables.length > 0}
        onSaveIncome={actions.addIncome}
        onSaveExpense={actions.addExpense}
      />

      <CustomerDialog
        open={customerOpen}
        onOpenChange={(open) => { setCustomerOpen(open); if (!open) setEditingCustomer(null); }}
        ventureId={venture.id}
        customer={editingCustomer}
        baseCurrency={venture.currency}
        onSave={async (payload, id) => {
          if (id) await actions.updateCustomer(id, payload);
          else await actions.addCustomer(payload);
        }}
      />

      <ExperimentDialog
        open={experimentOpen}
        onOpenChange={(open) => { setExperimentOpen(open); if (!open) setEditingExperiment(null); }}
        ventureId={venture.id}
        experiment={editingExperiment}
        baseCurrency={venture.currency}
        onSave={async (payload, id) => {
          if (id) await actions.updateExperiment(id, payload);
          else await actions.addExperiment(payload);
        }}
      />

      <MetricDialog open={metricOpen} onOpenChange={setMetricOpen} ventureId={venture.id} onSave={actions.saveMetric} />

      <ReviewDialog open={reviewOpen} onOpenChange={setReviewOpen} ventureId={venture.id} onSave={actions.saveReview} />

      <VentureDialog
        open={ventureOpen}
        onOpenChange={setVentureOpen}
        venture={venture}
        onCreate={actions.createVenture}
        onUpdate={actions.updateVenture}
      />

      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Editar' : 'Nueva'} {taskType === 'improvement' ? 'mejora' : 'tarea'}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <Input placeholder="Título" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} autoFocus />
            <Textarea rows={2} placeholder="Descripción (opcional)" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
            <div>
              <label className="text-[11px] text-muted-foreground">Fecha de vencimiento</label>
              <Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
            </div>
            <Button className="w-full" onClick={saveTask}>{editingTask ? 'Guardar' : 'Crear'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

function SparklesIcon() {
  return <Rocket className="h-3 w-3" />;
}

function filteredTasks(tasks: EntrepreneurshipTask[], filter: 'all' | 'open' | 'overdue' | 'done') {
  const today = todayISO();
  const list = tasks.filter((task) => {
    if (filter === 'open') return !task.completed;
    if (filter === 'done') return task.completed;
    if (filter === 'overdue') return !task.completed && task.due_date && task.due_date < today;
    return true;
  });
  return list.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return b.created_at.localeCompare(a.created_at);
  });
}

function TaskRow({
  task,
  accent,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: {
  task: EntrepreneurshipTask;
  accent: string;
  onToggle: () => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
  onAddSubtask: (title: string) => Promise<void>;
  onToggleSubtask: (subtask: Subtask) => Promise<void>;
  onDeleteSubtask: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState('');
  const done = task.subtasks.filter((s) => s.completed).length;
  const overdue = !task.completed && task.due_date && task.due_date < todayISO();

  return (
    <div className={cn('rounded-xl border border-border/60 transition-opacity', task.completed && 'opacity-60')}>
      <div className="flex items-start gap-2 px-2.5 py-2">
        <Checkbox checked={task.completed} onCheckedChange={onToggle} className="mt-0.5" />
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setExpanded((v) => !v)}>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn('text-xs font-medium text-foreground', task.completed && 'line-through text-muted-foreground')}>{task.title}</span>
            {task.task_type === 'improvement' && <Badge variant="outline" className="text-[8px] text-blue-600 dark:text-blue-400">Mejora</Badge>}
            {task.subtasks.length > 0 && <Badge variant="secondary" className="text-[8px]">{done}/{task.subtasks.length}</Badge>}
            {overdue && <Badge variant="outline" className="text-[8px] text-red-500">Vencida</Badge>}
          </div>
          {task.description && <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{task.description}</p>}
          {task.due_date && (
            <p className={cn('mt-0.5 flex items-center gap-1 text-[9px]', overdue ? 'text-red-500' : 'text-muted-foreground')}>
              <Calendar className="h-2.5 w-2.5" /> {formatDateShort(task.due_date)}
            </p>
          )}
        </button>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onEdit}><Edit3 className="h-3 w-3 text-muted-foreground" /></Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onDelete}><Trash2 className="h-3 w-3 text-destructive" /></Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setExpanded((v) => !v)}>
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="space-y-1.5 border-t border-border/40 px-3 py-2">
          {task.subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center gap-2 pl-4">
              <Checkbox checked={subtask.completed} onCheckedChange={() => onToggleSubtask(subtask)} className="h-3.5 w-3.5" />
              <span className={cn('flex-1 text-[10px]', subtask.completed && 'line-through text-muted-foreground')}>{subtask.title}</span>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => onDeleteSubtask(subtask.id)}><Trash2 className="h-2.5 w-2.5 text-muted-foreground" /></Button>
            </div>
          ))}
          <div className="flex gap-1.5 pl-4">
            <Input
              className="h-7 text-[10px]"
              placeholder="Subtarea..."
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && subtaskInput.trim()) {
                  await onAddSubtask(subtaskInput.trim());
                  setSubtaskInput('');
                }
              }}
            />
            <Button
              size="sm"
              className="h-7 text-[10px]"
              style={{ background: accent, color: '#fff' }}
              onClick={async () => {
                if (!subtaskInput.trim()) return;
                await onAddSubtask(subtaskInput.trim());
                setSubtaskInput('');
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalSection({ data, actions }: { data: VentureData; actions: ReturnType<typeof useEntrepreneurshipData> }) {
  const [title, setTitle] = useState('');
  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        <Input className="h-8 text-xs" placeholder="Nuevo objetivo..." value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={async (e) => {
          if (e.key === 'Enter' && title.trim()) { await actions.addGoal(data.venture.id, title.trim()); setTitle(''); }
        }} />
        <Button
          size="sm"
          className="h-8"
          onClick={async () => {
            if (!title.trim()) return;
            try { await actions.addGoal(data.venture.id, title.trim()); setTitle(''); }
            catch (e) { toast.error(errorMessage(e, 'No se pudo añadir')); }
          }}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="mt-2 space-y-1.5">
        {data.goals.map((goal) => (
          <div key={goal.id} className={cn('flex items-center gap-2 rounded-lg border border-border/50 px-2 py-1.5', goal.completed && 'opacity-60')}>
            <Checkbox
              checked={goal.completed}
              onCheckedChange={async () => {
                try { await actions.toggleGoal(goal); } catch (e) { toast.error(errorMessage(e, 'No se pudo actualizar')); }
              }}
              className="h-3.5 w-3.5"
            />
            <span className={cn('flex-1 text-[11px]', goal.completed && 'line-through text-muted-foreground')}>{goal.title}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={async () => {
                try { await actions.deleteGoal(goal.id); } catch (e) { toast.error(errorMessage(e, 'No se pudo eliminar')); }
              }}
            >
              <Trash2 className="h-2.5 w-2.5 text-muted-foreground" />
            </Button>
          </div>
        ))}
        {data.goals.length === 0 && <p className="py-2 text-center text-[10px] text-muted-foreground">Sin objetivos. Define el resultado que buscas.</p>}
      </div>
    </div>
  );
}

function ReviewBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 line-clamp-3 text-[10px] leading-snug text-foreground">{value || '—'}</p>
    </div>
  );
}

function PulseRow({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <ProgressBar value={percent} className="mt-1 h-1.5" color={color} />
    </div>
  );
}