import { formatISO, parseISO, isToday, isYesterday } from "date-fns";
import type { HabitEntry } from "./definitions";

export function calculateStreaks(completedDates: HabitEntry[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (!completedDates || completedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Filter only completed entries and sort from newest to oldest
  const completed = completedDates
    .filter((entry) => entry.status === "completed")
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  if (completed.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate current streak
  let currentStreak = 0;
  const mostRecent = parseISO(completed[0].date);

  // Current streak only counts if most recent is today or yesterday
  if (isToday(mostRecent) || isYesterday(mostRecent)) {
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < completed.length; i++) {
      const entryDate = parseISO(completed[i].date);
      entryDate.setHours(0, 0, 0, 0);

      // Check if this date matches our expected consecutive date
      if (entryDate.getTime() === checkDate.getTime()) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1); // Move back one day
      } else {
        break;
      }
    }
  }

  // Calculate longest streak in history
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 0; i < completed.length - 1; i++) {
    const currentDate = parseISO(completed[i].date);
    const nextDate = parseISO(completed[i + 1].date);

    // Check if dates are consecutive (1 day apart)
    const daysDiff = Math.round(
      (currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}

export function getTodayCompletion(
  habitHistory: { completedDates: HabitEntry[] },
  todayStr: string
): HabitEntry | undefined {
  return habitHistory?.completedDates?.find((entry) => entry.date === todayStr);
}

export function getTodayDuration(
  habitHistory: { completedDates: HabitEntry[] },
  todayStr: string
): number {
  const todayEntry = getTodayCompletion(habitHistory, todayStr);
  return todayEntry?.duration || 0;
}

export function getWeekDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }

  return dates;
}

export function getMonthTotal(
  habitHistory: { completedDates: HabitEntry[] }
): number {
  if (!habitHistory?.completedDates) return 0;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return habitHistory.completedDates
    .filter((entry) => {
      const entryDate = parseISO(entry.date);
      return (
        entry.status === "completed" &&
        entryDate.getMonth() === currentMonth &&
        entryDate.getFullYear() === currentYear
      );
    })
    .reduce((total, entry) => total + (entry.duration || 0), 0);
}
