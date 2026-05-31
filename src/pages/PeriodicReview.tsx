import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Calendar } from 'lucide-react';
import { format, addWeeks, subWeeks, addMonths, subMonths, addQuarters, subQuarters } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePeriodicReview, getPeriodRange, type ReviewType } from '@/hooks/usePeriodicReview';
import { ConsistencyOverview } from '@/components/periodic-review/ConsistencyOverview';
import { ObjectivesList } from '@/components/periodic-review/ObjectivesList';
import { ReflectionSection } from '@/components/periodic-review/ReflectionSection';
import { ScoreSummary } from '@/components/periodic-review/ScoreSummary';

function ReviewContent({ type, referenceDate }: { type: ReviewType; referenceDate: Date }) {
  const {
    review, consistency, loading, saving, periodStart, periodEnd,
    saveReview, addObjective, updateObjective, removeObjective,
    updateReflection, setOverallRating
  } = usePeriodicReview(type, referenceDate);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-24 bg-muted rounded-lg" />
        <div className="animate-pulse h-48 bg-muted rounded-lg" />
      </div>
    );
  }

  if (!review) return null;

  const effortScore = review.effort_objectives.length > 0
    ? Math.round(review.effort_objectives.reduce((s, o) => s + o.score, 0) / review.effort_objectives.length)
    : null;
  const resultScore = review.result_objectives.length > 0
    ? Math.round(review.result_objectives.reduce((s, o) => s + o.score, 0) / review.result_objectives.length)
    : null;

  const handleSave = () => {
    saveReview({
      effort_objectives: review.effort_objectives,
      result_objectives: review.result_objectives,
      overall_rating: review.overall_rating,
      wins: review.wins,
      struggles: review.struggles,
      lessons_learned: review.lessons_learned,
      next_period_focus: review.next_period_focus,
    });
  };

  const periodLabel = type === 'weekly' ? 'Semanal' : type === 'monthly' ? 'Mensual' : 'Trimestral';

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <ScoreSummary
        effortScore={effortScore}
        resultScore={resultScore}
        overallRating={review.overall_rating}
        effortCount={review.effort_objectives.length}
        resultCount={review.result_objectives.length}
        onRatingChange={setOverallRating}
      />

      {/* Consistency Overview */}
      <ConsistencyOverview consistency={consistency} />

      {/* Objectives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ObjectivesList
          type="effort"
          objectives={review.effort_objectives}
          onAdd={obj => addObjective('effort', obj)}
          onUpdate={(id, updates) => updateObjective('effort', id, updates)}
          onRemove={id => removeObjective('effort', id)}
        />
        <ObjectivesList
          type="result"
          objectives={review.result_objectives}
          onAdd={obj => addObjective('result', obj)}
          onUpdate={(id, updates) => updateObjective('result', id, updates)}
          onRemove={id => removeObjective('result', id)}
        />
      </div>

      {/* Reflection */}
      <ReflectionSection
        wins={review.wins}
        struggles={review.struggles}
        lessonsLearned={review.lessons_learned}
        nextPeriodFocus={review.next_period_focus}
        onUpdate={updateReflection}
        periodLabel={periodLabel}
      />

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Autocrítica'}
        </Button>
      </div>
    </div>
  );
}

export default function PeriodicReviewPage() {
  const [activeTab, setActiveTab] = useState<ReviewType>('weekly');
  const [weekRef, setWeekRef] = useState(new Date());
  const [monthRef, setMonthRef] = useState(new Date());
  const [quarterRef, setQuarterRef] = useState(new Date());

  const refs: Record<ReviewType, { date: Date; setDate: (d: Date) => void }> = {
    weekly: { date: weekRef, setDate: setWeekRef },
    monthly: { date: monthRef, setDate: setMonthRef },
    quarterly: { date: quarterRef, setDate: setQuarterRef },
  };

  const navigate = (direction: number) => {
    const { date, setDate } = refs[activeTab];
    if (activeTab === 'weekly') setDate(direction > 0 ? addWeeks(date, 1) : subWeeks(date, 1));
    else if (activeTab === 'monthly') setDate(direction > 0 ? addMonths(date, 1) : subMonths(date, 1));
    else setDate(direction > 0 ? addQuarters(date, 1) : subQuarters(date, 1));
  };

  const currentRef = refs[activeTab].date;
  const { start, end } = getPeriodRange(activeTab, currentRef);

  const periodLabel = useMemo(() => {
    if (activeTab === 'weekly') {
      return `${format(start, "d MMM", { locale: es })} — ${format(end, "d MMM yyyy", { locale: es })}`;
    } else if (activeTab === 'monthly') {
      return format(start, "MMMM yyyy", { locale: es });
    } else {
      const q = Math.ceil((start.getMonth() + 1) / 3);
      return `Q${q} ${format(start, "yyyy")} (${format(start, "MMM", { locale: es })} — ${format(end, "MMM", { locale: es })})`;
    }
  }, [activeTab, start, end]);

  return (
    <div className="container mx-auto px-4 py-24 space-y-6 max-w-5xl">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarRange className="h-8 w-8 text-primary" />
          Autocrítica Periódica
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Evalúa tu esfuerzo y resultados por período
        </p>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as ReviewType)}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="weekly" className="gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            Semanal
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Mensual
          </TabsTrigger>
          <TabsTrigger value="quarterly" className="gap-1">
            <CalendarRange className="h-3.5 w-3.5" />
            Trimestral
          </TabsTrigger>
        </TabsList>

        {/* Period navigator */}
        <div className="flex items-center justify-between mt-4 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="font-semibold capitalize">{periodLabel}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}
            disabled={end > new Date()}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Content — same component, different type */}
        <TabsContent value="weekly">
          <ReviewContent type="weekly" referenceDate={weekRef} />
        </TabsContent>
        <TabsContent value="monthly">
          <ReviewContent type="monthly" referenceDate={monthRef} />
        </TabsContent>
        <TabsContent value="quarterly">
          <ReviewContent type="quarterly" referenceDate={quarterRef} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
