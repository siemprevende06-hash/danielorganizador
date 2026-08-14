import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { IdentityPlan } from "@/components/systems/IdentityPlan";
import { VisionBoardGrid3x3 } from "@/components/identity/VisionBoardGrid3x3";
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error: error.message };
    }
    componentDidCatch(error) {
        console.error("PlanIdentidad crashed:", error);
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs(Card, { className: "p-8 text-center", children: [_jsx(AlertCircle, { className: "h-8 w-8 text-destructive mx-auto mb-3" }), _jsx("p", { className: "text-sm font-semibold mb-1", children: "Algo sali\u00F3 mal" }), _jsx("p", { className: "text-xs text-muted-foreground mb-4", children: this.state.error || "Error desconocido" }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => { this.setState({ hasError: false, error: null }); window.location.reload(); }, children: [_jsx(RefreshCw, { className: "h-3 w-3 mr-1.5" }), " Recargar p\u00E1gina"] })] }));
        }
        return this.props.children;
    }
}
export default function PlanIdentidad() {
    return (_jsx(ErrorBoundary, { children: _jsx("div", { className: "min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "text-center space-y-1", children: [_jsx("h1", { className: "text-3xl md:text-4xl font-bold", style: {
                                    background: "linear-gradient(135deg, hsl(211 100% 50%), hsl(160 84% 39%))",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                }, children: "Plan Identidad" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Tu Punto A \u2192 Punto B en cada \u00E1rea \u00B7 Mi Porqu\u00E9 \u00B7 Mis Recompensas" })] }), _jsx(IdentityPlan, {}), _jsx(VisionBoardGrid3x3, { boardType: "porque", title: "\uD83D\uDC96 Mi Porqu\u00E9", subtitle: "Las razones que te empujan a no rendirte. Sube fotos que te recuerden POR QU\u00C9 haces lo que haces.", accent: "from-rose-500/30 to-pink-500/5" }), _jsx(VisionBoardGrid3x3, { boardType: "recompensas", title: "\uD83C\uDFC6 Mis Recompensas", subtitle: "Lo que vas a obtener al llegar a tu Punto B. Visual\u00EDzalo. Recl\u00E1malo.", accent: "from-amber-500/30 to-yellow-500/5" })] }) }) }));
}
