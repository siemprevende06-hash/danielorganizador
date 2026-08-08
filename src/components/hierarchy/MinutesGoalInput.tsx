import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

export function MinutesGoalInput({ value, onApply, label, className, placeholder }: {
  value: number;
  onApply: (v: string) => void;
  label?: string;
  className?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(String(value || ''));
  useEffect(() => setDraft(String(value || '')), [value]);

  const apply = () => onApply(draft);

  return (
    <div className="flex items-center gap-1.5">
      {label && <span className="text-[9px] text-muted-foreground">{label}:</span>}
      <Input
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={e => setDraft(e.target.value.replace(/\D/g, ''))}
        onBlur={apply}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        className={className || 'h-6 w-20 text-[10px]'}
        placeholder={placeholder || 'min'}
      />
    </div>
  );
}
