import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, addDays, eachDayOfInterval, isBefore, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Flame, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function Challenge90Days() {
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("challenge_90_days")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setChallenge(data);
      setLoading(false);
    };
    load();
  }, []);

  const allDays = useMemo(() => {
    if (!challenge) return [];
    const s = new Date(challenge.start_date + "T00:00:00");
    const e = new Date(challenge.end_date + "T00:00:00");
    return eachDayOfInterval({ start: s, end: e });
  }, [challenge?.start_date, challenge?.end_date]);

  const startChallenge = async () => {
    const today = new Date();
    const end = addDays(today, 90);
    const { data } = await supabase
      .from("challenge_90_days")
      .insert({
        start_date: format(today, "yyyy-MM-dd"),
        end_date: format(end, "yyyy-MM-dd"),
        title: "Reto de 90 Días",
        is_active: true,
      })
      .select()
      .single();
    setChallenge(data);
  };

  if (loading) return null;

  if (!challenge) {
    return (
      <Card className="p-6 text-center space-y-3">
        <Flame className="h-8 w-8 text-orange-500 mx-auto" />
        <h3 className="font-bold text-lg">Reto de 90 Días</h3>
        <p className="text-sm text-muted-foreground">Inicia tu reto de transformación</p>
        <Button onClick={startChallenge} className="gap-2">
          <Play className="h-4 w-4" /> Iniciar Reto
        </Button>
      </Card>
    );
  }

  const startDate = new Date(challenge.start_date + "T00:00:00");
  const endDate = new Date(challenge.end_date + "T00:00:00");
  const today = new Date();
  const daysPassed = Math.max(0, differenceInDays(today, startDate));
  const daysRemaining = Math.max(0, differenceInDays(endDate, today));
  const totalDays = differenceInDays(endDate, startDate);
  const progressPct = Math.min(100, (daysPassed / totalDays) * 100);

  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Flame className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-bold">Reto de 90 Días</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {format(startDate, "d MMM", { locale: es })} — {format(endDate, "d MMM yyyy", { locale: es })}
      </p>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-bold text-orange-500">{Math.round(progressPct)}%</span>
      </div>

      <div className="flex gap-4 mb-4">
        <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
          Día {daysPassed} de {totalDays}
        </Badge>
        <Badge variant="secondary">{daysRemaining} días restantes</Badge>
      </div>

      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-1">
            {week.map(day => {
              const isPast = isBefore(day, today) && !isToday(day);
              const isT = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "h-5 w-5 rounded-sm text-[8px] flex items-center justify-center font-mono",
                    isPast && "bg-green-500/30 text-green-700 dark:text-green-300",
                    isT && "bg-primary text-primary-foreground ring-2 ring-primary/50",
                    !isPast && !isT && "bg-muted text-muted-foreground"
                  )}
                >
                  {format(day, "d")}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}
