import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { wallets as initialWallets, transactionCategories, defaultDistributionBags } from '@/lib/data';
import type { Wallet, Transaction, Loan, DistributionBag, Debt } from '@/lib/definitions';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  CalendarIcon, PlusCircle, Edit, Coins, LucideIcon, Wallet as WalletIcon, RotateCcw,
  ArrowRightLeft, Download, Upload, DollarSign, Trash2, Plus, TrendingUp as TrendingUpIcon,
  ArrowDown, ArrowUp, ChevronRight, LandPlot, BadgePercent, Settings, Scale, Target,
  Shield, Home, Gamepad2, BookOpen, PiggyBank, Heart,
  GraduationCap, Sparkles, Plane, Coffee,
} from 'lucide-react';
import { format, isThisMonth, startOfMonth, subMonths, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useFinance } from '@/hooks/useFinance';
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

const budgetSchema = z.object({
  categoryId: z.string(),
  amount: z.coerce.number().min(0),
});

const defaultBudgetLimits: Record<string, number> = {
  'cat-food': 5000, 'cat-transport': 2000, 'cat-entertainment': 3000,
  'cat-health': 2000, 'cat-shopping': 3000, 'cat-education': 2000,
  'cat-personal': 1500, 'cat-coffee': 1000, 'cat-travel': 5000,
};

const CurrencyDisplay = ({ usd, exchangeRate, large = false }: { usd: number; exchangeRate: number; large?: boolean }) => {
  const cup = usd * exchangeRate;
  return (
    <div className="flex flex-col">
      <span className={cn("font-semibold tracking-tight", large ? "text-2xl" : "text-sm")}>
        {cup.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CUP
      </span>
      <span className="text-[10px] text-muted-foreground">{usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
    </div>
  );
};

export default function Finance() {
  const {
    wallets, transactions, loans, debts, distributionBags, exchangeRate,
    setExchangeRate, isLoading, setWallets, setTransactions, setLoans,
    setDebts, setDistributionBags, addTransaction, deleteTransaction,
    updateWalletBalance, updateWallet, addLoan, updateLoan,
    addDebt, updateDebt, deleteDebt, addDistributionBag,
    updateDistributionBag, deleteDistributionBag,
  } = useFinance();

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
  const [budgetLimits, setBudgetLimits] = useState<Record<string, number>>(() => {
    const stored = localStorage.getItem('budgetLimits');
    return stored ? JSON.parse(stored) : defaultBudgetLimits;
  });

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (isClient) localStorage.setItem('budgetLimits', JSON.stringify(budgetLimits));
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
  };

  const bagColorMap: Record<string, { bg: string; text: string; badge: string; bar: string }> = {
    rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-500', bar: 'bg-rose-500' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-500', bar: 'bg-blue-500' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-500', bar: 'bg-amber-500' },
    green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', badge: 'bg-green-500', bar: 'bg-green-500' },
    violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400', badge: 'bg-violet-500', bar: 'bg-violet-500' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-500', bar: 'bg-orange-500' },
  };

  const GLASS = "border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden";
  const GLASS_CARD = (accent = false) => cn(GLASS, accent && "relative");
  const ACCENT_BAR = "h-1 bg-gradient-to-r from-primary to-primary/60";
  const PILL = "rounded-full";

  if (!isClient || isLoading) return null;

  const renderDebtColumns = () => [
    {
      accessorKey: "date", header: "Fecha",
      cell: ({ row }: any) => <span className="text-sm text-muted-foreground">{format(new Date(row.original.date), "dd MMM yyyy", { locale: es })}</span>,
    },
    {
      accessorKey: "person", header: "Acreedor",
      cell: ({ row }: any) => <span className="text-sm font-medium">{row.original.person}</span>,
    },
    {
      accessorKey: "description", header: "Descripción",
      cell: ({ row }: any) => <span className="text-sm text-muted-foreground">{row.original.description}</span>,
    },
    {
      accessorKey: "progress", header: "Progreso",
      cell: ({ row }: any) => {
        const progress = (row.original.paidAmount / row.original.totalAmount) * 100;
        return (
          <div className="flex items-center gap-3 min-w-[140px]">
            <Progress value={progress} className="h-2 rounded-full flex-1" />
            <span className="text-xs font-medium text-muted-foreground w-10 text-right">{Math.round(progress)}%</span>
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
            <div className="text-sm font-semibold text-red-600 dark:text-red-400">
              {(remaining * exchangeRate).toLocaleString("es-ES", { minimumFractionDigits: 2 })} CUP
            </div>
            <div className="text-xs text-muted-foreground">${remaining.toFixed(2)} USD</div>
          </div>
        );
      },
    },
    {
      accessorKey: "status", header: "Estado",
      cell: ({ row }: any) => (
        <Badge className={`${PILL} text-xs px-3 py-0.5 font-medium ${
          row.original.status === "paid"
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
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
            <Button size="sm" className={`h-8 ${PILL} text-xs px-3`} onClick={() => openDebtPaymentDialog(row.original)}>
              <DollarSign className="h-3 w-3 mr-1" /> Pagar
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.03)_0%,_transparent_50%)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <header className="space-y-0.5">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Finanzas</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Control financiero personal</p>
          </header>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Dialog open={isLoanDialogOpen} onOpenChange={setIsLoanDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={`${PILL} text-xs h-8 sm:h-9`}>
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
                    <DialogFooter><Button type="submit" className={PILL}>Confirmar Préstamo</Button></DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Dialog open={isDebtDialogOpen} onOpenChange={setIsDebtDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={`${PILL} text-xs h-8 sm:h-9`}>
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
                        <Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={`w-full pl-3 text-left font-normal ${PILL}`}>
                          {field.value ? format(field.value, "PPP", { locale: es }) : "Elige una fecha"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover><FormMessage />
                      </FormItem>
                    )} />
                    <DialogFooter><Button type="submit" className={PILL}>Registrar Deuda</Button></DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={`${PILL} text-xs h-8 sm:h-9`}>
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
                    <DialogFooter><Button type="submit" className={PILL}>Confirmar Traspaso</Button></DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenTransactionDialog} size="sm" className={`${PILL} text-xs h-8 sm:h-9`}>
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
                      <FormField control={transactionForm.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Fecha</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={`w-full pl-3 text-left font-normal ${PILL}`}>{field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                      <FormField control={transactionForm.control} name="walletId" render={({ field }) => (<FormItem><FormLabel>Billetera</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                    </div>
                    <FormField control={transactionForm.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent>{transactionCategories.filter(c => c.type === transactionType).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                    <DialogFooter><Button type="submit" className={PILL}>Guardar</Button></DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="h-px bg-border/50" />

        {/* Summary Cards - Glassmorphism */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Card className={GLASS_CARD()}>
            <div className={ACCENT_BAR} />
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Balance Total</span>
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Coins className="h-3.5 w-3.5" />
                </div>
              </div>
              <CurrencyDisplay usd={totalBalance} exchangeRate={exchangeRate} large />
            </CardContent>
          </Card>
          <Card className={GLASS_CARD()}>
            <div className={ACCENT_BAR} />
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Ingresos del Mes</span>
                <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
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
                <span className="text-[10px] text-muted-foreground">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
          <Card className={GLASS_CARD()}>
            <div className="h-1 bg-gradient-to-r from-red-500 to-red-400" />
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Gastos del Mes</span>
                <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
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
                <span className="text-[10px] text-muted-foreground">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
          <Card className={GLASS_CARD()}>
            <div className={cn("h-1 bg-gradient-to-r", monthlyBalance >= 0 ? "from-green-500 to-green-400" : "from-red-500 to-red-400")} />
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Balance Mensual</span>
                <div className={cn("p-1.5 rounded-lg", monthlyBalance >= 0 ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-red-100 dark:bg-red-900/30 text-red-600")}>
                  <Scale className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className={cn(monthlyBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                <CurrencyDisplay usd={monthlyBalance} exchangeRate={exchangeRate} large />
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] font-medium">{savingsRate.toFixed(1)}%</span>
                <span className="text-[10px] text-muted-foreground">tasa de ahorro</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasa de Cambio */}
        <Card className={GLASS_CARD()}>
          <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-400" />
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm text-muted-foreground">$1 USD =</span>
              <Input
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                className="w-20 h-8 text-xs sm:text-sm font-semibold text-right rounded-xl"
              />
              <span className="text-xs sm:text-sm font-medium">CUP</span>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className={GLASS_CARD()}>
            <div className={ACCENT_BAR} />
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-sm sm:text-base">Resumen 6 Meses</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">Ingresos vs Gastos</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-4">
              <MonthlySummaryChart data={chartData.monthlySummary} />
            </CardContent>
          </Card>
          <Card className={GLASS_CARD()}>
            <div className={ACCENT_BAR} />
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-sm sm:text-base">Gastos por Categoría</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">Distribución del mes</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-4">
              <CategorySpendChart data={chartData.categorySpend} />
            </CardContent>
          </Card>
          <Card className={GLASS_CARD()}>
            <div className={ACCENT_BAR} />
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-sm sm:text-base">Distribución de Balance</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">Por billetera</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-4">
              <WalletDistributionChart data={chartData.walletDistribution} />
            </CardContent>
          </Card>
          <Card className={GLASS_CARD()}>
            <div className={ACCENT_BAR} />
            <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-sm sm:text-base">Tendencia del Balance</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">Evolución patrimonial</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-4">
              <CashFlowTrendChart data={chartData.cashFlowTrend} />
            </CardContent>
          </Card>
        </div>

        {/* Budget Section */}
        <Card className={GLASS_CARD()}>
          <div className={ACCENT_BAR} />
          <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm sm:text-base">Presupuesto Mensual</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs">Gastado vs Presupuestado</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 space-y-3">
            {budgetData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Establece límites de presupuesto para tus categorías de gasto.</p>
            ) : (
              budgetData.map(({ category, spent, limit, percentage }) => (
                <div key={category.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium truncate">{category.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-muted-foreground">{formatCurrency(spent)}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="font-semibold">{formatCurrency(limit)}</span>
                      <span className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        percentage > 100 ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
                        percentage > 80 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30" :
                        "bg-green-100 text-green-600 dark:bg-green-900/30"
                      )}>
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        percentage > 100 ? "bg-red-500" : percentage > 80 ? "bg-amber-500" : "bg-primary"
                      )}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <Input
                    type="number"
                    value={limit}
                    onChange={(e) => setBudgetLimits(prev => ({ ...prev, [category.id]: parseFloat(e.target.value) || 0 }))}
                    className="h-6 text-[10px] w-24 text-right rounded-lg ml-auto"
                    placeholder="Límite"
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Wallets Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight">Billeteras</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{wallets.length} billeteras · Total: {(totalBalance * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
            </div>
          </div>
          <div className="grid gap-2 sm:gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {wallets.map((wallet, idx) => {
              const Icon = getWalletIcon(wallet.id);
              return (
                <Card key={wallet.id} className={GLASS_CARD()} style={{ animationDelay: `${idx * 0.05}s` }}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-lg bg-muted/50">
                          <Icon className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="text-xs font-medium truncate">{wallet.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground" onClick={() => openWalletDialog(wallet)}>
                        <Edit className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                    <div>
                      <div className="text-sm font-bold tracking-tight">
                        {(wallet.balance * exchangeRate).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-muted-foreground">CUP · ${wallet.balance.toFixed(2)} USD</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Distribution Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight">Distribución</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Método JARS · 6 bolsas</p>
            </div>
            <div className="flex items-center gap-1.5">
              {(() => {
                const totalUndistributed = undistributedIncomes.reduce((acc, t) => acc + t.amount, 0);
                if (totalUndistributed > 0) {
                  return (
                    <Button onClick={() => setIsDistributeIncomeDialogOpen(true)} size="sm" className={`${PILL} text-[10px] h-7`}>
                      <Coins className="mr-1 h-3 w-3" />
                      Distribuir {formatCurrency(totalUndistributed * exchangeRate)}
                    </Button>
                  );
                }
                return null;
              })()}
              <Button variant="outline" size="sm" className={`${PILL} text-[10px] h-7`} onClick={() => { setEditingBag(null); bagForm.reset({ name: "", percentage: 10, description: "", icon: "Target", color: "blue" }); setIsBagDialogOpen(true); }}>
                <Plus className="mr-1 h-3 w-3" /> Bolsa
              </Button>
            </div>
          </div>

          {distributionBags.length === 0 ? (
            <Card className={GLASS_CARD()}>
              <CardContent className="p-6 text-center text-xs text-muted-foreground">
                No hay bolsas de distribución. Crea una para empezar.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <Card className={GLASS_CARD()}>
                <CardContent className="p-3 sm:p-4">
                  <DistributionBagChart data={distributionBags.map(b => ({ name: b.name, percentage: b.percentage, color: b.color }))} />
                </CardContent>
              </Card>
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                    <span>Distribución: {distributionBags.reduce((acc, b) => acc + b.percentage, 0)}%</span>
                    {(() => {
                      const total = distributionBags.reduce((acc, b) => acc + b.percentage, 0);
                      if (total === 100) return <span className="text-green-500 font-medium">100%</span>;
                      if (total > 100) return <span className="text-red-500 font-medium">Excede {total - 100}%</span>;
                      return <span className="text-amber-500 font-medium">Falta {100 - total}%</span>;
                    })()}
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden flex">
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
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                  {distributionBags.map((bag, idx) => {
                    const IconComponent = iconMap[bag.icon] || WalletIcon;
                    const color = bagColorMap[bag.color] || bagColorMap.blue;
                    return (
                      <Card key={bag.id} className={GLASS_CARD()} style={{ animationDelay: `${idx * 0.05}s` }}>
                        <CardContent className="p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className={cn("p-1 rounded-lg", color.bg)}>
                                <IconComponent className={cn("h-3 w-3", color.text)} />
                              </div>
                              <span className="text-xs font-medium truncate">{bag.name}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={() => { setEditingBag(bag); bagForm.reset({ name: bag.name, percentage: bag.percentage, description: bag.description, icon: bag.icon, color: bag.color }); setIsBagDialogOpen(true); }}>
                                <Edit className="h-2.5 w-2.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full text-red-500 hover:text-red-700" onClick={() => setBagToDelete(bag)}>
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={cn("text-[10px] font-semibold text-white px-1.5 py-0.5 rounded-full", color.badge)}>{bag.percentage}%</span>
                            <CurrencyDisplay usd={bag.balance || 0} exchangeRate={exchangeRate} />
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed truncate">{bag.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="h-px bg-border/50" />

        {/* Tabs Section */}
        <Tabs defaultValue="expenses" className="space-y-4">
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex h-9 p-1 rounded-full bg-muted/50 backdrop-blur-sm whitespace-nowrap">
              <TabsTrigger value="expenses" className={`${PILL} text-[10px] sm:text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm`}>Gastos</TabsTrigger>
              <TabsTrigger value="incomes" className={`${PILL} text-[10px] sm:text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm`}>Ingresos</TabsTrigger>
              <TabsTrigger value="transfers" className={`${PILL} text-[10px] sm:text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm`}>Traspasos</TabsTrigger>
              <TabsTrigger value="loans" className={`${PILL} text-[10px] sm:text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm`}>Préstamos</TabsTrigger>
              <TabsTrigger value="debts" className={`${PILL} text-[10px] sm:text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm`}>Deudas</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="expenses">
            <Card className={GLASS_CARD()}>
              <div className={ACCENT_BAR} />
              <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                <CardTitle className="text-sm sm:text-base">Gastos</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs">{expenses.length} transacciones</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-4">
                <DataTable columns={transactionColumns} data={expenses} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incomes" className="space-y-3">
            <div className="grid gap-2 grid-cols-3">
              <Card className={GLASS_CARD()}>
                <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ingresos este mes</p>
                  <p className="text-sm sm:text-base font-bold">{(monthlyIncome * exchangeRate).toLocaleString("es-ES", { minimumFractionDigits: 2 })} CUP</p>
                  <p className="text-[10px] text-muted-foreground">${monthlyIncome.toFixed(2)} USD</p>
                </CardContent>
              </Card>
              <Card className={GLASS_CARD()}>
                <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Transacciones</p>
                  <p className="text-sm sm:text-base font-bold">{incomes.filter(t => isThisMonth(t.date)).length}</p>
                  <p className="text-[10px] text-muted-foreground">este mes</p>
                </CardContent>
              </Card>
              <Card className={GLASS_CARD()}>
                <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Promedio</p>
                  <p className="text-sm sm:text-base font-bold">
                    {incomes.filter(t => isThisMonth(t.date)).length > 0
                      ? `${((monthlyIncome / incomes.filter(t => isThisMonth(t.date)).length) * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })}`
                      : "0"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">CUP por ingreso</p>
                </CardContent>
              </Card>
            </div>

            <Card className={GLASS_CARD()}>
              <div className={ACCENT_BAR} />
              <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm sm:text-base">Ingresos</CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs">Historial</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" className={`${PILL} text-[10px] h-7`} onClick={() => {
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
                    <Button key={preset.label} variant="outline" size="sm" className={`${PILL} text-[10px] h-7`} onClick={() => {
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
            <Card className={GLASS_CARD()}>
              <div className={ACCENT_BAR} />
              <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                <CardTitle className="text-sm sm:text-base">Traspasos</CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-4">
                <DataTable columns={transactionColumns} data={transfers} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loans" className="space-y-3">
            {(() => {
              const outstandingLoans = loans.filter(l => l.status === "outstanding");
              const paidLoans = loans.filter(l => l.status === "paid");
              const totalLent = outstandingLoans.reduce((acc, l) => acc + l.totalAmount, 0);
              const totalRecovered = outstandingLoans.reduce((acc, l) => acc + l.paidAmount, 0);
              const totalPending = totalLent - totalRecovered;
              return (
                <>
                  <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                    <Card className={GLASS_CARD()}>
                      <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Prestado activo</p>
                        <p className="text-sm sm:text-base font-bold">{(totalLent * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      </CardContent>
                    </Card>
                    <Card className={GLASS_CARD()}>
                      <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Recuperado</p>
                        <p className="text-sm sm:text-base font-bold text-green-600">{(totalRecovered * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      </CardContent>
                    </Card>
                    <Card className={GLASS_CARD()}>
                      <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Por cobrar</p>
                        <p className="text-sm sm:text-base font-bold text-amber-600">{(totalPending * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      </CardContent>
                    </Card>
                    <Card className={GLASS_CARD()}>
                      <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Préstamos</p>
                        <p className="text-sm sm:text-base font-bold">{outstandingLoans.length} activos</p>
                        <p className="text-[10px] text-muted-foreground">{paidLoans.length} pagados</p>
                      </CardContent>
                    </Card>
                  </div>

                  {outstandingLoans.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold">Pendientes</h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {outstandingLoans.map(loan => {
                          const progress = (loan.paidAmount / loan.totalAmount) * 100;
                          const remaining = loan.totalAmount - loan.paidAmount;
                          return (
                            <Card key={loan.id} className={cn(GLASS_CARD(), "ring-1 ring-amber-500/20")}>
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-0.5">
                                    <h4 className="font-semibold text-xs">{loan.person}</h4>
                                    <p className="text-[10px] text-muted-foreground">{loan.description}</p>
                                    <p className="text-[10px] text-muted-foreground">{format(new Date(loan.date), "dd MMM yyyy", { locale: es })}</p>
                                  </div>
                                  <Button size="sm" variant="outline" className={`${PILL} text-[10px] h-7`} onClick={() => openLoanPaymentDialog(loan)}>
                                    <DollarSign className="h-3 w-3 mr-1" /> Cobrar
                                  </Button>
                                </div>
                                <div className="space-y-1">
                                  <Progress value={progress} className="h-1.5 rounded-full" />
                                  <div className="flex justify-between text-[10px] text-muted-foreground">
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
                    <Card className={GLASS_CARD()}>
                      <div className={ACCENT_BAR} />
                      <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                        <CardTitle className="text-sm sm:text-base">Completados ({paidLoans.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-4 space-y-1.5">
                        {paidLoans.map(loan => (
                          <div key={loan.id} className="flex items-center justify-between p-2 bg-muted/40 rounded-xl text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{loan.person}</span>
                              <span className="text-muted-foreground">— {loan.description}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{(loan.totalAmount * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</span>
                              <Badge className={`${PILL} text-[10px] px-2 bg-green-100 text-green-700 dark:bg-green-900/30`}>Pagado</Badge>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <Card className={GLASS_CARD()}>
                    <div className={ACCENT_BAR} />
                    <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                      <CardTitle className="text-sm sm:text-base">Todos los Préstamos</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-4">
                      <DataTable columns={loanColumns} data={loans} />
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </TabsContent>

          <TabsContent value="debts" className="space-y-3">
            {(() => {
              const outstandingDebts = debts.filter(d => d.status === "outstanding");
              const paidDebts = debts.filter(d => d.status === "paid");
              const totalDebt = outstandingDebts.reduce((acc, d) => acc + d.totalAmount, 0);
              const totalPaid = outstandingDebts.reduce((acc, d) => acc + d.paidAmount, 0);
              const totalRemaining = totalDebt - totalPaid;
              return (
                <>
                  <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                    <Card className={GLASS_CARD()}>
                      <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deuda activa</p>
                        <p className="text-sm sm:text-base font-bold">{(totalDebt * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      </CardContent>
                    </Card>
                    <Card className={GLASS_CARD()}>
                      <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pagado</p>
                        <p className="text-sm sm:text-base font-bold text-green-600">{(totalPaid * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      </CardContent>
                    </Card>
                    <Card className={GLASS_CARD()}>
                      <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Por pagar</p>
                        <p className="text-sm sm:text-base font-bold text-red-600">{(totalRemaining * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      </CardContent>
                    </Card>
                    <Card className={GLASS_CARD()}>
                      <CardContent className="p-2.5 sm:p-3 space-y-0.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deudas</p>
                        <p className="text-sm sm:text-base font-bold">{outstandingDebts.length} activas</p>
                        <p className="text-[10px] text-muted-foreground">{paidDebts.length} pagadas</p>
                      </CardContent>
                    </Card>
                  </div>

                  {outstandingDebts.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold">Pendientes</h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {outstandingDebts.map(debt => {
                          const progress = (debt.paidAmount / debt.totalAmount) * 100;
                          const remaining = debt.totalAmount - debt.paidAmount;
                          const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date();
                          return (
                            <Card key={debt.id} className={cn(GLASS_CARD(), isOverdue ? "ring-1 ring-red-500/20" : "ring-1 ring-primary/10")}>
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-xs">{debt.person}</h4>
                                      {isOverdue && <Badge className={`${PILL} text-[10px] px-2 bg-red-100 text-red-700`}>Vencida</Badge>}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">{debt.description}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {format(new Date(debt.date), "dd MMM yyyy", { locale: es })}
                                      {debt.dueDate && ` · Vence: ${format(new Date(debt.dueDate), "dd MMM yyyy", { locale: es })}`}
                                    </p>
                                  </div>
                                  <Button size="sm" className={`${PILL} text-[10px] h-7`} onClick={() => openDebtPaymentDialog(debt)}>
                                    <DollarSign className="h-3 w-3 mr-1" /> Pagar
                                  </Button>
                                </div>
                                <div className="space-y-1">
                                  <Progress value={progress} className="h-1.5 rounded-full" />
                                  <div className="flex justify-between text-[10px] text-muted-foreground">
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
                    <Card className={GLASS_CARD()}>
                      <div className={ACCENT_BAR} />
                      <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                        <CardTitle className="text-sm sm:text-base">Pagadas ({paidDebts.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-4 space-y-1.5">
                        {paidDebts.map(debt => (
                          <div key={debt.id} className="flex items-center justify-between p-2 bg-muted/40 rounded-xl text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{debt.person}</span>
                              <span className="text-muted-foreground">— {debt.description}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{(debt.totalAmount * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</span>
                              <Badge className={`${PILL} text-[10px] px-2 bg-green-100 text-green-700`}>Pagado</Badge>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <Card className={GLASS_CARD()}>
                    <div className={ACCENT_BAR} />
                    <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                      <CardTitle className="text-sm sm:text-base">Todas las Deudas</CardTitle>
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
                <DialogFooter><Button type="submit" className={PILL}>Guardar Cambios</Button></DialogFooter>
              </form>
            </Form>
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
                <DialogFooter><Button type="submit" className={PILL}>Registrar Pago</Button></DialogFooter>
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
                <DialogFooter><Button type="submit" className={PILL}>Registrar Pago</Button></DialogFooter>
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
              <AlertDialogCancel className={PILL}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleRevertTransaction} className={PILL}>Revertir</AlertDialogAction>
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
                  <Button type="button" variant="outline" className={PILL} onClick={() => { setIsBagDialogOpen(false); setEditingBag(null); }}>Cancelar</Button>
                  <Button type="submit" className={PILL}>{editingBag ? "Guardar" : "Agregar"}</Button>
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
              <AlertDialogCancel className={PILL}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBag} className={`${PILL} bg-red-500 hover:bg-red-600`}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-[10px] text-muted-foreground">Total a distribuir</p>
                    <CurrencyDisplay usd={total} exchangeRate={exchangeRate} large />
                    <p className="text-[10px] text-muted-foreground mt-1">{undistributedIncomes.length} ingreso(s) sin distribuir</p>
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {distributionBags.map(bag => {
                      const amount = total * (bag.percentage / 100);
                      const color = bagColorMap[bag.color] || bagColorMap.blue;
                      return (
                        <div key={bag.id} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-xl">
                          <div className="flex items-center gap-2">
                            <div className={cn("p-1 rounded-lg", color.bg)}>
                              <div className={cn("h-3 w-3", color.text)} />
                            </div>
                            <div>
                              <p className="text-xs font-medium">{bag.name}</p>
                              <p className="text-[10px] text-muted-foreground">{bag.percentage}%</p>
                            </div>
                          </div>
                          <CurrencyDisplay usd={amount} exchangeRate={exchangeRate} />
                        </div>
                      );
                    })}
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" className={PILL} onClick={() => setIsDistributeIncomeDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmDistribution} className={PILL}>Marcar como Distribuido</Button>
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
