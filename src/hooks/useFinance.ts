import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { safeMutation } from '@/lib/offlineQueue';
import { wallets as initialWallets, defaultDistributionBags } from '@/lib/data';
import type { Wallet, Transaction, Loan, DistributionBag, Debt, FinancialGoal } from '@/lib/definitions';
import type { LucideIcon } from 'lucide-react';
import {
  Banknote, CreditCard, PiggyBank, Target, Wallet as WalletIcon,
  Shield, TrendingUp, Home, Gamepad2, BookOpen, Heart,
  GraduationCap, Sparkles, DollarSign, Plane, Coffee,
} from 'lucide-react';

const iconStringToComponent: Record<string, LucideIcon> = {
  Banknote, CreditCard, PiggyBank, Target, Wallet: WalletIcon,
  Shield, TrendingUp, Home, Gamepad2, BookOpen, Heart,
  GraduationCap, Sparkles, DollarSign, Plane, Coffee,
};

const componentToIconString = new Map<LucideIcon, string>();
Object.entries(iconStringToComponent).forEach(([k, v]) => componentToIconString.set(v, k));

function iconToString(icon: LucideIcon | undefined): string {
  if (!icon) return 'Wallet';
  return componentToIconString.get(icon) || 'Wallet';
}

function stringToIcon(name: string | null | undefined): LucideIcon {
  if (!name) return WalletIcon;
  return iconStringToComponent[name] || WalletIcon;
}

function genId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// --- Local cache helpers (for instant UI + offline) ---
function saveLocal(key: string, data: any) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}
function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function mergeById<T extends { id: string }>(primary: T[], local: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of primary) map.set(item.id, item);
  for (const item of local) if (!map.has(item.id)) map.set(item.id, item);
  return Array.from(map.values());
}

// La tabla wallets puede tener duplicados (p. ej. un "Efectivo CUP" creado por
// la siembra automática además del real, con ids distintos). Se deduplican por
// nombre + moneda, conservando la de mayor saldo (en empate, la primera de la
// lista). Así ni la página ni el AI de finanzas ven dos billeteras iguales.
function dedupeWallets(list: Wallet[]): Wallet[] {
  const map = new Map<string, Wallet>();
  for (const w of list) {
    const key = `${w.name.trim().toLowerCase()}|${w.currency}`;
    const existing = map.get(key);
    if (!existing || w.balance > existing.balance) {
      map.set(key, w);
    }
  }
  return Array.from(map.values());
}

function saveFeedback(label: string, res: { queued: boolean; error: any }) {
  if (res.error) toast.error(`${label} no se pudo guardar: ${res.error}`);
  else if (res.queued) toast.warning(`${label} guardado localmente · pendiente de sincronización`);
}

// --- text_sections generic KV helpers ---
async function loadTextSection<T>(key: string, fallback: T): Promise<T> {
  try {
    const { data } = await supabase
      .from('text_sections')
      .select('content')
      .eq('section_key', key)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0 && data[0] && data[0].content !== null && data[0].content !== undefined) {
      return data[0].content as unknown as T;
    }
  } catch {}
  return fallback;
}
async function saveTextSection(key: string, value: any) {
  try {
    const { data: existing } = await supabase
      .from('text_sections')
      .select('id')
      .eq('section_key', key)
      .limit(1);
    if (existing && existing.length > 0) {
      await supabase.from('text_sections').update({ content: value as any, updated_at: new Date().toISOString() }).eq('id', existing[0].id);
    } else {
      await supabase.from('text_sections').insert({ section_key: key, content: value as any });
    }
  } catch (e) {
    console.warn('text_sections save failed', key, e);
  }
}

// --- Mappers ---
function walletFromRow(row: any): Wallet {
  return { id: row.id, name: row.name, balance: Number(row.balance) || 0, icon: stringToIcon(row.icon), currency: row.currency === 'USD' ? 'USD' : 'CUP' };
}
function walletToRow(w: Partial<Wallet> & { id?: string }): any {
  const out: any = {};
  if (w.id) out.id = w.id;
  if (w.name !== undefined) out.name = w.name;
  if (w.balance !== undefined) out.balance = w.balance;
  if (w.icon !== undefined) out.icon = iconToString(w.icon);
  if (w.currency !== undefined) out.currency = w.currency;
  return out;
}
function transactionFromRow(row: any): Transaction {
  return {
    id: row.id,
    description: row.description || '',
    amount: Number(row.amount) || 0,
    currency: row.currency === 'CUP' ? 'CUP' : 'USD',
    date: new Date(row.transaction_date),
    walletId: row.wallet_id,
    categoryId: row.category_id || '',
    type: (row.transaction_type as 'income' | 'expense'),
    transferId: row.transfer_id || undefined,
    loanId: row.loan_id || undefined,
    distributed: row.distributed ?? false,
  };
}
function transactionToRow(t: Partial<Transaction> & { id?: string }): any {
  const out: any = {};
  if (t.id) out.id = t.id;
  if (t.description !== undefined) out.description = t.description;
  if (t.amount !== undefined) out.amount = t.amount;
  if (t.currency !== undefined) out.currency = t.currency;
  if (t.date !== undefined) out.transaction_date = (t.date instanceof Date ? t.date : new Date(t.date as any)).toISOString();
  if (t.walletId !== undefined) out.wallet_id = t.walletId;
  if (t.categoryId !== undefined) out.category_id = t.categoryId;
  if (t.type !== undefined) out.transaction_type = t.type;
  if (t.transferId !== undefined) out.transfer_id = t.transferId || null;
  if (t.loanId !== undefined) out.loan_id = t.loanId || null;
  if (t.distributed !== undefined) out.distributed = t.distributed;
  return out;
}
function loanFromRow(row: any): Loan {
  return {
    id: row.id,
    person: row.person || '',
    description: row.description || '',
    totalAmount: Number(row.total_amount) || 0,
    paidAmount: Number(row.paid_amount) || 0,
    walletId: row.wallet_id,
    date: new Date(row.loan_date),
    status: (row.status as 'outstanding' | 'paid'),
  };
}
function loanToRow(l: Partial<Loan> & { id?: string }): any {
  const out: any = {};
  if (l.id) out.id = l.id;
  if (l.person !== undefined) out.person = l.person;
  if (l.description !== undefined) out.description = l.description;
  if (l.totalAmount !== undefined) out.total_amount = l.totalAmount;
  if (l.paidAmount !== undefined) out.paid_amount = l.paidAmount;
  if (l.walletId !== undefined) out.wallet_id = l.walletId;
  if (l.date !== undefined) out.loan_date = (l.date instanceof Date ? l.date : new Date(l.date as any)).toISOString();
  if (l.status !== undefined) out.status = l.status;
  return out;
}
function bagFromRow(row: any): DistributionBag {
  return {
    id: row.id,
    name: row.name || '',
    description: row.description || '',
    percentage: Number(row.percentage) || 0,
    icon: row.icon || 'Wallet',
    color: row.color || '#888888',
    balance: Number(row.balance) || 0,
  };
}
function bagToRow(b: Partial<DistributionBag> & { id?: string }): any {
  const out: any = {};
  if (b.id) out.id = b.id;
  if (b.name !== undefined) out.name = b.name;
  if (b.description !== undefined) out.description = b.description;
  if (b.percentage !== undefined) out.percentage = b.percentage;
  if (b.icon !== undefined) out.icon = b.icon;
  if (b.color !== undefined) out.color = b.color;
  if (b.balance !== undefined) out.balance = b.balance;
  return out;
}

export const useFinance = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [distributionBags, setDistributionBags] = useState<DistributionBag[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [exchangeRate, setExchangeRateState] = useState<number>(360);
  const [isLoading, setIsLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // Cache to local whenever state changes.
  // NO escribir hasta que la carga inicial termine (hydrated): si se guardara
  // con el estado vacío del arranque, se borraría la caché local al volver a
  // entrar a la página (los datos se "pierden").
  useEffect(() => {
    if (!hydrated) return;
    saveLocal('finance_wallets', wallets.map(w => ({ id: w.id, name: w.name, balance: w.balance, iconName: iconToString(w.icon), currency: w.currency })));
  }, [wallets, hydrated]);
  useEffect(() => { if (!hydrated) return; saveLocal('finance_transactions', transactions); }, [transactions, hydrated]);
  useEffect(() => { if (!hydrated) return; saveLocal('finance_loans', loans); }, [loans, hydrated]);
  useEffect(() => { if (!hydrated) return; saveLocal('finance_bags', distributionBags); }, [distributionBags, hydrated]);
  useEffect(() => { if (!hydrated) return; saveLocal('finance_debts', debts); }, [debts, hydrated]);
  useEffect(() => { if (!hydrated) return; saveLocal('finance_goals', financialGoals); }, [financialGoals, hydrated]);
  const setExchangeRate = useCallback((rate: number) => {
    setExchangeRateState(rate);
    saveTextSection('finance_exchange_rate', rate);
  }, []);

  // Load from localStorage fallback
  const loadFromLocalStorage = useCallback(() => {
    const cachedWallets = loadLocal<any[]>('finance_wallets', []);
    if (cachedWallets.length > 0) {
      setWallets(dedupeWallets(cachedWallets.map((w: any) => ({ ...w, currency: w.currency === 'USD' ? 'USD' : 'CUP', icon: stringToIcon(w.iconName || (typeof w.icon === 'string' ? w.icon : 'Wallet')) }))));
    }
    const cachedTx = loadLocal<any[]>('finance_transactions', []);
    if (cachedTx.length > 0) {
      setTransactions(cachedTx.map((t: any) => ({ ...t, currency: t.currency === 'CUP' ? 'CUP' : 'USD', date: new Date(t.date) })));
    }
    const cachedLoans = loadLocal<any[]>('finance_loans', []);
    if (cachedLoans.length > 0) {
      setLoans(cachedLoans.map((l: any) => ({ ...l, date: new Date(l.date) })));
    }
    const cachedBags = loadLocal<DistributionBag[]>('finance_bags', []);
    if (cachedBags.length > 0) setDistributionBags(cachedBags);
    const cachedDebts = loadLocal<any[]>('finance_debts', []);
    if (cachedDebts.length > 0) {
      setDebts(cachedDebts.map((d: any) => ({ ...d, date: new Date(d.date), dueDate: d.dueDate ? new Date(d.dueDate) : undefined })));
    }
    const cachedGoals = loadLocal<any[]>('finance_goals', []);
    if (cachedGoals.length > 0) {
      setFinancialGoals(cachedGoals.map((g: any) => ({ ...g, createdAt: new Date(g.createdAt) })));
    }
  }, []);

  // Initial load from Supabase (single source of truth)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const results = await Promise.race([
          Promise.all([
            supabase.from('wallets').select('*').order('created_at'),
            supabase.from('transactions').select('*').order('transaction_date', { ascending: false }),
            supabase.from('loans').select('*').order('loan_date', { ascending: false }),
            supabase.from('distribution_bags').select('*').order('created_at'),
            loadTextSection<any[]>('finance_debts', null),
            loadTextSection<any[]>('finance_goals', null),
            loadTextSection<number | null>('finance_exchange_rate', null),
          ]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Finance load timeout')), 12000)),
        ]) as [any, any, any, any, any, any, any];
        const [walletsRes, txRes, loansRes, bagsRes, debtsData, goalsData, rateData] = results;
        if (cancelled) return;

        // --- Wallets ---
        let walletsList: Wallet[] = (walletsRes.data || []).map(walletFromRow);
        const walletsCached = loadLocal<any[]>('finance_wallets', [])
          .map((w: any) => ({ ...w, currency: w.currency === 'USD' ? 'USD' : 'CUP', icon: stringToIcon(w.iconName || (typeof w.icon === 'string' ? w.icon : 'Wallet')) }));
        if (walletsList.length === 0 && walletsCached.length === 0) {
          const seeded = initialWallets.map(w => ({ ...w, id: genId() }));
          for (const w of seeded) {
            await safeMutation({ table: 'wallets', op: 'upsert', payload: { id: w.id, name: w.name, balance: w.balance, icon: iconToString(w.icon), currency: w.currency }, onConflict: 'id' });
          }
          walletsList = seeded;
        } else {
          walletsList = mergeById(walletsList, walletsCached);
        }
        // Si la nube quedó con duplicados (mezcla de siembra offline + billetera
        // real), consolidarlos en la de mayor saldo antes de mostrarlos al AI y
        // a la página.
        walletsList = dedupeWallets(walletsList);
        const remoteWalletIds = new Set((walletsRes.data || []).map((r: any) => r.id));
        for (const w of walletsList) {
          if (!remoteWalletIds.has(w.id)) {
            await safeMutation({ table: 'wallets', op: 'upsert', payload: { id: w.id, name: w.name, balance: w.balance, icon: iconToString(w.icon), currency: w.currency }, onConflict: 'id' });
          }
        }
        if (!cancelled) setWallets(walletsList);

        // --- Transactions ---
        if (!cancelled) {
          const txList = (txRes.data || []).map(transactionFromRow);
          const txCached = loadLocal<any[]>('finance_transactions', [])
            .map((t: any) => ({ ...t, currency: t.currency === 'CUP' ? 'CUP' : 'USD', date: new Date(t.date) }));
          const txMerged = mergeById(txList, txCached);
          const remoteTxIds = new Set((txRes.data || []).map((r: any) => r.id));
          for (const t of txMerged) {
            if (!remoteTxIds.has(t.id)) {
              await safeMutation({ table: 'transactions', op: 'upsert', payload: transactionToRow(t), onConflict: 'id' });
            }
          }
          setTransactions(txMerged);
        }

        // --- Loans ---
        if (!cancelled) {
          const loansList = (loansRes.data || []).map(loanFromRow);
          const loansCached = loadLocal<any[]>('finance_loans', [])
            .map((l: any) => ({ ...l, date: new Date(l.date) }));
          const loansMerged = mergeById(loansList, loansCached);
          const remoteLoanIds = new Set((loansRes.data || []).map((r: any) => r.id));
          for (const l of loansMerged) {
            if (!remoteLoanIds.has(l.id)) {
              await safeMutation({ table: 'loans', op: 'upsert', payload: loanToRow(l), onConflict: 'id' });
            }
          }
          setLoans(loansMerged);
        }

        // --- Distribution Bags ---
        if (!cancelled) {
          let bagsList: DistributionBag[] = (bagsRes.data || []).map(bagFromRow);
          const bagsCached = loadLocal<DistributionBag[]>('finance_bags', []);
          if (bagsList.length === 0 && bagsCached.length === 0) {
            const seeded = defaultDistributionBags.map(b => ({ ...b, id: genId(), balance: 0 }));
            for (const b of seeded) {
              await safeMutation({ table: 'distribution_bags', op: 'upsert', payload: bagToRow(b), onConflict: 'id' });
            }
            bagsList = seeded;
          } else {
            bagsList = mergeById(bagsList, bagsCached);
          }
          const remoteBagIds = new Set((bagsRes.data || []).map((r: any) => r.id));
          for (const b of bagsList) {
            if (!remoteBagIds.has(b.id)) {
              await safeMutation({ table: 'distribution_bags', op: 'upsert', payload: bagToRow(b), onConflict: 'id' });
            }
          }
          setDistributionBags(bagsList);
        }

        // --- Debts (text_sections) ---
        if (!cancelled) {
          const debtsList = (debtsData && Array.isArray(debtsData))
            ? debtsData.map((d: any) => ({ ...d, date: new Date(d.date), dueDate: d.dueDate ? new Date(d.dueDate) : undefined }))
            : [];
          const debtsCached = loadLocal<any[]>('finance_debts', [])
            .map((d: any) => ({ ...d, date: new Date(d.date), dueDate: d.dueDate ? new Date(d.dueDate) : undefined }));
          setDebts(mergeById(debtsList, debtsCached));
        }

        // --- Financial Goals (text_sections) ---
        if (!cancelled) {
          const goalsList = (goalsData && Array.isArray(goalsData))
            ? goalsData.map((g: any) => ({ ...g, createdAt: new Date(g.createdAt) }))
            : [];
          const goalsCached = loadLocal<any[]>('finance_goals', [])
            .map((g: any) => ({ ...g, createdAt: new Date(g.createdAt) }));
          setFinancialGoals(mergeById(goalsList, goalsCached));
        }

        if (typeof rateData === 'number') setExchangeRateState(rateData);
      } catch (e) {
        console.warn('Finance load error, falling back to localStorage', e);
        loadFromLocalStorage();
      } finally {
        if (!cancelled) {
          // Marcamos hydrated SOLO cuando ya hay datos en el estado (de Supabase
          // o de la caché local). A partir de aquí los efectos de caché pueden
          // escribir sin borrar nada.
          setHydrated(true);
          setIsLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [loadFromLocalStorage]);

  // ---- Transactions ----
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = { ...transaction, id: genId() };
    setTransactions(prev => [newTransaction, ...prev]);
    const res = await safeMutation({ table: 'transactions', op: 'insert', payload: transactionToRow(newTransaction) });
    saveFeedback('Transacción', res);
    return newTransaction;
  }, []);
  const deleteTransaction = useCallback(async (transactionId: string) => {
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    await safeMutation({ table: 'transactions', op: 'delete', match: { id: transactionId } });
  }, []);
  const markTransactionsDistributed = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    setTransactions(prev => prev.map(t => ids.includes(t.id) ? { ...t, distributed: true } : t));
    for (const id of ids) {
      const res = await safeMutation({ table: 'transactions', op: 'update', payload: { distributed: true }, match: { id } });
      saveFeedback('Ingresos distribuidos', res);
    }
  }, []);

  // ---- Wallets ----
  const updateWalletBalance = useCallback(async (walletId: string, newBalance: number) => {
    setWallets(prev => prev.map(w => w.id === walletId ? { ...w, balance: newBalance } : w));
    const res = await safeMutation({ table: 'wallets', op: 'update', payload: { balance: newBalance }, match: { id: walletId } });
    saveFeedback('Saldo de billetera', res);
  }, []);
  const updateWallet = useCallback(async (walletId: string, updates: Partial<Wallet>) => {
    setWallets(prev => prev.map(w => w.id === walletId ? { ...w, ...updates } : w));
    const label = updates.balance !== undefined && Object.keys(updates).length === 1 ? 'Saldo de billetera' : 'Billetera';
    const res = await safeMutation({ table: 'wallets', op: 'update', payload: walletToRow(updates), match: { id: walletId } });
    saveFeedback(label, res);
  }, []);
  const addWallet = useCallback(async (wallet: Wallet) => {
    setWallets(prev => [...prev, wallet]);
    const res = await safeMutation({ table: 'wallets', op: 'insert', payload: walletToRow(wallet) });
    saveFeedback('Billetera', res);
    return wallet;
  }, []);
  const deleteWallet = useCallback(async (walletId: string) => {
    setWallets(prev => prev.filter(w => w.id !== walletId));
    const res = await safeMutation({ table: 'wallets', op: 'delete', match: { id: walletId } });
    saveFeedback('Billetera eliminada', res);
  }, []);

  // ---- Loans ----
  const addLoan = useCallback(async (loan: Omit<Loan, 'id'>) => {
    const newLoan: Loan = { ...loan, id: genId() };
    setLoans(prev => [newLoan, ...prev]);
    const res = await safeMutation({ table: 'loans', op: 'insert', payload: loanToRow(newLoan) });
    saveFeedback('Préstamo', res);
    return newLoan;
  }, []);
  const updateLoan = useCallback(async (loanId: string, updates: Partial<Loan>) => {
    setLoans(prev => prev.map(l => l.id === loanId ? { ...l, ...updates } : l));
    const res = await safeMutation({ table: 'loans', op: 'update', payload: loanToRow(updates), match: { id: loanId } });
    saveFeedback('Préstamo', res);
  }, []);

  // ---- Debts (text_sections) ----
  const persistDebts = useCallback((next: Debt[]) => {
    saveTextSection('finance_debts', next);
  }, []);
  const addDebt = useCallback(async (debt: Omit<Debt, 'id'>) => {
    const newDebt: Debt = { ...debt, id: genId() };
    setDebts(prev => { const next = [newDebt, ...prev]; persistDebts(next); return next; });
    return newDebt;
  }, [persistDebts]);
  const updateDebt = useCallback(async (debtId: string, updates: Partial<Debt>) => {
    setDebts(prev => { const next = prev.map(d => d.id === debtId ? { ...d, ...updates } : d); persistDebts(next); return next; });
  }, [persistDebts]);
  const deleteDebt = useCallback(async (debtId: string) => {
    setDebts(prev => { const next = prev.filter(d => d.id !== debtId); persistDebts(next); return next; });
  }, [persistDebts]);

  // ---- Distribution Bags ----
  const addDistributionBag = useCallback(async (bag: Omit<DistributionBag, 'id'>) => {
    const newBag: DistributionBag = { ...bag, id: genId() };
    setDistributionBags(prev => [...prev, newBag]);
    const res = await safeMutation({ table: 'distribution_bags', op: 'insert', payload: bagToRow(newBag) });
    saveFeedback('Bolsa de distribución', res);
    return newBag;
  }, []);
  const updateDistributionBag = useCallback(async (bagId: string, updates: Partial<DistributionBag>) => {
    setDistributionBags(prev => prev.map(b => b.id === bagId ? { ...b, ...updates } : b));
    const res = await safeMutation({ table: 'distribution_bags', op: 'update', payload: bagToRow(updates), match: { id: bagId } });
    saveFeedback('Bolsa de distribución', res);
  }, []);
  const deleteDistributionBag = useCallback(async (bagId: string) => {
    setDistributionBags(prev => prev.filter(b => b.id !== bagId));
    const res = await safeMutation({ table: 'distribution_bags', op: 'delete', match: { id: bagId } });
    saveFeedback('Bolsa de distribución eliminada', res);
  }, []);

  // ---- Financial Goals (text_sections) ----
  const persistGoals = useCallback((next: FinancialGoal[]) => {
    saveTextSection('finance_goals', next);
  }, []);
  const addFinancialGoal = useCallback(async (goal: Omit<FinancialGoal, 'id'>) => {
    const newGoal: FinancialGoal = { ...goal, id: genId() };
    setFinancialGoals(prev => { const next = [...prev, newGoal]; persistGoals(next); return next; });
    return newGoal;
  }, [persistGoals]);
  const updateFinancialGoal = useCallback(async (goalId: string, updates: Partial<FinancialGoal>) => {
    setFinancialGoals(prev => { const next = prev.map(g => g.id === goalId ? { ...g, ...updates } : g); persistGoals(next); return next; });
  }, [persistGoals]);
  const deleteFinancialGoal = useCallback(async (goalId: string) => {
    setFinancialGoals(prev => { const next = prev.filter(g => g.id !== goalId); persistGoals(next); return next; });
  }, [persistGoals]);

  // ---- Bulk setters (used by Finance.tsx for advanced flows). We reconcile with DB via full replace when necessary. ----
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
    financialGoals,
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
    markTransactionsDistributed,
    updateWalletBalance,
    updateWallet,
    addWallet,
    deleteWallet,
    addLoan,
    updateLoan,
    addDebt,
    updateDebt,
    deleteDebt,
    addDistributionBag,
    updateDistributionBag,
    deleteDistributionBag,
    addFinancialGoal,
    updateFinancialGoal,
    deleteFinancialGoal,
  };
};
