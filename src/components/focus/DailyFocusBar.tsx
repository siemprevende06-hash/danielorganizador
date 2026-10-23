import { BookOpen, Music2, Crown, Gamepad2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface FocusItem {
  id: string;
  label: string;
  text: string;
  icon: React.ReactNode;
  color: string;
}

interface DailyFocusBarProps {
  focus: {
    lectura?: string;
    musica?: string;
    ajedrez?: string;
    game?: string;
    idiomas?: string;
  };
}

export function DailyFocusBar({ focus }: DailyFocusBarProps) {
  const items: FocusItem[] = [
    {
      id: "lectura",
      label: "Lectura",
      text: focus.lectura || "Foco: Sin definir",
      icon: <BookOpen className="h-3 w-3" />,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "musica",
      label: "Música",
      text: focus.musica || "Foco: Sin definir",
      icon: <Music2 className="h-3 w-3" />,
      color: "text-pink-500 bg-pink-500/10 border-pink-500/20",
    },
    {
      id: "ajedrez",
      label: "Ajedrez",
      text: focus.ajedrez || "Foco: Sin definir",
      icon: <Crown className="h-3 w-3" />,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      id: "game",
      label: "Game",
      text: focus.game || "Foco: Sin definir",
      icon: <Gamepad2 className="h-3 w-3" />,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
    {
      id: "idiomas",
      label: "Idiomas",
      text: focus.idiomas || "Foco: Sin definir",
      icon: <Globe className="h-3 w-3" />,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-background/70 backdrop-blur-sm p-2.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Ruta de Enfoque HOY
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-medium",
              item.color
            )}
          >
            {item.icon}
            <span className="font-semibold">{item.label}:</span>
            <span className="text-foreground/80 truncate max-w-[200px]">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
