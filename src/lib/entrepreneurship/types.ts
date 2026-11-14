export type Stage =
  | 'idea'
  | 'validation'
  | 'mvp'
  | 'traction'
  | 'revenue'
  | 'scale'
  | 'paused';

export type Currency = 'USD' | 'CUP';

export interface Venture {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  stage: Stage;
  business_model: string | null;
  target_market: string | null;
  currency: Currency;
  accent_color: string;
  cash_balance: number;
  monthly_goal: number | null;
  north_star_key: string | null;
  north_star_target: number | null;
  started_at: string | null;
  stage_entered_at: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

export interface EntrepreneurshipTask {
  id: string;
  entrepreneurship_id: string;
  title: string;
  description: string | null;
  task_type: 'normal' | 'improvement';
  completed: boolean;
  due_date: string | null;
  routine_block_id?: string | null;
  created_at: string;
  updated_at: string;
  subtasks: Subtask[];
}

export interface Goal {
  id: string;
  entrepreneurship_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: string;
  entrepreneurship_id: string;
  amount: number;
  description: string | null;
  income_date: string;
  income_type: string;
  currency: Currency;
  exchange_rate: number;
  customer_id?: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  entrepreneurship_id: string;
  amount: number;
  currency: Currency;
  exchange_rate: number;
  category: string;
  expense_kind: 'cogs' | 'opex';
  vendor: string | null;
  description: string | null;
  expense_date: string;
  recurring: boolean;
  created_at: string;
}

export type CustomerStatus = 'lead' | 'contacted' | 'demo' | 'trial' | 'paying' | 'churned';

export interface Customer {
  id: string;
  entrepreneurship_id: string;
  name: string;
  email: string | null;
  segment: string | null;
  status: CustomerStatus;
  plan: string | null;
  mrr: number;
  currency: Currency;
  source: string | null;
  started_at: string | null;
  churned_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Metric {
  id: string;
  entrepreneurship_id: string;
  metric_key: string;
  value: number;
  unit: string;
  period_date: string;
  source: 'manual' | 'derived' | 'import';
  notes: string | null;
  created_at: string;
}

export type ExperimentStatus = 'planned' | 'running' | 'done' | 'discarded';

export interface Experiment {
  id: string;
  entrepreneurship_id: string;
  hypothesis: string;
  channel: string | null;
  status: ExperimentStatus;
  start_date: string | null;
  end_date: string | null;
  cost: number;
  currency: Currency;
  result: string | null;
  learning: string | null;
  created_at: string;
}

export interface Milestone {
  id: string;
  entrepreneurship_id: string;
  template_key: string | null;
  title: string;
  stage: Stage;
  kind: 'exit' | 'milestone' | 'product';
  target_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface Review {
  id: string;
  entrepreneurship_id: string;
  week_start: string;
  wins: string | null;
  blockers: string | null;
  next_focus: string | null;
  confidence: number | null;
  mrr_snapshot: number | null;
  users_snapshot: number | null;
  created_at: string;
}

export interface FocusEntry {
  date: string;
  minutes: number;
}

export interface VentureData {
  venture: Venture;
  tasks: EntrepreneurshipTask[];
  goals: Goal[];
  income: Income[];
  expenses: Expense[];
  customers: Customer[];
  metrics: Metric[];
  experiments: Experiment[];
  milestones: Milestone[];
  reviews: Review[];
  focus: FocusEntry[];
}

export interface MonthlyPoint {
  key: string;
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface CategorySlice {
  key: string;
  label: string;
  value: number;
  [key: string]: string | number;
}

export interface FunnelStep {
  key: CustomerStatus | 'all';
  label: string;
  count: number;
  conversion: number;
}

export interface WeekPoint {
  key: string;
  label: string;
  created: number;
  completed: number;
}

export interface VentureKpis {
  mrr: number;
  mrrDelta: number;
  revenueMonth: number;
  revenuePrevMonth: number;
  revenueTotal: number;
  expensesMonth: number;
  profitMonth: number;
  profitMargin: number;
  grossMargin: number;
  burnRate: number;
  netBurn: number;
  runwayMonths: number | null;
  cashBalance: number;
  payingCustomers: number;
  totalCustomers: number;
  newCustomersMonth: number;
  churnRate: number;
  arpu: number;
  ltv: number;
  cac: number;
  growthMoM: number;
  focusHoursWeek: number;
  focusHoursMonth: number;
  healthScore: number;
  stageProgress: number;
  openTasks: number;
  overdueTasks: number;
  completedTasks: number;
  totalTasks: number;
}

export interface HealthBreakdown {
  finance: number;
  product: number;
  market: number;
  execution: number;
}

export interface StageProgressItem {
  key: string;
  label: string;
  done: boolean;
}

export interface StageProgress {
  done: number;
  total: number;
  percent: number;
  items: StageProgressItem[];
}

export interface NorthStar {
  key: string;
  label: string;
  value: number;
  target: number | null;
  unit: string;
  percent: number;
}

export interface VentureAnalytics {
  kpis: VentureKpis;
  monthly: MonthlyPoint[];
  expensesByCategory: CategorySlice[];
  funnel: FunnelStep[];
  weeklyThroughput: WeekPoint[];
  focusByDay: Record<string, number>;
  healthBreakdown: HealthBreakdown;
  stageProgress: StageProgress;
  northStar: NorthStar;
  alerts: string[];
}

export interface NextAction {
  id: string;
  title: string;
  description: string;
  tone: 'danger' | 'warning' | 'info' | 'success';
  tab: string;
  cta: string;
}