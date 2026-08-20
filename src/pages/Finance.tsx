import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { wallets as initialWallets, transactionCategories, defaultDistributionBags } from '@/lib/data';
import type { Wallet, Transaction, Loan, DistributionBag, Debt, FinancialGoal } from '@/lib/definitions';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  CalendarIcon, PlusCircle, Edit, Coins, LucideIcon, Wallet as WalletIcon,
  ArrowRightLeft, Download, Upload, DollarSign, Trash2, Plus, TrendingUp as TrendingUpIcon,
  LandPlot, BadgePercent, Scale, Target,
  Shield, Home, Gamepad2, BookOpen, PiggyBank, Heart,
  GraduationCap, Sparkles, Plane, Coffee, Banknote, CreditCard, Settings, X, Car,
} from 'lucide-react';
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
import {
  MonthlySummaryChart, CategorySpendChart, WalletDistributionChart,
  CashFlowTrendChart, DistributionBagChart, TrendIndicator, formatCurrency,
} from '@/components/finance/charts';

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

const defaultBudgetLimits: Record<string, number> = {
  'cat-food': 5000, 'cat-transport': 2000, 'cat-entertainment': 3000,
  'cat-health': 2000, 'cat-shopping': 3000, 'cat-education': 2000,
  'cat-personal': 1500, 'cat-coffee': 1000, 'cat-travel': 5000,
};

function CurrencyDisplay({ usd, exchangeRate, large = false }: { usd: number; exchangeRate: number; large?: boolean }) {
  const cup = usd * exchangeRate;
  return (
    <div className="flex flex-col">
      <span className={cn("font-semibold tracking-tight text-zinc-900 dark:text-zinc-100", large ? "text-lg sm:text-xl" : "text-sm")}>
        {cup.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CUP
      </span>
      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">${usd.toFixed(2)} USD</span>
    </div>
  );
}

function BudgetCategoryForm({
  availableCategories,
  onCancel,
  onSubmit,
}: {
  availableCategories: { id: string; name: string }[];
  onCancel: () => void;
  onSubmit: (categoryId: string, amount: number) => void;
}) {
  const [selectedCat, setSelectedCat] = useState('');
  const [budgetAmount, setBudgetAmount] = useState(1000);
  return (
    <div className="space-y-3">
      <div>
        <Label>Categoría</Label>
        <Select onValueChange={setSelectedCat} value={selectedCat}>
          <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
          <SelectContent>
            {availableCategories.length === 0 ? (
              <SelectItem value="__none__" disabled>Todas las categorías ya tienen presupuesto</SelectItem>
            ) : availableCategories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Límite Mensual (CUP)</Label>
        <Input type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(parseFloat(e.target.value) || 0)} className="rounded-xl mt-1" />
      </div>
      <DialogFooter>
        <Button variant="outline" className="rounded-full" onClick={onCancel}>Cancelar</Button>
        <Button className="rounded-full" disabled={!selectedCat} onClick={() => onSubmit(selectedCat, budgetAmount)}>Agregar</Button>
      </DialogFooter>
    </div>
  );
}


export default function Finance() {
  const {
    wallets, transactions, loans, debts, distributionBags, financialGoals, exchangeRate,
    setExchangeRate, isLoading, setWallets, setTransactions, setLoans,
    setDebts, setDistributionBags, addTransaction, deleteTransaction,
    updateWalletBalance, updateWallet, addWallet, deleteWallet, addLoan, updateLoan,
    addDebt, updateDebt, deleteDebt, addDistributionBag,
    updateDistributionBag, deleteDistributionBag,
    addFinancialGoal, updateFinancialGoal, deleteFinancialGoal,
  } = useFinance();

  const toUSD = (amount: number, currency: string) => currency === 'CUP' ? amount / exchangeRate : amount;

  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isDistributionDialogOpen, setIsDistributionDialogOpen] = useState(false);
  const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);
  const [isDebtDialogOpen, setIsDebtDialogOpen] = useState(false);
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
  const [transactionToRevert, setTransactionToRevert] = useState<Transaction | null>(null);
  const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null);
  const [isLoanPaymentDialogOpen, setIsLoanPaymentDialogOpen] = useState(false);
  const [loanToPay, setLoanToPay] = useState<Loan | null>(null);
  const [isDebtPaymentDialogOpen, setIsDebtPaymentDialogOpen] = useState(false);
  const [debtToPay, setDebtToPay] = useState<Debt | null>(null);
  const [isBagDialogOpen, setIsBagDialogOpen] = useState(false);
  const [editingBag, setEditingBag] = useState<DistributionBag | null>(null);
  const [bagToDelete, setBagToDelete] = useState<DistributionBag | null>(null);
  const [isDistributeIncomeDialogOpen, setIsDistributeIncomeDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);
  const [goalToDeposit, setGoalToDeposit] = useState<FinancialGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositWalletId, setDepositWalletId] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isWalletCreateDialogOpen, setIsWalletCreateDialogOpen] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);
  const [isBudgetCategoryDialogOpen, setIsBudgetCategoryDialogOpen] = useState(false);
  const [budgetLimits, setBudgetLimits] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('finance_budgetLimits');
      return stored ? JSON.parse(stored) : defaultBudgetLimits;
    } catch { return defaultBudgetLimits; }
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
          setBudgetLimits(data.content as unknown as Record<string, number>);
        }
      } catch {}
    })();
  }, []);

  // Persist budget limits to Supabase + local
  useEffect(() => {
    if (!isClient) return;
    try { localStorage.setItem('finance_budgetLimits', JSON.stringify(budgetLimits)); } catch {}
    (async () => {
      try {
        const { data: existing } = await supabase
          .from('text_sections')
          .select('id')
          .eq('section_key', 'finance_budgetLimits')
          .maybeSingle();
        if (existing) {
          await supabase.from('text_sections').update({ content: budgetLimits as any, updated_at: new Date().toISOString() }).eq('id', existing.id);
        } else {
          await supabase.from('text_sections').insert({ section_key: 'finance_budgetLimits', content: budgetLimits as any });
        }
      } catch {}
    })();
  }, [budgetLimits, isClient]);

  const transactionForm = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { description: '', amount: 0, currency: 'CUP', walletId: '', categoryId: '', type: 'expense' },
  });

  const walletForm = useForm<z.infer<typeof walletSchema>>({
    resolver: zodResolver(walletSchema),
    defaultValues: { name: '', balance: 0, currency: 'CUP' },
  });

  const transferForm = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: { amount: 0, currency: 'CUP', fromWalletId: '', toWalletId: '' },
  });

  const distributionForm = useForm<z.infer<typeof distributionSchema>>({
    resolver: zodResolver(distributionSchema),
    defaultValues: { amount: 0, currency: 'CUP', toWalletId: '' },
  });

  const loanForm = useForm<z.infer<typeof loanSchema>>({
    resolver: zodResolver(loanSchema),
    defaultValues: { person: '', description: '', amount: 0, currency: 'CUP', walletId: '' },
  });

  const loanPaymentForm = useForm<z.infer<typeof loanPaymentSchema>>({
    resolver: zodResolver(loanPaymentSchema),
    defaultValues: { amount: 0, currency: 'CUP' },
  });

  const debtForm = useForm<z.infer<typeof debtSchema>>({
    resolver: zodResolver(debtSchema),
    defaultValues: { person: '', description: '', amount: 0, currency: 'CUP', walletId: '' },
  });

  const debtPaymentForm = useForm<z.infer<typeof debtPaymentSchema>>({
    resolver: zodResolver(debtPaymentSchema),
    defaultValues: { amount: 0, currency: 'CUP' },
  });

  const bagForm = useForm<z.infer<typeof bagSchema>>({
    resolver: zodResolver(bagSchema),
    defaultValues: { name: '', percentage: 10, description: '', icon: 'Target', color: 'blue', balance: 0 },
  });

  const goalForm = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: { name: '', targetAmount: 0, icon: 'Target', color: 'blue' },
  });

  const walletCreateForm = useForm<z.infer<typeof walletCreateSchema>>({
    resolver: zodResolver(walletCreateSchema),
    defaultValues: { name: '', balance: 0, icon: 'Wallet', currency: 'CUP' },
  });

  const transactionType = transactionForm.watch('type');

  const totalBalance = useMemo(() => wallets.reduce((acc, w) => acc + w.balance, 0), [wallets]);
  const monthlyIncome = useMemo(() =>
    transactions.filter(t => t.type === 'income' && isThisMonth(t.date) && t.categoryId !== 'cat-transfer')
      .reduce((acc, t) => acc + t.amount, 0), [transactions]);
  const monthlyExpenses = useMemo(() =>
    transactions.filter(t => t.type === 'expense' && isThisMonth(t.date) && t.categoryId !== 'cat-transfer')
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

  const undistributedIncomes = useMemo(() =>
    transactions.filter(t => t.type === 'income' && !t.distributed && t.categoryId !== 'cat-transfer'),
    [transactions]);

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

  const getWalletIcon = useCallback((walletId: string): LucideIcon => {
    const wallet = initialWallets.find(w => w.id === walletId);
    return wallet?.icon || WalletIcon;
  }, []);

  const iconMap: Record<string, LucideIcon> = {
    Shield, TrendingUp: TrendingUpIcon, Home, Gamepad2, BookOpen, PiggyBank, Heart,
    GraduationCap, Sparkles, DollarSign, Plane, Coffee, Target, Wallet: WalletIcon,
    Banknote, CreditCard, Car,
  };

  const bagColorMap: Record<string, { bg: string; text: string; badge: string; bar: string }> = {
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

  const onTransactionSubmit = async (data: z.infer<typeof transactionSchema>) => {
    const wallet = wallets.find(w => w.id === data.walletId);
    if (!wallet) return;

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

  const onTransferSubmit = async (data: z.infer<typeof transferSchema>) => {
    const fromWallet = wallets.find(w => w.id === data.fromWalletId);
    const toWallet = wallets.find(w => w.id === data.toWalletId);
    if (!fromWallet || !toWallet) return;

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

  const onLoanSubmit = async (data: z.infer<typeof loanSchema>) => {
    const wallet = wallets.find(w => w.id === data.walletId);
    if (!wallet) return;

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

  const onDebtSubmit = async (data: z.infer<typeof debtSchema>) => {
    const wallet = wallets.find(w => w.id === data.walletId);
    if (!wallet) return;

    const amountUSD = toUSD(data.amount, data.currency);

    await addDebt({ person: data.person, description: data.description, totalAmount: amountUSD, paidAmount: 0, walletId: data.walletId, date: new Date(), dueDate: data.dueDate, status: 'outstanding' });

    toast({ title: "Deuda registrada", description: `Deuda con ${data.person} por ${data.amount} ${data.currency}` });
    setIsDebtDialogOpen(false);
    debtForm.reset();
  };

  const onLoanPaymentSubmit = async (data: z.infer<typeof loanPaymentSchema>) => {
    if (!loanToPay) return;
    const amountUSD = toUSD(data.amount, data.currency);
    const newPaid = loanToPay.paidAmount + amountUSD;
    const status = newPaid >= loanToPay.totalAmount ? 'paid' : 'outstanding';
    await updateLoan(loanToPay.id, { paidAmount: newPaid, status });

    toast({ title: "Pago registrado", description: `Cobrado ${data.amount} ${data.currency} de ${loanToPay.person}` });
    setIsLoanPaymentDialogOpen(false);
    setLoanToPay(null);
    loanPaymentForm.reset();
  };

  const onDebtPaymentSubmit = async (data: z.infer<typeof debtPaymentSchema>) => {
    if (!debtToPay) return;
    const wallet = wallets.find(w => w.id === debtToPay.walletId);
    if (!wallet) return;

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

  const openWalletDialog = (wallet: Wallet) => {
    setWalletToEdit(wallet);
    walletForm.reset({ name: wallet.name, balance: wallet.balance, currency: 'CUP' });
    setIsWalletDialogOpen(true);
  };

  const onWalletSubmit = async (data: z.infer<typeof walletSchema>) => {
    if (!walletToEdit) return;
    await updateWallet(walletToEdit.id, { balance: data.balance });
    toast({ title: "Billetera actualizada", description: `${walletToEdit.name}: ${data.balance} CUP` });
    setIsWalletDialogOpen(false);
    setWalletToEdit(null);
  };

  const openLoanPaymentDialog = (loan: Loan) => {
    setLoanToPay(loan);
    loanPaymentForm.reset({ amount: 0, currency: 'CUP' });
    setIsLoanPaymentDialogOpen(true);
  };

  const openDebtPaymentDialog = (debt: Debt) => {
    setDebtToPay(debt);
    debtPaymentForm.reset({ amount: 0, currency: 'CUP' });
    setIsDebtPaymentDialogOpen(true);
  };

  const handleRevertTransaction = async () => {
    if (!transactionToRevert) return;
    const wallet = wallets.find(w => w.id === transactionToRevert.walletId);
    if (!wallet) return;

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

  const onBagSubmit = async (data: z.infer<typeof bagSchema>) => {
    if (editingBag) {
      await updateDistributionBag(editingBag.id, { name: data.name, percentage: data.percentage, description: data.description, icon: data.icon, color: data.color, balance: data.balance ?? editingBag.balance });
    } else {
      await addDistributionBag({ name: data.name, description: data.description || '', percentage: data.percentage, icon: data.icon, color: data.color, balance: 0 });
    }
    setIsBagDialogOpen(false);
    setEditingBag(null);
    bagForm.reset();
  };

  const handleDeleteBag = () => {
    if (!bagToDelete) return;
    deleteDistributionBag(bagToDelete.id);
    setBagToDelete(null);
  };

  const onGoalSubmit = async (data: z.infer<typeof goalSchema>) => {
    if (editingGoal) {
      await updateFinancialGoal(editingGoal.id, { name: data.name, targetAmount: data.targetAmount, icon: data.icon, color: data.color });
    } else {
      await addFinancialGoal({ name: data.name, targetAmount: data.targetAmount, currentAmount: 0, icon: data.icon, color: data.color, createdAt: new Date() });
    }
    setIsGoalDialogOpen(false);
    setEditingGoal(null);
    goalForm.reset();
  };

  const handleDeleteGoal = () => {
    if (!goalToDelete) return;
    deleteFinancialGoal(goalToDelete.id);
    setGoalToDelete(null);
  };

  const handleDepositToGoal = () => {
    if (!goalToDeposit || depositAmount <= 0) return;
    if (!depositWalletId) {
      toast({ title: "Selecciona una billetera", description: "Elige de qué billetera saldrá el dinero.", variant: "destructive" });
      return;
    }
    const wallet = wallets.find(w => w.id === depositWalletId);
    if (!wallet) { toast({ title: "Billetera no encontrada", variant: "destructive" }); return; }
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

  const onWalletCreateSubmit = async (data: z.infer<typeof walletCreateSchema>) => {
    const newWallet: Wallet = { id: crypto.randomUUID(), name: data.name, balance: data.balance, icon: iconMap[data.icon] || WalletIcon };
    await addWallet(newWallet);
    toast({ title: "Billetera creada", description: `${data.name} creada con éxito` });
    setIsWalletCreateDialogOpen(false);
    walletCreateForm.reset();
  };

  const handleDeleteWallet = async () => {
    if (!walletToDelete) return;
    await deleteWallet(walletToDelete.id);
    toast({ title: "Billetera eliminada", description: `${walletToDelete.name} ha sido eliminada` });
    setWalletToDelete(null);
  };

  const handleRemoveBudgetCategory = (categoryId: string) => {
    setBudgetLimits(prev => {
      const updated = { ...prev };
      delete updated[categoryId];
      return updated;
    });
  };

  const handleAddBudgetCategory = (categoryId: string, amount: number) => {
    setBudgetLimits(prev => ({ ...prev, [categoryId]: amount }));
    setIsBudgetCategoryDialogOpen(false);
    toast({ title: "Presupuesto agregado", description: "Categoría agregada al presupuesto mensual" });
  };

  if (!isClient) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-4 border-zinc-300 border-t-zinc-600 rounded-full mx-auto" />
          <p className="text-sm text-zinc-500">Cargando datos financieros...</p>
        </div>
      </div>
    );
  }

  const renderDebtColumns = () => [
    {
      accessorKey: "date", header: "Fecha",
      cell: ({ row }: any) => <span className="text-sm text-zinc-500 dark:text-zinc-400">{format(new Date(row.original.date), "dd MMM yyyy", { locale: es })}</span>,
    },
    {
      accessorKey: "person", header: "Acreedor",
      cell: ({ row }: any) => <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{row.original.person}</span>,
    },
    {
      accessorKey: "description", header: "Descripción",
      cell: ({ row }: any) => <span className="text-sm text-zinc-500 dark:text-zinc-400">{row.original.description}</span>,
    },
    {
      accessorKey: "progress", header: "Progreso",
      cell: ({ row }: any) => {
        const progress = (row.original.paidAmount / row.original.totalAmount) * 100;
        return (
          <div className="flex items-center gap-3 min-w-[140px]">
            <Progress value={progress} className="h-1.5 rounded-full flex-1 bg-zinc-200 dark:bg-zinc-950" />
            <span className="text-xs font-medium text-zinc-500 w-10 text-right">{Math.round(progress)}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: "remaining", header: "Pendiente",
      cell: ({ row }: any) => {
        const remaining = row.original.totalAmount - row.original.paidAmount;
        return (
          <div className="text-right">
            <div className="text-sm font-semibold text-red-500">
              {(remaining * exchangeRate).toLocaleString("es-ES", { minimumFractionDigits: 2 })} CUP
            </div>
            <div className="text-xs text-zinc-400">${remaining.toFixed(2)} USD</div>
          </div>
        );
      },
    },
    {
      accessorKey: "status", header: "Estado",
      cell: ({ row }: any) => (
        <Badge className={`rounded-full text-xs px-3 py-0.5 font-medium ${
          row.original.status === "paid"
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
        }`}>
          {row.original.status === "paid" ? "Pagado" : "Pendiente"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: any) =>
        row.original.status === "outstanding" ? (
          <div className="flex justify-end">
            <Button size="sm" variant="outline" className="rounded-full h-8 text-xs px-3" onClick={() => openDebtPaymentDialog(row.original)}>
              <DollarSign className="h-3 w-3 mr-1" /> Pagar
            </Button>
          </div>
        ) : null,
    },
  ];

  const handleRevertClick = (transaction: Transaction) => {
    setTransactionToRevert(transaction);
    setIsRevertDialogOpen(true);
  };
  const transactionColumns = getTransactionColumns(initialWallets, transactionCategories, exchangeRate, handleRevertClick);
  const loanColumns = getLoanColumns(exchangeRate, openLoanPaymentDialog);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <header className="flex items-center gap-3 flex-wrap">
            <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Finanzas</h1>
            <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 hidden xl:block">Control financiero personal</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-400 whitespace-nowrap">$1 USD =</span>
              <Input
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                className="w-14 sm:w-16 h-6 text-[10px] font-semibold text-right rounded-lg border-zinc-200 dark:border-zinc-700"
              />
              <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300">CUP</span>
            </div>
          </header>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className={cn("rounded-full text-xs h-8 sm:h-9", isEditMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300")}
            >
              <Settings className="mr-1 h-3.5 w-3.5" /> {isEditMode ? "Hecho" : "Editar"}
            </Button>
            {/* Loan Dialog */}
            <Dialog open={isLoanDialogOpen} onOpenChange={setIsLoanDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full text-xs h-8 sm:h-9 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                  <LandPlot className="mr-1 h-3.5 w-3.5" /> Préstamo
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle>Nuevo Préstamo</DialogTitle>
                  <DialogDescription>Registra dinero que has prestado.</DialogDescription>
                </DialogHeader>
                <Form {...loanForm}>
                  <form onSubmit={loanForm.handleSubmit(onLoanSubmit)} className="space-y-3">
                    <FormField control={loanForm.control} name="person" render={({ field }) => (<FormItem><FormLabel>Persona</FormLabel><FormControl><Input {...field} placeholder="Ej: Juan Pérez" /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={loanForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Input {...field} placeholder="Ej: Para el almuerzo" /></FormControl><FormMessage /></FormItem>)}/>
                    <div className="grid grid-cols-3 gap-3">
                      <FormField control={loanForm.control} name="amount" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Monto</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={loanForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                    </div>
                    <FormField control={loanForm.control} name="walletId" render={({ field }) => (<FormItem><FormLabel>Billetera</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                    <DialogFooter><Button type="submit" className="rounded-full">Confirmar Préstamo</Button></DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            {/* Debt Dialog */}
            <Dialog open={isDebtDialogOpen} onOpenChange={setIsDebtDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full text-xs h-8 sm:h-9 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                  <BadgePercent className="mr-1 h-3.5 w-3.5" /> Deuda
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle>Registrar Deuda</DialogTitle>
                  <DialogDescription>Registra dinero que debes.</DialogDescription>
                </DialogHeader>
                <Form {...debtForm}>
                  <form onSubmit={debtForm.handleSubmit(onDebtSubmit)} className="space-y-3">
                    <FormField control={debtForm.control} name="person" render={({ field }) => (<FormItem><FormLabel>Acreedor</FormLabel><FormControl><Input {...field} placeholder="Ej: María García" /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={debtForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Input {...field} placeholder="Ej: Préstamo para el curso" /></FormControl><FormMessage /></FormItem>)}/>
                    <div className="grid grid-cols-3 gap-3">
                      <FormField control={debtForm.control} name="amount" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Monto</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={debtForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                    </div>
                    <FormField control={debtForm.control} name="walletId" render={({ field }) => (<FormItem><FormLabel>Billetera</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                    <FormField control={debtForm.control} name="dueDate" render={({ field }) => (
                      <FormItem className="flex flex-col"><FormLabel>Vencimiento (opcional)</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className="w-full pl-3 text-left font-normal rounded-full">
                          {field.value ? format(field.value, "PPP", { locale: es }) : "Elige una fecha"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover><FormMessage />
                      </FormItem>
                    )} />
                    <DialogFooter><Button type="submit" className="rounded-full">Registrar Deuda</Button></DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            {/* Transfer Dialog */}
            <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full text-xs h-8 sm:h-9 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                  <ArrowRightLeft className="mr-1 h-3.5 w-3.5" /> Traspaso
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle>Nuevo Traspaso</DialogTitle>
                  <DialogDescription>Mueve dinero entre billeteras.</DialogDescription>
                </DialogHeader>
                <Form {...transferForm}>
                  <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <FormField control={transferForm.control} name="amount" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Monto</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={transferForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                    </div>
                    <FormField control={transferForm.control} name="fromWalletId" render={({ field }) => (<FormItem><FormLabel>Desde</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Origen" /></SelectTrigger></FormControl><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                    <FormField control={transferForm.control} name="toWalletId" render={({ field }) => (<FormItem><FormLabel>Hacia</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Destino" /></SelectTrigger></FormControl><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                    <DialogFooter><Button type="submit" className="rounded-full">Confirmar Traspaso</Button></DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            {/* New Transaction Dialog */}
            <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenTransactionDialog} size="sm" className="rounded-full text-xs h-8 sm:h-9 bg-blue-600 hover:bg-blue-700 text-white">
                  <PlusCircle className="mr-1 h-3.5 w-3.5" /> Nueva
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle>Nueva Transacción</DialogTitle>
                  <DialogDescription>Registra un ingreso o gasto.</DialogDescription>
                </DialogHeader>
                <Form {...transactionForm}>
                  <form onSubmit={transactionForm.handleSubmit(onTransactionSubmit)} className="space-y-3">
                    <FormField control={transactionForm.control} name="type" render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="expense">Gasto</SelectItem><SelectItem value="income">Ingreso</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                    <FormField control={transactionForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Input {...field} placeholder="Ej: Café con amigos" /></FormControl><FormMessage /></FormItem>)}/>
                    <div className="grid grid-cols-3 gap-3">
                      <FormField control={transactionForm.control} name="amount" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Monto</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={transactionForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={transactionForm.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Fecha</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className="w-full pl-3 text-left font-normal rounded-full">{field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                      <FormField control={transactionForm.control} name="walletId" render={({ field }) => (<FormItem><FormLabel>Billetera</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                    </div>
                    <FormField control={transactionForm.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent>{transactionCategories.filter(c => c.type === transactionType).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                    <DialogFooter><Button type="submit" className="rounded-full">Guardar</Button></DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="h-px bg-zinc-200/50 dark:bg-zinc-950/50" />

        {/* Summary Cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden">
            <div className="h-0.5 bg-blue-500" />
            <CardContent className="p-2.5 sm:p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Balance Total</span>
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600">
                  <Coins className="h-3.5 w-3.5" />
                </div>
              </div>
              <CurrencyDisplay usd={totalBalance} exchangeRate={exchangeRate} large />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden">
            <div className="h-0.5 bg-green-500" />
            <CardContent className="p-2.5 sm:p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ingresos del Mes</span>
                <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-600">
                  <Download className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CurrencyDisplay usd={monthlyIncome} exchangeRate={exchangeRate} large />
                <TrendIndicator value={incomeChange} />
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className={cn("text-[10px] font-medium", incomeChange >= 0 ? "text-green-500" : "text-red-500")}>
                  {incomeChange >= 0 ? "+" : ""}{incomeChange.toFixed(1)}%
                </span>
                <span className="text-[10px] text-zinc-400">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden">
            <div className="h-0.5 bg-red-400" />
            <CardContent className="p-2.5 sm:p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Gastos del Mes</span>
                <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500">
                  <Upload className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CurrencyDisplay usd={monthlyExpenses} exchangeRate={exchangeRate} large />
                <TrendIndicator value={-expenseChange} />
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className={cn("text-[10px] font-medium", expenseChange <= 0 ? "text-green-500" : "text-red-500")}>
                  {expenseChange >= 0 ? "+" : ""}{expenseChange.toFixed(1)}%
                </span>
                <span className="text-[10px] text-zinc-400">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden">
            <div className={cn("h-0.5", monthlyBalance >= 0 ? "bg-green-500" : "bg-red-400")} />
            <CardContent className="p-2.5 sm:p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Balance Mensual</span>
                <div className={cn("p-1.5 rounded-lg", monthlyBalance >= 0 ? "bg-green-50 dark:bg-green-500/10 text-green-600" : "bg-red-50 dark:bg-red-500/10 text-red-500")}>
                  <Scale className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className={cn(monthlyBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500")}>
                <CurrencyDisplay usd={monthlyBalance} exchangeRate={exchangeRate} large />
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] font-medium">{savingsRate.toFixed(1)}%</span>
                <span className="text-[10px] text-zinc-400">tasa de ahorro</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Sections Tabs */}
        <Tabs defaultValue="resumen" className="space-y-3">
          <TabsList className="inline-flex h-8 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-950 gap-0.5 flex-wrap">
            <TabsTrigger value="resumen" className="rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100">Resumen</TabsTrigger>
            <TabsTrigger value="presupuesto" className="rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100">Presupuesto</TabsTrigger>
            <TabsTrigger value="billeteras" className="rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100">Billeteras</TabsTrigger>
            <TabsTrigger value="distribucion" className="rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100">Distribución</TabsTrigger>
            <TabsTrigger value="metas" className="rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100">Metas</TabsTrigger>
            <TabsTrigger value="movimientos" className="rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100">Movimientos</TabsTrigger>
            <TabsTrigger value="prestamos" className="rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100">Préstamos</TabsTrigger>
            <TabsTrigger value="deudas" className="rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100">Deudas</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-3">
            {/* Charts Section */}
            <div className="grid gap-3 md:grid-cols-2">
          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
            <CardHeader className="pb-1 px-4 pt-4">
              <CardTitle className="text-sm text-zinc-900 dark:text-zinc-100">Resumen 6 Meses</CardTitle>
              <CardDescription className="text-xs text-zinc-400">Ingresos vs Gastos</CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              <MonthlySummaryChart data={chartData.monthlySummary} />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
            <CardHeader className="pb-1 px-4 pt-4">
              <CardTitle className="text-sm text-zinc-900 dark:text-zinc-100">Gastos por Categoría</CardTitle>
              <CardDescription className="text-xs text-zinc-400">Distribución del mes</CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              <CategorySpendChart data={chartData.categorySpend} />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
            <CardHeader className="pb-1 px-4 pt-4">
              <CardTitle className="text-sm text-zinc-900 dark:text-zinc-100">Distribución de Balance</CardTitle>
              <CardDescription className="text-xs text-zinc-400">Por billetera</CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              <WalletDistributionChart data={chartData.walletDistribution} />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
            <CardHeader className="pb-1 px-4 pt-4">
              <CardTitle className="text-sm text-zinc-900 dark:text-zinc-100">Tendencia del Balance</CardTitle>
              <CardDescription className="text-xs text-zinc-400">Evolución patrimonial</CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              <CashFlowTrendChart data={chartData.cashFlowTrend} />
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          <TabsContent value="presupuesto" className="space-y-3">
            <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm text-zinc-900 dark:text-zinc-100">Presupuesto Mensual</CardTitle>
                <CardDescription className="text-xs text-zinc-400">Gastado vs Presupuestado</CardDescription>
              </div>
              {isEditMode && (
                <Button variant="outline" size="sm" className="rounded-full text-[10px] h-7 border-zinc-200 dark:border-zinc-700" onClick={() => setIsBudgetCategoryDialogOpen(true)}>
                  <Plus className="mr-1 h-3 w-3" /> Categoría
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {budgetData.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4">Establece límites de presupuesto para tus categorías de gasto.</p>
            ) : (
              <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {budgetData.map(({ category, spent, limit, percentage }) => (
                  <div key={category.id} className="p-2.5 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        {isEditMode && (
                          <Button variant="ghost" size="icon" className="h-4 w-4 shrink-0 rounded-full text-red-400 hover:text-red-600" onClick={() => handleRemoveBudgetCategory(category.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                        <span className="font-medium text-xs text-zinc-700 dark:text-zinc-300 truncate">{category.name}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0",
                        percentage > 100 ? "bg-red-50 text-red-500 dark:bg-red-500/10" :
                        percentage > 80 ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" :
                        "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                      )}>
                        {Math.round(percentage)}%
                      </span>
                    </div>
                    <div className="relative h-1.5 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          percentage > 100 ? "bg-red-400" : percentage > 80 ? "bg-amber-400" : "bg-blue-500"
                        )}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-zinc-400 truncate">{formatCurrency(spent)} <span className="text-zinc-300 dark:text-zinc-600">/</span> {formatCurrency(limit)}</span>
                      <Input
                        type="number"
                        value={limit}
                        onChange={(e) => setBudgetLimits(prev => ({ ...prev, [category.id]: parseFloat(e.target.value) || 0 }))}
                        className="h-6 text-[10px] w-20 text-right rounded-lg border-zinc-200 dark:border-zinc-700"
                        placeholder="Límite"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isEditMode && budgetData.length > 0 && (
              <div className="pt-2 text-center">
                <Button variant="ghost" size="sm" className="rounded-full text-[10px] h-7 text-zinc-400 hover:text-zinc-700" onClick={() => setIsBudgetCategoryDialogOpen(true)}>
                  <Plus className="mr-1 h-3 w-3" /> Agregar categoría al presupuesto
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="billeteras" className="space-y-3">
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Billeteras</h2>
              <p className="text-[10px] sm:text-xs text-zinc-400">{wallets.length} billeteras · Total: {(totalBalance * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
            </div>
            {isEditMode && (
              <Button size="sm" className="rounded-full text-[10px] h-7 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { walletCreateForm.reset({ name: '', balance: 0, icon: 'Wallet', currency: 'CUP' }); setIsWalletCreateDialogOpen(true); }}>
                <Plus className="mr-1 h-3 w-3" /> Agregar
              </Button>
            )}
          </div>
          <div className="grid gap-2 sm:gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {wallets.map((wallet, idx) => {
              const Icon = getWalletIcon(wallet.id);
              return (
                <Card key={wallet.id} className="border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl hover:shadow-md transition-all duration-200" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-lg bg-zinc-100 dark:bg-zinc-950">
                          <Icon className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{wallet.name}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300" onClick={() => openWalletDialog(wallet)}>
                          <Edit className="h-2.5 w-2.5" />
                        </Button>
                        {isEditMode && (
                          <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full text-red-400 hover:text-red-600" onClick={() => setWalletToDelete(wallet)}>
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {(wallet.balance * exchangeRate).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-zinc-400">CUP · ${wallet.balance.toFixed(2)} USD</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
          </TabsContent>

          <TabsContent value="distribucion" className="space-y-3">
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Distribución</h2>
              <p className="text-[10px] sm:text-xs text-zinc-400">Método JARS · 6 bolsas</p>
            </div>
            <div className="flex items-center gap-1.5">
              {(() => {
                const totalUndistributed = undistributedIncomes.reduce((acc, t) => acc + t.amount, 0);
                if (totalUndistributed > 0) {
                  return (
                    <Button onClick={() => setIsDistributeIncomeDialogOpen(true)} size="sm" className="rounded-full text-[10px] h-7 bg-blue-600 hover:bg-blue-700 text-white">
                      <Coins className="mr-1 h-3 w-3" />
                      Distribuir {formatCurrency(totalUndistributed * exchangeRate)}
                    </Button>
                  );
                }
                return null;
              })()}
              <Button variant="outline" size="sm" className="rounded-full text-[10px] h-7 border-zinc-200 dark:border-zinc-700" onClick={() => { setEditingBag(null); bagForm.reset({ name: "", percentage: 10, description: "", icon: "Target", color: "blue" }); setIsBagDialogOpen(true); }}>
                <Plus className="mr-1 h-3 w-3" /> Bolsa
              </Button>
            </div>
          </div>

          {distributionBags.length === 0 ? (
            <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
              <CardContent className="p-6 text-center text-xs text-zinc-400">
                No hay bolsas de distribución. Crea una para empezar.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
                <CardContent className="p-2.5 sm:p-3">
                  <DistributionBagChart data={distributionBags.map(b => ({ name: b.name, percentage: b.percentage, color: b.color }))} />
                </CardContent>
              </Card>
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] sm:text-xs text-zinc-400">
                    <span>Distribución: {distributionBags.reduce((acc, b) => acc + b.percentage, 0)}%</span>
                    {(() => {
                      const total = distributionBags.reduce((acc, b) => acc + b.percentage, 0);
                      if (total === 100) return <span className="text-green-500 font-medium">100%</span>;
                      if (total > 100) return <span className="text-red-500 font-medium">Excede {total - 100}%</span>;
                      return <span className="text-amber-500 font-medium">Falta {100 - total}%</span>;
                    })()}
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden flex">
                    {distributionBags.map((bag) => {
                      const color = bagColorMap[bag.color] || bagColorMap.blue;
                      return (
                        <div
                          key={bag.id}
                          className={cn(color.bar, "transition-all duration-500 first:rounded-l-full last:rounded-r-full")}
                          style={{ width: `${bag.percentage}%`, minWidth: bag.percentage > 0 ? "4px" : "0" }}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="grid gap-2 grid-cols-2 lg:grid-cols-3">
                  {distributionBags.map((bag, idx) => {
                    const IconComponent = iconMap[bag.icon] || WalletIcon;
                    const color = bagColorMap[bag.color] || bagColorMap.blue;
                    return (
                      <Card key={bag.id} className="border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl hover:shadow-md transition-all duration-200" style={{ animationDelay: `${idx * 0.05}s` }}>
                        <CardContent className="p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className={cn("p-1 rounded-lg", color.bg)}>
                                <IconComponent className={cn("h-3 w-3", color.text)} />
                              </div>
                              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{bag.name}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full text-zinc-400 hover:text-zinc-700" onClick={() => { setEditingBag(bag); bagForm.reset({ name: bag.name, percentage: bag.percentage, description: bag.description, icon: bag.icon, color: bag.color }); setIsBagDialogOpen(true); }}>
                                <Edit className="h-2.5 w-2.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full text-red-400 hover:text-red-600" onClick={() => setBagToDelete(bag)}>
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={cn("text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full", color.badge)}>{bag.percentage}%</span>
                            <CurrencyDisplay usd={bag.balance || 0} exchangeRate={exchangeRate} />
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-relaxed truncate">{bag.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
          </TabsContent>

          <TabsContent value="metas" className="space-y-3">
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Metas Financieras</h2>
              <p className="text-[10px] sm:text-xs text-zinc-400">Alcanza tus objetivos de ahorro</p>
            </div>
            {isEditMode && (
              <Button size="sm" className="rounded-full text-[10px] h-7 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setEditingGoal(null); goalForm.reset({ name: '', targetAmount: 0, icon: 'Target', color: 'blue' }); setIsGoalDialogOpen(true); }}>
                <Plus className="mr-1 h-3 w-3" /> Meta
              </Button>
            )}
          </div>

          {financialGoals.length === 0 ? (
            <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
              <CardContent className="p-6 text-center text-xs text-zinc-400">
                {isEditMode ? 'Crea tu primera meta financiera.' : 'No hay metas financieras definidas.'}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {financialGoals.map((goal) => {
                const IconComponent = iconMap[goal.icon] || PiggyBank;
                const color = bagColorMap[goal.color] || bagColorMap.blue;
                const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                return (
                  <Card key={goal.id} className="border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl hover:shadow-md transition-all duration-200">
                    <CardContent className="p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1.5 rounded-xl", color.bg)}>
                            <IconComponent className={cn("h-4 w-4", color.text)} />
                          </div>
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{goal.name}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {isEditMode && (
                            <>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-zinc-400 hover:text-zinc-700" onClick={() => { setEditingGoal(goal); goalForm.reset({ name: goal.name, targetAmount: goal.targetAmount, icon: goal.icon, color: goal.color }); setIsGoalDialogOpen(true); }}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-red-400 hover:text-red-600" onClick={() => setGoalToDelete(goal)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {goal.currentAmount.toLocaleString("es-ES", { minimumFractionDigits: 0 })} CUP
                          </span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                            {goal.targetAmount.toLocaleString("es-ES", { minimumFractionDigits: 0 })} CUP
                          </span>
                        </div>
                        <div className="relative h-2 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", color.bar)}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={cn("text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full", color.badge)}>
                            {Math.round(progress)}%
                          </span>
                          <Button
                            size="sm"
                            className="rounded-full text-[10px] h-7 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => { setGoalToDeposit(goal); setDepositAmount(0); setDepositWalletId(""); }}
                          >
                            <PiggyBank className="h-3 w-3 mr-1" /> Abonar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
          </TabsContent>

          <TabsContent value="movimientos" className="space-y-3">
            <Tabs defaultValue="expenses" className="space-y-2">
              <TabsList className="inline-flex h-8 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-950 gap-0.5">
                <TabsTrigger value="expenses" className="rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100">Gastos</TabsTrigger>
                <TabsTrigger value="incomes" className="rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100">Ingresos</TabsTrigger>
                <TabsTrigger value="transfers" className="rounded-md text-[10px] sm:text-xs px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm text-zinc-500 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100">Traspasos</TabsTrigger>
              </TabsList>

          <TabsContent value="expenses">
            <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm text-zinc-900 dark:text-zinc-100">Gastos</CardTitle>
                <CardDescription className="text-xs text-zinc-400">{expenses.length} transacciones</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-4">
                <DataTable columns={transactionColumns} data={expenses} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incomes" className="space-y-3">
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
              <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
                <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Ingresos este mes</p>
                  <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">{(monthlyIncome * exchangeRate).toLocaleString("es-ES", { minimumFractionDigits: 2 })} CUP</p>
                  <p className="text-[10px] text-zinc-400">${monthlyIncome.toFixed(2)} USD</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
                <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Transacciones</p>
                  <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">{incomes.filter(t => isThisMonth(t.date)).length}</p>
                  <p className="text-[10px] text-zinc-400">este mes</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
                <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Promedio</p>
                  <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {incomes.filter(t => isThisMonth(t.date)).length > 0
                      ? `${((monthlyIncome / incomes.filter(t => isThisMonth(t.date)).length) * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })}`
                      : "0"}
                  </p>
                  <p className="text-[10px] text-zinc-400">CUP por ingreso</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm text-zinc-900 dark:text-zinc-100">Ingresos</CardTitle>
                    <CardDescription className="text-xs text-zinc-400">Historial</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full text-[10px] h-7 border-zinc-200 dark:border-zinc-700" onClick={() => {
                    transactionForm.reset({ description: "", amount: 0, currency: "CUP", date: new Date(), walletId: "", categoryId: "", type: "income" });
                    setIsTransactionDialogOpen(true);
                  }}>
                    <PlusCircle className="w-3 h-3 mr-1" /> Nuevo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-2 sm:px-4">
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {[
                    { label: "Salario", category: "cat-income-1" },
                    { label: "Freelance", category: "cat-income-2" },
                    { label: "Venta", category: "cat-income-1" },
                    { label: "Devolución", category: "cat-income-2" },
                  ].map(preset => (
                    <Button key={preset.label} variant="outline" size="sm" className="rounded-full text-[10px] h-7 border-zinc-200 dark:border-zinc-700" onClick={() => {
                      transactionForm.reset({ description: preset.label, amount: 0, currency: "CUP", date: new Date(), walletId: "", categoryId: preset.category, type: "income" });
                      setIsTransactionDialogOpen(true);
                    }}>
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <DataTable columns={transactionColumns} data={incomes} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transfers">
            <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm text-zinc-900 dark:text-zinc-100">Traspasos</CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-4">
                <DataTable columns={transactionColumns} data={transfers} />
              </CardContent>
            </Card>
          </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="prestamos" className="space-y-3">
            {(() => {
              const outstandingLoans = loans.filter(l => l.status === "outstanding");
              const paidLoans = loans.filter(l => l.status === "paid");
              const totalLent = outstandingLoans.reduce((acc, l) => acc + l.totalAmount, 0);
              const totalRecovered = outstandingLoans.reduce((acc, l) => acc + l.paidAmount, 0);
              const totalPending = totalLent - totalRecovered;
              return (
                <>
                  <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                    <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
                      <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Prestado activo</p>
                        <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">{(totalLent * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
                      <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Recuperado</p>
                        <p className="text-sm sm:text-base font-bold text-green-600">{(totalRecovered * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
                      <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Por cobrar</p>
                        <p className="text-sm sm:text-base font-bold text-amber-600">{(totalPending * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
                      <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Préstamos</p>
                        <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">{outstandingLoans.length} activos</p>
                        <p className="text-[10px] text-zinc-400">{paidLoans.length} pagados</p>
                      </CardContent>
                    </Card>
                  </div>

                  {outstandingLoans.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Pendientes</h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {outstandingLoans.map(loan => {
                          const progress = (loan.paidAmount / loan.totalAmount) * 100;
                          const remaining = loan.totalAmount - loan.paidAmount;
                          return (
                            <Card key={loan.id} className={cn("border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", "ring-1 ring-amber-500/10")}>
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-0.5">
                                    <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{loan.person}</h4>
                                    <p className="text-[10px] text-zinc-400">{loan.description}</p>
                                    <p className="text-[10px] text-zinc-400">{format(new Date(loan.date), "dd MMM yyyy", { locale: es })}</p>
                                  </div>
                                  <Button size="sm" variant="outline" className="rounded-full text-[10px] h-7 border-zinc-200 dark:border-zinc-700" onClick={() => openLoanPaymentDialog(loan)}>
                                    <DollarSign className="h-3 w-3 mr-1" /> Cobrar
                                  </Button>
                                </div>
                                <div className="space-y-1">
                                  <Progress value={progress} className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-950" />
                                  <div className="flex justify-between text-[10px] text-zinc-400">
                                    <span>Pagado: {(loan.paidAmount * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</span>
                                    <span>Falta: {(remaining * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {paidLoans.length > 0 && (
                    <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
                      <CardHeader className="pb-2 px-4 pt-4">
                        <CardTitle className="text-sm text-zinc-900 dark:text-zinc-100">Completados ({paidLoans.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 space-y-1.5">
                        {paidLoans.map(loan => (
                          <div key={loan.id} className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-700 dark:text-zinc-300">{loan.person}</span>
                              <span className="text-zinc-400">— {loan.description}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-700 dark:text-zinc-300">{(loan.totalAmount * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</span>
                              <Badge className="rounded-full text-[10px] px-2 bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">Pagado</Badge>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
                    <CardHeader className="pb-2 px-4 pt-4">
                      <CardTitle className="text-sm text-zinc-900 dark:text-zinc-100">Todos los Préstamos</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-4">
                      <DataTable columns={loanColumns} data={loans} />
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </TabsContent>

          <TabsContent value="deudas" className="space-y-3">
            {(() => {
              const outstandingDebts = debts.filter(d => d.status === "outstanding");
              const paidDebts = debts.filter(d => d.status === "paid");
              const totalDebt = outstandingDebts.reduce((acc, d) => acc + d.totalAmount, 0);
              const totalPaid = outstandingDebts.reduce((acc, d) => acc + d.paidAmount, 0);
              const totalRemaining = totalDebt - totalPaid;
              return (
                <>
                  <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                    <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
                      <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Deuda activa</p>
                        <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">{(totalDebt * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
                      <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Pagado</p>
                        <p className="text-sm sm:text-base font-bold text-green-600">{(totalPaid * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
                      <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Por pagar</p>
                        <p className="text-sm sm:text-base font-bold text-red-500">{(totalRemaining * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
                      <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Deudas</p>
                        <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">{outstandingDebts.length} activas</p>
                        <p className="text-[10px] text-zinc-400">{paidDebts.length} pagadas</p>
                      </CardContent>
                    </Card>
                  </div>

                  {outstandingDebts.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Pendientes</h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {outstandingDebts.map(debt => {
                          const progress = (debt.paidAmount / debt.totalAmount) * 100;
                          const remaining = debt.totalAmount - debt.paidAmount;
                          const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date();
                          return (
                            <Card key={debt.id} className={cn("border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl", isOverdue ? "ring-1 ring-red-500/20" : "ring-1 ring-zinc-200/50 dark:ring-zinc-700/50")}>
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{debt.person}</h4>
                                      {isOverdue && <Badge className="rounded-full text-[10px] px-2 bg-red-50 text-red-500 dark:bg-red-500/10">Vencida</Badge>}
                                    </div>
                                    <p className="text-[10px] text-zinc-400">{debt.description}</p>
                                    <p className="text-[10px] text-zinc-400">
                                      {format(new Date(debt.date), "dd MMM yyyy", { locale: es })}
                                      {debt.dueDate && ` · Vence: ${format(new Date(debt.dueDate), "dd MMM yyyy", { locale: es })}`}
                                    </p>
                                  </div>
                                  <Button size="sm" className="rounded-full text-[10px] h-7 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => openDebtPaymentDialog(debt)}>
                                    <DollarSign className="h-3 w-3 mr-1" /> Pagar
                                  </Button>
                                </div>
                                <div className="space-y-1">
                                  <Progress value={progress} className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-950" />
                                  <div className="flex justify-between text-[10px] text-zinc-400">
                                    <span>Pagado: {(debt.paidAmount * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</span>
                                    <span className="text-red-500 font-medium">Falta: {(remaining * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {paidDebts.length > 0 && (
                    <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
                      <CardHeader className="pb-2 px-4 pt-4">
                        <CardTitle className="text-sm text-zinc-900 dark:text-zinc-100">Pagadas ({paidDebts.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 space-y-1.5">
                        {paidDebts.map(debt => (
                          <div key={debt.id} className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-700 dark:text-zinc-300">{debt.person}</span>
                              <span className="text-zinc-400">— {debt.description}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-700 dark:text-zinc-300">{(debt.totalAmount * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</span>
                              <Badge className="rounded-full text-[10px] px-2 bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">Pagado</Badge>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 rounded-2xl">
                    <CardHeader className="pb-2 px-4 pt-4">
                      <CardTitle className="text-sm text-zinc-900 dark:text-zinc-100">Todas las Deudas</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-4">
                      <DataTable columns={renderDebtColumns()} data={debts} />
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </TabsContent>
        </Tabs>

        {/* Edit Wallet Dialog */}
        <Dialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Billetera</DialogTitle>
              <DialogDescription>Modifica el saldo.</DialogDescription>
            </DialogHeader>
            <Form {...walletForm}>
              <form onSubmit={walletForm.handleSubmit(onWalletSubmit)} className="space-y-3">
                <FormField control={walletForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>)}/>
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={walletForm.control} name="balance" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Nuevo Saldo</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={walletForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                </div>
                <DialogFooter><Button type="submit" className="rounded-full">Guardar Cambios</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Wallet Create Dialog */}
        <Dialog open={isWalletCreateDialogOpen} onOpenChange={setIsWalletCreateDialogOpen}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>Nueva Billetera</DialogTitle>
              <DialogDescription>Crea una nueva billetera para gestionar tu dinero.</DialogDescription>
            </DialogHeader>
            <Form {...walletCreateForm}>
              <form onSubmit={walletCreateForm.handleSubmit(onWalletCreateSubmit)} className="space-y-3">
                <FormField control={walletCreateForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} placeholder="Ej: Ahorros" /></FormControl><FormMessage /></FormItem>)}/>
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={walletCreateForm.control} name="balance" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Saldo Inicial</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={walletCreateForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                </div>
                <FormField control={walletCreateForm.control} name="icon" render={({ field }) => (
                  <FormItem><FormLabel>Icono</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Icono" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["Wallet","Banknote","CreditCard","PiggyBank","Target","DollarSign","Coins"].map(key => (
                          <SelectItem key={key} value={key}>{key}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
                <DialogFooter><Button type="submit" className="rounded-full">Crear Billetera</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Wallet Dialog */}
        <AlertDialog open={!!walletToDelete} onOpenChange={(open) => { if (!open) setWalletToDelete(null); }}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar billetera?</AlertDialogTitle>
              <AlertDialogDescription>Se eliminará "{walletToDelete?.name}" de tus billeteras. Las transacciones asociadas se conservarán.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteWallet} className="rounded-full bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Budget Category Dialog */}
        <Dialog open={isBudgetCategoryDialogOpen} onOpenChange={setIsBudgetCategoryDialogOpen}>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle>Agregar al Presupuesto</DialogTitle>
              <DialogDescription>Selecciona una categoría y define su límite mensual.</DialogDescription>
            </DialogHeader>
            <BudgetCategoryForm
              availableCategories={transactionCategories.filter(c => c.type === 'expense' && !budgetLimits[c.id])}
              onCancel={() => setIsBudgetCategoryDialogOpen(false)}
              onSubmit={handleAddBudgetCategory}
            />

          </DialogContent>
        </Dialog>

        {/* Loan Payment Dialog */}
        <Dialog open={isLoanPaymentDialogOpen} onOpenChange={setIsLoanPaymentDialogOpen}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>Pago de Préstamo</DialogTitle>
              <DialogDescription>{loanToPay && `Préstamo a: ${loanToPay.person}`}</DialogDescription>
            </DialogHeader>
            <Form {...loanPaymentForm}>
              <form onSubmit={loanPaymentForm.handleSubmit(onLoanPaymentSubmit)} className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={loanPaymentForm.control} name="amount" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Monto</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={loanPaymentForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                </div>
                <DialogFooter><Button type="submit" className="rounded-full">Registrar Pago</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Debt Payment Dialog */}
        <Dialog open={isDebtPaymentDialogOpen} onOpenChange={setIsDebtPaymentDialogOpen}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>Pago de Deuda</DialogTitle>
              <DialogDescription>{debtToPay && `Deuda con: ${debtToPay.person}`}</DialogDescription>
            </DialogHeader>
            <Form {...debtPaymentForm}>
              <form onSubmit={debtPaymentForm.handleSubmit(onDebtPaymentSubmit)} className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={debtPaymentForm.control} name="amount" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Monto</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={debtPaymentForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                </div>
                <DialogFooter><Button type="submit" className="rounded-full">Registrar Pago</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Revert Transaction Dialog */}
        <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Revertir transacción?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará "{transactionToRevert?.description}" y se restaurará el balance.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleRevertTransaction} className="rounded-full">Revertir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bag Dialog */}
        <Dialog open={isBagDialogOpen} onOpenChange={(open) => { if (!open) { setIsBagDialogOpen(false); setEditingBag(null); } }}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>{editingBag ? "Editar Bolsa" : "Agregar Bolsa"}</DialogTitle>
              <DialogDescription>{editingBag ? "Modifica la bolsa." : "Crea una nueva bolsa de distribución."}</DialogDescription>
            </DialogHeader>
            <Form {...bagForm}>
              <form onSubmit={bagForm.handleSubmit(onBagSubmit)} className="space-y-3">
                <FormField control={bagForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} placeholder="Ej: Vacaciones" /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={bagForm.control} name="percentage" render={({ field }) => (<FormItem><FormLabel>Porcentaje (%)</FormLabel><FormControl><Input type="number" {...field} step="0.1" /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={bagForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Input {...field} placeholder="Breve descripción" /></FormControl><FormMessage /></FormItem>)}/>
                {editingBag && (
                  <FormField control={bagForm.control} name="balance" render={({ field }) => (<FormItem><FormLabel>Saldo (CUP)</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={bagForm.control} name="icon" render={({ field }) => (
                    <FormItem><FormLabel>Icono</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Icono" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {["Shield","TrendingUp","Home","Gamepad2","BookOpen","Target","PiggyBank","Heart","GraduationCap","Sparkles","DollarSign","Plane","Coffee"].map(key => (
                            <SelectItem key={key} value={key}>{key}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={bagForm.control} name="color" render={({ field }) => (
                    <FormItem><FormLabel>Color</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Color" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {[{k:"rose",c:"bg-rose-500"},{k:"blue",c:"bg-blue-500"},{k:"amber",c:"bg-amber-500"},{k:"green",c:"bg-green-500"},{k:"violet",c:"bg-violet-500"},{k:"orange",c:"bg-orange-500"}].map(({k,c}) => (
                            <SelectItem key={k} value={k}><div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full ${c}`} /><span className="capitalize">{k}</span></div></SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => { setIsBagDialogOpen(false); setEditingBag(null); }}>Cancelar</Button>
                  <Button type="submit" className="rounded-full">{editingBag ? "Guardar" : "Agregar"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Bag Dialog */}
        <AlertDialog open={!!bagToDelete} onOpenChange={(open) => { if (!open) setBagToDelete(null); }}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar bolsa?</AlertDialogTitle>
              <AlertDialogDescription>Se eliminará "{bagToDelete?.name}" de la distribución.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBag} className="rounded-full bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Goal Dialog */}
        <Dialog open={isGoalDialogOpen} onOpenChange={(open) => { if (!open) { setIsGoalDialogOpen(false); setEditingGoal(null); } }}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Editar Meta" : "Nueva Meta Financiera"}</DialogTitle>
              <DialogDescription>{editingGoal ? "Modifica los detalles de la meta." : "Define un objetivo de ahorro."}</DialogDescription>
            </DialogHeader>
            <Form {...goalForm}>
              <form onSubmit={goalForm.handleSubmit(onGoalSubmit)} className="space-y-3">
                <FormField control={goalForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} placeholder="Ej: Viaje a Japón" /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={goalForm.control} name="targetAmount" render={({ field }) => (<FormItem><FormLabel>Meta (CUP)</FormLabel><FormControl><Input type="number" {...field} step="0.01" placeholder="Ej: 100000" /></FormControl><FormMessage /></FormItem>)}/>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={goalForm.control} name="icon" render={({ field }) => (
                    <FormItem><FormLabel>Icono</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Icono" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {["Target","PiggyBank","Plane","Heart","GraduationCap","Home","Car","Shield","Sparkles","DollarSign"].map(key => (
                            <SelectItem key={key} value={key}>{key}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={goalForm.control} name="color" render={({ field }) => (
                    <FormItem><FormLabel>Color</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Color" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {[{k:"rose",c:"bg-rose-500"},{k:"blue",c:"bg-blue-500"},{k:"amber",c:"bg-amber-500"},{k:"green",c:"bg-green-500"},{k:"violet",c:"bg-violet-500"},{k:"orange",c:"bg-orange-500"}].map(({k,c}) => (
                            <SelectItem key={k} value={k}><div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full ${c}`} /><span className="capitalize">{k}</span></div></SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => { setIsGoalDialogOpen(false); setEditingGoal(null); }}>Cancelar</Button>
                  <Button type="submit" className="rounded-full">{editingGoal ? "Guardar" : "Crear Meta"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Goal Dialog */}
        <AlertDialog open={!!goalToDelete} onOpenChange={(open) => { if (!open) setGoalToDelete(null); }}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar meta?</AlertDialogTitle>
              <AlertDialogDescription>Se eliminará "{goalToDelete?.name}" de tus metas financieras.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteGoal} className="rounded-full bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Deposit to Goal Dialog */}
        <Dialog open={!!goalToDeposit} onOpenChange={(open) => { if (!open) { setGoalToDeposit(null); setDepositAmount(0); setDepositWalletId(""); } }}>
          <DialogContent className="rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle>Abonar a Meta</DialogTitle>
              <DialogDescription>{goalToDeposit && `Añade dinero a "${goalToDeposit.name}"`}</DialogDescription>
            </DialogHeader>
            {goalToDeposit && (
              <div className="space-y-3">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Progreso actual</span>
                    <span className={cn("text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full", bagColorMap[goalToDeposit.color]?.badge || "bg-blue-500")}>
                      {goalToDeposit.targetAmount > 0 ? Math.round((goalToDeposit.currentAmount / goalToDeposit.targetAmount) * 100) : 0}%
                    </span>
                  </div>
                  <div className="relative h-2 bg-zinc-200 dark:bg-zinc-950 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", bagColorMap[goalToDeposit.color]?.bar || "bg-blue-500")}
                      style={{ width: `${Math.min((goalToDeposit.currentAmount / goalToDeposit.targetAmount) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>{goalToDeposit.currentAmount.toLocaleString("es-ES", { minimumFractionDigits: 0 })} CUP</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{goalToDeposit.targetAmount.toLocaleString("es-ES", { minimumFractionDigits: 0 })} CUP</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="deposit-amount">Cantidad a abonar (CUP)</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                    className="rounded-xl mt-1"
                    placeholder="Ej: 5000"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="deposit-wallet">Desde billetera</Label>
                  <Select onValueChange={setDepositWalletId} value={depositWalletId}>
                    <SelectTrigger id="deposit-wallet" className="rounded-xl mt-1">
                      <SelectValue placeholder="Selecciona billetera..." />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map(w => (
                        <SelectItem key={w.id} value={w.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{w.name}</span>
                            <span className="text-zinc-400 ml-2">{(w.balance * exchangeRate).toLocaleString("es-ES", { minimumFractionDigits: 0 })} CUP</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  {[1000, 5000, 10000, 50000].map(amount => (
                    <Button key={amount} type="button" variant="outline" size="sm" className="rounded-full text-[10px] h-7" onClick={() => setDepositAmount(amount)}>
                      +{amount.toLocaleString("es-ES")}
                    </Button>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" className="rounded-full" onClick={() => { setGoalToDeposit(null); setDepositAmount(0); }}>Cancelar</Button>
                  <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white" disabled={depositAmount <= 0} onClick={handleDepositToGoal}>
                    <PiggyBank className="h-4 w-4 mr-1" /> Abonar {depositAmount.toLocaleString("es-ES", { minimumFractionDigits: 0 })} CUP
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Distribute Income Dialog */}
        <Dialog open={isDistributeIncomeDialogOpen} onOpenChange={setIsDistributeIncomeDialogOpen}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>Distribuir Ingresos</DialogTitle>
              <DialogDescription>Distribuye ingresos no asignados según tus bolsas.</DialogDescription>
            </DialogHeader>
            {(() => {
              const total = undistributedIncomes.reduce((acc, t) => acc + t.amount, 0);
              return (
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl">
                    <p className="text-[10px] text-zinc-400">Total a distribuir</p>
                    <CurrencyDisplay usd={total} exchangeRate={exchangeRate} large />
                    <p className="text-[10px] text-zinc-400 mt-1">{undistributedIncomes.length} ingreso(s) sin distribuir</p>
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {distributionBags.map(bag => {
                      const amount = total * (bag.percentage / 100);
                      const color = bagColorMap[bag.color] || bagColorMap.blue;
                      return (
                        <div key={bag.id} className="flex items-center justify-between p-2.5 bg-zinc-50/50 dark:bg-zinc-950/30 rounded-xl">
                          <div className="flex items-center gap-2">
                            <div className={cn("p-1 rounded-lg", color.bg)}>
                              <div className={cn("h-3 w-3", color.text)} />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{bag.name}</p>
                              <p className="text-[10px] text-zinc-400">{bag.percentage}%</p>
                            </div>
                          </div>
                          <CurrencyDisplay usd={amount} exchangeRate={exchangeRate} />
                        </div>
                      );
                    })}
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" className="rounded-full" onClick={() => setIsDistributeIncomeDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmDistribution} className="rounded-full bg-blue-600 hover:bg-blue-700 text-white">Marcar como Distribuido</Button>
                  </DialogFooter>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
