import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { BookOpen, Briefcase, FolderKanban, CheckSquare, Clock, TrendingUp, Target, Zap } from "lucide-react";

const weeklyTrendData = [
  { day: "Lun", hours: 2.5 },
  { day: "Mar", hours: 3.0 },
  { day: "Mié", hours: 1.5 },
  { day: "Jue", hours: 4.0 },
  { day: "Vie", hours: 3.5 },
  { day: "Sáb", hours: 2.0 },
  { day: "Dom", hours: 1.0 },
];

const chartConfig = {
  hours: {
    label: "Horas",
    color: "hsl(var(--primary))",
  },
};

function UniversityCard() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">Universidad</CardTitle>
        <BookOpen className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Materia del día</p>
          <p className="text-xl font-bold">Álgebra Lineal</p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">12.5</span>
          <span className="text-sm text-muted-foreground">hrs estudiadas</span>
        </div>
        <div className="h-[80px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={weeklyTrendData}>
              <defs>
                <linearGradient id="uniGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={10} />
              <YAxis hide domain={[0, 6]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="hsl(var(--primary))"
                fill="url(#uniGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>
        <div className="flex items-center gap-1 text-xs text-green-500">
          <TrendingUp className="h-3 w-3" />
          <span>+12% vs semana pasada</span>
        </div>
      </CardContent>
    </Card>
  );
}

function EntrepreneurshipCard() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">Emprendimiento</CardTitle>
        <Briefcase className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">18</span>
          <span className="text-sm text-muted-foreground">hrs dedicadas</span>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Tareas completadas</span>
            <span className="font-medium">12/15</span>
          </div>
          <Progress value={80} className="h-2" />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            <span>Meta: 20hrs</span>
          </div>
          <div className="flex items-center gap-1 text-green-500">
            <TrendingUp className="h-3 w-3" />
            <span>80%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectsCard() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">Proyectos</CardTitle>
        <FolderKanban className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">5</span>
          <span className="text-sm text-muted-foreground">activos</span>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progreso general</span>
            <span className="font-medium">64%</span>
          </div>
          <Progress value={64} className="h-2" />
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="h-3 w-3" />
          <span>3 proyectos en esta semana</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TasksCard() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">Tareas</CardTitle>
        <CheckSquare className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="text-2xl font-bold">8</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completadas hoy</p>
            <p className="text-2xl font-bold text-green-500">6</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vencidas</p>
            <p className="text-2xl font-bold text-red-500">3</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Alta prioridad</p>
            <p className="text-2xl font-bold text-yellow-500">4</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Completadas esta semana</span>
            <span className="font-medium">18/30</span>
          </div>
          <Progress value={60} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickStatsGrid() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UniversityCard />
        <EntrepreneurshipCard />
        <ProjectsCard />
      </div>
      <TasksCard />
    </div>
  );
}
