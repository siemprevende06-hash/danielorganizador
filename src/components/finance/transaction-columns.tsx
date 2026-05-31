import { ColumnDef } from "@tanstack/react-table";
import { Transaction, Wallet, TransactionCategory } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    cell: ({ row }) => format(new Date(row.original.date), "dd MMM yyyy", { locale: es }),
  },
  {
    accessorKey: "description",
    header: "Descripción",
    cell: ({ row }) => {
      const Icon = row.original.type === "income" ? ArrowUp : ArrowDown;
      return (
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${row.original.type === "income" ? "text-success" : "text-destructive"}`} />
          <span>{row.original.description}</span>
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
          {CategoryIcon && <CategoryIcon className="h-4 w-4 text-muted-foreground" />}
          <span>{category?.name || "Sin categoría"}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "wallet",
    header: "Billetera",
    cell: ({ row }) => {
      const wallet = wallets.find(w => w.id === row.original.walletId);
      return wallet?.name || "Desconocida";
    },
  },
  {
    accessorKey: "amount",
    header: "Monto",
    cell: ({ row }) => {
      const amountCUP = row.original.amount * exchangeRate;
      const amountUSD = row.original.amount;
      return (
        <div className="text-right">
          <div className="font-semibold">{amountCUP.toLocaleString('es-ES', { minimumFractionDigits: 2 })} CUP</div>
          <div className="text-xs text-muted-foreground">${amountUSD.toFixed(2)} USD</div>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRevert(row.original)}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    ),
  },
];
