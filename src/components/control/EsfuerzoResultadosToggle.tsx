import { cn } from '@/lib/utils';

export type PeriodViewMode = 'esfuerzo' | 'plan' | 'resultados' | 'sistemas' | 'autocritica' | 'pronosticos' | 'direccion';

const OPTIONS: { id: PeriodViewMode; label: string }[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'esfuerzo', label: 'Esfuerzo' },
  { id: 'sistemas', label: 'Sistemas' },
  { id: 'resultados', label: 'Resultados' },
  { id: 'autocritica', label: 'Autocrítica' },
  { id: 'direccion', label: 'Dirección' },
  { id: 'pronosticos', label: 'Pronósticos' },
];

export function EsfuerzoResultadosToggle({ value, onChange, className, withPlan = true, withAutocritica = false, withDireccion = false, withPronosticos = false }: {
  value: PeriodViewMode;
  onChange: (v: PeriodViewMode) => void;
  className?: string;
  withPlan?: boolean;
  withAutocritica?: boolean;
  withDireccion?: boolean;
  withPronosticos?: boolean;
}) {
  let options = withPlan ? OPTIONS : OPTIONS.filter(o => o.id !== 'plan' && o.id !== 'sistemas');
  if (!withAutocritica) options = options.filter(o => o.id !== 'autocritica');
  if (!withDireccion) options = options.filter(o => o.id !== 'direccion');
  if (!withPronosticos) options = options.filter(o => o.id !== 'pronosticos');
  return (
    <div className={cn("inline-flex items-center gap-1 bg-muted/50 rounded-full p-0.5 border border-border/50 max-w-full overflow-x-auto", className)}>
      {options.map(o => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
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