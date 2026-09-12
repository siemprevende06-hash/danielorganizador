import { cn } from '@/lib/utils';
import { BatteryCharging, Moon, BedDouble } from 'lucide-react';

const ENERGY_OPTIONS = [
  { value: 1, emoji: '🪫', label: 'Agotado' },
  { value: 2, emoji: '🥱', label: 'Cansado' },
  { value: 3, emoji: '😐', label: 'Normal' },
  { value: 4, emoji: '⚡', label: 'Enérgico' },
  { value: 5, emoji: '🔥', label: 'Imparable' },
];

const SLEEP_OPTIONS = [
  { value: 1, emoji: '😖', label: 'Muy mal' },
  { value: 2, emoji: '😕', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Regular' },
  { value: 4, emoji: '😊', label: 'Bien' },
  { value: 5, emoji: '😴', label: 'Genial' },
];

interface Props {
  energyRating: number;
  sleepRating: number;
  sleepHours: number;
  onEnergyChange: (value: number) => void;
  onSleepChange: (value: number) => void;
  onSleepHoursChange: (value: number) => void;
}

function RatingRow({
  icon,
  label,
  value,
  options,
  onChange,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  options: typeof ENERGY_OPTIONS;
  onChange: (v: number) => void;
  tone: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center', tone)}>{icon}</span>
          <span className="text-xs font-semibold">{label}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {value > 0 ? options.find(o => o.value === value)?.label : 'Toca para registrar'}
        </span>
      </div>
      <div className="flex gap-1.5">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'flex-1 h-12 rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 text-lg',
              value === o.value
                ? 'border-primary bg-primary/10 shadow-sm scale-[1.03]'
                : 'border-border/60 bg-white/60 dark:bg-zinc-950/50 hover:border-primary/40'
            )}
          >
            <span>{o.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function EnergySleepCheckin({ energyRating, sleepRating, sleepHours, onEnergyChange, onSleepChange, onSleepHoursChange }: Props) {
  const hoursOptions = [5, 6, 7, 8, 9, 10];

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Check-in de energía y sueño
        </h3>
        <span className="text-[10px] text-muted-foreground">1 tap</span>
      </div>

      <RatingRow
        icon={<BatteryCharging className="w-3.5 h-3.5 text-amber-500" />}
        label="Energía del día"
        value={energyRating}
        options={ENERGY_OPTIONS}
        onChange={onEnergyChange}
        tone="bg-amber-500/10"
      />

      <RatingRow
        icon={<Moon className="w-3.5 h-3.5 text-indigo-500" />}
        label="Calidad de sueño"
        value={sleepRating}
        options={SLEEP_OPTIONS}
        onChange={onSleepChange}
        tone="bg-indigo-500/10"
      />

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center bg-sky-500/10')}>
            <BedDouble className="w-3.5 h-3.5 text-sky-500" />
          </span>
          <span className="text-xs font-semibold">Horas dormidas</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{sleepHours > 0 ? `${sleepHours}h` : '—'}</span>
        </div>
        <div className="flex gap-1.5">
          {hoursOptions.map(h => (
            <button
              key={h}
              type="button"
              onClick={() => onSleepHoursChange(sleepHours === h ? 0 : h)}
              className={cn(
                'flex-1 h-9 rounded-lg border text-xs font-semibold transition-all',
                sleepHours === h
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border/60 bg-white/60 dark:bg-zinc-950/50 hover:border-primary/40'
              )}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}