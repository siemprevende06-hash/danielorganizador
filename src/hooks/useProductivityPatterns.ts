import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BlockPattern {
  blockId: string;
  blockTitle: string;
  avgMinutes: number;
  sessionsCount: number;
  completionRate: number;
}

interface HourPattern {
  hour: number;
  totalMinutes: number;
  sessions: number;
}

export function useProductivityPatterns() {
  const [blockPatterns, setBlockPatterns] = useState<BlockPattern[]>([]);
  const [hourPatterns, setHourPatterns] = useState<HourPattern[]>([]);
  const [bestBlock, setBestBlock] = useState<string>('');
  const [bestHour, setBestHour] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function analyze() {
      const { data: sessions } = await supabase.from('focus_sessions')
        .select('*').eq('completed', true).order('start_time', { ascending: false }).limit(200);

      if (!sessions?.length) { setLoading(false); return; }

      // Block patterns
      const blockMap = new Map<string, { mins: number[]; count: number }>();
      const hourMap = new Map<number, { total: number; count: number }>();

      sessions.forEach(s => {
        const bid = s.block_id || 'sin-bloque';
        if (!blockMap.has(bid)) blockMap.set(bid, { mins: [], count: 0 });
        const bm = blockMap.get(bid)!;
        bm.mins.push(s.duration_minutes || 0);
        bm.count++;

        const hour = new Date(s.start_time).getHours();
        if (!hourMap.has(hour)) hourMap.set(hour, { total: 0, count: 0 });
        const hm = hourMap.get(hour)!;
        hm.total += s.duration_minutes || 0;
        hm.count++;
      });

      const bp: BlockPattern[] = Array.from(blockMap.entries()).map(([id, d]) => ({
        blockId: id,
        blockTitle: id,
        avgMinutes: Math.round(d.mins.reduce((a, b) => a + b, 0) / d.mins.length),
        sessionsCount: d.count,
        completionRate: 100,
      })).sort((a, b) => b.avgMinutes - a.avgMinutes);

      const hp: HourPattern[] = Array.from(hourMap.entries())
        .map(([hour, d]) => ({ hour, totalMinutes: d.total, sessions: d.count }))
        .sort((a, b) => b.totalMinutes - a.totalMinutes);

      setBlockPatterns(bp);
      setHourPatterns(hp);
      if (bp.length) setBestBlock(bp[0].blockTitle);
      if (hp.length) setBestHour(hp[0].hour);
      setLoading(false);
    }
    analyze();
  }, []);

  return { blockPatterns, hourPatterns, bestBlock, bestHour, loading };
}
