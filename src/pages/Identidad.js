import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo } from "lucide-react";
export default function Identidad() {
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24", children: _jsxs("div", { className: "max-w-2xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 rounded-lg bg-primary/10", children: _jsx(ListTodo, { className: "h-6 w-6 text-primary" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "Identidad" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Lista de identidad" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Elementos" }) }), _jsx(CardContent, { children: _jsx("ul", { className: "space-y-2", children: _jsx("li", { className: "text-sm text-muted-foreground py-2 px-3 rounded-md bg-muted/50", children: "A\u00FAn no hay elementos" }) }) })] })] }) }));
}
