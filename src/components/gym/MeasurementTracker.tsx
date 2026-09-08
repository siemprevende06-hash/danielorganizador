import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { usePhysicalTracking, PhysicalMeasurement } from "@/hooks/usePhysicalTracking";
import { Scale, TrendingDown, TrendingUp, Minus, Plus, Weight, Ruler, Percent } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function MeasurementTracker() {
  const { measurements, isLoading, addMeasurement } = usePhysicalTracking();
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [arm, setArm] = useState("");
  const [saving, setSaving] = useState(false);

  const sorted = [...measurements].sort((a, b) => a.measurement_date.localeCompare(b.measurement_date));
  const latest: PhysicalMeasurement | undefined = sorted[sorted.length - 1];
  const previous: PhysicalMeasurement | undefined = sorted[sorted.length - 2];

  const weightData = sorted.map(m => ({
    label: format(parseISO(m.measurement_date), "dd MMM", { locale: es }),
    weight: Number(m.weight) || 0,
    bodyFat: Number(m.body_fat_percentage) || undefined,
    chest: Number(m.chest_cm) || undefined,
    waist: Number(m.waist_cm) || undefined,
    arm: Number(m.arm_cm) || undefined
  }));

  const weightDelta = latest && previous
    ? Number((Number(latest.weight) - Number(previous.weight)).toFixed(1))
    : null;

  const trend = (() => {
    if (!latest || !previous) return "stable";
    return Number(latest.weight) > Number(previous.weight) ? "up" : Number(latest.weight) < Number(previous.weight) ? "down" : "stable";
  })();

  const handleSubmit = async () => {
    if (!weight) return;
    setSaving(true);
    await addMeasurement({
      weight: parseFloat(weight),
      body_fat_percentage: bodyFat ? parseFloat(bodyFat) : undefined,
      chest_cm: chest ? parseFloat(chest) : undefined,
      waist_cm: waist ? parseFloat(waist) : undefined,
      arm_cm: arm ? parseFloat(arm) : undefined
    });
    setWeight(""); setBodyFat(""); setChest(""); setWaist(""); setArm("");
    setSaving(false);
    setOpen(false);
  };

  const metricCard = (label: string, value: number | null | undefined, icon: React.ReactNode, unit = "") => (
    <div className="rounded-lg bg-muted/40 p-2 text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
        {icon}{label}
      </div>
      <p className="text-sm font-bold">{value != null ? `${value}${unit}` : "—"}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Medidas y Peso</h3>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Registrar Medida
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Scale className="h-5 w-5" /> Nueva medición semanal</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label htmlFor="mweight">Peso (kg) *</Label>
                  <Input id="mweight" type="number" step="0.1" placeholder="70.0" value={weight} onChange={e => setWeight(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mfat">% Grasa corporal</Label>
                  <Input id="mfat" type="number" step="0.1" placeholder="15.0" value={bodyFat} onChange={e => setBodyFat(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Pecho (cm)</Label>
                    <Input type="number" step="0.1" placeholder="100" value={chest} onChange={e => setChest(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cintura (cm)</Label>
                    <Input type="number" step="0.1" placeholder="80" value={waist} onChange={e => setWaist(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Brazo (cm)</Label>
                    <Input type="number" step="0.1" placeholder="35" value={arm} onChange={e => setArm(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={!weight || saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Cargando...</p>
        ) : sorted.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Aún no hay mediciones. Registra tu peso semanal para seguir tu evolución.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              {metricCard("Peso", latest?.weight, <Weight className="h-3 w-3" />, " kg")}
              {metricCard("Grasa %", latest?.body_fat_percentage, <Percent className="h-3 w-3" />, "")}
              {metricCard("Pecho", latest?.chest_cm, <Ruler className="h-3 w-3" />, " cm")}
              {metricCard("Cintura", latest?.waist_cm, <Ruler className="h-3 w-3" />, " cm")}
              {metricCard("Brazo", latest?.arm_cm, <Ruler className="h-3 w-3" />, " cm")}
            </div>

            {weightDelta !== null && (
              <div className="flex items-center gap-2 mb-3 text-xs">
                <span className="text-muted-foreground">Cambio vs semana anterior:</span>
                <Badge variant="outline" className={
                  trend === "down" ? "text-green-600 border-green-400" : trend === "up" ? "text-red-500 border-red-400" : "text-muted-foreground"
                }>
                  {trend === "down" ? <TrendingDown className="h-3 w-3" /> : trend === "up" ? <TrendingUp className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  {weightDelta > 0 ? "+" : ""}{weightDelta} kg
                </Badge>
              </div>
            )}

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} />
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={32} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="weight" name="Peso (kg)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2.5 }} />
                  {weightData.some(d => d.bodyFat) && (
                    <Line type="monotone" dataKey="bodyFat" name="% Grasa" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                  )}
                  {weightData.some(d => d.chest) && (
                    <Line type="monotone" dataKey="chest" name="Pecho (cm)" stroke="#22c55e" strokeWidth={1.5} dot={false} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
