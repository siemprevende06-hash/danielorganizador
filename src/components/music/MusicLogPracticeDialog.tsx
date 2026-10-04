import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Song } from '@/hooks/useMusicRepertoire';
import { formatMinutesTotal } from './musicUtils';

function DurationInput({
  label,
  minutes,
  seconds,
  onMinutes,
  onSeconds,
}: {
  label: string;
  minutes: string;
  seconds: string;
  onMinutes: (v: string) => void;
  onSeconds: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-xs w-20 shrink-0">{label}</Label>
      <Input
        type="number"
        min={0}
        inputMode="numeric"
        placeholder="min"
        className="h-8 text-center"
        value={minutes}
        onChange={(e) => onMinutes(e.target.value)}
      />
      <span className="text-muted-foreground">:</span>
      <Input
        type="number"
        min={0}
        max={59}
        inputMode="numeric"
        placeholder="seg"
        className="h-8 text-center"
        value={seconds}
        onChange={(e) => onSeconds(e.target.value)}
      />
    </div>
  );
}

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
  const [leftSec, setLeftSec] = useState('');
  const [right, setRight] = useState('');
  const [rightSec, setRightSec] = useState('');
  const [both, setBoth] = useState('');
  const [bothSec, setBothSec] = useState('');

  useEffect(() => {
    if (open) {
      setLeft('');
      setLeftSec('');
      setRight('');
      setRightSec('');
      setBoth('');
      setBothSec('');
    }
  }, [open, song]);

  if (!song) return null;

  const toInt = (v: string) => Math.max(0, parseInt(v, 10) || 0);
  const toSeconds = (min: string, sec: string) => toInt(min) * 60 + toInt(sec);
  const isPiano = song.instrument === 'piano';
  const lSec = isPiano ? toSeconds(left, leftSec) : 0;
  const rSec = isPiano ? toSeconds(right, rightSec) : 0;
  const bSec = toSeconds(both, bothSec);
  const totalSec = lSec + rSec + bSec;
  const totalMin = totalSec / 60;
  const canSave = totalSec > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    await onSave(song, { left: lSec / 60, right: rSec / 60, both: bSec / 60 });
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
            <div className="space-y-2">
              <DurationInput
                label="Izquierda"
                minutes={left}
                seconds={leftSec}
                onMinutes={setLeft}
                onSeconds={setLeftSec}
              />
              <DurationInput
                label="Derecha"
                minutes={right}
                seconds={rightSec}
                onMinutes={setRight}
                onSeconds={setRightSec}
              />
              <DurationInput
                label="Ambas"
                minutes={both}
                seconds={bothSec}
                onMinutes={setBoth}
                onSeconds={setBothSec}
              />
            </div>
          ) : (
            <DurationInput
              label="Ambas manos"
              minutes={both}
              seconds={bothSec}
              onMinutes={setBoth}
              onSeconds={setBothSec}
            />
          )}

          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold">{formatMinutesTotal(totalMin)}</span>
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
