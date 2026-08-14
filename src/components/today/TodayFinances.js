import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
export function TodayFinances() {
    const [transactions, setTransactions] = useState([]);
    const [wallets, setWallets] = useState([]);
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
        const walletMap = new Map((walletsRes.data || []).map((w) => [w.id, w.name]));
        const mapped = (transRes.data || []).map((t) => ({
            id: t.id,
            description: t.description,
            amount: Number(t.amount),
            type: t.transaction_type,
            wallet_name: walletMap.get(t.wallet_id) || undefined,
        }));
        setTransactions(mapped);
        setWallets((walletsRes.data || []).map((w) => ({
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
        return (_jsx(Card, { children: _jsx(CardContent, { className: "py-6", children: _jsxs("div", { className: "animate-pulse space-y-3", children: [_jsx("div", { className: "h-4 bg-muted rounded w-1/3" }), _jsx("div", { className: "h-8 bg-muted rounded" })] }) }) }));
    }
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(DollarSign, { className: "w-4 h-4" }), "Finanzas del D\u00EDa"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("div", { className: "p-3 rounded-lg bg-muted/50 text-center", children: [_jsxs("div", { className: "flex items-center justify-center gap-1 text-green-500 mb-1", children: [_jsx(TrendingUp, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs font-medium", children: "Ingresos" })] }), _jsxs("p", { className: "text-lg font-bold text-green-600", children: ["+$", totalIncome.toLocaleString()] })] }), _jsxs("div", { className: "p-3 rounded-lg bg-muted/50 text-center", children: [_jsxs("div", { className: "flex items-center justify-center gap-1 text-red-500 mb-1", children: [_jsx(TrendingDown, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs font-medium", children: "Gastos" })] }), _jsxs("p", { className: "text-lg font-bold text-red-600", children: ["-$", totalExpense.toLocaleString()] })] }), _jsxs("div", { className: "p-3 rounded-lg bg-primary/10 text-center", children: [_jsxs("div", { className: "flex items-center justify-center gap-1 text-primary mb-1", children: [_jsx(Wallet, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs font-medium", children: "Neto" })] }), _jsxs("p", { className: `text-lg font-bold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`, children: [netFlow >= 0 ? '+' : '', "$", netFlow.toLocaleString()] })] })] }), transactions.length > 0 ? (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground", children: "Movimientos de hoy:" }), _jsx("div", { className: "space-y-1 max-h-32 overflow-y-auto", children: transactions.slice(0, 5).map((t) => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded-md bg-muted/30", children: [_jsxs("div", { className: "flex items-center gap-2", children: [t.type === 'income' ? (_jsx(ArrowUpRight, { className: "w-4 h-4 text-green-500" })) : (_jsx(ArrowDownRight, { className: "w-4 h-4 text-red-500" })), _jsx("span", { className: "text-sm truncate max-w-[150px]", children: t.description })] }), _jsxs("div", { className: "flex items-center gap-2", children: [t.wallet_name && (_jsx(Badge, { variant: "outline", className: "text-xs", children: t.wallet_name })), _jsxs("span", { className: `text-sm font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`, children: [t.type === 'income' ? '+' : '-', "$", t.amount.toLocaleString()] })] })] }, t.id))) }), transactions.length > 5 && (_jsxs("p", { className: "text-xs text-center text-muted-foreground", children: ["+", transactions.length - 5, " m\u00E1s movimientos"] }))] })) : (_jsx("div", { className: "text-center py-4 text-muted-foreground", children: _jsx("p", { className: "text-sm", children: "No hay movimientos hoy" }) })), _jsxs("div", { className: "pt-2 border-t", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground mb-2", children: "Billeteras:" }), _jsx("div", { className: "flex flex-wrap gap-2", children: wallets.map((wallet) => (_jsxs(Badge, { variant: "secondary", className: "text-xs", children: [wallet.name, ": $", wallet.balance.toLocaleString()] }, wallet.id))) }), _jsxs("div", { className: "flex justify-between items-center mt-2 pt-2 border-t border-dashed", children: [_jsx("span", { className: "text-sm font-medium", children: "Balance Total:" }), _jsxs("span", { className: "text-lg font-bold text-primary", children: ["$", totalBalance.toLocaleString()] })] })] })] })] }));
}
