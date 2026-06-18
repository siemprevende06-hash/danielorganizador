import { Component, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { IdentityPlan } from "@/components/systems/IdentityPlan";
import { VisionBoardGrid3x3 } from "@/components/identity/VisionBoardGrid3x3";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error) {
    console.error("PlanIdentidad crashed:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
          <p className="text-sm font-semibold mb-1">Algo salió mal</p>
          <p className="text-xs text-muted-foreground mb-4">{this.state.error || "Error desconocido"}</p>
          <Button variant="outline" size="sm" onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}>
            <RefreshCw className="h-3 w-3 mr-1.5" /> Recargar página
          </Button>
        </Card>
      );
    }
    return this.props.children;
  }
}

export default function PlanIdentidad() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
