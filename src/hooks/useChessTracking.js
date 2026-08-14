import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
const todayKey = () => new Date().toISOString().split("T")[0];
export const useChessTracking = () => {
    const [sessions, setSessions] = useState([]);
    const [goals, setGoals] = useState(null);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => {
        setLoading(true);
        const [{ data: ses }, { data: g }] = await Promise.all([
            supabase.from("chess_sessions").select("*").order("session_date", { ascending: false }).limit(200),
            supabase.from("chess_goals").select("*").eq("is_active", true).maybeSingle(),
        ]);
        setSessions(ses || []);
        setGoals(g);
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);
    const addSession = async (s) => {
        const { data, error } = await supabase.from("chess_sessions").insert({
            session_date: s.session_date || todayKey(),
            duration_minutes: s.duration_minutes || 0,
            games_played: s.games_played || 0,
            games_won: s.games_won || 0,
            current_elo: s.current_elo,
            platform: s.platform,
            notes: s.notes,
        }).select().single();
        if (!error && data)
            setSessions(prev => [data, ...prev]);
        return { data, error };
    };
    const upsertGoals = async (g) => {
        if (goals) {
            const { error } = await supabase.from("chess_goals").update(g).eq("id", goals.id);
            if (!error)
                setGoals({ ...goals, ...g });
            return { error };
        }
        else {
            const { data, error } = await supabase.from("chess_goals").insert({
                target_elo: g.target_elo || 1500,
                target_games_per_month: g.target_games_per_month || 30,
                target_minutes_per_day: g.target_minutes_per_day || 30,
                starting_elo: g.starting_elo || 1000,
                notes: g.notes,
                is_active: true,
            }).select().single();
            if (!error && data)
                setGoals(data);
            return { error };
        }
    };
    const deleteSession = async (id) => {
        const { error } = await supabase.from("chess_sessions").delete().eq("id", id);
        if (!error)
            setSessions(prev => prev.filter(s => s.id !== id));
        return { error };
    };
    // Stats helpers
    const today = sessions.filter(s => s.session_date === todayKey());
    const startOfWeek = (() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff)).toISOString().split("T")[0];
    })();
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
    const week = sessions.filter(s => s.session_date >= startOfWeek);
    const month = sessions.filter(s => s.session_date >= startOfMonth);
    const sum = (arr, k) => arr.reduce((a, s) => a + (Number(s[k]) || 0), 0);
    const stats = {
        today: { minutes: sum(today, "duration_minutes"), games: sum(today, "games_played"), wins: sum(today, "games_won") },
        week: { minutes: sum(week, "duration_minutes"), games: sum(week, "games_played"), wins: sum(week, "games_won") },
        month: { minutes: sum(month, "duration_minutes"), games: sum(month, "games_played"), wins: sum(month, "games_won") },
        currentElo: sessions.find(s => s.current_elo)?.current_elo || goals?.starting_elo || 1000,
    };
    return { sessions, goals, loading, addSession, upsertGoals, deleteSession, stats, refetch: load };
};
