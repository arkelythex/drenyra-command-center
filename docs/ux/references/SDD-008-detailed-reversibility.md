---
status: reference
normative: false
consumed_by: SDD-017
---

---
title: "SDD-008 — Reversibilidad de Acciones Fiscales"
status: "draft"
version: "0.1"
date: "2026-07-14"
tags:
  - sdd
  - ola-2
  - reversibility
  - trust-core
  - undo
audience: "UX, Engineering, Product"
next: "SDD-009 — Tenant/RUC Scoping Visible"
---

**Última actualización**: 2026-07-14
**Contenido**: Especificación de diseño detallado (SDD)

---

## 1. Abstract

Las acciones fiscales son inherentemente riesgosas. Un comprobante mal clasificado, una declaración enviada con montos incorrectos, un asiento contable duplicado — cada error tiene consecuencias que van desde multas SUNAT hasta distorsiones contables que requieren horas de corrección manual. Hoy, Drenyra ejecuta acciones sin un modelo unificado de reversibilidad: algunas acciones se pueden deshacer, otras no, y el usuario no tiene manera de saber cuáles son cuáles hasta que es demasiado tarde.

Este SDD-008 define el sistema de reversibilidad fiscal: qué acciones son reversibles, durante cuánto tiempo, con qué UI, y cómo se manejan las reversiones compuestas, las compensaciones contables y las acciones irreversibles.

## 2. North star

> El usuario sabe, antes de ejecutar cualquier acción, si puede revertirla, durante cuánto tiempo y a qué costo.

## 3. Problema

1. **Irreversibilidad sorpresa**: El usuario ejecuta una acción que parece reversible y descubre que no lo es cuando intenta deshacer.
2. **Sin ventanas visibles**: No hay indicación de "esto expira en X días" para reversibilidad.
3. **Cascadas no gestionadas**: Revertir una acción no advierte que otras acciones dependen de ella.
4. **Compensación contable manual**: Las correcciones fiscales requieren asientos de compensación que hoy se hacen fuera del sistema.
5. **Batch vs. individual**: Las operaciones batch no tienen modelo de reversibilidad granular.

## 4. Investigación y referencias

- **SDD-002** (Sección 7.2, 13): Contrato de reversibilidad con ventanas, indicador `⏳`, acciones irreversibles con advertencia, reversibilidad compuesta, target 95% reversiones exitosas sin soporte
- **SDD-007** (Secciones 7.3, 7.4): L2-L3 requieren undo. L3 requiere reversibilidad completa
- **SDD-006** (Sección 9): Estados de evidencia con conflictos que requieren reversión
- **SDD-001**: P7 (El Practicante) expresa "miedo de cometer un error irreversible"
- **SDD-004**: Reversal rate como métrica de confianza, flag-off automático si >15%
- **Referencia externa**: Journaling contable (partida doble, asientos de ajuste), transaction logs en sistemas financieros, undo/redo en Google Docs y Figma, versioning en Git

## 5. Decisiones ejecutivas

| Decisión | Opción | Justificación |
|----------|--------|---------------|
| Modelo de reversibilidad | **State-based journaling** (no command pattern) | En fiscal, revertir no es des-ejecutar comandos sino restaurar estado con compensación |
| Reversibilidad automática vs. guiada | **Ambas**: automática en ventana, guiada después | Ventanas cortas para undo instantáneo, guía paso a paso después |
| Reversibilidad batch | **Transaccional por lote + individual por ítem** | Batch completo se revierte como unidad, pero items individuales también |
| Reversibilidad cross-RUC | **No permitida automáticamente** | Acción en RUC-A no se revierte desde RUC-B. Requiere workflow explícito |
| Undo/redo stack | **Profundidad configurable**, máximo 50 acciones | Default 20. Configurable por tenant |

## 6. Contratos de confianza aplicables (SDD-002)

| Contrato | Relevancia |
|----------|-----------|
| Reversibilidad (I3) | Fundacional — toda acción reversible dentro de ventana aplicable |
| Aprobación humana (I4) | Reversiones de acciones L3 requieren aprobación del mismo nivel |
| Audit trail (I5) | Cada reversión es una acción de auditoría independiente con razón |
| Evidencia (I2) | La reversión debe mostrar la evidencia de la acción original |
| RUC scope (I1) | Reversión ocurre dentro del RUC donde se ejecutó la acción |

## 7. Tipos de reversibilidad

### 7.1 Reversibilidad simple

Una acción se deshace sin afectar otras. La más común.

**Ejemplos**:
- Clasificar comprobante → "Desclasificar"
- Marcar como duplicado → "Desmarcar"
- Asociar comprobante a declaración → "Desasociar"

**UI**: Botón "Deshacer" inline en el item o en notificación post-acción.

### 7.2 Reversibilidad compuesta

Revertir una acción que desencadenó otras. Requiere mostrar árbol de dependencias.

**Ejemplos**:
- Reclasificar un comprobante que actualizó un reporte mensual
- Eliminar un comprobante que estaba incluido en una declaración preparada
- Modificar un asiento contable que tiene contrapartidas

**UI**: Diálogo con árbol de dependencias antes de confirmar reversión.

```
┌──────────────────────────────────────────┐
│ ⚠️ Esta acción afectará 3 dependencias   │
│                                          │
│ 🔄 Reclasificar F001-123                 │
│  ├─ 📊 Actualizar reporte mensual        │
│  ├─ 📋 Recalcular IGV del período        │
│  └─ 📤 Re-generar declaración (borrador) │
│                                          │
│ [CANCELAR] [✓ REVERTIR TODO]             │
└──────────────────────────────────────────┘
```

### 7.3 Compensación contable

Cuando una acción no se puede deshacer directamente (ej: un asiento ya contabilizado), se crea un asiento de compensación que anula el efecto.

**Ejemplos**:
- Asiento duplicado → asiento de reversión (mismo monto, signo opuesto)
- Cierre de período → asiento de apertura corregido
- Declaración enviada con error → declaración rectificatoria

**UI**: "Compensar" crea automáticamente el asiento de reversión con referencia cruzada al original. El usuario revisa y confirma.

### 7.4 Reversibilidad guiada

Cuando la ventana automática expiró, el sistema guía al usuario a través del proceso manual.

**Ejemplos**:
- Reversión de envío a SUNAT después de CDR recibido → "Solicita anulación ante SUNAT"
- Corrección de declaración después del cierre → "Presenta declaración rectificatoria"

**UI**: Guía paso a paso con enlaces a SUNAT, formatos requeridos, plazos y referencias.

---

## 8. Ventanas de reversibilidad

| Categoría | Acciones | Ventana | UI |
|-----------|----------|---------|-----|
| Instantánea | Clasificar, etiquetar, marcar duplicado | Ilimitada (hasta que se sobrescriba) | Botón "Deshacer" inline + notificación |
| Corta | Asociar/desasociar comprobantes, modificar borradores | 7 días | Botón "Deshacer" en timeline de actividad |
| Media | Reclasificar batch, modificar asientos contables | Hasta cierre del período | "Revertir" con confirmación L1 |
| Larga | Envío a SUNAT (no aceptado) | Hasta recepción de CDR | "Anular envío" con confirmación L2 |
| Irreversible | Envío a SUNAT (aceptado), cierre de período | No reversible | Guía de rectificación paso a paso |
| Contextual | Cambio de RUC | 5 minutos | Banner "¿Deshacer cambio?" |

**Reglas**:
- Toda acción muestra su ventana de reversibilidad ANTES de ejecutarse
- Cuando la ventana está por expirar (>80%), se muestra indicador `⏳ Expira pronto`
- Las ventanas son configurables por tenant (un estudio grande puede requerir 30 días)
- Las acciones irreversibles muestran doble confirmación + reason required

---

## 9. UI patterns

### 9.1 Indicador de reversibilidad pre-acción

Antes de ejecutar una acción, el usuario ve su estado de reversibilidad:

```
Clasificar 45 comprobantes como "Gasto operativo"
🔄 Reversible — 7 días
[CONFIRMAR] [CANCELAR]

vs.

Enviar declaración mensual a SUNAT
⚠️ NO REVERSIBLE después de recibir CDR
Deseas continuar?
[RAZÓN:] _________________________________
[CONFIRMAR] [CANCELAR]
```

### 9.2 Toast de reversibilidad post-acción

Después de ejecutar una acción reversible:

```
┌──────────────────────────────────────────┐
│ ✅ 45 comprobantes clasificados          │
│    [🔄 Deshacer]     ⏳ Expira en 7 días │
└──────────────────────────────────────────┘
```

- El toast persiste hasta que expira o el usuario lo descarta
- Cerrar el toast no elimina la capacidad de deshacer (sigue en timeline)
- Acciones múltiples en secuencia: "Deshacer todo" + "Deshacer individual"

### 9.3 Timeline de actividad con reversibilidad

En el panel de actividad (SDD-002, sección 10):

```
┌──────────────────────────────────────────┐
│ Actividad reciente          [Filtrar]    │
├──────────────────────────────────────────┤
│ 🔄 Clasificaste 45 comprob.      hace 2h │
│    🔄 Revertir • ⏳ Expira en 7 días      │
├──────────────────────────────────────────┤
│ 📤 Enviaste declaración          hace 1d │
│    ✅ CDR recibido — irreversible         │
│    📋 ¿Necesitas rectificar? [Guía]       │
├──────────────────────────────────────────┤
│ 🏷️ Marcaste F001-120 duplicado   hace 3d │
│    🔄 Revertir • ⏳ Expira en 4 días      │
└──────────────────────────────────────────┘
```

### 9.4 Diálogo de reversión compuesta

Cuando una acción tiene dependencias:

```
┌──────────────────────────────────────────┐
│ Revertir clasificación de F001-123       │
│                                          │
│ Esto afectará:                           │
│ 📊 Reporte mensual (recalcular)          │
│ 📋 IGV del período (recalcular)          │
│ 📤 Declaración mensual (regenerar draft) │
│                                          │
│ [ ] No regenerar declaración (manual)    │
│ [ ] Mantener reporte actual              │
│                                          │
│ [CANCELAR] [✓ REVERTIR]                  │
└──────────────────────────────────────────┘
```

### 9.5 Wizard de rectificación (irreversible)

Para acciones que ya no se pueden deshacer:

```
Paso 1/3: Identificar el problema
  ┌──────────────────────────────────┐
  │ ¿Qué necesitas corregir?         │
  │ ○ Monto incorrecto               │
  │ ○ Período incorrecto             │
  │ ○ Comprobante omitido            │
  │ ○ Otro (describe)                │
  └──────────────────────────────────┘

Paso 2/3: Preparar rectificación
  Sistema prepara borrador de rectificación
  [VER BORRADOR]  [MODIFICAR]

Paso 3/3: Enviar rectificación
  Confirma y envía la rectificación a SUNAT
```

---

## 10. Estados de reversibilidad

| Estado | Significado | Display |
|--------|-------------|---------|
| `reversible` | Dentro de ventana, se puede deshacer | 🔄 + ventana restante |
| `expiring` | >80% de ventana consumida | 🔄⏳ + "Expira pronto" |
| `irreversible` | Fuera de ventana o acción no reversible por naturaleza | ⛔ + enlace a guía de rectificación |
| `compensable` | No se puede deshacer pero se puede compensar | 🔄→📋 "Compensar" |
| `pending_compensation` | Compensación en proceso | ⏳ Pendiente de compensación |
| `reverted` | Acción revertida exitosamente | ✅ Revertido |
| `reversal_failed` | Intento de reversión falló | ❌ Error al revertir + "Contactar soporte" |

---

## 11. Edge cases

| Caso | Comportamiento |
|------|---------------|
| Revertir acción que afecta datos ya exportados | La reversión actualiza los datos. Se notifica que la exportación anterior queda desactualizada |
| Revertir acción en período cerrado | No permitido automáticamente. Guía a compensación contable |
| Batch parcialmente revertido | Items revertidos individualmente mantienen su historial. El batch original muestra estado "parcialmente revertido" |
| Reversión durante aprobación L3 | La reversión cancela la aprobación pendiente. Notificar al aprobador |
| Dos usuarios revierten la misma acción | El primero revierte exitosamente. El segundo ve "Acción ya revertida por [usuario]" |
| Offline durante reversión | La reversión se encola. Al reconectar: confirmar o fallar con notificación |
| Reversión de acción que creó evidencia | La evidencia se marca como "obsoleta" pero no se elimina (audit trail) |

---

## 12. Modelo de journaling

Cada acción ejecutada genera un journal entry:

```typescript
interface JournalEntry {
  id: string
  actionType: string
  timestamp: string // ISO 8601
  user: { id: string; name: string; role: string }
  ruc: string
  period: string
  scope: { feature: string; context: Record<string, unknown> }
  delta: Array<{
    entity: string
    entityId: string
    field: string
    previousValue: unknown
    newValue: unknown
  }>
  evidence: Array<{ type: string; reference: string }>
  status: 'committed' | 'reverted' | 'compensated' | 'failed'
  reversibility: {
    windowEnds: string // ISO 8601, null si irreversible
    type: 'simple' | 'compound' | 'compensation' | 'guided'
    parentActionId: string | null // para reversiones compuestas
    dependentActionIds: string[] // acciones afectadas
  }
  reversalReference: string | null // id del journal de reversión
  compensationReference: string | null // id del asiento de compensación
}
```

**Reglas**:
- Los journal entries son append-only. Nunca se eliminan
- Revertir una acción crea un nuevo entry con `reversalReference` apuntando al original
- El entry original cambia su status a `reverted`
- La evidencia original permanece visible pero marcada como obsoleta
- Los deltas permiten reconstruir el estado completo en cualquier punto

---

## 13. Integración con L0-L3 (SDD-007)

| Nivel | Reversibilidad |
|-------|---------------|
| L0 — Explain | El usuario ejecuta manualmente, toda acción es reversible (simple) |
| L1 — Recommend | Acciones aceptadas son reversibles por defecto (simple) |
| L2 — Prepare | Drafts preparados son descartables. Acciones ejecutadas requieren reversión compuesta si aplica |
| L3 — Execute | Toda ejecución autónoma es reversible con undo completo. El usuario puede revertir desde notificación o dashboard |

**Regla**: Ninguna feature opera en L3 sin tener reversibilidad probada en audit trail.

---

## 14. Métricas de telemetría (SDD-004)

| Métrica | Evento | Target |
|---------|--------|--------|
| Reversal rate | `reversibility.action_reverted` | <5% (acciones revertidas / total) |
| Successful reversal rate | `reversibility.reversal_success` | >95% |
| Reversal without support | `reversibility.reversal_self_service` | >90% |
| Window hit rate | `reversibility.window_used` | >80% (reversiones dentro de ventana) |
| Compound reversal acceptance | `reversibility.compound_accepted` | >70% |
| Compensation auto-generation | `reversibility.compensation_auto` | >85% |
| Pre-action warning view rate | `ui.reversibility_warning_viewed` | >95% en acciones irreversibles |
| Reversal time | `reversibility.reversal_duration` | <2s (percepción instantánea) |

---

## 15. Performance budget

| Operación | Target |
|-----------|--------|
| Reversión simple (cambio de estado) | <200ms |
| Reversión compuesta (con dependencias) | <800ms |
| Render de timeline de actividad | <500ms |
| Cálculo de ventana restante | <50ms |
| Generación de asiento de compensación | <1s |
| Wizard de rectificación (primer paso) | <300ms |

---

## 16. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Reversión en cascada daña datos no relacionados | Media | Alto | Mostrar árbol de dependencias completo antes de confirmar. Opción de revertir parcialmente |
| Ventanas de reversibilidad inconsistentes entre features | Alta | Medio | Catálogo central de ventanas por tipo de acción. Configurable por tenant |
| Usuario cree que acción irreversible es reversible | Baja | Crítico | Doble confirmación + reason required + indicador rojo persistente para irreversibles |
| Reversión durante ejecución batch | Baja | Alto | Lock transaccional. Reversión batch solo cuando el batch complete |
| Asiento de compensación mal generado | Media | Alto | El usuario revisa y confirma compensaciones. Diff view entre original y compensación |

---

## 17. Dependencias

| Dependencia | Tipo | Estado |
|------------|------|--------|
| SDD-002 (Fiscal Trust Contracts) | Contiene contrato de reversibilidad | Completado |
| SDD-007 (Modelo L0-L3) | Define niveles que requieren reversibilidad | Completado |
| SDD-004 (UX Telemetry) | Provee métricas de reversal | Completado |
| SDD-006 (Evidence System) | Provee evidencia de acciones a revertir | Completado |
| SDD-010 (Approval Gates) | Reversiones de L3 pueden requerir aprobación | Pendiente |
| Motor de partida doble (contabilidad) | Compensación contable requiere engine contable | Futuro |

---

## 18. Criterios de aceptación (DONE)

- [ ] Tipos de reversibilidad definidos: simple, compuesta, compensación, guiada
- [ ] Ventanas de reversibilidad catalogadas por categoría de acción con display pre-acción
- [ ] UI patterns documentados: indicador pre-acción, toast, timeline, diálogo compuesto, wizard de rectificación
- [ ] Estados de reversibilidad cubiertos (7 estados)
- [ ] Edge cases documentados (cross-RUC, batch, offline, período cerrado, concurrencia)
- [ ] Modelo de journaling definido con tipo TypeScript
- [ ] Integración con L0-L3 especificada
- [ ] Métricas y targets definidos
- [ ] Performance budget establecido
- [ ] Dependencias identificadas

---

**Siguiente**: SDD-009 — Tenant/RUC Scoping Visible
