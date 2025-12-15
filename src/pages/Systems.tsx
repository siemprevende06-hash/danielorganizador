import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  LayoutGrid, 
  Clock, 
  Sun, 
  Moon, 
  Coffee, 
  Bed,
  Languages,
  Dumbbell,
  GraduationCap,
  Briefcase,
  Target,
  Heart,
  Music,
  Wallet,
  BookOpen,
  Brain,
  Sparkles,
  ChevronRight,
  Settings2,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LifeSystem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  components: SystemComponent[];
  links: { label: string; path: string }[];
}

interface SystemComponent {
  id: string;
  name: string;
  description: string;
  status?: "active" | "building" | "paused";
}

const LIFE_SYSTEMS: LifeSystem[] = [
  {
    id: "estructura",
    name: "Sistema de Estructura",
    description: "Bloques de tiempo y rutinas que organizan tu día",
    icon: LayoutGrid,
    color: "text-blue-500",
    bgColor: "from-blue-500/20 to-cyan-500/20",
    components: [
      { id: "bloques", name: "Bloques de Tiempo", description: "Distribución del día en bloques productivos", status: "active" },
      { id: "activacion", name: "Rutina de Activación", description: "Despertar y preparación para el día", status: "active" },
      { id: "desactivacion", name: "Rutina de Desactivación", description: "Preparación para el descanso", status: "active" },
      { id: "alistamiento", name: "Alistamiento y Desayuno", description: "Preparación personal y nutrición matutina", status: "active" },
      { id: "sueno", name: "Horario de Sueño", description: "7-8 horas de descanso reparador", status: "active" },
    ],
    links: [
      { label: "Rutina del Día", path: "/routine" },
      { label: "Modos de Rendimiento", path: "/performance-modes" },
      { label: "Rutina Activación", path: "/activation-routine" },
      { label: "Rutina Desactivación", path: "/deactivation-routine" },
    ],
  },
  {
    id: "idiomas",
    name: "Sistema de Idiomas",
    description: "Aprendizaje y práctica de idiomas extranjeros",
    icon: Languages,
    color: "text-green-500",
    bgColor: "from-green-500/20 to-emerald-500/20",
    components: [
      { id: "ingles", name: "Inglés", description: "Fluidez y vocabulario avanzado", status: "active" },
      { id: "duolingo", name: "Duolingo", description: "Práctica diaria gamificada", status: "active" },
      { id: "vocabulario", name: "Vocabulario", description: "Expansión de léxico", status: "building" },
      { id: "listening", name: "Listening", description: "Podcasts y contenido en inglés", status: "active" },
    ],
    links: [
      { label: "Bloque de Idiomas", path: "/focus" },
    ],
  },
  {
    id: "gym",
    name: "Sistema Gym",
    description: "Entrenamiento físico y salud corporal",
    icon: Dumbbell,
    color: "text-orange-500",
    bgColor: "from-orange-500/20 to-red-500/20",
    components: [
      { id: "entrenamiento", name: "Entrenamiento", description: "Rutinas de fuerza y resistencia", status: "active" },
      { id: "cardio", name: "Cardio", description: "Salud cardiovascular", status: "building" },
      { id: "nutricion", name: "Nutrición", description: "Alimentación para rendimiento", status: "building" },
      { id: "descanso", name: "Descanso Muscular", description: "Recuperación y estiramientos", status: "active" },
    ],
    links: [
      { label: "Hábitos", path: "/habits" },
    ],
  },
  {
    id: "universidad",
    name: "Sistema Universidad",
    description: "Estudios universitarios y desarrollo académico",
    icon: GraduationCap,
    color: "text-purple-500",
    bgColor: "from-purple-500/20 to-pink-500/20",
    components: [
      { id: "clases", name: "Clases", description: "Asistencia y participación", status: "active" },
      { id: "estudio", name: "Sesiones de Estudio", description: "Deep work académico", status: "active" },
      { id: "tareas", name: "Tareas y Proyectos", description: "Entregables y trabajos", status: "active" },
      { id: "examenes", name: "Exámenes", description: "Preparación y evaluaciones", status: "active" },
    ],
    links: [
      { label: "Universidad", path: "/university" },
      { label: "Tareas", path: "/tasks" },
    ],
  },
  {
    id: "emprendimiento",
    name: "Sistema Emprendimiento",
    description: "Proyectos de negocio y desarrollo profesional",
    icon: Briefcase,
    color: "text-amber-500",
    bgColor: "from-amber-500/20 to-yellow-500/20",
    components: [
      { id: "proyectos", name: "Proyectos", description: "Iniciativas de negocio activas", status: "active" },
      { id: "focus", name: "Focus Emprendimiento", description: "Bloque diario dedicado", status: "active" },
      { id: "networking", name: "Networking", description: "Conexiones y colaboraciones", status: "building" },
      { id: "aprendizaje", name: "Aprendizaje", description: "Habilidades de negocio", status: "active" },
    ],
    links: [
      { label: "Emprendimientos", path: "/entrepreneurship" },
      { label: "Proyectos", path: "/projects" },
    ],
  },
  {
    id: "metas",
    name: "Sistema de Metas",
    description: "Objetivos a corto, mediano y largo plazo",
    icon: Target,
    color: "text-red-500",
    bgColor: "from-red-500/20 to-rose-500/20",
    components: [
      { id: "vision", name: "Tablero de Visión", description: "Visualización de metas", status: "active" },
      { id: "trimestrales", name: "Metas Trimestrales", description: "Objetivos de 90 días", status: "active" },
      { id: "mensuales", name: "Metas Mensuales", description: "Hitos mensuales", status: "active" },
      { id: "seguimiento", name: "Seguimiento", description: "Progreso y revisiones", status: "building" },
    ],
    links: [
      { label: "Metas", path: "/goals" },
    ],
  },
  {
    id: "bienestar",
    name: "Sistema de Bienestar",
    description: "Salud mental, autocuidado y equilibrio",
    icon: Heart,
    color: "text-pink-500",
    bgColor: "from-pink-500/20 to-rose-500/20",
    components: [
      { id: "skincare", name: "Skincare", description: "Cuidado de la piel", status: "active" },
      { id: "meditacion", name: "Meditación", description: "Mindfulness y calma", status: "building" },
      { id: "journaling", name: "Journaling", description: "Reflexión y gratitud", status: "active" },
      { id: "descanso", name: "Recuperación", description: "Días de descanso activo", status: "active" },
    ],
    links: [
      { label: "Journaling", path: "/journaling" },
      { label: "Hábitos", path: "/habits" },
    ],
  },
  {
    id: "creatividad",
    name: "Sistema Creativo",
    description: "Expresión artística y hobbies",
    icon: Music,
    color: "text-indigo-500",
    bgColor: "from-indigo-500/20 to-violet-500/20",
    components: [
      { id: "guitarra", name: "Guitarra", description: "Práctica de instrumento", status: "active" },
      { id: "piano", name: "Piano", description: "Aprendizaje musical", status: "building" },
      { id: "gaming", name: "Gaming", description: "Entretenimiento y desconexión", status: "active" },
      { id: "lectura", name: "Lectura", description: "Libros y conocimiento", status: "active" },
    ],
    links: [
      { label: "Herramientas", path: "/tools" },
    ],
  },
  {
    id: "finanzas",
    name: "Sistema Financiero",
    description: "Gestión de dinero y recursos",
    icon: Wallet,
    color: "text-emerald-500",
    bgColor: "from-emerald-500/20 to-teal-500/20",
    components: [
      { id: "ingresos", name: "Ingresos", description: "Fuentes de dinero", status: "active" },
      { id: "gastos", name: "Gastos", description: "Control de egresos", status: "active" },
      { id: "ahorro", name: "Ahorro", description: "Reservas y metas", status: "building" },
      { id: "inversiones", name: "Inversiones", description: "Crecimiento de capital", status: "paused" },
    ],
    links: [
      { label: "Finanzas", path: "/finance" },
    ],
  },
];

const getStatusColor = (status?: string) => {
  switch (status) {
    case "active":
      return "bg-green-500/20 text-green-500 border-green-500/30";
    case "building":
      return "bg-amber-500/20 text-amber-500 border-amber-500/30";
    case "paused":
      return "bg-gray-500/20 text-gray-500 border-gray-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusLabel = (status?: string) => {
  switch (status) {
    case "active":
      return "Activo";
    case "building":
      return "En desarrollo";
    case "paused":
      return "Pausado";
    default:
      return "";
  }
};

export default function Systems() {
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);

  const activeComponentsCount = (system: LifeSystem) => 
    system.components.filter(c => c.status === "active").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Sistemas de Vida
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cada área de tu vida funciona como un sistema interconectado. Aquí puedes ver y gestionar todos tus sistemas.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{LIFE_SYSTEMS.length}</p>
            <p className="text-sm text-muted-foreground">Sistemas</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-green-500">
              {LIFE_SYSTEMS.reduce((acc, s) => acc + s.components.filter(c => c.status === "active").length, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Componentes Activos</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-500">
              {LIFE_SYSTEMS.reduce((acc, s) => acc + s.components.filter(c => c.status === "building").length, 0)}
            </p>
            <p className="text-sm text-muted-foreground">En Desarrollo</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-muted-foreground">
              {LIFE_SYSTEMS.reduce((acc, s) => acc + s.components.length, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Componentes</p>
          </Card>
        </div>

        {/* Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LIFE_SYSTEMS.map((system) => {
            const Icon = system.icon;
            const isExpanded = expandedSystem === system.id;
            const activeCount = activeComponentsCount(system);
            const progress = (activeCount / system.components.length) * 100;

            return (
              <Card
                key={system.id}
                className={cn(
                  "relative overflow-hidden transition-all duration-300 cursor-pointer",
                  isExpanded ? "md:col-span-2 lg:col-span-2" : "",
                  "hover:shadow-lg"
                )}
                onClick={() => setExpandedSystem(isExpanded ? null : system.id)}
              >
                {/* Gradient Background */}
                <div
                  className={cn(
                    "absolute inset-0 opacity-30 bg-gradient-to-br",
                    system.bgColor
                  )}
                />

                <div className="relative p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-3 rounded-xl bg-background/80", system.color)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{system.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {activeCount}/{system.components.length} activos
                        </p>
                      </div>
                    </div>
                    <ChevronRight 
                      className={cn(
                        "h-5 w-5 text-muted-foreground transition-transform",
                        isExpanded && "rotate-90"
                      )} 
                    />
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm">{system.description}</p>

                  {/* Progress */}
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="space-y-4 pt-4 border-t">
                      {/* Components */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                          Componentes
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {system.components.map((component) => (
                            <div
                              key={component.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-background/50 border"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">{component.name}</p>
                                <p className="text-xs text-muted-foreground">{component.description}</p>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn("ml-2 text-xs", getStatusColor(component.status))}
                              >
                                {getStatusLabel(component.status)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Links */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {system.links.map((link) => (
                          <Link key={link.path} to={link.path} onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="sm">
                              {link.label}
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Filosofía de Sistemas</h3>
              <p className="text-muted-foreground">
                Cada sistema de tu vida está diseñado para funcionar de manera autónoma pero interconectada. 
                Al optimizar cada sistema individual, el resultado es una vida equilibrada y productiva. 
                Haz clic en cualquier sistema para ver sus componentes y acceder a las herramientas relacionadas.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
