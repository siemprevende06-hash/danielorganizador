import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useImageUpload } from '@/hooks/useImageUpload';
import { toast } from 'sonner';
import { EXPENSE_CATEGORIES, METRIC_CATALOG, STAGE_META, STAGE_ORDER, metricUnit } from '@/lib/entrepreneurship/stages';
import { errorMessage, formatCurrency, todayISO, weekStartISO } from '@/lib/entrepreneurship/formatters';
import type {
  Customer,
  CustomerStatus,
  Expense,
  Experiment,
  ExperimentStatus,
  Income,
  Metric,
  Review,
  Stage,
  Venture,
} from '@/lib/entrepreneurship/types';
import { cn } from '@/lib/utils';

const selectClass =
  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring';

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Movimiento (ingreso / gasto)
// ---------------------------------------------------------------------------

export function MovementDialog({
  open,
  onOpenChange,
  ventureId,
  kind,
  baseCurrency,
  defaultRate,
  legacyMode = false,
  onSaveIncome,
  onSaveExpense,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ventureId: string;
  kind: 'income' | 'expense';
  baseCurrency: 'USD' | 'CUP';
  defaultRate: number;
  legacyMode?: boolean;
  onSaveIncome: (payload: Omit<Income, 'id' | 'created_at'>) => Promise<unknown>;
  onSaveExpense: (payload: Omit<Expense, 'id' | 'created_at'>) => Promise<unknown>;
}) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'CUP'>(baseCurrency);
  const [rate, setRate] = useState(String(defaultRate));
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('operating');
  const [incomeType, setIncomeType] = useState('revenue');
  const [recurring, setRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount('');
    setCurrency(baseCurrency);
    setRate(String(defaultRate));
    setDate(todayISO());
    setDescription('');
    setCategory('operating');
    setIncomeType('revenue');
    setRecurring(false);
  }, [open, baseCurrency, defaultRate]);

  const value = Number(amount) || 0;
  const exchangeRate = currency === baseCurrency ? 1 : Number(rate) || defaultRate;
  const converted =
    currency === baseCurrency
      ? value
      : baseCurrency === 'USD'
        ? value / exchangeRate
        : value * exchangeRate;

  const save = async () => {
    if (value <= 0) {
      toast.error('Introduce un monto válido');
      return;
    }
    setSaving(true);
    try {
      if (kind === 'income') {
        await onSaveIncome({
          entrepreneurship_id: ventureId,
          amount: value,
          description: description.trim() || null,
          income_date: date,
          income_type: incomeType,
          currency,
          exchange_rate: exchangeRate,
          customer_id: null,
        });
      } else {
        await onSaveExpense({
          entrepreneurship_id: ventureId,
          amount: value,
          currency,
          exchange_rate: exchangeRate,
          category,
          expense_kind: 'opex',
          vendor: null,
          description: description.trim() || null,
          expense_date: date,
          recurring,
        });
      }
      toast.success(kind === 'income' ? 'Ingreso registrado' : 'Gasto registrado');
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{kind === 'income' ? 'Registrar ingreso' : 'Registrar gasto'}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monto">
              <Input type="number" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
            </Field>
            <Field label="Moneda">
              <select className={selectClass} value={currency} onChange={(e) => setCurrency(e.target.value as 'USD' | 'CUP')} disabled={legacyMode}>
                <option value="USD">USD</option>
                <option value="CUP">CUP</option>
              </select>
            </Field>
          </div>

          {legacyMode && (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[10px] text-amber-700 dark:text-amber-300">
              Aplica la migración para registrar movimientos en otra moneda y guardar la tasa de cambio.
            </p>
          )}

          {!legacyMode && currency !== baseCurrency && (
            <Field label={`Tasa de cambio (1 USD = ? CUP)`}>
              <Input type="number" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
            </Field>
          )}

          {value > 0 && (
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              Equivale a <span className="font-semibold text-foreground">{formatCurrency(converted, baseCurrency)}</span> en la moneda del negocio.
            </p>
          )}

          <Field label="Fecha">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>

          {kind === 'income' ? (
            <Field label="Tipo">
              <select className={selectClass} value={incomeType} onChange={(e) => setIncomeType(e.target.value)}>
                <option value="revenue">Ingreso por ventas</option>
                <option value="investment">Inversión recibida</option>
                <option value="refund">Reembolso</option>
                <option value="other">Otro</option>
              </select>
            </Field>
          ) : (
            <>
              <Field label="Categoría">
                <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {EXPENSE_CATEGORIES.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="h-4 w-4 rounded border-input" />
                Gasto recurrente (mensual)
              </label>
            </>
          )}

          <Field label="Descripción">
            <Input placeholder="Opcional" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>

          <Button className="w-full" onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {kind === 'income' ? 'Registrar ingreso' : 'Registrar gasto'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------

const CUSTOMER_STATUSES: Array<{ key: CustomerStatus; label: string }> = [
  { key: 'lead', label: 'Lead' },
  { key: 'contacted', label: 'Contactado' },
  { key: 'demo', label: 'Demo' },
  { key: 'trial', label: 'Prueba' },
  { key: 'paying', label: 'Paga' },
  { key: 'churned', label: 'Baja' },
];

export function CustomerDialog({
  open,
  onOpenChange,
  ventureId,
  customer,
  baseCurrency,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ventureId: string;
  customer?: Customer | null;
  baseCurrency: 'USD' | 'CUP';
  onSave: (payload: Omit<Customer, 'id' | 'created_at' | 'updated_at'>, id?: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [segment, setSegment] = useState('');
  const [status, setStatus] = useState<CustomerStatus>('lead');
  const [plan, setPlan] = useState('');
  const [mrr, setMrr] = useState('');
  const [source, setSource] = useState('');
  const [startedAt, setStartedAt] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(customer?.name || '');
    setEmail(customer?.email || '');
    setSegment(customer?.segment || '');
    setStatus(customer?.status || 'lead');
    setPlan(customer?.plan || '');
    setMrr(customer?.mrr ? String(customer.mrr) : '');
    setSource(customer?.source || '');
    setStartedAt(customer?.started_at || todayISO());
    setNotes(customer?.notes || '');
  }, [open, customer]);

  const save = async () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      await onSave(
        {
          entrepreneurship_id: ventureId,
          name: name.trim(),
          email: email.trim() || null,
          segment: segment.trim() || null,
          status,
          plan: plan.trim() || null,
          mrr: Number(mrr) || 0,
          currency: baseCurrency,
          source: source.trim() || null,
          started_at: startedAt || null,
          churned_at: status === 'churned' ? customer?.churned_at || todayISO() : null,
          notes: notes.trim() || null,
        },
        customer?.id,
      );
      toast.success(customer ? 'Cliente actualizado' : 'Cliente añadido');
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{customer ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Field label="Nombre *" className="col-span-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Segmento">
            <Input placeholder="B2B, PYME..." value={segment} onChange={(e) => setSegment(e.target.value)} />
          </Field>
          <Field label="Estado">
            <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as CustomerStatus)}>
              {CUSTOMER_STATUSES.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Plan">
            <Input placeholder="Starter, Pro..." value={plan} onChange={(e) => setPlan(e.target.value)} />
          </Field>
          <Field label={`MRR (${baseCurrency})`}>
            <Input type="number" inputMode="decimal" placeholder="0" value={mrr} onChange={(e) => setMrr(e.target.value)} />
          </Field>
          <Field label="Canal">
            <Input placeholder="Referido, web..." value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
          <Field label="Cliente desde" className="col-span-2">
            <Input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
          </Field>
          <Field label="Notas" className="col-span-2">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="col-span-2">
            <Button className="w-full" onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {customer ? 'Guardar cambios' : 'Añadir cliente'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Experimento
// ---------------------------------------------------------------------------

export function ExperimentDialog({
  open,
  onOpenChange,
  ventureId,
  experiment,
  baseCurrency,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ventureId: string;
  experiment?: Experiment | null;
  baseCurrency: 'USD' | 'CUP';
  onSave: (payload: Omit<Experiment, 'id' | 'created_at'>, id?: string) => Promise<void>;
}) {
  const [hypothesis, setHypothesis] = useState('');
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState<ExperimentStatus>('planned');
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState('');
  const [cost, setCost] = useState('');
  const [result, setResult] = useState('');
  const [learning, setLearning] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHypothesis(experiment?.hypothesis || '');
    setChannel(experiment?.channel || '');
    setStatus(experiment?.status || 'planned');
    setStartDate(experiment?.start_date || todayISO());
    setEndDate(experiment?.end_date || '');
    setCost(experiment?.cost ? String(experiment.cost) : '');
    setResult(experiment?.result || '');
    setLearning(experiment?.learning || '');
  }, [open, experiment]);

  const save = async () => {
    if (!hypothesis.trim()) {
      toast.error('Escribe la hipótesis');
      return;
    }
    setSaving(true);
    try {
      await onSave(
        {
          entrepreneurship_id: ventureId,
          hypothesis: hypothesis.trim(),
          channel: channel.trim() || null,
          status,
          start_date: startDate || null,
          end_date: endDate || null,
          cost: Number(cost) || 0,
          currency: baseCurrency,
          result: result.trim() || null,
          learning: learning.trim() || null,
        },
        experiment?.id,
      );
      toast.success(experiment ? 'Experimento actualizado' : 'Experimento creado');
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{experiment ? 'Editar experimento' : 'Nuevo experimento'}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Field label="Hipótesis *" className="col-span-2">
            <Textarea
              rows={2}
              placeholder="Si hacemos X, esperamos Y medido por Z"
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
            />
          </Field>
          <Field label="Canal">
            <Input placeholder="LinkedIn, referidos..." value={channel} onChange={(e) => setChannel(e.target.value)} />
          </Field>
          <Field label="Estado">
            <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as ExperimentStatus)}>
              <option value="planned">Planificado</option>
              <option value="running">En curso</option>
              <option value="done">Terminado</option>
              <option value="discarded">Descartado</option>
            </select>
          </Field>
          <Field label="Inicio">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Fin">
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
          <Field label={`Coste (${baseCurrency})`} className="col-span-2">
            <Input type="number" inputMode="decimal" placeholder="0" value={cost} onChange={(e) => setCost(e.target.value)} />
          </Field>
          <Field label="Resultado" className="col-span-2">
            <Textarea rows={2} value={result} onChange={(e) => setResult(e.target.value)} />
          </Field>
          <Field label="Aprendizaje" className="col-span-2">
            <Textarea rows={2} value={learning} onChange={(e) => setLearning(e.target.value)} />
          </Field>
          <div className="col-span-2">
            <Button className="w-full" onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {experiment ? 'Guardar cambios' : 'Crear experimento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Métrica
// ---------------------------------------------------------------------------

export function MetricDialog({
  open,
  onOpenChange,
  ventureId,
  defaultKey,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ventureId: string;
  defaultKey?: string;
  onSave: (payload: Omit<Metric, 'id' | 'created_at'>) => Promise<void>;
}) {
  const [key, setKey] = useState(defaultKey || METRIC_CATALOG[0].key);
  const [value, setValue] = useState('');
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKey(defaultKey || METRIC_CATALOG[0].key);
    setValue('');
    setDate(todayISO());
    setNotes('');
  }, [open, defaultKey]);

  const save = async () => {
    if (value === '' || !Number.isFinite(Number(value))) {
      toast.error('Introduce un valor numérico');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        entrepreneurship_id: ventureId,
        metric_key: key,
        value: Number(value),
        unit: metricUnit(key),
        period_date: date,
        source: 'manual',
        notes: notes.trim() || null,
      });
      toast.success('Métrica guardada');
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar métrica</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-3">
          <Field label="Métrica">
            <select className={selectClass} value={key} onChange={(e) => setKey(e.target.value)}>
              {METRIC_CATALOG.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Valor (${metricUnit(key)})`}>
              <Input type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Notas">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
          </Field>
          <Button className="w-full" onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Guardar métrica
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Revisión semanal
// ---------------------------------------------------------------------------

export function ReviewDialog({
  open,
  onOpenChange,
  ventureId,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ventureId: string;
  onSave: (payload: Omit<Review, 'id' | 'created_at'>) => Promise<void>;
}) {
  const [wins, setWins] = useState('');
  const [blockers, setBlockers] = useState('');
  const [nextFocus, setNextFocus] = useState('');
  const [confidence, setConfidence] = useState('7');
  const [mrr, setMrr] = useState('');
  const [users, setUsers] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setWins('');
    setBlockers('');
    setNextFocus('');
    setConfidence('7');
    setMrr('');
    setUsers('');
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        entrepreneurship_id: ventureId,
        week_start: weekStartISO(),
        wins: wins.trim() || null,
        blockers: blockers.trim() || null,
        next_focus: nextFocus.trim() || null,
        confidence: Number(confidence) || null,
        mrr_snapshot: mrr !== '' ? Number(mrr) : null,
        users_snapshot: users !== '' ? Number(users) : null,
      });
      toast.success('Revisión guardada');
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Revisión semanal · CEO</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-3">
          <Field label="¿Qué ganaste esta semana?">
            <Textarea rows={2} value={wins} onChange={(e) => setWins(e.target.value)} />
          </Field>
          <Field label="¿Qué te bloqueó?">
            <Textarea rows={2} value={blockers} onChange={(e) => setBlockers(e.target.value)} />
          </Field>
          <Field label="Foco de la próxima semana">
            <Textarea rows={2} value={nextFocus} onChange={(e) => setNextFocus(e.target.value)} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Confianza (1-10)">
              <Input type="number" min={1} max={10} value={confidence} onChange={(e) => setConfidence(e.target.value)} />
            </Field>
            <Field label="MRR">
              <Input type="number" value={mrr} onChange={(e) => setMrr(e.target.value)} placeholder="—" />
            </Field>
            <Field label="Usuarios">
              <Input type="number" value={users} onChange={(e) => setUsers(e.target.value)} placeholder="—" />
            </Field>
          </div>
          <Button className="w-full" onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Guardar revisión
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Venture (crear / editar)
// ---------------------------------------------------------------------------

const ACCENTS = ['#3b82f6', '#0ea5e9', '#14b8a6', '#22c55e', '#f59e0b', '#ec4899'];

export function VentureDialog({
  open,
  onOpenChange,
  venture,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venture?: Venture | null;
  onCreate: (payload: Partial<Venture> & { name: string }) => Promise<{ skipped?: string[] } | void>;
  onUpdate: (id: string, payload: Partial<Venture>) => Promise<{ skipped?: string[] } | void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<Stage>('idea');
  const [businessModel, setBusinessModel] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'CUP'>('USD');
  const [accent, setAccent] = useState(ACCENTS[0]);
  const [cash, setCash] = useState('0');
  const [goal, setGoal] = useState('');
  const [northStarKey, setNorthStarKey] = useState('interviews');
  const [northStarTarget, setNorthStarTarget] = useState('');
  const [startedAt, setStartedAt] = useState(todayISO());
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading } = useImageUpload();

  useEffect(() => {
    if (!open) return;
    setName(venture?.name || '');
    setDescription(venture?.description || '');
    setStage(venture?.stage || 'idea');
    setBusinessModel(venture?.business_model || '');
    setTargetMarket(venture?.target_market || '');
    setCurrency(venture?.currency || 'USD');
    setAccent(venture?.accent_color || ACCENTS[0]);
    setCash(String(venture?.cash_balance ?? 0));
    setGoal(venture?.monthly_goal ? String(venture.monthly_goal) : '');
    setNorthStarKey(venture?.north_star_key || 'interviews');
    setNorthStarTarget(venture?.north_star_target ? String(venture.north_star_target) : '');
    setStartedAt(venture?.started_at || todayISO());
    setCoverImage(venture?.cover_image || null);
    setCoverFile(null);
  }, [open, venture]);

  const save = async () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      let coverUrl = coverImage;
      if (coverFile) {
        const url = await uploadImage(coverFile, 'entrepreneurship');
        if (url) coverUrl = url;
      }
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        cover_image: coverUrl,
        stage,
        business_model: businessModel.trim() || null,
        target_market: targetMarket.trim() || null,
        currency,
        accent_color: accent,
        cash_balance: Number(cash) || 0,
        monthly_goal: goal !== '' ? Number(goal) : null,
        north_star_key: northStarKey || null,
        north_star_target: northStarTarget !== '' ? Number(northStarTarget) : null,
        started_at: startedAt || null,
      };
      if (venture) {
        const result = await onUpdate(venture.id, payload);
        if (result && 'skipped' in result && result.skipped?.length) {
          toast.warning('Se guardó lo básico. Aplica la migración para guardar etapa, moneda, caja y North Star.');
        } else {
          toast.success('Emprendimiento actualizado');
        }
      } else {
        const result = await onCreate(payload);
        if (result && 'skipped' in result && result.skipped?.length) {
          toast.warning('Emprendimiento creado con lo básico. Aplica la migración para guardar etapa, moneda, caja y North Star.');
        } else {
          toast.success('Emprendimiento creado');
        }
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e, 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{venture ? 'Editar emprendimiento' : 'Nuevo emprendimiento'}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Field label="Nombre *" className="col-span-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field label="Descripción" className="col-span-2">
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>

          <div className="col-span-2 flex items-center gap-3 rounded-xl border border-border/60 p-2.5">
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
              {coverFile || coverImage ? (
                <img src={coverFile ? URL.createObjectURL(coverFile) : coverImage!} alt="Portada" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setCoverFile(file);
                }}
              />
              <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="mr-1 h-3.5 w-3.5" />}
                {coverImage || coverFile ? 'Cambiar portada' : 'Subir portada'}
              </Button>
              {(coverImage || coverFile) && (
                <button
                  type="button"
                  className="flex items-center gap-1 text-[10px] text-destructive"
                  onClick={() => {
                    setCoverImage(null);
                    setCoverFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <X className="h-3 w-3" /> Quitar portada
                </button>
              )}
            </div>
          </div>

          <Field label="Etapa">
            <select className={selectClass} value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
              {STAGE_ORDER.map((key) => (
                <option key={key} value={key}>
                  {STAGE_META[key].label}
                </option>
              ))}
              <option value="paused">En pausa</option>
            </select>
          </Field>
          <Field label="Modelo de negocio">
            <Input placeholder="SaaS, servicios..." value={businessModel} onChange={(e) => setBusinessModel(e.target.value)} />
          </Field>
          <Field label="Mercado objetivo">
            <Input placeholder="PYMEs, estudiantes..." value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} />
          </Field>
          <Field label="Moneda base">
            <select className={selectClass} value={currency} onChange={(e) => setCurrency(e.target.value as 'USD' | 'CUP')}>
              <option value="USD">USD</option>
              <option value="CUP">CUP</option>
            </select>
          </Field>
          <Field label="Caja actual">
            <Input type="number" value={cash} onChange={(e) => setCash(e.target.value)} />
          </Field>
          <Field label="Meta mensual de ingresos">
            <Input type="number" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Opcional" />
          </Field>
          <Field label="North Star metric">
            <select className={selectClass} value={northStarKey} onChange={(e) => setNorthStarKey(e.target.value)}>
              {METRIC_CATALOG.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Objetivo North Star">
            <Input type="number" value={northStarTarget} onChange={(e) => setNorthStarTarget(e.target.value)} placeholder="Opcional" />
          </Field>
          <Field label="Fecha de inicio">
            <Input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
          </Field>
          <div className="col-span-2">
            <Label className="text-[11px] text-muted-foreground">Color del proyecto</Label>
            <div className="mt-1 flex items-center gap-2">
              {ACCENTS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccent(color)}
                  className={cn('h-6 w-6 rounded-full border-2 transition-transform', accent === color ? 'scale-110 border-foreground' : 'border-transparent')}
                  style={{ background: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent" />
            </div>
          </div>

          <div className="col-span-2">
            <Button className="w-full" onClick={save} disabled={saving || uploading}>
              {(saving || uploading) && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {venture ? 'Guardar cambios' : 'Crear emprendimiento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}