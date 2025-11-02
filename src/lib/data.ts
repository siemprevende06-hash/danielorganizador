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
} from "lucide-react";
import type { LifeArea, Habit, Wallet, TransactionCategory, RoutineTaskGroup, QuarterlyGoal } from "./definitions";

// Life Areas
export const lifeAreas: LifeArea[] = [
  {
    id: "profesional",
    name: "Profesional",
    description: "Carrera y desarrollo profesional",
    icon: Briefcase,
    subAreas: [
      { id: "universidad", name: "Universidad", description: "", icon: GraduationCap },
      { id: "proyectos-personales", name: "Proyectos Personales", description: "", icon: Code },
    ],
  },
  {
    id: "desarrollo-personal",
    name: "Desarrollo Personal",
    description: "Crecimiento y aprendizaje",
    icon: Brain,
    subAreas: [
      {
        id: "hobbies",
        name: "Hobbies",
        description: "",
        icon: Palette,
        subAreas: [
          { id: "musica", name: "Música", description: "", icon: Music },
          { id: "videojuegos", name: "Videojuegos", description: "", icon: Gamepad2 },
          { id: "lectura", name: "Lectura", description: "", icon: Book },
        ],
      },
    ],
  },
  {
    id: "mental",
    name: "Mental",
    description: "Salud mental y hábitos",
    icon: Brain,
    subAreas: [
      { id: "rutina-activacion", name: "Rutina Activación", description: "", icon: Repeat },
      { id: "rutina-desactivacion", name: "Rutina Desactivación", description: "", icon: Moon },
      { id: "no-fap", name: "No Fap", description: "", icon: Zap },
      { id: "no-videojuegos", name: "No Videojuegos", description: "", icon: Sparkles },
      { id: "redes-sociales", name: "Redes Sociales", description: "", icon: Sparkles },
      { id: "ducha-fria", name: "Ducha Fría", description: "", icon: Droplet },
      { id: "planificacion", name: "Planificación", description: "", icon: Target },
      { id: "autocritica", name: "Autocrítica", description: "", icon: Brain },
    ],
  },
  {
    id: "apariencia",
    name: "Apariencia",
    description: "Cuidado personal",
    icon: Shirt,
    subAreas: [
      { id: "cuidado-personal", name: "Cuidado Personal", description: "", icon: Shirt },
      { id: "skincare", name: "Skincare", description: "", icon: Droplet },
    ],
  },
  { id: "finanzas", name: "Finanzas", description: "Gestión financiera", icon: WalletIcon },
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
  { id: "habit-entrenamiento", title: "Entrenamiento", areaId: "entrenamiento" },
  { id: "habit-universidad", title: "Universidad", areaId: "universidad" },
  { id: "habit-proyectos-personales", title: "Proyectos Personales", areaId: "proyectos-personales" },
  { id: "habit-musica", title: "Música", areaId: "musica" },
  { id: "habit-videojuegos", title: "Videojuegos", areaId: "videojuegos" },
  { id: "habit-lectura", title: "Lectura", areaId: "lectura" },
  { id: "habit-sueño", title: "Sueño", areaId: "sueño" },
  { id: "habit-rutina-activacion", title: "Rutina Activación", areaId: "rutina-activacion" },
  { id: "habit-rutina-desactivacion", title: "Rutina Desactivación", areaId: "rutina-desactivacion" },
  { id: "habit-no-fap", title: "No Fap", areaId: "no-fap" },
  { id: "habit-no-videojuegos", title: "No Videojuegos", areaId: "no-videojuegos" },
  { id: "habit-redes-sociales", title: "Redes Sociales", areaId: "redes-sociales" },
  { id: "habit-ducha-fria", title: "Ducha Fría", areaId: "ducha-fria" },
  { id: "habit-planificacion", title: "Planificación", areaId: "planificacion" },
  { id: "habit-autocritica", title: "Autocrítica", areaId: "autocritica" },
  { id: "habit-cuidado-personal", title: "Cuidado Personal", areaId: "cuidado-personal" },
  { id: "habit-skincare", title: "Skincare", areaId: "skincare" },
];

// Wallets
export const wallets: Wallet[] = [
  { id: "wallet-efectivo-cup", name: "Efectivo CUP", balance: 0, icon: Banknote },
  { id: "wallet-efectivo-usd", name: "Efectivo USD", balance: 0, icon: Banknote },
  { id: "wallet-banco", name: "Banco", balance: 0, icon: CreditCard },
  { id: "wallet-ahorros", name: "Ahorros", balance: 0, icon: PiggyBank },
  { id: "wallet-inversion", name: "Inversión", balance: 0, icon: Target },
  { id: "wallet-digital-1", name: "Digital 1", balance: 0, icon: WalletIcon },
  { id: "wallet-digital-2", name: "Digital 2", balance: 0, icon: WalletIcon },
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
  {
    id: "morning-activation",
    title: "Activación Matinal",
    startTime: "06:00 AM",
    endTime: "07:00 AM",
    tasks: [
      "Despertar sin alarma",
      "Ducha fría",
      "Desayuno saludable",
      "Planificación del día",
    ],
  },
  {
    id: "deep-work-1",
    title: "Trabajo Profundo - Sesión 1",
    startTime: "09:00 AM",
    endTime: "12:00 PM",
    tasks: ["Tarea más importante del día"],
    isFocusBlock: true,
  },
  {
    id: "lunch-break",
    title: "Descanso y Almuerzo",
    startTime: "13:00 PM",
    endTime: "14:00 PM",
    tasks: ["Almuerzo", "Descanso mental"],
  },
  {
    id: "deep-work-2",
    title: "Trabajo Profundo - Sesión 2",
    startTime: "15:00 PM",
    endTime: "17:00 PM",
    tasks: ["Proyectos importantes"],
    isFocusBlock: true,
  },
  {
    id: "evening-routine",
    title: "Rutina Vespertina",
    startTime: "19:00 PM",
    endTime: "20:00 PM",
    tasks: ["Ejercicio", "Cena", "Tiempo personal"],
  },
  {
    id: "night-deactivation",
    title: "Desactivación Nocturna",
    startTime: "22:00 PM",
    endTime: "23:00 PM",
    tasks: ["Lectura", "Reflexión del día", "Preparación para dormir"],
  },
];

// Quarterly Goals
export const quarterlyGoals: QuarterlyGoal[] = [];
