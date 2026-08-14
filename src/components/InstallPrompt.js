import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Download, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
export function InstallPrompt() {
    const { isInstallable, install } = usePWAInstall();
    const [dismissed, setDismissed] = useState(false);
    if (!isInstallable || dismissed)
        return null;
    return (_jsxs("div", { className: "relative mx-2 mb-2 p-3 rounded-lg border bg-card text-card-foreground shadow-sm", children: [_jsx("button", { onClick: () => setDismissed(true), className: "absolute top-1 right-1 p-0.5 rounded-sm opacity-60 hover:opacity-100 transition-opacity", "aria-label": "Cerrar", children: _jsx(X, { className: "h-3 w-3" }) }), _jsxs("div", { className: "flex items-start gap-2 pr-4", children: [_jsx(Download, { className: "h-4 w-4 mt-0.5 shrink-0 text-primary" }), _jsxs("div", { className: "space-y-1.5 flex-1 min-w-0", children: [_jsx("p", { className: "text-xs font-medium leading-tight", children: "Instalar app" }), _jsx("p", { className: "text-[11px] text-muted-foreground leading-tight", children: "Accede r\u00E1pido desde tu escritorio" })] })] }), _jsx("button", { onClick: install, className: "mt-2 w-full text-xs font-medium py-1.5 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors", children: "Instalar" })] }));
}
