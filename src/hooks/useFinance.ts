import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { wallets as initialWallets } from '@/lib/data';
import type { Wallet, Transaction, Loan } from '@/lib/definitions';

export const useFinance = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [exchangeRate, setExchangeRate] = useState(360);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFinanceData = async () => {
      setIsLoading(true);
      try {
        // Load wallets
        const { data: walletsData, error: walletsError } = await supabase
          .from('wallets')
          .select('*');

        if (walletsError) throw walletsError;

        // Load transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .order('transaction_date', { ascending: false });

        if (transactionsError) throw transactionsError;

        // Load loans
        const { data: loansData, error: loansError } = await supabase
          .from('loans')
          .select('*')
          .order('loan_date', { ascending: false });

        if (loansError) throw loansError;

        // Format data
        const formattedWallets = walletsData?.map((w: any) => ({
          id: w.id,
          name: w.name,
          balance: Number(w.balance),
          icon: w.icon,
        })) || [];

        const formattedTransactions = transactionsData?.map((t: any) => ({
          id: t.id,
          description: t.description,
          amount: Number(t.amount),
          date: new Date(t.transaction_date),
          walletId: t.wallet_id,
          categoryId: t.category_id,
          type: t.transaction_type as 'income' | 'expense',
          transferId: t.transfer_id,
          loanId: t.loan_id,
        })) || [];

        const formattedLoans = loansData?.map((l: any) => ({
          id: l.id,
          person: l.person,
          description: l.description,
          totalAmount: Number(l.total_amount),
          paidAmount: Number(l.paid_amount),
          walletId: l.wallet_id,
          date: new Date(l.loan_date),
          status: l.status as 'outstanding' | 'paid',
        })) || [];

        // Check for migration
        if (formattedWallets.length === 0) {
          const storedWallets = localStorage.getItem('wallets');
          const storedTransactions = localStorage.getItem('transactions');
          const storedLoans = localStorage.getItem('loans');
          const storedRate = localStorage.getItem('exchangeRate');

          if (storedWallets) {
            const localWallets = JSON.parse(storedWallets);
            for (const w of localWallets) {
              await supabase.from('wallets').insert({
                name: w.name,
                balance: w.balance,
                icon: 'wallet',
              });
            }
            const { data: newWallets } = await supabase.from('wallets').select('*');
            const walletIdMap: Record<string, string> = {};
            localWallets.forEach((lw: any, i: number) => {
              if (newWallets?.[i]) {
                walletIdMap[lw.id] = newWallets[i].id;
              }
            });

            if (storedTransactions) {
              const localTrans = JSON.parse(storedTransactions);
              for (const t of localTrans) {
                await supabase.from('transactions').insert({
                  wallet_id: walletIdMap[t.walletId] || null,
                  description: t.description,
                  amount: t.amount,
                  transaction_type: t.type,
                  category_id: t.categoryId,
                  transaction_date: t.date,
                });
              }
            }

            if (storedLoans) {
              const localLoans = JSON.parse(storedLoans);
              for (const l of localLoans) {
                await supabase.from('loans').insert({
                  wallet_id: walletIdMap[l.walletId] || null,
                  person: l.person,
                  description: l.description,
                  total_amount: l.totalAmount,
                  paid_amount: l.paidAmount,
                  status: l.status,
                  loan_date: l.date,
                });
              }
            }

            localStorage.removeItem('wallets');
            localStorage.removeItem('transactions');
            localStorage.removeItem('loans');
            localStorage.removeItem('exchangeRate');

            // Reload after migration
            window.location.reload();
            return;
          } else {
            // Insert initial wallets
            for (const w of initialWallets) {
              await supabase.from('wallets').insert({
                name: w.name,
                balance: w.balance,
                icon: 'wallet',
              });
            }
            const { data: newWallets } = await supabase.from('wallets').select('*');
            setWallets(newWallets?.map((w: any) => ({
              id: w.id,
              name: w.name,
              balance: Number(w.balance),
              icon: w.icon,
            })) || []);
          }
        } else {
          setWallets(formattedWallets);
        }

        setTransactions(formattedTransactions);
        setLoans(formattedLoans);
      } catch (error) {
        console.error('Error loading finance data:', error);
        // Fallback
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
        const storedRate = localStorage.getItem('exchangeRate');
        if (storedRate) setExchangeRate(parseFloat(storedRate));
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
          transfer_id: transaction.transferId,
          loan_id: transaction.loanId,
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
      };

      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return null;
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
      await supabase
        .from('wallets')
        .update({ name: updates.name, balance: updates.balance })
        .eq('id', walletId);

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
      await supabase
        .from('loans')
        .update({
          paid_amount: updates.paidAmount,
          status: updates.status,
        })
        .eq('id', loanId);

      setLoans(prev =>
        prev.map(l => l.id === loanId ? { ...l, ...updates } : l)
      );
    } catch (error) {
      console.error('Error updating loan:', error);
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

  return {
    wallets,
    transactions,
    loans,
    exchangeRate,
    setExchangeRate,
    isLoading,
    setWallets,
    setTransactions,
    setLoans,
    addTransaction,
    updateWalletBalance,
    updateWallet,
    addLoan,
    updateLoan,
    deleteTransaction,
  };
};
