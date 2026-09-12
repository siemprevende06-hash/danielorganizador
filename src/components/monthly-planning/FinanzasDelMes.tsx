import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, PiggyBank, Wallet, ArrowUp, ArrowDown } from 'lucide-react';
import { useMonthlyFinance } from '@/hooks/useMonthlyFinance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function fmt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function DeltaStat({ value }: { value: number }) {
  const delta = value - 0;
  return (
    <span className={cn('text-[10px] font-bold ml-1', delta >= 0 ? 'text-emerald-600' : 'text-destructive')}>
      {delta >= 0 ? <ArrowUp className="h-3 w-3 inline" /> : <ArrowDown className="h-3 w-3 inline" />}
      {Math.abs(Math.round(delta))}
    </span>
  );
}

export function FinanzasDelMes({ month }: { month: Date }) {
  const { totals, prevTotals, currencyTotals, loading } = useMonthlyFinance(month);
  const currencies = Object.keys(currencyTotals);

  const stat = (label: string, value: number, prev: number, icon: React.ReactNode, tone: string) => (
    <div className="rounded-2xl border border-border/50 bg-white/70 dark:bg-zinc-950/60 backdrop-blur-sm p-3.5 flex items-start gap-3">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', tone)}>{icon}</div>
      <div className="min-w-0">
        <p className="text-lg font-bold tabular-nums leading-tight truncate">{fmt(value)}</p>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        {!loading && (
          <p className="text-[9px] text-muted-foreground/70 truncate">
            vs mes pasado: {fmt(prev)}
            {Math.abs(value - prev) > 0.001 && <DeltaStat value={value - prev} />}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold">Finanzas del mes</h2>
          </div>
          <Badge variant="outline" className="text-[10px] capitalize">
            {format(month, 'MMMM yyyy', { locale: es })}
          </Badge>
        </div>

        {!loading && totals.income === 0 && totals.expenses === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6 rounded-xl border border-dashed border-border/60">
            Sin transacciones registradas este mes.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stat('Ingresos', totals.income, prevTotals.income, <TrendingUp className="h-4 w-4" />, 'bg-emerald-500/10 text-emerald-600')}
              {stat('Gastos', totals.expenses, prevTotals.expenses, <TrendingDown className="h-4 w-4" />, 'bg-rose-500/10 text-rose-600')}
              {stat('Ahorro', totals.savings, prevTotals.savings, <PiggyBank className="h-4 w-4" />, 'bg-sky-500/10 text-sky-600')}
            </div>

            {currencies.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {currencies.map(cur => (
                  <Badge key={cur} variant="secondary" className="text-[10px] tabular-nums">
                    {cur}: +{fmt(currencyTotals[cur].income)} / -{fmt(currencyTotals[cur].expenses)}
                    <b className={cn('ml-1', currencyTotals[cur].savings >= 0 ? 'text-emerald-600' : 'text-destructive')}>
                      = {fmt(currencyTotals[cur].savings)}
                    </b>
                  </Badge>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}