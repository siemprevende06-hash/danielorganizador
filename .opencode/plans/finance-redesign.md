# Plan de Rediseño de Finanzas

## Objetivos
1. Estilo minimalista y moderno (glassmorphism, 1 color de acento)
2. Gráficos reales con porcentajes
3. Planificación/presupuesto mensual
4. Diseño responsive (móvil + tablet)
5. Migrar de localStorage a Supabase backend

## Archivos a modificar

### 1. `supabase/migrations/20260712000001_create_debts.sql` (NUEVO)
- Crear tabla `public.debts`
- Columnas: id (UUID PK), user_id, wallet_id (FK), person, description, total_amount, paid_amount, due_date, status, debt_date
- RLS: Allow all access
- Trigger: update_updated_at

### 2. `src/hooks/useFinance.ts` (MODIFICAR)
- Agregar debts al state y carga inicial
- Agregar: addDebt, updateDebt, deleteDebt
- Agregar: load desde Supabase con fallback localStorage
- Return: debts + nuevas funciones

### 3. `src/components/finance/charts.tsx` (REESCRIBIR)
- Refinar MonthlySummaryChart (estilo minimalista)
- Refinar CategorySpendChart (mostrar % más visible)
- NUEVO: WalletDistributionChart (donut con distribución de wallets)
- NUEVO: CashFlowTrendChart (área/line chart de balance)
- NUEVO: BudgetProgress component (barras de presupuesto)

### 4. `src/pages/Finance.tsx` (REFACTORIZAR)
- Reemplazar toda la lógica de estado inline con `useFinance()` hook
- Nuevo diseño: glassmorphism cards, 1 acento color
- Secciones: Summary → Charts → Wallets → Distribution → Budget → Tabs (Expenses/Incomes/Transfers/Loans/Debts)
- Responsive: 1-col móvil, 2-col tablet, 3-5-col desktop
- Tabs con scroll horizontal en mobile

## Diseño visual

### Patrón glassmorphism (de Focus.tsx, WeeklyView.tsx)
```tsx
<Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
  <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
  <CardContent>...</CardContent>
</Card>
```

### Resumen financiero
- 4 tarjetas glass: Balance Total, Ingresos, Gastos, Balance Mensual
- Cada una con badge de % de cambio vs mes anterior
- Fondo de página: radial-gradient sutil

### Charts section
- 2 columnas en desktop: Resumen 6 meses (bar) + Gastos por categoría (donut)
- 2 columna: Wallet Distribution (donut) + Cash Flow Trend (area)
- Porcentajes visibles en tooltips y leyendas

### Presupuesto mensual
- Cards editables por categoría con slider/input
- Barra de progreso: gastado/presupuestado
- Alerta visual al exceder 80% y 100%

## Flujo de datos
1. useFinance() hook en Finance.tsx
2. Hook carga datos de Supabase al montar
3. CRUD operations -> Supabase -> actualiza estado local
4. Debts: misma tabla Supabase, mismo patrón
5. Fallback localStorage si Supabase falla

## Responsive breakpoints
- Móvil (< 640px): 1 columna, texto reducido, tabs scroll horizontal
- Tablet (768-1024px): 2 columnas grids
- Desktop (> 1024px): 3-5 columnas según sección
