import { useGoalHierarchy } from '@/hooks/useGoalHierarchy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Compass, Target, Calendar, CheckCircle2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function GoalAlignment() {
  const { data, loading } = useGoalHierarchy();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24">
        <p className="text-muted-foreground">Cargando jerarquía de metas...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Compass className="h-8 w-8" />
          Conexión Total
        </h1>
        <p className="text-muted-foreground">
          Visualiza cómo tus objetivos trimestrales se conectan con metas mensuales y semanales
        </p>
      </header>

      {data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay objetivos trimestrales definidos</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ve a "Plan 3 Meses" para crear objetivos trimestrales
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {data.map((goal) => (
            <AccordionItem key={goal.id} value={goal.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <Target className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{goal.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{goal.area}</Badge>
                      <Badge variant="secondary">{goal.progress}%</Badge>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <Progress value={goal.progress} className="h-2" />
                
                {goal.monthlyGoals.length > 0 ? (
                  goal.monthlyGoals.map((monthly) => (
                    <Card key={monthly.id} className="border-l-4 border-l-primary/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {monthly.title}
                          {monthly.completed && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Progress value={monthly.progress} className="h-1.5 mb-2" />
                        {monthly.weeklyObjectives.length > 0 && (
                          <div className="space-y-1">
                            {monthly.weeklyObjectives.map((week) => (
                              <div key={week.id} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className={`h-3 w-3 ${week.completed ? 'text-green-500' : 'text-muted-foreground'}`} />
                                <span className={week.completed ? 'line-through text-muted-foreground' : ''}>
                                  Semana {week.weekNumber}: {week.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Sin metas mensuales asociadas</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
