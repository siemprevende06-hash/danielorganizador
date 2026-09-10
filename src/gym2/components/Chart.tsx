import { useLayoutEffect, useRef, useState, type ReactNode, type MouseEvent as RMouseEvent, type TouchEvent as RTouchEvent } from "react";
import { fmtNum, fmtDate, isoOf, MONTHS } from "../lib/format";

export interface ChartPoint {
  t: number;
  y: number;
  d?: string;
  m?: number;
  note?: string;
}

const W = 340;

interface ChartProps {
  points: ChartPoint[];
  h?: number;
  unit?: string;
  color?: string;
  axes?: boolean;
  goal?: number | null;
  invert?: boolean;
}

export function Chart({
  points,
  h = 150,
  unit = "",
  color = "#30d158",
  axes = true,
  goal = null,
  invert = false,
}: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; iso: string; v: number; note?: string } | null>(null);

  useLayoutEffect(() => {
    const tip = tipRef.current;
    const wrap = wrapRef.current;
    if (!hover || !tip || !wrap) return;
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    const M = 4;
    const cx = (hover.x / W) * cw;
    const cy = (hover.y / h) * ch;
    tip.style.left = Math.max(M, Math.min(cw - tw - M, cx - tw / 2)) + "px";
    tip.style.top =
      (cy < th + 14 ? Math.min(ch - th - M, cy + 14) : M) + "px";
  });

  if (!points || points.length === 0)
    return (
      <div className="rounded-lg bg-muted/40 py-6 text-center text-sm text-muted-foreground">
        Aún no hay datos
      </div>
    );

  const H = h;
  const P = { l: axes ? 34 : 8, r: 12, t: 10, b: axes ? 22 : 8 };
  const single = points.length === 1;
  const pts: ChartPoint[] = single ? [points[0], points[0]] : points;
  const ys = pts.map((p) => p.y);
  let ymin = Math.min(...ys);
  let ymax = Math.max(...ys);
  if (goal != null && isFinite(goal)) {
    ymin = Math.min(ymin, goal);
    ymax = Math.max(ymax, goal);
  }
  if (ymin === ymax) {
    ymin -= 1;
    ymax += 1;
  }
  const pad = (ymax - ymin) * 0.12;
  ymin -= pad;
  ymax += pad;
  const t0 = pts[0].t;
  const t1 = pts[pts.length - 1].t || t0 + 1;
  const X = (t: number) =>
    t1 === t0 ? (P.l + W - P.r) / 2 : P.l + ((t - t0) / (t1 - t0)) * (W - P.l - P.r);
  const Y = (y: number) => {
    const f = (y - ymin) / (ymax - ymin);
    return P.t + (invert ? f : 1 - f) * (H - P.t - P.b);
  };

  const gridlines: ReactNode[] = [];
  if (axes) {
    const range = ymax - ymin;
    const raw = range / 3;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    let step = 10 * pow;
    for (const m of [1, 2, 2.5, 5, 10])
      if (raw <= m * pow) {
        step = m * pow;
        break;
      }
    for (let v = Math.ceil(ymin / step) * step; v <= ymax + 1e-9; v += step) {
      const y = Y(v);
      gridlines.push(
        <g key={"y" + v}>
          <line x1={P.l} y1={y} x2={W - P.r} y2={y} stroke="#94a3b8" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="2 4" />
          <text x={P.l - 5} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="#94a3b8">
            {fmtNum(v)}
          </text>
        </g>
      );
    }
    const d0 = new Date(t0);
    const d1 = new Date(t1);
    const ticks: { t: number; txt: string; anchor?: string }[] = [];
    let m = new Date(d0.getFullYear(), d0.getMonth() + 1, 1);
    while (m <= d1) {
      ticks.push({ t: +m, txt: MONTHS[m.getMonth()] });
      m = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    }
    if (ticks.length === 0 && !single) {
      for (let i = 0; i <= 2; i++) {
        const tv = t0 + ((t1 - t0) * i) / 2;
        const dd = new Date(tv);
        ticks.push({
          t: tv,
          txt: dd.getDate() + " " + MONTHS[dd.getMonth()],
          anchor: i === 0 ? "start" : i === 2 ? "end" : "middle",
        });
      }
    }
    const every = Math.max(1, Math.ceil(ticks.length / 7));
    ticks.forEach((tk, i) => {
      if (i % every) return;
      const x = X(tk.t);
      gridlines.push(
        <g key={"x" + i}>
          <line x1={x} y1={P.t} x2={x} y2={H - P.b} stroke="#94a3b8" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="2 4" />
          <text x={x} y={H - 7} textAnchor={(tk.anchor as "middle") || "middle"} fontSize="9.5" fill="#94a3b8">
            {tk.txt}
          </text>
        </g>
      );
    });
  }

  const poly = pts.map((p) => X(p.t).toFixed(1) + "," + Y(p.y).toFixed(1)).join(" ");
  const last = pts[pts.length - 1];
  const gid = "g" + Math.round(t0 % 1e7) + "_" + H + "_" + color.replace("#", "");
  const hoverPts = (single ? [points[0]] : points).map((p) => ({
    x: X(p.t),
    y: Y(p.y),
    iso: p.d || isoOf(new Date(p.t)),
    v: p.y,
    note: p.note,
  }));
  const marked = points.some((p) => p.m != null);

  const onMove = (e: RMouseEvent | RTouchEvent) => {
    const c = "touches" in e ? e.touches[0] : e;
    if (!c || c.clientX === undefined) return;
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    const w = r.width || W;
    const vx = ((c.clientX - r.left) / w) * W;
    let best = hoverPts[0];
    hoverPts.forEach((p) => {
      if (Math.abs(p.x - vx) < Math.abs(best.x - vx)) best = p;
    });
    setHover(best);
  };

  return (
    <div
      className="relative w-full"
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseDown={onMove}
      onMouseLeave={() => setHover(null)}
      onTouchStart={onMove}
      onTouchMove={onMove}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ aspectRatio: `${W}/${H}`, display: "block" }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.28" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridlines}
        {goal != null && isFinite(goal) && (
          <>
            <line x1={P.l} y1={Y(goal)} x2={W - P.r} y2={Y(goal)} stroke="#f59e0b" strokeWidth="1.6" strokeDasharray="7 4" />
            <text x={W - P.r - 2} y={Y(goal) - 5} textAnchor="end" fontSize="9.5" fontWeight="700" fill="#f59e0b">
              {fmtNum(goal)}
            </text>
          </>
        )}
        <polygon points={`${P.l},${H - P.b} ${poly} ${X(last.t).toFixed(1)},${H - P.b}`} fill={`url(#${gid})`} />
        <polyline points={poly} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {marked &&
          pts.map(
            (p, i) =>
              p.m == null ? null : (
                <circle key={"m" + i} cx={X(p.t)} cy={Y(p.y)} r={2.4 + p.m * 3} fill={color} opacity={0.3 + p.m * 0.7} />
              )
          )}
        <circle cx={X(last.t)} cy={Y(last.y)} r="4" fill={color} />
        {hover && (
          <g>
            <line x1={hover.x} y1={P.t} x2={hover.x} y2={H - P.b} stroke="#94a3b8" strokeOpacity="0.7" strokeWidth="1" strokeDasharray="3 3" />
            <line x1={P.l} y1={hover.y} x2={W - P.r} y2={hover.y} stroke="#94a3b8" strokeOpacity="0.7" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={hover.x} cy={hover.y} r="5" fill={color} stroke="hsl(var(--background))" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover && (
        <div
          ref={tipRef}
          className="pointer-events-none absolute z-10 rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow"
        >
          {fmtDate(hover.iso, true)} · {fmtNum(hover.v)}
          {unit ? " " + unit : ""}
          {hover.note ? " · " + hover.note : ""}
        </div>
      )}
    </div>
  );
}