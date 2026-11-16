import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Asignaturas y temas de la universidad para planificar el estudio dentro de
 * un bloque (Deep Work). Se cargan de forma ligera: solo lo que necesita el
 * planificador, sin exámenes ni tareas.
 */
export interface StudyTopic {
  id: string;
  title: string;
  orderIndex: number;
}

export interface StudySubject {
  id: string;
  name: string;
  color: string | null;
  year: number;
  semester: number;
  topics: StudyTopic[];
}

interface SubjectRow {
  id: string;
  name: string;
  color: string | null;
  year: number | null;
  semester: number | null;
}

interface TopicRow {
  id: string;
  subject_id: string | null;
  title: string;
  order_index: number | null;
}

interface SettingsRow {
  current_year: number | null;
  current_semester: number | null;
}

function sortTopics(topics: StudyTopic[]): StudyTopic[] {
  return [...topics].sort((a, b) => a.orderIndex - b.orderIndex || a.title.localeCompare(b.title, "es"));
}

export function useStudySubjects() {
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState({ year: 1, semester: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subjectsRes, topicsRes, settingsRes] = await Promise.all([
        supabase.from("university_subjects").select("id, name, color, year, semester"),
        supabase.from("subject_topics").select("id, subject_id, title, order_index"),
        supabase
          .from("university_settings")
          .select("current_year, current_semester")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      if (subjectsRes.error) throw subjectsRes.error;

      const topicsBySubject = new Map<string, StudyTopic[]>();
      ((topicsRes.data ?? []) as TopicRow[]).forEach(row => {
        if (!row.subject_id) return;
        const list = topicsBySubject.get(row.subject_id) ?? [];
        list.push({ id: row.id, title: row.title, orderIndex: row.order_index ?? 0 });
        topicsBySubject.set(row.subject_id, list);
      });

      const mapped: StudySubject[] = ((subjectsRes.data ?? []) as SubjectRow[])
        .map(row => ({
          id: row.id,
          name: row.name,
          color: row.color ?? null,
          year: row.year ?? 1,
          semester: row.semester ?? 1,
          topics: sortTopics(topicsBySubject.get(row.id) ?? []),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "es"));

      const settings = settingsRes.data as SettingsRow | null;
      setPeriod({
        year: settings?.current_year ?? 1,
        semester: settings?.current_semester ?? 1,
      });
      setSubjects(mapped);
      setError(null);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "No se pudieron cargar las asignaturas";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createSubject = useCallback(async (name: string): Promise<StudySubject | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    try {
      const { data, error: insertError } = await supabase
        .from("university_subjects")
        .insert({ name: trimmed, year: period.year, semester: period.semester })
        .select("id, name, color, year, semester")
        .single();

      if (insertError) throw insertError;
      const row = data as SubjectRow;
      const created: StudySubject = {
        id: row.id,
        name: row.name,
        color: row.color ?? null,
        year: row.year ?? period.year,
        semester: row.semester ?? period.semester,
        topics: [],
      };
      setSubjects(previous =>
        [...previous, created].sort((a, b) => a.name.localeCompare(b.name, "es")),
      );
      return created;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear la asignatura");
      return null;
    }
  }, [period.semester, period.year]);

  const createTopic = useCallback(
    async (subjectId: string, title: string): Promise<StudyTopic | null> => {
      const trimmed = title.trim();
      if (!subjectId || !trimmed) return null;

      try {
        const current = subjects.find(subject => subject.id === subjectId);
        const orderIndex = current?.topics.length ?? 0;

        const { data, error: insertError } = await supabase
          .from("subject_topics")
          .insert({
            subject_id: subjectId,
            title: trimmed,
            order_index: orderIndex,
            is_for_final: true,
          })
          .select("id, title, order_index")
          .single();

        if (insertError) throw insertError;
        const row = data as { id: string; title: string; order_index: number | null };
        const created: StudyTopic = {
          id: row.id,
          title: row.title,
          orderIndex: row.order_index ?? orderIndex,
        };

        setSubjects(previous =>
          previous.map(subject =>
            subject.id === subjectId
              ? { ...subject, topics: sortTopics([...subject.topics, created]) }
              : subject,
          ),
        );
        return created;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "No se pudo crear el tema");
        return null;
      }
    },
    [subjects],
  );

  const subjectById = useMemo(
    () => new Map(subjects.map(subject => [subject.id, subject])),
    [subjects],
  );

  return {
    subjects,
    subjectById,
    loading,
    error,
    reload: load,
    createSubject,
    createTopic,
  };
}
