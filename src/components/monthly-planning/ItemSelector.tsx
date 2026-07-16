import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
  title: string;
  subtitle?: string;
}

interface ItemSelectorProps {
  items: Item[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  triggerLabel?: string;
}

export function ItemSelector({
  items,
  selected,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Sin resultados',
  triggerLabel,
}: ItemSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = items.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    (i.subtitle && i.subtitle.toLowerCase().includes(search.toLowerCase()))
  );

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectedItems = items.filter(i => selected.includes(i.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between h-auto min-h-[2.5rem]">
          {selectedItems.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedItems.slice(0, 3).map(item => (
                <Badge key={item.id} variant="secondary" className="text-[11px] font-normal">
                  {item.title}
                </Badge>
              ))}
              {selectedItems.length > 3 && (
                <Badge variant="outline" className="text-[11px]">+{selectedItems.length - 3}</Badge>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          )}
          {triggerLabel && (
            <span className="text-xs text-muted-foreground shrink-0 ml-2">{triggerLabel}</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{triggerLabel || placeholder}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-0.5 -mx-2">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>
          )}
          {filtered.map(item => {
            const isSelected = selected.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded-lg transition-colors',
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'hover:bg-muted'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                  isSelected
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : 'border-muted-foreground/30'
                )}>
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  {item.subtitle && (
                    <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t pt-3 -mx-6 px-6">
          <span className="text-xs text-muted-foreground">{selected.length} seleccionados</span>
          <Button size="sm" onClick={() => setOpen(false)}>Listo</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
