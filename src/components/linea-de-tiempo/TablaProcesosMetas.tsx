import { CheckCircle2, AlertTriangle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcesoFila } from '@/hooks/useProcesosMatriz';

const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`);

function EstadoHoy({ min, minMeta, maxMeta }: { min: number; minMeta: number; maxMeta: number }) {
  const ok = min >= minMeta;
  const full = min >= maxMeta;
  const pct = maxMeta > 0 ? Math.min(100, Math.round((min / maxMeta) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        {full ? <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          : ok ? <Circle className="h-3.5 w-3.5 text-foreground" />
            : <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
        <span className="text-sm font-bold tabular-nums">{fmtMin(min)}</span>
        <span className="text-[10px] text-muted-foreground">de {fmtMin(maxMeta)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full transition-all', ok ? 'bg-success' : 'bg-destructive/70')} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-muted-foreground">mín {fmtMin(minMeta)} · máx {fmtMin(maxMeta)}</p>
    </div>
  );
}

function Celda({ minutos, dias, resultado, etiqueta }: { minutos: number; dias: number; resultado: string; etiqueta: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-sm font-semibold tabular-nums">{fmtMin(minutos)}</p>
      <p className="text-[10px] text-muted-foreground">{dias} días activos</p>
      <p className="text-[11px] font-medium">{resultado}</p>
      <p className="text-[10px] text-muted-foreground">{etiqueta}</p>
    </div>
  );
}

export function TablaProcesosMetas({ rows, titulo }: { rows: ProcesoFila[]; titulo: string }) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold border-b border-border pb-1">{titulo}</h2>

      <div className="rounded-2xl border bg-card overflow-x-auto">
        <table className="w-full min-w-[820px] text-left border-collapse">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="p-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-[210px]">Sistema (proceso)</th>
              <th className="p-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-[170px]">Meta diaria</th>
              <th className="p-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Semanal</th>
              <th className="p-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Mensual</th>
              <th className="p-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Trimestre</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.config.areaId} className="border-b last:border-0 align-top hover:bg-muted/20 transition-colors">
                <td className="p-3">
                  <p className="font-semibold text-sm">{r.config.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{r.config.proceso}</p>
                  {r.config.bloques && (
                    <p className="text-[10px] text-muted-foreground mt-1">{r.config.bloques}</p>
                  )}
                </td>
                <td className="p-3">
                  <EstadoHoy min={r.hoyMinutos} minMeta={r.config.minDiario} maxMeta={r.config.maxDiario} />
                </td>
                <td className="p-3">
                  <Celda minutos={r.semana.minutos} dias={r.semana.dias} resultado={r.resultadoSemanaValor} etiqueta={r.config.resultadoSemana} />
                </td>
                <td className="p-3">
                  <Celda minutos={r.mes.minutos} dias={r.mes.dias} resultado={r.resultadoMesValor} etiqueta={r.config.resultadoMes} />
                </td>
                <td className="p-3">
                  <Celda minutos={r.trimestre.minutos} dias={r.trimestre.dias} resultado={r.resultadoTrimestreValor} etiqueta={r.config.resultadoTrimestre} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
