import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { wallets as initialWallets, defaultDistributionBags } from '@/lib/data';
import { Banknote, CreditCard, PiggyBank, Target, Wallet as WalletIcon, Shield, TrendingUp, Home, Gamepad2, BookOpen, Heart, GraduationCap, Sparkles, DollarSign, Plane, Coffee, } from 'lucide-react';
const iconStringToComponent = {
    Banknote, CreditCard, PiggyBank, Target, Wallet: WalletIcon,
    Shield, TrendingUp, Home, Gamepad2, BookOpen, Heart,
    GraduationCap, Sparkles, DollarSign, Plane, Coffee,
};
const componentToIconString = new Map();
Object.entries(iconStringToComponent).forEach(([k, v]) => componentToIconString.set(v, k));
function iconToString(icon) {
    if (!icon)
        return 'Wallet';
    return componentToIconString.get(icon) || 'Wallet';
}
function stringToIcon(name) {
    if (!name)
        return WalletIcon;
    return iconStringToComponent[name] || WalletIcon;
}
function genId() {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
// --- Local cache helpers (for instant UI + offline) ---
function saveLocal(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    }
    catch { }
}
function loadLocal(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    }
    catch {
        return fallback;
    }
}
// --- text_sections generic KV helpers ---
async function loadTextSection(key, fallback) {
    try {
        const { data } = await supabase
            .from('text_sections')
            .select('content')
            .eq('section_key', key)
            .maybeSingle();
        if (data && data.content !== null && data.content !== undefined) {
            return data.content;
        }
    }
    catch { }
    return fallback;
}
async function saveTextSection(key, value) {
    try {
        const { data: existing } = await supabase
            .from('text_sections')
            .select('id')
            .eq('section_key', key)
            .maybeSingle();
        if (existing) {
            await supabase.from('text_sections').update({ content: value, updated_at: new Date().toISOString() }).eq('id', existing.id);
        }
        else {
            await supabase.from('text_sections').insert({ section_key: key, content: value });
        }
    }
    catch (e) {
        console.warn('text_sections save failed', key, e);
    }
}
// --- Mappers ---
function walletFromRow(row) {
    return { id: row.id, name: row.name, balance: Number(row.balance) || 0, icon: stringToIcon(row.icon) };
}
function walletToRow(w) {
    const out = {};
    if (w.id)
        out.id = w.id;
    if (w.name !== undefined)
        out.name = w.name;
    if (w.balance !== undefined)
        out.balance = w.balance;
    if (w.icon !== undefined)
        out.icon = iconToString(w.icon);
    return out;
}
function transactionFromRow(row) {
    return {
        id: row.id,
        description: row.description || '',
        amount: Number(row.amount) || 0,
        date: new Date(row.transaction_date),
        walletId: row.wallet_id,
        categoryId: row.category_id || '',
        type: row.transaction_type,
        transferId: row.transfer_id || undefined,
        loanId: row.loan_id || undefined,
        distributed: row.distributed ?? false,
    };
}
function transactionToRow(t) {
    const out = {};
    if (t.id)
        out.id = t.id;
    if (t.description !== undefined)
        out.description = t.description;
    if (t.amount !== undefined)
        out.amount = t.amount;
    if (t.date !== undefined)
        out.transaction_date = (t.date instanceof Date ? t.date : new Date(t.date)).toISOString();
    if (t.walletId !== undefined)
        out.wallet_id = t.walletId;
    if (t.categoryId !== undefined)
        out.category_id = t.categoryId;
    if (t.type !== undefined)
        out.transaction_type = t.type;
    if (t.transferId !== undefined)
        out.transfer_id = t.transferId || null;
    if (t.loanId !== undefined)
        out.loan_id = t.loanId || null;
    if (t.distributed !== undefined)
        out.distributed = t.distributed;
    return out;
}
function loanFromRow(row) {
    return {
        id: row.id,
        person: row.person || '',
        description: row.description || '',
        totalAmount: Number(row.total_amount) || 0,
        paidAmount: Number(row.paid_amount) || 0,
        walletId: row.wallet_id,
        date: new Date(row.loan_date),
        status: row.status,
    };
}
function loanToRow(l) {
    const out = {};
    if (l.id)
        out.id = l.id;
    if (l.person !== undefined)
        out.person = l.person;
    if (l.description !== undefined)
        out.description = l.description;
    if (l.totalAmount !== undefined)
        out.total_amount = l.totalAmount;
    if (l.paidAmount !== undefined)
        out.paid_amount = l.paidAmount;
    if (l.walletId !== undefined)
        out.wallet_id = l.walletId;
    if (l.date !== undefined)
        out.loan_date = (l.date instanceof Date ? l.date : new Date(l.date)).toISOString();
    if (l.status !== undefined)
        out.status = l.status;
    return out;
}
function bagFromRow(row) {
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
function bagToRow(b) {
    const out = {};
    if (b.id)
        out.id = b.id;
    if (b.name !== undefined)
        out.name = b.name;
    if (b.description !== undefined)
        out.description = b.description;
    if (b.percentage !== undefined)
        out.percentage = b.percentage;
    if (b.icon !== undefined)
        out.icon = b.icon;
    if (b.color !== undefined)
        out.color = b.color;
    if (b.balance !== undefined)
        out.balance = b.balance;
    return out;
}
export const useFinance = () => {
    const [wallets, setWallets] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loans, setLoans] = useState([]);
    const [distributionBags, setDistributionBags] = useState([]);
    const [debts, setDebts] = useState([]);
    const [financialGoals, setFinancialGoals] = useState([]);
    const [exchangeRate, setExchangeRateState] = useState(() => loadLocal('finance_rate', 360));
    const [isLoading, setIsLoading] = useState(true);
    // Cache to local whenever state changes
    useEffect(() => {
        if (wallets.length > 0)
            saveLocal('finance_wallets', wallets.map(w => ({ id: w.id, name: w.name, balance: w.balance, iconName: iconToString(w.icon) })));
    }, [wallets]);
    useEffect(() => { if (transactions.length > 0)
        saveLocal('finance_transactions', transactions); }, [transactions]);
    useEffect(() => { if (loans.length > 0)
        saveLocal('finance_loans', loans); }, [loans]);
    useEffect(() => { if (distributionBags.length > 0)
        saveLocal('finance_bags', distributionBags); }, [distributionBags]);
    useEffect(() => { if (debts.length > 0)
        saveLocal('finance_debts', debts); }, [debts]);
    useEffect(() => { if (financialGoals.length > 0)
        saveLocal('finance_goals', financialGoals); }, [financialGoals]);
    useEffect(() => { saveLocal('finance_rate', exchangeRate); }, [exchangeRate]);
    const setExchangeRate = useCallback((rate) => {
        setExchangeRateState(rate);
        saveTextSection('finance_exchange_rate', rate);
    }, []);
    // Load from localStorage fallback
    const loadFromLocalStorage = useCallback(() => {
        const cachedWallets = loadLocal('finance_wallets', []);
        if (cachedWallets.length > 0) {
            setWallets(cachedWallets.map((w) => ({ ...w, icon: stringToIcon(w.iconName || (typeof w.icon === 'string' ? w.icon : 'Wallet')) })));
        }
        const cachedTx = loadLocal('finance_transactions', []);
        if (cachedTx.length > 0) {
            setTransactions(cachedTx.map((t) => ({ ...t, date: new Date(t.date) })));
        }
        const cachedLoans = loadLocal('finance_loans', []);
        if (cachedLoans.length > 0) {
            setLoans(cachedLoans.map((l) => ({ ...l, date: new Date(l.date) })));
        }
        const cachedBags = loadLocal('finance_bags', []);
        if (cachedBags.length > 0)
            setDistributionBags(cachedBags);
        const cachedDebts = loadLocal('finance_debts', []);
        if (cachedDebts.length > 0) {
            setDebts(cachedDebts.map((d) => ({ ...d, date: new Date(d.date), dueDate: d.dueDate ? new Date(d.dueDate) : undefined })));
        }
        const cachedGoals = loadLocal('finance_goals', []);
        if (cachedGoals.length > 0) {
            setFinancialGoals(cachedGoals.map((g) => ({ ...g, createdAt: new Date(g.createdAt) })));
        }
    }, []);
    // Initial load from Supabase (single source of truth)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            try {
                const [walletsRes, txRes, loansRes, bagsRes, debtsData, goalsData, rateData] = await Promise.all([
                    supabase.from('wallets').select('*').order('created_at'),
                    supabase.from('transactions').select('*').order('transaction_date', { ascending: false }),
                    supabase.from('loans').select('*').order('loan_date', { ascending: false }),
                    supabase.from('distribution_bags').select('*').order('created_at'),
                    loadTextSection('finance_debts', null),
                    loadTextSection('finance_goals', null),
                    loadTextSection('finance_exchange_rate', null),
                ]);
                if (cancelled)
                    return;
                // --- Wallets ---
                let walletsList = (walletsRes.data || []).map(walletFromRow);
                if (walletsList.length === 0) {
                    const cached = loadLocal('finance_wallets', []);
                    if (cached.length > 0) {
                        walletsList = cached.map((w) => ({ ...w, icon: stringToIcon(w.iconName || (typeof w.icon === 'string' ? w.icon : 'Wallet')) }));
                    }
                    else {
                        const seeded = initialWallets.map(w => ({ ...w, id: genId() }));
                        try {
                            await supabase.from('wallets').insert(seeded.map(w => ({ id: w.id, name: w.name, balance: w.balance, icon: iconToString(w.icon) })));
                        }
                        catch { }
                        walletsList = seeded;
                    }
                }
                if (!cancelled)
                    setWallets(walletsList);
                // --- Transactions ---
                if (!cancelled) {
                    const txList = (txRes.data || []).map(transactionFromRow);
                    if (txList.length === 0) {
                        const cached = loadLocal('finance_transactions', []);
                        if (cached.length > 0)
                            setTransactions(cached.map((t) => ({ ...t, date: new Date(t.date) })));
                    }
                    else {
                        setTransactions(txList);
                    }
                }
                // --- Loans ---
                if (!cancelled) {
                    const loansList = (loansRes.data || []).map(loanFromRow);
                    if (loansList.length === 0) {
                        const cached = loadLocal('finance_loans', []);
                        if (cached.length > 0)
                            setLoans(cached.map((l) => ({ ...l, date: new Date(l.date) })));
                    }
                    else {
                        setLoans(loansList);
                    }
                }
                // --- Distribution Bags ---
                if (!cancelled) {
                    let bagsList = (bagsRes.data || []).map(bagFromRow);
                    if (bagsList.length === 0) {
                        const cached = loadLocal('finance_bags', []);
                        if (cached.length > 0) {
                            bagsList = cached;
                        }
                        else {
                            const seeded = defaultDistributionBags.map(b => ({ ...b, id: genId(), balance: 0 }));
                            try {
                                await supabase.from('distribution_bags').insert(seeded.map(bagToRow));
                            }
                            catch { }
                            bagsList = seeded;
                        }
                    }
                    setDistributionBags(bagsList);
                }
                // --- Debts (text_sections) ---
                if (!cancelled) {
                    if (debtsData && Array.isArray(debtsData) && debtsData.length > 0) {
                        setDebts(debtsData.map((d) => ({ ...d, date: new Date(d.date), dueDate: d.dueDate ? new Date(d.dueDate) : undefined })));
                    }
                    else {
                        const cached = loadLocal('finance_debts', []);
                        if (cached.length > 0)
                            setDebts(cached.map((d) => ({ ...d, date: new Date(d.date), dueDate: d.dueDate ? new Date(d.dueDate) : undefined })));
                    }
                }
                // --- Financial Goals (text_sections) ---
                if (!cancelled) {
                    if (goalsData && Array.isArray(goalsData) && goalsData.length > 0) {
                        setFinancialGoals(goalsData.map((g) => ({ ...g, createdAt: new Date(g.createdAt) })));
                    }
                    else {
                        const cached = loadLocal('finance_goals', []);
                        if (cached.length > 0)
                            setFinancialGoals(cached.map((g) => ({ ...g, createdAt: new Date(g.createdAt) })));
                    }
                }
                if (typeof rateData === 'number')
                    setExchangeRateState(rateData);
            }
            catch (e) {
                console.warn('Finance load error, falling back to localStorage', e);
                loadFromLocalStorage();
            }
            finally {
                if (!cancelled)
                    setIsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [loadFromLocalStorage]);
    // ---- Transactions ----
    const addTransaction = useCallback(async (transaction) => {
        const newTransaction = { ...transaction, id: genId() };
        setTransactions(prev => [newTransaction, ...prev]);
        try {
            await supabase.from('transactions').insert(transactionToRow(newTransaction));
        }
        catch (e) {
            console.warn(e);
        }
        return newTransaction;
    }, []);
    const deleteTransaction = useCallback(async (transactionId) => {
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
        try {
            await supabase.from('transactions').delete().eq('id', transactionId);
        }
        catch (e) {
            console.warn(e);
        }
    }, []);
    // ---- Wallets ----
    const updateWalletBalance = useCallback(async (walletId, newBalance) => {
        setWallets(prev => prev.map(w => w.id === walletId ? { ...w, balance: newBalance } : w));
        try {
            await supabase.from('wallets').update({ balance: newBalance }).eq('id', walletId);
        }
        catch (e) {
            console.warn(e);
        }
    }, []);
    const updateWallet = useCallback(async (walletId, updates) => {
        setWallets(prev => prev.map(w => w.id === walletId ? { ...w, ...updates } : w));
        try {
            await supabase.from('wallets').update(walletToRow(updates)).eq('id', walletId);
        }
        catch (e) {
            console.warn(e);
        }
    }, []);
    const addWallet = useCallback(async (wallet) => {
        setWallets(prev => [...prev, wallet]);
        try {
            await supabase.from('wallets').insert(walletToRow(wallet));
        }
        catch (e) {
            console.warn(e);
        }
        return wallet;
    }, []);
    const deleteWallet = useCallback(async (walletId) => {
        setWallets(prev => prev.filter(w => w.id !== walletId));
        try {
            await supabase.from('wallets').delete().eq('id', walletId);
        }
        catch (e) {
            console.warn(e);
        }
    }, []);
    // ---- Loans ----
    const addLoan = useCallback(async (loan) => {
        const newLoan = { ...loan, id: genId() };
        setLoans(prev => [newLoan, ...prev]);
        try {
            await supabase.from('loans').insert(loanToRow(newLoan));
        }
        catch (e) {
            console.warn(e);
        }
        return newLoan;
    }, []);
    const updateLoan = useCallback(async (loanId, updates) => {
        setLoans(prev => prev.map(l => l.id === loanId ? { ...l, ...updates } : l));
        try {
            await supabase.from('loans').update(loanToRow(updates)).eq('id', loanId);
        }
        catch (e) {
            console.warn(e);
        }
    }, []);
    // ---- Debts (text_sections) ----
    const persistDebts = useCallback((next) => {
        saveTextSection('finance_debts', next);
    }, []);
    const addDebt = useCallback(async (debt) => {
        const newDebt = { ...debt, id: genId() };
        setDebts(prev => { const next = [newDebt, ...prev]; persistDebts(next); return next; });
        return newDebt;
    }, [persistDebts]);
    const updateDebt = useCallback(async (debtId, updates) => {
        setDebts(prev => { const next = prev.map(d => d.id === debtId ? { ...d, ...updates } : d); persistDebts(next); return next; });
    }, [persistDebts]);
    const deleteDebt = useCallback(async (debtId) => {
        setDebts(prev => { const next = prev.filter(d => d.id !== debtId); persistDebts(next); return next; });
    }, [persistDebts]);
    // ---- Distribution Bags ----
    const addDistributionBag = useCallback(async (bag) => {
        const newBag = { ...bag, id: genId() };
        setDistributionBags(prev => [...prev, newBag]);
        try {
            await supabase.from('distribution_bags').insert(bagToRow(newBag));
        }
        catch (e) {
            console.warn(e);
        }
        return newBag;
    }, []);
    const updateDistributionBag = useCallback(async (bagId, updates) => {
        setDistributionBags(prev => prev.map(b => b.id === bagId ? { ...b, ...updates } : b));
        try {
            await supabase.from('distribution_bags').update(bagToRow(updates)).eq('id', bagId);
        }
        catch (e) {
            console.warn(e);
        }
    }, []);
    const deleteDistributionBag = useCallback(async (bagId) => {
        setDistributionBags(prev => prev.filter(b => b.id !== bagId));
        try {
            await supabase.from('distribution_bags').delete().eq('id', bagId);
        }
        catch (e) {
            console.warn(e);
        }
    }, []);
    // ---- Financial Goals (text_sections) ----
    const persistGoals = useCallback((next) => {
        saveTextSection('finance_goals', next);
    }, []);
    const addFinancialGoal = useCallback(async (goal) => {
        const newGoal = { ...goal, id: genId() };
        setFinancialGoals(prev => { const next = [...prev, newGoal]; persistGoals(next); return next; });
        return newGoal;
    }, [persistGoals]);
    const updateFinancialGoal = useCallback(async (goalId, updates) => {
        setFinancialGoals(prev => { const next = prev.map(g => g.id === goalId ? { ...g, ...updates } : g); persistGoals(next); return next; });
    }, [persistGoals]);
    const deleteFinancialGoal = useCallback(async (goalId) => {
        setFinancialGoals(prev => { const next = prev.filter(g => g.id !== goalId); persistGoals(next); return next; });
    }, [persistGoals]);
    // ---- Bulk setters (used by Finance.tsx for advanced flows). We reconcile with DB via full replace when necessary. ----
    const setDistributionBagsState = useCallback((bags) => {
        setDistributionBags(bags);
    }, []);
    const setWalletsState = useCallback((w) => {
        setWallets(w);
    }, []);
    const setTransactionsState = useCallback((t) => {
        setTransactions(t);
    }, []);
    const setLoansState = useCallback((l) => {
        setLoans(l);
    }, []);
    const setDebtsState = useCallback((d) => {
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
