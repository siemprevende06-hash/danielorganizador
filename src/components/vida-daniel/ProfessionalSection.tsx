import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, Briefcase, FolderKanban, CheckCircle2, XCircle, Flame } from 'lucide-react';
import type { LifeStats } from '@/pages/VidaDanielEstadisticas';

interface ProfessionalSectionProps {
  stats: LifeStats;
}

const ScoreBar = ({ score }: { score: number }) => (
  <div className="flex items-center gap-2">
    <Progress value={score * 10} className="h-2 flex-1" />
    <span className="text-sm font-medium w-12">{score}/10</span>
  </div>
);

const StatusBadge = ({ completed, streak }: { completed: boolean; streak: number }) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1">
      {completed ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className="text-sm">{completed ? 'Cumplido' : 'Pendiente'}</span>
    </div>
    {streak > 0 && (
      <div className="flex items-center gap-1 text-orange-500">
        <Flame className="h-4 w-4" />
        <span className="text-sm font-medium">{streak} días</span>
      </div>
    )}
  </div>
);

export const ProfessionalSection = ({ stats }: ProfessionalSectionProps) => {
  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-blue-500" />
          Profesional & Académico
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Universidad */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Universidad</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nota General</p>
                <ScoreBar score={stats.university.generalScore} />
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Hoy</p>
                <StatusBadge completed={stats.university.completedToday} streak={stats.university.streak} />
              </div>
              
              <div className="pt-3 border-t space-y-1 text-sm">
                <p>• Exámenes próximos: <span className="font-medium">{stats.university.pendingExams}</span></p>
                <p>• Tareas pendientes: <span className="font-medium">{stats.university.pendingTasks}</span></p>
                <p>• Asignaturas activas: <span className="font-medium">{stats.university.subjects}</span></p>
              </div>
            </div>
          </div>

          {/* Emprendimientos */}
          {stats.entrepreneurship.map((ent, index) => (
            <div key={index} className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold">{ent.name}</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nota General</p>
                  <ScoreBar score={ent.generalScore} />
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Hoy</p>
                  <StatusBadge completed={ent.completedToday} streak={ent.streak} />
                </div>
                
                <div className="pt-3 border-t space-y-1 text-sm">
                  <p>• Tareas completadas: <span className="font-medium">{ent.completedTasks}/{ent.totalTasks}</span></p>
                  <p>• Progreso: <span className="font-medium">{ent.totalTasks > 0 ? Math.round((ent.completedTasks / ent.totalTasks) * 100) : 0}%</span></p>
                </div>
              </div>
            </div>
          ))}

          {/* Proyectos */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <FolderKanban className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">Proyectos Personales</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nota General</p>
                <ScoreBar score={stats.projects.generalScore} />
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Hoy</p>
                <StatusBadge completed={stats.projects.completedToday} streak={stats.projects.streak} />
              </div>
              
              <div className="pt-3 border-t space-y-1 text-sm">
                <p>• Proyectos activos: <span className="font-medium">{stats.projects.active}</span></p>
                <p>• Proyectos completados: <span className="font-medium">{stats.projects.completed}</span></p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
