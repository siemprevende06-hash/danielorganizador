
# Plan: Rediseño Completo de la Página de Planificación

## PROBLEMAS IDENTIFICADOS

### 1. Datos Incorrectos en la Base de Datos
- Los bloques "Idiomas + Lectura" (block_id: 2) y "Focus" (block_id: 14) tienen el **mismo horario** (17:30-19:00)
- Esto causa confusión porque la migración anterior creó duplicados
- El bloque "Focus Emprendimiento" (block_id: 5) de las 5:30-7:00 AM es el correcto

### 2. Textos Desactualizados
- `SleepTimeSelector.tsx` línea 125-126 dice "5:30-7:00 AM" para idiomas, pero ahora está en la tarde
- El preset "Sueño Extendido" excluye block_id 2 pero debería excluir el bloque de Focus matutino (block_id 5)

### 3. Planificador de Bloques Muy Restrictivo
- `BlockTaskPlanner.tsx` solo muestra bloques que contienen "deep work", "focus", "estudio" o son de tipo `dinamico`
- No muestra bloques como "Gym", "Almuerzo + Ajedrez", "Piano o Guitarra", etc.
- Necesitamos mostrar **TODOS** los bloques del día

### 4. No Se Pueden Crear Tareas
- No hay opción para crear una tarea nueva desde el planificador
- El usuario debe ir a otra página para crear tareas

### 5. Vista del Horario Incompleta
- El timeline no muestra el rango completo de 5 AM a 9 PM
- Falta claridad visual

---

## SOLUCIONES PROPUESTAS

### 1. Corrección de Datos en la Base de Datos

```sql
-- Eliminar el bloque duplicado (Focus en la tarde que tiene el mismo horario que Idiomas)
DELETE FROM routine_blocks WHERE block_id = '14' AND start_time = '17:30:00';

-- Actualizar el preset "Sueño Extendido" para excluir el bloque correcto
UPDATE routine_presets 
SET excluded_block_ids = ARRAY['5', '18'], 
    description = 'Para días de mucho cansancio. Elimina Focus matutino (5:30-7:00 AM) para despertar a las 6:30 AM'
WHERE name = 'Sueño Extendido';

-- Actualizar el preset "Sueño Extendido 6:30" para usar mismo array
UPDATE routine_presets 
SET excluded_block_ids = ARRAY['5']
WHERE name = 'Sueño Extendido 6:30';
```

### 2. Corrección de Textos en SleepTimeSelector.tsx

**Antes:**
```tsx
<p className="text-xs text-muted-foreground">
  5:30-7:00 AM → Permite despertar a las 6:30 AM
</p>
```

**Después:**
```tsx
<p className="text-xs text-muted-foreground">
  Excluye Focus Emprendimiento (5:30-7:00 AM)
</p>
```

### 3. Rediseño Completo del DayPlanner

#### Nueva estructura de la página:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📅 PLANIFICACIÓN DEL DÍA                                                   │
│  [Hoy] [Mañana]                        Despertar: [5:00 AM ▼] [6:30 AM]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ + CREAR TAREA RÁPIDA                                                 │   │
│  │ [_________________Título________________] [Universidad ▼] [Crear]   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  HORARIO COMPLETO DEL DÍA                                                  │
│                                                                             │
│  05:00 ─────────────────────────────────────────────────────────────────   │
│  │ RUTINA ACTIVACIÓN (30 min)                              [+ Agregar] │   │
│  │                                                                      │   │
│  05:30 ─────────────────────────────────────────────────────────────────   │
│  │ FOCUS EMPRENDIMIENTO (90 min)                           [+ Agregar] │   │
│  │  └─ ☑️ Revisar métricas                                              │   │
│  │  └─ ☐ Escribir post LinkedIn                            [×] [↔]    │   │
│  │                                                                      │   │
│  07:00 ─────────────────────────────────────────────────────────────────   │
│  │ GYM (60 min)                                            [+ Agregar] │   │
│  │                                                                      │   │
│  08:00 ─────────────────────────────────────────────────────────────────   │
│  │ ALISTAMIENTO + DESAYUNO (30 min)                        [+ Agregar] │   │
│  │                                                                      │   │
│  ...                                                                       │
│  │                                                                      │   │
│  17:30 ─────────────────────────────────────────────────────────────────   │
│  │ IDIOMAS + LECTURA (90 min)                              [+ Agregar] │   │
│  │                                                                      │   │
│  19:00 ─────────────────────────────────────────────────────────────────   │
│  │ OCIO (60 min)                                           [+ Agregar] │   │
│  │                                                                      │   │
│  20:00 ─────────────────────────────────────────────────────────────────   │
│  │ PIANO O GUITARRA (30 min)                               [+ Agregar] │   │
│  │                                                                      │   │
│  20:30 ─────────────────────────────────────────────────────────────────   │
│  │ RUTINA DESACTIVACIÓN (30 min)                           [+ Agregar] │   │
│  │                                                                      │   │
│  21:00 ═══════ FIN DEL DÍA ════════════════════════════════════════════   │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ TAREAS SIN ASIGNAR (3)                                              │    │
│  │  • Estudiar Física                      [Universidad] [Asignar ▼]   │    │
│  │  • Completar landing page               [Emprendimiento] [Asignar ▼]│    │
│  │  • Revisar proyecto de Rust             [Proyecto] [Asignar ▼]      │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│                                               [💾 GUARDAR PLANIFICACIÓN]   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Características del nuevo diseño:

1. **Selector de hora de inicio visible** en el header (5:00 AM / 6:30 AM)
2. **Creador de tareas rápido** integrado en la parte superior
3. **Vista completa del horario** desde despertar hasta dormir
4. **TODOS los bloques visibles** (no solo los de trabajo)
5. **Botón "Agregar" en cada bloque** para asignar tareas
6. **Sección de tareas sin asignar** al final con selector de bloque
7. **Acciones por tarea**: eliminar de bloque, mover a otro bloque

---

## ARCHIVOS A MODIFICAR

### 1. Migración SQL para corregir datos
- Eliminar bloque duplicado Focus (block_id 14 con horario 17:30)
- Actualizar presets para excluir bloque correcto

### 2. `src/components/routine/SleepTimeSelector.tsx`
- Corregir texto que dice "5:30-7:00 AM" 
- Cambiar referencia de "Idiomas" a "Focus Emprendimiento"

### 3. `src/pages/DayPlanner.tsx` (Rediseño completo)
- Remover estructura de tabs complicada
- Implementar vista de timeline simplificada
- Agregar formulario de creación rápida de tareas
- Mostrar todos los bloques del día
- Agregar sección de tareas sin asignar

### 4. `src/components/routine/BlockTaskPlanner.tsx`
- Remover filtro que solo muestra bloques de trabajo
- Mostrar TODOS los bloques del día
- Mejorar UI para ser más limpia

### 5. Nuevo componente: `src/components/routine/QuickTaskCreator.tsx`
- Formulario compacto para crear tareas
- Selector de área (Universidad, Emprendimiento, Proyecto, General)
- Selector opcional de bloque al crear

---

## RESUMEN DE CAMBIOS

| Componente | Cambio |
|------------|--------|
| Base de datos | Eliminar bloque duplicado, corregir presets |
| SleepTimeSelector.tsx | Corregir texto de idiomas |
| DayPlanner.tsx | Rediseño completo con timeline y quick task creator |
| BlockTaskPlanner.tsx | Mostrar TODOS los bloques, no solo los de trabajo |
| QuickTaskCreator.tsx | Nuevo componente para crear tareas rápidas |

---

## DETALLES TÉCNICOS

### Nuevo componente: QuickTaskCreator.tsx

```tsx
interface QuickTaskCreatorProps {
  selectedDate: Date;
  onTaskCreated: () => void;
}

// Permite crear una tarea con:
// - Título (requerido)
// - Área: Universidad, Emprendimiento, Proyecto, General
// - Prioridad: Alta, Media, Baja
// - Bloque (opcional): selector de todos los bloques del día
```

### Cambio en BlockTaskPlanner.tsx

**Antes (filtro restrictivo):**
```tsx
const workBlocks = blocks.filter(block => 
  block.title.toLowerCase().includes('deep work') ||
  block.title.toLowerCase().includes('focus') ||
  block.title.toLowerCase().includes('estudio') ||
  block.title.toLowerCase().includes('trabajo') ||
  block.blockType === 'dinamico'
);
```

**Después (mostrar todos):**
```tsx
// Mostrar TODOS los bloques ordenados por hora
const allBlocks = blocks.sort((a, b) => {
  const [aH, aM] = a.startTime.split(':').map(Number);
  const [bH, bM] = b.startTime.split(':').map(Number);
  return (aH * 60 + aM) - (bH * 60 + bM);
});
```

### Nueva estructura de DayPlanner.tsx

```tsx
<div className="max-w-4xl mx-auto space-y-6">
  {/* Header con fecha y selector de hora */}
  <Header />
  
  {/* Creador de tareas rápido */}
  <QuickTaskCreator selectedDate={selectedDate} onTaskCreated={loadTasks} />
  
  {/* Timeline completo con bloques */}
  <FullDayTimeline 
    blocks={blocks}
    tasks={tasks}
    wakeTime={wakeTime}
    onAssign={handleAssign}
    onRemove={handleRemove}
    onMove={handleMove}
  />
  
  {/* Tareas sin asignar */}
  <UnassignedTasks 
    tasks={unassignedTasks}
    blocks={blocks}
    onAssign={handleAssign}
  />
  
  {/* Botón guardar */}
  <SaveButton onClick={handleSave} loading={loading} />
</div>
```
