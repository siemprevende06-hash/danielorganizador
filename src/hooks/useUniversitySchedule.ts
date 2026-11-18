import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Asignatura mínima para emparejar una clase del horario académico. */
export interface ScheduleSubjectLike {
  id: string;
  name: string;
  code?: string | null;
}

/** Clase ya normalizada del horario académico. */
export interface AcademicClass {
  id: string;
  /** Día original tal como se guardó ("Lunes", "Monday"...). */
  day: string;
  /** 0 = domingo ... 6 = sábado. */
  weekday: number;
  start: string;
  end: string;
  subjectId: string | null;
  subjectName: string;
}

const EMPTY_SUBJECTS: ScheduleSubjectLike[] = [];

const WEEKDAYS: Record<string, number> = {
  domingo: 0,
  dom: 0,
  sunday: 0,
  sun: 0,
  lunes: 1,
  lun: 1,
  monday: 1,
  mon: 1,
  martes: 2,
  mar: 2,
  tuesday: 2,
  tue: 2,
  miercoles: 3,
  mie: 3,
  wednesday: 3,
  wed: 3,
  jueves: 4,
  jue: 4,
  thursday: 4,
  thu: 4,
  viernes: 5,
  vie: 5,
  friday: 5,
  fri: 5,
  sabado: 6,
  sab: 6,
  saturday: 6,
  sat: 6,
};

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function weekdayFromValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 6) {
    return value;
  }
  if (typeof value !== "string") return null;
  const key = normalizeText(value);
  if (key in WEEKDAYS) return WEEKDAYS[key];
  const numeric = Number(key);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 6) return numeric;
  return null;
}

function normalizeTime(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const period = match[3]?.toLowerCase();
  if (period === "pm" && hours < 12) hours += 12;
  if (period === "am" && hours === 12) hours = 0;
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59) {
    return null;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Acepta el JSON guardado en `university_settings.academic_schedule`. */
function parseSchedule(raw: unknown): AcademicClass[] {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];

  const result: AcademicClass[] = [];
  value.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const row = entry as Record<string, unknown>;
    const weekday = weekdayFromValue(row.day ?? row.weekday ?? row.dia);
    const start = normalizeTime(row.start ?? row.startTime ?? row.start_time ?? row.desde);
    const end = normalizeTime(row.end ?? row.endTime ?? row.end_time ?? row.hasta);
    if (weekday == null || !start || !end) return;

    const subjectValue = row.subject ?? row.subjectName ?? row.materia ?? row.subject_name;
    const subjectName = typeof subjectValue === "string" ? subjectValue.trim() : "";
    result.push({
      id: `class-${weekday}-${start.replace(":", "")}-${index}`,
      day: typeof row.day === "string" ? row.day : String(row.day ?? weekday),
      weekday,
      start,
      end,
      subjectId: null,
      subjectName,
    });
  });

  return result.sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start));
}

function findSubject(name: string, subjects: ScheduleSubjectLike[]): ScheduleSubjectLike | null {
  const target = normalizeText(name);
  if (!target || subjects.length === 0) return null;

  const exact = subjects.find(subject =>
    normalizeText(subject.name) === target
    || (subject.code ? normalizeText(subject.code) === target : false),
  );
  if (exact) return exact;

  // Coincidencia parcial: "Cálculo" con "Cálculo I" o al revés.
  if (target.length < 3) return null;
  return subjects.find(subject => {
    const subjectName = normalizeText(subject.name);
    return subjectName.length >= 3 && (subjectName.includes(target) || target.includes(subjectName));
  }) ?? null;
}

/**
 * Carga el horario académico configurado en Universidad y lo cruza con las
 * asignaturas para poder planificar una clase dentro de un bloque.
 */
export function useUniversitySchedule(subjects: ScheduleSubjectLike[] = EMPTY_SUBJECTS) {
  const [parsedSchedule, setParsedSchedule] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("university_settings")
        .select("academic_schedule")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      setParsedSchedule(parseSchedule(data?.academic_schedule));
    } catch (error) {
      console.error("Error loading academic schedule:", error);
      setParsedSchedule([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const schedule = useMemo<AcademicClass[]>(
    () => parsedSchedule.map(entry => {
      const subject = findSubject(entry.subjectName, subjects);
      return {
        ...entry,
        subjectId: subject?.id ?? null,
        subjectName: subject?.name || entry.subjectName,
      };
    }),
    [parsedSchedule, subjects],
  );

  const classesForDate = useCallback(
    (date: Date): AcademicClass[] => {
      const weekday = date.getDay();
      return schedule.filter(entry => entry.weekday === weekday);
    },
    [schedule],
  );

  const classesForWeekday = useCallback(
    (weekday: number): AcademicClass[] => schedule.filter(entry => entry.weekday === weekday),
    [schedule],
  );

  return {
    schedule,
    classesForDate,
    classesForWeekday,
    loading,
    reload,
  };
}
