import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

function getTimeParts() {
  const now = new Date();
  let hours = now.getHours();
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    hours: String(hours).padStart(2, '0'),
    minutes: pad(now.getMinutes()),
    seconds: pad(now.getSeconds()),
    meridiem,
  };
}

export function DigitalClockStrip({ className }: { className?: string }) {
  const [time, setTime] = useState(getTimeParts);

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeParts()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={cn('w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-3', className)}>
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1 text-card-foreground shadow-sm">
          <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="font-mono text-sm font-semibold tabular-nums tracking-wider">
            {time.hours}:{time.minutes}
            <span className="text-muted-foreground">:</span>
            {time.seconds}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {time.meridiem}
          </span>
        </div>
      </div>
    </div>
  );
}
