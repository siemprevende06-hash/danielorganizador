import { ColumnDef } from "@tanstack/react-table";
import { Loan } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const getLoanColumns = (
  exchangeRate: number,
  onPayment: (loan: Loan) => void
): ColumnDef<Loan>[] => [
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
    accessorKey: "person",
    header: "Persona",
    cell: ({ row }) => <span className="text-sm font-medium">{row.original.person}</span>,
  },
  {
    accessorKey: "description",
    header: "Descripción",
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.description}</span>,
  },
  {
    accessorKey: "progress",
    header: "Progreso",
    cell: ({ row }) => {
      const progress = (row.original.paidAmount / row.original.totalAmount) * 100;
      return (
        <div className="flex items-center gap-3 min-w-[140px]">
          <Progress value={progress} className="h-2 rounded-full flex-1" />
          <span className="text-xs font-medium text-muted-foreground w-10 text-right">{Math.round(progress)}%</span>
        </div>
      );
    },
  },
  {
    accessorKey: "remaining",
    header: "Pendiente",
    cell: ({ row }) => {
      const remaining = row.original.totalAmount - row.original.paidAmount;
      const remainingCUP = remaining * exchangeRate;
      return (
        <div className="text-right">
          <div className="text-sm font-semibold">{remainingCUP.toLocaleString("es-ES", { minimumFractionDigits: 2 })} CUP</div>
          <div className="text-xs text-muted-foreground">${remaining.toFixed(2)} USD</div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "paid" ? "default" : "secondary"}
        className={`rounded-full text-xs px-3 py-0.5 font-medium ${
          row.original.status === "paid"
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
        }`}
      >
        {row.original.status === "paid" ? "Pagado" : "Pendiente"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) =>
      row.original.status === "outstanding" ? (
        <div className="flex justify-end">
          <Button
            size="sm"
            className="h-8 rounded-full text-xs px-3"
            onClick={() => onPayment(row.original)}
          >
            <DollarSign className="h-3 w-3 mr-1" />
            Cobrar
          </Button>
        </div>
      ) : null,
  },
];
