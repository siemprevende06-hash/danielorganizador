import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { endOfMonth, format, isThisMonth, startOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CreditCard,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { transactionCategories } from "@/lib/data";
import { useFinance } from "@/hooks/useFinance";
import { cn } from "@/lib/utils";
import {
  EmptyState,
  SectionHeader,
  formatCompact,
  formatCup,
  formatUsdFromCup,
} from "./shared";

const CATEGORY_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e", "#06b6d4"];

function MoneyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <p className="mb-1 font-semibold capitalize text-foreground">{label}</p>
      <p className="text-muted-foreground">
        Balance: <span className="font-semibold text-foreground">{formatCup(Number(payload[0].value))}</span>
      </p>
    </div>
  );
}

function MiniKpi({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone: "blue" | "emerald" | "rose" | "amber";
}) {
  const palette = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  }[tone];

  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg border", palette)}>{icon}</div>
      </div>
      <p className="mt-1.5 text-lg font-bold leading-none tabular-nums text-foreground">{value}</p>
      <p className="mt-1 truncate text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

export function FinanceSummaryCard() {
  const { wallets, transactions, loans, debts, financialGoals, exchangeRate, isLoading } = useFinance();
  const rate = exchangeRate > 0 ? exchangeRate : 360;

  const summary = useMemo(() => {
    const totalBalance = wallets.reduce(
      (sum, wallet) => sum + (wallet.currency === "USD" ? wallet.balance * rate : wallet.balance),
      0,
    );

    const monthlyIncome = transactions
      .filter((transaction) => transaction.type === "income" && isThisMonth(transaction.date) && transaction.categoryId !== "cat-transfer")
      .reduce((sum, transaction) => sum + (transaction.currency === "USD" ? transaction.amount * rate : transaction.amount), 0);

    const monthlyExpenses = transactions
      .filter((transaction) => transaction.type === "expense" && isThisMonth(transaction.date) && transaction.categoryId !== "cat-transfer")
      .reduce((sum, transaction) => sum + (transaction.currency === "USD" ? transaction.amount * rate : transaction.amount), 0);

    const monthlyBalance = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlyBalance / monthlyIncome) * 100 : 0;

    const cashFlow = Array.from({ length: 6 }).map((_, index) => {
      const date = subMonths(new Date(), index);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const balance = transactions
        .filter((transaction) => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= monthStart && transactionDate <= monthEnd && transaction.categoryId !== "cat-transfer";
        })
        .reduce((sum, transaction) => {
          const amount = transaction.currency === "USD" ? transaction.amount * rate : transaction.amount;
          return transaction.type === "income" ? sum + amount : sum - amount;
        }, 0);
      return { month: format(date, "MMM", { locale: es }), balance };
    }).reverse();

    const categories = transactionCategories
      .filter((category) => category.type === "expense")
      .map((category) => {
        const value = transactions
          .filter((transaction) => transaction.categoryId === category.id && isThisMonth(transaction.date))
          .reduce((sum, transaction) => sum + (transaction.currency === "USD" ? transaction.amount * rate : transaction.amount), 0);
        return { name: category.name, value };
      })
      .filter((category) => category.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    const pendingDebts = debts
      .filter((debt) => debt.status !== "paid")
      .reduce((sum, debt) => sum + Math.max(0, (debt.totalAmount || 0) - (debt.paidAmount || 0)), 0);

    const pendingLoans = loans
      .filter((loan) => loan.status !== "paid")
      .reduce((sum, loan) => sum + Math.max(0, (loan.totalAmount || 0) - (loan.paidAmount || 0)), 0);

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance,
      savingsRate,
      cashFlow,
      categories,
      pendingDebts,
      pendingLoans,
      goals: financialGoals.slice(0, 2),
    };
  }, [wallets, transactions, loans, debts, financialGoals, rate]);

  const hasCashFlow = summary.cashFlow.some((point) => point.balance !== 0);

  return (
    <section className="space-y-4">
      <SectionHeader
        icon={<Wallet className="h-4 w-4" />}
        title="Finanzas"
        subtitle="Resumen de tu mes: patrimonio, flujo y gastos"
        action={
          <Link to="/finance" className="text-[10px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
            Ver finanzas →
          </Link>
        }
      />

      <Card className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-xl bg-muted/50" />
              ))}
            </div>
            <div className="h-[180px] animate-pulse rounded-xl bg-muted/40" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MiniKpi
                label="Patrimonio"
                value={formatCup(summary.totalBalance)}
                sub={`≈ ${formatUsdFromCup(summary.totalBalance, rate)} USD · ${wallets.length} billeteras`}
                icon={<Wallet className="h-3.5 w-3.5" />}
                tone="blue"
              />
              <MiniKpi
                label="Ingresos del mes"
                value={formatCup(summary.monthlyIncome)}
                sub={`≈ ${formatUsdFromCup(summary.monthlyIncome, rate)} USD`}
                icon={<ArrowUpRight className="h-3.5 w-3.5" />}
                tone="emerald"
              />
              <MiniKpi
                label="Gastos del mes"
                value={formatCup(summary.monthlyExpenses)}
                sub={`≈ ${formatUsdFromCup(summary.monthlyExpenses, rate)} USD`}
                icon={<ArrowDownRight className="h-3.5 w-3.5" />}
                tone="rose"
              />
              <MiniKpi
                label="Balance del mes"
                value={`${summary.monthlyBalance >= 0 ? "+" : "−"}${formatCup(Math.abs(summary.monthlyBalance))}`}
                sub={`${summary.savingsRate.toFixed(1)}% de tasa de ahorro`}
                icon={summary.monthlyBalance >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                tone={summary.monthlyBalance >= 0 ? "emerald" : "rose"}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="space-y-3">
                <div className="rounded-xl border bg-muted/20 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">Tasa de ahorro</span>
                    <span className={cn("font-bold tabular-nums", summary.savingsRate >= 20 ? "text-emerald-500" : summary.savingsRate >= 0 ? "text-amber-500" : "text-rose-500")}>
                      {summary.savingsRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.max(0, Math.min(100, summary.savingsRate))}
                    className="mt-2 h-2"
                    indicatorClassName={summary.savingsRate >= 20 ? "bg-emerald-500" : summary.savingsRate >= 0 ? "bg-amber-500" : "bg-rose-500"}
                  />
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {summary.savingsRate >= 20
                      ? "Vas bien: estás guardando al menos 20% de tus ingresos."
                      : summary.savingsRate >= 0
                        ? "Puedes mejorar: intenta acercarte al 20% de ahorro."
                        : "Alerta: este mes gastaste más de lo que ingresaste."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border bg-muted/20 p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <CreditCard className="h-3 w-3" /> Deudas
                    </div>
                    <p className="mt-1 text-sm font-bold tabular-nums text-foreground">{formatCup(summary.pendingDebts)}</p>
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Banknote className="h-3 w-3" /> Por cobrar
                    </div>
                    <p className="mt-1 text-sm font-bold tabular-nums text-foreground">{formatCup(summary.pendingLoans)}</p>
                  </div>
                </div>

                {summary.goals.length > 0 ? (
                  <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <PiggyBank className="h-3 w-3" /> Metas financieras
                    </p>
                    {summary.goals.map((goal) => {
                      const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
                      return (
                        <div key={goal.id}>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="truncate text-foreground">{goal.name}</span>
                            <span className="font-semibold tabular-nums text-muted-foreground">{pct}%</span>
                          </div>
                          <Progress value={pct} className="mt-1 h-1.5" indicatorClassName="bg-violet-500" />
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Flujo de caja</h3>
                    <p className="text-[11px] text-muted-foreground">Últimos 6 meses</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium">
                    {formatCup(summary.monthlyBalance)} este mes
                  </Badge>
                </div>
                {hasCashFlow ? (
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={summary.cashFlow} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="financeCashFlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip content={<MoneyTooltip />} cursor={{ stroke: "hsl(var(--border))" }} />
                        <Area
                          type="monotone"
                          dataKey="balance"
                          name="Balance"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fill="url(#financeCashFlow)"
                          dot={{ r: 3, strokeWidth: 0, fill: "#10b981" }}
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState message="Sin movimientos en los últimos 6 meses." />
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Gastos por categoría</h3>
                <span className="text-[10px] text-muted-foreground">Este mes</span>
              </div>
              {summary.categories.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {summary.categories.map((category, index) => {
                    const pct = summary.monthlyExpenses > 0 ? (category.value / summary.monthlyExpenses) * 100 : 0;
                    return (
                      <div key={category.name} className="rounded-lg border bg-muted/20 px-3 py-2">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                            <span className="truncate text-foreground">{category.name}</span>
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums text-foreground">{formatCompact(category.value)}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(100, pct)}%`, background: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState message="Sin gastos registrados este mes." />
              )}
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
