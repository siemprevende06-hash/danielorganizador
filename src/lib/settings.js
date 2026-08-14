import { supabase } from "@/integrations/supabase/client";
// app_settings single-user helpers: user_id is NULL and Postgres treats
// NULLs as distinct, so ON CONFLICT (user_id, setting_key) never fires.
// These use select -> update/insert instead of upsert.
export async function getSetting(key) {
    const { data } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", key)
        .maybeSingle();
    if (!data)
        return null;
    const v = data.setting_value;
    return (v?.value ?? v ?? null);
}
export async function setSetting(key, value) {
    try {
        const { data: existing } = await supabase
            .from("app_settings")
            .select("id")
            .eq("setting_key", key)
            .maybeSingle();
        if (existing?.id) {
            const { error } = await supabase
                .from("app_settings")
                .update({ setting_value: { value }, updated_at: new Date().toISOString() })
                .eq("id", existing.id);
            if (error)
                throw error;
        }
        else {
            const { error } = await supabase
                .from("app_settings")
                .insert({ setting_key: key, setting_value: { value } });
            if (error)
                throw error;
        }
        return true;
    }
    catch (e) {
        console.warn(`setSetting(${key}) failed`, e);
        return false;
    }
}
