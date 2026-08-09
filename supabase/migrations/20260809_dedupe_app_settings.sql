-- Dedupe app_settings (upsert con ON CONFLICT (user_id, setting_key) nunca dispara
-- porque user_id es NULL: Postgres trata NULLs como distintos) y prevenir duplicados
delete from public.app_settings a
using public.app_settings b
where a.setting_key = b.setting_key
  and a.user_id is not distinct from b.user_id
  and (a.updated_at < b.updated_at or (a.updated_at = b.updated_at and a.id < b.id));

create unique index if not exists app_settings_setting_key_uidx
  on public.app_settings (setting_key)
  where user_id is null;