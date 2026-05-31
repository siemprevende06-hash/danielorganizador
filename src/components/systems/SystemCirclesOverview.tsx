import { cn } from "@/lib/utils";
import { type SystemGroup } from "./SystemHabitGroup";

interface Props {
  groups: SystemGroup[];
  completions: Record<string, boolean>;
  workAssignments: Record<string, string>;
  blockCompletions: Record<string, boolean>;
}

const AREA_COLORS: Record<string, string> = {
  universidad: "#a855f7",
  emprendimiento: "#f59e0b",
  proyectos: "#06b6d4",
  idiomas: "#22c55e",
};

function CircleIndicator({ label, percent, icon, color }: { label: string; percent: number; icon: string; color: string }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
          <circle
            cx="36" cy="36" r={radius} fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg">
          {icon}
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-16">{label}</span>
      <span className="text-xs font-bold">{Math.round(percent)}%</span>
    </div>
  );
}

function WorkBlocksCircle({ workAssignments, blockCompletions }: { workAssignments: Record<string, string>; blockCompletions: Record<string, boolean> }) {
  const blocks = Object.entries(workAssignments).filter(([, v]) => v);
  const totalBlocks = 7;
  const completedBlocks = Object.values(blockCompletions).filter(Boolean).length;

  // Build segments
  const segments: { color: string; area: string }[] = [];
  for (let i = 1; i <= totalBlocks; i++) {
    const area = workAssignments[`work-${i}`] || "";
    segments.push({ color: AREA_COLORS[area] || "hsl(var(--muted))", area });
  }

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const segmentLength = circumference / totalBlocks;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="36" cy="36" r={radius} fill="none"
              stroke={seg.color}
              strokeWidth="5"
              strokeDasharray={`${segmentLength - 2} ${circumference - segmentLength + 2}`}
              strokeDashoffset={-(i * segmentLength)}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
          {completedBlocks}/{totalBlocks}
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-16">Bloques</span>
      <span className="text-xs font-bold">{Math.round((completedBlocks / totalBlocks) * 100)}%</span>
    </div>
  );
}

const GROUP_ICONS: Record<string, string> = {
  estructural: "🏗️",
  fisica: "💪",
  hobbys: "📚",
  apariencia: "✨",
  alimentacion: "🍽️",
};

const GROUP_COLORS: Record<string, string> = {
  estructural: "#3b82f6",
  fisica: "#f97316",
  hobbys: "#a855f7",
  apariencia: "#ec4899",
  alimentacion: "#f59e0b",
};

export function SystemCirclesOverview({ groups, completions, workAssignments, blockCompletions }: Props) {
  return (
    <div className="flex items-start justify-center gap-3 flex-wrap px-2">
      {groups.map(group => {
        const completed = group.habits.filter(h => completions[h.id]).length;
        const percent = group.habits.length > 0 ? (completed / group.habits.length) * 100 : 0;
        return (
          <CircleIndicator
            key={group.id}
            label={group.name}
            percent={percent}
            icon={GROUP_ICONS[group.id] || "📊"}
            color={GROUP_COLORS[group.id] || "#3b82f6"}
          />
        );
      })}
      <WorkBlocksCircle workAssignments={workAssignments} blockCompletions={blockCompletions} />
    </div>
  );
}
