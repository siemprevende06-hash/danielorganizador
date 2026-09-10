import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtNum } from "../lib/format";

interface StepperProps {
  label?: string;
  value: number;
  step?: number;
  decimal?: boolean;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  className?: string;
}

export function Stepper({
  label,
  value,
  step = 1,
  decimal = true,
  min = 0,
  max = 100000,
  onChange,
  className,
}: StepperProps) {
  const [editing, setEditing] = useState<string | null>(null);

  const clamp = (x: number) =>
    Math.round(Math.min(max, Math.max(min, x)) * (decimal ? 10 : 1)) /
    (decimal ? 10 : 1);

  const commit = (raw: string) => {
    const x = parseFloat(raw);
    if (!isFinite(x)) {
      setEditing(null);
      return;
    }
    onChange(clamp(x));
    setEditing(null);
  };

  const display = decimal ? fmtNum(value) : String(Math.round(value || 0));

  const btn =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-40";

  return (
    <div className={cn("flex w-full flex-col gap-1", className)}>
      {label && (
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={btn}
          onClick={() => onChange(clamp(value - step))}
          aria-label="Menos"
        >
          <Minus className="h-4 w-4" />
        </button>
        {label && <span className="sr-only">{label}</span>}
        {editing !== null ? (
          <input
            autoFocus
            className="h-9 w-14 rounded-lg border bg-background text-center text-sm font-semibold tabular-nums outline-none ring-1 ring-ring"
            value={editing}
            onChange={(e) => setEditing(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
              if (e.key === "Escape") setEditing(null);
            }}
          />
        ) : (
          <button
            type="button"
            className="h-9 min-w-14 grow rounded-lg border bg-background px-2 text-center text-sm font-semibold tabular-nums hover:bg-accent"
            onClick={() => setEditing(display)}
            title="Toca para editar"
          >
            {display}
          </button>
        )}
        <button
          type="button"
          className={btn}
          onClick={() => onChange(clamp(value + step))}
          aria-label="Más"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}