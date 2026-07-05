import { ColumnDef } from "@tanstack/react-table";
import { Transaction, Wallet, TransactionCategory } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { RotateCcw, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const getTransactionColumns = (
  wallets: Wallet[],
  categories: TransactionCategory[],
  exchangeRate: number,
  onRevert: (transaction: Transaction) => void
): ColumnDef<Transaction>[] => [
  {
    accessorKey: "date",
    header: "Fecha",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {format(new Date(row.original.date), "dd MMM yyyy", { locale: es })}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: "Descripción",
    cell: ({ row }) => {
      const isIncome = row.original.type === "income";
      return (
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-full ${isIncome ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
            {isIncome
              ? <ArrowUp className="h-3 w-3 text-green-600 dark:text-green-400" />
              : <ArrowDown className="h-3 w-3 text-red-600 dark:text-red-400" />
            }
          </div>
          <span className="text-sm font-medium">{row.original.description}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Categoría",
    cell: ({ row }) => {
      const category = categories.find(c => c.id === row.original.categoryId);
      const CategoryIcon = category?.icon;
      return (
        <div className="flex items-center gap-2">
          {CategoryIcon && <CategoryIcon className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-sm text-muted-foreground">{category?.name || "Sin categoría"}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "wallet",
    header: "Billetera",
    cell: ({ row }) => {
      const wallet = wallets.find(w => w.id === row.original.walletId);
      const WalletIcon = wallet?.icon;
      return (
        <div className="flex items-center gap-1.5">
          {WalletIcon && <WalletIcon className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-sm">{wallet?.name || "Desconocida"}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Monto",
    cell: ({ row }) => {
      const amountCUP = row.original.amount * exchangeRate;
      const amountUSD = row.original.amount;
      const isIncome = row.original.type === "income";
      return (
        <div className="text-right">
          <div className={`text-sm font-semibold ${isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {isIncome ? "+" : "-"}{amountCUP.toLocaleString("es-ES", { minimumFractionDigits: 2 })} CUP
          </div>
          <div className="text-xs text-muted-foreground">${amountUSD.toFixed(2)} USD</div>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => onRevert(row.original)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    ),
  },
];
