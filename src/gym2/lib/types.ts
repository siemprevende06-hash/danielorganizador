export type Mode = "reps" | "time" | "cardio";

export interface ExConfig {
  id?: string;
  sets?: number;
  reps?: number;
  weight?: number;
  mode?: Mode;
  bodyweight?: boolean;
  side?: boolean;
  prog?: string;
  inc?: number;
  repsMin?: number;
  repsMax?: number;
  sec?: number;
  min?: number;
  speed?: number;
  sg?: string;
}

export interface Routine {
  id: string;
  name: string;
  emoji: string;
  prog?: string;
  ex: ExConfig[];
}

export interface SetRec {
  w?: number;
  r?: number;
  sec?: number;
  min?: number;
  speed?: number;
  done?: boolean;
  rir?: number;
  rpe?: number;
}

export interface Entry {
  id: string;
  sg?: string;
  n?: string;
  topW?: number | null;
  target?: ExConfig | null;
  plan?: Prescription | null;
  sets: SetRec[];
  asked?: boolean;
}

export interface Workout {
  id: string;
  d: string;
  start: number;
  end: number;
  routineId?: string;
  name: string;
  bw?: number | null;
  vol?: number;
  prs?: string[];
  entries: Entry[];
}

export interface ActiveWorkout {
  id: string;
  d: string;
  start: number;
  routineId?: string;
  name: string;
  bw?: number | null;
  cur: number;
  entries: Entry[];
}

export interface CustomEx {
  id: string;
  n: string;
  bp: string;
  desc?: string;
  tg?: string;
  eq?: string;
  custom?: boolean;
}

export interface BWEntry {
  d: string;
  w: number;
  t: number;
}

export interface ExWeight {
  w: number;
  d: string;
}

export interface GymState {
  unit: "kg" | "lb";
  restSec: number;
  sound: boolean;
  targetW: number | null;
  bodyweight: BWEntry[];
  routines: Routine[];
  week: Record<number, string>;
  dayPlan: Record<string, string>;
  exWeights: Record<string, ExWeight>;
  workouts: Workout[];
  active: ActiveWorkout | null;
  customEx: CustomEx[];
  effort: "none" | "rir" | "rpe" | null;
  showRir?: boolean;
  _ts?: number;
}

export interface Prescription {
  policy: string;
  kind: "off" | "first" | "up" | "hold" | "deload";
  weight?: number;
  reps?: number;
  sec?: number;
  sets?: number;
  why?: string[];
}