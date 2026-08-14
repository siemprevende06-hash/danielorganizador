import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
export const useReminders = () => {
    const [reminders, setReminders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const loadReminders = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('reminders')
                    .select('*')
                    .order('reminder_datetime', { ascending: true });
                if (error)
                    throw error;
                const formattedReminders = data?.map((row) => ({
                    id: row.id,
                    title: row.title,
                    description: row.description || '',
                    dateTime: row.reminder_datetime,
                    completed: row.completed,
                })) || [];
                setReminders(formattedReminders);
            }
            catch (error) {
                console.error('Error loading reminders:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadReminders();
    }, []);
    const addReminder = useCallback(async (reminder) => {
        try {
            const { data, error } = await supabase
                .from('reminders')
                .insert({
                title: reminder.title,
                description: reminder.description,
                reminder_datetime: reminder.dateTime,
                completed: false,
            })
                .select()
                .single();
            if (error)
                throw error;
            const newReminder = {
                id: data.id,
                title: data.title,
                description: data.description || '',
                dateTime: data.reminder_datetime,
                completed: data.completed,
            };
            setReminders(prev => [...prev, newReminder].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()));
            return newReminder;
        }
        catch (error) {
            console.error('Error adding reminder:', error);
            return null;
        }
    }, []);
    const toggleReminder = useCallback(async (reminderId) => {
        const reminder = reminders.find(r => r.id === reminderId);
        if (!reminder)
            return;
        try {
            const { error } = await supabase
                .from('reminders')
                .update({ completed: !reminder.completed })
                .eq('id', reminderId);
            if (error)
                throw error;
            setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, completed: !r.completed } : r));
        }
        catch (error) {
            console.error('Error toggling reminder:', error);
        }
    }, [reminders]);
    const deleteReminder = useCallback(async (reminderId) => {
        try {
            const { error } = await supabase
                .from('reminders')
                .delete()
                .eq('id', reminderId);
            if (error)
                throw error;
            setReminders(prev => prev.filter(r => r.id !== reminderId));
        }
        catch (error) {
            console.error('Error deleting reminder:', error);
        }
    }, []);
    return { reminders, isLoading, addReminder, toggleReminder, deleteReminder };
};
