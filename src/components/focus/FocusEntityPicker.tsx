import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  FOCUS_ENTITY_TYPES,
  FocusEntityOption,
  FocusEntityType,
  getFocusEntityConfig,
} from '@/lib/periodFocus';
import { Loader2, Check } from 'lucide-react';
import type { NewFocusInput } from '@/hooks/usePeriodFocus';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NewFocusInput) => Promise<void> | void;
  defaultPrimary?: boolean;
  hasPrimary?: boolean;
}

export function FocusEntityPicker({ open, onOpenChange, onSubmit, defaultPrimary, hasPrimary }: Props) {
  const [entityType, setEntityType] = useState<FocusEntityType>('task');
  const [options, setOptions] = useState<FocusEntityOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [freeTitle, setFreeTitle] = useState('');
  const [note, setNote] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEntityType('task');
    setSearch('');
    setSelectedId(null);
    setFreeTitle('');
    setNote('');
    setIsPrimary(!hasPrimary && (defaultPrimary ?? true));
  }, [open, defaultPrimary, hasPrimary]);

  useEffect(() => {
    if (!open || entityType === 'free') {
      setOptions([]);
      return;
    }
    let cancelled = false;
    setLoadingOptions(true);
    setSelectedId(null);
    const config = getFocusEntityConfig(entityType);
    config
      .loadOptions()
      .then((rows) => {
        if (!cancelled) setOptions(rows);
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, entityType]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.title.toLowerCase().includes(q) || (o.subtitle ?? '').toLowerCase().includes(q),
    );
  }, [options, search]);

  const canSubmit =
    entityType === 'free' ? freeTitle.trim().length > 0 : !!selectedId;

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      if (entityType === 'free') {
        await onSubmit({
          entity_type: 'free',
          title: freeTitle.trim(),
          area_id: null,
          note: note.trim() || null,
          is_primary: isPrimary,
        });
      } else {
        const config = getFocusEntityConfig(entityType);
        const resolved = await config.resolve(selectedId as string);
        const option = options.find((o) => o.id === selectedId);
        await onSubmit({
          entity_type: entityType,
          entity_id: selectedId,
          title: resolved?.title ?? option?.title ?? 'Foco',
          area_id: resolved?.area_id ?? null,
          note: note.trim() || null,
          is_primary: isPrimary,
        });
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Añadir foco</DialogTitle>
          <DialogDescription>
            Elige qué quieres que sea "sí o sí" en este periodo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {FOCUS_ENTITY_TYPES.map((t) => {
            const Icon = t.icon;
            const active = entityType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setEntityType(t.value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-accent',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {entityType === 'free' ? (
          <Input
            autoFocus
            placeholder="Escribe tu foco…"
            value={freeTitle}
            onChange={(e) => setFreeTitle(e.target.value)}
          />
        ) : (
          <div className="space-y-2">
            <Input
              placeholder="Buscar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <ScrollArea className="h-56 rounded-md border">
              {loadingOptions ? (
                <div className="flex h-56 items-center justify-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex h-56 items-center justify-center px-4 text-center text-sm text-muted-foreground">
                  No hay elementos disponibles.
                </div>
              ) : (
                <div className="p-1">
                  {filtered.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setSelectedId(o.id)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                        selectedId === o.id ? 'bg-accent' : 'hover:bg-accent/60',
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{o.title}</span>
                        {o.subtitle && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {o.subtitle}
                          </span>
                        )}
                      </span>
                      {selectedId === o.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="focus-note" className="text-xs text-muted-foreground">
            Nota (opcional)
          </Label>
          <Textarea
            id="focus-note"
            rows={2}
            placeholder="¿Por qué es importante?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <p className="text-sm font-medium">Marcar como principal</p>
            {hasPrimary && (
              <p className="text-xs text-muted-foreground">
                Reemplazará al principal actual.
              </p>
            )}
          </div>
          <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || saving}>
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Añadir foco
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
