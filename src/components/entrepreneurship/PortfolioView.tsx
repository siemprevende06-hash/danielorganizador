import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit3,
  Filter,
  Plus,
  Rocket,
  Search,
  Star,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useActiveSelections } from '@/hooks/useActiveSelections';
import { buildAnalytics } from '@/lib/entrepreneurship/metrics';
import { getStageMeta, STAGE_ORDER, STAGE_META } from '@/lib/entrepreneurship/stages';
import { errorMessage, formatCurrency, formatHours, formatMonths, hexWithAlpha, initials } from '@/lib/entrepreneurship/formatters';
import { northStarDisplay } from '@/lib/entrepreneurship/metrics';
import type { Stage, Venture, VentureAnalytics, VentureData } from '@/lib/entrepreneurship/types';
import { EmptyState, GlassCard, HealthRing, KpiCard, ProgressBar, Sparkline, StageChip, SetupBanner } from './ui';
import { VentureDialog } from './forms';
import { cn } from '@/lib/utils';

interface PortfolioViewProps {
  ventures: Venture[];
  byVenture: Record<string, VentureData>;
  loading: boolean;
  missingTables: string[];
  defaultRate: number;
  onCreate: (payload: Partial<Venture> & { name: string }) => Promise<{ skipped?: string[] } | void>;
  onUpdate: (id: string, payload: Partial<Venture>) => Promise<{ skipped?: string[] } | void>;
  onDelete: (id: string) => Promise<void>;
}

function toUsd(value: number, currency: string, rate: number) {
  return currency === 'CUP' ? value / rate : value;
}

export function PortfolioView({
  ventures,
  byVenture,
  loading,
  missingTables,
  defaultRate,
  onCreate,
  onUpdate,
  onDelete,
}: PortfolioViewProps) {
  const navigate = useNavigate();
  const { values: activeIds, toggle: toggleActive } = useActiveSelections('activeEntrepreneurships');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Venture | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Venture | null>(null);
  const [stageFilter, setStageFilter] = useState<'all' | Stage>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'activity' | 'mrr' | 'health' | 'name'>('activity');
  const [showArchived, setShowArchived] = useState(false);

  const analytics = useMemo(() => {
    const map: Record<string, VentureAnalytics> = {};
    ventures.forEach((venture) => {
      const data = byVenture[venture.id];
      if (data) map[venture.id] = buildAnalytics(data, { defaultRate });
    });
    return map;
  }, [ventures, byVenture, defaultRate]);

  const visible = useMemo(() => {
    let list = ventures.filter((v) => (showArchived ? true : !v.archived));
    if (stageFilter !== 'all') list = list.filter((v) => v.stage === stageFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.description || '').toLowerCase().includes(q) ||
          (v.business_model || '').toLowerCase().includes(q),
      );
    }
    if (sort === 'name') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }
    const score = (v: Venture) => {
      const a = analytics[v.id];
      if (!a) return 0;
      if (sort === 'mrr') return toUsd(a.kpis.mrr, v.currency, defaultRate);
      if (sort === 'health') return a.kpis.healthScore;
      return new Date(v.updated_at).getTime();
    };
    return [...list].sort((a, b) => score(b) - score(a));
  }, [ventures, analytics, stageFilter, query, sort, showArchived, defaultRate]);

  const totals = useMemo(() => {
    const active = ventures.filter((v) => !v.archived);
    const rows = active.map((v) => ({ venture: v, a: analytics[v.id] })).filter((x) => x.a);
    const mrr = rows.reduce((sum, x) => sum + toUsd(x.a!.kpis.mrr, x.venture.currency, defaultRate), 0);
    const revenue = rows.reduce((sum, x) => sum + toUsd(x.a!.kpis.revenueMonth, x.venture.currency, defaultRate), 0);
    const customers = rows.reduce((sum, x) => sum + x.a!.kpis.payingCustomers, 0);
    const focus = rows.reduce((sum, x) => sum + x.a!.kpis.focusHoursWeek, 0);
    const withRunway = rows.filter((x) => x.a!.kpis.runwayMonths !== null);
    const runway = withRunway.length
      ? withRunway.reduce((sum, x) => sum + (x.a!.kpis.runwayMonths || 0), 0) / withRunway.length
      : null;
    const health = rows.length ? rows.reduce((sum, x) => sum + x.a!.kpis.healthScore, 0) / rows.length : 0;
    return { mrr, revenue, customers, focus, runway, health, count: active.length };
  }, [ventures, analytics, defaultRate]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ventures.filter((v) => !v.archived).forEach((v) => {
      counts[v.stage] = (counts[v.stage] || 0) + 1;
    });
    return counts;
  }, [ventures]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const runDelete = async () => {
    if (!pendingDelete) return;
    try {
      await onDelete(pendingDelete.id);
      toast.success('Emprendimiento eliminado');
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo eliminar'));
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div
      className="container mx-auto max-w-7xl space-y-5 px-4 pb-24 pt-20"
      style={{ paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 4rem))' }}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Business Command Center</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            <Rocket className="h-7 w-7 text-blue-500" />
            Emprendimientos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totals.count} negocio{totals.count === 1 ? '' : 's'} activo{totals.count === 1 ? '' : 's'} · una sola vista para decidir.
          </p>
        </div>
        <Button className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuevo emprendimiento
        </Button>
      </header>

      <SetupBanner tables={missingTables} />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
          <Skeleton className="col-span-2 h-64 rounded-2xl lg:col-span-4" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
            <KpiCard label="MRR total" value={formatCurrency(totals.mrr, 'USD', true)} icon={TrendingUp} accent="#3b82f6" hint="recurrente mensual" />
            <KpiCard label="Ingresos del mes" value={formatCurrency(totals.revenue, 'USD', true)} icon={DollarSign} accent="#22c55e" hint="negocios activos" />
            <KpiCard
              label="Runway promedio"
              value={totals.runway === null ? 'Sin burn' : formatMonths(totals.runway)}
              icon={Wallet}
              accent={totals.runway !== null && totals.runway < 4 ? '#ef4444' : '#0ea5e9'}
              hint="caja / burn"
            />
            <KpiCard label="Clientes pagos" value={totals.customers} icon={Users} accent="#f59e0b" hint="en todos los negocios" />
            <KpiCard label="Salud media" value={`${Math.round(totals.health)}/100`} icon={CheckCircle2} accent={totals.health >= 70 ? '#22c55e' : totals.health >= 40 ? '#f59e0b' : '#ef4444'} hint="ejecución + mercado" />
            <KpiCard label="Foco esta semana" value={formatHours(totals.focus * 60)} icon={Clock} accent="#ec4899" hint="tiempo profundo" />
          </div>

          {/* Pipeline de etapas */}
          <GlassCard className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" /> Pipeline de etapas
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Dónde está cada negocio y cuántos puedes empujar al siguiente nivel.</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setStageFilter('all')}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors',
                    stageFilter === 'all' ? 'border-foreground/20 bg-foreground text-background' : 'border-border/60 text-muted-foreground hover:text-foreground',
                  )}
                >
                  Todos ({ventures.filter((v) => !v.archived).length})
                </button>
                {STAGE_ORDER.map((stage) => {
                  const meta = STAGE_META[stage];
                  const count = stageCounts[stage] || 0;
                  return (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setStageFilter(stageFilter === stage ? 'all' : stage)}
                      className={cn('rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors', stageFilter === stage ? 'text-white' : 'text-muted-foreground hover:text-foreground')}
                      style={{
                        borderColor: stageFilter === stage ? meta.color : 'hsl(var(--border) / 0.6)',
                        background: stageFilter === stage ? meta.color : 'transparent',
                      }}
                    >
                      {meta.short} {count > 0 ? `· ${count}` : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
              {STAGE_ORDER.map((stage) => {
                const count = stageCounts[stage] || 0;
                if (!count) return null;
                const total = ventures.filter((v) => !v.archived).length || 1;
                return (
                  <div
                    key={stage}
                    className="h-full transition-all"
                    style={{ width: `${(count / total) * 100}%`, background: STAGE_META[stage].color }}
                    title={`${STAGE_META[stage].label}: ${count}`}
                  />
                );
              })}
            </div>
          </GlassCard>

          {/* Toolbar */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar negocio..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
              >
                <option value="activity">Actividad reciente</option>
                <option value="mrr">Mayor MRR</option>
                <option value="health">Mejor salud</option>
                <option value="name">Nombre</option>
              </select>
              <Button variant={showArchived ? 'secondary' : 'ghost'} size="sm" className="h-9 text-xs" onClick={() => setShowArchived((v) => !v)}>
                Archivados
              </Button>
            </div>
          </div>

          {/* Cards */}
          {visible.length === 0 ? (
            <GlassCard className="p-6">
              <EmptyState
                icon={Briefcase}
                title={ventures.length === 0 ? 'Crea tu primer emprendimiento' : 'No hay negocios con ese filtro'}
                description={
                  ventures.length === 0
                    ? 'Define la idea, asígnale una etapa y empieza a medir ingresos, clientes y foco.'
                    : 'Prueba otro filtro o limpia la búsqueda.'
                }
                action={
                  ventures.length === 0 ? (
                    <Button onClick={openCreate} className="gap-1.5">
                      <Plus className="h-4 w-4" /> Crear emprendimiento
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => { setStageFilter('all'); setQuery(''); }}>
                      Limpiar filtros
                    </Button>
                  )
                }
              />
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((venture) => {
                const a = analytics[venture.id];
                if (!a) return null;
                const meta = getStageMeta(venture.stage);
                const accent = venture.accent_color || meta.color;
                const isActive = activeIds.includes(venture.id);
                return (
                  <GlassCard
                    key={venture.id}
                    className={cn(
                      'group cursor-pointer overflow-hidden transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg',
                      isActive && 'ring-1 ring-primary/40',
                      venture.archived && 'opacity-60',
                    )}
                    onClick={() => navigate(`/entrepreneurship/${venture.id}`)}
                  >
                    <div className="relative h-24 w-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${hexWithAlpha(accent, 0.3)}, ${hexWithAlpha(meta.color, 0.12)}, transparent)` }}>
                      {venture.cover_image ? (
                        <img src={venture.cover_image} alt={venture.name} className="absolute inset-0 h-full w-full object-cover opacity-80" />
                      ) : (
                        <div className="absolute right-4 top-3 text-4xl opacity-60">{initials(venture.name)}</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                      <div className="absolute left-3 top-3 flex items-center gap-1">
                        <StageChip label={meta.label} color={meta.color} />
                        {venture.archived && <Badge variant="outline" className="text-[9px]">Archivado</Badge>}
                      </div>
                      <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title={isActive ? 'Quitar de activos' : 'Marcar como activo'}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActive(venture.id);
                          }}
                        >
                          <Star className={cn('h-3.5 w-3.5', isActive ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(venture);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete(venture);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 p-4 pt-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-foreground">{venture.name}</h3>
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {venture.description || venture.business_model || 'Sin descripción'}
                          </p>
                        </div>
                        <HealthRing score={a.kpis.healthScore} size={52} />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="uppercase tracking-wider text-muted-foreground">{a.northStar.label}</span>
                          <span className="font-medium tabular-nums text-foreground">
                            {northStarDisplay(a.northStar, venture.currency)}
                            {a.northStar.target ? <span className="text-muted-foreground"> / {a.northStar.target}</span> : null}
                          </span>
                        </div>
                        <ProgressBar value={a.northStar.percent} className="mt-1" color={accent} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">MRR</div>
                          <div className="font-semibold tabular-nums">{formatCurrency(a.kpis.mrr, venture.currency, true)}</div>
                        </div>
                        <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Clientes</div>
                          <div className="font-semibold tabular-nums">{a.kpis.payingCustomers}</div>
                        </div>
                        <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Runway</div>
                          <div className={cn('font-semibold tabular-nums', a.kpis.runwayMonths !== null && a.kpis.runwayMonths < 4 && 'text-red-500')}>
                            {a.kpis.runwayMonths === null ? 'Sin burn' : formatMonths(a.kpis.runwayMonths)}
                          </div>
                        </div>
                        <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Etapa</div>
                          <div className="font-semibold tabular-nums">{a.stageProgress.percent}%</div>
                        </div>
                      </div>

                      <Sparkline values={a.monthly.slice(-7).map((m) => m.revenue)} color={accent} height={30} />

                      <div className="flex items-center justify-between border-t border-border/50 pt-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatHours(a.kpis.focusHoursWeek * 60)} foco
                        </span>
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          Abrir dashboard <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </>
      )}

      <VentureDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        venture={editing}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán sus tareas, ingresos, gastos, clientes y métricas. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={runDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}