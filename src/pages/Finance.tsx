import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { wallets as initialWallets, transactionCategories, defaultDistributionBags } from '@/lib/data';
import type { Wallet, Transaction, Loan, DistributionBag, Debt } from '@/lib/definitions';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  CalendarIcon, PlusCircle, Edit, Coins, Settings, LucideIcon, Wallet as WalletIcon, RotateCcw,
  ArrowRightLeft, Download, Upload, Scale, LandPlot, DollarSign, Trash2, Plus, Shield, TrendingUp,
  Home, Gamepad2, BookOpen, PiggyBank, Heart, GraduationCap, Sparkles, Plane, Coffee, Target,
  Banknote, CreditCard, BadgePercent, ArrowDown, ArrowUp, ChevronRight, Grip,
} from 'lucide-react';
import { format, isThisMonth, startOfMonth, subMonths, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DataTable } from '@/components/finance/data-table';
import { getTransactionColumns } from '@/components/finance/transaction-columns';
import { getLoanColumns } from '@/components/finance/loan-columns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { MonthlySummaryChart, CategorySpendChart } from '@/components/finance/charts';

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

const CurrencyDisplay = ({ usd, exchangeRate, large = false }: { usd: number, exchangeRate: number, large?: boolean }) => {
  const cup = usd * exchangeRate;
  return (
    <div className="flex flex-col">
      <span className={cn("font-semibold tracking-tight", large ? "text-2xl" : "text-base")}>
        {cup.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CUP
      </span>
      <span className="text-xs text-muted-foreground">{usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, accent = "blue", children }: {
  title: string; value: React.ReactNode; icon: LucideIcon; accent?: string; children?: React.ReactNode;
}) => {
  const accentMap: Record<string, string> = {
    blue: "border-l-blue-500",
    green: "border-l-green-500",
    red: "border-l-red-500",
    orange: "border-l-orange-500",
    violet: "border-l-violet-500",
    amber: "border-l-amber-500",
  };
  const iconBgMap: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  };
  return (
    <Card className={cn("border-l-4", accentMap[accent] || accentMap.blue)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className={cn("p-2 rounded-full", iconBgMap[accent] || iconBgMap.blue)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </CardHeader>
      <CardContent>
        {value}
        {children}
      </CardContent>
    </Card>
  );
};

export default function Finance() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
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
  const [exchangeRate, setExchangeRate] = useState(360);
  const { toast } = useToast();
  const [isLoanPaymentDialogOpen, setIsLoanPaymentDialogOpen] = useState(false);
  const [loanToPay, setLoanToPay] = useState<Loan | null>(null);
  const [isDebtPaymentDialogOpen, setIsDebtPaymentDialogOpen] = useState(false);
  const [debtToPay, setDebtToPay] = useState<Debt | null>(null);
  const [distributionBags, setDistributionBags] = useState<DistributionBag[]>([]);
  const [isBagDialogOpen, setIsBagDialogOpen] = useState(false);
  const [editingBag, setEditingBag] = useState<DistributionBag | null>(null);
  const [bagToDelete, setBagToDelete] = useState<DistributionBag | null>(null);
  const [isDistributeIncomeDialogOpen, setIsDistributeIncomeDialogOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedWallets = localStorage.getItem('wallets');
    setWallets(storedWallets ? JSON.parse(storedWallets) : initialWallets);

    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
      const parsed = JSON.parse(storedTransactions, (key, value) => {
        if (key === 'date') return new Date(value);
        return value;
      });
      setTransactions(parsed);
    }

    const storedLoans = localStorage.getItem('loans');
    if (storedLoans) {
      const parsed = JSON.parse(storedLoans, (key, value) => {
        if (key === 'date') return new Date(value);
        return value;
      });
      setLoans(parsed);
    }

    const storedDebts = localStorage.getItem('debts');
    if (storedDebts) {
      const parsed = JSON.parse(storedDebts, (key, value) => {
        if (key === 'date' || key === 'dueDate') return new Date(value);
        return value;
      });
      setDebts(parsed);
    }

    const storedRate = localStorage.getItem('exchangeRate');
    if (storedRate) {
      setExchangeRate(parseFloat(storedRate));
    }

    const storedBags = localStorage.getItem('distributionBags');
    if (storedBags) {
      setDistributionBags(JSON.parse(storedBags));
    } else {
      setDistributionBags(defaultDistributionBags);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('wallets', JSON.stringify(wallets));
      localStorage.setItem('transactions', JSON.stringify(transactions));
      localStorage.setItem('loans', JSON.stringify(loans));
      localStorage.setItem('debts', JSON.stringify(debts));
      localStorage.setItem('exchangeRate', exchangeRate.toString());
      localStorage.setItem('distributionBags', JSON.stringify(distributionBags));
    }
  }, [wallets, transactions, loans, debts, exchangeRate, distributionBags, isClient]);

  const transactionForm = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: 0,
      currency: 'CUP',
      walletId: '',
      categoryId: '',
      type: 'expense',
    },
  });

  const walletForm = useForm<z.infer<typeof walletSchema>>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: '',
      balance: 0,
      currency: 'CUP',
    },
  });

  const transferForm = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: 0,
      currency: 'CUP',
      fromWalletId: '',
      toWalletId: '',
    },
  });

  const distributionForm = useForm<z.infer<typeof distributionSchema>>({
    resolver: zodResolver(distributionSchema),
    defaultValues: {
      amount: 0,
      currency: 'CUP',
      toWalletId: '',
    },
  });

  const loanForm = useForm<z.infer<typeof loanSchema>>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      person: '',
      description: '',
      amount: 0,
      currency: 'CUP',
      walletId: '',
    },
  });

  const loanPaymentForm = useForm<z.infer<typeof loanPaymentSchema>>({
    resolver: zodResolver(loanPaymentSchema),
    defaultValues: {
      amount: 0,
      currency: 'CUP',
    },
  });

  const debtForm = useForm<z.infer<typeof debtSchema>>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      person: '',
      description: '',
      amount: 0,
      currency: 'CUP',
      walletId: '',
    },
  });

  const debtPaymentForm = useForm<z.infer<typeof debtPaymentSchema>>({
    resolver: zodResolver(debtPaymentSchema),
    defaultValues: {
      amount: 0,
      currency: 'CUP',
    },
  });

  const bagForm = useForm<z.infer<typeof bagSchema>>({
    resolver: zodResolver(bagSchema),
    defaultValues: {
      name: '',
      percentage: 10,
      description: '',
      icon: 'Target',
      color: 'blue',
      balance: 0,
    },
  });

  const transactionType = transactionForm.watch('type');

  const onTransactionSubmit = (values: z.infer<typeof transactionSchema>) => {
    const amountInUSD = values.currency === 'CUP' ? values.amount / exchangeRate : values.amount;

    const newTransaction: Transaction = {
      id: `trans-${Date.now()}`,
      description: values.description,
      amount: amountInUSD,
      date: values.date,
      walletId: values.walletId,
      categoryId: values.categoryId,
      type: values.type,
      distributed: values.type === 'income' ? false : undefined,
    };
    setTransactions(prev => [newTransaction, ...prev]);

    setWallets(prevWallets =>
      prevWallets.map(wallet => {
        if (wallet.id === values.walletId) {
          const newBalance = values.type === 'income' ? wallet.balance + amountInUSD : wallet.balance - amountInUSD;
          return { ...wallet, balance: newBalance };
        }
        return wallet;
      })
    );

    setIsTransactionDialogOpen(false);
    transactionForm.reset();
    toast({ title: "Transacción añadida", description: "El balance de tu billetera ha sido actualizado." });
  };

  const onWalletSubmit = (values: z.infer<typeof walletSchema>) => {
    if (walletToEdit) {
      const newBalanceUSD = values.currency === 'CUP' ? values.balance / exchangeRate : values.balance;
      setWallets(wallets.map(w => w.id === walletToEdit.id ? { ...w, name: values.name, balance: newBalanceUSD } : w));
      toast({ title: "Billetera actualizada", description: `El saldo de ${values.name} ha sido modificado.` });
    }
    setIsWalletDialogOpen(false);
    setWalletToEdit(null);
    walletForm.reset();
  };

  const onTransferSubmit = (values: z.infer<typeof transferSchema>) => {
    const { amount, currency, fromWalletId, toWalletId } = values;
    const amountInUSD = currency === 'CUP' ? amount / exchangeRate : amount;

    const fromWallet = wallets.find(w => w.id === fromWalletId);
    const toWallet = wallets.find(w => w.id === toWalletId);

    if (!fromWallet || !toWallet) {
      toast({ title: "Error", description: "No se encontraron las billeteras.", variant: "destructive" });
      return;
    }

    const transferId = `transfer-${Date.now()}`;
    const date = new Date();

    const expenseTransaction: Transaction = {
      id: `trans-${Date.now()}-exp`,
      description: `Traspaso a ${toWallet.name}`,
      amount: amountInUSD,
      date,
      walletId: fromWalletId,
      categoryId: 'cat-transfer',
      type: 'expense',
      transferId,
    };

    const incomeTransaction: Transaction = {
      id: `trans-${Date.now()}-inc`,
      description: `Traspaso desde ${fromWallet.name}`,
      amount: amountInUSD,
      date,
      walletId: toWalletId,
      categoryId: 'cat-transfer',
      type: 'income',
      transferId,
    };

    setTransactions(prev => [incomeTransaction, expenseTransaction, ...prev]);

    setWallets(prevWallets => prevWallets.map(wallet => {
      if (wallet.id === fromWalletId) return { ...wallet, balance: wallet.balance - amountInUSD };
      if (wallet.id === toWalletId) return { ...wallet, balance: wallet.balance + amountInUSD };
      return wallet;
    }));

    setIsTransferDialogOpen(false);
    transferForm.reset();
    toast({ title: "Traspaso completado", description: `Se movió ${amountInUSD.toFixed(2)} USD de ${fromWallet.name} a ${toWallet.name}.` });
  };

  const onDistributeSubmit = (values: z.infer<typeof distributionSchema>) => {
    const { amount, currency, toWalletId } = values;
    const amountInUSD = currency === 'CUP' ? amount / exchangeRate : amount;

    const toWallet = wallets.find(w => w.id === toWalletId);
    if (!toWallet) {
      toast({ title: "Error", description: "No se encontró la billetera de destino.", variant: "destructive" });
      return;
    }

    const newTransaction: Transaction = {
      id: `trans-${Date.now()}`,
      description: 'Distribución de ingresos',
      amount: amountInUSD,
      date: new Date(),
      walletId: toWalletId,
      categoryId: 'cat-income-1',
      type: 'income',
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setWallets(prevWallets => prevWallets.map(wallet => {
      if (wallet.id === toWalletId) return { ...wallet, balance: wallet.balance + amountInUSD };
      return wallet;
    }));

    setIsDistributionDialogOpen(false);
    distributionForm.reset();
    toast({ title: "Ingreso distribuido", description: `Se añadieron ${amountInUSD.toFixed(2)} USD a ${toWallet.name}.` });
  };

  const onLoanSubmit = (values: z.infer<typeof loanSchema>) => {
    const amountInUSD = values.currency === 'CUP' ? values.amount / exchangeRate : values.amount;

    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      person: values.person,
      description: values.description,
      totalAmount: amountInUSD,
      paidAmount: 0,
      walletId: values.walletId,
      date: new Date(),
      status: 'outstanding',
    };

    setLoans(prev => [newLoan, ...prev]);

    const newTransaction: Transaction = {
      id: `trans-${Date.now()}`,
      description: `Préstamo a ${values.person}: ${values.description}`,
      amount: amountInUSD,
      date: new Date(),
      walletId: values.walletId,
      categoryId: 'cat-loan',
      type: 'expense',
      loanId: newLoan.id,
    };
    setTransactions(prev => [newTransaction, ...prev]);

    setWallets(prev => prev.map(wallet =>
      wallet.id === values.walletId ? { ...wallet, balance: wallet.balance - amountInUSD } : wallet
    ));

    setIsLoanDialogOpen(false);
    loanForm.reset();
    toast({ title: "Préstamo registrado", description: `Se ha registrado un préstamo a ${values.person}.` });
  };

  const onLoanPaymentSubmit = (values: z.infer<typeof loanPaymentSchema>) => {
    if (!loanToPay) return;
    const paymentAmountUSD = values.currency === 'CUP' ? values.amount / exchangeRate : values.amount;
    const remainingAmount = loanToPay.totalAmount - loanToPay.paidAmount;

    if (paymentAmountUSD > remainingAmount) {
      toast({ title: "Monto inválido", description: `El pago no puede exceder la deuda pendiente de ${remainingAmount.toFixed(2)} USD.`, variant: "destructive" });
      return;
    }

    setLoans(prev => prev.map(l => {
      if (l.id === loanToPay.id) {
        const newPaidAmount = l.paidAmount + paymentAmountUSD;
        return { ...l, paidAmount: newPaidAmount, status: newPaidAmount >= l.totalAmount ? 'paid' : 'outstanding' };
      }
      return l;
    }));

    const newTransaction: Transaction = {
      id: `trans-${Date.now()}`,
      description: `Pago parcial de préstamo de ${loanToPay.person}`,
      amount: paymentAmountUSD,
      date: new Date(),
      walletId: loanToPay.walletId,
      categoryId: 'cat-income-2',
      type: 'income',
      loanId: loanToPay.id,
    };
    setTransactions(prev => [newTransaction, ...prev]);

    setWallets(prev => prev.map(wallet =>
      wallet.id === loanToPay.walletId ? { ...wallet, balance: wallet.balance + paymentAmountUSD } : wallet
    ));

    toast({ title: "Pago registrado", description: `Se registró un pago de ${paymentAmountUSD.toFixed(2)} USD para el préstamo de ${loanToPay.person}.` });
    setIsLoanPaymentDialogOpen(false);
    setLoanToPay(null);
  };

  const onDebtSubmit = (values: z.infer<typeof debtSchema>) => {
    const amountInUSD = values.currency === 'CUP' ? values.amount / exchangeRate : values.amount;

    const newDebt: Debt = {
      id: `debt-${Date.now()}`,
      person: values.person,
      description: values.description,
      totalAmount: amountInUSD,
      paidAmount: 0,
      walletId: values.walletId,
      date: new Date(),
      dueDate: values.dueDate,
      status: 'outstanding',
    };

    setDebts(prev => [newDebt, ...prev]);

    const newTransaction: Transaction = {
      id: `trans-${Date.now()}`,
      description: `Deuda con ${values.person}: ${values.description}`,
      amount: amountInUSD,
      date: new Date(),
      walletId: values.walletId,
      categoryId: 'cat-income-1',
      type: 'income',
      loanId: newDebt.id,
    };
    setTransactions(prev => [newTransaction, ...prev]);

    setWallets(prev => prev.map(wallet =>
      wallet.id === values.walletId ? { ...wallet, balance: wallet.balance + amountInUSD } : wallet
    ));

    setIsDebtDialogOpen(false);
    debtForm.reset();
    toast({ title: "Deuda registrada", description: `Se ha registrado una deuda con ${values.person}.` });
  };

  const onDebtPaymentSubmit = (values: z.infer<typeof debtPaymentSchema>) => {
    if (!debtToPay) return;
    const paymentAmountUSD = values.currency === 'CUP' ? values.amount / exchangeRate : values.amount;
    const remainingAmount = debtToPay.totalAmount - debtToPay.paidAmount;

    if (paymentAmountUSD > remainingAmount) {
      toast({ title: "Monto inválido", description: `El pago no puede exceder la deuda pendiente de ${remainingAmount.toFixed(2)} USD.`, variant: "destructive" });
      return;
    }

    setDebts(prev => prev.map(d => {
      if (d.id === debtToPay.id) {
        const newPaidAmount = d.paidAmount + paymentAmountUSD;
        return { ...d, paidAmount: newPaidAmount, status: newPaidAmount >= d.totalAmount ? 'paid' : 'outstanding' };
      }
      return d;
    }));

    const newTransaction: Transaction = {
      id: `trans-${Date.now()}`,
      description: `Pago de deuda a ${debtToPay.person}`,
      amount: paymentAmountUSD,
      date: new Date(),
      walletId: debtToPay.walletId,
      categoryId: 'cat-loan',
      type: 'expense',
      loanId: debtToPay.id,
    };
    setTransactions(prev => [newTransaction, ...prev]);

    setWallets(prev => prev.map(wallet =>
      wallet.id === debtToPay.walletId ? { ...wallet, balance: wallet.balance - paymentAmountUSD } : wallet
    ));

    toast({ title: "Pago registrado", description: `Se registró un pago de ${paymentAmountUSD.toFixed(2)} USD para la deuda con ${debtToPay.person}.` });
    setIsDebtPaymentDialogOpen(false);
    setDebtToPay(null);
  };

  const openWalletDialog = (wallet: Wallet) => {
    setWalletToEdit(wallet);
    const balanceInCUP = wallet.balance * exchangeRate;
    walletForm.reset({ name: wallet.name, balance: isNaN(balanceInCUP) ? 0 : balanceInCUP, currency: 'CUP' });
    setIsWalletDialogOpen(true);
  };

  const handleOpenTransactionDialog = () => {
    transactionForm.reset({
      description: '', amount: 0, currency: 'CUP', date: new Date(), walletId: '', categoryId: '', type: 'expense',
    });
    setIsTransactionDialogOpen(true);
  };

  const openRevertDialog = (transaction: Transaction) => {
    setTransactionToRevert(transaction);
    setIsRevertDialogOpen(true);
  };

  const handleRevertTransaction = () => {
    if (!transactionToRevert) return;

    setWallets(prevWallets => prevWallets.map(wallet => {
      if (wallet.id === transactionToRevert.walletId) {
        const newBalance = transactionToRevert.type === 'income'
          ? wallet.balance - transactionToRevert.amount
          : wallet.balance + transactionToRevert.amount;
        return { ...wallet, balance: newBalance };
      }
      return wallet;
    }));

    setTransactions(prev => prev.filter(t => t.id !== transactionToRevert.id));

    toast({
      title: "Transacción revertida",
      description: `Se eliminó "${transactionToRevert.description}" y se restauró el balance.`,
    });

    setIsRevertDialogOpen(false);
    setTransactionToRevert(null);
  };

  const onBagSubmit = (values: z.infer<typeof bagSchema>) => {
    const balance = values.balance !== undefined ? values.balance / exchangeRate : 0;
    if (editingBag) {
      setDistributionBags(prev => prev.map(b => b.id === editingBag.id ? {
        ...b, name: values.name, percentage: values.percentage, description: values.description || '',
        icon: values.icon, color: values.color, balance,
      } : b));
      toast({ title: "Bolsa actualizada", description: `${values.name} ha sido modificada.` });
    } else {
      const newBag: DistributionBag = {
        id: `bag-${Date.now()}`,
        name: values.name,
        percentage: values.percentage,
        description: values.description || '',
        icon: values.icon,
        color: values.color,
        balance: 0,
      };
      setDistributionBags(prev => [...prev, newBag]);
      toast({ title: "Bolsa agregada", description: `${values.name} ha sido añadida.` });
    }
    setIsBagDialogOpen(false);
    setEditingBag(null);
    bagForm.reset();
  };

  const handleDeleteBag = () => {
    if (!bagToDelete) return;
    setDistributionBags(prev => prev.filter(b => b.id !== bagToDelete.id));
    toast({ title: "Bolsa eliminada", description: `${bagToDelete.name} ha sido eliminada.` });
    setBagToDelete(null);
  };

  const handleConfirmDistribution = () => {
    const incomeIds = undistributedIncomes.map(t => t.id);
    const total = undistributedIncomes.reduce((acc, t) => acc + t.amount, 0);
    const totalPct = distributionBags.reduce((acc, b) => acc + b.percentage, 0) || 100;
    setDistributionBags(prev => prev.map(b => ({
      ...b,
      balance: (b.balance || 0) + total * (b.percentage / totalPct),
    })));
    setTransactions(prev => prev.map(t => incomeIds.includes(t.id) ? { ...t, distributed: true } : t));
    setIsDistributeIncomeDialogOpen(false);
    toast({ title: "Ingresos distribuidos", description: `${(total * exchangeRate).toLocaleString('es-ES', { maximumFractionDigits: 0 })} CUP distribuidos en tus bolsas.` });
  };

  const totalBalance = useMemo(() => wallets.reduce((acc, w) => acc + w.balance, 0), [wallets]);
  const monthlyIncome = useMemo(() => transactions.filter(t => t.type === 'income' && isThisMonth(t.date) && t.categoryId !== 'cat-transfer').reduce((acc, t) => acc + t.amount, 0), [transactions]);
  const monthlyExpenses = useMemo(() => transactions.filter(t => t.type === 'expense' && isThisMonth(t.date) && t.categoryId !== 'cat-transfer').reduce((acc, t) => acc + t.amount, 0), [transactions]);
  const monthlyBalance = monthlyIncome - monthlyExpenses;
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
        return { name: cat.name, value: total * exchangeRate, icon: cat.icon };
      })
      .filter(d => d.value > 0);

    const walletDistribution = wallets.map(wallet => ({
      name: wallet.name,
      value: wallet.balance * exchangeRate,
      icon: initialWallets.find(iw => iw.id === wallet.id)?.icon || WalletIcon,
    }));

    return { monthlySummary, categorySpend, walletDistribution };
  }, [transactions, wallets, exchangeRate]);

  const openLoanPaymentDialog = (loan: Loan) => {
    setLoanToPay(loan);
    const remainingAmount = loan.totalAmount - loan.paidAmount;
    loanPaymentForm.reset({ amount: remainingAmount * exchangeRate, currency: 'CUP' });
    setIsLoanPaymentDialogOpen(true);
  };

  const openDebtPaymentDialog = (debt: Debt) => {
    setDebtToPay(debt);
    const remainingAmount = debt.totalAmount - debt.paidAmount;
    debtPaymentForm.reset({ amount: remainingAmount * exchangeRate, currency: 'CUP' });
    setIsDebtPaymentDialogOpen(true);
  };

  const transactionColumns = useMemo(() => getTransactionColumns(wallets, transactionCategories, exchangeRate, openRevertDialog), [wallets, exchangeRate]);
  const loanColumns = useMemo(() => getLoanColumns(exchangeRate, openLoanPaymentDialog), [exchangeRate]);

  const incomes = useMemo(() => transactions.filter(t => t.type === 'income' && t.categoryId !== 'cat-transfer'), [transactions]);
  const expenses = useMemo(() => transactions.filter(t => t.type === 'expense' && t.categoryId !== 'cat-transfer'), [transactions]);
  const transfers = useMemo(() => transactions.filter(t => t.categoryId === 'cat-transfer'), [transactions]);

  if (!isClient) return null;

  const getWalletIcon = (walletId: string): LucideIcon => {
    const allWallets = initialWallets;
    const wallet = allWallets.find(w => w.id === walletId);
    return wallet?.icon || WalletIcon;
  };

  const iconMap: Record<string, LucideIcon> = {
    Shield, TrendingUp, Home, Gamepad2, BookOpen, Target, PiggyBank, Heart, GraduationCap,
    Sparkles, DollarSign, Wallet: WalletIcon, Plane, Coffee,
  };

  const bagColorMap: Record<string, { bg: string; text: string; badge: string; bar: string }> = {
    rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-500', bar: 'bg-rose-500' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-500', bar: 'bg-blue-500' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-500', bar: 'bg-amber-500' },
    green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', badge: 'bg-green-500', bar: 'bg-green-500' },
    violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400', badge: 'bg-violet-500', bar: 'bg-violet-500' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-500', bar: 'bg-orange-500' },
  };

  const walletGradients: Record<string, string> = {
    "wallet-efectivo-cup": "from-green-500 to-emerald-600",
    "wallet-efectivo-usd": "from-blue-500 to-blue-600",
    "wallet-banco": "from-violet-500 to-purple-600",
    "wallet-ahorros": "from-pink-500 to-rose-600",
    "wallet-inversion": "from-amber-500 to-orange-600",
    "wallet-digital-1": "from-cyan-500 to-teal-600",
    "wallet-digital-2": "from-indigo-500 to-indigo-600",
  };

  const renderDebtColumns = () => [
    {
      accessorKey: "date",
      header: "Fecha",
      cell: ({ row }: any) => <span className="text-sm text-muted-foreground">{format(new Date(row.original.date), "dd MMM yyyy", { locale: es })}</span>,
    },
    {
      accessorKey: "person",
      header: "Acreedor",
      cell: ({ row }: any) => <span className="text-sm font-medium">{row.original.person}</span>,
    },
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }: any) => <span className="text-sm text-muted-foreground">{row.original.description}</span>,
    },
    {
      accessorKey: "progress",
      header: "Progreso",
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
      accessorKey: "remaining",
      header: "Pendiente",
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
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }: any) => (
        <Badge className={`rounded-full text-xs px-3 py-0.5 font-medium ${
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
            <Button size="sm" className="h-8 rounded-full text-xs px-3" onClick={() => openDebtPaymentDialog(row.original)}>
              <DollarSign className="h-3 w-3 mr-1" />
              Pagar
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-24 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <header className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Finanzas</h1>
          <p className="text-sm text-muted-foreground">Tu centro de mando financiero personal</p>
        </header>
        <div className="flex items-center gap-2">
          <Dialog open={isLoanDialogOpen} onOpenChange={setIsLoanDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full">
                <LandPlot className="mr-1.5 h-4 w-4" />
                Préstamo
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Nuevo Préstamo</DialogTitle>
                <DialogDescription>Registra el dinero que has prestado a alguien.</DialogDescription>
              </DialogHeader>
              <Form {...loanForm}>
                <form onSubmit={loanForm.handleSubmit(onLoanSubmit)} className="space-y-4">
                  <FormField control={loanForm.control} name="person" render={({ field }) => (<FormItem><FormLabel>Persona</FormLabel><FormControl><Input {...field} placeholder="Ej: Juan Pérez" /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={loanForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Input {...field} placeholder="Ej: Para el almuerzo" /></FormControl><FormMessage /></FormItem>)}/>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={loanForm.control} name="amount" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Monto</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={loanForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                  </div>
                  <FormField control={loanForm.control} name="walletId" render={({ field }) => (<FormItem><FormLabel>Billetera de Origen</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                  <DialogFooter><Button type="submit" className="rounded-full">Confirmar Préstamo</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Dialog open={isDebtDialogOpen} onOpenChange={setIsDebtDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full">
                <BadgePercent className="mr-1.5 h-4 w-4" />
                Deuda
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Deuda</DialogTitle>
                <DialogDescription>Registra el dinero que le debes a alguien.</DialogDescription>
              </DialogHeader>
              <Form {...debtForm}>
                <form onSubmit={debtForm.handleSubmit(onDebtSubmit)} className="space-y-4">
                  <FormField control={debtForm.control} name="person" render={({ field }) => (<FormItem><FormLabel>Acreedor</FormLabel><FormControl><Input {...field} placeholder="Ej: María García" /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={debtForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Input {...field} placeholder="Ej: Préstamo para el curso" /></FormControl><FormMessage /></FormItem>)}/>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={debtForm.control} name="amount" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Monto</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={debtForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                  </div>
                  <FormField control={debtForm.control} name="walletId" render={({ field }) => (<FormItem><FormLabel>Billetera donde recibiste</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                  <FormField control={debtForm.control} name="dueDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Fecha de vencimiento (opcional)</FormLabel>
                      <Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal rounded-full", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP", { locale: es }) : "Elige una fecha"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <DialogFooter><Button type="submit" className="rounded-full">Registrar Deuda</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full">
                <ArrowRightLeft className="mr-1.5 h-4 w-4" />
                Traspaso
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Nuevo Traspaso</DialogTitle>
                <DialogDescription>Mueve dinero entre tus billeteras.</DialogDescription>
              </DialogHeader>
              <Form {...transferForm}>
                <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={transferForm.control} name="amount" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Monto</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={transferForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                  </div>
                  <FormField control={transferForm.control} name="fromWalletId" render={({ field }) => (<FormItem><FormLabel>Desde</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Billetera de Origen" /></SelectTrigger></FormControl><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                  <FormField control={transferForm.control} name="toWalletId" render={({ field }) => (<FormItem><FormLabel>Hacia</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Billetera de Destino" /></SelectTrigger></FormControl><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                  <DialogFooter><Button type="submit" className="rounded-full">Confirmar Traspaso</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenTransactionDialog} className="rounded-full">
                <PlusCircle className="mr-1.5 h-4 w-4" />
                Nueva Transacción
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Nueva Transacción</DialogTitle>
                <DialogDescription>Registra un nuevo ingreso o gasto.</DialogDescription>
              </DialogHeader>
              <Form {...transactionForm}>
                <form onSubmit={transactionForm.handleSubmit(onTransactionSubmit)} className="space-y-4">
                  <FormField control={transactionForm.control} name="type" render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="expense">Gasto</SelectItem><SelectItem value="income">Ingreso</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                  <FormField control={transactionForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Input {...field} placeholder="Ej: Café con amigos" /></FormControl><FormMessage /></FormItem>)}/>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={transactionForm.control} name="amount" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Monto</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={transactionForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={transactionForm.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Fecha</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal rounded-full", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
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

      {/* Separador sutil */}
      <div className="h-px bg-border/50" />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Balance Total" icon={Coins} accent="blue" value={<CurrencyDisplay usd={totalBalance} exchangeRate={exchangeRate} large />} />
        <StatCard title="Ingresos del Mes" icon={Download} accent="green" value={<CurrencyDisplay usd={monthlyIncome} exchangeRate={exchangeRate} large />}>
          <Dialog open={isDistributionDialogOpen} onOpenChange={setIsDistributionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full mt-2 rounded-full text-xs h-8">Distribuir</Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Distribuir Ingresos</DialogTitle>
                <DialogDescription>Crea una nueva transacción de ingreso en la billetera que elijas.</DialogDescription>
              </DialogHeader>
              <Form {...distributionForm}>
                <form onSubmit={distributionForm.handleSubmit(onDistributeSubmit)} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={distributionForm.control} name="amount" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Monto</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={distributionForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                  </div>
                  <FormField control={distributionForm.control} name="toWalletId" render={({ field }) => (<FormItem><FormLabel>Hacia</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Billetera de Destino" /></SelectTrigger></FormControl><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                  <DialogFooter><Button type="submit" className="rounded-full">Crear Ingreso</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </StatCard>
        <StatCard title="Gastos del Mes" icon={Upload} accent="red" value={<CurrencyDisplay usd={monthlyExpenses} exchangeRate={exchangeRate} large />} />
        <StatCard
          title="Balance Mensual"
          icon={Scale}
          accent={monthlyBalance >= 0 ? "green" : "red"}
          value={
            <div className={cn(monthlyBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
              <CurrencyDisplay usd={monthlyBalance} exchangeRate={exchangeRate} large />
            </div>
          }
        />
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasa de Cambio</CardTitle>
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Settings className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">$1 USD =</span>
              <Input
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                className="w-20 h-8 text-sm font-semibold text-right rounded-xl"
              />
              <span className="text-sm font-medium">CUP</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumen 6 Meses</CardTitle>
            <CardDescription>Evolución de ingresos y gastos mensuales</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlySummaryChart data={chartData.monthlySummary} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
            <CardDescription>Desglose del mes actual</CardDescription>
          </CardHeader>
          <CardContent>
            <CategorySpendChart data={chartData.categorySpend} />
          </CardContent>
        </Card>
      </div>

      {/* Wallets Section - Apple Wallet Style */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Billeteras</h2>
            <p className="text-xs text-muted-foreground">{wallets.length} billeteras &middot; Balance total: {(totalBalance * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {wallets.map((wallet, idx) => {
            const Icon = getWalletIcon(wallet.id);
            const gradient = walletGradients[wallet.id] || "from-gray-500 to-gray-600";
            return (
              <Card
                key={wallet.id}
                className={cn(
                  "relative overflow-hidden border-0 animate-slide-up",
                )}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
                <div className="absolute inset-0 bg-white/10 dark:bg-black/10" />
                <div className="relative z-10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm">
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <CardTitle className="text-sm font-medium text-white">{wallet.name}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full text-white/70 hover:text-white hover:bg-white/20"
                      onClick={() => openWalletDialog(wallet)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-white">
                    <div className="text-lg font-bold tracking-tight">
                      {(wallet.balance * exchangeRate).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-white/70">CUP</div>
                  </div>
                  <div className="text-[10px] text-white/50">
                    ${wallet.balance.toFixed(2)} USD
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Distribution Section - Notion Style */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Distribución del Dinero</h2>
            <p className="text-xs text-muted-foreground">Basado en 6 JARS (T. Harv Eker) y regla 50/30/20</p>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const totalUndistributed = undistributedIncomes.reduce((acc, t) => acc + t.amount, 0);
              if (totalUndistributed > 0) {
                return (
                  <Button onClick={() => setIsDistributeIncomeDialogOpen(true)} className="rounded-full text-xs h-8">
                    <Coins className="mr-1.5 h-3.5 w-3.5" />
                    Distribuir {(totalUndistributed * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP
                  </Button>
                );
              }
              return null;
            })()}
            <Button variant="outline" size="sm" className="rounded-full text-xs h-8" onClick={() => { setEditingBag(null); bagForm.reset({ name: "", percentage: 10, description: "", icon: "Target", color: "blue" }); setIsBagDialogOpen(true); }}>
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Agregar Bolsa
            </Button>
          </div>
        </div>

        {distributionBags.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No hay bolsas de distribución. Crea una para empezar.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Distribution bar - Apple style */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Distribución: {distributionBags.reduce((acc, b) => acc + b.percentage, 0)}%</span>
                {(() => {
                  const total = distributionBags.reduce((acc, b) => acc + b.percentage, 0);
                  if (total === 100) return <span className="text-green-500 font-medium">100%</span>;
                  if (total > 100) return <span className="text-red-500 font-medium">Excede por {total - 100}%</span>;
                  return <span className="text-amber-500 font-medium">Falta {100 - total}%</span>;
                })()}
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                {distributionBags.map((bag) => {
                  const color = bagColorMap[bag.color] || bagColorMap.blue;
                  return (
                    <div
                      key={bag.id}
                      className={cn(color.bar, "transition-all duration-500 first:rounded-l-full last:rounded-r-full")}
                      style={{ width: `${bag.percentage}%`, minWidth: bag.percentage > 0 ? "4px" : "0" }}
                      title={`${bag.name}: ${bag.percentage}%`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Bag cards */}
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
              {distributionBags.map((bag, idx) => {
                const IconComponent = iconMap[bag.icon] || WalletIcon;
                const color = bagColorMap[bag.color] || bagColorMap.blue;
                return (
                  <Card key={bag.id} className="animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-xl", color.bg)}>
                          <IconComponent className={cn("h-4 w-4", color.text)} />
                        </div>
                        <CardTitle className="text-sm font-medium">{bag.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => { setEditingBag(bag); bagForm.reset({ name: bag.name, percentage: bag.percentage, description: bag.description, icon: bag.icon, color: bag.color }); setIsBagDialogOpen(true); }}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-red-500 hover:text-red-700" onClick={() => setBagToDelete(bag)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className={cn("text-xs font-semibold text-white px-2 py-0.5 rounded-full", color.badge)}>{bag.percentage}%</span>
                        <CurrencyDisplay usd={bag.balance || 0} exchangeRate={exchangeRate} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{bag.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <div className="h-px bg-border/50" />

      {/* Tabs Section - Apple Segmented Control */}
      <Tabs defaultValue="expenses" className="space-y-6">
        <TabsList className="inline-flex h-10 p-1 rounded-full bg-muted">
          <TabsTrigger value="expenses" className="rounded-full text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Gastos
          </TabsTrigger>
          <TabsTrigger value="incomes" className="rounded-full text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Ingresos
          </TabsTrigger>
          <TabsTrigger value="transfers" className="rounded-full text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Traspasos
          </TabsTrigger>
          <TabsTrigger value="loans" className="rounded-full text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Préstamos
          </TabsTrigger>
          <TabsTrigger value="debts" className="rounded-full text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Deudas
          </TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Gastos</CardTitle>
              <CardDescription>{expenses.length} transacciones registradas</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={transactionColumns} data={expenses} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incomes Tab */}
        <TabsContent value="incomes" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Ingresos este mes</p>
                <p className="text-xl font-bold">{(monthlyIncome * exchangeRate).toLocaleString("es-ES", { minimumFractionDigits: 2 })} CUP</p>
                <p className="text-xs text-muted-foreground">${monthlyIncome.toFixed(2)} USD</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Transacciones de ingreso</p>
                <p className="text-xl font-bold">{incomes.filter(t => isThisMonth(t.date)).length}</p>
                <p className="text-xs text-muted-foreground">este mes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Promedio por ingreso</p>
                <p className="text-xl font-bold">
                  {incomes.filter(t => isThisMonth(t.date)).length > 0
                    ? `${((monthlyIncome / incomes.filter(t => isThisMonth(t.date)).length) * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP`
                    : "0 CUP"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Agregar Ingreso Rápido</CardTitle>
                <Button size="sm" variant="outline" className="rounded-full text-xs h-8" onClick={() => {
                  transactionForm.reset({ description: "", amount: 0, currency: "CUP", date: new Date(), walletId: "", categoryId: "", type: "income" });
                  setIsTransactionDialogOpen(true);
                }}>
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Ingreso detallado
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "Salario", category: "cat-income-1", icon: "💰" },
                  { label: "Freelance", category: "cat-income-2", icon: "💻" },
                  { label: "Venta", category: "cat-income-1", icon: "🛒" },
                  { label: "Devolución", category: "cat-income-2", icon: "↩️" },
                ].map(preset => (
                  <Button key={preset.label} variant="outline" size="sm" className="rounded-full text-xs h-8" onClick={() => {
                    transactionForm.reset({ description: preset.label, amount: 0, currency: "CUP", date: new Date(), walletId: "", categoryId: preset.category, type: "income" });
                    setIsTransactionDialogOpen(true);
                  }}>
                    {preset.icon} {preset.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={transactionColumns} data={incomes} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfers Tab */}
        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Traspasos</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={transactionColumns} data={transfers} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loans Tab */}
        <TabsContent value="loans" className="space-y-4">
          {(() => {
            const outstandingLoans = loans.filter(l => l.status === "outstanding");
            const paidLoans = loans.filter(l => l.status === "paid");
            const totalLent = outstandingLoans.reduce((acc, l) => acc + l.totalAmount, 0);
            const totalRecovered = outstandingLoans.reduce((acc, l) => acc + l.paidAmount, 0);
            const totalPending = totalLent - totalRecovered;

            return (
              <>
                <div className="grid gap-4 sm:grid-cols-4">
                  <Card>
                    <CardContent className="p-4 space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Prestado activo</p>
                      <p className="text-lg font-bold">{(totalLent * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      <p className="text-xs text-muted-foreground">${totalLent.toFixed(2)} USD</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Recuperado</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{(totalRecovered * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      <p className="text-xs text-muted-foreground">${totalRecovered.toFixed(2)} USD</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Por cobrar</p>
                      <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{(totalPending * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      <p className="text-xs text-muted-foreground">${totalPending.toFixed(2)} USD</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Préstamos</p>
                      <p className="text-lg font-bold">{outstandingLoans.length} activos</p>
                      <p className="text-xs text-muted-foreground">{paidLoans.length} completados</p>
                    </CardContent>
                  </Card>
                </div>

                {outstandingLoans.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Préstamos Pendientes</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {outstandingLoans.map(loan => {
                        const progress = (loan.paidAmount / loan.totalAmount) * 100;
                        const remaining = loan.totalAmount - loan.paidAmount;
                        return (
                          <Card key={loan.id} className="border-l-4 border-l-orange-500">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <h4 className="font-semibold text-sm">{loan.person}</h4>
                                  <p className="text-xs text-muted-foreground">{loan.description}</p>
                                  <p className="text-[10px] text-muted-foreground">{format(new Date(loan.date), "dd MMM yyyy", { locale: es })}</p>
                                </div>
                                <Button size="sm" variant="outline" className="rounded-full text-xs h-8" onClick={() => openLoanPaymentDialog(loan)}>
                                  <DollarSign className="h-3 w-3 mr-1" /> Cobrar
                                </Button>
                              </div>
                              <div className="space-y-1">
                                <Progress value={progress} className="h-2 rounded-full" />
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Préstamos Completados ({paidLoans.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {paidLoans.map(loan => (
                          <div key={loan.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-xl text-sm">
                            <div>
                              <span className="font-medium text-sm">{loan.person}</span>
                              <span className="text-muted-foreground text-xs ml-2">&mdash; {loan.description}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{(loan.totalAmount * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</span>
                              <Badge className="rounded-full text-[10px] px-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Pagado</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Todos los Préstamos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable columns={loanColumns} data={loans} />
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </TabsContent>

        {/* Debts Tab */}
        <TabsContent value="debts" className="space-y-4">
          {(() => {
            const outstandingDebts = debts.filter(d => d.status === "outstanding");
            const paidDebts = debts.filter(d => d.status === "paid");
            const totalDebt = outstandingDebts.reduce((acc, d) => acc + d.totalAmount, 0);
            const totalPaid = outstandingDebts.reduce((acc, d) => acc + d.paidAmount, 0);
            const totalRemaining = totalDebt - totalPaid;

            return (
              <>
                <div className="grid gap-4 sm:grid-cols-4">
                  <Card>
                    <CardContent className="p-4 space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Deuda activa</p>
                      <p className="text-lg font-bold">{(totalDebt * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      <p className="text-xs text-muted-foreground">${totalDebt.toFixed(2)} USD</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Pagado</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{(totalPaid * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      <p className="text-xs text-muted-foreground">${totalPaid.toFixed(2)} USD</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Por pagar</p>
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">{(totalRemaining * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</p>
                      <p className="text-xs text-muted-foreground">${totalRemaining.toFixed(2)} USD</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Deudas</p>
                      <p className="text-lg font-bold">{outstandingDebts.length} activas</p>
                      <p className="text-xs text-muted-foreground">{paidDebts.length} pagadas</p>
                    </CardContent>
                  </Card>
                </div>

                {outstandingDebts.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Deudas Pendientes</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {outstandingDebts.map(debt => {
                        const progress = (debt.paidAmount / debt.totalAmount) * 100;
                        const remaining = debt.totalAmount - debt.paidAmount;
                        const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date();

                        return (
                          <Card key={debt.id} className={cn("border-l-4", isOverdue ? "border-l-red-500" : "border-l-blue-500")}>
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-sm">{debt.person}</h4>
                                    {isOverdue && (
                                      <Badge className="rounded-full text-[10px] px-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                        Vencida
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{debt.description}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {format(new Date(debt.date), "dd MMM yyyy", { locale: es })}
                                    {debt.dueDate && ` · Vence: ${format(new Date(debt.dueDate), "dd MMM yyyy", { locale: es })}`}
                                  </p>
                                </div>
                                <Button size="sm" className="rounded-full text-xs h-8" onClick={() => openDebtPaymentDialog(debt)}>
                                  <DollarSign className="h-3 w-3 mr-1" /> Pagar
                                </Button>
                              </div>
                              <div className="space-y-1">
                                <Progress value={progress} className="h-2 rounded-full" />
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Deudas Pagadas ({paidDebts.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {paidDebts.map(debt => (
                          <div key={debt.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-xl text-sm">
                            <div>
                              <span className="font-medium text-sm">{debt.person}</span>
                              <span className="text-muted-foreground text-xs ml-2">&mdash; {debt.description}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{(debt.totalAmount * exchangeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })} CUP</span>
                              <Badge className="rounded-full text-[10px] px-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Pagado</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Todas las Deudas</CardTitle>
                  </CardHeader>
                  <CardContent>
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
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Editar Billetera</DialogTitle>
            <DialogDescription>Modifica el saldo de tu billetera.</DialogDescription>
          </DialogHeader>
          <Form {...walletForm}>
            <form onSubmit={walletForm.handleSubmit(onWalletSubmit)} className="space-y-4">
              <FormField control={walletForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>)}/>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={walletForm.control} name="balance" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Nuevo Saldo</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={walletForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
              </div>
              <DialogFooter><Button type="submit" className="rounded-full">Guardar Cambios</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Loan Payment Dialog */}
      <Dialog open={isLoanPaymentDialogOpen} onOpenChange={setIsLoanPaymentDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Pago de Préstamo</DialogTitle>
            <DialogDescription>{loanToPay && `Préstamo a: ${loanToPay.person}`}</DialogDescription>
          </DialogHeader>
          <Form {...loanPaymentForm}>
            <form onSubmit={loanPaymentForm.handleSubmit(onLoanPaymentSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField control={loanPaymentForm.control} name="amount" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Monto del Pago</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={loanPaymentForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
              </div>
              <DialogFooter><Button type="submit" className="rounded-full">Registrar Pago</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Debt Payment Dialog */}
      <Dialog open={isDebtPaymentDialogOpen} onOpenChange={setIsDebtPaymentDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Pago de Deuda</DialogTitle>
            <DialogDescription>{debtToPay && `Deuda con: ${debtToPay.person}`}</DialogDescription>
          </DialogHeader>
          <Form {...debtPaymentForm}>
            <form onSubmit={debtPaymentForm.handleSubmit(onDebtPaymentSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField control={debtPaymentForm.control} name="amount" render={({ field }) => (<FormItem className="col-span-2"><FormLabel>Monto del Pago</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
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
              Esta acción eliminará la transacción "{transactionToRevert?.description}" y restaurará el balance de la billetera. Esta acción no se puede deshacer.
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
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingBag ? "Editar Bolsa" : "Agregar Bolsa"}</DialogTitle>
            <DialogDescription>
              {editingBag ? "Modifica los detalles de esta bolsa de distribución." : "Crea una nueva bolsa para distribuir tu dinero."}
            </DialogDescription>
          </DialogHeader>
          <Form {...bagForm}>
            <form onSubmit={bagForm.handleSubmit(onBagSubmit)} className="space-y-4">
              <FormField control={bagForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} placeholder="Ej: Vacaciones" /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={bagForm.control} name="percentage" render={({ field }) => (<FormItem><FormLabel>Porcentaje (%)</FormLabel><FormControl><Input type="number" {...field} step="0.1" min="0.1" max="100" /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={bagForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Input {...field} placeholder="Breve descripción" /></FormControl><FormMessage /></FormItem>)}/>
              {editingBag && (
                <FormField control={bagForm.control} name="balance" render={({ field }) => (<FormItem><FormLabel>Saldo Actual (CUP)</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
              )}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={bagForm.control} name="icon" render={({ field }) => (
                  <FormItem><FormLabel>Icono</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                      <SelectContent className="max-h-60">
                        {Object.keys(iconMap).map(key => {
                          const Icon = iconMap[key];
                          return (<SelectItem key={key} value={key}><div className="flex items-center gap-2"><Icon className="h-4 w-4" /><span>{key}</span></div></SelectItem>);
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={bagForm.control} name="color" render={({ field }) => (
                  <FormItem><FormLabel>Color</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(bagColorMap).map(([key, color]) => (
                          <SelectItem key={key} value={key}><div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full ${color.bar}`} /><span className="capitalize">{key}</span></div></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-full" onClick={() => { setIsBagDialogOpen(false); setEditingBag(null); }}>Cancelar</Button>
                <Button type="submit" className="rounded-full">{editingBag ? "Guardar Cambios" : "Agregar Bolsa"}</Button>
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
            <AlertDialogDescription>
              Se eliminará "{bagToDelete?.name}" de tu distribución. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" onClick={() => setBagToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBag} className="rounded-full bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Distribute Income Dialog */}
      <Dialog open={isDistributeIncomeDialogOpen} onOpenChange={setIsDistributeIncomeDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Distribuir Ingresos</DialogTitle>
            <DialogDescription>
              Distribuye tus ingresos no asignados según tus bolsas de distribución.
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const total = undistributedIncomes.reduce((acc, t) => acc + t.amount, 0);
            return (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-xs text-muted-foreground">Total a distribuir</p>
                  <CurrencyDisplay usd={total} exchangeRate={exchangeRate} large />
                  <p className="text-xs text-muted-foreground mt-1">
                    {undistributedIncomes.length} ingreso{undistributedIncomes.length !== 1 ? "s" : ""} sin distribuir
                  </p>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {distributionBags.map(bag => {
                    const IconComponent = iconMap[bag.icon] || WalletIcon;
                    const color = bagColorMap[bag.color] || bagColorMap.blue;
                    const amount = total * (bag.percentage / 100);
                    return (
                      <div key={bag.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1.5 rounded-lg", color.bg)}>
                            <IconComponent className={cn("h-3.5 w-3.5", color.text)} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{bag.name}</p>
                            <p className="text-xs text-muted-foreground">{bag.percentage}%</p>
                          </div>
                        </div>
                        <CurrencyDisplay usd={amount} exchangeRate={exchangeRate} />
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                  Al marcar como distribuido, confirmas que has asignado estos ingresos a tus bolsas.
                  No se crearán transacciones automáticamente.
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" className="rounded-full" onClick={() => setIsDistributeIncomeDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleConfirmDistribution} className="rounded-full">
                    <Coins className="mr-2 h-4 w-4" />
                    Marcar como Distribuido
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
