import { useState, useEffect, useCallback } from 'react';
import { wallets as initialWallets, defaultDistributionBags } from '@/lib/data';
import type { Wallet, Transaction, Loan, DistributionBag, Debt } from '@/lib/definitions';
import type { LucideIcon } from 'lucide-react';
import { Banknote, CreditCard, PiggyBank, Target, Wallet as WalletIcon, Shield, TrendingUp, Home, Gamepad2, BookOpen, Heart, GraduationCap, Sparkles, DollarSign, Plane, Coffee } from 'lucide-react';

const iconStringToComponent: Record<string, LucideIcon> = {
  Banknote, CreditCard, PiggyBank, Target, Wallet: WalletIcon,
  Shield, TrendingUp, Home, Gamepad2, BookOpen, Heart,
  GraduationCap, Sparkles, DollarSign, Plane, Coffee,
};

function saveToLocal(key: string, data: any) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function loadFromLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function genId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useFinance = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [distributionBags, setDistributionBags] = useState<DistributionBag[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [exchangeRate, setExchangeRateState] = useState(360);
  const [isLoading, setIsLoading] = useState(true);

  const setExchangeRate = useCallback((rate: number) => {
    setExchangeRateState(rate);
    saveToLocal('exchangeRate', rate);
  }, []);

  useEffect(() => {
    const loadFinanceData = () => {
      setIsLoading(true);
      try {
        const storedWallets = loadFromLocal<Wallet[]>('wallets', initialWallets.map((w, i) => ({ ...w, id: genId() })));
        const storedTransactions = loadFromLocal<Transaction[]>('transactions', []);
        const storedLoans = loadFromLocal<Loan[]>('loans', []);
        const storedDebts = loadFromLocal<Debt[]>('debts', []);
        const storedBags = loadFromLocal<DistributionBag[]>('distributionBags', defaultDistributionBags.map(b => ({ ...b, id: genId(), balance: 0 })));
        const storedRate = loadFromLocal<number>('exchangeRate', 360);

        if (storedWallets.length > 0) setWallets(storedWallets);
        else {
          const defaults = initialWallets.map((w, i) => ({ ...w, id: genId() }));
          setWallets(defaults);
          saveToLocal('wallets', defaults);
        }

        setTransactions(storedTransactions.map(t => ({ ...t, date: new Date(t.date) })));
        setLoans(storedLoans.map(l => ({ ...l, date: new Date(l.date) })));
        const parsedDebts = storedDebts.map(d => ({
          ...d,
          date: new Date(d.date),
          dueDate: d.dueDate ? new Date(d.dueDate) : undefined,
        }));
        setDebts(parsedDebts);

        if (storedBags.length > 0) setDistributionBags(storedBags);
        else {
          const defaults = defaultDistributionBags.map(b => ({ ...b, id: genId(), balance: 0 }));
          setDistributionBags(defaults);
          saveToLocal('distributionBags', defaults);
        }

        setExchangeRateState(storedRate);
      } catch (error) {
        console.error('Error loading finance data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFinanceData();
  }, []);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = { ...transaction, id: genId() };
    setTransactions(prev => {
      const updated = [newTransaction, ...prev];
      saveToLocal('transactions', updated);
      return updated;
    });
    return newTransaction;
  }, []);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== transactionId);
      saveToLocal('transactions', updated);
      return updated;
    });
  }, []);

  const updateWalletBalance = useCallback(async (walletId: string, newBalance: number) => {
    setWallets(prev => {
      const updated = prev.map(w => w.id === walletId ? { ...w, balance: newBalance } : w);
      saveToLocal('wallets', updated);
      return updated;
    });
  }, []);

  const updateWallet = useCallback(async (walletId: string, updates: Partial<Wallet>) => {
    setWallets(prev => {
      const updated = prev.map(w => w.id === walletId ? { ...w, ...updates } : w);
      saveToLocal('wallets', updated);
      return updated;
    });
  }, []);

  const addLoan = useCallback(async (loan: Omit<Loan, 'id'>) => {
    const newLoan: Loan = { ...loan, id: genId() };
    setLoans(prev => {
      const updated = [newLoan, ...prev];
      saveToLocal('loans', updated);
      return updated;
    });
    return newLoan;
  }, []);

  const updateLoan = useCallback(async (loanId: string, updates: Partial<Loan>) => {
    setLoans(prev => {
      const updated = prev.map(l => l.id === loanId ? { ...l, ...updates } : l);
      saveToLocal('loans', updated);
      return updated;
    });
  }, []);

  const addDebt = useCallback(async (debt: Omit<Debt, 'id'>) => {
    const newDebt: Debt = { ...debt, id: genId() };
    setDebts(prev => {
      const updated = [newDebt, ...prev];
      saveToLocal('debts', updated);
      return updated;
    });
    return newDebt;
  }, []);

  const updateDebt = useCallback(async (debtId: string, updates: Partial<Debt>) => {
    setDebts(prev => {
      const updated = prev.map(d => d.id === debtId ? { ...d, ...updates } : d);
      saveToLocal('debts', updated);
      return updated;
    });
  }, []);

  const deleteDebt = useCallback(async (debtId: string) => {
    setDebts(prev => {
      const updated = prev.filter(d => d.id !== debtId);
      saveToLocal('debts', updated);
      return updated;
    });
  }, []);

  const addDistributionBag = useCallback(async (bag: Omit<DistributionBag, 'id'>) => {
    const newBag: DistributionBag = { ...bag, id: genId() };
    setDistributionBags(prev => {
      const updated = [...prev, newBag];
      saveToLocal('distributionBags', updated);
      return updated;
    });
    return newBag;
  }, []);

  const updateDistributionBag = useCallback(async (bagId: string, updates: Partial<DistributionBag>) => {
    setDistributionBags(prev => {
      const updated = prev.map(b => b.id === bagId ? { ...b, ...updates } : b);
      saveToLocal('distributionBags', updated);
      return updated;
    });
  }, []);

  const deleteDistributionBag = useCallback(async (bagId: string) => {
    setDistributionBags(prev => {
      const updated = prev.filter(b => b.id !== bagId);
      saveToLocal('distributionBags', updated);
      return updated;
    });
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
