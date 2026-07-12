# Specification: UI System Consistency

**Change**: `drenyra-ui-system-consistency`
**Date**: 2026-07-12
**Based on**: proposal.md

## 1. Sistema de Layout

### Layout A — Focal

```
max-width: 768px (equivalente a max-w-3xl / max-w-[768px])
centrado con mx-auto
padding: 24-40px lateral
```

**Uso**: Inbox, creación, vistas de lectura

### Layout B — Operativo

```
flex-1 con right rail opcional de 320px
padding lateral: 16-24px
```

**Uso**: Cierre, revisión, dashboard

### Layout C — Data-heavy

```
full-width con padding lateral 32-48px
```

**Uso**: Facturas, reportes, expedientes, Control Tower

### PageShell enforcement

Modificar `PageShellProps`:

```typescript
interface PageShellProps {
  variant: 'focal' | 'operativo' | 'data-heavy' // replaces old variants
  aside?: boolean // si true, reserva espacio para right rail 320px
  padding?: 'none' | 'sm' | 'md' | 'lg'
}
```

## 2. Sistema de Radios

| Token          | Value | Uso                      |
| -------------- | ----- | ------------------------ |
| `--radius-sm`  | 8px   | inputs, botones          |
| `--radius-md`  | 10px  | botones principales      |
| `--radius-lg`  | 12px  | cards                    |
| `--radius-xl`  | 16px  | hero, dropzones          |
| `--radius-2xl` | 20px  | paneles grandes, modales |

Bordes: 1px por defecto. 2px solo para focus o estados críticos (error, alerta).

### Border colors

Unificar border colors a:

- `--border-subtle`: border estándar (actual)
- `--border-default`: border con más contraste (hover, active)
- `--border-strong`: focus, selección

## 3. Composer Contextual

### Modos

| Modo       | Altura | Contenido                          | Cuándo                          |
| ---------- | ------ | ---------------------------------- | ------------------------------- |
| `hidden`   | 0      | none                               | Configuración, auditoría        |
| `compact`  | 52px   | Input + send button                | Reportes, expedientes, facturas |
| `expanded` | full   | Input + controls + chips + actions | Inbox, revisión, cierre         |

### Implementación

El `MainLayoutShell` recibe un prop `composerMode` desde la ruta activa. Usar TanStack Router `beforeLoad` o un hook en `__root.tsx` que detecte el path.

```typescript
type ComposerMode = 'hidden' | 'compact' | 'expanded'
```

**Convención por ruta**:

- Inbox, drenyra, chat: expanded
- Dashboard, banking, invoices, compliance: compact
- Settings: hidden

## 4. Sidebar Mejorado

### Secciones colapsables

```typescript
interface SidebarSection {
  id: string
  label: string
  icon?: LucideIcon
  items: NavItem[]
  defaultCollapsed?: boolean
  collapsible: boolean
}
```

| Sección                                                       | Colapsable | Default   |
| ------------------------------------------------------------- | ---------- | --------- |
| Buscar + Nueva tarea                                          | no         | visible   |
| TRABAJO (Bandeja, Revisiones, Aprobaciones, Evidencia)        | no         | visible   |
| ÁREAS (Bancos, Comprobantes, SIRE/SUNAT, Impuestos, Reportes) | sí         | expandido |
| Cierres activos                                               | sí         | colapsado |
| Recientes                                                     | sí         | colapsado |
| Sistema (enlaces de config)                                   | sí         | colapsado |

### Footer

Reemplazar footer actual con:

```
[User avatar + name] [Settings] [● 3 agentes activos]
```

Compacto, sin empresa/período (ir a topbar).

## 5. Inbox Inteligente

### Dropzone reducido 30%

De `min-h-[180px] + p-10` a `min-h-[120px] + p-6`.

### Actividad reciente

Debajo del dropzone, en estado empty, mostrar:

```
Últimos lotes
┌─────────────────────────────────────┐
│ Facturas julio · 428 archivos · ✓   │
│ Compras recurrentes · 34 archivos · │
│ pendiente                           │
└─────────────────────────────────────┘
```

### Botón

Usar botón `variant="outline"` estándar en vez del actual con borde duro.

## 6. Control Tower → Centro de Operaciones

### Renombrar

- File: `control-tower.tsx` → `centro-de-operaciones.tsx`
- Componente renombrado a `CentroDeOperacionesPage`
- Links en sidebar actualizados

### Buzón SOL

Reemplazar warning técnico con:

```
Buzón SOL no está conectado
Conectá SUNAT para sincronizar notificaciones y obligaciones automáticamente.
[Configurar conexión]
```

### Grid de empresas

Si solo hay 1 empresa, mostrar vista de detalle en vez de grid vacío.

## 7. Facturas al Sistema

- Reducir border de 2px a 1px (usar `border-subtle`)
- Bajar tipografía: de semibold a medium en labels, de bold a semibold en valores
- Reducir métricas ~15% (font-size)
- Reemplazar uppercase tracking-wider por normal
- Toolbar estándar (misma altura y espaciado que otras vistas)
- Botón "Nueva factura": mismo tamaño que otros CTAs principales

## 8. Pipeline y Cierre

### Pipeline compacto

De tarjeta vertical a banda horizontal:

```
Importación ●─○─○─○─○─○─○─○ Archivo
             ↑
        Importando 428 comprobantes
```

Altura reducida de ~200px a ~80px.

### Gate Fiscal → Línea de estado

```
Antes de declarar
4/6 verificaciones completadas · 2 requieren atención
```

Colapsable a detalle. No bloque grande.

## 9. Nombres

| Actual                  | Nuevo                 |
| ----------------------- | --------------------- |
| Control Tower           | Centro de operaciones |
| Cola de aprobación      | Aprobaciones          |
| Expedientes Fiscales    | Expedientes           |
| Nueva tarea             | Nueva revisión        |
| Nuevo (en expedientes)  | Nuevo expediente      |
| Contexto (en inspector) | Detalle               |

## Test scenarios

- [ ] Composer aparece compacto en invoices y no interfiere con scroll
- [ ] Sidebar colapsa secciones sin perder datos
- [ ] PageShell focal centra correctamente el contenido en inbox
- [ ] PageShell data-heavy ocupa full width en facturas
- [ ] Control Tower renombrado no rompe links existentes (redirect temporal)
- [ ] Dropzone reducido mantiene UX de arrastre
- [ ] Radios consistentes en inputs, buttons, cards
- [ ] Pipeline compacto en cierre mensual no pierde fases
