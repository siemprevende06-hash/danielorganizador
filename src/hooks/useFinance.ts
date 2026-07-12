import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { wallets as initialWallets, defaultDistributionBags } from '@/lib/data';
import type { Wallet, Transaction, Loan, DistributionBag, Debt } from '@/lib/definitions';
import type { LucideIcon } from 'lucide-react';
import { Banknote, CreditCard, PiggyBank, Target, Wallet as WalletIcon, Shield, TrendingUp, Home, Gamepad2, BookOpen, Heart, GraduationCap, Sparkles, DollarSign, Plane, Coffee } from 'lucide-react';

const iconStringToComponent: Record<string, LucideIcon> = {
  Banknote, CreditCard, PiggyBank, Target, Wallet: WalletIcon,
  Shield, TrendingUp, Home, Gamepad2, BookOpen, Heart,
  GraduationCap, Sparkles, DollarSign, Plane, Coffee,
};

export const useFinance = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [distributionBags, setDistributionBags] = useState<DistributionBag[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [exchangeRate, setExchangeRateState] = useState(360);
  const [isLoading, setIsLoading] = useState(true);

  const setExchangeRate = useCallback(async (rate: number) => {
    setExchangeRateState(rate);
    try {
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .limit(1);
      if (existing && existing.length > 0) {
        await supabase
          .from('user_settings')
          .update({ exchange_rate: rate })
          .eq('id', existing[0].id);
      } else {
        await supabase
          .from('user_settings')
          .insert({ exchange_rate: rate, user_id: '00000000-0000-0000-0000-000000000000' });
      }
    } catch (error) {
      console.error('Error saving exchange rate:', error);
    }
  }, []);

  useEffect(() => {
    const loadFinanceData = async () => {
      setIsLoading(true);
      try {
        const { data: walletsData, error: walletsError } = await supabase
          .from('wallets')
          .select('*');

        if (walletsError) throw walletsError;

        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .order('transaction_date', { ascending: false });

        if (transactionsError) throw transactionsError;

        const { data: loansData, error: loansError } = await supabase
          .from('loans')
          .select('*')
          .order('loan_date', { ascending: false });

        if (loansError) throw loansError;

        const { data: debtsData, error: debtsError } = await supabase
          .from('debts')
          .select('*')
          .order('debt_date', { ascending: false });

        if (debtsError) throw debtsError;

        const { data: bagsData, error: bagsError } = await supabase
          .from('distribution_bags')
          .select('*');

        if (bagsError) throw bagsError;

        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('exchange_rate')
          .limit(1);

        if (settingsError) throw settingsError;
        if (settingsData && settingsData.length > 0 && settingsData[0].exchange_rate) {
          setExchangeRateState(Number(settingsData[0].exchange_rate));
        }

        const formattedWallets: Wallet[] = walletsData?.map((w: any) => ({
          id: w.id,
          name: w.name,
          balance: Number(w.balance),
          icon: iconStringToComponent[w.icon] || WalletIcon,
        })) || [];

        const formattedTransactions: Transaction[] = transactionsData?.map((t: any) => ({
          id: t.id,
          description: t.description,
          amount: Number(t.amount),
          date: new Date(t.transaction_date),
          walletId: t.wallet_id,
          categoryId: t.category_id,
          type: t.transaction_type as 'income' | 'expense',
          transferId: t.transfer_id,
          loanId: t.loan_id,
          distributed: t.distributed || false,
        })) || [];

        const formattedLoans: Loan[] = loansData?.map((l: any) => ({
          id: l.id,
          person: l.person,
          description: l.description,
          totalAmount: Number(l.total_amount),
          paidAmount: Number(l.paid_amount),
          walletId: l.wallet_id,
          date: new Date(l.loan_date),
          status: l.status as 'outstanding' | 'paid',
        })) || [];

        const formattedDebts: Debt[] = debtsData?.map((d: any) => ({
          id: d.id,
          person: d.person,
          description: d.description || '',
          totalAmount: Number(d.total_amount),
          paidAmount: Number(d.paid_amount),
          walletId: d.wallet_id,
          date: new Date(d.debt_date),
          dueDate: d.due_date ? new Date(d.due_date) : undefined,
          status: d.status as 'outstanding' | 'paid',
        })) || [];

        const formattedBags: DistributionBag[] = bagsData?.map((b: any) => ({
          id: b.id,
          name: b.name,
          description: b.description || '',
          percentage: Number(b.percentage),
          icon: b.icon || 'Target',
          color: b.color || 'blue',
          balance: Number(b.balance) || 0,
        })) || [];

        if (formattedWallets.length === 0) {
          const iconNameByPosition = ['Banknote', 'Banknote', 'CreditCard', 'PiggyBank', 'Target', 'Wallet', 'Wallet'];
          for (let i = 0; i < initialWallets.length; i++) {
            await supabase.from('wallets').insert({
              name: initialWallets[i].name,
              balance: initialWallets[i].balance,
              icon: iconNameByPosition[i] || 'Wallet',
            });
          }
          const { data: newWallets } = await supabase.from('wallets').select('*');
          setWallets(newWallets?.map((w: any) => ({
            id: w.id,
            name: w.name,
            balance: Number(w.balance),
            icon: iconStringToComponent[w.icon] || WalletIcon,
          })) || []);
        } else {
          setWallets(formattedWallets);
        }

        if (formattedBags.length === 0) {
          for (const bag of defaultDistributionBags) {
            await supabase.from('distribution_bags').insert({
              name: bag.name,
              description: bag.description,
              percentage: bag.percentage,
              icon: bag.icon,
              color: bag.color,
              balance: 0,
            });
          }
          const { data: newBags } = await supabase.from('distribution_bags').select('*');
          setDistributionBags(newBags?.map((b: any) => ({
            id: b.id,
            name: b.name,
            description: b.description || '',
            percentage: Number(b.percentage),
            icon: b.icon || 'Target',
            color: b.color || 'blue',
            balance: Number(b.balance) || 0,
          })) || []);
        } else {
          setDistributionBags(formattedBags);
        }

        setTransactions(formattedTransactions);
        setLoans(formattedLoans);
        setDebts(formattedDebts);
      } catch (error) {
        console.error('Error loading finance data:', error);
        const storedWallets = localStorage.getItem('wallets');
        setWallets(storedWallets ? JSON.parse(storedWallets) : initialWallets);
        const storedTransactions = localStorage.getItem('transactions');
        if (storedTransactions) {
          setTransactions(JSON.parse(storedTransactions, (key, value) =>
            key === 'date' ? new Date(value) : value
          ));
        }
        const storedLoans = localStorage.getItem('loans');
        if (storedLoans) {
          setLoans(JSON.parse(storedLoans, (key, value) =>
            key === 'date' ? new Date(value) : value
          ));
        }
        const storedDebts = localStorage.getItem('debts');
        if (storedDebts) {
          setDebts(JSON.parse(storedDebts, (key, value) =>
            key === 'date' || key === 'dueDate' ? new Date(value) : value
          ));
        }
        const storedBags = localStorage.getItem('distributionBags');
        setDistributionBags(storedBags ? JSON.parse(storedBags) : defaultDistributionBags);
        const storedRate = localStorage.getItem('exchangeRate');
        if (storedRate) setExchangeRateState(parseFloat(storedRate));
      } finally {
        setIsLoading(false);
      }
    };

    loadFinanceData();
  }, []);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          wallet_id: transaction.walletId,
          description: transaction.description,
          amount: transaction.amount,
          transaction_type: transaction.type,
          category_id: transaction.categoryId,
          transaction_date: transaction.date.toISOString(),
          transfer_id: transaction.transferId || null,
          loan_id: transaction.loanId || null,
          distributed: transaction.distributed || false,
        })
        .select()
        .single();

      if (error) throw error;

      const newTransaction: Transaction = {
        id: data.id,
        description: data.description,
        amount: Number(data.amount),
        date: new Date(data.transaction_date),
        walletId: data.wallet_id,
        categoryId: data.category_id,
        type: data.transaction_type as 'income' | 'expense',
        transferId: data.transfer_id,
        loanId: data.loan_id,
        distributed: data.distributed || false,
      };

      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return null;
    }
  }, []);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    try {
      await supabase.from('transactions').delete().eq('id', transactionId);
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  }, []);

  const updateWalletBalance = useCallback(async (walletId: string, newBalance: number) => {
    try {
      await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', walletId);
      setWallets(prev =>
        prev.map(w => w.id === walletId ? { ...w, balance: newBalance } : w)
      );
    } catch (error) {
      console.error('Error updating wallet:', error);
    }
  }, []);

  const updateWallet = useCallback(async (walletId: string, updates: Partial<Wallet>) => {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
      await supabase.from('wallets').update(dbUpdates).eq('id', walletId);
      setWallets(prev =>
        prev.map(w => w.id === walletId ? { ...w, ...updates } : w)
      );
    } catch (error) {
      console.error('Error updating wallet:', error);
    }
  }, []);

  const addLoan = useCallback(async (loan: Omit<Loan, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .insert({
          wallet_id: loan.walletId,
          person: loan.person,
          description: loan.description,
          total_amount: loan.totalAmount,
          paid_amount: loan.paidAmount,
          status: loan.status,
          loan_date: loan.date.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const newLoan: Loan = {
        id: data.id,
        person: data.person,
        description: data.description,
        totalAmount: Number(data.total_amount),
        paidAmount: Number(data.paid_amount),
        walletId: data.wallet_id,
        date: new Date(data.loan_date),
        status: data.status as 'outstanding' | 'paid',
      };

      setLoans(prev => [newLoan, ...prev]);
      return newLoan;
    } catch (error) {
      console.error('Error adding loan:', error);
      return null;
    }
  }, []);

  const updateLoan = useCallback(async (loanId: string, updates: Partial<Loan>) => {
    try {
      const dbUpdates: any = {};
      if (updates.paidAmount !== undefined) dbUpdates.paid_amount = updates.paidAmount;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      await supabase.from('loans').update(dbUpdates).eq('id', loanId);
      setLoans(prev =>
        prev.map(l => l.id === loanId ? { ...l, ...updates } : l)
      );
    } catch (error) {
      console.error('Error updating loan:', error);
    }
  }, []);

  const addDebt = useCallback(async (debt: Omit<Debt, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('debts')
        .insert({
          wallet_id: debt.walletId,
          person: debt.person,
          description: debt.description,
          total_amount: debt.totalAmount,
          paid_amount: debt.paidAmount,
          due_date: debt.dueDate?.toISOString() || null,
          status: debt.status,
          debt_date: debt.date.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const newDebt: Debt = {
        id: data.id,
        person: data.person,
        description: data.description || '',
        totalAmount: Number(data.total_amount),
        paidAmount: Number(data.paid_amount),
        walletId: data.wallet_id,
        date: new Date(data.debt_date),
        dueDate: data.due_date ? new Date(data.due_date) : undefined,
        status: data.status as 'outstanding' | 'paid',
      };

      setDebts(prev => [newDebt, ...prev]);
      return newDebt;
    } catch (error) {
      console.error('Error adding debt:', error);
      return null;
    }
  }, []);

  const updateDebt = useCallback(async (debtId: string, updates: Partial<Debt>) => {
    try {
      const dbUpdates: any = {};
      if (updates.paidAmount !== undefined) dbUpdates.paid_amount = updates.paidAmount;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate.toISOString();
      await supabase.from('debts').update(dbUpdates).eq('id', debtId);
      setDebts(prev =>
        prev.map(d => d.id === debtId ? { ...d, ...updates } : d)
      );
    } catch (error) {
      console.error('Error updating debt:', error);
    }
  }, []);

  const deleteDebt = useCallback(async (debtId: string) => {
    try {
      await supabase.from('debts').delete().eq('id', debtId);
      setDebts(prev => prev.filter(d => d.id !== debtId));
    } catch (error) {
      console.error('Error deleting debt:', error);
    }
  }, []);

  const addDistributionBag = useCallback(async (bag: Omit<DistributionBag, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('distribution_bags')
        .insert({
          name: bag.name,
          description: bag.description,
          percentage: bag.percentage,
          icon: bag.icon,
          color: bag.color,
          balance: bag.balance || 0,
        })
        .select()
        .single();

      if (error) throw error;

      const newBag: DistributionBag = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        percentage: Number(data.percentage),
        icon: data.icon || 'Target',
        color: data.color || 'blue',
        balance: Number(data.balance) || 0,
      };

      setDistributionBags(prev => [...prev, newBag]);
      return newBag;
    } catch (error) {
      console.error('Error adding distribution bag:', error);
      return null;
    }
  }, []);

  const updateDistributionBag = useCallback(async (bagId: string, updates: Partial<DistributionBag>) => {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.percentage !== undefined) dbUpdates.percentage = updates.percentage;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
      await supabase.from('distribution_bags').update(dbUpdates).eq('id', bagId);
      setDistributionBags(prev =>
        prev.map(b => b.id === bagId ? { ...b, ...updates } : b)
      );
    } catch (error) {
      console.error('Error updating distribution bag:', error);
    }
  }, []);

  const deleteDistributionBag = useCallback(async (bagId: string) => {
    try {
      await supabase.from('distribution_bags').delete().eq('id', bagId);
      setDistributionBags(prev => prev.filter(b => b.id !== bagId));
    } catch (error) {
      console.error('Error deleting distribution bag:', error);
    }
  }, []);

  const setDistributionBagsState = useCallback((bags: DistributionBag[] | ((prev: DistributionBag[]) => DistributionBag[])) => {
    setDistributionBags(bags);
  }, []);

  const setWalletsState = useCallback((w: Wallet[] | ((prev: Wallet[]) => Wallet[])) => {
    setWallets(w);
  }, []);

  const setTransactionsState = useCallback((t: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
    setTransactions(t);
  }, []);

  const setLoansState = useCallback((l: Loan[] | ((prev: Loan[]) => Loan[])) => {
    setLoans(l);
  }, []);

  const setDebtsState = useCallback((d: Debt[] | ((prev: Debt[]) => Debt[])) => {
    setDebts(d);
  }, []);

  return {
    wallets,
    transactions,
    loans,
    debts,
    distributionBags,
    exchangeRate,
    setExchangeRate,
    isLoading,
    setWallets: setWalletsState,
    setTransactions: setTransactionsState,
    setLoans: setLoansState,
    setDebts: setDebtsState,
    setDistributionBags: setDistributionBagsState,
    addTransaction,
    deleteTransaction,
    updateWalletBalance,
    updateWallet,
    addLoan,
    updateLoan,
    addDebt,
    updateDebt,
    deleteDebt,
    addDistributionBag,
    updateDistributionBag,
    deleteDistributionBag,
  };
};
