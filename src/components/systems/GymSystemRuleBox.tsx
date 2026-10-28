import { useMemo } from "react";
import { format } from "date-fns";
import { SystemRuleBoxView } from "./SystemRuleBox";
import { buildGymRuleView } from "@/lib/systemRules";
import { useGymDayPlan } from "@/hooks/useGymDayPlan";

interface GymSystemRuleBoxProps {
  /** Fecha ISO (yyyy-MM-dd) del día mostrado. */
  date?: string;
  minutes: number;
  done?: boolean;
  isRest?: boolean;
  isSkipped?: boolean;
  className?: string;
}

/**
 * Regla del sistema Gym: qué rutina y grupos musculares toca hoy según la
 * planificación semanal de Gym 2.0, y si el entrenamiento se cumplió.
 */
export function GymSystemRuleBox({
  date,
  minutes,
  done,
  isRest,
  isSkipped,
  className,
}: GymSystemRuleBoxProps) {
  const dateISO = date ?? format(new Date(), "yyyy-MM-dd");
  const plan = useGymDayPlan(dateISO);

  const view = useMemo(
    () =>
      buildGymRuleView({
        plan,
        minutes,
        done,
        rest: isRest,
        skipped: isSkipped,
      }),
    [plan, minutes, done, isRest, isSkipped],
  );

  if (!view) return null;

  return <SystemRuleBoxView data={view} className={className} />;
}
