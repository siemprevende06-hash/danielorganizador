import { LucideIcon } from "lucide-react";

export interface Habit {
  id: string;
  title: string;
  areaId: string;
  effortLevels?: {
    name: string;
    minDuration: number;
    ring: string;
    border: string;
  }[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pendiente' | 'en-progreso' | 'completada' | 'cancelada';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  startDate?: Date;
  areaId?: string;
  completed?: boolean;
}

export interface LifeArea {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  subAreas?: LifeArea[];
}

export interface HabitEntry {
  date: string;
  status: 'completed' | 'skipped' | 'failed';
  duration?: number;
  healthMetrics?: {
    sleepHours?: number;
    sleepQuality?: number;
    regularSchedule?: boolean;
    classesAttended?: number;
    totalClasses?: number;
    studyTime?: number;
  };
}

export interface HabitHistory {
  [habitId: string]: {
    completedDates: HabitEntry[];
    currentStreak: number;
    longestStreak: number;
  };
}

export interface BlockHistory {
  [date: string]: BlockCompletion[];
}

export interface BlockCompletion {
  blockId: string;
  status: 'completed' | 'failed';
  completedAt: Date;
}

export interface RoutineTaskGroup {
  id: string;
  title: string;
  startTime?: string;
  endTime?: string;
  tasks: string[];
  isFocusBlock?: boolean;
}

export interface MonthlyGoal {
  id: string;
  areaId: string;
  quarterlyGoalId?: string;
  tasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];
}

export interface QuarterlyGoal {
  id: string;
  title: string;
  description: string;
  areaId: string;
  startDate: Date;
  endDate: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'abandoned';
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  icon: LucideIcon;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  walletId: string;
  categoryId: string;
  type: 'income' | 'expense';
  transferId?: string;
  loanId?: string;
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: LucideIcon;
}

export interface Loan {
  id: string;
  person: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  walletId: string;
  date: Date;
  status: 'outstanding' | 'paid';
}
