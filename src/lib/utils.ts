import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { LifeArea } from "./definitions";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function flattenAreas(areas: LifeArea[]): LifeArea[] {
  const result: LifeArea[] = [];
  for (const area of areas) {
    result.push(area);
    if (area.subAreas?.length) {
      result.push(...flattenAreas(area.subAreas));
    }
  }
  return result;
}

export function findAreaById(areas: LifeArea[], id: string): LifeArea | undefined {
  for (const area of areas) {
    if (area.id === id) return area;
    if (area.subAreas?.length) {
      const found = findAreaById(area.subAreas, id);
      if (found) return found;
    }
  }
  return undefined;
}

export function getAllSubAreaIds(area: LifeArea, _all?: LifeArea[]): string[] {
  const ids: string[] = [area.id];
  if (area.subAreas?.length) {
    for (const sub of area.subAreas) {
      ids.push(...getAllSubAreaIds(sub));
    }
  }
  return ids;
}

export function getEffortLevel(habit: any, todayDuration: number = 0): 'none' | 'low' | 'medium' | 'high' {
  const target = habit?.targetDuration ?? habit?.duration ?? 0;
  if (!todayDuration) return 'none';
  if (!target) return todayDuration > 0 ? 'medium' : 'none';
  const ratio = todayDuration / target;
  if (ratio >= 1) return 'high';
  if (ratio >= 0.5) return 'medium';
  return 'low';
}

export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;

  const normalized = url.toLowerCase();
  const pathOnly = normalized.split("?")[0].split("#")[0];

  return /\.(mp4|webm|ogg|ogv|mov|m4v)$/.test(pathOnly) || normalized.includes("/video/");
}
