import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoutineSteps, type RoutineType } from "@/hooks/useRoutineSteps";

interface Props {
  type: RoutineType;
  title: string;
  subtitle?: string;
}

export const EditableRoutineChecklist = ({ type, title, subtitle }: Props) => {
  const { steps, completed, loading, toggle, addStep, removeStep } = useRoutineSteps(type);
  const [newTitle, setNewTitle] = useState("");
  const [newGroup, setNewGroup] = useState("");

  if (loading) {
    return <div className="container mx-auto px-4 py-24">Cargando...</div>;
  }

  const groups = steps.reduce<Record<string, typeof steps>>((acc, s) => {
    const key = s.group_title || "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const total = steps.length;
  const done = completed.size;
  const progress = total ? (done / total) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progreso</span>
            <Badge variant="outline">{done}/{total}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {Object.entries(groups).map(([group, items]) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle className="text-base">{group}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((s) => {
              const isDone = completed.has(s.id);
              return (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-muted/50 group",
                    isDone && "bg-muted/30"
                  )}
                >
                  <Checkbox checked={isDone} onCheckedChange={() => toggle(s.id)} />
                  <span className={cn("text-sm flex-1 cursor-pointer", isDone && "line-through text-muted-foreground")} onClick={() => toggle(s.id)}>
                    {s.title}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 h-7 w-7"
                    onClick={() => removeStep(s.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agregar paso</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Grupo (opcional)"
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            className="sm:w-48"
          />
          <Input
            placeholder="Nuevo paso..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTitle.trim()) {
                addStep(newTitle.trim(), newGroup.trim() || undefined);
                setNewTitle("");
              }
            }}
          />
          <Button
            onClick={() => {
              if (newTitle.trim()) {
                addStep(newTitle.trim(), newGroup.trim() || undefined);
                setNewTitle("");
              }
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Agregar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
