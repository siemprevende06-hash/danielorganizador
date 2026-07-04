import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { wallets as initialWallets, transactionCategories, defaultDistributionBags } from '@/lib/data';
import type { Wallet, Transaction, Loan, DistributionBag } from '@/lib/definitions';
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
import { CalendarIcon, PlusCircle, Edit, Coins, Settings, LucideIcon, Wallet as WalletIcon, RotateCcw, ArrowRightLeft, Download, Upload, Scale, LandPlot, DollarSign, Trash2, Plus, Shield, TrendingUp, Home, Gamepad2, BookOpen, PiggyBank, Heart, GraduationCap, Sparkles, Plane, Coffee, Target } from 'lucide-react';
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

const bagSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio.'),
  percentage: z.coerce.number().min(0.1, 'Debe ser mayor a 0').max(100, 'No puede exceder 100'),
  description: z.string().optional(),
  icon: z.string().min(1, 'Selecciona un icono.'),
  color: z.string().min(1, 'Selecciona un color.'),
  balance: z.coerce.number().optional(),
});

const CurrencyDisplay = ({ usd, exchangeRate }: { usd: number, exchangeRate: number }) => {
  const cup = usd * exchangeRate;
  return (
    <div className="flex flex-col text-right">
      <span className="font-bold text-lg">{cup.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CUP</span>
      <span className="text-sm text-muted-foreground">{usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
    </div>
  );
};

export default function Finance() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isDistributionDialogOpen, setIsDistributionDialogOpen] = useState(false);
  const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
  const [transactionToRevert, setTransactionToRevert] = useState<Transaction | null>(null);
  const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null);
  const [exchangeRate, setExchangeRate] = useState(360);
  const { toast } = useToast();
  const [isLoanPaymentDialogOpen, setIsLoanPaymentDialogOpen] = useState(false);
  const [loanToPay, setLoanToPay] = useState<Loan | null>(null);
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
            if(key === 'date') return new Date(value);
            return value;
        });
        setLoans(parsed);
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
      localStorage.setItem('exchangeRate', exchangeRate.toString());
      localStorage.setItem('distributionBags', JSON.stringify(distributionBags));
    }
  }, [wallets, transactions, loans, exchangeRate, distributionBags, isClient]);
  
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
    }
  });

  const distributionForm = useForm<z.infer<typeof distributionSchema>>({
      resolver: zodResolver(distributionSchema),
      defaultValues: {
          amount: 0,
          currency: 'CUP',
          toWalletId: '',
      }
  });

  const loanForm = useForm<z.infer<typeof loanSchema>>({
      resolver: zodResolver(loanSchema),
      defaultValues: {
          person: '',
          description: '',
          amount: 0,
          currency: 'CUP',
          walletId: '',
      }
  });

  const loanPaymentForm = useForm<z.infer<typeof loanPaymentSchema>>({
    resolver: zodResolver(loanPaymentSchema),
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
          const newBalance =
            values.type === 'income'
              ? wallet.balance + amountInUSD
              : wallet.balance - amountInUSD;
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
        if (wallet.id === fromWalletId) {
            return { ...wallet, balance: wallet.balance - amountInUSD };
        }
        if (wallet.id === toWalletId) {
            return { ...wallet, balance: wallet.balance + amountInUSD };
        }
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

    setWallets(prevWallets =>
      prevWallets.map(wallet => {
        if (wallet.id === toWalletId) {
          return { ...wallet, balance: wallet.balance + amountInUSD };
        }
        return wallet;
      })
    );

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
        wallet.id === values.walletId 
          ? { ...wallet, balance: wallet.balance - amountInUSD }
          : wallet
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
      toast({ title: "Monto inválido", description: `El pago no puede exceder la deuda pendiente de ${remainingAmount.toFixed(2)} USD.`, variant: "destructive"});
      return;
    }
  
    setLoans(prev => prev.map(l => {
      if (l.id === loanToPay.id) {
        const newPaidAmount = l.paidAmount + paymentAmountUSD;
        return {
          ...l,
          paidAmount: newPaidAmount,
          status: newPaidAmount >= l.totalAmount ? 'paid' : 'outstanding'
        };
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
      wallet.id === loanToPay.walletId
        ? { ...wallet, balance: wallet.balance + paymentAmountUSD }
        : wallet
    ));
  
    toast({ title: "Pago registrado", description: `Se registró un pago de ${paymentAmountUSD.toFixed(2)} USD para el préstamo de ${loanToPay.person}.` });
    setIsLoanPaymentDialogOpen(false);
    setLoanToPay(null);
  };

  const openWalletDialog = (wallet: Wallet) => {
    setWalletToEdit(wallet);
    const balanceInCUP = wallet.balance * exchangeRate;
    walletForm.reset({ 
        name: wallet.name, 
        balance: isNaN(balanceInCUP) ? 0 : balanceInCUP, 
        currency: 'CUP' 
    });
    setIsWalletDialogOpen(true);
  };
  
  const handleOpenTransactionDialog = () => {
    transactionForm.reset({
      description: '',
      amount: 0,
      currency: 'CUP',
      date: new Date(),
      walletId: '',
      categoryId: '',
      type: 'expense',
    });
    setIsTransactionDialogOpen(true);
  }

  const openRevertDialog = (transaction: Transaction) => {
    setTransactionToRevert(transaction);
    setIsRevertDialogOpen(true);
  }

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
        description: `Se eliminó "${transactionToRevert.description}" y se restauró el balance.`
    });

    setIsRevertDialogOpen(false);
    setTransactionToRevert(null);
  }

  const onBagSubmit = (values: z.infer<typeof bagSchema>) => {
    const balance = values.balance !== undefined ? values.balance / ((bagForm.getValues as any)('currency') === 'CUP' ? exchangeRate : 1) : 0;
    if (editingBag) {
      setDistributionBags(prev => prev.map(b => b.id === editingBag.id ? { ...b, name: values.name, percentage: values.percentage, description: values.description || '', icon: values.icon, color: values.color, balance } : b));
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

        return {
            month: format(date, 'MMM', { locale: es }),
            income: income * exchangeRate,
            expense: expense * exchangeRate,
        };
    }).reverse();

    const categorySpend = transactionCategories
        .filter(cat => cat.type === 'expense')
        .map(cat => {
            const total = transactions
                .filter(t => t.categoryId === cat.id && isThisMonth(new Date(t.date)))
                .reduce((acc, t) => acc + t.amount, 0);
            return {
                name: cat.name,
                value: total * exchangeRate,
                icon: cat.icon
            };
        })
        .filter(d => d.value > 0);

    const walletDistribution = wallets
        .map(wallet => ({
            name: wallet.name,
            value: wallet.balance * exchangeRate,
            icon: initialWallets.find(iw => iw.id === wallet.id)?.icon || WalletIcon
        }));

    return { monthlySummary, categorySpend, walletDistribution };
  }, [transactions, wallets, exchangeRate]);

  const openLoanPaymentDialog = (loan: Loan) => {
    setLoanToPay(loan);
    const remainingAmount = loan.totalAmount - loan.paidAmount;
    loanPaymentForm.reset({
      amount: remainingAmount * exchangeRate,
      currency: 'CUP',
    });
    setIsLoanPaymentDialogOpen(true);
  };

  const transactionColumns = useMemo(() => getTransactionColumns(wallets, transactionCategories, exchangeRate, openRevertDialog), [wallets, exchangeRate]);
  const loanColumns = useMemo(() => getLoanColumns(exchangeRate, openLoanPaymentDialog), [exchangeRate]);
  
  const incomes = useMemo(() => transactions.filter(t => t.type === 'income' && t.categoryId !== 'cat-transfer'), [transactions]);
  const expenses = useMemo(() => transactions.filter(t => t.type === 'expense' && t.categoryId !== 'cat-transfer'), [transactions]);
  const transfers = useMemo(() => transactions.filter(t => t.categoryId === 'cat-transfer'), [transactions]);
  
  if (!isClient) {
    return null;
  }

  const getWalletIcon = (walletId: string): LucideIcon => {
      const allWallets = initialWallets;
      const wallet = allWallets.find(w => w.id === walletId);
      return wallet?.icon || WalletIcon;
  };

  const iconMap: Record<string, LucideIcon> = {
    Shield, TrendingUp, Home, Gamepad2, BookOpen, Target, PiggyBank, Heart, GraduationCap, Sparkles, DollarSign, Wallet: WalletIcon, Plane, Coffee
  };

  const bagColorMap: Record<string, { bg: string; text: string; badge: string; bar: string }> = {
    rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-500', bar: 'bg-rose-500' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-500', bar: 'bg-blue-500' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-500', bar: 'bg-amber-500' },
    green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', badge: 'bg-green-500', bar: 'bg-green-500' },
    violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400', badge: 'bg-violet-500', bar: 'bg-violet-500' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-500', bar: 'bg-orange-500' },
  };

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <header>
          <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">Finanzas Personales</h1>
          <p className="text-muted-foreground mt-2">Tu centro de mando financiero</p>
        </header>
          <div className='flex items-center gap-2'>
              <Dialog open={isLoanDialogOpen} onOpenChange={setIsLoanDialogOpen}>
                  <DialogTrigger asChild>
                      <Button variant="outline">
                          <LandPlot className="mr-2 h-4 w-4" />
                          Préstamo
                      </Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Nuevo Préstamo</DialogTitle>
                          <DialogDescription>Registra el dinero que has prestado a alguien.</DialogDescription>
                      </DialogHeader>
                      <Form {...loanForm}>
                          <form onSubmit={loanForm.handleSubmit(onLoanSubmit)} className="space-y-4">
                              <FormField control={loanForm.control} name="person" render={({ field }) => (<FormItem><FormLabel>Persona</FormLabel><FormControl><Input {...field} placeholder="Ej: Juan Pérez" /></FormControl><FormMessage /></FormItem>)}/>
                              <FormField control={loanForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Input {...field} placeholder="Ej: Para el almuerzo" /></FormControl><FormMessage /></FormItem>)}/>
                              <div className="grid grid-cols-3 gap-4">
                                  <FormField control={loanForm.control} name="amount" render={({ field }) => (<FormItem className='col-span-2'><FormLabel>Monto</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                                  <FormField control={loanForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                              </div>
                              <FormField control={loanForm.control} name="walletId" render={({ field }) => (<FormItem><FormLabel>Billetera de Origen</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                              <DialogFooter><Button type="submit">Confirmar Préstamo</Button></DialogFooter>
                          </form>
                      </Form>
                  </DialogContent>
              </Dialog>
              <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                  <DialogTrigger asChild>
                      <Button variant="outline">
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          Traspaso
                      </Button>
                  </DialogTrigger>
                  <DialogContent>
                       <DialogHeader>
                          <DialogTitle>Nuevo Traspaso</DialogTitle>
                          <DialogDescription>Mueve dinero entre tus billeteras.</DialogDescription>
                      </DialogHeader>
                      <Form {...transferForm}>
                          <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-4">
                              <div className="grid grid-cols-3 gap-4">
                                  <FormField control={transferForm.control} name="amount" render={({ field }) => (<FormItem className='col-span-2'><FormLabel>Monto</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                                  <FormField control={transferForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                              </div>
                               <FormField control={transferForm.control} name="fromWalletId" render={({ field }) => (<FormItem><FormLabel>Desde</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Billetera de Origen" /></SelectTrigger></FormControl><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                               <FormField control={transferForm.control} name="toWalletId" render={({ field }) => (<FormItem><FormLabel>Hacia</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Billetera de Destino" /></SelectTrigger></FormControl><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                              <DialogFooter><Button type="submit">Confirmar Traspaso</Button></DialogFooter>
                          </form>
                      </Form>
                  </DialogContent>
              </Dialog>
              <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
                  <DialogTrigger asChild>
                      <Button onClick={handleOpenTransactionDialog}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Nueva Transacción
                      </Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                      <DialogTitle>Nueva Transacción</DialogTitle>
                      <DialogDescription>
                          Registra un nuevo ingreso o gasto.
                      </DialogDescription>
                      </DialogHeader>
                      <Form {...transactionForm}>
                      <form onSubmit={transactionForm.handleSubmit(onTransactionSubmit)} className="space-y-4">
                          <FormField control={transactionForm.control} name="type" render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="expense">Gasto</SelectItem><SelectItem value="income">Ingreso</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                          <FormField control={transactionForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Input {...field} placeholder="Ej: Café con amigos" /></FormControl><FormMessage /></FormItem>)}/>
                          <div className="grid grid-cols-3 gap-4">
                              <FormField control={transactionForm.control} name="amount" render={({ field }) => (<FormItem className='col-span-2'><FormLabel>Monto</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                              <FormField control={transactionForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <FormField control={transactionForm.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Fecha</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>{field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elige una fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className={cn("p-3 pointer-events-auto")} /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                              <FormField control={transactionForm.control} name="walletId" render={({ field }) => (<FormItem><FormLabel>Billetera</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                          </div>
                          <FormField control={transactionForm.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent>{transactionCategories.filter(c => c.type === transactionType).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                          <DialogFooter><Button type="submit">Guardar</Button></DialogFooter>
                      </form>
                      </Form>
                  </DialogContent>
              </Dialog>
          </div>
        </div>

         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <CurrencyDisplay usd={totalBalance} exchangeRate={exchangeRate} />
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <CurrencyDisplay usd={monthlyIncome} exchangeRate={exchangeRate} />
                   <Dialog open={isDistributionDialogOpen} onOpenChange={setIsDistributionDialogOpen}>
                      <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full mt-2">Distribuir</Button>
                      </DialogTrigger>
                      <DialogContent>
                          <DialogHeader>
                              <DialogTitle>Distribuir Ingresos</DialogTitle>
                              <DialogDescription>Crea una nueva transacción de ingreso en la billetera que elijas.</DialogDescription>
                          </DialogHeader>
                          <Form {...distributionForm}>
                              <form onSubmit={distributionForm.handleSubmit(onDistributeSubmit)} className="space-y-4">
                                  <div className="grid grid-cols-3 gap-4">
                                      <FormField control={distributionForm.control} name="amount" render={({ field }) => (<FormItem className='col-span-2'><FormLabel>Monto</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                                      <FormField control={distributionForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                                  </div>
                                  <FormField control={distributionForm.control} name="toWalletId" render={({ field }) => (<FormItem><FormLabel>Hacia</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Billetera de Destino" /></SelectTrigger></FormControl><SelectContent>{wallets.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                                  <DialogFooter><Button type="submit">Crear Ingreso</Button></DialogFooter>
                              </form>
                          </Form>
                      </DialogContent>
                  </Dialog>
              </CardContent>
          </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
                  <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <CurrencyDisplay usd={monthlyExpenses} exchangeRate={exchangeRate} />
              </CardContent>
          </Card>
          <Card className={cn(monthlyBalance >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Balance Mensual</CardTitle>
                  <Scale className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className={cn("text-right", monthlyBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                      <CurrencyDisplay usd={monthlyBalance} exchangeRate={exchangeRate} />
                  </div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cambio USD a CUP</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                 <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">$1 =</span>
                    <Input 
                      type="number"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                      className="w-24 text-lg font-bold"
                    />
                     <span className="font-bold text-lg">CUP</span>
                 </div>
              </CardContent>
          </Card>
        </div>
        
        <Separator />

        <Card>
          <CardHeader>
              <CardTitle>Resumen de los Últimos 6 Meses</CardTitle>
              <CardDescription>Evolución de ingresos y gastos.</CardDescription>
          </CardHeader>
          <CardContent>
              <MonthlySummaryChart data={chartData.monthlySummary} />
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
           <Card>
              <CardHeader>
                  <CardTitle>Gastos del Mes por Categoría</CardTitle>
                  <CardDescription>Desglose visual de a dónde se fue tu dinero este mes.</CardDescription>
              </CardHeader>
              <CardContent>
                  <CategorySpendChart data={chartData.categorySpend} />
              </CardContent>
          </Card>
           <Card>
              <CardHeader>
                  <CardTitle>Distribución de Fondos</CardTitle>
                  <CardDescription>Cómo se distribuye tu balance total entre tus billeteras.</CardDescription>
              </CardHeader>
              <CardContent>
                  <CategorySpendChart data={chartData.walletDistribution} />
              </CardContent>
          </Card>
        </div>

        <Separator />

        <div>
          <h2 className="text-2xl font-bold mb-4">Billeteras</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              {wallets.map(wallet => {
                  const Icon = getWalletIcon(wallet.id);
                  return (
                      <Card key={wallet.id}>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">{wallet.name}</CardTitle>
                              <div className='flex items-center gap-1'>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openWalletDialog(wallet)}><Edit className="h-3 w-3"/></Button>
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                              </div>
                          </CardHeader>
                          <CardContent>
                              <CurrencyDisplay usd={wallet.balance} exchangeRate={exchangeRate} />
                          </CardContent>
                      </Card>
                  );
              })}
          </div>
        </div>
        
        {/* Distribution Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Distribución del Dinero</h2>
              <p className="text-sm text-muted-foreground">
                Basado en 6 JARS (T. Harv Eker) y regla 50/30/20 de Elizabeth Warren
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const totalUndistributed = undistributedIncomes.reduce((acc, t) => acc + t.amount, 0);
                if (totalUndistributed > 0) {
                  return (
                    <Button onClick={() => setIsDistributeIncomeDialogOpen(true)}>
                      <Coins className="mr-2 h-4 w-4" />
                      Distribuir {(totalUndistributed * exchangeRate).toLocaleString('es-ES', { maximumFractionDigits: 0 })} CUP
                    </Button>
                  );
                }
                return null;
              })()}
              <Button variant="outline" size="sm" onClick={() => { setEditingBag(null); bagForm.reset({ name: '', percentage: 10, description: '', icon: 'Target', color: 'blue' }); setIsBagDialogOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Bolsa
              </Button>
            </div>
          </div>

          {distributionBags.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No hay bolsas de distribución. Crea una para empezar.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Distribución: {distributionBags.reduce((acc, b) => acc + b.percentage, 0)}%</span>
                  {(() => {
                    const total = distributionBags.reduce((acc, b) => acc + b.percentage, 0);
                    if (total === 100) return <span className="text-green-500 font-medium">100% ✓</span>;
                    if (total > 100) return <span className="text-red-500 font-medium">Excede por {total - 100}%</span>;
                    return <span className="text-amber-500 font-medium">Falta {100 - total}%</span>;
                  })()}
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden flex">
                  {distributionBags.map((bag) => {
                    const color = bagColorMap[bag.color] || bagColorMap.blue;
                    return (
                      <div
                        key={bag.id}
                        className={`${color.bar} transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
                        style={{ width: `${bag.percentage}%`, minWidth: bag.percentage > 0 ? '4px' : '0' }}
                        title={`${bag.name}: ${bag.percentage}%`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                {distributionBags.map(bag => {
                  const IconComponent = iconMap[bag.icon] || WalletIcon;
                  const color = bagColorMap[bag.color] || bagColorMap.blue;
                  return (
                    <Card key={bag.id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${color.bg}`}>
                            <IconComponent className={`h-4 w-4 ${color.text}`} />
                          </div>
                          <CardTitle className="text-sm font-medium">{bag.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingBag(bag); bagForm.reset({ name: bag.name, percentage: bag.percentage, description: bag.description, icon: bag.icon, color: bag.color }); setIsBagDialogOpen(true); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={() => setBagToDelete(bag)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline justify-between mb-1">
                          <Badge className={`${color.badge} text-white`}>{bag.percentage}%</Badge>
                          <CurrencyDisplay usd={bag.balance || 0} exchangeRate={exchangeRate} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{bag.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
        
        <Separator />

        <Tabs defaultValue="expenses">
          <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="expenses">Gastos</TabsTrigger>
              <TabsTrigger value="incomes">Ingresos</TabsTrigger>
              <TabsTrigger value="transfers">Traspasos</TabsTrigger>
              <TabsTrigger value="loans">Préstamos</TabsTrigger>
          </TabsList>
          <TabsContent value="expenses">
              <Card>
                  <CardHeader>
                      <CardTitle>Registro de Gastos</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <DataTable columns={transactionColumns} data={expenses} />
                  </CardContent>
              </Card>
          </TabsContent>

          {/* Enhanced Incomes Tab */}
          <TabsContent value="incomes" className="space-y-4">
              {/* Income Summary */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Ingresos este mes</p>
                    <p className="text-xl font-bold">{(monthlyIncome * exchangeRate).toLocaleString('es-ES', { minimumFractionDigits: 2 })} CUP</p>
                    <p className="text-xs text-muted-foreground">${monthlyIncome.toFixed(2)} USD</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Transacciones de ingreso</p>
                    <p className="text-xl font-bold">{incomes.filter(t => isThisMonth(t.date)).length}</p>
                    <p className="text-xs text-muted-foreground">este mes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Promedio por ingreso</p>
                    <p className="text-xl font-bold">
                      {incomes.filter(t => isThisMonth(t.date)).length > 0 
                        ? ((monthlyIncome / incomes.filter(t => isThisMonth(t.date)).length) * exchangeRate).toLocaleString('es-ES', { maximumFractionDigits: 0 })
                        : '0'} CUP
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Add Income */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Agregar Ingreso Rápido</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => {
                      transactionForm.reset({
                        description: '', amount: 0, currency: 'CUP',
                        date: new Date(), walletId: '', categoryId: '', type: 'income',
                      });
                      setIsTransactionDialogOpen(true);
                    }}>
                      <PlusCircle className="w-4 h-4 mr-1.5" /> Ingreso detallado
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: 'Salario', category: 'cat-income-1', icon: '💰' },
                      { label: 'Freelance', category: 'cat-income-2', icon: '💻' },
                      { label: 'Venta', category: 'cat-income-1', icon: '🛒' },
                      { label: 'Devolución', category: 'cat-income-2', icon: '↩️' },
                    ].map(preset => (
                      <Button key={preset.label} variant="outline" size="sm" onClick={() => {
                        transactionForm.reset({
                          description: preset.label, amount: 0, currency: 'CUP',
                          date: new Date(), walletId: '', categoryId: preset.category, type: 'income',
                        });
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

          {/* Enhanced Loans Tab */}
          <TabsContent value="loans" className="space-y-4">
              {/* Loans Summary Cards */}
              {(() => {
                const outstandingLoans = loans.filter(l => l.status === 'outstanding');
                const paidLoans = loans.filter(l => l.status === 'paid');
                const totalLent = outstandingLoans.reduce((acc, l) => acc + l.totalAmount, 0);
                const totalRecovered = outstandingLoans.reduce((acc, l) => acc + l.paidAmount, 0);
                const totalPending = totalLent - totalRecovered;

                return (
                  <>
                    <div className="grid gap-4 sm:grid-cols-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Prestado activo</p>
                          <p className="text-xl font-bold">{(totalLent * exchangeRate).toLocaleString('es-ES', { maximumFractionDigits: 0 })} CUP</p>
                          <p className="text-xs text-muted-foreground">${totalLent.toFixed(2)} USD</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Recuperado</p>
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">{(totalRecovered * exchangeRate).toLocaleString('es-ES', { maximumFractionDigits: 0 })} CUP</p>
                          <p className="text-xs text-muted-foreground">${totalRecovered.toFixed(2)} USD</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Por cobrar</p>
                          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{(totalPending * exchangeRate).toLocaleString('es-ES', { maximumFractionDigits: 0 })} CUP</p>
                          <p className="text-xs text-muted-foreground">${totalPending.toFixed(2)} USD</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Préstamos</p>
                          <p className="text-xl font-bold">{outstandingLoans.length} activos</p>
                          <p className="text-xs text-muted-foreground">{paidLoans.length} completados</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Outstanding Loans Detail Cards */}
                    {outstandingLoans.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Préstamos Pendientes</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {outstandingLoans.map(loan => {
                            const progress = (loan.paidAmount / loan.totalAmount) * 100;
                            const remaining = loan.totalAmount - loan.paidAmount;
                            return (
                              <Card key={loan.id} className="border-l-4 border-l-orange-500">
                                <CardContent className="p-4 space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-semibold">{loan.person}</h4>
                                      <p className="text-sm text-muted-foreground">{loan.description}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(loan.date), "dd MMM yyyy", { locale: es })}</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => openLoanPaymentDialog(loan)}>
                                      <DollarSign className="h-3 w-3 mr-1" /> Cobrar
                                    </Button>
                                  </div>
                                  <div>
                                    <Progress value={progress} className="h-2" />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                      <span>Pagado: {(loan.paidAmount * exchangeRate).toLocaleString('es-ES', { maximumFractionDigits: 0 })} CUP</span>
                                      <span>Falta: {(remaining * exchangeRate).toLocaleString('es-ES', { maximumFractionDigits: 0 })} CUP</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Paid Loans */}
                    {paidLoans.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Préstamos Completados ({paidLoans.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {paidLoans.map(loan => (
                              <div key={loan.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
                                <div>
                                  <span className="font-medium">{loan.person}</span>
                                  <span className="text-muted-foreground ml-2">— {loan.description}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-medium">{(loan.totalAmount * exchangeRate).toLocaleString('es-ES', { maximumFractionDigits: 0 })} CUP</span>
                                  <Badge variant="default" className="ml-2 text-xs">Pagado ✓</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Full table fallback */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Todos los Préstamos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <DataTable columns={loanColumns} data={loans} />
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
          </TabsContent>
        </Tabs>

        {/* Edit Wallet Dialog */}
        <Dialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Billetera</DialogTitle>
              <DialogDescription>Modifica el saldo de tu billetera.</DialogDescription>
            </DialogHeader>
            <Form {...walletForm}>
              <form onSubmit={walletForm.handleSubmit(onWalletSubmit)} className="space-y-4">
                <FormField control={walletForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>)}/>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={walletForm.control} name="balance" render={({ field }) => (<FormItem className='col-span-2'><FormLabel>Nuevo Saldo</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={walletForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                </div>
                <DialogFooter><Button type="submit">Guardar Cambios</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Loan Payment Dialog */}
        <Dialog open={isLoanPaymentDialogOpen} onOpenChange={setIsLoanPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pago de Préstamo</DialogTitle>
              <DialogDescription>
                {loanToPay && `Préstamo a: ${loanToPay.person}`}
              </DialogDescription>
            </DialogHeader>
            <Form {...loanPaymentForm}>
              <form onSubmit={loanPaymentForm.handleSubmit(onLoanPaymentSubmit)} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={loanPaymentForm.control} name="amount" render={({ field }) => (<FormItem className='col-span-2'><FormLabel>Monto del Pago</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={loanPaymentForm.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="CUP">CUP</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                </div>
                <DialogFooter><Button type="submit">Registrar Pago</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      {/* Revert Transaction Dialog */}
      <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revertir transacción?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la transacción "{transactionToRevert?.description}" y restaurará el balance de la billetera. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevertTransaction}>Revertir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        {/* Bag Dialog */}
        <Dialog open={isBagDialogOpen} onOpenChange={(open) => { if (!open) { setIsBagDialogOpen(false); setEditingBag(null); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBag ? 'Editar Bolsa' : 'Agregar Bolsa'}</DialogTitle>
              <DialogDescription>
                {editingBag ? 'Modifica los detalles de esta bolsa de distribución.' : 'Crea una nueva bolsa para distribuir tu dinero.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...bagForm}>
              <form onSubmit={bagForm.handleSubmit(onBagSubmit)} className="space-y-4">
                <FormField control={bagForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} placeholder="Ej: Vacaciones" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={bagForm.control} name="percentage" render={({ field }) => (
                  <FormItem><FormLabel>Porcentaje (%)</FormLabel><FormControl><Input type="number" {...field} step="0.1" min="0.1" max="100" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={bagForm.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Descripción</FormLabel><FormControl><Input {...field} placeholder="Breve descripción" /></FormControl><FormMessage /></FormItem>
                )} />
                {editingBag && (
                  <FormField control={bagForm.control} name="balance" render={({ field }) => (
                    <FormItem><FormLabel>Saldo Actual (CUP)</FormLabel><FormControl><Input type="number" {...field} step="0.01" /></FormControl><FormMessage /></FormItem>
                  )} />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={bagForm.control} name="icon" render={({ field }) => (
                    <FormItem><FormLabel>Icono</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                        <SelectContent className="max-h-60">
                          {Object.keys(iconMap).map(key => {
                            const Icon = iconMap[key];
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <span>{key}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={bagForm.control} name="color" render={({ field }) => (
                    <FormItem><FormLabel>Color</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.entries(bagColorMap).map(([key]) => {
                            const color = bagColorMap[key];
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-full ${color.bar}`} />
                                  <span className="capitalize">{key}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { setIsBagDialogOpen(false); setEditingBag(null); }}>Cancelar</Button>
                  <Button type="submit">{editingBag ? 'Guardar Cambios' : 'Agregar Bolsa'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Bag Dialog */}
        <AlertDialog open={!!bagToDelete} onOpenChange={(open) => { if (!open) setBagToDelete(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar bolsa?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará "{bagToDelete?.name}" de tu distribución. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBagToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBag}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Distribute Income Dialog */}
        <Dialog open={isDistributeIncomeDialogOpen} onOpenChange={setIsDistributeIncomeDialogOpen}>
          <DialogContent>
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
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total a distribuir</p>
                    <CurrencyDisplay usd={total} exchangeRate={exchangeRate} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {undistributedIncomes.length} ingreso{undistributedIncomes.length !== 1 ? 's' : ''} sin distribuir
                    </p>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {distributionBags.map(bag => {
                      const IconComponent = iconMap[bag.icon] || WalletIcon;
                      const color = bagColorMap[bag.color] || bagColorMap.blue;
                      const amount = total * (bag.percentage / 100);
                      return (
                        <div key={bag.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-md ${color.bg}`}>
                              <IconComponent className={`h-3.5 w-3.5 ${color.text}`} />
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

                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                    Al marcar como distribuido, confirmas que has asignado estos ingresos a tus bolsas. 
                    No se crearán transacciones automáticamente.
                  </div>

                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setIsDistributeIncomeDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmDistribution}>
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
