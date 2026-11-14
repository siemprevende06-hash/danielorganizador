# Migración del dashboard de emprendimiento

**Estado: aplicada y registrada** en el proyecto `fuqmrtenzlslkeqgdjwy` (13 nov 2026). La UI ya no muestra el banner de configuración y todas las secciones están activas.

Si necesitas recrear el entorno desde cero, ejecuta en orden:

1. Abre el SQL Editor del proyecto `fuqmrtenzlslkeqgdjwy`:
   <https://supabase.com/dashboard/project/fuqmrtenzlslkeqgdjwy/sql/new>
2. Ejecuta el contenido completo de:
   `supabase/migrations/20261113000000_entrepreneurship_dashboard.sql`
3. Ejecuta el contenido de:
   `supabase/migrations/20261113010000_entrepreneurship_blue_accent.sql`
4. Recarga `/#/entrepreneurship`. El banner debe desaparecer.
5. Verifica:
   - Crear un gasto y un ingreso en moneda distinta a la base.
   - Crear un cliente y moverlo a “Paga”.
   - Registrar una métrica y un experimento.
   - Marcar criterios de etapa y cambiar de etapa.
   - Guardar una revisión semanal.

Las migraciones son idempotentes: usan `IF NOT EXISTS`, `DROP POLICY IF EXISTS` y `DROP TRIGGER IF EXISTS`.

## Qué crea

- Columnas nuevas en `entrepreneurships` (etapa, moneda, caja, North Star, etc.).
- Columnas `currency`, `exchange_rate` y `customer_id` en `entrepreneurship_income`.
- Tablas `entrepreneurship_expenses`, `entrepreneurship_customers`, `entrepreneurship_metrics`, `entrepreneurship_experiments`, `entrepreneurship_milestones` y `entrepreneurship_reviews`.
- Índices, RLS permisivo (igual que el resto de la app), grants y trigger de `updated_at`.
- Trigger que limpia las filas de `tasks` ligadas a un emprendimiento borrado.
- Acento azul `#3b82f6` por defecto y actualización de los emprendimientos que tenían el morado anterior.

## Rollback

No hay rollback automático. Si necesitas revertir, elimina las tablas nuevas y las columnas agregadas manualmente. Haz un backup antes de ejecutar en producción.