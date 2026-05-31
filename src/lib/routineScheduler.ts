import { RoutineBlock } from "@/components/RoutineBlockCard";

export interface MorningScheduleConfig {
  wakeTime: string;
  morningEndTime: string;
  adjustedBlocks: RoutineBlock[];
}

// IDs of morning blocks (before 9:00 AM)
const MORNING_BLOCK_IDS = ["1", "2", "3", "4", "5", "6", "7"];

// Default morning blocks with original times
const DEFAULT_MORNING_BLOCKS: RoutineBlock[] = [
  { id: "1", title: "Rutina Activación", time: "5:00 - 5:30", startTime: "05:00", endTime: "05:30", duration: 30, tasks: [], currentStreak: 0, maxStreak: 0, weeklyCompletion: [] },
  { id: "2", title: "Idiomas + Lectura", time: "5:30 - 7:00", startTime: "05:30", endTime: "07:00", duration: 90, tasks: [], currentStreak: 0, maxStreak: 0, weeklyCompletion: [] },
  { id: "3", title: "Gym", time: "7:00 - 8:00", startTime: "07:00", endTime: "08:00", duration: 60, tasks: [], currentStreak: 0, maxStreak: 0, weeklyCompletion: [] },
  { id: "4", title: "Alistamiento + Desayuno", time: "8:00 - 8:30", startTime: "08:00", endTime: "08:30", duration: 30, tasks: [], currentStreak: 0, maxStreak: 0, weeklyCompletion: [] },
  { id: "5", title: "Viaje CUJAE + Podcast", time: "8:30 - 9:00", startTime: "08:30", endTime: "09:00", duration: 30, tasks: [], currentStreak: 0, maxStreak: 0, weeklyCompletion: [] },
];

const ORIGINAL_TOTAL_MINUTES = 240; // 5:00 AM - 9:00 AM

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function calculateMorningSchedule(
  wakeTime: string,
  fixedEndTime: string = "09:00",
  existingBlocks: RoutineBlock[]
): MorningScheduleConfig {
  const wakeMinutes = timeToMinutes(wakeTime);
  const endMinutes = timeToMinutes(fixedEndTime);
  const availableMinutes = endMinutes - wakeMinutes;

  // Calculate compression/expansion factor
  const adjustmentFactor = availableMinutes / ORIGINAL_TOTAL_MINUTES;

  // Get morning blocks from existing blocks or use defaults
  const morningBlocks = existingBlocks.filter(block => 
    MORNING_BLOCK_IDS.includes(block.id)
  );

  const blocksToAdjust = morningBlocks.length > 0 ? morningBlocks : DEFAULT_MORNING_BLOCKS;

  // Adjust each block proportionally
  let currentTime = wakeMinutes;
  const adjustedBlocks: RoutineBlock[] = blocksToAdjust.map(block => {
    const originalDuration = block.duration || 30;
    const adjustedDuration = Math.round(originalDuration * adjustmentFactor);
    
    const startTime = minutesToTime(currentTime);
    currentTime += adjustedDuration;
    const endTime = minutesToTime(currentTime);

    return {
      ...block,
      time: `${startTime} - ${endTime}`,
      duration: adjustedDuration,
      isAdjusted: true,
      adjustmentFactor: adjustmentFactor,
    };
  });

  return {
    wakeTime,
    morningEndTime: fixedEndTime,
    adjustedBlocks,
  };
}

export function applyMorningAdjustment(
  allBlocks: RoutineBlock[],
  config: MorningScheduleConfig
): RoutineBlock[] {
  const adjustedBlockMap = new Map(
    config.adjustedBlocks.map(block => [block.id, block])
  );

  return allBlocks.map(block => {
    if (MORNING_BLOCK_IDS.includes(block.id)) {
      return adjustedBlockMap.get(block.id) || block;
    }
    return block;
  });
}

export function getTimeComparison(wakeTime: string) {
  const defaultWakeMinutes = timeToMinutes("05:00");
  const actualWakeMinutes = timeToMinutes(wakeTime);
  const difference = actualWakeMinutes - defaultWakeMinutes;
  
  if (difference > 0) {
    return {
      type: 'late' as const,
      minutes: difference,
      message: `${difference} minutos menos que lo planificado`,
    };
  } else if (difference < 0) {
    return {
      type: 'early' as const,
      minutes: Math.abs(difference),
      message: `${Math.abs(difference)} minutos más que lo planificado`,
    };
  }
  
  return {
    type: 'ontime' as const,
    minutes: 0,
    message: 'A tiempo según lo planificado',
  };
}
