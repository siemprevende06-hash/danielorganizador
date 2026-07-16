import { cn } from '@/lib/utils';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  strokeColor?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

const colorMap: Record<string, { stroke: string; text: string }> = {
  indigo: { stroke: '#6366f1', text: 'text-indigo-500' },
  emerald: { stroke: '#10b981', text: 'text-emerald-500' },
  amber: { stroke: '#f59e0b', text: 'text-amber-500' },
  blue: { stroke: '#3b82f6', text: 'text-blue-500' },
  rose: { stroke: '#f43f5e', text: 'text-rose-500' },
  purple: { stroke: '#a855f7', text: 'text-purple-500' },
};

const trackColorValue = '#e5e7eb';
const trackColorDark = '#374151';

export function ProgressRing({
  progress,
  size = 72,
  strokeWidth = 5,
  className,
  strokeColor = 'indigo',
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;
  const color = colorMap[strokeColor] || colorMap.indigo;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColorValue}
          strokeWidth={strokeWidth}
          className="dark:opacity-30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      {children && (
        <div className={cn('absolute inset-0 flex items-center justify-center', color.text)}>
          {children}
        </div>
      )}
    </div>
  );
}
