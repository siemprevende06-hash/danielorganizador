import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";

export interface MonthFinanceTotals {
  income: number;
  expenses: number;
  savings: number;
}

export interface MonthFinanceData {
  totals: MonthFinanceTotals;
  prevTotals: MonthFinanceTotals;
  currencyTotals: Record<string, MonthFinanceTotals>;
  loading: boolean;
}

const emptyTotals = (): MonthFinanceTotals => ({ income: 0, expenses: 0, savings: 0 });

export function useMonthlyFinance(month: Date): MonthFinanceData {
  const [data, setData] = useState<MonthFinanceData>({
    totals: emptyTotals(),
    prevTotals: emptyTotals(),
    currencyTotals: {},
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const prev = subMonths(start, 1);
      const prevEnd = endOfMonth(prev);

      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');
      const prevStartStr = format(prev, 'yyyy-MM-dd');
      const prevEndStr = format(prevEnd, 'yyyy-MM-dd');

      const [walletRes, txRes, prevTxRes] = await Promise.all([
        supabase.from('wallets').select('id, name, currency'),
        supabase
          .from('transactions')
          .select('amount, transaction_type, wallet_id')
          .gte('transaction_date', startStr)
          .lte('transaction_date', endStr),
        supabase
          .from('transactions')
          .select('amount, transaction_type, wallet_id')
          .gte('transaction_date', prevStartStr)
          .lte('transaction_date', prevEndStr),
      ]);

      if (cancelled) return;

      type TxRow = NonNullable<typeof txRes.data>[number];

      const wallets = (walletRes.data || []).map((w) => ({
        id: w.id,
        currency: (w as unknown as { currency?: string | null }).currency ?? null,
      }));
      const walletCurrency = new Map<string, string>();
      wallets.forEach(w => walletCurrency.set(w.id, w.currency === 'USD' ? 'USD' : 'CUP'));

      const currencyTotals: Record<string, MonthFinanceTotals> = {};
      const totals = emptyTotals();
      const accumulate = (rows: TxRow[], into: Record<string, MonthFinanceTotals>) => {
        rows.forEach(t => {
          const cur = walletCurrency.get(t.wallet_id || '') || 'CUP';
          if (!into[cur]) into[cur] = emptyTotals();
          if (t.transaction_type === 'income') into[cur].income += Number(t.amount) || 0;
          else if (t.transaction_type === 'expense') into[cur].expenses += Number(t.amount) || 0;
        });
      };

      accumulate(txRes.data || [], currencyTotals);
      Object.values(currencyTotals).forEach(c => {
        c.savings = c.income - c.expenses;
        totals.income += c.income;
        totals.expenses += c.expenses;
      });
      totals.savings = totals.income - totals.expenses;

      const prevTotals = emptyTotals();
      (prevTxRes.data || []).forEach(t => {
        if (t.transaction_type === 'income') prevTotals.income += Number(t.amount) || 0;
        else if (t.transaction_type === 'expense') prevTotals.expenses += Number(t.amount) || 0;
      });
      prevTotals.savings = prevTotals.income - prevTotals.expenses;

      setData({ totals, prevTotals, currencyTotals, loading: false });
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [month]);

  return data;
}