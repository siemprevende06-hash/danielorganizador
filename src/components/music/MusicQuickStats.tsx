import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Flame, Music, Star } from 'lucide-react';

export function MusicQuickStats({
  todayPractice,
  dailyGoal,
  totalSongs,
  mastered,
  learning,
}: {
  todayPractice: number;
  dailyGoal: number;
  totalSongs: number;
  mastered: number;
  learning: number;
}) {
  const percent = Math.min((todayPractice / dailyGoal) * 100, 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card>
        <CardContent className="p-3 sm:p-4 text-center">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xl sm:text-2xl font-bold">
            {todayPractice}
            <span className="text-xs sm:text-sm font-normal text-muted-foreground">min</span>
          </p>
          <p className="text-xs text-muted-foreground">Hoy</p>
          <Progress value={percent} className="h-1.5 mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4 text-center">
          <Music className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xl sm:text-2xl font-bold">{totalSongs}</p>
          <p className="text-xs text-muted-foreground">Canciones</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4 text-center">
          <Star className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-warning" />
          <p className="text-xl sm:text-2xl font-bold">{mastered}</p>
          <p className="text-xs text-muted-foreground">Dominadas</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4 text-center">
          <Flame className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-warning" />
          <p className="text-xl sm:text-2xl font-bold">{learning}</p>
          <p className="text-xs text-muted-foreground">Aprendiendo</p>
        </CardContent>
      </Card>
    </div>
  );
}
