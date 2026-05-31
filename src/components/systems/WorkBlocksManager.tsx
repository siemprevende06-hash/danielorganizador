import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GraduationCap, Briefcase, Code, Languages, AlertTriangle, CheckCircle2 } from "lucide-react";

const WORK_AREAS = [
  { id: "universidad", label: "Universidad", icon: GraduationCap, color: "text-purple-500" },
  { id: "emprendimiento", label: "Emprendimiento", icon: Briefcase, color: "text-amber-500" },
  { id: "proyectos", label: "Proyectos", icon: Code, color: "text-cyan-500" },
  { id: "idiomas", label: "Idiomas", icon: Languages, color: "text-green-500" },
];

const WORK_BLOCKS = [
  { id: "work-1", time: "9:00 - 10:30" },
  { id: "work-2", time: "10:30 - 12:00" },
  { id: "work-3", time: "12:00 - 13:20" },
  { id: "work-4", time: "14:00 - 15:30" },
  { id: "work-5", time: "15:30 - 17:00" },
  { id: "work-6", time: "17:00 - 18:30" },
  { id: "work-7", time: "18:30 - 20:00" },
];

interface Props {
  assignments: Record<string, string>;
  onAssign: (blockId: string, area: string) => void;
}

export function WorkBlocksManager({ assignments, onAssign }: Props) {
  const assignedAreas = Object.values(assignments).filter(Boolean);
  const hasUniOrEmpOrProj = assignedAreas.some(a => ["universidad", "emprendimiento", "proyectos"].includes(a));
  const hasIdiomas = assignedAreas.some(a => a === "idiomas");
  const meetsMinimum = hasUniOrEmpOrProj && hasIdiomas;

  const areaCounts: Record<string, number> = {};
  assignedAreas.forEach(a => { areaCounts[a] = (areaCounts[a] || 0) + 1; });

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">🎯 Bloques de Trabajo</h3>
          <p className="text-xs text-muted-foreground">7 bloques · Asigna cada uno a un área</p>
        </div>
        {meetsMinimum ? (
          <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Mínimo
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> Falta
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className={cn("p-2 rounded-lg border text-xs text-center", hasUniOrEmpOrProj ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30")}>
          {hasUniOrEmpOrProj ? "✅" : "❌"} Uni/Emprend/Proy
        </div>
        <div className={cn("p-2 rounded-lg border text-xs text-center", hasIdiomas ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30")}>
          {hasIdiomas ? "✅" : "❌"} Idiomas
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {WORK_BLOCKS.map(block => (
          <div key={block.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
            <span className="text-xs font-mono w-24 shrink-0 text-muted-foreground">{block.time}</span>
            <Select value={assignments[block.id] || ""} onValueChange={v => onAssign(block.id, v)}>
              <SelectTrigger className="h-8 text-sm flex-1">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {WORK_AREAS.map(area => {
                  const AreaIcon = area.icon;
                  return (
                    <SelectItem key={area.id} value={area.id}>
                      <span className="flex items-center gap-2">
                        <AreaIcon className={cn("h-4 w-4", area.color)} />
                        {area.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {WORK_AREAS.map(area => {
          const AreaIcon = area.icon;
          const count = areaCounts[area.id] || 0;
          return (
            <div key={area.id} className="text-center p-2 rounded-lg bg-muted/50">
              <AreaIcon className={cn("h-5 w-5 mx-auto mb-1", area.color)} />
              <p className="text-xl font-bold">{count}</p>
              <p className="text-[10px] text-muted-foreground">{area.label}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
