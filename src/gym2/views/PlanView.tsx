import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, ChevronRight, Moon, ClipboardList } from "lucide-react";
import { useGym } from "../store";
import { DAYN, uid, exCount } from "../lib/format";
import { dayAssignSheet, loadStarterPlan, loadDanielPlan } from "../components/sheets";
import { Glyph } from "../lib/glyphs";
import { type Routine } from "../lib/types";

export default function PlanView({ onEdit }: { onEdit: (id: string) => void }) {
  const { S, update } = useGym();

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-32 lg:max-w-4xl lg:px-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Plan</h1>
        <div className="text-sm text-muted-foreground">Tu rutina semanal</div>
      </div>

      <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Horario de la semana
      </h4>
      <div className="divide-y divide-border rounded-2xl border bg-card">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => {
          const r = S.routines.find((x) => x.id === S.week[d]);
          return (
            <div
              key={d}
              className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/60"
              onClick={() => dayAssignSheet(d)}
            >
              <div className="grow text-sm font-medium capitalize">{DAYN[d]}</div>
              {r ? (
                <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  <Glyph name={r.emoji} className="h-3.5 w-3.5" />
                  {r.name}
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  <Moon className="h-3 w-3" /> Descanso
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          );
        })}
      </div>

      <div className="mb-1 mt-5 flex items-center justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Rutinas
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const r: Routine = { id: uid(), name: "Nueva rutina", emoji: "dumbbell", ex: [] };
            update((s) => {
              s.routines.push(r);
            });
            onEdit(r.id);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Nueva
        </Button>
      </div>
      {S.routines.length ? (
        <div className="divide-y divide-border rounded-2xl border bg-card">
          {S.routines.map((r) => (
            <div
              key={r.id}
              className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/60"
              onClick={() => onEdit(r.id)}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Glyph name={r.emoji} className="h-5 w-5" />
              </span>
              <div className="min-w-0 grow">
                <div className="truncate text-sm font-semibold">{r.name}</div>
                <div className="text-xs text-muted-foreground">{exCount(r.ex.length)}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border py-10 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Aún no hay rutinas.
            <br />
            Crea una o carga el plan inicial.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => {
                loadStarterPlan();
                toast("Plan inicial cargado");
              }}
            >
              <Sparkles className="h-4 w-4" /> Plan inicial (Push / Pull / Legs)
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                loadDanielPlan();
                toast("Plan DUP de Daniel cargado");
              }}
            >
              <Sparkles className="h-4 w-4" /> Plan DUP Daniel (Torso & Piernas)
            </Button>
          </div>
        </div>
      )}
      {S.routines.length > 0 && <div className="mt-4" />}
    </div>
  );
}