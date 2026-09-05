import {
  Heart,
  Brain,
  Briefcase,
  Dumbbell,
  Book,
  Music,
  Gamepad2,
  Code,
  Palette,
  Users,
  Home,
  Repeat,
  Zap,
  Sparkles,
  Moon,
  GraduationCap,
  Target,
  Wallet as WalletIcon,
  CreditCard,
  Banknote,
  PiggyBank,
  ShoppingCart,
  Coffee,
  Utensils,
  Car,
  Plane,
  Heart as HeartIcon,
  Shirt,
  Droplet,
  Shield,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import type { LifeArea, Habit, Wallet, TransactionCategory, RoutineTaskGroup, QuarterlyGoal, DistributionBag } from "./definitions";

// Life Areas — alineadas con el Plan Identidad (no más "Profesional")
export const lifeAreas: LifeArea[] = [
  { id: "universidad", name: "Universidad", description: "Académico", icon: GraduationCap },
  { id: "emprendimiento", name: "Emprendimiento", description: "Negocios", icon: Briefcase },
  { id: "proyectos", name: "Proyectos", description: "Proyectos personales", icon: Code },
  { id: "gym", name: "Gym", description: "Entrenamiento", icon: Dumbbell },
  { id: "idiomas", name: "Idiomas", description: "Aprendizaje", icon: Brain },
  { id: "ajedrez", name: "Ajedrez", description: "Estrategia", icon: Gamepad2 },
  { id: "lectura", name: "Lectura", description: "Libros", icon: Book },
  { id: "piano", name: "Piano", description: "Música", icon: Music },
  { id: "guitarra", name: "Guitarra", description: "Música", icon: Music },
  { id: "apariencia", name: "Apariencia", description: "Cuidado personal", icon: Shirt },
  { id: "finanzas", name: "Finanzas", description: "Gestión financiera", icon: WalletIcon },
  {
    id: "mental",
    name: "Mental",
    description: "Salud mental y hábitos",
    icon: Brain,
    subAreas: [
      { id: "rutina-activacion", name: "Rutina Activación", description: "", icon: Repeat },
      { id: "rutina-desactivacion", name: "Rutina Desactivación", description: "", icon: Moon },
      { id: "no-fap", name: "No Fap", description: "", icon: Zap },
      { id: "ducha-fria", name: "Ducha Fría", description: "", icon: Droplet },
      { id: "planificacion", name: "Planificación", description: "", icon: Target },
    ],
  },
];

export const centralAreas: LifeArea[] = [
  {
    id: "salud",
    name: "Salud",
    description: "Bienestar físico",
    icon: Heart,
    subAreas: [
      { id: "entrenamiento", name: "Entrenamiento", description: "", icon: Dumbbell },
      { id: "sueño", name: "Sueño", description: "", icon: Moon },
    ],
  },
];

export const socialAreas: LifeArea[] = [
  { id: "familia", name: "Familia", description: "", icon: Home },
  { id: "amigos", name: "Amigos", description: "", icon: Users },
  { id: "pareja", name: "Pareja", description: "", icon: HeartIcon },
];

// Habits
export const habits: Habit[] = [
  { id: "habit-entrenamiento", title: "Entrenamiento", areaId: "entrenamiento", icon: Dumbbell },
  { id: "habit-universidad", title: "Universidad", areaId: "universidad", icon: GraduationCap },
  { id: "habit-proyectos-personales", title: "Proyectos Personales", areaId: "proyectos-personales", icon: Code },
  { id: "habit-musica", title: "Música", areaId: "musica", icon: Music },
  { id: "habit-videojuegos", title: "Videojuegos", areaId: "videojuegos", icon: Gamepad2 },
  { id: "habit-lectura", title: "Lectura", areaId: "lectura", icon: Book },
  { id: "habit-sueño", title: "Sueño", areaId: "sueño", icon: Moon },
  { id: "habit-rutina-activacion", title: "Rutina Activación", areaId: "rutina-activacion", icon: Zap },
  { id: "habit-rutina-desactivacion", title: "Rutina Desactivación", areaId: "rutina-desactivacion", icon: Moon },
  { id: "habit-no-fap", title: "No Fap", areaId: "no-fap", icon: Target },
  { id: "habit-no-videojuegos", title: "No Videojuegos", areaId: "no-videojuegos", icon: Target },
  { id: "habit-redes-sociales", title: "Redes Sociales", areaId: "redes-sociales", icon: Sparkles },
  { id: "habit-ducha-fria", title: "Ducha Fría", areaId: "ducha-fria", icon: Droplet },
  { id: "habit-planificacion", title: "Planificación", areaId: "planificacion", icon: Target },
  { id: "habit-autocritica", title: "Autocrítica", areaId: "autocritica", icon: Brain },
  { id: "habit-cuidado-personal", title: "Cuidado Personal", areaId: "cuidado-personal", icon: Shirt },
  { id: "habit-skincare", title: "Skincare", areaId: "skincare", icon: Sparkles },
];

// Wallets
export const wallets: Wallet[] = [
  { id: "wallet-efectivo-cup", name: "Efectivo CUP", balance: 0, currency: 'CUP', icon: Banknote },
  { id: "wallet-efectivo-usd", name: "Efectivo USD", balance: 0, currency: 'USD', icon: Banknote },
  { id: "wallet-banco", name: "Banco", balance: 0, currency: 'CUP', icon: CreditCard },
  { id: "wallet-ahorros", name: "Ahorros", balance: 0, currency: 'CUP', icon: PiggyBank },
  { id: "wallet-inversion", name: "Inversión", balance: 0, currency: 'CUP', icon: Target },
  { id: "wallet-digital-1", name: "Digital 1", balance: 0, currency: 'CUP', icon: WalletIcon },
  { id: "wallet-digital-2", name: "Digital 2", balance: 0, currency: 'CUP', icon: WalletIcon },
];

// Distribution Bags
export const defaultDistributionBags: DistributionBag[] = [
  { id: "bag-emergency", name: "Fondo de Emergencia", description: "Protección ante imprevistos (3-6 meses de gastos)", percentage: 10, icon: "Shield", color: "rose" },
  { id: "bag-investment", name: "Inversión", description: "Libertad financiera, ingresos pasivos", percentage: 10, icon: "TrendingUp", color: "blue" },
  { id: "bag-essentials", name: "Gastos Esenciales", description: "Vivienda, comida, transporte, servicios", percentage: 50, icon: "Home", color: "amber" },
  { id: "bag-leisure", name: "Ocio", description: "Disfrute sin culpa: hobbies, viajes, salidas", percentage: 10, icon: "Gamepad2", color: "green" },
  { id: "bag-education", name: "Educación", description: "Libros, cursos, desarrollo personal", percentage: 10, icon: "BookOpen", color: "violet" },
  { id: "bag-goals", name: "Metas", description: "Grandes compras, proyectos futuros", percentage: 10, icon: "Target", color: "orange" },
];

// Transaction Categories
export const transactionCategories: TransactionCategory[] = [
  { id: "cat-income-1", name: "Salario/Ingreso Principal", type: "income", icon: Briefcase },
  { id: "cat-income-2", name: "Freelance/Trabajo Extra", type: "income", icon: Code },
  { id: "cat-income-3", name: "Inversiones", type: "income", icon: Target },
  { id: "cat-food", name: "Comida", type: "expense", icon: Utensils },
  { id: "cat-transport", name: "Transporte", type: "expense", icon: Car },
  { id: "cat-entertainment", name: "Entretenimiento", type: "expense", icon: Gamepad2 },
  { id: "cat-health", name: "Salud", type: "expense", icon: Heart },
  { id: "cat-shopping", name: "Compras", type: "expense", icon: ShoppingCart },
  { id: "cat-education", name: "Educación", type: "expense", icon: GraduationCap },
  { id: "cat-personal", name: "Cuidado Personal", type: "expense", icon: Shirt },
  { id: "cat-coffee", name: "Café", type: "expense", icon: Coffee },
  { id: "cat-travel", name: "Viajes", type: "expense", icon: Plane },
  { id: "cat-transfer", name: "Traspaso", type: "expense", icon: WalletIcon },
  { id: "cat-loan", name: "Préstamo", type: "expense", icon: Banknote },
];

// Routine
export const focusedDayRoutine: RoutineTaskGroup[] = [
  // ACTIVACIÓN MATINAL (5:00 AM - 9:00 AM)
  {
    id: "wake-up",
    title: "Despertar",
    startTime: "05:00 AM",
    endTime: "05:30 AM",
    tasks: ["Despertar sin alarma", "Hidratación"],
  },
  {
    id: "morning-routine",
    title: "Rutina Matinal",
    startTime: "05:30 AM",
    endTime: "06:30 AM",
    tasks: ["Ducha fría", "Cuidado personal", "Vestirse"],
  },
  {
    id: "breakfast",
    title: "Desayuno",
    startTime: "06:30 AM",
    endTime: "07:00 AM",
    tasks: ["Desayuno saludable"],
  },
  {
    id: "planning",
    title: "Planificación",
    startTime: "07:00 AM",
    endTime: "07:30 AM",
    tasks: ["Planificación del día", "Revisión de objetivos"],
  },
  {
    id: "morning-study",
    title: "Estudio/Lectura Matinal",
    startTime: "07:30 AM",
    endTime: "09:00 AM",
    tasks: ["Lectura", "Estudio"],
  },

  // TRABAJO PROFUNDO - MAÑANA (9:00 AM - 1:00 PM)
  {
    id: "deep-work-block-1",
    title: "Trabajo Profundo - Bloque 1",
    startTime: "09:00 AM",
    endTime: "10:30 AM",
    tasks: ["Tarea más importante"],
    isFocusBlock: true,
  },
  {
    id: "break-1",
    title: "Descanso Corto",
    startTime: "10:30 AM",
    endTime: "10:45 AM",
    tasks: ["Descanso", "Estiramiento"],
  },
  {
    id: "deep-work-block-2",
    title: "Trabajo Profundo - Bloque 2",
    startTime: "10:45 AM",
    endTime: "12:15 PM",
    tasks: ["Proyecto importante"],
    isFocusBlock: true,
  },
  {
    id: "break-2",
    title: "Descanso Corto",
    startTime: "12:15 PM",
    endTime: "12:30 PM",
    tasks: ["Descanso", "Preparar almuerzo"],
  },
  {
    id: "light-work",
    title: "Trabajo Ligero",
    startTime: "12:30 PM",
    endTime: "01:00 PM",
    tasks: ["Emails", "Tareas administrativas"],
  },

  // DESCANSO Y ALMUERZO (1:00 PM - 2:30 PM)
  {
    id: "lunch",
    title: "Almuerzo",
    startTime: "01:00 PM",
    endTime: "01:45 PM",
    tasks: ["Almuerzo", "Socialización"],
  },
  {
    id: "rest",
    title: "Descanso Mental",
    startTime: "01:45 PM",
    endTime: "02:30 PM",
    tasks: ["Descanso", "Siesta opcional"],
  },

  // TRABAJO PROFUNDO - TARDE (2:30 PM - 6:00 PM)
  {
    id: "deep-work-block-3",
    title: "Trabajo Profundo - Bloque 3",
    startTime: "02:30 PM",
    endTime: "04:00 PM",
    tasks: ["Proyectos creativos"],
    isFocusBlock: true,
  },
  {
    id: "break-3",
    title: "Descanso Corto",
    startTime: "04:00 PM",
    endTime: "04:15 PM",
    tasks: ["Descanso", "Snack"],
  },
  {
    id: "deep-work-block-4",
    title: "Trabajo Profundo - Bloque 4",
    startTime: "04:15 PM",
    endTime: "05:45 PM",
    tasks: ["Finalizar tareas del día"],
    isFocusBlock: true,
  },
  {
    id: "review",
    title: "Revisión del Día",
    startTime: "05:45 PM",
    endTime: "06:00 PM",
    tasks: ["Revisión", "Planificación para mañana"],
  },

  // RUTINA VESPERTINA (6:00 PM - 9:00 PM)
  {
    id: "exercise",
    title: "Ejercicio",
    startTime: "06:00 PM",
    endTime: "07:00 PM",
    tasks: ["Entrenamiento", "Actividad física"],
  },
  {
    id: "shower-evening",
    title: "Ducha",
    startTime: "07:00 PM",
    endTime: "07:30 PM",
    tasks: ["Ducha", "Cuidado personal"],
  },
  {
    id: "dinner",
    title: "Cena",
    startTime: "07:30 PM",
    endTime: "08:15 PM",
    tasks: ["Cena", "Tiempo en familia"],
  },
  {
    id: "free-time",
    title: "Tiempo Libre",
    startTime: "08:15 PM",
    endTime: "09:00 PM",
    tasks: ["Hobbies", "Relajación"],
  },

  // DESACTIVACIÓN NOCTURNA (9:00 PM - 11:00 PM)
  {
    id: "wind-down",
    title: "Desconexión",
    startTime: "09:00 PM",
    endTime: "10:00 PM",
    tasks: ["Lectura", "Música", "Meditación"],
  },
  {
    id: "night-routine",
    title: "Rutina Nocturna",
    startTime: "10:00 PM",
    endTime: "10:30 PM",
    tasks: ["Skincare", "Preparación para dormir"],
  },
  {
    id: "sleep",
    title: "Dormir",
    startTime: "10:30 PM",
    endTime: "05:00 AM",
    tasks: ["Descanso de 8 horas"],
  },
];

// Quarterly Goals
export const quarterlyGoals: QuarterlyGoal[] = [];
