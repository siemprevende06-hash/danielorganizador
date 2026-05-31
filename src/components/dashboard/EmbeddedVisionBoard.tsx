import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Heart, Briefcase, Trophy } from "lucide-react";

export default function EmbeddedVisionBoard() {
  const visionGoals = [
    {
      icon: Trophy,
      title: "Excelencia Académica",
      description: "Graduarse con honores",
      color: "text-yellow-500",
    },
    {
      icon: Briefcase,
      title: "Carrera Profesional",
      description: "Construir proyectos impactantes",
      color: "text-primary",
    },
    {
      icon: Heart,
      title: "Bienestar Integral",
      description: "Cuerpo fuerte, mente clara",
      color: "text-success",
    },
    {
      icon: Eye,
      title: "Versión Superior",
      description: "Disciplina inquebrantable",
      color: "text-purple-500",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tablero de Visión</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {visionGoals.map((goal) => {
            const Icon = goal.icon;
            return (
              <div
                key={goal.title}
                className="p-4 rounded-lg border bg-gradient-to-br from-background to-muted hover:shadow-md transition-all cursor-pointer"
              >
                <Icon className={`h-8 w-8 mb-3 ${goal.color}`} />
                <h4 className="font-semibold text-sm mb-1">{goal.title}</h4>
                <p className="text-xs text-muted-foreground">{goal.description}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
