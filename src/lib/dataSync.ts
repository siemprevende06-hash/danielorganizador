import { supabase } from "@/integrations/supabase/client";
import { isOnline } from "./isOnline";
import { enqueueMutation } from "./offlineQueue";

export interface SyncResult {
  table: string;
  success: boolean;
  count: number;
  error?: string;
}

export interface SyncReport {
  results: SyncResult[];
  totalSuccess: number;
  totalFailed: number;
  timestamp: string;
}

function getLocalData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function upsertBatch(table: string, data: Record<string, unknown>[], conflictColumn?: string): Promise<SyncResult> {
  if (data.length === 0) return { table, success: true, count: 0 };

  if (!isOnline()) {
    for (const item of data) {
      await enqueueMutation({ table, op: "upsert", payload: item, onConflict: conflictColumn });
    }
    return { table, success: true, count: data.length };
  }

  try {
    const query = (supabase.from(table as any) as any).upsert(data, conflictColumn ? { onConflict: conflictColumn } : undefined);
    const { error } = await query;
    if (error) {
      for (const item of data) {
        await enqueueMutation({ table, op: "upsert", payload: item, onConflict: conflictColumn });
      }
      return { table, success: true, count: data.length, error: error.message };
    }
    return { table, success: true, count: data.length };
  } catch (err) {
    for (const item of data) {
      await enqueueMutation({ table, op: "upsert", payload: item, onConflict: conflictColumn });
    }
    return { table, success: true, count: data.length, error: String(err) };
  }
}

export async function syncTasks(): Promise<SyncResult> {
  const tasks = getLocalData<any[]>("tasks");
  if (!tasks || tasks.length === 0) return { table: "tasks", success: true, count: 0 };

  const mapped = tasks.map((t: any) => ({
    id: t.id,
    title: t.title || "Sin título",
    description: t.description || null,
    status: t.status || "pendiente",
    priority: t.priority || null,
    due_date: t.dueDate ? new Date(t.dueDate).toISOString() : null,
    start_date: t.startDate ? new Date(t.startDate).toISOString() : null,
    area_id: t.areaId || null,
    completed: t.completed || t.status === "completada" || false,
    source: t.source || "tasks",
    task_type: t.taskType || null,
    estimated_minutes: t.estimatedMinutes || null,
    routine_block_id: t.routineBlockId || null,
    topic_id: t.topicId || null,
  }));

  return upsertBatch("tasks", mapped, "id");
}

export async function syncWallets(): Promise<SyncResult> {
  const wallets = getLocalData<any[]>("wallets");
  if (!wallets || wallets.length === 0) return { table: "wallets", success: true, count: 0 };

  const mapped = wallets.map((w: any) => ({
    id: w.id,
    name: w.name || "Billetera",
    balance: w.balance ?? 0,
    icon: w.icon || null,
    currency: w.currency === 'USD' ? 'USD' : 'CUP',
  }));

  return upsertBatch("wallets", mapped, "id");
}

export async function syncTransactions(): Promise<SyncResult> {
  const transactions = getLocalData<any[]>("transactions");
  if (!transactions || transactions.length === 0) return { table: "transactions", success: true, count: 0 };

  const mapped = transactions.map((t: any) => ({
    id: t.id,
    description: t.description || "Sin descripción",
    amount: t.amount ?? 0,
    currency: t.currency === 'CUP' ? 'CUP' : 'USD',
    transaction_type: t.type || "expense",
    category_id: t.categoryId || null,
    wallet_id: t.walletId || null,
    transaction_date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
    loan_id: t.loanId || null,
    transfer_id: t.transferId || null,
  }));

  return upsertBatch("transactions", mapped, "id");
}

export async function syncLoans(): Promise<SyncResult> {
  const loans = getLocalData<any[]>("loans");
  if (!loans || loans.length === 0) return { table: "loans", success: true, count: 0 };

  const mapped = loans.map((l: any) => ({
    id: l.id,
    person: l.person || "Desconocido",
    description: l.description || null,
    total_amount: l.totalAmount ?? 0,
    paid_amount: l.paidAmount ?? 0,
    wallet_id: l.walletId || null,
    loan_date: l.date ? new Date(l.date).toISOString() : new Date().toISOString(),
    status: l.status || "outstanding",
  }));

  return upsertBatch("loans", mapped, "id");
}

export async function syncProjects(): Promise<SyncResult> {
  const projects = getLocalData<any[]>("projects");
  if (!projects || projects.length === 0) return { table: "projects", success: true, count: 0 };

  const mapped = projects.map((p: any) => ({
    id: p.id,
    title: p.title || "Sin título",
    description: p.description || null,
    cover_image: p.coverImage || null,
    status: p.status || "active",
  }));

  return upsertBatch("projects", mapped, "id");
}

export async function syncHabitHistory(): Promise<SyncResult> {
  const habitHistory = getLocalData<Record<string, any>>("habitHistory");
  if (!habitHistory) return { table: "habit_history", success: true, count: 0 };

  const entries = Object.entries(habitHistory);
  const mapped = entries.map(([habitId, data]: [string, any]) => ({
    habit_id: habitId,
    completed_dates: data.completedDates || [],
    current_streak: data.currentStreak || 0,
    longest_streak: data.longestStreak || 0,
  }));

  return upsertBatch("habit_history", mapped, "habit_id");
}

export async function syncAll(): Promise<SyncReport> {
  const results = await Promise.all([
    syncTasks(),
    syncWallets(),
    syncTransactions(),
    syncLoans(),
    syncProjects(),
    syncHabitHistory(),
  ]);

  const totalSuccess = results.filter(r => r.success).reduce((s, r) => s + r.count, 0);
  const totalFailed = results.filter(r => !r.success).length;

  return {
    results,
    totalSuccess,
    totalFailed,
    timestamp: new Date().toISOString(),
  };
}

export function getLocalTasksForDate(dateStr: string): { completed: number; total: number; tasks: any[] } {
  const tasks = getLocalData<any[]>("tasks") || [];
  const dayTasks = tasks.filter((t: any) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.toISOString().split("T")[0] === dateStr;
  });
  const completed = dayTasks.filter((t: any) => t.completed || t.status === "completada").length;
  return { completed, total: dayTasks.length, tasks: dayTasks };
}

export function getLocalBlockCompletions(blocks: any[]): { completedCount: number; totalCount: number } {
  const stored = localStorage.getItem("dailyRoutineBlocks");
  if (!stored) return { completedCount: 0, totalCount: blocks.length };

  try {
    const parsedBlocks = JSON.parse(stored);
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    const completedCount = parsedBlocks.filter((b: any) => b.weeklyCompletion?.[dayIndex]).length;
    return { completedCount, totalCount: blocks.length };
  } catch {
    return { completedCount: 0, totalCount: blocks.length };
  }
}
