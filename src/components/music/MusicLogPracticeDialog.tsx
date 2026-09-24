import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Song } from '@/hooks/useMusicRepertoire';

export function MusicLogPracticeDialog({
  open,
  onOpenChange,
  song,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: Song | null;
  saving?: boolean;
  onSave: (song: Song, minutes: { left: number; right: number; both: number }) => Promise<void>;
}) {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [both, setBoth] = useState('');

  useEffect(() => {
    if (open) {
      setLeft('');
      setRight('');
      setBoth('');
    }
  }, [open, song]);

  if (!song) return null;

  const toInt = (v: string) => Math.max(0, parseInt(v, 10) || 0);
  const isPiano = song.instrument === 'piano';
  const l = isPiano ? toInt(left) : 0;
  const r = isPiano ? toInt(right) : 0;
  const b = toInt(both);
  const total = l + r + b;
  const canSave = total > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    await onSave(song, { left: isPiano ? l : 0, right: isPiano ? r : 0, both: b });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar práctica</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {song.title}
          {song.artist ? ` — ${song.artist}` : ''}
        </p>

        <div className="space-y-3 pt-1">
          {isPiano ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Izquierda</Label>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="min"
                  value={left}
                  onChange={(e) => setLeft(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Derecha</Label>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="min"
                  value={right}
                  onChange={(e) => setRight(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ambas</Label>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="min"
                  value={both}
                  onChange={(e) => setBoth(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">Ambas manos</Label>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="min"
                value={both}
                onChange={(e) => setBoth(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold">{total} min</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}