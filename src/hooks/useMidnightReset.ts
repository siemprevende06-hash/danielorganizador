import { useEffect } from "react";

function getCubaOffsetMinutes(date: Date): number {
  const year = date.getFullYear();
  const mar1 = new Date(year, 2, 1);
  const daysToFirstSunMar = mar1.getDay() === 0 ? 0 : 7 - mar1.getDay();
  const dstStart = new Date(year, 2, 1 + daysToFirstSunMar + 7);
  dstStart.setHours(0, 0, 0, 0);
  const nov1 = new Date(year, 10, 1);
  const daysToFirstSunNov = nov1.getDay() === 0 ? 0 : 7 - nov1.getDay();
  const dstEnd = new Date(year, 10, 1 + daysToFirstSunNov);
  dstEnd.setHours(0, 0, 0, 0);
  const isDST = date >= dstStart && date < dstEnd;
  return isDST ? 240 : 300;
}

export const useMidnightReset = (callback: () => void) => {
  useEffect(() => {
    const schedule = () => {
      const now = new Date();
      const localOffset = now.getTimezoneOffset();
      const cubaOffset = getCubaOffsetMinutes(now);
      const diffMs = (localOffset - cubaOffset) * 60000;
      const cubaNow = new Date(now.getTime() + diffMs);
      const cubaMidnight = new Date(cubaNow);
      cubaMidnight.setDate(cubaMidnight.getDate() + 1);
      cubaMidnight.setHours(0, 0, 0, 0);
      const localMidnight = new Date(cubaMidnight.getTime() - diffMs);
      let ms = localMidnight.getTime() - now.getTime();
      if (ms < 0) ms += 86400000;
      return setTimeout(() => {
        callback();
        schedule();
      }, ms);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, [callback]);
};
