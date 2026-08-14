import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Sunrise, Sun, SunMedium, Moon, Clock, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseTime } from "@/hooks/useRoutineBlocksDB";
const PERIODS = [
  { id: "amanecer", label: "Amanecer", icon: /* @__PURE__ */ jsx(Sunrise, { className: "h-4 w-4" }), start: 300, end: 540, range: "5:00 \u2014 9:00" },
  { id: "manana", label: "Ma\xF1ana", icon: /* @__PURE__ */ jsx(Sun, { className: "h-4 w-4" }), start: 540, end: 800, range: "9:00 \u2014 13:20" },
  { id: "tarde", label: "Tarde", icon: /* @__PURE__ */ jsx(SunMedium, { className: "h-4 w-4" }), start: 800, end: 1110, range: "13:20 \u2014 18:30" },
  { id: "noche", label: "Noche", icon: /* @__PURE__ */ jsx(Moon, { className: "h-4 w-4" }), start: 1110, end: 1350, range: "18:30 \u2014 22:30" }
];
function formatHora(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}:${min.toString().padStart(2, "0")}`;
}
function formatTotal(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function TimePeriodSections({
  blocks,
  tasksByBlock
}) {
  const grouped = useMemo(() => {
    const sorted = [...blocks].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
    return PERIODS.map((p) => {
      const periodBlocks = sorted.filter((b) => {
        const s = parseTime(b.startTime);
        return s >= p.start && s < p.end;
      });
      const minutes = periodBlocks.reduce((s, b) => {
        let e = parseTime(b.endTime);
        const st = parseTime(b.startTime);
        if (e <= st) e += 24 * 60;
        return s + (e - st);
      }, 0);
      const tasks = periodBlocks.flatMap(
        (b) => (tasksByBlock[b.id] || []).map((t) => ({ task: t, block: b }))
      );
      const completed = tasks.filter(({ task }) => task.completed).length;
      return { ...p, blocks: periodBlocks, tasks, minutes, completed };
    });
  }, [blocks, tasksByBlock]);
  return /* @__PURE__ */ jsxs("section", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-1", children: [
      /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4 text-primary" }),
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold uppercase tracking-wide", children: "Sectores del D\xEDa" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: grouped.map((p) => {
      const empty = p.blocks.length === 0;
      return /* @__PURE__ */ jsxs(Card, { className: cn("p-3 space-y-2", empty && "opacity-60"), children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "flex items-center justify-center h-7 w-7 rounded-lg bg-foreground/5 text-foreground", children: p.icon }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-bold", children: p.label }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono text-muted-foreground", children: p.range }),
          /* @__PURE__ */ jsx("span", { className: "ml-auto text-[10px] font-mono text-muted-foreground", children: p.minutes > 0 ? formatTotal(p.minutes) : "\u2014" })
        ] }),
        p.blocks.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground italic", children: "Sin bloques en este periodo" }) : /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: p.blocks.map((b) => {
          const blockTasks = tasksByBlock[b.id] || [];
          return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border/60 px-2 py-1.5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono text-muted-foreground shrink-0", children: formatHora(parseTime(b.startTime)) }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold truncate", children: b.title }),
              blockTasks.length > 0 && /* @__PURE__ */ jsx("span", { className: "text-[9px] px-1 py-0.5 rounded-full bg-foreground/5 text-muted-foreground shrink-0", children: blockTasks.length })
            ] }),
            blockTasks.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-1 space-y-0.5", children: blockTasks.map((t) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[11px]", children: [
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: cn(
                    "w-1 h-1 rounded-full shrink-0",
                    t.completed ? "bg-green-500" : "bg-primary"
                  )
                }
              ),
              /* @__PURE__ */ jsx("span", { className: cn("truncate", t.completed && "line-through text-muted-foreground"), children: t.title })
            ] }, t.id)) })
          ] }, b.id);
        }) }),
        p.tasks.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-[10px] text-muted-foreground", children: [
          /* @__PURE__ */ jsx(ListChecks, { className: "h-3 w-3" }),
          /* @__PURE__ */ jsxs("span", { children: [
            p.completed,
            "/",
            p.tasks.length,
            " tareas"
          ] })
        ] })
      ] }, p.id);
    }) })
  ] });
}
export {
  TimePeriodSections
};