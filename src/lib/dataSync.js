import { supabase } from "@/integrations/supabase/client";
import { isOnline } from "./isOnline";
import { enqueueMutation } from "./offlineQueue";
function getLocalData(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
async function upsertBatch(table, data, conflictColumn) {
    if (data.length === 0)
        return { table, success: true, count: 0 };
    if (!isOnline()) {
        for (const item of data) {
            await enqueueMutation({ table, op: "upsert", payload: item, onConflict: conflictColumn });
        }
        return { table, success: true, count: data.length };
    }
    try {
        const query = supabase.from(table).upsert(data, conflictColumn ? { onConflict: conflictColumn } : undefined);
        const { error } = await query;
        if (error) {
            for (const item of data) {
                await enqueueMutation({ table, op: "upsert", payload: item, onConflict: conflictColumn });
            }
            return { table, success: true, count: data.length, error: error.message };
        }
        return { table, success: true, count: data.length };
    }
    catch (err) {
        for (const item of data) {
            await enqueueMutation({ table, op: "upsert", payload: item, onConflict: conflictColumn });
        }
        return { table, success: true, count: data.length, error: String(err) };
    }
}
export async function syncTasks() {
    const tasks = getLocalData("tasks");
    if (!tasks || tasks.length === 0)
        return { table: "tasks", success: true, count: 0 };
    const mapped = tasks.map((t) => ({
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
export async function syncWallets() {
    const wallets = getLocalData("wallets");
    if (!wallets || wallets.length === 0)
        return { table: "wallets", success: true, count: 0 };
    const mapped = wallets.map((w) => ({
        id: w.id,
        name: w.name || "Billetera",
        balance: w.balance ?? 0,
        icon: w.icon || null,
    }));
    return upsertBatch("wallets", mapped, "id");
}
export async function syncTransactions() {
    const transactions = getLocalData("transactions");
    if (!transactions || transactions.length === 0)
        return { table: "transactions", success: true, count: 0 };
    const mapped = transactions.map((t) => ({
        id: t.id,
        description: t.description || "Sin descripción",
        amount: t.amount ?? 0,
        transaction_type: t.type || "expense",
        category_id: t.categoryId || null,
        wallet_id: t.walletId || null,
        transaction_date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
        loan_id: t.loanId || null,
        transfer_id: t.transferId || null,
    }));
    return upsertBatch("transactions", mapped, "id");
}
export async function syncLoans() {
    const loans = getLocalData("loans");
    if (!loans || loans.length === 0)
        return { table: "loans", success: true, count: 0 };
    const mapped = loans.map((l) => ({
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
export async function syncProjects() {
    const projects = getLocalData("projects");
    if (!projects || projects.length === 0)
        return { table: "projects", success: true, count: 0 };
    const mapped = projects.map((p) => ({
        id: p.id,
        title: p.title || "Sin título",
        description: p.description || null,
        cover_image: p.coverImage || null,
        status: p.status || "active",
    }));
    return upsertBatch("projects", mapped, "id");
}
export async function syncHabitHistory() {
    const habitHistory = getLocalData("habitHistory");
    if (!habitHistory)
        return { table: "habit_history", success: true, count: 0 };
    const entries = Object.entries(habitHistory);
    const mapped = entries.map(([habitId, data]) => ({
        habit_id: habitId,
        completed_dates: data.completedDates || [],
        current_streak: data.currentStreak || 0,
        longest_streak: data.longestStreak || 0,
    }));
    return upsertBatch("habit_history", mapped, "habit_id");
}
export async function syncAll() {
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
export function getLocalTasksForDate(dateStr) {
    const tasks = getLocalData("tasks") || [];
    const dayTasks = tasks.filter((t) => {
        if (!t.dueDate)
            return false;
        const d = new Date(t.dueDate);
        return d.toISOString().split("T")[0] === dateStr;
    });
    const completed = dayTasks.filter((t) => t.completed || t.status === "completada").length;
    return { completed, total: dayTasks.length, tasks: dayTasks };
}
export function getLocalBlockCompletions(blocks) {
    const stored = localStorage.getItem("dailyRoutineBlocks");
    if (!stored)
        return { completedCount: 0, totalCount: blocks.length };
    try {
        const parsedBlocks = JSON.parse(stored);
        const today = new Date().getDay();
        const dayIndex = today === 0 ? 6 : today - 1;
        const completedCount = parsedBlocks.filter((b) => b.weeklyCompletion?.[dayIndex]).length;
        return { completedCount, totalCount: blocks.length };
    }
    catch {
        return { completedCount: 0, totalCount: blocks.length };
    }
}
