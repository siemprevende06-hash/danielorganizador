import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Home, ListChecks, Sparkles, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  chainLevelData,
  WINDOW_META,
  type ChainWindow,
  type ResultChainCfg,
} from "@/lib/resultChains";
import { cn } from "@/lib/utils";

export interface ChainComodidad {
  pct: number;
  source: "puntoB" | "lists";
  linked: { title: string; done: number; total: number }[];
}

interface ResultChainProps {
  chain: ResultChainCfg;
  minutes: Record<ChainWindow, number>;
  comodidad: ChainComodidad;
}

function fmtValue(value: number): string {
  return value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`;
}

function ChainNode({
  icon,
  title,
  sub,
  value,
  goal,
  unit,
  pct,
  accent,
  bar,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  value: string;
  goal?: number;
  unit?: string;
  pct?: number;
  accent?: string;
  bar?: string;
}) {
  return (
    <div
      className={cn(
        "w-[92px] shrink-0 rounded-xl border border-border/50 bg-foreground/5 p-2 text-center space-y-1",
        accent
      )}
    >
      <div className="text-base leading-none">{icon}</div>
      <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground truncate">
        {title}
      </div>
      <div className="text-xs font-bold tabular-nums">
        {value}
        {goal != null && (
          <span className="text-muted-foreground text-[9px] font-medium">
            {" "}/ {fmtValue(goal)}
            {unit ? ` ${unit}` : ""}
          </span>
        )}
      </div>
      {sub && <p className="text-[8px] leading-tight text-muted-foreground line-clamp-2">{sub}</p>}
      {pct != null && (
        <Progress value={pct} className="h-1" indicatorClassName={bar ?? "bg-current"} />
      )}
    </div>
  );
}

export function ResultChain({ chain, minutes, comodidad }: ResultChainProps) {
  const levels = chain.levels.map(l => chainLevelData(l, minutes[l.window]));
  const visionReached = comodidad.pct >= 100;

  const nodes: ReactNode[] = [
    <ChainNode
      key="system"
      icon={chain.emoji}
      title="Sistema"
      sub={chain.name}
      value={`${fmtValue(Math.round(minutes.hoy))}min`}
      accent="bg-foreground/5"
    />,
    ...levels.map((lv, i) => {
      const win = chain.levels[i].window;
      return (
        <ChainNode
          key={lv.label}
          icon={<Zap className="h-4 w-4 mx-auto" />}
          title={WINDOW_META[win].label}
          sub={lv.label}
          value={fmtValue(lv.value)}
          goal={lv.goal}
          unit={lv.unit}
          pct={lv.pct}
          accent={WINDOW_META[win].accent}
        />
      );
    }),
    <ChainNode
      key="comodidad"
      icon={<Home className="h-4 w-4 mx-auto" />}
      title="Comodidad"
      sub={comodidad.source === "lists" ? "tus metas de comodidad" : "Punto B alcanzado"}
      value={`${comodidad.pct}%`}
      pct={comodidad.pct}
      accent="bg-emerald-500/10"
      bar="bg-emerald-500"
    />,
    <ChainNode
      key="vision"
      icon={<Sparkles className="h-4 w-4 mx-auto" />}
      title="Visión"
      sub={chain.vision}
      value={visionReached ? "Viva" : "En camino"}
      accent={cn(visionReached && "bg-amber-500/10")}
      bar="bg-amber-500"
    />,
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {nodes.map((n, i) => (
          <div key={i} className="flex items-center gap-1 shrink-0">
            {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground/40" />}
            {n}
          </div>
        ))}
      </div>

      {comodidad.source === "lists" && comodidad.linked.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            <ListChecks className="h-3 w-3" />
            Tus metas de comodidad (Mi Lista Personal)
            <Link
              to="/lista-personal"
              className="ml-auto text-[9px] font-semibold text-muted-foreground hover:text-foreground"
            >
              abrir →
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {comodidad.linked.map(m => (
              <div
                key={m.title}
                className={cn(
                  "rounded-lg border px-2 py-1 text-[10px] font-medium",
                  m.total > 0 && m.done === m.total
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    : "border-border/60 bg-foreground/5 text-muted-foreground"
                )}
              >
                {m.title} · {m.done}/{m.total}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}