import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TodayTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  wallet_name?: string;
}

interface WalletSummary {
  id: string;
  name: string;
  balance: number;
}

export function TodayFinances() {
  const [transactions, setTransactions] = useState<TodayTransaction[]>([]);
  const [wallets, setWallets] = useState<WalletSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const [transRes, walletsRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('id, description, amount, transaction_type, wallet_id')
        .gte('transaction_date', `${today}T00:00:00`)
        .lte('transaction_date', `${today}T23:59:59`)
        .order('created_at', { ascending: false }),
      supabase
        .from('wallets')
        .select('id, name, balance'),
    ]);

    const walletMap = new Map(
      (walletsRes.data || []).map((w: any) => [w.id, w.name])
    );

    const mapped: TodayTransaction[] = (transRes.data || []).map((t: any) => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      type: t.transaction_type as 'income' | 'expense',
      wallet_name: walletMap.get(t.wallet_id) || undefined,
    }));

    setTransactions(mapped);
    setWallets((walletsRes.data || []).map((w: any) => ({
      id: w.id,
      name: w.name,
      balance: Number(w.balance),
    })));
    setLoading(false);
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netFlow = totalIncome - totalExpense;
  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Finanzas del Día
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Overview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Ingresos</span>
            </div>
            <p className="text-lg font-bold text-green-600">
              +${totalIncome.toLocaleString()}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs font-medium">Gastos</span>
            </div>
            <p className="text-lg font-bold text-red-600">
              -${totalExpense.toLocaleString()}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-primary/10 text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Wallet className="w-4 h-4" />
              <span className="text-xs font-medium">Neto</span>
            </div>
            <p className={`text-lg font-bold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netFlow >= 0 ? '+' : ''}${netFlow.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Today's Transactions */}
        {transactions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Movimientos de hoy:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                  <div className="flex items-center gap-2">
                    {t.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm truncate max-w-[150px]">{t.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.wallet_name && (
                      <Badge variant="outline" className="text-xs">
                        {t.wallet_name}
                      </Badge>
                    )}
                    <span className={`text-sm font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {transactions.length > 5 && (
              <p className="text-xs text-center text-muted-foreground">
                +{transactions.length - 5} más movimientos
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No hay movimientos hoy</p>
          </div>
        )}

        {/* Wallet Balances */}
        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">Billeteras:</p>
          <div className="flex flex-wrap gap-2">
            {wallets.map((wallet) => (
              <Badge key={wallet.id} variant="secondary" className="text-xs">
                {wallet.name}: ${wallet.balance.toLocaleString()}
              </Badge>
            ))}
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed">
            <span className="text-sm font-medium">Balance Total:</span>
            <span className="text-lg font-bold text-primary">${totalBalance.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
