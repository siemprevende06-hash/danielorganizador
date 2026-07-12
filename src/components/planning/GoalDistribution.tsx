

interface Distribution {
  month1: number;
  month2: number;
  month3: number;
}

interface GoalDistributionProps {
  label: string;
  icon: React.ReactNode;
  total: number;
  distribution: Distribution;
  onChange: (dist: Distribution) => void;
  monthLabels: string[];
}

export function GoalDistribution({ label, icon, total, distribution, onChange, monthLabels }: GoalDistributionProps) {
  const months = [
    { key: 'month1' as const, value: distribution.month1 },
    { key: 'month2' as const, value: distribution.month2 },
    { key: 'month3' as const, value: distribution.month3 },
  ];

  const updateMonth = (idx: number, newVal: number) => {
    const keys = ['month1', 'month2', 'month3'] as const;
    const old = distribution[keys[idx]];
    const diff = newVal - old;

    if (total <= 0) return;

    let updated = { ...distribution, [keys[idx]]: Math.max(0, newVal) };
    const used = updated.month1 + updated.month2 + updated.month3;
    const remaining = total - used;
    if (remaining !== 0 && idx < 2) {
      const nextIdx = idx + 1;
      updated = { ...updated, [keys[nextIdx]]: Math.max(0, updated[keys[nextIdx]] + remaining) };
    }
    onChange(updated);
  };

  if (total <= 0) return null;

  return (
    <div className="space-y-2 pl-9">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        {icon}
        Distribución: {total} {label}
      </p>
      <div className="grid grid-cols-3 gap-3">
        {months.map((m, i) => (
          <div key={m.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{monthLabels[i]}</span>
              <span className="text-xs font-semibold">{m.value}</span>
            </div>
            <input
              type="range"
              min={0}
              max={total}
              value={m.value}
              onChange={e => updateMonth(i, parseInt(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-muted accent-indigo-500 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
