import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, Clock, Moon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface EmergencyModeToggleProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  normalHours: number;
  emergencyHours: number;
}

export const EmergencyModeToggle = ({
  isActive,
  onToggle,
  normalHours,
  emergencyHours,
}: EmergencyModeToggleProps) => {
  return (
    <Card className={cn(
      "transition-all",
      isActive ? "border-2 border-red-500 bg-red-500/5" : "border-border"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className={cn(
              "h-5 w-5",
              isActive ? "text-red-500" : "text-muted-foreground"
            )} />
            Modo Emergencia Universitaria
          </CardTitle>
          {isActive && (
            <Badge variant="destructive" className="animate-pulse">
              ACTIVO
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Modo Normal</span>
            </div>
            <p className="text-2xl font-bold">{normalHours}h</p>
            <p className="text-xs text-muted-foreground">de estudio/trabajo</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg space-y-1",
            isActive ? "bg-red-500/10 border border-red-500/30" : "bg-muted/50"
          )}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span>Modo Emergencia</span>
            </div>
            <p className="text-2xl font-bold">{emergencyHours}h</p>
            <p className="text-xs text-muted-foreground">máximo para estudio</p>
          </div>
        </div>

        {isActive && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
            <Moon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="text-xs space-y-1">
              <p className="font-medium">Advertencia de sueño reducido</p>
              <p className="opacity-80">
                El modo emergencia incluye el Bloque Extra (21:00-23:00), reduciendo tu sueño de 8h a 6h.
                Usa este modo solo cuando sea estrictamente necesario.
              </p>
            </div>
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant={isActive ? "outline" : "destructive"}
              className="w-full"
            >
              {isActive ? (
                <>Desactivar Modo Emergencia</>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Activar Modo Emergencia
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isActive ? "¿Desactivar modo emergencia?" : "¿Activar modo emergencia?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isActive ? (
                  "Los bloques dinámicos volverán a su configuración por defecto."
                ) : (
                  <>
                    Esto convertirá los bloques dinámicos (Idiomas, Focus, Bloque Extra) a modo Universidad,
                    aumentando tu tiempo de estudio de {normalHours}h a {emergencyHours}h.
                    <br /><br />
                    <strong className="text-amber-500">⚠️ Advertencia:</strong> El Bloque Extra reducirá tu sueño de 8h a 6h.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onToggle(!isActive)}>
                {isActive ? "Desactivar" : "Activar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
