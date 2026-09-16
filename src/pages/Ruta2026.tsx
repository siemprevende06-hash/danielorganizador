import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MotivosBoard } from "@/components/motivos/MotivosBoard";
import { Home, Map, Gauge, CalendarRange, Layers, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "camino", label: "Camino", icon: Map },
  { id: "control", label: "Control", icon: Gauge },
  { id: "rutina", label: "Rutina", icon: CalendarRange },
  { id: "sistemas", label: "Sistemas", icon: Layers },
  { id: "recompensa", label: "Recompensa", icon: Gift },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export default function Ruta2026() {
  const [section, setSection] = useState<SectionId>("inicio");

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ruta 2026</h1>
          <p className="text-sm text-muted-foreground">
            Tu plan anual por ǭrea de vida: camino, control, rutina, sistemas y recompensa.
          </p>
        </div>
      </header>

      <div className="inline-flex flex-wrap rounded-xl border border-border/60 bg-muted/40 p-1 gap-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              section === s.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {section === "recompensa" ? (
        <MotivosBoard
          storageKey="ruta2026-recompensa"
          uploadFolder="ruta2026-recompensa"
          title="Recompensa"
          description="Escenarios y recompensas que valen la pena perseguir. Aǧn no tienes nada: crea tu primera secci��n."
          emptyTitle="No hay escenarios aǧn"
          emptyDescription="Esta es tu recompensa futura. Crea secciones con imǭgenes y textos de lo que quieres lograr."
          newSectionLabel="Nuevo Escenario"
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            <p>
              La secci��n <strong className="text-foreground capitalize">{section}</strong> se construirǭ en esta iteraci��n.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
