import { cn } from '@/lib/utils';

export type PeriodViewMode = 'esfuerzo' | 'resultados';

const OPTIONS: { id: PeriodViewMode; label: string }[] = [
  { id: 'esfuerzo', label: 'Esfuerzo' },
  { id: 'resultados', label: 'Resultados' },
];

export function EsfuerzoResultadosToggle({ value, onChange, className }: {
  value: PeriodViewMode;
  onChange: (v: PeriodViewMode) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-1 bg-muted/50 rounded-full p-0.5 border border-border/50", className)}>
      {OPTIONS.map(o => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
            value === o.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ResultadosPlaceholder() {
  return (
    <div className="min-h-[50vh] rounded-2xl border border-dashed border-border/60 flex items-center justify-center text-sm text-muted-foreground">
      Resultados — próximamente
    </div>
  );
}
