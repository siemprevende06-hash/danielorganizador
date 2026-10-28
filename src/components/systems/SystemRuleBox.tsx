import { Shield, ShieldAlert, ShieldCheck, ShieldX, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSystemRule,
  getSystemRuleStatus,
  type SystemRuleStatus,
} from "@/lib/systemRules";

const TONE: Record<
  SystemRuleStatus,
  { box: string; icon: string; title: string; chip: string }
> = {
  cumplido: {
    box: "border-emerald-500/40 bg-emerald-500/15",
    icon: "text-emerald-600 dark:text-emerald-400",
    title: "text-emerald-700 dark:text-emerald-300",
    chip: "text-emerald-700 dark:text-emerald-300",
  },
  minimo: {
    box: "border-sky-500/30 bg-sky-500/10",
    icon: "text-sky-600 dark:text-sky-400",
    title: "text-sky-700 dark:text-sky-300",
    chip: "text-sky-700 dark:text-sky-300",
  },
  "en-progreso": {
    box: "border-sky-500/20 bg-sky-500/5",
    icon: "text-sky-600/80 dark:text-sky-400/80",
    title: "text-sky-700/80 dark:text-sky-300/80",
    chip: "text-sky-600 dark:text-sky-400",
  },
  "sin-registro": {
    box: "border-border/60 bg-muted/30",
    icon: "text-muted-foreground",
    title: "text-muted-foreground",
    chip: "text-muted-foreground",
  },
  saltado: {
    box: "border-rose-500/30 bg-rose-500/5",
    icon: "text-rose-500",
    title: "text-rose-600 dark:text-rose-400",
    chip: "text-rose-600 dark:text-rose-400",
  },
  "sin-meta": {
    box: "border-border/60 bg-muted/30",
    icon: "text-muted-foreground",
    title: "text-muted-foreground",
    chip: "text-muted-foreground",
  },
};

const ICON: Record<SystemRuleStatus, LucideIcon> = {
  cumplido: ShieldCheck,
  minimo: ShieldAlert,
  "en-progreso": ShieldAlert,
  "sin-registro": Shield,
  saltado: ShieldX,
  "sin-meta": Shield,
};

interface SystemRuleBoxProps {
  habitId: string;
  minutes: number;
  skipped?: boolean;
  /** Meta real del plan si exige más que la regla base (Idiomas). */
  planTargetMinutes?: number;
  compact?: boolean;
  className?: string;
}

/**
 * Caja "Sistema X: regla". Se pinta verde cuando se cumple la regla del
 * sistema, no solo la meta de velocidad del día.
 */
export function SystemRuleBox({
  habitId,
  minutes,
  skipped,
  planTargetMinutes,
  compact = false,
  className,
}: SystemRuleBoxProps) {
  const rule = getSystemRule(habitId, planTargetMinutes);
  if (!rule) return null;

  const result = getSystemRuleStatus(rule, { minutes, skipped });
  const tone = TONE[result.status];
  const Icon = ICON[result.status];

  return (
    <div
      className={cn(
        "flex items-start gap-1.5 rounded-lg border px-2 py-1.5 transition-colors",
        tone.box,
        className,
      )}
      title={rule.text}
    >
      <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", tone.icon)} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[9px] font-bold uppercase leading-tight tracking-wide",
            tone.title,
          )}
        >
          Sistema {rule.name}
        </p>
        {!compact && (
          <p className="text-[9px] leading-tight text-muted-foreground">
            {rule.text}
          </p>
        )}
      </div>
      <span
        className={cn(
          "shrink-0 pt-0.5 text-[8px] font-bold uppercase tracking-wide",
          tone.chip,
        )}
      >
        {result.label}
      </span>
    </div>
  );
}
