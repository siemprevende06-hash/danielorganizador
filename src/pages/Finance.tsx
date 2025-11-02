import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { wallets as initialWallets, transactionCategories } from '@/lib/data';
import type { Wallet, Transaction, Loan } from '@/lib/definitions';
import { Separator } from '@/components/ui/separator';
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
import { CalendarIcon, PlusCircle, Edit, Coins, Settings, LucideIcon, Wallet as WalletIcon, RotateCcw, ArrowRightLeft, Download, Upload, Scale, LandPlot } from 'lucide-react';
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
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('wallets', JSON.stringify(wallets));
      localStorage.setItem('transactions', JSON.stringify(transactions));
      localStorage.setItem('loans', JSON.stringify(loans));
      localStorage.setItem('exchangeRate', exchangeRate.toString());
    }
  }, [wallets, transactions, loans, exchangeRate, isClient]);
  
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

  const totalBalance = useMemo(() => wallets.reduce((acc, w) => acc + w.balance, 0), [wallets]);
  const monthlyIncome = useMemo(() => transactions.filter(t => t.type === 'income' && isThisMonth(t.date) && t.categoryId !== 'cat-transfer').reduce((acc, t) => acc + t.amount, 0), [transactions]);
  const monthlyExpenses = useMemo(() => transactions.filter(t => t.type === 'expense' && isThisMonth(t.date) && t.categoryId !== 'cat-transfer').reduce((acc, t) => acc + t.amount, 0), [transactions]);
  const monthlyBalance = monthlyIncome - monthlyExpenses;
  
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

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
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
          <TabsContent value="incomes">
              <Card>
                  <CardHeader>
                      <CardTitle>Registro de Ingresos</CardTitle>
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
          <TabsContent value="loans">
              <Card>
                  <CardHeader>
                      <CardTitle>Préstamos Activos</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <DataTable columns={loanColumns} data={loans} />
                  </CardContent>
              </Card>
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
      </div>
    </div>
  );
}
