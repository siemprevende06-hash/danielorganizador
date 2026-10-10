import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import type { TodayStripItem } from "@/hooks/useTodayFocusItems";

interface BookRow {
  id: string;
  title: string;
  cover_image_url: string | null;
  pages_read: number | null;
  pages_total: number | null;
  status: string | null;
}

interface SongRow {
  id: string;
  title: string;
  instrument: string | null;
  practice_minutes: number | null;
  status: string | null;
}

interface NamedRow {
  id: string;
  name: string;
}

interface TaskRow {
  completed?: boolean;
  source_id?: string | null;
  entrepreneurship_id?: string | null;
}

interface ProjectTask {
  dueDate?: string | null;
  completed?: boolean;
}

interface ProjectRow {
  id: string;
  title: string;
  tasks: unknown;
}

export interface WeekFocusData {
  items: Record<string, TodayStripItem>;
  loading: boolean;
  refresh: () => void;
}

/**
 * Equivalente semanal de `useTodayFocusItems`: devuelve el objetivo de la
 * semana seleccionada por área central (lectura, música, universidad,
 * emprendimiento, proyectos) para mostrarlo en las tarjetas de sistemas
 * semanales, igual que la página Diaria.
 */
export function useWeekFocusItems(startKey: string, endKey: string): WeekFocusData {
  const { blocks } = useRoutineBlocksDB();
  const [items, setItems] = useState<Record<string, TodayStripItem>>({});
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
    const rng = { gte: `${startKey}T00:00:00`, lte: `${endKey}T23:59:59` };
    try {
      const [booksRes, songsRes, uniTasksRes, subjectsRes, empTasksRes, empsRes, projectsRes] =
        await Promise.all([
          supabase
            .from("reading_library")
            .select("id, title, cover_image_url, pages_read, pages_total, status"),
          supabase
            .from("music_repertoire")
            .select("id, title, instrument, practice_minutes, status"),
          supabase
            .from("tasks")
            .select("id, completed, task_type, source_id, due_date")
            .eq("source", "university")
            .eq("task_type", "study")
            .gte("due_date", rng.gte)
            .lte("due_date", rng.lte),
          supabase.from("university_subjects").select("id, name"),
          supabase
            .from("entrepreneurship_tasks")
            .select("id, completed, entrepreneurship_id, due_date")
            .gte("due_date", rng.gte)
            .lte("due_date", rng.lte),
          supabase.from("entrepreneurships").select("id, name"),
          supabase.from("projects").select("id, title, tasks"),
        ]);

      const next: Record<string, TodayStripItem> = {};

      // ── Lectura: libro activo (o el primero) ──
      const books = (booksRes?.data ?? []) as unknown as BookRow[];
      const libro = books.find(b => b.status === "reading") ?? books[0];
      if (libro) {
        next.lectura = {
          kind: "libro",
          id: libro.id,
          title: libro.title,
          cover: libro.cover_image_url,
          pagesRead: libro.pages_read ?? 0,
          pagesTotal: libro.pages_total ?? null,
        };
      }

      // ── Música: canción en aprendizaje (o la primera) ──
      const songs = (songsRes?.data ?? []) as unknown as SongRow[];
      const cancion = songs.find(s => s.status === "learning") ?? songs[0];
      if (cancion) {
        next.musica = {
          kind: "cancion",
          id: cancion.id,
          title: cancion.title,
          instrument: cancion.instrument ?? "",
          practiceMinutes: cancion.practice_minutes ?? 0,
          status: cancion.status ?? "learning",
        };
      }

      // ── Universidad: materia con más tareas de estudio en la semana ──
      const uniRows = (uniTasksRes?.data ?? []) as unknown as TaskRow[];
      const uniById = new Map<string, { done: number; total: number }>();
      for (const t of uniRows) {
        if (!t.source_id) continue;
        const cur = uniById.get(t.source_id) ?? { done: 0, total: 0 };
        cur.total++;
        if (t.completed) cur.done++;
        uniById.set(t.source_id, cur);
      }
      const subjName = new Map<string, string>(
        ((subjectsRes?.data ?? []) as unknown as NamedRow[]).map(s => [s.id, s.name])
      );
      const firstSubject = [...uniById.entries()].sort((a, b) => b[1].total - a[1].total)[0];
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

      // ── Emprendimiento: negocio con más tareas de la semana ──
      const empRows = (empTasksRes?.data ?? []) as unknown as TaskRow[];
      const empName = new Map<string, string>(
        ((empsRes?.data ?? []) as unknown as NamedRow[]).map(e => [e.id, e.name])
      );
      const empById = new Map<string, { done: number; total: number }>();
      for (const t of empRows) {
        if (!t.entrepreneurship_id) continue;
        const cur = empById.get(t.entrepreneurship_id) ?? { done: 0, total: 0 };
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

      // ── Proyectos: tareas con vencimiento dentro de la semana ──
      const projects = (projectsRes?.data ?? []) as unknown as ProjectRow[];
      let bestProject: { id: string; name: string; doneTasks: number; totalTasks: number } | null = null;
      for (const p of projects) {
        const tasks = Array.isArray(p.tasks) ? (p.tasks as ProjectTask[]) : [];
        let done = 0;
        let total = 0;
        for (const t of tasks) {
          const due = t?.dueDate ? String(t.dueDate).slice(0, 10) : null;
          if (!due || due < startKey || due > endKey) continue;
          total++;
          if (t?.completed) done++;
        }
        if (total > 0 && (!bestProject || total > bestProject.totalTasks)) {
          bestProject = { id: p.id, name: p.title, doneTasks: done, totalTasks: total };
        }
      }
      if (bestProject) {
        next.proyectos = { kind: "proyecto", ...bestProject };
      }

      setItems(next);
    } catch (err) {
      console.warn("[useWeekFocusItems] error:", err);
      setItems({});
    } finally {
      setLoading(false);
    }
  }, [startKey, endKey, blockCount]);

  useEffect(() => {
    load();
  }, [load, nonce]);

  return useMemo(() => ({ items, loading, refresh }), [items, loading, refresh]);
}
