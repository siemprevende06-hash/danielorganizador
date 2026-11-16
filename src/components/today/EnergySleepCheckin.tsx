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
  /** Quita la tarjeta exterior cuando el componente vive dentro de otra tarjeta. */
  embedded?: boolean;
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
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={cn('grid h-7 w-7 place-items-center rounded-lg', tone)}>{icon}</span>
          <span className="text-xs font-semibold">{label}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {value > 0 ? options.find(o => o.value === value)?.label : 'Toca para registrar'}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5" role="group" aria-label={label}>
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-label={`${label}: ${o.label}`}
            aria-pressed={value === o.value}
            className={cn(
              'flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              value === o.value
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border/60 bg-background hover:border-primary/40',
            )}
          >
            <span className="text-base leading-none">{o.emoji}</span>
            <span className="text-[9px] leading-none text-muted-foreground">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function EnergySleepCheckin({
  energyRating,
  sleepRating,
  sleepHours,
  onEnergyChange,
  onSleepChange,
  onSleepHoursChange,
  embedded = false,
}: Props) {
  const hoursOptions = [5, 6, 7, 8, 9, 10];

  return (
    <div className={cn(
      "space-y-4 rounded-xl border border-border bg-card p-5",
      embedded && "rounded-2xl border-border/60 bg-muted/20 p-4",
    )}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Energía y sueño
        </h3>
        <span className="text-[10px] text-muted-foreground">1 tap</span>
      </div>

      <RatingRow
        icon={<BatteryCharging className="h-3.5 w-3.5 text-amber-500" />}
        label="Energía del día"
        value={energyRating}
        options={ENERGY_OPTIONS}
        onChange={onEnergyChange}
        tone="bg-amber-500/10"
      />

      <RatingRow
        icon={<Moon className="h-3.5 w-3.5 text-indigo-500" />}
        label="Calidad de sueño"
        value={sleepRating}
        options={SLEEP_OPTIONS}
        onChange={onSleepChange}
        tone="bg-indigo-500/10"
      />

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-sky-500/10">
            <BedDouble className="h-3.5 w-3.5 text-sky-500" />
          </span>
          <span className="text-xs font-semibold">Horas dormidas</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{sleepHours > 0 ? `${sleepHours}h` : '—'}</span>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {hoursOptions.map(h => (
            <button
              key={h}
              type="button"
              onClick={() => onSleepHoursChange(sleepHours === h ? 0 : h)}
              aria-label={`Dormir ${h} horas`}
              aria-pressed={sleepHours === h}
              className={cn(
                'h-9 rounded-lg border text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                sleepHours === h
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border/60 bg-background hover:border-primary/40',
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
