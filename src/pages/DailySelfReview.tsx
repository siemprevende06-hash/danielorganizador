import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Save, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useDailyReview } from "@/hooks/useDailyReview";
import { DailyStatsOverview } from "@/components/self-review/DailyStatsOverview";
import { BlockRatingList } from "@/components/self-review/BlockRatingList";
import { ReflectionForm } from "@/components/self-review/ReflectionForm";
import { OverallRating } from "@/components/self-review/OverallRating";
import { PillarProgressGrid } from "@/components/pillars/PillarProgressGrid";
import { SecondaryGoalsProgress } from "@/components/pillars/SecondaryGoalsProgress";
import { DailyPillarSummary } from "@/components/pillars/DailyPillarSummary";
import { usePillarProgress } from "@/hooks/usePillarProgress";
import { PurposeVisualization } from "@/components/self-review/PurposeVisualization";
import { WeeklyReviewStats } from "@/components/self-review/WeeklyReviewStats";
import { cn } from "@/lib/utils";

export default function DailySelfReview() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [pillarRatings, setPillarRatings] = useState<{ pillarId: string; rating: number; notes: string }[]>([]);
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const dateStr = selectedDate.toISOString().split('T')[0];
  
  const { pillars, secondaryGoals, overallScore, loading: pillarsLoading } = usePillarProgress(selectedDate);
  
  const { review, systemsTracking, loading, saving, saveReview, updateBlockRating } = useDailyReview(dateStr);

  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const handleSave = () => {
    if (review) {
      saveReview({
        whatWentWell: review.whatWentWell,
        whatCouldBeBetter: review.whatCouldBeBetter,
        tomorrowPlan: review.tomorrowPlan,
        overallRating: review.overallRating
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 pt-20">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse h-12 bg-muted rounded w-1/3" />
          <div className="animate-pulse h-64 bg-muted rounded" />
          <div className="animate-pulse h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 pt-20">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-muted-foreground">No se pudo cargar la autocrítica</p>
        </div>
      </div>
    );
  }

  const isToday = dateStr === new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Autocrítica {viewMode === 'week' ? 'Semanal' : 'Diaria'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {viewMode === 'week' ? 'Estadísticas reales de la semana' : 'Califica tu día honestamente'}
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("day")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                viewMode === "day"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Hoy
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1",
                viewMode === "week"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays className="w-3 h-3" />
              Semana
            </button>
          </div>
        </div>

        {viewMode === "day" && (
          <>
            {/* Date Navigation */}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate(-1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {isToday ? 'Hoy' : format(selectedDate, 'd MMM', { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate(1)}
                disabled={isToday}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Date Display */}
            <div className="text-center py-2">
              <p className="text-lg font-medium text-foreground">
                {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>
          </>
        )}

        {viewMode === "day" ? (
          <>
            {/* Purpose Visualization - Best Version of Yourself */}
            <PurposeVisualization />

            {/* Daily Stats Overview - All stats organized */}
            <DailyStatsOverview
              systemsTracking={systemsTracking}
              blocksCompleted={review.blocksCompleted}
              blocksTotal={review.blocksTotal}
              tasksCompleted={review.tasksCompleted}
              tasksTotal={review.tasksTotal}
              habitsCompleted={review.habitsCompleted}
              habitsTotal={review.habitsTotal}
              focusMinutes={review.focusMinutes}
            />

            {/* Pillar Progress */}
            <Card>
              <CardContent className="pt-6">
                <PillarProgressGrid 
                  pillars={pillars} 
                  overallScore={overallScore} 
                  loading={pillarsLoading}
                />
              </CardContent>
            </Card>

            {/* Secondary Goals */}
            <Card>
              <CardContent className="pt-6">
                <SecondaryGoalsProgress 
                  goals={secondaryGoals} 
                  loading={pillarsLoading}
                />
              </CardContent>
            </Card>

            {/* Pillar Ratings with Notes */}
            <Card>
              <CardContent className="pt-6">
                <DailyPillarSummary
                  pillars={pillars}
                  ratings={pillarRatings}
                  onRatingChange={(pillarId, rating) => {
                    setPillarRatings(prev => {
                      const existing = prev.find(r => r.pillarId === pillarId);
                      if (existing) {
                        return prev.map(r => r.pillarId === pillarId ? { ...r, rating } : r);
                      }
                      return [...prev, { pillarId, rating, notes: '' }];
                    });
                  }}
                  onNotesChange={(pillarId, notes) => {
                    setPillarRatings(prev => {
                      const existing = prev.find(r => r.pillarId === pillarId);
                      if (existing) {
                        return prev.map(r => r.pillarId === pillarId ? { ...r, notes } : r);
                      }
                      return [...prev, { pillarId, rating: 0, notes }];
                    });
                  }}
                />
              </CardContent>
            </Card>

            {/* Block Ratings */}
            <BlockRatingList
              blockRatings={review.blockRatings}
              onRatingChange={updateBlockRating}
            />

            {/* Reflection Form */}
            <ReflectionForm
              whatWentWell={review.whatWentWell}
              whatCouldBeBetter={review.whatCouldBeBetter}
              tomorrowPlan={review.tomorrowPlan}
              onWhatWentWellChange={(value) => saveReview({ whatWentWell: value })}
              onWhatCouldBeBetterChange={(value) => saveReview({ whatCouldBeBetter: value })}
              onTomorrowPlanChange={(value) => saveReview({ tomorrowPlan: value })}
            />

            {/* Overall Rating */}
            <OverallRating
              rating={review.overallRating}
              onRatingChange={(rating) => saveReview({ overallRating: rating })}
            />

            {/* Save Button */}
            <div className="sticky bottom-20 md:bottom-4 flex justify-center">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 shadow-lg"
                size="lg"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar Autocrítica'}
              </Button>
            </div>
          </>
        ) : (
          <WeeklyReviewStats weekStart={selectedDate} />
        )}
      </div>
    </div>
  );
}
