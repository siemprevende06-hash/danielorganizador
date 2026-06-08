import { IdentityPlan } from "@/components/systems/IdentityPlan";
import { VisionBoardGrid3x3 } from "@/components/identity/VisionBoardGrid3x3";

export default function PlanIdentidad() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1
            className="text-3xl md:text-4xl font-bold"
            style={{
              background: "linear-gradient(135deg, hsl(211 100% 50%), hsl(160 84% 39%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Plan Identidad
          </h1>
          <p className="text-sm text-muted-foreground">
            Tu Punto A → Punto B en cada área · Mi Porqué · Mis Recompensas
          </p>
        </div>

        <IdentityPlan />

        <VisionBoardGrid3x3
          boardType="porque"
          title="💖 Mi Porqué"
          subtitle="Las razones que te empujan a no rendirte. Sube fotos que te recuerden POR QUÉ haces lo que haces."
          accent="from-rose-500/30 to-pink-500/5"
        />

        <VisionBoardGrid3x3
          boardType="recompensas"
          title="🏆 Mis Recompensas"
          subtitle="Lo que vas a obtener al llegar a tu Punto B. Visualízalo. Reclámalo."
          accent="from-amber-500/30 to-yellow-500/5"
        />
      </div>
    </div>
  );
}
