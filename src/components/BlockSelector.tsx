import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoutineBlocks, formatTimeDisplay } from '@/hooks/useRoutineBlocks';
import { Clock } from 'lucide-react';

interface BlockSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function BlockSelector({ value, onValueChange, placeholder = "Selecciona un bloque" }: BlockSelectorProps) {
  const { blocks, isLoaded } = useRoutineBlocks();

  if (!isLoaded) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Cargando bloques..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Sin bloque asignado</SelectItem>
        {blocks.map(block => (
          <SelectItem key={block.id} value={block.id}>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>{block.title}</span>
              <span className="text-xs text-muted-foreground">
                ({formatTimeDisplay(block.startTime)} - {formatTimeDisplay(block.endTime)})
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
