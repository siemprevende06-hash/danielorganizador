import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { wallets as initialWallets, transactionCategories } from '@/lib/data';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Edit, Coins, Wallet as WalletIcon, ArrowRightLeft, Download, Upload, DollarSign, Trash2, Plus, TrendingUp as TrendingUpIcon, LandPlot, BadgePercent, Scale, Target, Shield, Home, Gamepad2, BookOpen, PiggyBank, Heart, GraduationCap, Sparkles, Plane, Coffee, Banknote, CreditCard, Settings, X, Car, } from 'lucide-react';
import { format, isThisMonth, startOfMonth, subMonths, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useFinance } from '@/hooks/useFinance';
import { supabase } from '@/integrations/supabase/client';
import { DataTable } from '@/components/finance/data-table';
import { getTransactionColumns } from '@/components/finance/transaction-columns';
import { getLoanColumns } from '@/components/finance/loan-columns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { MonthlySummaryChart, CategorySpendChart, WalletDistributionChart, CashFlowTrendChart, DistributionBagChart, TrendIndicator, formatCurrency, } from '@/components/finance/charts';
const transactionSchema = z.object({
    description: z.string().min(1, 'La descripción es obligatoria.'),
    amount: z.coerce.number().positive('El monto debe ser positivo.'),
    currency: z.enum(['USD', 'CUP']),
    date: z.date({ required_error: 'La fecha es obligatoria.' }),
    walletId: z.string({ required_error: 'Selecciona una billetera.' }).min(1, 'Selecciona una billetera.'),
    categoryId: z.string({ required_error: 'Selecciona una categoría.' }).min(1, 'Selecciona una categoría.'),
    type: z.enum(['income', 'expense'], { required_error: 'Selecciona un tipo.' }),
});
const walletSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio."),
    balance: z.coerce.number(),
    currency: z.enum(['USD', 'CUP']),
});
const walletCreateSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio."),
    balance: z.coerce.number().default(0),
    icon: z.string().min(1, "Selecciona un icono."),
    currency: z.enum(['USD', 'CUP']),
});
const transferSchema = z.object({
    amount: z.coerce.number().positive("El monto debe ser positivo."),
    currency: z.enum(['USD', 'CUP']),
    fromWalletId: z.string().min(1, "Selecciona una billetera de origen."),
    toWalletId: z.string().min(1, "Selecciona una billetera de destino."),
}).refine(data => data.fromWalletId !== data.toWalletId, {
    message: "La billetera de origen y destino no pueden ser la misma.",
    path: ["toWalletId"],
});
const distributionSchema = z.object({
    amount: z.coerce.number().positive("El monto debe ser positivo."),
    currency: z.enum(['USD', 'CUP']),
    toWalletId: z.string().min(1, "Selecciona una billetera de destino."),
});
const loanSchema = z.object({
    person: z.string().min(1, 'El nombre de la persona es obligatorio.'),
    description: z.string().min(1, 'La descripción es obligatoria.'),
    amount: z.coerce.number().positive('El monto debe ser positivo.'),
    currency: z.enum(['USD', 'CUP']),
    walletId: z.string().min(1, 'Selecciona una billetera.'),
});
const loanPaymentSchema = z.object({
    amount: z.coerce.number().positive("El monto debe ser positivo."),
    currency: z.enum(['USD', 'CUP']),
});
const debtSchema = z.object({
    person: z.string().min(1, 'El nombre del acreedor es obligatorio.'),
    description: z.string().min(1, 'La descripción es obligatoria.'),
    amount: z.coerce.number().positive('El monto debe ser positivo.'),
    currency: z.enum(['USD', 'CUP']),
    walletId: z.string().min(1, 'Selecciona una billetera.'),
    dueDate: z.date().optional(),
});
const debtPaymentSchema = z.object({
    amount: z.coerce.number().positive("El monto debe ser positivo."),
    currency: z.enum(['USD', 'CUP']),
});
const bagSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio.'),
    percentage: z.coerce.number().min(0.1, 'Debe ser mayor a 0').max(100, 'No puede exceder 100'),
    description: z.string().optional(),
    icon: z.string().min(1, 'Selecciona un icono.'),
    color: z.string().min(1, 'Selecciona un color.'),
    balance: z.coerce.number().optional(),
});
const goalSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio.'),
    targetAmount: z.coerce.number().positive('La meta debe ser positiva.'),
    icon: z.string().min(1, 'Selecciona un icono.'),
    color: z.string().min(1, 'Selecciona un color.'),
});
const budgetSchema = z.object({
    categoryId: z.string(),
    amount: z.coerce.number().min(0),
});
const defaultBudgetLimits = {
    'cat-food': 5000, 'cat-transport': 2000, 'cat-entertainment': 3000,
    'cat-health': 2000, 'cat-shopping': 3000, 'cat-education': 2000,
    'cat-personal': 1500, 'cat-coffee': 1000, 'cat-travel': 5000,
};
function CurrencyDisplay({ usd, exchangeRate, large = false }) {
    const cup = usd * exchangeRate;
    return (_jsxs("div", { className: "flex flex-col", children: [_jsxs("span", { className: cn("font-semibold tracking-tight text-zinc-900 dark:text-zinc-100", large ? "text-lg sm:text-xl" : "text-sm"), children: [cup.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), " CUP"] }), _jsxs("span", { className: "text-[10px] text-zinc-400 dark:text-zinc-500", children: ["$", usd.toFixed(2), " USD"] })] }));
}
function BudgetCategoryForm({ availableCategories, onCancel, onSubmit, }) {
    const [selectedCat, setSelectedCat] = useState('');
    const [budgetAmount, setBudgetAmount] = useState(1000);
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx(Label, { children: "Categor\u00EDa" }), _jsxs(Select, { onValueChange: setSelectedCat, value: selectedCat, children: [_jsx(SelectTrigger, { className: "rounded-xl mt-1", children: _jsx(SelectValue, { placeholder: "Selecciona..." }) }), _jsx(SelectContent, { children: availableCategories.length === 0 ? (_jsx(SelectItem, { value: "__none__", disabled: true, children: "Todas las categor\u00EDas ya tienen presupuesto" })) : availableCategories.map(c => (_jsx(SelectItem, { value: c.id, children: c.name }, c.id))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "L\u00EDmite Mensual (CUP)" }), _jsx(Input, { type: "number", value: budgetAmount, onChange: (e) => setBudgetAmount(parseFloat(e.target.value) || 0), className: "rounded-xl mt-1" })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", className: "rounded-full", onClick: onCancel, children: "Cancelar" }), _jsx(Button, { className: "rounded-full", disabled: !selectedCat, onClick: () => onSubmit(selectedCat, budgetAmount), children: "Agregar" })] })] }));
}
export default function Finance() {
    const { wallets, transactions, loans, debts, distributionBags, financialGoals, exchangeRate, setExchangeRate, isLoading, setWallets, setTransactions, setLoans, setDebts, setDistributionBags, addTransaction, deleteTransaction, updateWalletBalance, updateWallet, addWallet, deleteWallet, addLoan, updateLoan, addDebt, updateDebt, deleteDebt, addDistributionBag, updateDistributionBag, deleteDistributionBag, addFinancialGoal, updateFinancialGoal, deleteFinancialGoal, } = useFinance();
    const toUSD = (amount, currency) => currency === 'CUP' ? amount / exchangeRate : amount;
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);
    const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
    const [isDistributionDialogOpen, setIsDistributionDialogOpen] = useState(false);
    const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);
    const [isDebtDialogOpen, setIsDebtDialogOpen] = useState(false);
    const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
    const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
    const [transactionToRevert, setTransactionToRevert] = useState(null);
    const [walletToEdit, setWalletToEdit] = useState(null);
    const [isLoanPaymentDialogOpen, setIsLoanPaymentDialogOpen] = useState(false);
    const [loanToPay, setLoanToPay] = useState(null);
    const [isDebtPaymentDialogOpen, setIsDebtPaymentDialogOpen] = useState(false);
    const [debtToPay, setDebtToPay] = useState(null);
    const [isBagDialogOpen, setIsBagDialogOpen] = useState(false);
    const [editingBag, setEditingBag] = useState(null);
    const [bagToDelete, setBagToDelete] = useState(null);
    const [isDistributeIncomeDialogOpen, setIsDistributeIncomeDialogOpen] = useState(false);
    const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [goalToDelete, setGoalToDelete] = useState(null);
    const [goalToDeposit, setGoalToDeposit] = useState(null);
    const [depositAmount, setDepositAmount] = useState(0);
    const [depositWalletId, setDepositWalletId] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [isWalletCreateDialogOpen, setIsWalletCreateDialogOpen] = useState(false);
    const [walletToDelete, setWalletToDelete] = useState(null);
    const [isBudgetCategoryDialogOpen, setIsBudgetCategoryDialogOpen] = useState(false);
    const [budgetLimits, setBudgetLimits] = useState(() => {
        try {
            const stored = localStorage.getItem('finance_budgetLimits');
            return stored ? JSON.parse(stored) : defaultBudgetLimits;
        }
        catch {
            return defaultBudgetLimits;
        }
    });
    useEffect(() => { setIsClient(true); }, []);
    // Load budget limits from Supabase (text_sections) on mount
    useEffect(() => {
        (async () => {
            try {
                const { data } = await supabase
                    .from('text_sections')
                    .select('content')
                    .eq('section_key', 'finance_budgetLimits')
                    .maybeSingle();
                if (data?.content) {
                    setBudgetLimits(data.content);
                }
            }
            catch { }
        })();
    }, []);
    // Persist budget limits to Supabase + local
    useEffect(() => {
        if (!isClient)
            return;
        try {
            localStorage.setItem('finance_budgetLimits', JSON.stringify(budgetLimits));
        }
        catch { }
        (async () => {
            try {
                const { data: existing } = await supabase
                    .from('text_sections')
                    .select('id')
                    .eq('section_key', 'finance_budgetLimits')
                    .maybeSingle();
                if (existing) {
                    await supabase.from('text_sections').update({ content: budgetLimits, updated_at: new Date().toISOString() }).eq('id', existing.id);
                }
                else {
                    await supabase.from('text_sections').insert({ section_key: 'finance_budgetLimits', content: budgetLimits });
                }
            }
            catch { }
        })();
    }, [budgetLimits, isClient]);
    const transactionForm = useForm({
        resolver: zodResolver(transactionSchema),
        defaultValues: { description: '', amount: 0, currency: 'CUP', walletId: '', categoryId: '', type: 'expense' },
    });
    const walletForm = useForm({
        resolver: zodResolver(walletSchema),
        defaultValues: { name: '', balance: 0, currency: 'CUP' },
    });
    const transferForm = useForm({
        resolver: zodResolver(transferSchema),
        defaultValues: { amount: 0, currency: 'CUP', fromWalletId: '', toWalletId: '' },
    });
    const distributionForm = useForm({
        resolver: zodResolver(distributionSchema),
        defaultValues: { amount: 0, currency: 'CUP', toWalletId: '' },
    });
    const loanForm = useForm({
        resolver: zodResolver(loanSchema),
        defaultValues: { person: '', description: '', amount: 0, currency: 'CUP', walletId: '' },
    });
    const loanPaymentForm = useForm({
        resolver: zodResolver(loanPaymentSchema),
        defaultValues: { amount: 0, currency: 'CUP' },
    });
    const debtForm = useForm({
        resolver: zodResolver(debtSchema),
        defaultValues: { person: '', description: '', amount: 0, currency: 'CUP', walletId: '' },
    });
    const debtPaymentForm = useForm({
        resolver: zodResolver(debtPaymentSchema),
        defaultValues: { amount: 0, currency: 'CUP' },
    });
    const bagForm = useForm({
        resolver: zodResolver(bagSchema),
        defaultValues: { name: '', percentage: 10, description: '', icon: 'Target', color: 'blue', balance: 0 },
    });
    const goalForm = useForm({
        resolver: zodResolver(goalSchema),
        defaultValues: { name: '', targetAmount: 0, icon: 'Target', color: 'blue' },
    });
    const walletCreateForm = useForm({
        resolver: zodResolver(walletCreateSchema),
        defaultValues: { name: '', balance: 0, icon: 'Wallet', currency: 'CUP' },
    });
    const transactionType = transactionForm.watch('type');
    const totalBalance = useMemo(() => wallets.reduce((acc, w) => acc + w.balance, 0), [wallets]);
    const monthlyIncome = useMemo(() => transactions.filter(t => t.type === 'income' && isThisMonth(t.date) && t.categoryId !== 'cat-transfer')
        .reduce((acc, t) => acc + t.amount, 0), [transactions]);
    const monthlyExpenses = useMemo(() => transactions.filter(t => t.type === 'expense' && isThisMonth(t.date) && t.categoryId !== 'cat-transfer')
        .reduce((acc, t) => acc + t.amount, 0), [transactions]);
    const monthlyBalance = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
    const lastMonthIncome = useMemo(() => {
        const lastMonth = subMonths(new Date(), 1);
        return transactions.filter(t => t.type === 'income' && t.categoryId !== 'cat-transfer' &&
            new Date(t.date) >= startOfMonth(lastMonth) && new Date(t.date) <= endOfMonth(lastMonth))
            .reduce((acc, t) => acc + t.amount, 0);
    }, [transactions]);
    const lastMonthExpenses = useMemo(() => {
        const lastMonth = subMonths(new Date(), 1);
        return transactions.filter(t => t.type === 'expense' && t.categoryId !== 'cat-transfer' &&
            new Date(t.date) >= startOfMonth(lastMonth) && new Date(t.date) <= endOfMonth(lastMonth))
            .reduce((acc, t) => acc + t.amount, 0);
    }, [transactions]);
    const incomeChange = lastMonthIncome > 0 ? ((monthlyIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
    const expenseChange = lastMonthExpenses > 0 ? ((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;
    const undistributedIncomes = useMemo(() => transactions.filter(t => t.type === 'income' && !t.distributed && t.categoryId !== 'cat-transfer'), [transactions]);
    const chartData = useMemo(() => {
        const monthlySummary = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);
            const monthTransactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate >= monthStart && tDate <= monthEnd && t.categoryId !== 'cat-transfer';
            });
            const income = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
            const expense = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
            return { month: format(date, 'MMM', { locale: es }), income: income * exchangeRate, expense: expense * exchangeRate };
        }).reverse();
        const categorySpend = transactionCategories
            .filter(cat => cat.type === 'expense')
            .map(cat => {
            const total = transactions.filter(t => t.categoryId === cat.id && isThisMonth(new Date(t.date)))
                .reduce((acc, t) => acc + t.amount, 0);
            return { name: cat.name, value: total * exchangeRate };
        })
            .filter(d => d.value > 0);
        const walletDistribution = wallets.map(wallet => ({
            name: wallet.name,
            value: wallet.balance * exchangeRate,
        }));
        const cashFlowTrend = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), i);
            const upTo = endOfMonth(date);
            const balance = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate <= upTo && t.categoryId !== 'cat-transfer';
            }).reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
            return { month: format(date, 'MMM', { locale: es }), balance: balance * exchangeRate };
        }).reverse();
        return { monthlySummary, categorySpend, walletDistribution, cashFlowTrend };
    }, [transactions, wallets, exchangeRate]);
    const budgetData = useMemo(() => {
        return transactionCategories.filter(c => c.type === 'expense').map(cat => {
            const spent = transactions.filter(t => t.categoryId === cat.id && isThisMonth(new Date(t.date)))
                .reduce((acc, t) => acc + t.amount * exchangeRate, 0);
            const limit = budgetLimits[cat.id] || 0;
            return { category: cat, spent, limit, percentage: limit > 0 ? (spent / limit) * 100 : 0 };
        }).filter(d => d.limit > 0);
    }, [transactions, exchangeRate, budgetLimits]);
    const incomes = useMemo(() => transactions.filter(t => t.type === 'income' && t.categoryId !== 'cat-transfer'), [transactions]);
    const expenses = useMemo(() => transactions.filter(t => t.type === 'expense' && t.categoryId !== 'cat-transfer'), [transactions]);
    const transfers = useMemo(() => transactions.filter(t => t.categoryId === 'cat-transfer'), [transactions]);
    const getWalletIcon = useCallback((walletId) => {
        const wallet = initialWallets.find(w => w.id === walletId);
        return wallet?.icon || WalletIcon;
    }, []);
    const iconMap = {
        Shield, TrendingUp: TrendingUpIcon, Home, Gamepad2, BookOpen, PiggyBank, Heart,
        GraduationCap, Sparkles, DollarSign, Plane, Coffee, Target, Wallet: WalletIcon,
        Banknote, CreditCard, Car,
    };
    const bagColorMap = {
        rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-500', bar: 'bg-rose-500' },
        blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-500', bar: 'bg-blue-500' },
        amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-500', bar: 'bg-amber-500' },
        green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', badge: 'bg-green-500', bar: 'bg-green-500' },
        violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400', badge: 'bg-violet-500', bar: 'bg-violet-500' },
        orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-500', bar: 'bg-orange-500' },
    };
    // Handlers
    const handleOpenTransactionDialog = () => {
        transactionForm.reset({ description: '', amount: 0, currency: 'CUP', date: new Date(), walletId: '', categoryId: '', type: 'expense' });
        setIsTransactionDialogOpen(true);
    };
    const onTransactionSubmit = async (data) => {
        const wallet = wallets.find(w => w.id === data.walletId);
        if (!wallet)
            return;
        const amountUSD = toUSD(data.amount, data.currency);
        if (data.type === 'expense' && wallet.balance < amountUSD) {
            toast({ title: "Saldo insuficiente", description: "La billetera no tiene suficiente balance.", variant: "destructive" });
            return;
        }
        const newBalance = data.type === 'expense' ? wallet.balance - amountUSD : wallet.balance + amountUSD;
        await addTransaction({ description: data.description, amount: amountUSD, date: data.date, walletId: data.walletId, categoryId: data.categoryId, type: data.type, transferId: undefined, loanId: undefined, distributed: false });
        await updateWalletBalance(data.walletId, newBalance);
        toast({ title: "Transacción registrada", description: `${data.type === 'expense' ? 'Gasto' : 'Ingreso'} de ${data.amount} ${data.currency}` });
        setIsTransactionDialogOpen(false);
        transactionForm.reset();
    };
    const onTransferSubmit = async (data) => {
        const fromWallet = wallets.find(w => w.id === data.fromWalletId);
        const toWallet = wallets.find(w => w.id === data.toWalletId);
        if (!fromWallet || !toWallet)
            return;
        const amountUSD = toUSD(data.amount, data.currency);
        if (fromWallet.balance < amountUSD) {
            toast({ title: "Saldo insuficiente", description: "La billetera de origen no tiene suficiente balance.", variant: "destructive" });
            return;
        }
        const transferId = crypto.randomUUID();
        await addTransaction({
            description: `Traspaso a ${toWallet.name}`, amount: amountUSD,
            date: new Date(), walletId: data.fromWalletId, categoryId: 'cat-transfer', type: 'expense', transferId, distributed: false,
        });
        await addTransaction({
            description: `Traspaso desde ${fromWallet.name}`, amount: amountUSD,
            date: new Date(), walletId: data.toWalletId, categoryId: 'cat-transfer', type: 'income', transferId, distributed: false,
        });
        await updateWalletBalance(data.fromWalletId, fromWallet.balance - amountUSD);
        await updateWalletBalance(data.toWalletId, toWallet.balance + amountUSD);
        toast({ title: "Traspaso realizado", description: `${data.amount} ${data.currency} transferidos` });
        setIsTransferDialogOpen(false);
        transferForm.reset();
    };
    const onLoanSubmit = async (data) => {
        const wallet = wallets.find(w => w.id === data.walletId);
        if (!wallet)
            return;
        const amountUSD = toUSD(data.amount, data.currency);
        if (wallet.balance < amountUSD) {
            toast({ title: "Saldo insuficiente", description: "La billetera no tiene suficiente balance.", variant: "destructive" });
            return;
        }
        await addTransaction({
            description: `Préstamo a ${data.person}: ${data.description}`, amount: amountUSD,
            date: new Date(), walletId: data.walletId, categoryId: 'cat-loan', type: 'expense',
            loanId: crypto.randomUUID(), distributed: false,
        });
        await addLoan({ person: data.person, description: data.description, totalAmount: amountUSD, paidAmount: 0, walletId: data.walletId, date: new Date(), status: 'outstanding' });
        await updateWalletBalance(data.walletId, wallet.balance - amountUSD);
        toast({ title: "Préstamo registrado", description: `Préstamo a ${data.person} por ${data.amount} ${data.currency}` });
        setIsLoanDialogOpen(false);
        loanForm.reset();
    };
    const onDebtSubmit = async (data) => {
        const wallet = wallets.find(w => w.id === data.walletId);
        if (!wallet)
            return;
        const amountUSD = toUSD(data.amount, data.currency);
        await addDebt({ person: data.person, description: data.description, totalAmount: amountUSD, paidAmount: 0, walletId: data.walletId, date: new Date(), dueDate: data.dueDate, status: 'outstanding' });
        toast({ title: "Deuda registrada", description: `Deuda con ${data.person} por ${data.amount} ${data.currency}` });
        setIsDebtDialogOpen(false);
        debtForm.reset();
    };
    const onLoanPaymentSubmit = async (data) => {
        if (!loanToPay)
            return;
        const amountUSD = toUSD(data.amount, data.currency);
        const newPaid = loanToPay.paidAmount + amountUSD;
        const status = newPaid >= loanToPay.totalAmount ? 'paid' : 'outstanding';
        await updateLoan(loanToPay.id, { paidAmount: newPaid, status });
        toast({ title: "Pago registrado", description: `Cobrado ${data.amount} ${data.currency} de ${loanToPay.person}` });
        setIsLoanPaymentDialogOpen(false);
        setLoanToPay(null);
        loanPaymentForm.reset();
    };
    const onDebtPaymentSubmit = async (data) => {
        if (!debtToPay)
            return;
        const wallet = wallets.find(w => w.id === debtToPay.walletId);
        if (!wallet)
            return;
        const amountUSD = toUSD(data.amount, data.currency);
        if (wallet.balance < amountUSD) {
            toast({ title: "Saldo insuficiente", description: "La billetera no tiene suficiente balance.", variant: "destructive" });
            return;
        }
        const newPaid = debtToPay.paidAmount + amountUSD;
        const status = newPaid >= debtToPay.totalAmount ? 'paid' : 'outstanding';
        await updateDebt(debtToPay.id, { paidAmount: newPaid, status });
        await updateWalletBalance(debtToPay.walletId, wallet.balance - amountUSD);
        toast({ title: "Pago registrado", description: `Pagado ${data.amount} ${data.currency} a ${debtToPay.person}` });
        setIsDebtPaymentDialogOpen(false);
        setDebtToPay(null);
        debtPaymentForm.reset();
    };
    const openWalletDialog = (wallet) => {
        setWalletToEdit(wallet);
        walletForm.reset({ name: wallet.name, balance: wallet.balance, currency: 'CUP' });
        setIsWalletDialogOpen(true);
    };
    const onWalletSubmit = async (data) => {
        if (!walletToEdit)
            return;
        await updateWallet(walletToEdit.id, { balance: data.balance });
        toast({ title: "Billetera actualizada", description: `${walletToEdit.name}: ${data.balance} CUP` });
        setIsWalletDialogOpen(false);
        setWalletToEdit(null);
    };
    const openLoanPaymentDialog = (loan) => {
        setLoanToPay(loan);
        loanPaymentForm.reset({ amount: 0, currency: 'CUP' });
        setIsLoanPaymentDialogOpen(true);
    };
    const openDebtPaymentDialog = (debt) => {
        setDebtToPay(debt);
        debtPaymentForm.reset({ amount: 0, currency: 'CUP' });
        setIsDebtPaymentDialogOpen(true);
    };
    const handleRevertTransaction = async () => {
        if (!transactionToRevert)
            return;
        const wallet = wallets.find(w => w.id === transactionToRevert.walletId);
        if (!wallet)
            return;
        const reversalAmount = transactionToRevert.type === 'expense' ? wallet.balance + transactionToRevert.amount : wallet.balance - transactionToRevert.amount;
        await deleteTransaction(transactionToRevert.id);
        await updateWalletBalance(transactionToRevert.walletId, reversalAmount);
        toast({ title: "Transacción revertida", description: `"${transactionToRevert.description}" eliminada` });
        setIsRevertDialogOpen(false);
        setTransactionToRevert(null);
    };
    const handleConfirmDistribution = async () => {
        const ids = undistributedIncomes.map(t => t.id);
        setTransactions(prev => prev.map(t => ids.includes(t.id) ? { ...t, distributed: true } : t));
        toast({ title: "Ingresos distribuidos", description: `${undistributedIncomes.length} ingreso(s) marcados como distribuidos` });
        setIsDistributeIncomeDialogOpen(false);
    };
    const onBagSubmit = async (data) => {
        if (editingBag) {
            await updateDistributionBag(editingBag.id, { name: data.name, percentage: data.percentage, description: data.description, icon: data.icon, color: data.color, balance: data.balance ?? editingBag.balance });
        }
        else {
            await addDistributionBag({ name: data.name, description: data.description || '', percentage: data.percentage, icon: data.icon, color: data.color, balance: 0 });
        }
        setIsBagDialogOpen(false);
        setEditingBag(null);
        bagForm.reset();
    };
    const handleDeleteBag = () => {
        if (!bagToDelete)
            return;
        deleteDistributionBag(bagToDelete.id);
        setBagToDelete(null);
    };
    const onGoalSubmit = async (data) => {
        if (editingGoal) {
            await updateFinancialGoal(editingGoal.id, { name: data.name, targetAmount: data.targetAmount, icon: data.icon, color: data.color });
        }
        else {
            await addFinancialGoal({ name: data.name, targetAmount: data.targetAmount, currentAmount: 0, icon: data.icon, color: data.color, createdAt: new Date() });
        }
        setIsGoalDialogOpen(false);
        setEditingGoal(null);
        goalForm.reset();
    };
    const handleDeleteGoal = () => {
        if (!goalToDelete)
            return;
        deleteFinancialGoal(goalToDelete.id);
        setGoalToDelete(null);
    };
    const handleDepositToGoal = () => {
        if (!goalToDeposit || depositAmount <= 0)
            return;
        if (!depositWalletId) {
            toast({ title: "Selecciona una billetera", description: "Elige de qué billetera saldrá el dinero.", variant: "destructive" });
            return;
        }
        const wallet = wallets.find(w => w.id === depositWalletId);
        if (!wallet) {
            toast({ title: "Billetera no encontrada", variant: "destructive" });
            return;
        }
        const depositUSD = toUSD(depositAmount, 'CUP');
        if (wallet.balance < depositUSD) {
            toast({ title: "Saldo insuficiente", description: `"${wallet.name}" no tiene ${depositAmount.toLocaleString("es-ES")} CUP disponibles.`, variant: "destructive" });
            return;
        }
        const newAmount = goalToDeposit.currentAmount + depositUSD;
        updateFinancialGoal(goalToDeposit.id, { currentAmount: Math.min(newAmount, goalToDeposit.targetAmount) });
        updateWalletBalance(depositWalletId, wallet.balance - depositUSD);
        addTransaction({
            description: `Abono a meta: ${goalToDeposit.name}`,
            amount: depositUSD,
            date: new Date(),
            walletId: depositWalletId,
            categoryId: 'cat-transfer',
            type: 'expense',
            transferId: undefined,
            loanId: undefined,
            distributed: false,
        });
        toast({ title: "Abono registrado", description: `${depositAmount.toLocaleString("es-ES")} CUP para "${goalToDeposit.name}"` });
        setGoalToDeposit(null);
        setDepositAmount(0);
        setDepositWalletId("");
    };
    const onWalletCreateSubmit = async (data) => {
        const newWallet = { id: crypto.randomUUID(), name: data.name, balance: data.balance, icon: iconMap[data.icon] || WalletIcon };
        await addWallet(newWallet);
        toast({ title: "Billetera creada", description: `${data.name} creada con éxito` });
        setIsWalletCreateDialogOpen(false);
        walletCreateForm.reset();
    };
    const handleDeleteWallet = async () => {
        if (!walletToDelete)
            return;
        await deleteWallet(walletToDelete.id);
        toast({ title: "Billetera eliminada", description: `${walletToDelete.name} ha sido eliminada` });
        setWalletToDelete(null);
    };
    const handleRemoveBudgetCategory = (categoryId) => {
        setBudgetLimits(prev => {
            const updated = { ...prev };
            delete updated[categoryId];
            return updated;
        });
    };
    const handleAddBudgetCategory = (categoryId, amount) => {
        setBudgetLimits(prev => ({ ...prev, [categoryId]: amount }));
        setIsBudgetCategoryDialogOpen(false);
        toast({ title: "Presupuesto agregado", description: "Categoría agregada al presupuesto mensual" });
    };
    if (!isClient)
        return null;
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center", children: _jsxs("div", { className: "text-center space-y-3", children: [_jsx("div", { className: "animate-spin h-8 w-8 border-4 border-zinc-300 border-t-zinc-600 rounded-full mx-auto" }), _jsx("p", { className: "text-sm text-zinc-500", children: "Cargando datos financieros..." })] }) }));
    }
    const renderDebtColumns = () => [
        {
            accessorKey: "date", header: "Fecha",
            cell: ({ row }) => _jsx("span", { className: "text-sm text-zinc-500 dark:text-zinc-400", children: format(new Date(row.original.date), "dd MMM yyyy", { locale: es }) }),
        },
        {
            accessorKey: "person", header: "Acreedor",
            cell: ({ row }) => _jsx("span", { className: "text-sm font-medium text-zinc-900 dark:text-zinc-100", children: row.original.person }),
        },
        {
            accessorKey: "description", header: "Descripción",
            cell: ({ row }) => _jsx("span", { className: "text-sm text-zinc-500 dark:text-zinc-400", children: row.original.description }),
        },
        {
            accessorKey: "progress", header: "Progreso",
            cell: ({ row }) => {
                const progress = (row.original.paidAmount / row.original.totalAmount) * 100;
                return (_jsxs("div", { className: "flex items-center gap-3 min-w-[140px]", children: [_jsx(Progress, { value: progress, className: "h-1.5 rounded-full flex-1 bg-zinc-200 dark:bg-zinc-950" }), _jsxs("span", { className: "text-xs font-medium text-zinc-500 w-10 text-right", children: [Math.round(progress), "%"] })] }));
            },
        },
        {
            accessorKey: "remaining", header: "Pendiente",
            cell: ({ row }) => {
                const remaining = row.original.totalAmount - row.original.paidAmount;
                return (_jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-sm font-semibold text-red-500", children: [(remaining * exchangeRate).toLocaleString("es-ES", { minimumFractionDigits: 2 }), " CUP"] }), _jsxs("div", { className: "text-xs text-zinc-400", children: ["$", remaining.toFixed(2), " USD"] })] }));
            },
        },
        {
            accessorKey: "status", header: "Estado",
            cell: ({ row }) => (_jsx(Badge, { className: `rounded-full text-xs px-3 py-0.5 font-medium ${row.original.status === "paid"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"}`, children: row.original.status === "paid" ? "Pagado" : "Pendiente" })),
        },
        {
            id: "actions",
            cell: ({ row }) => row.original.status === "outstanding" ? (_jsx("div", { className: "flex justify-end", children: _jsxs(Button, { size: "sm", variant: "outline", className: "rounded-full h-8 text-xs px-3", onClick: () => openDebtPaymentDialog(row.original), children: [_jsx(DollarSign, { className: "h-3 w-3 mr-1" }), " Pagar"] }) })) : null,
        },
    ];
    const handleRevertClick = (transaction) => {
        setTransactionToRevert(transaction);
        setIsRevertDialogOpen(true);
    };
    const transactionColumns = getTransactionColumns(initialWallets, transactionCategories, exchangeRate, handleRevertClick);
    const loanColumns = getLoanColumns(exchangeRate, openLoanPaymentDialog);
    return (_jsx("div", { className: "min-h-screen bg-zinc-50 dark:bg-zinc-950", children: _jsxs("div", { className: "max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2", children: [_jsxs("header", { className: "flex items-center gap-3 flex-wrap", children: [_jsx("h1", { className: "text-base sm:text-lg md:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100", children: "Finanzas" }), _jsx("p", { className: "text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 hidden xl:block", children: "Control financiero personal" }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "text-[10px] text-zinc-400 whitespace-nowrap", children: "$1 USD =" }), _jsx(Input, { type: "number", value: exchangeRate, onChange: (e) => setExchangeRate(parseFloat(e.target.value) || 0), className: "w-14 sm:w-16 h-6 text-[10px] font-semibold text-right rounded-lg border-zinc-200 dark:border-zinc-700" }), _jsx("span", { className: "text-[10px] font-medium text-zinc-600 dark:text-zinc-300", children: "CUP" })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-1.5 sm:gap-2", children: [_jsxs(Button, { variant: isEditMode ? "default" : "outline", size: "sm", onClick: () => setIsEditMode(!isEditMode), className: cn("rounded-full text-xs h-8 sm:h-9", isEditMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"), children: [_jsx(Settings, { className: "mr-1 h-3.5 w-3.5" }), " ", isEditMode ? "Hecho" : "Editar"] }), _jsxs(Dialog, { open: isLoanDialogOpen, onOpenChange: setIsLoanDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", className: "rounded-full text-xs h-8 sm:h-9 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300", children: [_jsx(LandPlot, { className: "mr-1 h-3.5 w-3.5" }), " Pr\u00E9stamo"] }) }), _jsxs(DialogContent, { className: "rounded-2xl max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Nuevo Pr\u00E9stamo" }), _jsx(DialogDescription, { children: "Registra dinero que has prestado." })] }), _jsx(Form, { ...loanForm, children: _jsxs("form", { onSubmit: loanForm.handleSubmit(onLoanSubmit), className: "space-y-3", children: [_jsx(FormField, { control: loanForm.control, name: "person", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Persona" }), _jsx(FormControl, { children: _jsx(Input, { ...field, placeholder: "Ej: Juan P\u00E9rez" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: loanForm.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Descripci\u00F3n" }), _jsx(FormControl, { children: _jsx(Input, { ...field, placeholder: "Ej: Para el almuerzo" }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(FormField, { control: loanForm.control, name: "amount", render: ({ field }) => (_jsxs(FormItem, { className: "col-span-2", children: [_jsx(FormLabel, { children: "Monto" }), _jsx(FormControl, { children: _jsx(Input, { type: "number", ...field, step: "0.01" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: loanForm.control, name: "currency", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Moneda" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "CUP", children: "CUP" }), _jsx(SelectItem, { value: "USD", children: "USD" })] })] }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: loanForm.control, name: "walletId", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Billetera" }), _jsxs(Select, { onValueChange: field.onChange, value: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Selecciona..." }) }) }), _jsx(SelectContent, { children: wallets.map(w => _jsx(SelectItem, { value: w.id, children: w.name }, w.id)) })] }), _jsx(FormMessage, {})] })) }), _jsx(DialogFooter, { children: _jsx(Button, { type: "submit", className: "rounded-full", children: "Confirmar Pr\u00E9stamo" }) })] }) })] })] }), _jsxs(Dialog, { open: isDebtDialogOpen, onOpenChange: setIsDebtDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", className: "rounded-full text-xs h-8 sm:h-9 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300", children: [_jsx(BadgePercent, { className: "mr-1 h-3.5 w-3.5" }), " Deuda"] }) }), _jsxs(DialogContent, { className: "rounded-2xl max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Registrar Deuda" }), _jsx(DialogDescription, { children: "Registra dinero que debes." })] }), _jsx(Form, { ...debtForm, children: _jsxs("form", { onSubmit: debtForm.handleSubmit(onDebtSubmit), className: "space-y-3", children: [_jsx(FormField, { control: debtForm.control, name: "person", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Acreedor" }), _jsx(FormControl, { children: _jsx(Input, { ...field, placeholder: "Ej: Mar\u00EDa Garc\u00EDa" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: debtForm.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Descripci\u00F3n" }), _jsx(FormControl, { children: _jsx(Input, { ...field, placeholder: "Ej: Pr\u00E9stamo para el curso" }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(FormField, { control: debtForm.control, name: "amount", render: ({ field }) => (_jsxs(FormItem, { className: "col-span-2", children: [_jsx(FormLabel, { children: "Monto" }), _jsx(FormControl, { children: _jsx(Input, { type: "number", ...field, step: "0.01" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: debtForm.control, name: "currency", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Moneda" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "CUP", children: "CUP" }), _jsx(SelectItem, { value: "USD", children: "USD" })] })] }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: debtForm.control, name: "walletId", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Billetera" }), _jsxs(Select, { onValueChange: field.onChange, value: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Selecciona..." }) }) }), _jsx(SelectContent, { children: wallets.map(w => _jsx(SelectItem, { value: w.id, children: w.name }, w.id)) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: debtForm.control, name: "dueDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "Vencimiento (opcional)" }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(FormControl, { children: _jsxs(Button, { variant: "outline", className: "w-full pl-3 text-left font-normal rounded-full", children: [field.value ? format(field.value, "PPP", { locale: es }) : "Elige una fecha", _jsx(CalendarIcon, { className: "ml-auto h-4 w-4 opacity-50" })] }) }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: field.value, onSelect: field.onChange, initialFocus: true }) })] }), _jsx(FormMessage, {})] })) }), _jsx(DialogFooter, { children: _jsx(Button, { type: "submit", className: "rounded-full", children: "Registrar Deuda" }) })] }) })] })] }), _jsxs(Dialog, { open: isTransferDialogOpen, onOpenChange: setIsTransferDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", className: "rounded-full text-xs h-8 sm:h-9 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300", children: [_jsx(ArrowRightLeft, { className: "mr-1 h-3.5 w-3.5" }), " Traspaso"] }) }), _jsxs(DialogContent, { className: "rounded-2xl max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Nuevo Traspaso" }), _jsx(DialogDescription, { children: "Mueve dinero entre billeteras." })] }), _jsx(Form, { ...transferForm, children: _jsxs("form", { onSubmit: transferForm.handleSubmit(onTransferSubmit), className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(FormField, { control: transferForm.control, name: "amount", render: ({ field }) => (_jsxs(FormItem, { className: "col-span-2", children: [_jsx(FormLabel, { children: "Monto" }), _jsx(FormControl, { children: _jsx(Input, { type: "number", ...field, step: "0.01" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: transferForm.control, name: "currency", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Moneda" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "CUP", children: "CUP" }), _jsx(SelectItem, { value: "USD", children: "USD" })] })] }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: transferForm.control, name: "fromWalletId", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Desde" }), _jsxs(Select, { onValueChange: field.onChange, value: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Origen" }) }) }), _jsx(SelectContent, { children: wallets.map(w => _jsx(SelectItem, { value: w.id, children: w.name }, w.id)) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: transferForm.control, name: "toWalletId", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Hacia" }), _jsxs(Select, { onValueChange: field.onChange, value: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Destino" }) }) }), _jsx(SelectContent, { children: wallets.map(w => _jsx(SelectItem, { value: w.id, children: w.name }, w.id)) })] }), _jsx(FormMessage, {})] })) }), _jsx(DialogFooter, { children: _jsx(Button, { type: "submit", className: "rounded-full", children: "Confirmar Traspaso" }) })] }) })] })] }), _jsxs(Dialog, { open: isTransactionDialogOpen, onOpenChange: setIsTransactionDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { onClick: handleOpenTransactionDialog, size: "sm", className: "rounded-full text-xs h-8 sm:h-9 bg-blue-600 hover:bg-blue-700 text-white", children: [_jsx(PlusCircle, { className: "mr-1 h-3.5 w-3.5" }), " Nueva"] }) }), _jsxs(DialogContent, { className: "rounded-2xl max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Nueva Transacci\u00F3n" }), _jsx(DialogDescription, { children: "Registra un ingreso o gasto." })] }), _jsx(Form, { ...transactionForm, children: _jsxs("form", { onSubmit: transactionForm.handleSubmit(onTransactionSubmit), className: "space-y-3", children: [_jsx(FormField, { control: transactionForm.control, name: "type", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Tipo" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "expense", children: "Gasto" }), _jsx(SelectItem, { value: "income", children: "Ingreso" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: transactionForm.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Descripci\u00F3n" }), _jsx(FormControl, { children: _jsx(Input, { ...field, placeholder: "Ej: Caf\u00E9 con amigos" }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(FormField, { control: transactionForm.control, name: "amount", render: ({ field }) => (_jsxs(FormItem, { className: "col-span-2", children: [_jsx(FormLabel, { children: "Monto" }), _jsx(FormControl, { children: _jsx(Input, { type: "number", ...field, step: "0.01" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: transactionForm.control, name: "currency", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Moneda" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "CUP", children: "CUP" }), _jsx(SelectItem, { value: "USD", children: "USD" })] })] }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(FormField, { control: transactionForm.control, name: "date", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "Fecha" }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(FormControl, { children: _jsxs(Button, { variant: "outline", className: "w-full pl-3 text-left font-normal rounded-full", children: [field.value ? format(field.value, "PPP", { locale: es }) : _jsx("span", { children: "Elige una fecha" }), _jsx(CalendarIcon, { className: "ml-auto h-4 w-4 opacity-50" })] }) }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: field.value, onSelect: field.onChange, initialFocus: true }) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: transactionForm.control, name: "walletId", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Billetera" }), _jsxs(Select, { onValueChange: field.onChange, value: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Selecciona..." }) }) }), _jsx(SelectContent, { children: wallets.map(w => _jsx(SelectItem, { value: w.id, children: w.name }, w.id)) })] }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: transactionForm.control, name: "categoryId", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Categor\u00EDa" }), _jsxs(Select, { onValueChange: field.onChange, value: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Selecciona..." }) }) }), _jsx(SelectContent, { children: transactionCategories.filter(c => c.type === transactionType).map(c => _jsx(SelectItem, { value: c.id, children: c.name }, c.id)) })] }), _jsx(FormMessage, {})] })) }), _jsx(DialogFooter, { children: _jsx(Button, { type: "submit", className: "rounded-full", children: "Guardar" }) })] }) })] })] })] })] }), _jsx("div", { className: "h-px bg-zinc-200/50 dark:bg-zinc-950/50" }), _jsxs("div", { className: "grid gap-3 grid-cols-2 md:grid-cols-4", children: [_jsxs(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-0.5 bg-blue-500" }), _jsxs(CardContent, { className: "p-2.5 sm:p-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-[10px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider", children: "Balance Total" }), _jsx("div", { className: "p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600", children: _jsx(Coins, { className: "h-3.5 w-3.5" }) })] }), _jsx(CurrencyDisplay, { usd: totalBalance, exchangeRate: exchangeRate, large: true })] })] }), _jsxs(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-0.5 bg-green-500" }), _jsxs(CardContent, { className: "p-2.5 sm:p-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-[10px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider", children: "Ingresos del Mes" }), _jsx("div", { className: "p-1.5 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-600", children: _jsx(Download, { className: "h-3.5 w-3.5" }) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CurrencyDisplay, { usd: monthlyIncome, exchangeRate: exchangeRate, large: true }), _jsx(TrendIndicator, { value: incomeChange })] }), _jsxs("div", { className: "flex items-center gap-1 mt-1", children: [_jsxs("span", { className: cn("text-[10px] font-medium", incomeChange >= 0 ? "text-green-500" : "text-red-500"), children: [incomeChange >= 0 ? "+" : "", incomeChange.toFixed(1), "%"] }), _jsx("span", { className: "text-[10px] text-zinc-400", children: "vs mes anterior" })] })] })] }), _jsxs(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-0.5 bg-red-400" }), _jsxs(CardContent, { className: "p-2.5 sm:p-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-[10px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider", children: "Gastos del Mes" }), _jsx("div", { className: "p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500", children: _jsx(Upload, { className: "h-3.5 w-3.5" }) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CurrencyDisplay, { usd: monthlyExpenses, exchangeRate: exchangeRate, large: true }), _jsx(TrendIndicator, { value: -expenseChange })] }), _jsxs("div", { className: "flex items-center gap-1 mt-1", children: [_jsxs("span", { className: cn("text-[10px] font-medium", expenseChange <= 0 ? "text-green-500" : "text-red-500"), children: [expenseChange >= 0 ? "+" : "", expenseChange.toFixed(1), "%"] }), _jsx("span", { className: "text-[10px] text-zinc-400", children: "vs mes anterior" })] })] })] }), _jsxs(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden", children: [_jsx("div", { className: cn("h-0.5", monthlyBalance >= 0 ? "bg-green-500" : "bg-red-400") }), _jsxs(CardContent, { className: "p-2.5 sm:p-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-[10px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider", children: "Balance Mensual" }), _jsx("div", { className: cn("p-1.5 rounded-lg", monthlyBalance >= 0 ? "bg-green-50 dark:bg-green-500/10 text-green-600" : "bg-red-50 dark:bg-red-500/10 text-red-500"), children: _jsx(Scale, { className: "h-3.5 w-3.5" }) })] }), _jsx("div", { className: cn(monthlyBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"), children: _jsx(CurrencyDisplay, { usd: monthlyBalance, exchangeRate: exchangeRate, large: true }) }), _jsxs("div", { className: "flex items-center gap-1 mt-1", children: [_jsxs("span", { className: "text-[10px] font-medium", children: [savingsRate.toFixed(1), "%"] }), _jsx("span", { className: "text-[10px] text-zinc-400", children: "tasa de ahorro" })] })] })] })] }), _jsxs(Tabs, { defaultValue: "resumen", className: "space-y-3", children: [_jsxs(TabsList, { className: "inline-flex h-8 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-950 gap-0.5 flex-wrap", children: [_jsx(TabsTrigger, { value: "resumen", className: "rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100", children: "Resumen" }), _jsx(TabsTrigger, { value: "presupuesto", className: "rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100", children: "Presupuesto" }), _jsx(TabsTrigger, { value: "billeteras", className: "rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100", children: "Billeteras" }), _jsx(TabsTrigger, { value: "distribucion", className: "rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100", children: "Distribuci\u00F3n" }), _jsx(TabsTrigger, { value: "metas", className: "rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100", children: "Metas" }), _jsx(TabsTrigger, { value: "movimientos", className: "rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100", children: "Movimientos" }), _jsx(TabsTrigger, { value: "prestamos", className: "rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100", children: "Pr\u00E9stamos" }), _jsx(TabsTrigger, { value: "deudas", className: "rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100", children: "Deudas" })] }), _jsx(TabsContent, { value: "resumen", className: "space-y-3", children: _jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [_jsxs(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: [_jsxs(CardHeader, { className: "pb-1 px-4 pt-4", children: [_jsx(CardTitle, { className: "text-sm text-zinc-900 dark:text-zinc-100", children: "Resumen 6 Meses" }), _jsx(CardDescription, { className: "text-xs text-zinc-400", children: "Ingresos vs Gastos" })] }), _jsx(CardContent, { className: "px-3 pb-4", children: _jsx(MonthlySummaryChart, { data: chartData.monthlySummary }) })] }), _jsxs(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: [_jsxs(CardHeader, { className: "pb-1 px-4 pt-4", children: [_jsx(CardTitle, { className: "text-sm text-zinc-900 dark:text-zinc-100", children: "Gastos por Categor\u00EDa" }), _jsx(CardDescription, { className: "text-xs text-zinc-400", children: "Distribuci\u00F3n del mes" })] }), _jsx(CardContent, { className: "px-3 pb-4", children: _jsx(CategorySpendChart, { data: chartData.categorySpend }) })] }), _jsxs(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: [_jsxs(CardHeader, { className: "pb-1 px-4 pt-4", children: [_jsx(CardTitle, { className: "text-sm text-zinc-900 dark:text-zinc-100", children: "Distribuci\u00F3n de Balance" }), _jsx(CardDescription, { className: "text-xs text-zinc-400", children: "Por billetera" })] }), _jsx(CardContent, { className: "px-3 pb-4", children: _jsx(WalletDistributionChart, { data: chartData.walletDistribution }) })] }), _jsxs(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: [_jsxs(CardHeader, { className: "pb-1 px-4 pt-4", children: [_jsx(CardTitle, { className: "text-sm text-zinc-900 dark:text-zinc-100", children: "Tendencia del Balance" }), _jsx(CardDescription, { className: "text-xs text-zinc-400", children: "Evoluci\u00F3n patrimonial" })] }), _jsx(CardContent, { className: "px-3 pb-4", children: _jsx(CashFlowTrendChart, { data: chartData.cashFlowTrend }) })] })] }) }), _jsx(TabsContent, { value: "presupuesto", className: "space-y-3", children: _jsxs(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: [_jsx(CardHeader, { className: "pb-2 px-4 pt-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-sm text-zinc-900 dark:text-zinc-100", children: "Presupuesto Mensual" }), _jsx(CardDescription, { className: "text-xs text-zinc-400", children: "Gastado vs Presupuestado" })] }), isEditMode && (_jsxs(Button, { variant: "outline", size: "sm", className: "rounded-full text-[10px] h-7 border-zinc-200 dark:border-zinc-700", onClick: () => setIsBudgetCategoryDialogOpen(true), children: [_jsx(Plus, { className: "mr-1 h-3 w-3" }), " Categor\u00EDa"] }))] }) }), _jsxs(CardContent, { className: "px-4 pb-4", children: [budgetData.length === 0 ? (_jsx("p", { className: "text-xs text-zinc-400 text-center py-4", children: "Establece l\u00EDmites de presupuesto para tus categor\u00EDas de gasto." })) : (_jsx("div", { className: "grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4", children: budgetData.map(({ category, spent, limit, percentage }) => (_jsxs("div", { className: "p-2.5 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between gap-1", children: [_jsxs("div", { className: "flex items-center gap-1 min-w-0", children: [isEditMode && (_jsx(Button, { variant: "ghost", size: "icon", className: "h-4 w-4 shrink-0 rounded-full text-red-400 hover:text-red-600", onClick: () => handleRemoveBudgetCategory(category.id), children: _jsx(X, { className: "h-3 w-3" }) })), _jsx("span", { className: "font-medium text-xs text-zinc-700 dark:text-zinc-300 truncate", children: category.name })] }), _jsxs("span", { className: cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0", percentage > 100 ? "bg-red-50 text-red-500 dark:bg-red-500/10" :
                                                                        percentage > 80 ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" :
                                                                            "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"), children: [Math.round(percentage), "%"] })] }), _jsx("div", { className: "relative h-1.5 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden", children: _jsx("div", { className: cn("h-full rounded-full transition-all duration-500", percentage > 100 ? "bg-red-400" : percentage > 80 ? "bg-amber-400" : "bg-blue-500"), style: { width: `${Math.min(percentage, 100)}%` } }) }), _jsxs("div", { className: "flex items-center justify-between gap-1", children: [_jsxs("span", { className: "text-[10px] text-zinc-400 truncate", children: [formatCurrency(spent), " ", _jsx("span", { className: "text-zinc-300 dark:text-zinc-600", children: "/" }), " ", formatCurrency(limit)] }), _jsx(Input, { type: "number", value: limit, onChange: (e) => setBudgetLimits(prev => ({ ...prev, [category.id]: parseFloat(e.target.value) || 0 })), className: "h-6 text-[10px] w-20 text-right rounded-lg border-zinc-200 dark:border-zinc-700", placeholder: "L\u00EDmite" })] })] }, category.id))) })), isEditMode && budgetData.length > 0 && (_jsx("div", { className: "pt-2 text-center", children: _jsxs(Button, { variant: "ghost", size: "sm", className: "rounded-full text-[10px] h-7 text-zinc-400 hover:text-zinc-700", onClick: () => setIsBudgetCategoryDialogOpen(true), children: [_jsx(Plus, { className: "mr-1 h-3 w-3" }), " Agregar categor\u00EDa al presupuesto"] }) }))] })] }) }), _jsx(TabsContent, { value: "billeteras", className: "space-y-3", children: _jsxs("section", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100", children: "Billeteras" }), _jsxs("p", { className: "text-[10px] sm:text-xs text-zinc-400", children: [wallets.length, " billeteras \u00B7 Total: ", (totalBalance * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 }), " CUP"] })] }), isEditMode && (_jsxs(Button, { size: "sm", className: "rounded-full text-[10px] h-7 bg-blue-600 hover:bg-blue-700 text-white", onClick: () => { walletCreateForm.reset({ name: '', balance: 0, icon: 'Wallet', currency: 'CUP' }); setIsWalletCreateDialogOpen(true); }, children: [_jsx(Plus, { className: "mr-1 h-3 w-3" }), " Agregar"] }))] }), _jsx("div", { className: "grid gap-2 sm:gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7", children: wallets.map((wallet, idx) => {
                                            const Icon = getWalletIcon(wallet.id);
                                            return (_jsx(Card, { className: "border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl hover:shadow-md transition-all duration-200", style: { animationDelay: `${idx * 0.05}s` }, children: _jsxs(CardContent, { className: "p-3 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("div", { className: "p-1 rounded-lg bg-zinc-100 dark:bg-zinc-950", children: _jsx(Icon, { className: "h-3 w-3 text-zinc-500 dark:text-zinc-400" }) }), _jsx("span", { className: "text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate", children: wallet.name })] }), _jsxs("div", { className: "flex items-center gap-0.5", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-5 w-5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300", onClick: () => openWalletDialog(wallet), children: _jsx(Edit, { className: "h-2.5 w-2.5" }) }), isEditMode && (_jsx(Button, { variant: "ghost", size: "icon", className: "h-5 w-5 rounded-full text-red-400 hover:text-red-600", onClick: () => setWalletToDelete(wallet), children: _jsx(Trash2, { className: "h-2.5 w-2.5" }) }))] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100", children: (wallet.balance * exchangeRate).toLocaleString("es-ES", { minimumFractionDigits: 2 }) }), _jsxs("div", { className: "text-[10px] text-zinc-400", children: ["CUP \u00B7 $", wallet.balance.toFixed(2), " USD"] })] })] }) }, wallet.id));
                                        }) })] }) }), _jsx(TabsContent, { value: "distribucion", className: "space-y-3", children: _jsxs("section", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100", children: "Distribuci\u00F3n" }), _jsx("p", { className: "text-[10px] sm:text-xs text-zinc-400", children: "M\u00E9todo JARS \u00B7 6 bolsas" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [(() => {
                                                        const totalUndistributed = undistributedIncomes.reduce((acc, t) => acc + t.amount, 0);
                                                        if (totalUndistributed > 0) {
                                                            return (_jsxs(Button, { onClick: () => setIsDistributeIncomeDialogOpen(true), size: "sm", className: "rounded-full text-[10px] h-7 bg-blue-600 hover:bg-blue-700 text-white", children: [_jsx(Coins, { className: "mr-1 h-3 w-3" }), "Distribuir ", formatCurrency(totalUndistributed * exchangeRate)] }));
                                                        }
                                                        return null;
                                                    })(), _jsxs(Button, { variant: "outline", size: "sm", className: "rounded-full text-[10px] h-7 border-zinc-200 dark:border-zinc-700", onClick: () => { setEditingBag(null); bagForm.reset({ name: "", percentage: 10, description: "", icon: "Target", color: "blue" }); setIsBagDialogOpen(true); }, children: [_jsx(Plus, { className: "mr-1 h-3 w-3" }), " Bolsa"] })] })] }), distributionBags.length === 0 ? (_jsx(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: _jsx(CardContent, { className: "p-6 text-center text-xs text-zinc-400", children: "No hay bolsas de distribuci\u00F3n. Crea una para empezar." }) })) : (_jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [_jsx(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: _jsx(CardContent, { className: "p-2.5 sm:p-3", children: _jsx(DistributionBagChart, { data: distributionBags.map(b => ({ name: b.name, percentage: b.percentage, color: b.color })) }) }) }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex justify-between text-[10px] sm:text-xs text-zinc-400", children: [_jsxs("span", { children: ["Distribuci\u00F3n: ", distributionBags.reduce((acc, b) => acc + b.percentage, 0), "%"] }), (() => {
                                                                        const total = distributionBags.reduce((acc, b) => acc + b.percentage, 0);
                                                                        if (total === 100)
                                                                            return _jsx("span", { className: "text-green-500 font-medium", children: "100%" });
                                                                        if (total > 100)
                                                                            return _jsxs("span", { className: "text-red-500 font-medium", children: ["Excede ", total - 100, "%"] });
                                                                        return _jsxs("span", { className: "text-amber-500 font-medium", children: ["Falta ", 100 - total, "%"] });
                                                                    })()] }), _jsx("div", { className: "h-2 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden flex", children: distributionBags.map((bag) => {
                                                                    const color = bagColorMap[bag.color] || bagColorMap.blue;
                                                                    return (_jsx("div", { className: cn(color.bar, "transition-all duration-500 first:rounded-l-full last:rounded-r-full"), style: { width: `${bag.percentage}%`, minWidth: bag.percentage > 0 ? "4px" : "0" } }, bag.id));
                                                                }) })] }), _jsx("div", { className: "grid gap-2 grid-cols-2 lg:grid-cols-3", children: distributionBags.map((bag, idx) => {
                                                            const IconComponent = iconMap[bag.icon] || WalletIcon;
                                                            const color = bagColorMap[bag.color] || bagColorMap.blue;
                                                            return (_jsx(Card, { className: "border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl hover:shadow-md transition-all duration-200", style: { animationDelay: `${idx * 0.05}s` }, children: _jsxs(CardContent, { className: "p-2.5 space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("div", { className: cn("p-1 rounded-lg", color.bg), children: _jsx(IconComponent, { className: cn("h-3 w-3", color.text) }) }), _jsx("span", { className: "text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate", children: bag.name })] }), _jsxs("div", { className: "flex items-center gap-0.5", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-5 w-5 rounded-full text-zinc-400 hover:text-zinc-700", onClick: () => { setEditingBag(bag); bagForm.reset({ name: bag.name, percentage: bag.percentage, description: bag.description, icon: bag.icon, color: bag.color }); setIsBagDialogOpen(true); }, children: _jsx(Edit, { className: "h-2.5 w-2.5" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-5 w-5 rounded-full text-red-400 hover:text-red-600", onClick: () => setBagToDelete(bag), children: _jsx(Trash2, { className: "h-2.5 w-2.5" }) })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: cn("text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full", color.badge), children: [bag.percentage, "%"] }), _jsx(CurrencyDisplay, { usd: bag.balance || 0, exchangeRate: exchangeRate })] }), _jsx("p", { className: "text-[10px] text-zinc-400 leading-relaxed truncate", children: bag.description })] }) }, bag.id));
                                                        }) })] })] }))] }) }), _jsx(TabsContent, { value: "metas", className: "space-y-3", children: _jsxs("section", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100", children: "Metas Financieras" }), _jsx("p", { className: "text-[10px] sm:text-xs text-zinc-400", children: "Alcanza tus objetivos de ahorro" })] }), isEditMode && (_jsxs(Button, { size: "sm", className: "rounded-full text-[10px] h-7 bg-blue-600 hover:bg-blue-700 text-white", onClick: () => { setEditingGoal(null); goalForm.reset({ name: '', targetAmount: 0, icon: 'Target', color: 'blue' }); setIsGoalDialogOpen(true); }, children: [_jsx(Plus, { className: "mr-1 h-3 w-3" }), " Meta"] }))] }), financialGoals.length === 0 ? (_jsx(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: _jsx(CardContent, { className: "p-6 text-center text-xs text-zinc-400", children: isEditMode ? 'Crea tu primera meta financiera.' : 'No hay metas financieras definidas.' }) })) : (_jsx("div", { className: "grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: financialGoals.map((goal) => {
                                            const IconComponent = iconMap[goal.icon] || PiggyBank;
                                            const color = bagColorMap[goal.color] || bagColorMap.blue;
                                            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                                            return (_jsx(Card, { className: "border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl hover:shadow-md transition-all duration-200", children: _jsxs(CardContent, { className: "p-3 space-y-2.5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: cn("p-1.5 rounded-xl", color.bg), children: _jsx(IconComponent, { className: cn("h-4 w-4", color.text) }) }), _jsx("span", { className: "text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate", children: goal.name })] }), _jsx("div", { className: "flex items-center gap-0.5", children: isEditMode && (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 rounded-full text-zinc-400 hover:text-zinc-700", onClick: () => { setEditingGoal(goal); goalForm.reset({ name: goal.name, targetAmount: goal.targetAmount, icon: goal.icon, color: goal.color }); setIsGoalDialogOpen(true); }, children: _jsx(Edit, { className: "h-3 w-3" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 rounded-full text-red-400 hover:text-red-600", onClick: () => setGoalToDelete(goal), children: _jsx(Trash2, { className: "h-3 w-3" }) })] })) })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsxs("span", { className: "text-zinc-500 dark:text-zinc-400", children: [goal.currentAmount.toLocaleString("es-ES", { minimumFractionDigits: 0 }), " CUP"] }), _jsxs("span", { className: "text-zinc-700 dark:text-zinc-300 font-semibold", children: [goal.targetAmount.toLocaleString("es-ES", { minimumFractionDigits: 0 }), " CUP"] })] }), _jsx("div", { className: "relative h-2 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden", children: _jsx("div", { className: cn("h-full rounded-full transition-all duration-500", color.bar), style: { width: `${Math.min(progress, 100)}%` } }) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: cn("text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full", color.badge), children: [Math.round(progress), "%"] }), _jsxs(Button, { size: "sm", className: "rounded-full text-[10px] h-7 bg-blue-600 hover:bg-blue-700 text-white", onClick: () => { setGoalToDeposit(goal); setDepositAmount(0); setDepositWalletId(""); }, children: [_jsx(PiggyBank, { className: "h-3 w-3 mr-1" }), " Abonar"] })] })] })] }) }, goal.id));
                                        }) }))] }) }), _jsx(TabsContent, { value: "movimientos", className: "space-y-3", children: _jsxs(Tabs, { defaultValue: "expenses", className: "space-y-2", children: [_jsxs(TabsList, { className: "inline-flex h-8 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-950 gap-0.5", children: [_jsx(TabsTrigger, { value: "expenses", className: "rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100", children: "Gastos" }), _jsx(TabsTrigger, { value: "incomes", className: "rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100", children: "Ingresos" }), _jsx(TabsTrigger, { value: "transfers", className: "rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100", children: "Traspasos" })] }), _jsx(TabsContent, { value: "expenses", children: _jsxs(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: [_jsxs(CardHeader, { className: "pb-2 px-4 pt-4", children: [_jsx(CardTitle, { className: "text-sm text-zinc-900 dark:text-zinc-100", children: "Gastos" }), _jsxs(CardDescription, { className: "text-xs text-zinc-400", children: [expenses.length, " transacciones"] })] }), _jsx(CardContent, { className: "px-2 sm:px-4", children: _jsx(DataTable, { columns: transactionColumns, data: expenses }) })] }) }), _jsxs(TabsContent, { value: "incomes", className: "space-y-3", children: [_jsxs("div", { className: "grid gap-2 grid-cols-3", children: [_jsx(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: _jsxs(CardContent, { className: "p-2.5 sm:p-3 space-y-0.5", children: [_jsx("p", { className: "text-[10px] text-zinc-400 uppercase tracking-wider", children: "Ingresos este mes" }), _jsxs("p", { className: "text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100", children: [(monthlyIncome * exchangeRate).toLocaleString("es-ES", { minimumFractionDigits: 2 }), " CUP"] }), _jsxs("p", { className: "text-[10px] text-zinc-400", children: ["$", monthlyIncome.toFixed(2), " USD"] })] }) }), _jsx(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: _jsxs(CardContent, { className: "p-2.5 sm:p-3 space-y-0.5", children: [_jsx("p", { className: "text-[10px] text-zinc-400 uppercase tracking-wider", children: "Transacciones" }), _jsx("p", { className: "text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100", children: incomes.filter(t => isThisMonth(t.date)).length }), _jsx("p", { className: "text-[10px] text-zinc-400", children: "este mes" })] }) }), _jsx(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: _jsxs(CardContent, { className: "p-2.5 sm:p-3 space-y-0.5", children: [_jsx("p", { className: "text-[10px] text-zinc-400 uppercase tracking-wider", children: "Promedio" }), _jsx("p", { className: "text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100", children: incomes.filter(t => isThisMonth(t.date)).length > 0
                                                                        ? `${((monthlyIncome / incomes.filter(t => isThisMonth(t.date)).length) * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })}`
                                                                        : "0" }), _jsx("p", { className: "text-[10px] text-zinc-400", children: "CUP por ingreso" })] }) })] }), _jsxs(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: [_jsx(CardHeader, { className: "pb-2 px-4 pt-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-sm text-zinc-900 dark:text-zinc-100", children: "Ingresos" }), _jsx(CardDescription, { className: "text-xs text-zinc-400", children: "Historial" })] }), _jsxs(Button, { size: "sm", variant: "outline", className: "rounded-full text-[10px] h-7 border-zinc-200 dark:border-zinc-700", onClick: () => {
                                                                        transactionForm.reset({ description: "", amount: 0, currency: "CUP", date: new Date(), walletId: "", categoryId: "", type: "income" });
                                                                        setIsTransactionDialogOpen(true);
                                                                    }, children: [_jsx(PlusCircle, { className: "w-3 h-3 mr-1" }), " Nuevo"] })] }) }), _jsxs(CardContent, { className: "px-2 sm:px-4", children: [_jsx("div", { className: "flex gap-1.5 flex-wrap mb-3", children: [
                                                                    { label: "Salario", category: "cat-income-1" },
                                                                    { label: "Freelance", category: "cat-income-2" },
                                                                    { label: "Venta", category: "cat-income-1" },
                                                                    { label: "Devolución", category: "cat-income-2" },
                                                                ].map(preset => (_jsx(Button, { variant: "outline", size: "sm", className: "rounded-full text-[10px] h-7 border-zinc-200 dark:border-zinc-700", onClick: () => {
                                                                        transactionForm.reset({ description: preset.label, amount: 0, currency: "CUP", date: new Date(), walletId: "", categoryId: preset.category, type: "income" });
                                                                        setIsTransactionDialogOpen(true);
                                                                    }, children: preset.label }, preset.label))) }), _jsx(DataTable, { columns: transactionColumns, data: incomes })] })] })] }), _jsx(TabsContent, { value: "transfers", children: _jsxs(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: [_jsx(CardHeader, { className: "pb-2 px-4 pt-4", children: _jsx(CardTitle, { className: "text-sm text-zinc-900 dark:text-zinc-100", children: "Traspasos" }) }), _jsx(CardContent, { className: "px-2 sm:px-4", children: _jsx(DataTable, { columns: transactionColumns, data: transfers }) })] }) })] }) }), _jsx(TabsContent, { value: "prestamos", className: "space-y-3", children: (() => {
                                const outstandingLoans = loans.filter(l => l.status === "outstanding");
                                const paidLoans = loans.filter(l => l.status === "paid");
                                const totalLent = outstandingLoans.reduce((acc, l) => acc + l.totalAmount, 0);
                                const totalRecovered = outstandingLoans.reduce((acc, l) => acc + l.paidAmount, 0);
                                const totalPending = totalLent - totalRecovered;
                                return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid gap-2 grid-cols-2 sm:grid-cols-4", children: [_jsx(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: _jsxs(CardContent, { className: "p-2.5 sm:p-3 space-y-0.5", children: [_jsx("p", { className: "text-[10px] text-zinc-400 uppercase tracking-wider", children: "Prestado activo" }), _jsxs("p", { className: "text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100", children: [(totalLent * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 }), " CUP"] })] }) }), _jsx(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: _jsxs(CardContent, { className: "p-2.5 sm:p-3 space-y-0.5", children: [_jsx("p", { className: "text-[10px] text-zinc-400 uppercase tracking-wider", children: "Recuperado" }), _jsxs("p", { className: "text-sm sm:text-base font-bold text-green-600", children: [(totalRecovered * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 }), " CUP"] })] }) }), _jsx(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: _jsxs(CardContent, { className: "p-2.5 sm:p-3 space-y-0.5", children: [_jsx("p", { className: "text-[10px] text-zinc-400 uppercase tracking-wider", children: "Por cobrar" }), _jsxs("p", { className: "text-sm sm:text-base font-bold text-amber-600", children: [(totalPending * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 }), " CUP"] })] }) }), _jsx(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: _jsxs(CardContent, { className: "p-2.5 sm:p-3 space-y-0.5", children: [_jsx("p", { className: "text-[10px] text-zinc-400 uppercase tracking-wider", children: "Pr\u00E9stamos" }), _jsxs("p", { className: "text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100", children: [outstandingLoans.length, " activos"] }), _jsxs("p", { className: "text-[10px] text-zinc-400", children: [paidLoans.length, " pagados"] })] }) })] }), outstandingLoans.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-xs font-semibold text-zinc-700 dark:text-zinc-300", children: "Pendientes" }), _jsx("div", { className: "grid gap-2 sm:grid-cols-2", children: outstandingLoans.map(loan => {
                                                        const progress = (loan.paidAmount / loan.totalAmount) * 100;
                                                        const remaining = loan.totalAmount - loan.paidAmount;
                                                        return (_jsx(Card, { className: cn("border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", "ring-1 ring-amber-500/10"), children: _jsxs(CardContent, { className: "p-3 space-y-2", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx("h4", { className: "font-semibold text-xs text-zinc-900 dark:text-zinc-100", children: loan.person }), _jsx("p", { className: "text-[10px] text-zinc-400", children: loan.description }), _jsx("p", { className: "text-[10px] text-zinc-400", children: format(new Date(loan.date), "dd MMM yyyy", { locale: es }) })] }), _jsxs(Button, { size: "sm", variant: "outline", className: "rounded-full text-[10px] h-7 border-zinc-200 dark:border-zinc-700", onClick: () => openLoanPaymentDialog(loan), children: [_jsx(DollarSign, { className: "h-3 w-3 mr-1" }), " Cobrar"] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Progress, { value: progress, className: "h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-950" }), _jsxs("div", { className: "flex justify-between text-[10px] text-zinc-400", children: [_jsxs("span", { children: ["Pagado: ", (loan.paidAmount * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 }), " CUP"] }), _jsxs("span", { children: ["Falta: ", (remaining * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 }), " CUP"] })] })] })] }) }, loan.id));
                                                    }) })] })), paidLoans.length > 0 && (_jsxs(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: [_jsx(CardHeader, { className: "pb-2 px-4 pt-4", children: _jsxs(CardTitle, { className: "text-sm text-zinc-900 dark:text-zinc-100", children: ["Completados (", paidLoans.length, ")"] }) }), _jsx(CardContent, { className: "px-4 space-y-1.5", children: paidLoans.map(loan => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl text-xs", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium text-zinc-700 dark:text-zinc-300", children: loan.person }), _jsxs("span", { className: "text-zinc-400", children: ["\u2014 ", loan.description] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "font-medium text-zinc-700 dark:text-zinc-300", children: [(loan.totalAmount * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 }), " CUP"] }), _jsx(Badge, { className: "rounded-full text-[10px] px-2 bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400", children: "Pagado" })] })] }, loan.id))) })] })), _jsxs(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: [_jsx(CardHeader, { className: "pb-2 px-4 pt-4", children: _jsx(CardTitle, { className: "text-sm text-zinc-900 dark:text-zinc-100", children: "Todos los Pr\u00E9stamos" }) }), _jsx(CardContent, { className: "px-2 sm:px-4", children: _jsx(DataTable, { columns: loanColumns, data: loans }) })] })] }));
                            })() }), _jsx(TabsContent, { value: "deudas", className: "space-y-3", children: (() => {
                                const outstandingDebts = debts.filter(d => d.status === "outstanding");
                                const paidDebts = debts.filter(d => d.status === "paid");
                                const totalDebt = outstandingDebts.reduce((acc, d) => acc + d.totalAmount, 0);
                                const totalPaid = outstandingDebts.reduce((acc, d) => acc + d.paidAmount, 0);
                                const totalRemaining = totalDebt - totalPaid;
                                return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid gap-2 grid-cols-2 sm:grid-cols-4", children: [_jsx(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: _jsxs(CardContent, { className: "p-2.5 sm:p-3 space-y-0.5", children: [_jsx("p", { className: "text-[10px] text-zinc-400 uppercase tracking-wider", children: "Deuda activa" }), _jsxs("p", { className: "text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100", children: [(totalDebt * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 }), " CUP"] })] }) }), _jsx(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: _jsxs(CardContent, { className: "p-2.5 sm:p-3 space-y-0.5", children: [_jsx("p", { className: "text-[10px] text-zinc-400 uppercase tracking-wider", children: "Pagado" }), _jsxs("p", { className: "text-sm sm:text-base font-bold text-green-600", children: [(totalPaid * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 }), " CUP"] })] }) }), _jsx(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: _jsxs(CardContent, { className: "p-2.5 sm:p-3 space-y-0.5", children: [_jsx("p", { className: "text-[10px] text-zinc-400 uppercase tracking-wider", children: "Por pagar" }), _jsxs("p", { className: "text-sm sm:text-base font-bold text-red-500", children: [(totalRemaining * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 }), " CUP"] })] }) }), _jsx(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: _jsxs(CardContent, { className: "p-2.5 sm:p-3 space-y-0.5", children: [_jsx("p", { className: "text-[10px] text-zinc-400 uppercase tracking-wider", children: "Deudas" }), _jsxs("p", { className: "text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100", children: [outstandingDebts.length, " activas"] }), _jsxs("p", { className: "text-[10px] text-zinc-400", children: [paidDebts.length, " pagadas"] })] }) })] }), outstandingDebts.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-xs font-semibold text-zinc-700 dark:text-zinc-300", children: "Pendientes" }), _jsx("div", { className: "grid gap-2 sm:grid-cols-2", children: outstandingDebts.map(debt => {
                                                        const progress = (debt.paidAmount / debt.totalAmount) * 100;
                                                        const remaining = debt.totalAmount - debt.paidAmount;
                                                        const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date();
                                                        return (_jsx(Card, { className: cn("border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", isOverdue ? "ring-1 ring-red-500/20" : "ring-1 ring-zinc-200/50 dark:ring-zinc-700/50"), children: _jsxs(CardContent, { className: "p-3 space-y-2", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h4", { className: "font-semibold text-xs text-zinc-900 dark:text-zinc-100", children: debt.person }), isOverdue && _jsx(Badge, { className: "rounded-full text-[10px] px-2 bg-red-50 text-red-500 dark:bg-red-500/10", children: "Vencida" })] }), _jsx("p", { className: "text-[10px] text-zinc-400", children: debt.description }), _jsxs("p", { className: "text-[10px] text-zinc-400", children: [format(new Date(debt.date), "dd MMM yyyy", { locale: es }), debt.dueDate && ` · Vence: ${format(new Date(debt.dueDate), "dd MMM yyyy", { locale: es })}`] })] }), _jsxs(Button, { size: "sm", className: "rounded-full text-[10px] h-7 bg-blue-600 hover:bg-blue-700 text-white", onClick: () => openDebtPaymentDialog(debt), children: [_jsx(DollarSign, { className: "h-3 w-3 mr-1" }), " Pagar"] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Progress, { value: progress, className: "h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-950" }), _jsxs("div", { className: "flex justify-between text-[10px] text-zinc-400", children: [_jsxs("span", { children: ["Pagado: ", (debt.paidAmount * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 }), " CUP"] }), _jsxs("span", { className: "text-red-500 font-medium", children: ["Falta: ", (remaining * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 }), " CUP"] })] })] })] }) }, debt.id));
                                                    }) })] })), paidDebts.length > 0 && (_jsxs(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: [_jsx(CardHeader, { className: "pb-2 px-4 pt-4", children: _jsxs(CardTitle, { className: "text-sm text-zinc-900 dark:text-zinc-100", children: ["Pagadas (", paidDebts.length, ")"] }) }), _jsx(CardContent, { className: "px-4 space-y-1.5", children: paidDebts.map(debt => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl text-xs", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium text-zinc-700 dark:text-zinc-300", children: debt.person }), _jsxs("span", { className: "text-zinc-400", children: ["\u2014 ", debt.description] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "font-medium text-zinc-700 dark:text-zinc-300", children: [(debt.totalAmount * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 }), " CUP"] }), _jsx(Badge, { className: "rounded-full text-[10px] px-2 bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400", children: "Pagado" })] })] }, debt.id))) })] })), _jsxs(Card, { className: "border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", children: [_jsx(CardHeader, { className: "pb-2 px-4 pt-4", children: _jsx(CardTitle, { className: "text-sm text-zinc-900 dark:text-zinc-100", children: "Todas las Deudas" }) }), _jsx(CardContent, { className: "px-2 sm:px-4", children: _jsx(DataTable, { columns: renderDebtColumns(), data: debts }) })] })] }));
                            })() })] }), _jsx(Dialog, { open: isWalletDialogOpen, onOpenChange: setIsWalletDialogOpen, children: _jsxs(DialogContent, { className: "rounded-2xl max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Editar Billetera" }), _jsx(DialogDescription, { children: "Modifica el saldo." })] }), _jsx(Form, { ...walletForm, children: _jsxs("form", { onSubmit: walletForm.handleSubmit(onWalletSubmit), className: "space-y-3", children: [_jsx(FormField, { control: walletForm.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Nombre" }), _jsx(FormControl, { children: _jsx(Input, { ...field, disabled: true }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(FormField, { control: walletForm.control, name: "balance", render: ({ field }) => (_jsxs(FormItem, { className: "col-span-2", children: [_jsx(FormLabel, { children: "Nuevo Saldo" }), _jsx(FormControl, { children: _jsx(Input, { type: "number", ...field, step: "0.01" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: walletForm.control, name: "currency", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Moneda" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "CUP", children: "CUP" }), _jsx(SelectItem, { value: "USD", children: "USD" })] })] }), _jsx(FormMessage, {})] })) })] }), _jsx(DialogFooter, { children: _jsx(Button, { type: "submit", className: "rounded-full", children: "Guardar Cambios" }) })] }) })] }) }), _jsx(Dialog, { open: isWalletCreateDialogOpen, onOpenChange: setIsWalletCreateDialogOpen, children: _jsxs(DialogContent, { className: "rounded-2xl max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Nueva Billetera" }), _jsx(DialogDescription, { children: "Crea una nueva billetera para gestionar tu dinero." })] }), _jsx(Form, { ...walletCreateForm, children: _jsxs("form", { onSubmit: walletCreateForm.handleSubmit(onWalletCreateSubmit), className: "space-y-3", children: [_jsx(FormField, { control: walletCreateForm.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Nombre" }), _jsx(FormControl, { children: _jsx(Input, { ...field, placeholder: "Ej: Ahorros" }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(FormField, { control: walletCreateForm.control, name: "balance", render: ({ field }) => (_jsxs(FormItem, { className: "col-span-2", children: [_jsx(FormLabel, { children: "Saldo Inicial" }), _jsx(FormControl, { children: _jsx(Input, { type: "number", ...field, step: "0.01" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: walletCreateForm.control, name: "currency", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Moneda" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "CUP", children: "CUP" }), _jsx(SelectItem, { value: "USD", children: "USD" })] })] }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: walletCreateForm.control, name: "icon", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Icono" }), _jsxs(Select, { onValueChange: field.onChange, value: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { className: "rounded-xl", children: _jsx(SelectValue, { placeholder: "Icono" }) }) }), _jsx(SelectContent, { children: ["Wallet", "Banknote", "CreditCard", "PiggyBank", "Target", "DollarSign", "Coins"].map(key => (_jsx(SelectItem, { value: key, children: key }, key))) })] }), _jsx(FormMessage, {})] })) }), _jsx(DialogFooter, { children: _jsx(Button, { type: "submit", className: "rounded-full", children: "Crear Billetera" }) })] }) })] }) }), _jsx(AlertDialog, { open: !!walletToDelete, onOpenChange: (open) => { if (!open)
                        setWalletToDelete(null); }, children: _jsxs(AlertDialogContent, { className: "rounded-2xl", children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "\u00BFEliminar billetera?" }), _jsxs(AlertDialogDescription, { children: ["Se eliminar\u00E1 \"", walletToDelete?.name, "\" de tus billeteras. Las transacciones asociadas se conservar\u00E1n."] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { className: "rounded-full", children: "Cancelar" }), _jsx(AlertDialogAction, { onClick: handleDeleteWallet, className: "rounded-full bg-red-500 hover:bg-red-600", children: "Eliminar" })] })] }) }), _jsx(Dialog, { open: isBudgetCategoryDialogOpen, onOpenChange: setIsBudgetCategoryDialogOpen, children: _jsxs(DialogContent, { className: "rounded-2xl max-w-sm", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Agregar al Presupuesto" }), _jsx(DialogDescription, { children: "Selecciona una categor\u00EDa y define su l\u00EDmite mensual." })] }), _jsx(BudgetCategoryForm, { availableCategories: transactionCategories.filter(c => c.type === 'expense' && !budgetLimits[c.id]), onCancel: () => setIsBudgetCategoryDialogOpen(false), onSubmit: handleAddBudgetCategory })] }) }), _jsx(Dialog, { open: isLoanPaymentDialogOpen, onOpenChange: setIsLoanPaymentDialogOpen, children: _jsxs(DialogContent, { className: "rounded-2xl max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Pago de Pr\u00E9stamo" }), _jsx(DialogDescription, { children: loanToPay && `Préstamo a: ${loanToPay.person}` })] }), _jsx(Form, { ...loanPaymentForm, children: _jsxs("form", { onSubmit: loanPaymentForm.handleSubmit(onLoanPaymentSubmit), className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(FormField, { control: loanPaymentForm.control, name: "amount", render: ({ field }) => (_jsxs(FormItem, { className: "col-span-2", children: [_jsx(FormLabel, { children: "Monto" }), _jsx(FormControl, { children: _jsx(Input, { type: "number", ...field, step: "0.01" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: loanPaymentForm.control, name: "currency", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Moneda" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "CUP", children: "CUP" }), _jsx(SelectItem, { value: "USD", children: "USD" })] })] }), _jsx(FormMessage, {})] })) })] }), _jsx(DialogFooter, { children: _jsx(Button, { type: "submit", className: "rounded-full", children: "Registrar Pago" }) })] }) })] }) }), _jsx(Dialog, { open: isDebtPaymentDialogOpen, onOpenChange: setIsDebtPaymentDialogOpen, children: _jsxs(DialogContent, { className: "rounded-2xl max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Pago de Deuda" }), _jsx(DialogDescription, { children: debtToPay && `Deuda con: ${debtToPay.person}` })] }), _jsx(Form, { ...debtPaymentForm, children: _jsxs("form", { onSubmit: debtPaymentForm.handleSubmit(onDebtPaymentSubmit), className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(FormField, { control: debtPaymentForm.control, name: "amount", render: ({ field }) => (_jsxs(FormItem, { className: "col-span-2", children: [_jsx(FormLabel, { children: "Monto" }), _jsx(FormControl, { children: _jsx(Input, { type: "number", ...field, step: "0.01" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: debtPaymentForm.control, name: "currency", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Moneda" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "CUP", children: "CUP" }), _jsx(SelectItem, { value: "USD", children: "USD" })] })] }), _jsx(FormMessage, {})] })) })] }), _jsx(DialogFooter, { children: _jsx(Button, { type: "submit", className: "rounded-full", children: "Registrar Pago" }) })] }) })] }) }), _jsx(AlertDialog, { open: isRevertDialogOpen, onOpenChange: setIsRevertDialogOpen, children: _jsxs(AlertDialogContent, { className: "rounded-2xl", children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "\u00BFRevertir transacci\u00F3n?" }), _jsxs(AlertDialogDescription, { children: ["Se eliminar\u00E1 \"", transactionToRevert?.description, "\" y se restaurar\u00E1 el balance."] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { className: "rounded-full", children: "Cancelar" }), _jsx(AlertDialogAction, { onClick: handleRevertTransaction, className: "rounded-full", children: "Revertir" })] })] }) }), _jsx(Dialog, { open: isBagDialogOpen, onOpenChange: (open) => { if (!open) {
                        setIsBagDialogOpen(false);
                        setEditingBag(null);
                    } }, children: _jsxs(DialogContent, { className: "rounded-2xl max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: editingBag ? "Editar Bolsa" : "Agregar Bolsa" }), _jsx(DialogDescription, { children: editingBag ? "Modifica la bolsa." : "Crea una nueva bolsa de distribución." })] }), _jsx(Form, { ...bagForm, children: _jsxs("form", { onSubmit: bagForm.handleSubmit(onBagSubmit), className: "space-y-3", children: [_jsx(FormField, { control: bagForm.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Nombre" }), _jsx(FormControl, { children: _jsx(Input, { ...field, placeholder: "Ej: Vacaciones" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: bagForm.control, name: "percentage", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Porcentaje (%)" }), _jsx(FormControl, { children: _jsx(Input, { type: "number", ...field, step: "0.1" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: bagForm.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Descripci\u00F3n" }), _jsx(FormControl, { children: _jsx(Input, { ...field, placeholder: "Breve descripci\u00F3n" }) }), _jsx(FormMessage, {})] })) }), editingBag && (_jsx(FormField, { control: bagForm.control, name: "balance", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Saldo (CUP)" }), _jsx(FormControl, { children: _jsx(Input, { type: "number", ...field, step: "0.01" }) }), _jsx(FormMessage, {})] })) })), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(FormField, { control: bagForm.control, name: "icon", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Icono" }), _jsxs(Select, { onValueChange: field.onChange, value: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { className: "rounded-xl", children: _jsx(SelectValue, { placeholder: "Icono" }) }) }), _jsx(SelectContent, { children: ["Shield", "TrendingUp", "Home", "Gamepad2", "BookOpen", "Target", "PiggyBank", "Heart", "GraduationCap", "Sparkles", "DollarSign", "Plane", "Coffee"].map(key => (_jsx(SelectItem, { value: key, children: key }, key))) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: bagForm.control, name: "color", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Color" }), _jsxs(Select, { onValueChange: field.onChange, value: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { className: "rounded-xl", children: _jsx(SelectValue, { placeholder: "Color" }) }) }), _jsx(SelectContent, { children: [{ k: "rose", c: "bg-rose-500" }, { k: "blue", c: "bg-blue-500" }, { k: "amber", c: "bg-amber-500" }, { k: "green", c: "bg-green-500" }, { k: "violet", c: "bg-violet-500" }, { k: "orange", c: "bg-orange-500" }].map(({ k, c }) => (_jsx(SelectItem, { value: k, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-4 h-4 rounded-full ${c}` }), _jsx("span", { className: "capitalize", children: k })] }) }, k))) })] }), _jsx(FormMessage, {})] })) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", className: "rounded-full", onClick: () => { setIsBagDialogOpen(false); setEditingBag(null); }, children: "Cancelar" }), _jsx(Button, { type: "submit", className: "rounded-full", children: editingBag ? "Guardar" : "Agregar" })] })] }) })] }) }), _jsx(AlertDialog, { open: !!bagToDelete, onOpenChange: (open) => { if (!open)
                        setBagToDelete(null); }, children: _jsxs(AlertDialogContent, { className: "rounded-2xl", children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "\u00BFEliminar bolsa?" }), _jsxs(AlertDialogDescription, { children: ["Se eliminar\u00E1 \"", bagToDelete?.name, "\" de la distribuci\u00F3n."] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { className: "rounded-full", children: "Cancelar" }), _jsx(AlertDialogAction, { onClick: handleDeleteBag, className: "rounded-full bg-red-500 hover:bg-red-600", children: "Eliminar" })] })] }) }), _jsx(Dialog, { open: isGoalDialogOpen, onOpenChange: (open) => { if (!open) {
                        setIsGoalDialogOpen(false);
                        setEditingGoal(null);
                    } }, children: _jsxs(DialogContent, { className: "rounded-2xl max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: editingGoal ? "Editar Meta" : "Nueva Meta Financiera" }), _jsx(DialogDescription, { children: editingGoal ? "Modifica los detalles de la meta." : "Define un objetivo de ahorro." })] }), _jsx(Form, { ...goalForm, children: _jsxs("form", { onSubmit: goalForm.handleSubmit(onGoalSubmit), className: "space-y-3", children: [_jsx(FormField, { control: goalForm.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Nombre" }), _jsx(FormControl, { children: _jsx(Input, { ...field, placeholder: "Ej: Viaje a Jap\u00F3n" }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: goalForm.control, name: "targetAmount", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Meta (CUP)" }), _jsx(FormControl, { children: _jsx(Input, { type: "number", ...field, step: "0.01", placeholder: "Ej: 100000" }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(FormField, { control: goalForm.control, name: "icon", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Icono" }), _jsxs(Select, { onValueChange: field.onChange, value: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { className: "rounded-xl", children: _jsx(SelectValue, { placeholder: "Icono" }) }) }), _jsx(SelectContent, { children: ["Target", "PiggyBank", "Plane", "Heart", "GraduationCap", "Home", "Car", "Shield", "Sparkles", "DollarSign"].map(key => (_jsx(SelectItem, { value: key, children: key }, key))) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: goalForm.control, name: "color", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Color" }), _jsxs(Select, { onValueChange: field.onChange, value: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { className: "rounded-xl", children: _jsx(SelectValue, { placeholder: "Color" }) }) }), _jsx(SelectContent, { children: [{ k: "rose", c: "bg-rose-500" }, { k: "blue", c: "bg-blue-500" }, { k: "amber", c: "bg-amber-500" }, { k: "green", c: "bg-green-500" }, { k: "violet", c: "bg-violet-500" }, { k: "orange", c: "bg-orange-500" }].map(({ k, c }) => (_jsx(SelectItem, { value: k, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-4 h-4 rounded-full ${c}` }), _jsx("span", { className: "capitalize", children: k })] }) }, k))) })] }), _jsx(FormMessage, {})] })) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", className: "rounded-full", onClick: () => { setIsGoalDialogOpen(false); setEditingGoal(null); }, children: "Cancelar" }), _jsx(Button, { type: "submit", className: "rounded-full", children: editingGoal ? "Guardar" : "Crear Meta" })] })] }) })] }) }), _jsx(AlertDialog, { open: !!goalToDelete, onOpenChange: (open) => { if (!open)
                        setGoalToDelete(null); }, children: _jsxs(AlertDialogContent, { className: "rounded-2xl", children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "\u00BFEliminar meta?" }), _jsxs(AlertDialogDescription, { children: ["Se eliminar\u00E1 \"", goalToDelete?.name, "\" de tus metas financieras."] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { className: "rounded-full", children: "Cancelar" }), _jsx(AlertDialogAction, { onClick: handleDeleteGoal, className: "rounded-full bg-red-500 hover:bg-red-600", children: "Eliminar" })] })] }) }), _jsx(Dialog, { open: !!goalToDeposit, onOpenChange: (open) => { if (!open) {
                        setGoalToDeposit(null);
                        setDepositAmount(0);
                        setDepositWalletId("");
                    } }, children: _jsxs(DialogContent, { className: "rounded-2xl max-w-sm", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Abonar a Meta" }), _jsx(DialogDescription, { children: goalToDeposit && `Añade dinero a "${goalToDeposit.name}"` })] }), goalToDeposit && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "text-zinc-400", children: "Progreso actual" }), _jsxs("span", { className: cn("text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full", bagColorMap[goalToDeposit.color]?.badge || "bg-blue-500"), children: [goalToDeposit.targetAmount > 0 ? Math.round((goalToDeposit.currentAmount / goalToDeposit.targetAmount) * 100) : 0, "%"] })] }), _jsx("div", { className: "relative h-2 bg-zinc-200 dark:bg-zinc-950 rounded-full overflow-hidden", children: _jsx("div", { className: cn("h-full rounded-full transition-all duration-500", bagColorMap[goalToDeposit.color]?.bar || "bg-blue-500"), style: { width: `${Math.min((goalToDeposit.currentAmount / goalToDeposit.targetAmount) * 100, 100)}%` } }) }), _jsxs("div", { className: "flex justify-between text-xs text-zinc-500", children: [_jsxs("span", { children: [goalToDeposit.currentAmount.toLocaleString("es-ES", { minimumFractionDigits: 0 }), " CUP"] }), _jsxs("span", { className: "font-semibold text-zinc-700 dark:text-zinc-300", children: [goalToDeposit.targetAmount.toLocaleString("es-ES", { minimumFractionDigits: 0 }), " CUP"] })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "deposit-amount", children: "Cantidad a abonar (CUP)" }), _jsx(Input, { id: "deposit-amount", type: "number", value: depositAmount, onChange: (e) => setDepositAmount(parseFloat(e.target.value) || 0), className: "rounded-xl mt-1", placeholder: "Ej: 5000", step: "0.01" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "deposit-wallet", children: "Desde billetera" }), _jsxs(Select, { onValueChange: setDepositWalletId, value: depositWalletId, children: [_jsx(SelectTrigger, { id: "deposit-wallet", className: "rounded-xl mt-1", children: _jsx(SelectValue, { placeholder: "Selecciona billetera..." }) }), _jsx(SelectContent, { children: wallets.map(w => (_jsx(SelectItem, { value: w.id, children: _jsxs("div", { className: "flex items-center justify-between w-full", children: [_jsx("span", { children: w.name }), _jsxs("span", { className: "text-zinc-400 ml-2", children: [(w.balance * exchangeRate).toLocaleString("es-ES", { minimumFractionDigits: 0 }), " CUP"] })] }) }, w.id))) })] })] }), _jsx("div", { className: "flex gap-2", children: [1000, 5000, 10000, 50000].map(amount => (_jsxs(Button, { type: "button", variant: "outline", size: "sm", className: "rounded-full text-[10px] h-7", onClick: () => setDepositAmount(amount), children: ["+", amount.toLocaleString("es-ES")] }, amount))) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", className: "rounded-full", onClick: () => { setGoalToDeposit(null); setDepositAmount(0); }, children: "Cancelar" }), _jsxs(Button, { className: "rounded-full bg-blue-600 hover:bg-blue-700 text-white", disabled: depositAmount <= 0, onClick: handleDepositToGoal, children: [_jsx(PiggyBank, { className: "h-4 w-4 mr-1" }), " Abonar ", depositAmount.toLocaleString("es-ES", { minimumFractionDigits: 0 }), " CUP"] })] })] }))] }) }), _jsx(Dialog, { open: isDistributeIncomeDialogOpen, onOpenChange: setIsDistributeIncomeDialogOpen, children: _jsxs(DialogContent, { className: "rounded-2xl max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Distribuir Ingresos" }), _jsx(DialogDescription, { children: "Distribuye ingresos no asignados seg\u00FAn tus bolsas." })] }), (() => {
                                const total = undistributedIncomes.reduce((acc, t) => acc + t.amount, 0);
                                return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl", children: [_jsx("p", { className: "text-[10px] text-zinc-400", children: "Total a distribuir" }), _jsx(CurrencyDisplay, { usd: total, exchangeRate: exchangeRate, large: true }), _jsxs("p", { className: "text-[10px] text-zinc-400 mt-1", children: [undistributedIncomes.length, " ingreso(s) sin distribuir"] })] }), _jsx("div", { className: "space-y-1.5 max-h-60 overflow-y-auto", children: distributionBags.map(bag => {
                                                const amount = total * (bag.percentage / 100);
                                                const color = bagColorMap[bag.color] || bagColorMap.blue;
                                                return (_jsxs("div", { className: "flex items-center justify-between p-2.5 bg-zinc-50/50 dark:bg-zinc-950/30 rounded-xl", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: cn("p-1 rounded-lg", color.bg), children: _jsx("div", { className: cn("h-3 w-3", color.text) }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-zinc-700 dark:text-zinc-300", children: bag.name }), _jsxs("p", { className: "text-[10px] text-zinc-400", children: [bag.percentage, "%"] })] })] }), _jsx(CurrencyDisplay, { usd: amount, exchangeRate: exchangeRate })] }, bag.id));
                                            }) }), _jsxs(DialogFooter, { className: "gap-2", children: [_jsx(Button, { variant: "outline", className: "rounded-full", onClick: () => setIsDistributeIncomeDialogOpen(false), children: "Cancelar" }), _jsx(Button, { onClick: handleConfirmDistribution, className: "rounded-full bg-blue-600 hover:bg-blue-700 text-white", children: "Marcar como Distribuido" })] })] }));
                            })()] }) })] }) }));
}
