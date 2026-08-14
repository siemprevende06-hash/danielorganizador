import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import { RotateCcw, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
export const getTransactionColumns = (wallets, categories, exchangeRate, onRevert) => [
    {
        accessorKey: "date",
        header: "Fecha",
        cell: ({ row }) => (_jsx("span", { className: "text-sm text-muted-foreground", children: format(new Date(row.original.date), "dd MMM yyyy", { locale: es }) })),
    },
    {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => {
            const isIncome = row.original.type === "income";
            return (_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: `p-1.5 rounded-full ${isIncome ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`, children: isIncome
                            ? _jsx(ArrowUp, { className: "h-3 w-3 text-green-600 dark:text-green-400" })
                            : _jsx(ArrowDown, { className: "h-3 w-3 text-red-600 dark:text-red-400" }) }), _jsx("span", { className: "text-sm font-medium", children: row.original.description })] }));
        },
    },
    {
        accessorKey: "category",
        header: "Categoría",
        cell: ({ row }) => {
            const category = categories.find(c => c.id === row.original.categoryId);
            const CategoryIcon = category?.icon;
            return (_jsxs("div", { className: "flex items-center gap-2", children: [CategoryIcon && _jsx(CategoryIcon, { className: "h-3.5 w-3.5 text-muted-foreground" }), _jsx("span", { className: "text-sm text-muted-foreground", children: category?.name || "Sin categoría" })] }));
        },
    },
    {
        accessorKey: "wallet",
        header: "Billetera",
        cell: ({ row }) => {
            const wallet = wallets.find(w => w.id === row.original.walletId);
            const WalletIcon = wallet?.icon;
            return (_jsxs("div", { className: "flex items-center gap-1.5", children: [WalletIcon && _jsx(WalletIcon, { className: "h-3.5 w-3.5 text-muted-foreground" }), _jsx("span", { className: "text-sm", children: wallet?.name || "Desconocida" })] }));
        },
    },
    {
        accessorKey: "amount",
        header: "Monto",
        cell: ({ row }) => {
            const amountCUP = row.original.amount * exchangeRate;
            const amountUSD = row.original.amount;
            const isIncome = row.original.type === "income";
            return (_jsxs("div", { className: "text-right", children: [_jsxs("div", { className: `text-sm font-semibold ${isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`, children: [isIncome ? "+" : "-", amountCUP.toLocaleString("es-ES", { minimumFractionDigits: 2 }), " CUP"] }), _jsxs("div", { className: "text-xs text-muted-foreground", children: ["$", amountUSD.toFixed(2), " USD"] })] }));
        },
    },
    {
        id: "actions",
        cell: ({ row }) => (_jsx("div", { className: "flex justify-end", children: _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground", onClick: () => onRevert(row.original), children: _jsx(RotateCcw, { className: "h-3.5 w-3.5" }) }) })),
    },
];
