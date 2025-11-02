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
    cell: ({ row }) => format(new Date(row.original.date), "dd MMM yyyy", { locale: es }),
  },
  {
    accessorKey: "person",
    header: "Persona",
  },
  {
    accessorKey: "description",
    header: "Descripción",
  },
  {
    accessorKey: "progress",
    header: "Progreso",
    cell: ({ row }) => {
      const progress = (row.original.paidAmount / row.original.totalAmount) * 100;
      return (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {row.original.paidAmount.toFixed(2)} / {row.original.totalAmount.toFixed(2)} USD
          </div>
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
          <div className="font-semibold">{remainingCUP.toLocaleString('es-ES', { minimumFractionDigits: 2 })} CUP</div>
          <div className="text-xs text-muted-foreground">${remaining.toFixed(2)} USD</div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "paid" ? "default" : "secondary"}>
        {row.original.status === "paid" ? "Pagado" : "Pendiente"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) =>
      row.original.status === "outstanding" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPayment(row.original)}
        >
          <DollarSign className="h-4 w-4 mr-1" />
          Pagar
        </Button>
      ) : null,
  },
];
