import { ArrowRight, CheckCircle2, ChevronDown, ChevronRight, Target, Eye } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChipMetaComodidad, type MetaComodidadChip } from './ChipMetaComodidad';

interface Nivel {
  key: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  detail: string;
  pct: number;
}

export interface EjeAreaData {
  areaId: string;
  label: string;
  icon: React.ReactNode;
  metaDiaria: number;
  invertidoHoy: number;
  nivelHoy: Nivel;
  nivelSemana: Nivel;
  nivelMes: Nivel;
  nivelTrimestre: Nivel;
  nivelComodidad: Nivel;
  nivelVision: Nivel;
  metasComodidad: MetaComodidadChip[];
  metaDelMes: MetaComodidadChip[];
  metaDelTrimestre: MetaComodidadChip[];
  mensaje: string;
}

const NODE_ORDER = ['hoy', 'semana', 'mes', 'trimestre', 'comodidad', 'vision'];

export function EjeDeTiempoArea({ data }: { data: EjeAreaData }) {
  const [open, setOpen] = useState(false);
  const node = (key: string): Nivel => {
    switch (key) {
      case 'hoy': return data.nivelHoy;
      case 'semana': return data.nivelSemana;
      case 'mes': return data.nivelMes;
      case 'trimestre': return data.nivelTrimestre;
      case 'comodidad': return data.nivelComodidad;
      default: return data.nivelVision;
    }
  };

  // La flecha avanza según el desempeño de hoy (min invertidos / meta diaria)
  const avance = data.metaDiaria > 0 ? Math.min(100, Math.round((data.invertidoHoy / data.metaDiaria) * 100)) : 0;

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="text-2xl shrink-0">{data.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{data.label}</p>
          <p className="text-[11px] text-muted-foreground truncate">{data.mensaje}</p>
        </div>
        {data.metaDelMes.length > 0 && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-primary shrink-0">
            <Target className="h-3 w-3" />Meta del mes
          </span>
        )}
        {open ? <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t p-4 space-y-4">
          {/* Eje lineal horizontal */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {NODE_ORDER.map((key, i) => {
              const n = node(key);
              const active = i === 0 ? (data.invertidoHoy > 0 || data.metaDiaria > 0) : true;
              return (
                <div key={key} className="flex items-center gap-1 shrink-0">
                  <div className={cn('flex flex-col items-center gap-1 min-w-[54px]')}>
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center border',
                      key === 'comodidad' && 'border-destructive/30 bg-destructive/5',
                      active && key === 'comodidad' && 'text-destructive'
                    )}
                    style={{ borderColor: active ? undefined : 'hsl(var(--border))', color: active ? undefined : 'hsl(var(--muted-foreground))' }}
                  >
                      {n.icon}
                    </div>
                    <span className="text-[9px] font-medium text-center text-muted-foreground leading-tight">{n.label}</span>
                  </div>
                  {i < NODE_ORDER.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Barra de avance del desempeño de hoy */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Tu decisión de hoy mueve la línea →</span>
              <span className="tabular-nums font-semibold">{data.invertidoHoy}/{data.metaDiaria} min</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${avance}%` }} />
            </div>
          </div>

          {/* Detalle por nodo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {NODE_ORDER.map((key, i) => {
              const n = node(key);
              return (
                <div key={key} className="rounded-xl border border-border/60 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{n.icon}</span>
                    <span className="text-[11px] font-semibold text-muted-foreground">{n.label}</span>
                    {i === 0 && data.invertidoHoy >= data.metaDiaria && data.metaDiaria > 0 && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success ml-auto" />
                    )}
                  </div>
                  <p className="text-sm font-bold mt-1 tabular-nums">{n.value}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{n.detail}</p>
                </div>
              );
            })}
          </div>

          {/* Desgranado: meta del mes / trimestre / comodidad */}
          {data.metaDelMes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" /> Tu meta de este mes
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {data.metaDelMes.map(m => <ChipMetaComodidad key={m.id} meta={m} active />)}
              </div>
            </div>
          )}
          {data.metaDelTrimestre.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Este trimestre</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {data.metaDelTrimestre.map(m => <ChipMetaComodidad key={m.id} meta={m} />)}
              </div>
            </div>
          )}
          {data.metasComodidad.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-destructive mb-2">Tu meta de comodidad (resultado final)</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {data.metasComodidad.map(m => <ChipMetaComodidad key={m.id} meta={m} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
