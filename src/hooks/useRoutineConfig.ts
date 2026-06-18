import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRoutineBlocksDB, parseTime, type RoutineBlock } from '@/hooks/useRoutineBlocksDB';
import { format } from 'date-fns';

export type WakeOption = '05:00' | '06:30';
export type SleepOption = '21:00' | '22:30';

export interface RoutineConfig {
  wakeTime: WakeOption;
  focusBlock: boolean;
  sleepTime: SleepOption;
  lateWake: string | null;
}

const STORAGE_KEY = 'routineConfig';

function loadConfig(): RoutineConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { wakeTime: '05:00', focusBlock: true, sleepTime: '22:30', lateWake: null };
}

function identifyBlock(title: string): 'activation' | 'focus' | 'gym' | 'alistamiento' | 'lectura' | 'deepwork' | 'almuerzo' | 'ocio' | 'musica' | 'desactivacion' | 'dormir' | 'other' {
  const t = title.toLowerCase();
  if (t.includes('activación') || t.includes('despertar')) return 'activation';
  if (t.includes('focus') && (t.includes('bloque') || t.includes('deep'))) return 'focus';
  if (t.includes('gym') || t.includes('entreno')) return 'gym';
  if (t.includes('alistamiento') || t.includes('bañ') || t.includes('skincare') || t.includes('desayuno')) return 'alistamiento';
  if (t.includes('lectura') || t.includes('podcast')) return 'lectura';
  if (t.includes('deep work') || t.includes('trabajo') || t.includes('work-')) return 'deepwork';
  if (t.includes('almuerzo') || t.includes('ajedrez') || t.includes('gaming')) return 'almuerzo';
  if (t.includes('ocio')) return 'ocio';
  if (t.includes('música') || t.includes('piano') || t.includes('guitarra')) return 'musica';
  if (t.includes('desactivación') || t.includes('dormir')) return 'desactivacion';
  return 'other';
}

export function useRoutineConfig() {
  const { blocks: baseBlocks, isLoaded, saveBlocks } = useRoutineBlocksDB();
  const [config, setConfig] = useState<RoutineConfig>(loadConfig);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  // Reset late wake at midnight
  useEffect(() => {
    if (!config.lateWake) return;
    const now = new Date();
    const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const timer = setTimeout(() => {
      setConfig(prev => ({ ...prev, lateWake: null }));
    }, msToMidnight);
    return () => clearTimeout(timer);
  }, [config.lateWake]);

  const wakeTime = config.wakeTime;
  const sleepTime = config.sleepTime;
  const focusBlock = config.focusBlock;
  const lateWake = config.lateWake;

  const setWakeTime = useCallback((w: WakeOption) => {
    setConfig(prev => ({ ...prev, wakeTime: w }));
  }, []);

  const setFocusBlock = useCallback((f: boolean) => {
    setConfig(prev => ({ ...prev, focusBlock: f }));
  }, []);

  const setSleepTime = useCallback((s: SleepOption) => {
    setConfig(prev => ({ ...prev, sleepTime: s }));
  }, []);

  const setLateWake = useCallback((t: string | null) => {
    setConfig(prev => ({ ...prev, lateWake: t }));
  }, []);

  const adjustedBlocks = useMemo(() => {
    if (!isLoaded || baseBlocks.length === 0) return baseBlocks;

    let adjusted = baseBlocks.map(b => ({ ...b }));

    // Apply wake time adjustments
    if (wakeTime === '06:30') {
      // Remove Focus block
      adjusted = adjusted.filter(b => identifyBlock(b.title) !== 'focus');
      // Shift Activation block to 6:30-7:00
      adjusted = adjusted.map(b => {
        if (identifyBlock(b.title) === 'activation') {
          return { ...b, startTime: '06:30', endTime: '07:00' };
        }
        return b;
      });
    }

    // Apply sleep time adjustments
    if (sleepTime === '21:00') {
      // Find evening blocks by title
      const ocioBlock = adjusted.find(b => identifyBlock(b.title) === 'ocio');
      const musicaBlock = adjusted.find(b => identifyBlock(b.title) === 'musica');
      const desactivacionBlock = adjusted.find(b => identifyBlock(b.title) === 'desactivacion');

      adjusted = adjusted.map(b => {
        const type = identifyBlock(b.title);
        if (type === 'ocio' && ocioBlock) {
          return { ...b, startTime: '18:30', endTime: '20:00' };
        }
        if (type === 'musica' && musicaBlock) {
          return { ...b, startTime: '20:00', endTime: '20:30' };
        }
        if (type === 'desactivacion' && desactivacionBlock) {
          return { ...b, startTime: '20:30', endTime: '21:00' };
        }
        return b;
      });
    }

    // Apply late wake
    if (lateWake) {
      const [lateH, lateM] = lateWake.split(':').map(Number);
      const lateMinutes = lateH * 60 + lateM;

      const protectedTypes: string[] = ['activation', 'gym', 'alistamiento', 'lectura'];
      const deepWorkIds = new Set<string>();

      // Find deep work blocks to potentially remove
      adjusted = adjusted.filter(b => {
        const type = identifyBlock(b.title);
        if (type === 'deepwork') {
          const blockStart = parseTime(b.startTime);
          if (blockStart < lateMinutes) {
            deepWorkIds.add(b.id);
            return false;
          }
        }
        return true;
      });

      // Shift protected blocks starting from late wake
      let cursor = lateMinutes;
      adjusted = adjusted.map(b => {
        const type = identifyBlock(b.title);
        if (protectedTypes.includes(type)) {
          const duration = parseTime(b.endTime) - parseTime(b.startTime);
          const newStart = formatTime(cursor);
          const newEnd = formatTime(cursor + duration);
          cursor += duration;
          return { ...b, startTime: newStart, endTime: newEnd };
        }
        return b;
      });
    }

    return adjusted;
  }, [baseBlocks, isLoaded, wakeTime, sleepTime, lateWake]);

  const presetName = useMemo(() => {
    const parts: string[] = [];
    parts.push(wakeTime === '05:00' ? '5AM' : '6:30AM');
    if (wakeTime === '05:00' && !focusBlock) parts.push('sin Focus');
    else if (wakeTime === '05:00' && focusBlock) parts.push('+Focus');
    parts.push(sleepTime === '21:00' ? 'Acuesto 9PM' : 'Acuesto 10:30PM');
    if (lateWake) parts.push(`(desperté ${lateWake})`);
    return parts.join(' · ');
  }, [wakeTime, focusBlock, sleepTime, lateWake]);

  return {
    adjustedBlocks,
    wakeTime, setWakeTime,
    focusBlock, setFocusBlock,
    sleepTime, setSleepTime,
    lateWake, setLateWake,
    presetName,
    isLoaded,
  };
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
