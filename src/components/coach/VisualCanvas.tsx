import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export interface VisualDatum {
  label: string;
  value: string;
  extra?: string | null;
}

export interface CoachVisual {
  tipo: "bar" | "line" | "pasos" | "tabla" | "timeline" | "fuentes" | "comparacion";
  titulo: string;
  descripcion?: string | null;
  datos: VisualDatum[];
}

function numericData(datos: VisualDatum[]) {
  return datos.map((d) => ({
    label: d.label,
    value: Number(String(d.value).replace(/[^\d.-]/g, "")) || 0,
  }));
}

export function VisualBlock({ visual }: { visual: CoachVisual }) {
  const { tipo, titulo, descripcion, datos } = visual;

  return (
    <Card className="p-4 space-y-3">
      <div>
        <h4 className="text-sm font-semibold">{titulo}</h4>
        {descripcion && <p className="text-xs text-muted-foreground mt-0.5">{descripcion}</p>}
      </div>

      {tipo === "bar" && (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={numericData(datos)}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-25} height={50} textAnchor="end" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" fill="hsl(var(--foreground))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tipo === "line" && (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={numericData(datos)}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tipo === "pasos" && (
        <ol className="space-y-2">
          {datos.map((d, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center font-semibold">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium leading-tight">{d.label}</p>
                <p className="text-xs text-muted-foreground">{d.value}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {(tipo === "tabla" || tipo === "comparacion") && (
        <div className="divide-y divide-border text-sm">
          {datos.map((d, i) => (
            <div key={i} className="py-2 flex items-start justify-between gap-3">
              <span className="font-medium">{d.label}</span>
              <span className="text-right text-muted-foreground">
                {d.value}
                {d.extra ? <span className="block text-xs">{d.extra}</span> : null}
              </span>
            </div>
          ))}
        </div>
      )}

      {tipo === "timeline" && (
        <div className="space-y-0">
          {datos.map((d, i) => (
            <div key={i} className="flex gap-3 pb-3 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-foreground mt-1.5" />
                {i < datos.length - 1 && <div className="w-px flex-1 bg-border" />}
              </div>
              <div className="pb-1">
                <p className="text-xs font-mono text-muted-foreground">{d.value}</p>
                <p className="text-sm">{d.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tipo === "fuentes" && (
        <div className="space-y-2">
          {datos.map((d, i) => (
            <a
              key={i}
              href={d.extra || "#"}
              target="_blank"
              rel="noreferrer"
              className="block rounded-md border border-border p-2.5 hover:bg-muted transition-colors"
            >
              <p className="text-sm font-medium flex items-center gap-1.5">
                {d.label}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </p>
              <p className="text-xs text-muted-foreground line-clamp-3">{d.value}</p>
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}

export function VisualCanvas({ visuals }: { visuals: CoachVisual[] }) {
  if (visuals.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Aquí aparecerán gráficos, pasos, tablas y fuentes que el coach use para explicarte.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3 p-3">
      {visuals.map((v, i) => (
        <VisualBlock key={i} visual={v} />
      ))}
    </div>
  );
}
