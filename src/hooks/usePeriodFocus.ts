// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  FocusEntityType,
  FocusPeriodType,
  getFocusEntityConfig,
  getPeriodKey,
  getParentType,
} from '@/lib/periodFocus';

export type FocusStatus = 'active' | 'done' | 'skipped';

export interface PeriodFocusRow {
  id: string;
  period_type: FocusPeriodType;
  period_start: string;
  entity_type: FocusEntityType;
  entity_id: string | null;
  title: string;
  area_id: string | null;
  note: string | null;
  is_primary: boolean;
  rank: number;
  status: FocusStatus;
  created_at: string;
  updated_at: string;
}

export interface NewFocusInput {
  entity_type: FocusEntityType;
  entity_id?: string | null;
  title: string;
  area_id?: string | null;
  note?: string | null;
  is_primary?: boolean;
}

export interface UsePeriodFocusResult {
  focuses: PeriodFocusRow[];
  primaryFocus: PeriodFocusRow | null;
  secondaryFocuses: PeriodFocusRow[];
  parentFocuses: PeriodFocusRow[];
  parentPrimary: PeriodFocusRow | null;
  parentType: FocusPeriodType | null;
  loading: boolean;
  addFocus: (input: NewFocusInput) => Promise<void>;
  updateFocus: (id: string, patch: Partial<PeriodFocusRow>) => Promise<void>;
  removeFocus: (id: string) => Promise<void>;
  setPrimary: (id: string) => Promise<void>;
  toggleDone: (focus: PeriodFocusRow) => Promise<void>;
  refresh: () => Promise<void>;
}

const COLUMNS =
  'id,period_type,period_start,entity_type,entity_id,title,area_id,note,is_primary,rank,status,created_at,updated_at';

export function usePeriodFocus(
  periodType: FocusPeriodType,
  anchorDate: Date,
): UsePeriodFocusResult {
  const periodKey = getPeriodKey(periodType, anchorDate);
  const parentType = getParentType(periodType);

  const [focuses, setFocuses] = useState<PeriodFocusRow[]>([]);
  const [parentFocuses, setParentFocuses] = useState<PeriodFocusRow[]>([]);
  const [loading, setLoading] = useState(true);

  const rowsRef = useRef<PeriodFocusRow[]>([]);
  rowsRef.current = focuses;
  const syncedRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('period_focus')
      .select(COLUMNS)
      .eq('period_type', periodType)
      .eq('period_start', periodKey)
      .order('is_primary', { ascending: false })
      .order('rank', { ascending: true });
    setFocuses((data as PeriodFocusRow[]) ?? []);

    if (parentType) {
      const parentKey = getPeriodKey(parentType, anchorDate);
      const { data: parentData } = await supabase
        .from('period_focus')
        .select(COLUMNS)
        .eq('period_type', parentType)
        .eq('period_start', parentKey)
        .order('is_primary', { ascending: false })
        .order('rank', { ascending: true });
      setParentFocuses((parentData as PeriodFocusRow[]) ?? []);
    } else {
      setParentFocuses([]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodType, periodKey, parentType]);

  useEffect(() => {
    void load();
  }, [load]);

  // Sincroniza el estado con el progreso real de la entidad enlazada.
  useEffect(() => {
    if (loading) return;
    if (syncedRef.current === periodKey) return;
    syncedRef.current = periodKey;

    const linked = rowsRef.current.filter(
      (f) => f.entity_type !== 'free' && f.entity_id && f.status !== 'done',
    );
    if (linked.length === 0) return;

    void (async () => {
      const updates: { id: string }[] = [];
      for (const f of linked) {
        const config = getFocusEntityConfig(f.entity_type);
        const resolved = await config.resolve(f.entity_id as string);
        if (resolved?.completed) {
          updates.push({ id: f.id });
        }
      }
      if (updates.length === 0) return;
      await Promise.all(
        updates.map((u) =>
          supabase.from('period_focus').update({ status: 'done' }).eq('id', u.id),
        ),
      );
      setFocuses((prev) =>
        prev.map((f) => (updates.some((u) => u.id === f.id) ? { ...f, status: 'done' } : f)),
      );
    })();
  }, [loading, periodKey]);

  const addFocus = useCallback(
    async (input: NewFocusInput) => {
      const isPrimary = input.is_primary ?? false;
      if (isPrimary) {
        await supabase
          .from('period_focus')
          .update({ is_primary: false })
          .eq('period_type', periodType)
          .eq('period_start', periodKey)
          .eq('is_primary', true);
      }
      const maxRank = focuses.reduce((m, f) => Math.max(m, f.rank), 0);
      const { data, error } = await supabase
        .from('period_focus')
        .insert({
          period_type: periodType,
          period_start: periodKey,
          entity_type: input.entity_type,
          entity_id: input.entity_id ?? null,
          title: input.title,
          area_id: input.area_id ?? null,
          note: input.note ?? null,
          is_primary: isPrimary,
          rank: isPrimary ? 0 : maxRank + 1,
          status: 'active',
        })
        .select(COLUMNS)
        .single();
      if (error) throw error;
      setFocuses((prev) => {
        const next = isPrimary
          ? prev.map((f) => ({ ...f, is_primary: false }))
          : [...prev];
        return [...next, data as PeriodFocusRow];
      });
    },
    [periodType, periodKey, focuses],
  );

  const updateFocus = useCallback(async (id: string, patch: Partial<PeriodFocusRow>) => {
    const { data, error } = await supabase
      .from('period_focus')
      .update(patch)
      .eq('id', id)
      .select(COLUMNS)
      .single();
    if (error) throw error;
    setFocuses((prev) => prev.map((f) => (f.id === id ? (data as PeriodFocusRow) : f)));
  }, []);

  const removeFocus = useCallback(async (id: string) => {
    await supabase.from('period_focus').delete().eq('id', id);
    setFocuses((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const setPrimary = useCallback(
    async (id: string) => {
      await supabase
        .from('period_focus')
        .update({ is_primary: false })
        .eq('period_type', periodType)
        .eq('period_start', periodKey)
        .eq('is_primary', true);
      await supabase.from('period_focus').update({ is_primary: true, rank: 0 }).eq('id', id);
      setFocuses((prev) => prev.map((f) => ({ ...f, is_primary: f.id === id })));
    },
    [periodType, periodKey],
  );

  const toggleDone = useCallback(async (focus: PeriodFocusRow) => {
    const nextStatus: FocusStatus = focus.status === 'done' ? 'active' : 'done';
    await supabase.from('period_focus').update({ status: nextStatus }).eq('id', focus.id);
    setFocuses((prev) => prev.map((f) => (f.id === focus.id ? { ...f, status: nextStatus } : f)));
  }, []);

  const primaryFocus = focuses.find((f) => f.is_primary) ?? null;
  const secondaryFocuses = focuses
    .filter((f) => !f.is_primary)
    .sort((a, b) => a.rank - b.rank);
  const parentPrimary = parentFocuses.find((f) => f.is_primary) ?? parentFocuses[0] ?? null;

  return {
    focuses,
    primaryFocus,
    secondaryFocuses,
    parentFocuses,
    parentPrimary,
    parentType,
    loading,
    addFocus,
    updateFocus,
    removeFocus,
    setPrimary,
    toggleDone,
    refresh: load,
  };
}
