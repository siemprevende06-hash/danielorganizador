import { Card } from '@/components/ui/card';
import { Calendar, Clock, User, Monitor, Briefcase, TrendingUp } from 'lucide-react';

function ProgressBar({ value, color, showText = true }: { value: number; color: string; showText?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold" style={{ color: '#1A2A3A' }}>{value}%</span>
      <div className="flex-1 h-2.5 rounded-full bg-[#E5E9F0] relative overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(value, 100)}%`, background: color }}
        />
        {showText && value > 25 && (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-white leading-none">
            {value}%
          </span>
        )}
      </div>
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold mb-4" style={{ color: '#2D3E50' }}>
      {children}
    </h3>
  );
}

export default function Inicio2() {
  const events = [
    { title: 'Interview', date: 'Sep 13, 08:30', color: '#3B82F6' },
    { title: 'Team Meeting', date: 'Sep 13, 10:30', color: '#10B981' },
    { title: 'Project Update', date: 'Sep 13, 15:00', color: '#F59E0B' },
    { title: 'Discuss Q3 Goals', date: 'Sep 13, 14:45', color: '#EF4444' },
    { title: 'HR Policy Review', date: 'Sep 13, 16:30', color: '#94A3B8' },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 pt-16 lg:pt-6" style={{ background: '#F4F6F9' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#1A2A3A' }}>
            Crextio
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B7A8F' }}>
            Welcome in, Nixtio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Fila 1 */}
          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Interviews</CardTitle>
            <div className="space-y-3">
              <ProgressBar value={15} color="#3B82F6" />
              <ProgressBar value={15} color="#3B82F6" />
              <ProgressBar value={60} color="#3B82F6" />
            </div>
          </Card>

          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Project time</CardTitle>
            <div className="space-y-3">
              <ProgressBar value={15} color="#3B82F6" />
              <ProgressBar value={15} color="#3B82F6" />
              <ProgressBar value={60} color="#3B82F6" />
            </div>
          </Card>

          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Output</CardTitle>
            <div className="space-y-3">
              <ProgressBar value={10} color="#60A5FA" showText={false} />
              <ProgressBar value={10} color="#60A5FA" showText={false} />
              <ProgressBar value={10} color="#60A5FA" showText={false} />
            </div>
          </Card>

          {/* Fila 2 */}
          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Progress</CardTitle>
            <p className="text-[32px] font-bold leading-none" style={{ color: '#1E3A5F' }}>
              6.1h
            </p>
            <p className="text-xs mt-1" style={{ color: '#6B7A8F' }}>Work Time</p>
            <p className="text-[10px]" style={{ color: '#94A3B8' }}>this week</p>
            <p className="text-sm font-semibold mt-3" style={{ color: '#10B981' }}>
              5h 23m
            </p>
          </Card>

          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Time tracker</CardTitle>
            <p className="text-[28px] font-bold font-mono leading-none tabular-nums" style={{ color: '#1E3A5F' }}>
              02:35
            </p>
            <p className="text-xs mt-1" style={{ color: '#6B7A8F' }}>Work Time</p>
          </Card>

          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Onboarding</CardTitle>
            <div className="space-y-3">
              <ProgressBar value={30} color="#3B82F6" />
              <ProgressBar value={25} color="#3B82F6" />
              <ProgressBar value={0} color="#3B82F6" />
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E5E9F0]">
              <div>
                <p className="text-xs" style={{ color: '#6B7A8F' }}>Task</p>
                <p className="text-xs font-medium" style={{ color: '#2D3E50' }}>Onboarding Task</p>
              </div>
              <span className="text-sm font-semibold" style={{ color: '#1A2A3A' }}>2/8</span>
            </div>
          </Card>

          {/* Fila 3 */}
          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: '#94A3B8' }}
              >
                LP
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold truncate" style={{ color: '#2D3E50' }}>
                  Lora Piterson
                </p>
                <p className="text-xs" style={{ color: '#6B7A8F' }}>
                  Lux/UI Designer
                </p>
              </div>
              <span className="text-sm font-bold shrink-0" style={{ color: '#10B981' }}>
                $1,200
              </span>
            </div>
          </Card>

          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Pension contributions</CardTitle>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                <span className="text-sm" style={{ color: '#2D3E50' }}>August</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA]" />
                <span className="text-sm" style={{ color: '#2D3E50' }}>September 2024</span>
              </div>
            </div>
          </Card>

          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Devices</CardTitle>
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" style={{ color: '#94A3B8' }} />
              <div>
                <p className="text-sm font-bold" style={{ color: '#2D3E50' }}>MacBook Air</p>
                <p className="text-xs" style={{ color: '#6B7A8F' }}>Version M1</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#E5E9F0] pt-3">
              {['8:00 am', '9:00 am', '10:00 am', '11:00 am'].map((t) => (
                <div key={t} className="flex flex-col items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                  <span className="text-[9px]" style={{ color: '#94A3B8' }}>{t}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Fila 4 */}
          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] lg:col-span-2">
            <CardTitle>Weekly Team Sync</CardTitle>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4" style={{ color: '#3B82F6' }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#3B82F6' }}>
                  Onboarding Session
                </p>
                <p className="text-xs" style={{ color: '#6B7A8F' }}>Introduction for new hires</p>
              </div>
            </div>
            <div className="divide-y divide-[#E5E9F0]">
              {events.map((e) => (
                <div key={e.title} className="flex items-center gap-3 py-2.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
                  <span className="text-sm flex-1" style={{ color: '#2D3E50' }}>{e.title}</span>
                  <span className="text-xs flex items-center gap-1" style={{ color: '#94A3B8' }}>
                    <Clock className="h-3 w-3" />
                    {e.date}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[12px] border-[#E5E9F0] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <CardTitle>Onboarding Task</CardTitle>
            <div className="divide-y divide-[#E5E9F0]">
              {events.map((e) => (
                <div key={e.title} className="flex items-center gap-3 py-2.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
                  <span className="text-sm" style={{ color: '#2D3E50' }}>{e.title}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-6 text-[10px] flex items-center gap-1" style={{ color: '#94A3B8' }}>
          <TrendingUp className="h-3 w-3" />
          Dashboard Inicio 2.0
        </div>
      </div>
    </div>
  );
}
