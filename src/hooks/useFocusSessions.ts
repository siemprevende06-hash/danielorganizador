import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FocusSession {
  id: string;
  user_id: string | null;
  task_id: string | null;
  task_title: string;
  task_area: string | null;
  block_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  completed: boolean;
  notes: string | null;
  created_at: string;
}

export const useFocusSessions = () => {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions((data as FocusSession[]) || []);
      
      // Check for active session
      const active = data?.find(s => !s.end_time);
      if (active) setActiveSession(active as FocusSession);
    } catch (error) {
      console.error('Error fetching focus sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const startSession = async (taskTitle: string, taskId?: string, taskArea?: string, blockId?: string) => {
    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          task_title: taskTitle,
          task_id: taskId || null,
          task_area: taskArea || null,
          block_id: blockId || null,
          start_time: new Date().toISOString(),
          duration_minutes: 0,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      const session = data as FocusSession;
      setActiveSession(session);
      setSessions(prev => [session, ...prev]);
      
      toast({
        title: "Sesión iniciada",
        description: `Enfocándote en: ${taskTitle}`,
      });
      
      return session;
    } catch (error) {
      console.error('Error starting focus session:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar la sesión",
        variant: "destructive",
      });
      return null;
    }
  };

  const endSession = async (sessionId: string, completed: boolean = true, notes?: string) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;

      const endTime = new Date();
      const startTime = new Date(session.start_time);
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      const { error } = await supabase
        .from('focus_sessions')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
          completed,
          notes: notes || null,
        })
        .eq('id', sessionId);

      if (error) throw error;

      setActiveSession(null);
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, end_time: endTime.toISOString(), duration_minutes: durationMinutes, completed, notes: notes || null }
          : s
      ));

      toast({
        title: completed ? "¡Sesión completada!" : "Sesión terminada",
        description: `Duración: ${durationMinutes} minutos`,
      });
    } catch (error) {
      console.error('Error ending focus session:', error);
      toast({
        title: "Error",
        description: "No se pudo finalizar la sesión",
        variant: "destructive",
      });
    }
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.created_at.startsWith(today));
    const totalMinutes = todaySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    const completedSessions = todaySessions.filter(s => s.completed).length;
    
    return {
      totalMinutes,
      sessionsCount: todaySessions.length,
      completedSessions,
    };
  };

  const getWeekStats = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekSessions = sessions.filter(s => new Date(s.created_at) >= weekAgo);
    const totalMinutes = weekSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    const longestSession = Math.max(...weekSessions.map(s => s.duration_minutes || 0), 0);
    
    return {
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      sessionsCount: weekSessions.length,
      longestSession,
    };
  };

  return {
    sessions,
    activeSession,
    loading,
    startSession,
    endSession,
    getTodayStats,
    getWeekStats,
    refetch: fetchSessions,
  };
};
