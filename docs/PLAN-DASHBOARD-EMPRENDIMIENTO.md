# Plan: Business Command Center (rediseño de Emprendimiento)

> Objetivo: convertir `/entrepreneurship` en un dashboard SaaS moderno, visual y funcional que cubra **todas las etapas** del negocio: idea, validación, MVP, tracción, ingresos y escalado.

---

## 1. Resumen ejecutivo

Hoy la sección de Emprendimiento es una **lista de proyectos con 4 contadores**. No tiene gráficas, no distingue etapas, no mide gastos, clientes, embudo ni salud del negocio. El plan propone:

1. **Modelo de datos de negocio real** (etapa, métricas, gastos, clientes, experimentos, hitos, revisiones semanales).
2. **Dashboard por emprendimiento** con KPIs, gráficas y un *health score* compuesto.
3. **Vista de portafolio** para comparar todos los emprendimientos.
4. **Motor de etapas**: cada etapa con criterios de salida medibles y su North Star metric.
5. **Estética tech/SaaS**: bento grid, glass cards, gradientes por proyecto, animaciones sutiles y modo oscuro impecable.
6. **Integración** con tareas, sesiones de foco, metas y finanzas que ya existen en la app.

Resultado esperado: abrir la página y en 5 segundos saber *dónde estás, cuánto dinero entra y sale, qué te falta para la siguiente etapa y qué hacer esta semana*.

---

## 2. Diagnóstico del estado actual

### Lo que existe

| Archivo | Qué hace | Limitación |
|---|---|---|
| `src/pages/Entrepreneurship.tsx` | Grid de tarjetas + 4 stats (tareas, %, ingresos, tiempo) | Sin gráficas, sin etapas, sin gastos, sin clientes. Consultas N+1 |
| `src/pages/EntrepreneurshipDetail.tsx` | Tabs: Tareas, Mejoras, Objetivos, Ingresos | Solo listas; sin métricas ni tendencias. `TaskCard` definido dentro del componente |
| Tablas | `entrepreneurships`, `entrepreneurship_tasks`, `subtasks`, `entrepreneurship_goals`, `entrepreneurship_income` | Sin etapa, sin moneda, sin gastos, sin clientes, sin KPIs históricos |

### Problemas concretos detectados

1. **Rendimiento**: `load()` en `Entrepreneurship.tsx` ejecuta 6 consultas *por cada* emprendimiento (`Promise.all` dentro de un `map`). Con 5 proyectos son 31 peticiones. Debe resolverse con 4–6 consultas totales usando `IN (...)` y agregación en JS (o una vista/RPC).
2. **Moneda**: `entrepreneurship_income` no guarda `currency`. La app de finanzas sí maneja `USD`/`CUP` y tasa de cambio (`user_settings.exchange_rate`, por defecto 360). Los ingresos del negocio se muestran como `$` sin contexto.
3. **Sin costos**: no hay gastos, por lo tanto no hay *burn rate*, margen ni *runway*. Imposible saber si el negocio es rentable.
4. **Sin clientes/mercado**: no hay leads, trials, pagos, churn ni retención. El embudo no se puede medir.
5. **Sin etapa**: todos los proyectos se ven iguales; no hay criterios de avance ni roadmap.
6. **Deuda de UI**: `TaskCard` se declara dentro del render (se remonta en cada cambio, pierde foco del input). El detalle no tiene estado 404: si el `id` no existe, el spinner queda infinito.
7. **Datos huérfanos**: al borrar un emprendimiento se borran sus `entrepreneurship_tasks` por cascada, pero las filas de `tasks` (`source='entrepreneurship'`) quedan colgando con un `source_id` inexistente.
8. **Sin estados vacíos ricos**: las gráficas futuras necesitan datos; hoy no hay estrategia de onboarding ni modo demo.

---

## 3. Concepto: de "lista de proyectos" a "Business OS"

```
┌──────────────────────────────────────────────────────────────────────┐
│  Emprendimientos            [ Portafolio ]  [ + Nuevo ]             │
│  3 activos · MRR $1,240 · Runway 7.2 meses · Salud 68/100           │
├──────────────────────────────────────────────────────────────────────┤
│  [Pipeline de etapas: Idea → Validación → MVP → Tracción → $$ → Scale]│
├──────────────────────────────────────────────────────────────────────┤
│  Tarjeta del venture (cover + accent)                                │
│  ┌────────┬────────┬────────┬────────┐                               │
│  │ MRR ▲  │ Runway │ Clientes│ Crec.  │  ← KPI cards con sparkline   │
│  └────────┴────────┴────────┴────────┘                               │
│  ┌──────────────────────────┬─────────┐                              │
│  │ Ingresos vs gastos (12m) │ Gastos  │                              │
│  └──────────────────────────┴─────────┘                              │
│  ┌────────────────────────────────────┐                              │
│  │ Etapa actual + criterios de salida │                              │
│  └────────────────────────────────────┘                              │
└──────────────────────────────────────────────────────────────────────┘
```

**Principio rector**: cada tarjeta responde una pregunta de negocio y ofrece una acción (registrar ingreso, gasto, cliente, experimento). Nada es solo decorativo.

---

## 4. Etapas del emprendimiento (modelo de madurez)

Seis etapas + pausa. Cada una define **criterios de salida** (checklist persistida) y una **North Star metric**.

| # | Etapa | Pregunta clave | North Star | Criterios de salida (ejemplo) |
|---|---|---|---|---|
| 0 | **Idea** | ¿Vale la pena? | Entrevistas/semana | 10 entrevistas · problema documentado · 3 segmentos priorizados |
| 1 | **Validación** | ¿Alguien lo pagaría? | Cartas de intención | 5 entrevistas de dolor · 3 preventas o cartas · propuesta de valor escrita |
| 2 | **MVP** | ¿Funciona? | Usuarios activos | Flujo principal usable · 5 usuarios reales · 10 feedbacks accionables |
| 3 | **Tracción** | ¿Vuelven? | Retención semanal | 10 clientes activos o 100 usuarios · retención 4 semanas ≥ 30% · canal repetible |
| 4 | **Ingresos / PMF** | ¿Es negocio? | MRR | MRR > 0 · 3 meses de crecimiento · churn mensual < 10% · margen bruto > 50% |
| 5 | **Escalado** | ¿Aguanta? | Net Revenue Retention | Procesos documentados · CAC/LTV < 1/3 · runway > 6 meses · equipo o automatización |

Reglas:

- La etapa se cambia manualmente, pero el dashboard **bloquea/bloquea suavemente** el avance si los criterios están incompletos (aviso, no impedimento).
- Cada etapa tiene un color y un ícono; el pipeline del portafolio se colorea según la etapa.
- Etapa `paused` para proyectos dormidos, con motivo y fecha de revisión.

Archivo nuevo: `src/lib/entrepreneurship/stages.ts` con `STAGES`, `STAGE_META`, `STAGE_EXIT_ITEMS`, `getStageProgress()`.

---

## 5. Arquitectura de información

### Rutas

| Ruta | Pantalla |
|---|---|
| `/entrepreneurship` | **Portafolio**: KPIs consolidados, pipeline por etapa, tabla comparativa |
| `/entrepreneurship/:id` | **Dashboard del venture** (tabs con deep-link `?tab=`) |
| `/entrepreneurship/:id?tab=finance` | Finanzas |
| `/entrepreneurship/:id?tab=customers` | Clientes y embudo |
| `/entrepreneurship/:id?tab=experiments` | Experimentos |
| `/entrepreneurship/:id?tab=product` | Producto / backlog |
| `/entrepreneurship/:id?tab=review` | Revisión semanal (CEO log) |

### Pestañas del dashboard

1. **Resumen** — hero, KPIs, gráficas, etapa, próximas acciones.
2. **Finanzas** — ingresos, gastos, MRR, burn, runway, márgenes, tabla de movimientos.
3. **Clientes** — embudo, cohortes, tabla de clientes, churn.
4. **Métricas** — series por KPI, formulario de snapshot, comparativas.
5. **Producto** — tareas normales, mejoras, hitos, subtareas (lo actual, mejorado).
6. **Experimentos** — hipótesis → resultado → aprendizaje.
7. **Revisión semanal** — wins, bloqueos, foco, confianza 1–10, snapshot de métricas.
8. **Bitácora** (opcional) — decisiones y notas fechadas.

En móvil, tabs con scroll horizontal; el contenido prioritario va primero.

---

## 6. Modelo de datos

### 6.1 Extender `entrepreneurships`

```sql
ALTER TABLE public.entrepreneurships
  ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'idea'
    CHECK (stage IN ('idea','validation','mvp','traction','revenue','scale','paused')),
  ADD COLUMN IF NOT EXISTS business_model TEXT,
  ADD COLUMN IF NOT EXISTS target_market TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD'
    CHECK (currency IN ('USD','CUP')),
  ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT '#8b5cf6',
  ADD COLUMN IF NOT EXISTS cash_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_goal NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS north_star_key TEXT,
  ADD COLUMN IF NOT EXISTS north_star_target NUMERIC,
  ADD COLUMN IF NOT EXISTS started_at DATE,
  ADD COLUMN IF NOT EXISTS stage_entered_at DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_entrepreneurships_stage
  ON public.entrepreneurships(stage) WHERE archived = false;
```

> `cash_balance` es la caja real del negocio (se actualiza con un botón "Actualizar caja"). No se deriva del P&L porque caja ≠ utilidad.

### 6.2 Nuevas tablas

```sql
-- Ingresos: añadir moneda y tasa histórica
ALTER TABLE public.entrepreneurship_income
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD'
    CHECK (currency IN ('USD','CUP')),
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12,2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS customer_id UUID;

-- Gastos
CREATE TABLE IF NOT EXISTS public.entrepreneurship_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneurship_id UUID NOT NULL REFERENCES public.entrepreneurships(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD','CUP')),
  exchange_rate NUMERIC(12,2) NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'operating',
  expense_kind TEXT NOT NULL DEFAULT 'opex' CHECK (expense_kind IN ('cogs','opex')),
  vendor TEXT,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clientes y embudo
CREATE TABLE IF NOT EXISTS public.entrepreneurship_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneurship_id UUID NOT NULL REFERENCES public.entrepreneurships(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  segment TEXT,
  status TEXT NOT NULL DEFAULT 'lead'
    CHECK (status IN ('lead','contacted','demo','trial','paying','churned')),
  plan TEXT,
  mrr NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD','CUP')),
  source TEXT,
  started_at DATE,
  churned_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Snapshots de métricas (upsert por día)
CREATE TABLE IF NOT EXISTS public.entrepreneurship_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneurship_id UUID NOT NULL REFERENCES public.entrepreneurships(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'count',
  period_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','derived','import')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entrepreneurship_id, metric_key, period_date)
);

-- Experimentos
CREATE TABLE IF NOT EXISTS public.entrepreneurship_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneurship_id UUID NOT NULL REFERENCES public.entrepreneurships(id) ON DELETE CASCADE,
  hypothesis TEXT NOT NULL,
  channel TEXT,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned','running','done','discarded')),
  start_date DATE,
  end_date DATE,
  cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD','CUP')),
  result TEXT,
  learning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hitos y criterios de salida de etapa
CREATE TABLE IF NOT EXISTS public.entrepreneurship_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneurship_id UUID NOT NULL REFERENCES public.entrepreneurships(id) ON DELETE CASCADE,
  template_key TEXT,
  title TEXT NOT NULL,
  stage TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'exit' CHECK (kind IN ('exit','milestone','product')),
  target_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entrepreneurship_id, template_key)
);

-- Revisión semanal
CREATE TABLE IF NOT EXISTS public.entrepreneurship_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneurship_id UUID NOT NULL REFERENCES public.entrepreneurships(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  wins TEXT,
  blockers TEXT,
  next_focus TEXT,
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 10),
  mrr_snapshot NUMERIC(14,2),
  users_snapshot INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entrepreneurship_id, week_start)
);
```

Índices mínimos:

```sql
CREATE INDEX IF NOT EXISTS idx_ent_expenses_ent_date ON public.entrepreneurship_expenses(entrepreneurship_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_ent_customers_ent_status ON public.entrepreneurship_customers(entrepreneurship_id, status);
CREATE INDEX IF NOT EXISTS idx_ent_metrics_ent_key_date ON public.entrepreneurship_metrics(entrepreneurship_id, metric_key, period_date DESC);
CREATE INDEX IF NOT EXISTS idx_ent_experiments_ent_status ON public.entrepreneurship_experiments(entrepreneurship_id, status);
CREATE INDEX IF NOT EXISTS idx_ent_milestones_ent_stage ON public.entrepreneurship_milestones(entrepreneurship_id, stage);
```

RLS: misma política pública que el resto (`FOR ALL USING (true) WITH CHECK (true)`) para no romper el modo sin auth. Si más adelante hay login, se migra a `user_id = auth.uid()`.

### 6.3 Tipos y regeneración

- Añadir las interfaces a `src/integrations/supabase/types.ts` (o regenerar con `supabase gen types typescript`).
- Definir modelos de dominio en `src/lib/entrepreneurship/types.ts` (no usar `any`).
- Migración nueva en `supabase/migrations/<timestamp>_entrepreneurship_dashboard.sql`.

---

## 7. Métricas y fórmulas

Todas las cifras se calculan en `src/lib/entrepreneurship/metrics.ts` (funciones puras, testeables). Moneda base del venture; conversión con la tasa guardada en cada movimiento.

| Métrica | Fórmula | Notas |
|---|---|---|
| **Ingresos del mes** | Σ ingresos con `income_date` en el mes | Convertir a moneda base |
| **Gastos del mes** | Σ gastos del mes | Ídem |
| **Utilidad** | Ingresos − Gastos | Mostrar margen % |
| **Margen bruto** | (Ingresos − COGS) / Ingresos | COGS = `expense_kind='cogs'` |
| **MRR** | Σ `mrr` de clientes `status='paying'` | Fallback: promedio de ingresos últimos 3 meses |
| **ARPU** | MRR / clientes pagos | |
| **Churn mensual** | Bajas del mes / activos al inicio | |
| **LTV** | ARPU × margen bruto / churn | |
| **CAC** | (gastos marketing + coste experimentos) / clientes nuevos | |
| **LTV:CAC** | LTV / CAC | Sano ≥ 3 |
| **Burn rate** | Promedio de gastos últimos 3 meses | |
| **Net burn** | Gastos − ingresos (promedio 3m) | |
| **Runway** | `cash_balance` / net burn | Si net burn ≤ 0 → ∞ ("rentable") |
| **Crecimiento MoM** | MRR mes / MRR mes anterior − 1 | |
| **Conversión de embudo** | pagos / leads | Por etapa del embudo |
| **Retención** | clientes activos mes N / cohorte inicial | Tabla de cohortes |
| **Horas de foco** | Σ `duration_minutes` de `focus_sessions` ligadas a tareas del venture / 60 | Ya existe el vínculo |
| **Throughput** | tareas completadas por semana | |
| **Edad del backlog** | días desde `created_at` de tareas abiertas | Alerta > 30 días |
| **Health score** | Ver abajo | 0–100 |

### Health score (0–100)

```
finance   = 40·norm(runway, 0→6m) + 30·norm(growthMoM, 0→15%) + 30·norm(margenBruto, 0→60%)
product   = 40·hitosOnTime + 30·tendenciaThroughput + 30·norm(backlogAging, 30d→0d)
market    = 40·conversion + 40·retención + 20·señalPMF
execution = 50·norm(horasFoco, 0→metaSemanal) + 30·revisionesHechas + 20·experimentosActivos
health    = 0.30·finance + 0.25·product + 0.25·market + 0.20·execution
```

Umbrales: **≥ 70 verde**, **40–69 ámbar**, **< 40 rojo**. Mostrar desglose en tooltip y en un radar.

Cada etapa pondera distinto (ej.: en Validación, `market` pesa 40%; en Ingresos, `finance` pesa 40%). Tabla de pesos en `stages.ts`.

### North Star por etapa

`STAGE_META[stage].northStarKey` define qué KPI grande se muestra en el hero: entrevistas, preventas, usuarios activos, retención, MRR o NRR.

---

## 8. Sistema de diseño "tech SaaS"

### Lenguaje visual

- **Bento grid** de 12 columnas, gaps de 12–16 px, tarjetas con radios `rounded-2xl`.
- **Glass sutil**: `bg-card/60 backdrop-blur-xl border-border/60` + highlight interior `shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06)]`.
- **Acento por venture**: `accent_color` inyectado como CSS var (`--venture`) y usado en glow, chip de etapa, sparkline y botón primario local.
- **Glow de fondo**: gradiente radial muy suave detrás del hero (`radial-gradient(60% 60% at 20% 0%, hsl(var(--venture)/0.18), transparent)`).
- **Datos primero**: números grandes `text-3xl font-semibold tabular-nums tracking-tight`, etiquetas `text-xs uppercase tracking-wide text-muted-foreground`.
- **Jerarquía**: un solo CTA sólido por pantalla ("Registrar movimiento"); el resto `outline`/`ghost`.
- **Motion**: `animate-in fade-in slide-in-from-bottom-2` con delays escalonados (50 ms), hover `-translate-y-0.5`, respetar `prefers-reduced-motion`.

### Paleta de gráficas

| Uso | Color |
|---|---|
| Ingresos / positivo | `hsl(160 84% 39%)` (emerald) |
| Gastos / negativo | `hsl(0 72% 51%)` (red) |
| MRR / foco | `hsl(265 80% 55%)` (violet) |
| Clientes / info | `hsl(210 90% 55%)` (blue) |
| Alertas / warning | `hsl(38 92% 50%)` (amber) |
| Neutro de ejes | `hsl(var(--muted-foreground))` con opacidad |

Reglas: máximo 5 series por gráfica, tooltips con `Intl.NumberFormat('es-ES')`, leyenda solo si hay ≥ 2 series, grid horizontal tenue, sin 3D.

### Componentes base

- `ChartContainer` de `src/components/ui/chart.tsx` (ya existe) + `ChartTooltip`, `ChartLegend`.
- `Card`, `Tabs`, `Badge`, `Progress`, `Dialog`, `Sheet`, `Skeleton`, `Tooltip`, `Select`, `Switch`.
- Recharts 3.3 ya instalado. No agregar dependencias nuevas salvo que sea imprescindible.

### Responsive

- 360 px: una columna, KPIs en carrusel horizontal con snap, tabs scrollables, gráficas a 220 px de alto.
- 768 px: 2 columnas.
- 1280 px: bento completo (hero 8/12 + salud 4/12; gráfica 8/12 + donut 4/12).
- Sidebar/nav existente intacto; `pb-24` para no chocar con la barra inferior.

### Accesibilidad

- Contraste AA, `aria-label` en iconos-acción, foco visible, gráficas con tabla/resumen textual (`sr-only`), no depender solo del color (usar íconos y etiquetas).

---

## 9. Estructura de archivos propuesta

```
src/
├── pages/
│   ├── Entrepreneurship.tsx              # Portafolio (reescritura)
│   └── EntrepreneurshipDetail.tsx        # Dashboard del venture (reescritura)
├── components/entrepreneurship/
│   ├── portfolio/
│   │   ├── PortfolioHeader.tsx
│   │   ├── PortfolioKpis.tsx
│   │   ├── StagePipeline.tsx
│   │   ├── VentureCard.tsx
│   │   └── VentureComparisonTable.tsx
│   ├── dashboard/
│   │   ├── VentureHero.tsx
│   │   ├── KpiGrid.tsx
│   │   ├── KpiCard.tsx
│   │   ├── HealthScoreRing.tsx
│   │   ├── StageTracker.tsx
│   │   ├── NextBestActions.tsx
│   │   └── QuickActions.tsx
│   ├── charts/
│   │   ├── RevenueExpenseChart.tsx
│   │   ├── MrrTrendChart.tsx
│   │   ├── ExpenseBreakdownChart.tsx
│   │   ├── FunnelChart.tsx
│   │   ├── RunwayGauge.tsx
│   │   ├── FocusHeatmap.tsx
│   │   ├── TaskThroughputChart.tsx
│   │   ├── HealthRadar.tsx
│   │   ├── CohortRetentionTable.tsx
│   │   └── Sparkline.tsx
│   ├── finance/
│   │   ├── FinanceTab.tsx
│   │   ├── MovementDialog.tsx
│   │   └── MovementsTable.tsx
│   ├── customers/
│   │   ├── CustomersTab.tsx
│   │   ├── CustomerDialog.tsx
│   │   └── CustomerTable.tsx
│   ├── metrics/
│   │   ├── MetricsTab.tsx
│   │   └── MetricSnapshotDialog.tsx
│   ├── experiments/
│   │   ├── ExperimentsTab.tsx
│   │   └── ExperimentDialog.tsx
│   ├── product/
│   │   ├── ProductTab.tsx
│   │   ├── TaskCard.tsx                   # extraído, memoizado
│   │   └── MilestonesList.tsx
│   └── review/
│       ├── WeeklyReviewTab.tsx
│       └── ReviewDialog.tsx
├── hooks/
│   ├── useEntrepreneurshipPortfolio.ts
│   ├── useVentureDashboard.ts
│   ├── useVentureFinance.ts
│   ├── useVentureCustomers.ts
│   ├── useVentureMetrics.ts
│   ├── useVentureExperiments.ts
│   ├── useVentureMilestones.ts
│   └── useWeeklyReview.ts
└── lib/entrepreneurship/
    ├── types.ts
    ├── stages.ts
    ├── metrics.ts
    ├── health.ts
    ├── currency.ts
    ├── formatters.ts
    ├── nextActions.ts
    └── queryKeys.ts
```

---

## 10. Especificación del dashboard

### 10.1 Portafolio (`/entrepreneurship`)

**Header**
- Título + subtítulo: "N negocios · X activos".
- CTA "Nuevo emprendimiento".
- Selector de periodo (mes actual / últimos 30 días / trimestre) para los KPIs.

**KPI consolidados (4–6)**
- MRR total, Ingresos del periodo, Runway promedio, Clientes pagos, Salud promedio, Horas de foco.
- Cada uno con delta vs periodo anterior y sparkline.

**Pipeline de etapas**
- Barra horizontal segmentada (Idea → Escalado) con conteo por etapa.
- Click filtra las tarjetas.
- Debajo, carrusel/grid de tarjetas por etapa (drag & drop opcional para cambiar etapa; si no, menú).

**Tarjeta de venture (rediseñada)**
- Cover con gradiente del accent + chip de etapa + estrella de "activo".
- Nombre, descripción de una línea.
- Norte: North Star con valor/target.
- Mini KPIs: MRR, clientes, runway, salud.
- Sparkline de ingresos 6 meses.
- Barra de progreso de la etapa actual (criterios cumplidos).
- Acciones rápidas: abrir dashboard, editar, archivar.

**Tabla comparativa**
- Columnas ordenables: Venture, Etapa, MRR, Crecimiento, Clientes, Churn, Runway, Salud, Última actividad.
- En móvil se convierte en tarjetas compactas.

**Empty state**
- Ilustración + "Crea tu primer negocio" + 3 pasos (define la idea, registra un ingreso, elige etapa).

### 10.2 Dashboard del venture (tab Resumen)

**Hero**
- Cover, nombre editable, chip de etapa (click → cambiar), accent color.
- `HealthScoreRing` 0–100 con desglose (tooltip/popover).
- North Star grande: valor actual, target, delta.
- Botón "Registrar" (menú: ingreso, gasto, cliente, métrica) + "Revisión semanal".

**KPIs (4)**
1. MRR + sparkline 6m + delta MoM.
2. Runway (meses) + semáforo + "caja actual".
3. Clientes pagos + nuevos del mes.
4. Utilidad del mes + margen %.

**Gráficas**
- **Ingresos vs gastos** (área apilada, 12 meses) con línea de utilidad. Insight automático: "Gastas 1.8× lo que ingresas".
- **Gastos por categoría** (donut) con total y top categoría.
- **Embudo** (barras horizontales): leads → contactados → demo → trial → pagos, con conversión entre pasos.
- **Runway** (gauge radial) + burn mensual.
- **Foco** (heatmap tipo GitHub, 12 semanas) + horas de la semana.
- **Throughput** (barras semanales completadas vs creadas).
- **Radar de salud** (5 ejes: Finanzas, Producto, Mercado, Ejecución, Equipo) opcional.

**Stage tracker**
- Stepper horizontal con la etapa actual resaltada.
- Checklist de criterios de salida: checkbox persistido en `entrepreneurship_milestones`.
- Barra "X/Y criterios · 60%".
- Botón "Avanzar a <siguiente etapa>" con confirmación y aviso de criterios pendientes.

**Próximas acciones (Next Best Actions)**
Motor de reglas en `nextActions.ts`, máximo 3 tarjetas:
- Runway < 4 meses → "Reduce gastos o define plan de ingresos".
- Tareas abiertas > 30 días → "Limpia el backlog (N viejas)".
- Sin ingresos en 14 días → "Registra tu primer ingreso o revisa precios".
- Sin experimentos activos → "Lanza un experimento de canal".
- Etapa con criterios completos → "Estás listo para avanzar a Validación".
- Sin revisión esta semana → "Haz tu revisión semanal de 10 min".
Cada acción navega a la pestaña/herramienta correspondiente.

**Producto (resumen)**
- "Hoy": tareas con `due_date` hoy/vencidas, con check rápido.
- Mejoras recientes (últimas 3).
- Hitos próximos.

### 10.3 Finanzas (tab)

- Filtros: periodo, tipo (ingreso/gasto), moneda.
- KPIs: ingresos, gastos, utilidad, margen, MRR, burn, runway.
- Gráfica combinada (barras ingresos/gastos + línea utilidad).
- Tabla de movimientos con edición/borrado, badges por tipo/categoría y conversión a moneda base.
- Diálogo "Registrar movimiento" con: tipo, monto, moneda, tasa (autocompletada desde `user_settings.exchange_rate`), fecha, categoría, recurrente, descripción.
- Sección "Caja": editar `cash_balance`, ver historial de ajustes (opcional).
- Exportar CSV (reutilizar `src/lib/exportUtils.ts`).

### 10.4 Clientes (tab)

- Embudo editable (arrastrar tarjeta entre columnas o cambiar estado en el menú).
- KPIs: leads, trials, pagos, churn, ARPU, LTV, LTV:CAC.
- Tabla con búsqueda, filtro por estado y segmento; columnas: nombre, segmento, estado, plan, MRR, inicio, última actividad.
- Diálogo de cliente con validación (email opcional, MRR ≥ 0).
- Cohorte de retención (matriz meses × meses) para clientes pagos.
- Estado vacío: "Añade tu primer lead".

### 10.5 Métricas (tab)

- Catálogo de KPIs por etapa (definido en `stages.ts`): entrevistas, preventas, usuarios activos, activación, retención, MRR, NRR…
- Formulario de snapshot (upsert por fecha; aviso si ya existe).
- Serie temporal por KPI (selector) + comparación con periodo anterior.
- Tarjetas con último valor, delta y tendencia.
- Import CSV opcional (fase posterior).

### 10.6 Experimentos (tab)

- Tablero por estado: Planificado / En curso / Terminado / Descartado.
- Tarjeta: hipótesis, canal, coste, fechas, resultado, aprendizaje.
- Métrica de outcome esperada y resultado real.
- Resumen: experimentos activos, coste total, aprendizajes del mes.

### 10.7 Producto (tab)

- Migrar lo actual (tareas normales, mejoras, objetivos, subtareas) con las mejoras:
  - `TaskCard` extraído y `memo`.
  - Actualización optimista (check inmediato + rollback con toast si falla).
  - Filtros: todas / abiertas / vencidas / completadas.
  - Orden por vencimiento y prioridad.
  - Hitos/roadmap por etapa (`milestones`, `kind='product'`).
- Mantener la sincronización con `tasks` (`source='entrepreneurship'`), pero centralizada en `src/lib/entrepreneurship/taskSync.ts` para no duplicar lógica entre páginas.

### 10.8 Revisión semanal (tab)

- Formulario: wins, bloqueos, foco de la semana, confianza 1–10, snapshot de MRR/usuarios.
- Historial en timeline con badges de confianza.
- Al guardar: opcional crear tarea en `tasks` con el foco (patrón ya usado en la app).
- Recordatorio: si es domingo/lunes y no hay review, mostrar banner.

### 10.9 Bitácora (opcional, fase 6)

- Decisiones fechadas con etiqueta (producto, precio, canal, equipo).
- Búsqueda y filtro. Reutiliza el patrón de `journal_entries` pero separado por venture.

---

## 11. Integraciones con el resto de la app

| Módulo | Integración |
|---|---|
| **Tareas** (`tasks`) | Ya se sincroniza; centralizar y limpiar huérfanos al borrar venture |
| **Focus** (`focus_sessions`) | Horas dedicadas vía `task_ids`/`task_id` → venture; heatmap y meta semanal |
| **Finanzas** (`transactions`, `wallets`) | Opción "vincular movimiento a emprendimiento": agregar `entrepreneurship_id` a `transactions` (nullable) o registrar en la tabla propia y reflejar en caja |
| **Metas** (`goals`) | Vincular objetivos del venture a metas globales (`goal_id` nullable) |
| **Planificación semanal** | Mostrar "foco del venture" en `WeeklyPlanningPage` (ya consume `entrepreneurships`) |
| **Vida Daniel / Scores** | Exponer `healthScore` del venture para el área Emprendimiento |
| **DeepSeek** (`src/lib/deepseek.ts`) | "CEO Copilot" opcional: resumen semanal y 3 acciones sugeridas a partir de KPIs |
| **PWA/offline** | Cache del último snapshot por venture (`offlineCache`) para abrir sin red |

---

## 12. Rendimiento y calidad de datos

1. **Portafolio**: 5 consultas (`entrepreneurships`, tareas, ingresos, gastos, clientes, métricas) con `.in('entrepreneurship_id', ids)` y agregación en JS. Objetivo: ≤ 6 requests.
2. **Detalle**: 8 consultas en paralelo (`Promise.all`) o RPC `get_venture_overview(p_id)` que devuelva JSON agregado. Recomendado RPC si el volumen crece.
3. **React Query**: `staleTime: 60s`, `queryKey` por venture, invalidación tras mutaciones. Evita recargas al cambiar de tab.
4. **Memoización**: cálculos derivados con `useMemo`; componentes de gráficas con `memo`.
5. **Lazy loading**: `React.lazy` para tabs pesados (Finanzas, Clientes) si el bundle crece.
6. **Consistencia**:
   - `exchange_rate` guardada por movimiento (no recalcular histórico con la tasa actual).
   - Redondeo a 2 decimales solo al mostrar.
   - Fechas en zona Cuba (`src/lib/cubaTime.ts`) para "hoy/mes".
   - `updated_at` con trigger en tablas nuevas.
7. **Limpieza**: trigger o función al borrar venture que elimine `tasks` con `source='entrepreneurship'` y `source_id` de sus tareas.
8. **Validación**: Zod en formularios (ya instalado), límites y mensajes en español.

---

## 13. Plan de implementación

> Estimación para una persona, en días de trabajo efectivos. Cada fase termina con build + lint + prueba manual.

### Fase 0 — Saneamiento (0.5–1 día)

- [ ] Extraer `TaskCard` y memoizarlo.
- [ ] Reemplazar N+1 del portafolio por consultas `IN`.
- [ ] Estado 404 en detalle si el venture no existe.
- [ ] Limpiar `tasks` huérfanas al borrar venture.
- [ ] Manejo de errores con toast y rollback.
- [ ] Unificar formato de moneda con `Intl.NumberFormat('es-ES')`.

**Aceptación**: portafolio con 5 ventures hace ≤ 6 requests; borrar venture no deja tareas huérfanas; no hay spinners infinitos.

### Fase 1 — Fundación de datos (1.5–2 días)

- [ ] Migración SQL (sección 6) + RLS + índices.
- [ ] Regenerar/actualizar `types.ts`.
- [ ] `types.ts`, `stages.ts`, `metrics.ts`, `health.ts`, `currency.ts`, `formatters.ts`.
- [ ] Tests unitarios de fórmulas y etapas.
- [ ] Hooks de datos (`useEntrepreneurshipPortfolio`, `useVentureDashboard`).

**Aceptación**: `npm run build` y `vitest` verdes; datos de prueba cargan en el portafolio con las nuevas métricas.

### Fase 2 — Shell visual + KPIs + etapas (2–3 días)

- [ ] Design tokens de acento (`--venture`), utilidades glass/bento.
- [ ] `PortfolioHeader`, `PortfolioKpis`, `VentureCard`, `StagePipeline`.
- [ ] `VentureHero`, `KpiGrid`, `KpiCard` con sparkline, `HealthScoreRing`.
- [ ] `StageTracker` + persistencia de criterios.
- [ ] Tabs con deep-link `?tab=`.
- [ ] Responsive 360/768/1280.

**Aceptación**: el portafolio y el resumen se ven completos en claro/oscuro y en móvil; cambiar etapa y marcar criterios persiste tras recargar.

### Fase 3 — Finanzas y gráficas (2–3 días)

- [ ] Migración de ingresos (currency/rate) y formulario actualizado.
- [ ] CRUD de gastos con categorías y recurrencia.
- [ ] `RevenueExpenseChart`, `ExpenseBreakdownChart`, `RunwayGauge`, `MrrTrendChart`.
- [ ] Tabla de movimientos con filtros y export.
- [ ] Cálculo de burn, runway, margen y utilidad; estados vacíos.
- [ ] "Actualizar caja".

**Aceptación**: registrar ingreso y gasto actualiza KPIs y gráficas sin recargar la página; runway cambia al editar caja o gastos.

### Fase 4 — Clientes, embudo y experimentos (2–3 días)

- [ ] CRUD de clientes con estados del embudo.
- [ ] `FunnelChart` + KPIs de conversión.
- [ ] Cohortes de retención.
- [ ] CRUD de experimentos y tablero por estado.
- [ ] Vinculación opcional ingreso ↔ cliente.

**Aceptación**: mover un cliente a "paying" incrementa MRR y clientes pagos; el embudo refleja los conteos.

### Fase 5 — Ejecución y acciones (2 días)

- [ ] Rediseño de Producto (tareas/mejoras/objetivos + hitos).
- [ ] Integración de foco (`FocusHeatmap`, horas/semana).
- [ ] Throughput semanal.
- [ ] `NextBestActions` con reglas.
- [ ] Revisión semanal + historial.
- [ ] Acciones rápidas globales.

**Aceptación**: las acciones sugeridas cambian según los datos; la revisión semanal se guarda y aparece en el historial.

### Fase 6 — Pulido y lanzamiento (2 días)

- [ ] Modo demo con datos de ejemplo (badge "datos de ejemplo", nunca mezclado).
- [ ] Skeleton loaders, empty states ilustrados, transiciones.
- [ ] A11y (foco, aria, contraste, reduced motion).
- [ ] Performance: lazy tabs, memo, verificación de requests.
- [ ] QA cruzado (claro/oscuro, móvil/desktop, offline).
- [ ] Documentación breve en `docs/`.
- [ ] (Opcional) CEO Copilot con DeepSeek.

**Aceptación**: Lighthouse ≥ 90 en la ruta; sin errores de consola; todas las tabs funcionan sin red con el último snapshot.

**Total estimado: 11–15 días.**

### Estado de implementación (13 nov 2026)

| Fase | Estado | Notas |
|---|---|---|
| 0 · Saneamiento | Hecha | Consultas batched (sin N+1), estado 404, limpieza de tareas y toasts de error. |
| 1 · Fundación de datos | Hecha | Migración aplicada y registrada; dominio, tipos, hook y tests de fórmulas listos. |
| 2 · Shell visual + KPIs | Hecha | Portafolio, hero, KPIs, salud, stage tracker y tabs con deep-link. |
| 3 · Finanzas y gráficas | Hecha | Ingresos/gastos, burn, runway, margen, caja y gráficas. Export CSV pendiente. |
| 4 · Clientes y experimentos | Hecha | CRUD, embudo, cohortes simplificadas y tablero de experimentos. Vínculo ingreso↔cliente pendiente. |
| 5 · Ejecución | Hecha | Producto, foco, throughput, próximas acciones y revisión semanal. |
| 6 · Pulido | Parcial | Paleta azul aplicada, empty states y documentación; modo demo y QA completo pendientes. |

**Estado de datos:** `20261113000000_entrepreneurship_dashboard.sql` y `20261113010000_entrepreneurship_blue_accent.sql` están aplicadas y registradas en el proyecto `fuqmrtenzlslkeqgdjwy`. Los emprendimientos existentes usan el acento azul `#3b82f6`. El banner de configuración y los guards legacy se conservan solo como red de seguridad para entornos sin migrar.

---

## 14. Testing y QA

**Unitarios (vitest)**

- `metrics.ts`: MRR, churn, LTV, CAC, burn, runway, márgenes, crecimiento MoM, conversión.
- `health.ts`: pesos por etapa, clamps, umbrales de color.
- `stages.ts`: progreso de criterios, siguiente etapa, bloqueos.
- `currency.ts`: conversión USD↔CUP con tasa histórica.
- `formatters.ts`: moneda, porcentaje, fechas es-ES.

**Integración / manual**

- CRUD de cada entidad y persistencia tras recarga.
- Consistencia entre tabs (misma cifra en Resumen y Finanzas).
- Borrado en cascada y limpieza de tareas.
- Responsive real: 360 px, 768 px, 1440 px.
- Modo oscuro y claro; `prefers-reduced-motion`.
- Offline: abrir dashboard con caché.
- Rendimiento: número de requests y tiempo de carga con 10 ventures y 500 movimientos.

**Criterios de aceptación globales**

- Ninguna consulta N+1.
- Cero `any` nuevos en el dominio.
- Todo importe muestra moneda.
- Toda tarjeta tiene estado vacío con acción.
- La página es usable con teclado.

---

## 15. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Datos escasos → dashboard vacío | Se ve "roto" | Empty states + modo demo + onboarding de 3 pasos |
| Complejidad excesiva (muchas tablas) | Retraso | Fases con entregables; empezar por Finanzas + Etapa + KPIs |
| Volatilidad CUP/USD | Cifras inconsistentes | Guardar `exchange_rate` por movimiento; moneda base explícita |
| Duplicación con módulo Finanzas | Confusión | El venture lleva su P&L; `transactions` se vincula opcionalmente, no se duplica |
| Deuda de tipos de Supabase | Errores silenciosos | Regenerar tipos y validar con Zod en formularios |
| Sobre-ingeniería de IA | Distrae del core | IA solo en fase 6 y opcional |
| Rendimiento con muchos datos | Lentitud | Agregación en SQL/RPC y React Query |

---

## 16. Quick wins (primera semana)

1. Consolidar consultas del portafolio (percepción inmediata de velocidad).
2. Añadir `stage` + color y mostrarlo en las tarjetas.
3. Añadir tabla de **gastos** (sin gastos no hay negocio real).
4. Gráfica de **ingresos vs gastos** de 12 meses.
5. **Stage tracker** con criterios de salida.
6. **Health score** simple (runway + crecimiento + margen + foco).
7. Rediseño visual de las tarjetas (glass + accent + sparkline).

Con esto la página ya se siente "SaaS" y aporta decisiones reales, aunque falten clientes y experimentos.

---

## 17. Decisiones que necesito de ti

1. **¿Portafolio o negocio único?** ¿Cuántos emprendimientos activos vas a gestionar? (define si el foco es comparar o profundizar).
2. **Moneda**: ¿llevas todo en USD, en CUP, o mixto? ¿Qué tasa usar por defecto? La app ya tiene `exchange_rate` en ajustes.
3. **Caja real**: ¿quieres actualizar el saldo manualmente o vincular los movimientos a `wallets`/`transactions` de Finanzas?
4. **Equipo**: ¿trabajas solo? (si hay equipo, añadimos responsables y carga de trabajo).
5. **Clientes**: ¿son empresas (B2B) con MRR o consumidores con suscripción/pagos únicos? Ajusta el embudo y el modelo de ingresos.
6. **IA**: ¿incluimos el "CEO Copilot" (resumen semanal y acciones con DeepSeek) en esta versión o después?

---

## 18. Anexo: contrato de datos del dashboard

```ts
type Stage = 'idea' | 'validation' | 'mvp' | 'traction' | 'revenue' | 'scale' | 'paused';

interface StageMeta {
  label: string;
  short: string;
  color: string;
  northStarKey: string;
  northStarLabel: string;
  healthWeights: { finance: number; product: number; market: number; execution: number };
  exitItems: { key: string; label: string }[];
}

interface VentureKpis {
  mrr: number;
  mrrDelta: number;
  revenueMonth: number;
  expensesMonth: number;
  profitMonth: number;
  grossMargin: number;
  burnRate: number;
  runwayMonths: number | null; // null = rentable
  cashBalance: number;
  payingCustomers: number;
  newCustomers: number;
  churnRate: number;
  ltv: number;
  cac: number;
  focusHoursWeek: number;
  healthScore: number;
  stageProgress: number;
}
```
