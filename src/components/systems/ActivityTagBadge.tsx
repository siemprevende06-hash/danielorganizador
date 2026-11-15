import {
  ACTIVITY_TAG_STYLES,
  activityTagMeta,
  useSystemActivityTags,
  type ActivityTag,
} from "@/hooks/useSystemActivityTags";
import { cn } from "@/lib/utils";

interface ActivityTagBadgeProps {
  /** Sistema del que se lee la etiqueta (se actualiza solo). */
  systemId?: string;
  /** Etiqueta explícita; si se pasa, no se lee del store. */
  tag?: ActivityTag | null;
  className?: string;
  title?: string;
}

/**
 * Insignia Activo/Pasivo para la portada de cualquier tarjeta de sistema.
 * No intercepta clics: las tarjetas siguen siendo clicables.
 */
export function ActivityTagBadge({ systemId, tag, className, title }: ActivityTagBadgeProps) {
  const { getTag } = useSystemActivityTags();
  const value = tag !== undefined ? tag : systemId ? getTag(systemId) : null;
  if (!value) return null;

  const meta = activityTagMeta(value);
  return (
    <span
      className={cn(
        "pointer-events-none inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-sm ring-1 ring-white/50 backdrop-blur-sm",
        ACTIVITY_TAG_STYLES[value].cover,
        className,
      )}
      title={title ?? `Etiqueta ${meta.label}: ${meta.hint}`}
    >
      <span aria-hidden>{meta.icon}</span>
      {meta.label}
    </span>
  );
}
