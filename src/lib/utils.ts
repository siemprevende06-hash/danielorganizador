import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { LifeArea, Habit } from "./definitions";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function flattenAreas(areas: LifeArea[]): LifeArea[] {
  const result: LifeArea[] = [];
  
  function flatten(area: LifeArea) {
    result.push(area);
    if (area.subAreas) {
      area.subAreas.forEach(flatten);
    }
  }
  
  areas.forEach(flatten);
  return result;
}

export function findAreaById(areas: LifeArea[], id: string): LifeArea | undefined {
  return flattenAreas(areas).find(area => area.id === id);
}

export function getAllSubAreaIds(area: LifeArea, allAreas: LifeArea[]): string[] {
  const ids: string[] = [area.id];
  
  if (area.subAreas) {
    area.subAreas.forEach(sub => {
      const subArea = allAreas.find(a => a.id === sub.id);
      if (subArea) {
        ids.push(...getAllSubAreaIds(subArea, allAreas));
      }
    });
  }
  
  return ids;
}

export function getEffortLevel(habit: Habit, duration: number) {
  if (!habit.effortLevels) return null;
  
  const sorted = [...habit.effortLevels].sort((a, b) => b.minDuration - a.minDuration);
  
  for (const level of sorted) {
    if (duration >= level.minDuration) {
      return level;
    }
  }
  
  return null;
}
