import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Briefcase, FolderKanban, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type BlockFocus = "universidad" | "emprendimiento" | "proyectos" | "none";
export type BlockType = "fijo" | "dinamico" | "configurable" | "evitar";

interface BlockFocusSelectorProps {
  currentFocus: BlockFocus;
  defaultFocus: BlockFocus;
  blockType: BlockType;
  emergencyOnly?: boolean;
  onFocusChange: (focus: BlockFocus) => void;
  disabled?: boolean;
}

const focusConfig = {
  universidad: {
    label: "Universidad",
    icon: GraduationCap,
    color: "bg-blue-500 hover:bg-blue-600 text-white",
    borderColor: "border-blue-500",
  },
  emprendimiento: {
    label: "Emprendimiento",
    icon: Briefcase,
    color: "bg-purple-500 hover:bg-purple-600 text-white",
    borderColor: "border-purple-500",
  },
  proyectos: {
    label: "Proyectos",
    icon: FolderKanban,
    color: "bg-green-500 hover:bg-green-600 text-white",
    borderColor: "border-green-500",
  },
  none: {
    label: "Sin asignar",
    icon: Zap,
    color: "bg-muted hover:bg-muted/80",
    borderColor: "border-muted",
  },
};

export const BlockFocusSelector = ({
  currentFocus,
  defaultFocus,
  blockType,
  emergencyOnly,
  onFocusChange,
  disabled,
}: BlockFocusSelectorProps) => {
  const isConfigurable = blockType === "configurable" || blockType === "dinamico";

  if (!isConfigurable && blockType !== "evitar") {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Enfoque del Bloque</label>
        {blockType === "dinamico" && (
          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30">
            <Zap className="h-3 w-3 mr-1" />
            Dinámico
          </Badge>
        )}
        {blockType === "evitar" && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Evitar usar
          </Badge>
        )}
      </div>

      {emergencyOnly && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Solo usar en emergencias universitarias. Reduce el sueño de 8h a 6h.</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["universidad", "emprendimiento", "proyectos"] as BlockFocus[]).map((focus) => {
          const config = focusConfig[focus];
          const Icon = config.icon;
          const isSelected = currentFocus === focus;
          const isDefault = defaultFocus === focus;

          return (
            <Button
              key={focus}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              disabled={disabled}
              onClick={() => onFocusChange(focus)}
              className={cn(
                "flex items-center gap-1.5 transition-all",
                isSelected && config.color
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{config.label}</span>
              {isDefault && !isSelected && (
                <span className="text-xs opacity-60">(default)</span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export const BlockTypeIndicator = ({ blockType, emergencyOnly }: { blockType: BlockType; emergencyOnly?: boolean }) => {
  const config = {
    fijo: { label: "Fijo", className: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
    dinamico: { label: "Dinámico", className: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
    configurable: { label: "Configurable", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    evitar: { label: "Evitar", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  };

  const typeConfig = config[blockType];

  return (
    <Badge variant="outline" className={cn("text-xs", typeConfig.className)}>
      {typeConfig.label}
      {emergencyOnly && " ⚠️"}
    </Badge>
  );
};

export const getFocusColor = (focus: BlockFocus): string => {
  switch (focus) {
    case "universidad":
      return "border-blue-500";
    case "emprendimiento":
      return "border-purple-500";
    case "proyectos":
      return "border-green-500";
    default:
      return "border-border";
  }
};
