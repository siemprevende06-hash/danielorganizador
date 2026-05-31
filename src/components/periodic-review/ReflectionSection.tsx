import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Lightbulb, AlertTriangle, ArrowRight } from 'lucide-react';

interface ReflectionSectionProps {
  wins: string;
  struggles: string;
  lessonsLearned: string;
  nextPeriodFocus: string;
  onUpdate: (field: 'wins' | 'struggles' | 'lessons_learned' | 'next_period_focus', value: string) => void;
  periodLabel: string;
}

export function ReflectionSection({
  wins, struggles, lessonsLearned, nextPeriodFocus, onUpdate, periodLabel
}: ReflectionSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-5 w-5 text-primary" />
          Reflexión {periodLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-green-500" />
            Victorias y logros
          </label>
          <Textarea
            value={wins}
            onChange={e => onUpdate('wins', e.target.value)}
            placeholder="¿Qué salió bien? ¿Qué logros concretos tuve?"
            rows={3}
            className="text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
            Dificultades y obstáculos
          </label>
          <Textarea
            value={struggles}
            onChange={e => onUpdate('struggles', e.target.value)}
            placeholder="¿Qué fue difícil? ¿Dónde perdí constancia?"
            rows={3}
            className="text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
            Lecciones aprendidas
          </label>
          <Textarea
            value={lessonsLearned}
            onChange={e => onUpdate('lessons_learned', e.target.value)}
            placeholder="¿Qué aprendí sobre mí mismo? ¿Qué cambiaría?"
            rows={3}
            className="text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
            Foco del próximo período
          </label>
          <Textarea
            value={nextPeriodFocus}
            onChange={e => onUpdate('next_period_focus', e.target.value)}
            placeholder="¿En qué me voy a enfocar? ¿Qué voy a mejorar?"
            rows={3}
            className="text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
