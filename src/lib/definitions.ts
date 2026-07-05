import { LucideIcon } from "lucide-react";

export interface Habit {
  id: string;
  title: string;
  areaId: string;
  icon: LucideIcon;
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
    morningRoutine?: boolean;
    nightRoutine?: boolean;
    cleanClothes?: boolean;
    hairGroomed?: boolean;
    perfumeApplied?: boolean;
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

export interface DistributionBag {
  id: string;
  name: string;
  description: string;
  percentage: number;
  icon: string;
  color: string;
  balance?: number;
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
  distributed?: boolean;
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

export interface Debt {
  id: string;
  person: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  walletId: string;
  date: Date;
  dueDate?: Date;
  interestRate?: number;
  status: 'outstanding' | 'paid';
}

export interface IdentitySystemTask {
  id: string;
  description: string;
}

export interface IdentitySystem {
  id: string;
  area_id: string;
  name: string;
  description: string;
  tasks: IdentitySystemTask[];
  linked_system_hint: string;
  is_active: boolean;
  sort_order: number;
}

export interface Necesidad {
  id: string
  necesidad_id: string
  titulo: string
  descripcion: string
  icono: string
  progreso: number
  area_referencia: string
  orden: number
}

export interface BoxeoTecnica {
  id: string
  nombre: string
  descripcion: string
  categoria: 'basico' | 'intermedio' | 'avanzado'
  nivel_requerido: number
  nivel_dominio: number
}

export interface BoxeoSesion {
  id: string
  fecha: string
  tipo: 'saco' | 'sombra' | 'sparring' | 'bolsa' | 'otros'
  duracion_minutos: number
  rounds: number
  intensidad: 'baja' | 'media' | 'alta'
  tecnicas_practicadas: string[]
  notas: string
}

export interface EventoSocial {
  id: string
  fecha: string
  tipo: 'amigos' | 'hotel' | 'fiesta' | 'experiencia' | 'otros'
  con_quien: string[]
  descripcion: string
  gasto: number
  rating: number
  notas: string
}

export interface Cita {
  id: string
  fecha: string
  persona: string
  lugar: string
  rating: number
  notas: string
}

export interface IntimidadEntry {
  id: string
  fecha: string
  calidad: number
  posiciones: string[]
  notas: string
}

export interface PointBSubAxis {
  id: string
  label: string
  start: number
  target: number
  unit: string
  trackingIds: string[]
}

export interface PointBArea {
  id: string
  label: string
  group: "cimientos" | "construccion" | "recompensas"
  icon: string
  effortTrackingIds: string[]
  sub: PointBSubAxis[]
}
