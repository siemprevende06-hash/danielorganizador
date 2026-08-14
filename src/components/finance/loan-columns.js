import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
export const getLoanColumns = (exchangeRate, onPayment) => [
    {
        accessorKey: "date",
        header: "Fecha",
        cell: ({ row }) => (_jsx("span", { className: "text-sm text-muted-foreground", children: format(new Date(row.original.date), "dd MMM yyyy", { locale: es }) })),
    },
    {
        accessorKey: "person",
        header: "Persona",
        cell: ({ row }) => _jsx("span", { className: "text-sm font-medium", children: row.original.person }),
    },
    {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => _jsx("span", { className: "text-sm text-muted-foreground", children: row.original.description }),
    },
    {
        accessorKey: "progress",
        header: "Progreso",
        cell: ({ row }) => {
            const progress = (row.original.paidAmount / row.original.totalAmount) * 100;
            return (_jsxs("div", { className: "flex items-center gap-3 min-w-[140px]", children: [_jsx(Progress, { value: progress, className: "h-2 rounded-full flex-1" }), _jsxs("span", { className: "text-xs font-medium text-muted-foreground w-10 text-right", children: [Math.round(progress), "%"] })] }));
        },
    },
    {
        accessorKey: "remaining",
        header: "Pendiente",
        cell: ({ row }) => {
            const remaining = row.original.totalAmount - row.original.paidAmount;
            const remainingCUP = remaining * exchangeRate;
            return (_jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-sm font-semibold", children: [remainingCUP.toLocaleString("es-ES", { minimumFractionDigits: 2 }), " CUP"] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["$", remaining.toFixed(2), " USD"] })] }));
        },
    },
    {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (_jsx(Badge, { variant: row.original.status === "paid" ? "default" : "secondary", className: `rounded-full text-xs px-3 py-0.5 font-medium ${row.original.status === "paid"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"}`, children: row.original.status === "paid" ? "Pagado" : "Pendiente" })),
    },
    {
        id: "actions",
        cell: ({ row }) => row.original.status === "outstanding" ? (_jsx("div", { className: "flex justify-end", children: _jsxs(Button, { size: "sm", className: "h-8 rounded-full text-xs px-3", onClick: () => onPayment(row.original), children: [_jsx(DollarSign, { className: "h-3 w-3 mr-1" }), "Cobrar"] }) })) : null,
    },
];
