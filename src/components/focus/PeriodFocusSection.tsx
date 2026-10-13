import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PeriodFocusRow, usePeriodFocus, type UsePeriodFocusResult } from '@/hooks/usePeriodFocus';
import {
  FocusPeriodType,
  getAreaLabel,
  getFocusEntityConfig,
  getPeriodTitle,
  getFocusPeriodLabel,
} from '@/lib/periodFocus';
import {
  Check,
  Circle,
  Loader2,
  Plus,
  Target,
  Trash2,
  ArrowDownToLine,
  Star,
  Info,
} from 'lucide-react';
import { FocusEntityPicker } from '@/components/focus/FocusEntityPicker';

interface Props {
  scope: FocusPeriodType;
  anchorDate: Date;
}

function FocusProgress({ focus }: { focus: PeriodFocusRow }) {
  const [data, setData] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    if (focus.entity_type === 'free' || !focus.entity_id) {
      setData(null);
      return;
    }
    let cancelled = false;
    const config = getFocusEntityConfig(focus.entity_type);
    config.resolve(focus.entity_id).then((res) => {
      if (!cancelled && res) setData({ done: res.done, total: res.total });
    });
    return () => {
      cancelled = true;
    };
  }, [focus.entity_type, focus.entity_id]);

  if (!data || data.total <= 0) return null;
  const pct = Math.min(100, Math.round((data.done / data.total) * 100));
  return (
    <div className="mt-2 flex items-center gap-2">
      <Progress value={pct} className="h-1.5 flex-1" />
      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
        {data.done}/{data.total}
      </span>
    </div>
  );
}

function FocusAreaBadge({ areaId }: { areaId?: string | null }) {
  const label = getAreaLabel(areaId);
  if (!label) return null;
  return (
    <Badge variant="secondary" className="text-[10px] font-medium">
      {label}
    </Badge>
  );
}

export function PeriodFocusSectionView({ scope, anchorDate, controller }: Props & { controller: UsePeriodFocusResult }) {
  const { toast } = useToast();
  const {
    primaryFocus,
    secondaryFocuses,
    parentPrimary,
    parentType,
    loading,
    addFocus,
    removeFocus,
    setPrimary,
    toggleDone,
  } = controller;
  const [pickerOpen, setPickerOpen] = useState(false);

  const parentLabel = parentType ? getFocusPeriodLabel(parentType) : '';

  const describeError = (e: unknown): string => {
    const err = e as { message?: string; details?: string; hint?: string; code?: string };
    return [err?.message, err?.code ? `(${err.code})` : null, err?.details, err?.hint]
      .filter(Boolean)
      .join(' · ') || 'Error desconocido';
  };

  const handleAdd = async (input: Parameters<typeof addFocus>[0]) => {
    try {
      await addFocus(input);
    } catch (e) {
      toast({ title: 'No se pudo añadir el foco', description: describeError(e), variant: 'destructive' });
      throw e;
    }
  };

  const handleHeredar = async () => {
    if (!parentPrimary) return;
    const already = [primaryFocus, ...secondaryFocuses].some(
      (f) =>
        f &&
        f.entity_type === parentPrimary.entity_type &&
        f.entity_id &&
        f.entity_id === parentPrimary.entity_id,
    );
    if (already) {
      toast({ title: 'Este foco ya está en el periodo' });
      return;
    }
    try {
      await addFocus({
        entity_type: parentPrimary.entity_type,
        entity_id: parentPrimary.entity_id,
        title: parentPrimary.title,
        area_id: parentPrimary.area_id,
        note: parentPrimary.note,
        is_primary: !primaryFocus,
      });
    } catch (e) {
      toast({ title: 'No se pudo heredar', description: (e as Error)?.message, variant: 'destructive' });
    }
  };

  const renderFocus = (focus: PeriodFocusRow, isPrimary: boolean) => {
    const config = getFocusEntityConfig(focus.entity_type);
    const Icon = config.icon;
    const done = focus.status === 'done';
    return (
      <div
        className={cn(
          'flex items-start gap-3 rounded-lg border p-3 transition-colors',
          isPrimary ? 'border-primary/40 bg-primary/5' : 'bg-card',
          done && 'opacity-70',
        )}
      >
        <button
          type="button"
          onClick={() => toggleDone(focus)}
          className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-primary"
          title={done ? 'Marcar como activo' : 'Marcar como cumplido'}
        >
          {done ? <Check className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {isPrimary && (
              <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
            )}
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className={cn('min-w-0 truncate font-medium', done && 'line-through')}>
              {focus.title}
            </span>
            <FocusAreaBadge areaId={focus.area_id} />
          </div>
          {focus.note && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{focus.note}</p>
          )}
          <FocusProgress focus={focus} />
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {!isPrimary && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              title="Marcar como principal"
              onClick={() => setPrimary(focus.id)}
            >
              <Star className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            title="Eliminar"
            onClick={() => removeFocus(focus.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight">Focus</h2>
          <p className="truncate text-sm text-muted-foreground">
            {getPeriodTitle(scope, anchorDate)}
          </p>
        </div>
      </div>

      {parentPrimary && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/40 p-3">
          <ArrowDownToLine className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {parentLabel} · foco principal
            </p>
            <p className="truncate text-sm font-medium">{parentPrimary.title}</p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={handleHeredar}>
            Heredar
          </Button>
        </div>
      )}

      {primaryFocus ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sí o sí
          </p>
          {renderFocus(primaryFocus, true)}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0" />
          <span>Aún no definiste tu foco principal de este periodo.</span>
        </div>
      )}

      {secondaryFocuses.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            También
          </p>
          <div className="space-y-2">{secondaryFocuses.map((f) => renderFocus(f, false))}</div>
        </div>
      )}

      <Button variant="outline" className="w-full" onClick={() => setPickerOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Añadir foco
      </Button>

      <FocusEntityPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSubmit={handleAdd}
        hasPrimary={!!primaryFocus}
      />
    </div>
  );
}

export function PeriodFocusSection(props: Props) {
  const controller = usePeriodFocus(props.scope, props.anchorDate);
  return <PeriodFocusSectionView {...props} controller={controller} />;
}
