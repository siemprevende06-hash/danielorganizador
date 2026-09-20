import { useCallback, useEffect, useMemo, useState } from "react";
import { format, startOfWeek, startOfMonth, endOfWeek } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { pullPlansIntoLocal } from "@/lib/planSync";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import type { WeekBookSongDistribution } from "@/hooks/useMonthlyPlan";

export type TodayStripItem =
  | {
      kind: "libro";
      id: string;
      title: string;
      cover?: string | null;
      pagesRead: number;
      pagesTotal?: number | null;
    }
  | {
      kind: "cancion";
      id: string;
      title: string;
      instrument: string;
      practiceMinutes?: number | null;
      status: string;
    }
  | {
      kind: "materia";
      subjectId: string;
      name: string;
      doneTasks: number;
      totalTasks: number;
      blockCount: number;
    }
  | {
      kind: "emprendimiento";
      id: string;
      name: string;
      doneTasks: number;
      totalTasks: number;
      blockCount: number;
    }
  | { kind: "proyecto"; id: string; name: string; doneTasks: number; totalTasks: number };

export interface TodayTaskItem {
  id: string;
  title: string;
  done: boolean;
}

export interface TodayFocusData {
  items: Record<string, TodayStripItem>;
  generalTasks: { planned: TodayTaskItem[]; doneCount: number; totalCount: number };
  loading: boolean;
  refresh: () => void;
}

const EMPTY_GENERAL = { planned: [], doneCount: 0, totalCount: 0 };

const isTodayRange = (todayISO: string) => ({
  gte: `${todayISO}T00:00:00`,
  lte: `${todayISO}T23:59:59`,
});

export function useTodayFocusItems(): TodayFocusData {
  const { blocks } = useRoutineBlocksDB();
  const [items, setItems] = useState<Record<string, TodayStripItem>>({});
  const [generalTasks, setGeneralTasks] = useState(EMPTY_GENERAL);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const blockCount = useCallback(
    (focus: string) =>
      blocks.filter(
        b => (b.currentFocus || b.defaultFocus) === focus && b.blockType !== "evitar"
      ).length,
    [blocks]
  );

  const refresh = useCallback(() => setNonce(n => n + 1), []);

  const load = useCallback(async () => {
    const today = new Date();
    const todayISO = format(today, "yyyy-MM-dd");
    const weekKey = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const monthKey = format(startOfMonth(today), "yyyy-MM-dd");

    let plannedProjects: string[] = [];
    let slot: WeekBookSongDistribution | null = null;
    try {
      await pullPlansIntoLocal();
      const raw = localStorage.getItem(`monthly_plan_${monthKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        slot = parsed.week_distribution?.[weekKey] ?? null;
        if (Array.isArray(parsed.projects)) plannedProjects = parsed.projects;
      }
    } catch {
      /* plan local no disponible */
    }

    const rng = isTodayRange(todayISO);

    try {
      const [booksRes, songsRes, uniTasksRes, subjectsRes, empTasksRes, empsRes, generalRes, projectsRes] =
        await Promise.all([
          slot?.books?.length
            ? supabase
                .from("reading_library")
                .select("id, title, cover_image_url, pages_read, pages_total, status")
                .in("id", slot.books)
            : supabase
                .from("reading_library")
                .select("id, title, cover_image_url, pages_read, pages_total, status")
                .eq("status", "reading")
                .order("created_at", { ascending: false })
                .limit(1),
          slot?.songs?.length
            ? supabase
                .from("music_repertoire")
                .select("id, title, instrument, practice_minutes, status")
                .in("id", slot.songs)
            : supabase
                .from("music_repertoire")
                .select("id, title, instrument, practice_minutes, status")
                .eq("status", "learning")
                .limit(1),
          supabase
            .from("tasks")
            .select("id, title, completed, task_type, source_id, due_date")
            .eq("source", "university")
            .eq("task_type", "study")
            .gte("due_date", rng.gte)
            .lte("due_date", rng.lte),
          supabase.from("university_subjects").select("id, name"),
          supabase
            .from("entrepreneurship_tasks")
            .select("id, title, completed, entrepreneurship_id, due_date")
            .gte("due_date", rng.gte)
            .lte("due_date", rng.lte),
          supabase.from("entrepreneurships").select("id, name"),
          supabase
            .from("tasks")
            .select("id, title, completed, source, area_id, due_date")
            .gte("due_date", rng.gte)
            .lte("due_date", rng.lte),
          supabase.from("projects").select("id, title, tasks"),
        ]);

      const next: Record<string, TodayStripItem> = {};

      // ── Lectura: libro de la semana (o el que estoy leyendo) ──
      const books = (booksRes?.data as any[]) || [];
      const libro = books.find(b => b.status !== "completed") ?? books[0];
      if (libro) {
        next.lectura = {
          kind: "libro",
          id: libro.id,
          title: libro.title,
          cover: libro.cover_image_url,
          pagesRead: libro.pages_read || 0,
          pagesTotal: libro.pages_total ?? null,
        };
      }

      // ── Música: canción de la semana (o la que tengo en aprendizaje) ──
      const songs = (songsRes?.data as any[]) || [];
      const cancion = songs.find(s => s.status === "learning") ?? songs[0];
      if (cancion) {
        next.musica = {
          kind: "cancion",
          id: cancion.id,
          title: cancion.title,
          instrument: cancion.instrument || "",
          practiceMinutes: cancion.practice_minutes ?? null,
          status: cancion.status || "learning",
        };
      }

      // ── Universidad: materias con estudio programado hoy + bloques objetivo ──
      const uniRows = (uniTasksRes?.data as any[]) || [];
      const bySubject = new Map<string, { done: number; total: number }>();
      for (const t of uniRows) {
        if (!t.source_id) continue;
        const cur = bySubject.get(t.source_id) || { done: 0, total: 0 };
        cur.total++;
        if (t.completed) cur.done++;
        bySubject.set(t.source_id, cur);
      }
      const subjName = new Map<string, string>(
        ((subjectsRes?.data as any[]) || []).map(s => [s.id, s.name])
      );
      const firstSubject = [...bySubject.entries()].sort((a, b) => b[1].total - a[1].total)[0];
      if (firstSubject) {
        const [sid, st] = firstSubject;
        next.universidad = {
          kind: "materia",
          subjectId: sid,
          name: subjName.get(sid) ?? "Asignatura",
          doneTasks: st.done,
          totalTasks: st.total,
          blockCount: blockCount("universidad"),
        };
      }

      // ── Emprendimiento: negocio con tareas hoy + bloques objetivo ──
      const empRows = (empTasksRes?.data as any[]) || [];
      const empName = new Map<string, string>(
        ((empsRes?.data as any[]) || []).map(e => [e.id, e.name])
      );
      const empById = new Map<string, { done: number; total: number }>();
      for (const t of empRows) {
        if (!t.entrepreneurship_id) continue;
        const cur = empById.get(t.entrepreneurship_id) || { done: 0, total: 0 };
        cur.total++;
        if (t.completed) cur.done++;
        empById.set(t.entrepreneurship_id, cur);
      }
      const firstEmp = [...empById.entries()].sort((a, b) => b[1].total - a[1].total)[0];
      if (firstEmp) {
        const [eid, et] = firstEmp;
        next.emprendimiento = {
          kind: "emprendimiento",
          id: eid,
          name: empName.get(eid) ?? "Emprendimiento",
          doneTasks: et.done,
          totalTasks: et.total,
          blockCount: blockCount("emprendimiento"),
        };
      }

      // ── Proyectos: los del plan del mes con tareas que vencen esta semana ──
      const projRows = (projectsRes?.data as any[]) || [];
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const planned = projRows.filter(p => plannedProjects.includes(p.id));
      const ordered = planned
        .map(p => {
          const tasks = (p.tasks || []) as any[];
          const weekTasks = tasks.filter(t => {
            if (!t.dueDate) return false;
            const d = new Date(`${t.dueDate}T00:00:00`);
            return d >= weekStart && d <= weekEnd;
          });
          return {
            id: p.id,
            name: p.title,
            doneTasks: weekTasks.filter(t => t.completed).length,
            totalTasks: weekTasks.length,
          };
        })
        .sort((a, b) => b.totalTasks - a.totalTasks);
      const proyecto = ordered[0];
      if (proyecto) {
        next.proyectos = { kind: "proyecto", ...proyecto };
      }

      setItems(next);

      // ── Tareas generales de hoy (sin área asignada) ──
      const generalRows = ((generalRes?.data as any[]) || []).filter(
        t => t.source === "general" || (!t.source && !t.area_id)
      );
      setGeneralTasks({
        planned: generalRows.map(t => ({ id: t.id, title: t.title, done: !!t.completed })),
        doneCount: generalRows.filter(t => t.completed).length,
        totalCount: generalRows.length,
      });
    } catch (err) {
      console.warn("[useTodayFocusItems] error:", err);
    } finally {
      setLoading(false);
    }
  }, [blockCount]);

  useEffect(() => {
    load();
  }, [load, nonce]);

  return useMemo(
    () => ({ items, generalTasks, loading, refresh }),
    [items, generalTasks, loading, refresh]
  );
}