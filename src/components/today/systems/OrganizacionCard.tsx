import { Checkbox } from "@/components/ui/checkbox";
import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const ORGANIZACION_ITEMS = [
  { id: "organizacion-cuarto", emoji: "🛏️", label: "Recoger cuarto" },
  { id: "organizacion-bano", emoji: "🚿", label: "Recoger baño" },
  { id: "organizacion-sala", emoji: "🛋️", label: "Recoger sala" },
  { id: "organizacion-platos", emoji: "🍽️", label: "Fregar platos propios" },
];

export function OrganizacionCard({
  completions,
  onToggle,
}: {
  completions: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const total = ORGANIZACION_ITEMS.length;
  const doneCount = ORGANIZACION_ITEMS.filter(i => completions[i.id]).length;

  return (
    <div className="rounded-2xl bg-foreground/[0.03] border border-border/40 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Entorno · Orden del hogar
        </span>
        <span className="ml-auto text-[10px] font-bold tabular-nums">
          <CheckCheck className="h-3 w-3 inline -mt-0.5 mr-0.5 text-emerald-500" />
          {doneCount}
          <span className="text-muted-foreground font-medium">/{total}</span>
        </span>
      </div>
      <div className="space-y-1">
        {ORGANIZACION_ITEMS.map(item => {
          const isDone = !!completions[item.id];
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={cn(
                "w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                isDone ? "bg-emerald-500/10" : "bg-background/70 hover:bg-background"
              )}
            >
              <Checkbox
                checked={isDone}
                onCheckedChange={() => onToggle(item.id)}
                className="h-3.5 w-3.5"
              />
              <span className="text-[11px]">{item.emoji}</span>
              <span
                className={cn(
                  "text-[11px] font-medium leading-tight truncate",
                  isDone && "line-through text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}