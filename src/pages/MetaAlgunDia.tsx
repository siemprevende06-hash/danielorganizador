import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTextSection } from "@/hooks/useTextSection";
import { LIFE_AREAS } from "@/hooks/usePersonalLists";
import { Plus, Trash2, Sparkles, Star, StarOff, Loader2 } from "lucide-react";

interface SomedayGoal {
  id: string;
  title: string;
  description: string;
  area_id: string;
  starred: boolean;
  created_at: string;
}

const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `sg-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function MetaAlgunDia() {
  const { data: goals, setData: setGoals, loading, saving } = useTextSection<SomedayGoal[]>(
    "meta-algun-dia",
    []
  );
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [areaId, setAreaId] = useState(LIFE_AREAS[0].id);

  const list = Array.isArray(goals) ? goals : [];

  const add = () => {
    if (!title.trim()) return;
    setGoals([
      {
        id: newId(),
        title: title.trim(),
        description: description.trim(),
        area_id: areaId,
        starred: false,
        created_at: new Date().toISOString(),
      },
      ...list,
    ]);
    setTitle("");
    setDescription("");
    setOpen(false);
  };

  const remove = (id: string) => setGoals(list.filter(g => g.id !== id));
  const toggleStar = (id: string) =>
    setGoals(list.map(g => (g.id === id ? { ...g, starred: !g.starred } : g)));

  const areaLabel = (id: string) => LIFE_AREAS.find(a => a.id === id)?.label || id;

  const grouped = LIFE_AREAS.map(area => ({
    area,
    items: list.filter(g => g.area_id === area.id),
  })).filter(g => g.items.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meta para algún día</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ideas y metas sin fecha. Guárdalas aquí hasta que llegue su momento.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Añadir</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva meta para algún día</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="¿Qué quieres lograr algún día?"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Por qué te importa, detalles, primeros pasos..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Select value={areaId} onValueChange={setAreaId}>
                    <SelectTrigger><SelectValue placeholder="Área de vida" /></SelectTrigger>
                    <SelectContent>
                      {LIFE_AREAS.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button onClick={add} disabled={!title.trim()}>Guardar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="p-4 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-semibold">{list.length}</span> metas guardadas ·{" "}
            <span className="font-semibold">{list.filter(g => g.starred).length}</span> destacadas
          </div>
        </Card>

        {list.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="font-medium">Aún no hay metas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Añade cualquier idea que quieras lograr algún día, sin presión de fecha.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ area, items }) => (
              <div key={area.id} className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {area.label}
                </h2>
                {items.map(g => (
                  <Card key={g.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{g.title}</h3>
                          {g.starred && <Badge variant="secondary" className="text-[10px]">Destacada</Badge>}
                        </div>
                        {g.description && (
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {g.description}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground/70 mt-2">
                          {areaLabel(g.area_id)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => toggleStar(g.id)}>
                          {g.starred ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(g.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
