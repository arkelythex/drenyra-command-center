# UX & Accessibility — Drenyra Experience Completion

**Estado:** Proposal
**Creado:** 2026-07-25
**Depende de:** DS1 (tokens), DS2 (tipografía), DS4 (component states), DS5 (three-panel layout), FE-RESET (command center) — todos ✅ applied

---

## Problema

El ecosistema UX de Drenyra tiene 5 capacidades fundacionales de diseño aplicadas (tokens, shell, layout, command center, component states), pero la capa de experiencia — lo que el contador, auditor, y operador fiscal realmente ven, tocan, y confían — tiene 6 gaps críticos en el Capability Map:

| Gap       | Capability                         | Estado     | Impacto                                                                                 |
| --------- | ---------------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| CAP-UX-06 | Accessibility & keyboard           | ◌ sin SDD  | Barrera legal y de inclusión; sin WCAG no hay compliance para gobiernos                 |
| CAP-UX-04 | Evidence rail & approval inspector | ◌ sin SDD  | Sin trazabilidad visual de approvals; el contador no ve qué está pendiente de revisar   |
| CAP-UX-05 | Accounting diff workspace          | ◌ sin SDD  | 152 archivos en cognitive-hub, pero sin diff visual de asientos propuestos vs aceptados |
| CAP-UX-08 | Component library & Storybook      | ◌ sin SDD  | 60+ módulos web sin catálogo; onboarding de devs es adivinatorio                        |
| CAP-UX-09 | Onboarding & empty states          | 🟡 partial | 16 archivos de onboarding existen pero sin integración con el DS nuevo                  |
| CAP-UX-10 | Print layouts & PDF reports        | ◌ sin SDD  | Sin salida formal para SUNAT, contadores, y auditores que exigen papel/digital firmado  |

La web app de Drenyra tiene **60+ módulos funcionales** y el cognitive-hub tiene **152 archivos** con solo 15 tests. La experiencia es funcional pero no está pulida para el usuario final contable, que espera:

- Navegación por teclado completa (sin depender del mouse)
- Evidencia visual de cada approval y rechazo
- Diffs contables claros (como un `git diff` pero de asientos)
- Documentos imprimibles con formato profesional
- Un onboarding que muestre el valor desde el primer minuto

---

## Propuesta

Tres fases secuenciales. Cada fase produce valor independiente y puede deployarse sin esperar a las siguientes.

### Fase 1 — Accessibility Audit + WCAG 2.1 AA Remediation

**Objetivo:** Drenyra cumple con WCAG 2.1 Nivel AA en todos los flujos fiscales principales.

1. **Auditoría automatizada** con axe-core + Playwright sobre las 10 rutas más críticas (dashboard, cognitive-hub, SIRE reconciliation, journal entry, evidence vault, banking, reports, compliance, settings, onboarding).
2. **Auditoría manual asistida** de teclado: cada ruta debe ser navegable con Tab / Shift+Tab / Enter / Escape / Arrow keys sin perder foco ni estado.
3. **Remediación por lotes:**
   - Focus management: `focus-visible` en todos los interactivos, trap focus en modales y drawers, restore focus al cerrar.
   - Semantic HTML: landmarks (`<main>`, `<nav>`, `<aside>`), headings jerárquicos, labels en todos los inputs.
   - ARIA: roles, states, y properties donde el HTML semántico no alcance (live regions para actualizaciones fiscales, aria-expanded en disclosures).
   - Color contrast: verificar todos los pares de texto/fondo contra APCA (preferido) y WCAG AA ratio mínimo; la paleta cyan/violet del DS ya fue diseñada para buen contraste pero no fue verificada sistemáticamente.
   - Screen reader: validar con NVDA/VoiceOver que los flujos fiscales sean comprensibles sin vista.
4. **CI gate de accessibility:** `axe-core` en CI que falle el build si una ruta crítica regresa violaciones WCAG AA.
5. **Keyboard shortcuts registry:** documentar y estandarizar atajos de teclado en toda la app (⌘K para command center, ⌘Enter para confirmar asiento, etc.).

**Métricas de éxito:**

- 0 violaciones WCAG 2.1 AA en axe-core para las 10 rutas críticas
- 100% de interactivos focusables y operables por teclado
- Screen reader anuncia correctamente estados fiscales (aprobado, pendiente, rechazado)

### Fase 2 — Evidence Rail + Approval Inspector UI

**Objetivo:** El contador ve, en tiempo real, toda la evidencia y approvals pendientes sin salir de su workspace.

1. **Evidence Rail (panel lateral derecho):**
   - Lista cronológica de approvals pendientes con badge de prioridad (R0–R3).
   - Cada ítem muestra: tipo de operación, monto, fecha, estado del agente, y acción requerida.
   - Filtros: por tipo (asiento, conciliación, documento, SIRE), por riesgo, por fecha.
   - Estados visuales: propuesto (cyan), en revisión (violet), aprobado (green), rechazado (red), pendiente acción (amber).
   - Animación de entrada/salida para no romper el layout de tres paneles.

2. **Approval Inspector (modal/drawer al hacer clic en un ítem del rail):**
   - Vista detallada del asiento/documento propuesto.
   - Diff visual: lado izquierdo (estado actual del ledger), lado derecho (estado propuesto por el agente).
   - Botones de acción: Aprobar, Rechazar, Editar, Solicitar revisión humana.
   - Campo de comentario obligatorio para rechazos.
   - Trazabilidad: historial de approvals anteriores con timestamps y responsables.

3. **Integración con RED (Receipt-Driven Execution):**
   - Cada approval genera un receipt inmutable visible en el inspector.
   - Link al evidence vault para auditoría completa.

**Métricas de éxito:**

- El contador puede revisar y aprobar/rechazar 10 asientos en < 5 minutos
- 100% de approvals generan receipt trazable
- El rail no bloquea el flujo de trabajo (ancho fijo, colapsable)

### Fase 3 — Accounting Diff Workspace + Print Layouts

**Objetivo:** Herramientas visuales profesionales para entender cambios contables y exportarlos a formatos formales.

**A — Accounting Diff Workspace:**

1. **Diff visual de asientos:** inspirado en `git diff` pero para partidas dobles.
   - Columnas Debe/Haber con montos formateados (separador de miles, 2 decimales, símbolo de moneda).
   - Izquierda: estado actual del ledger. Derecha: estado propuesto. Centro: indicadores de cambio (+/−).
   - Código de cuenta + nombre + monto en cada línea.
   - Resaltado de diferencias: verde (agregado), rojo (removido), amarillo (modificado).
   - Tolerancia a materialidad: no mostrar cambios por debajo del umbral configurado.

2. **Vista de batch:** cuando el agente propone múltiples asientos (ej. cierre mensual), mostrar todos en una tabla con diff resumido y expandir por fila.

3. **Reutilización de cognitive-hub:** el diff workspace se integra como una vista alternativa dentro del cognitive-hub existente (152 archivos), no como una feature separada.

**B — Print Layouts & PDF Reports:**

1. **CSS print stylesheet global:** reglas `@media print` en el design system para ocultar navegación, paneles, y elementos interactivos.
2. **Templates de impresión para los 5 reportes más demandados:**
   - Balance de comprobación (trial balance)
   - Estado de resultados (P&L)
   - Balance general (balance sheet)
   - Libro diario (journal)
   - Reporte de SIRE reconciliation
3. **Formato profesional:** A4, membrete Drenyra, numeración de páginas, fecha de emisión, firma digital placeholder, metadata fiscal (RUC, periodo, tipo de moneda).
4. **PDF server-side:** generación vía Puppeteer/Playwright en el backend para reportes pesados; opción de descarga directa desde el frontend.

**C — Component Library & Storybook (alcance reducido en fase 3):**

- Storybook 8 con los 20 componentes más usados del DS (Button, Input, Select, Modal, Drawer, Table, Badge, Card, Tabs, Breadcrumb, etc.).
- Categorización por: inputs, navigation, feedback, layout, data display.
- Integración con tokens del DS para que los temas (dark/light) se reflejen en Storybook.
- Nota: el catálogo completo (60+ componentes) es aspiracional; fase 3 entrega el MVP de 20 componentes.

---

## No-alcance

- No se rediseñan componentes existentes (solo se mejoran accesibilidad y print)
- No se modifica la arquitectura de cognitive-hub (se integra como vista alternativa)
- No se implementa WAI-ARIA para componentes de terceros no controlados
- No se genera PDF con firmas digitales criptográficas reales (placeholder visual solamente)
- No se migran los 60+ módulos a WCAG AA en una sola fase (fase 1 cubre las 10 rutas críticas; el resto es incremental)
- Onboarding (CAP-UX-09) queda como fast-follow fuera de estas 3 fases; los 16 archivos existentes se auditan pero no se reescriben

---

## PRs Estimados

| Fase      | PRs       | Archivos est. | Líneas est. | Descripción                                   |
| --------- | --------- | ------------- | ----------- | --------------------------------------------- |
| Fase 1    | PR1       | 15–20         | ~400        | Auditoría automatizada + reporte de hallazgos |
| Fase 1    | PR2       | 25–35         | ~600        | Remediación focus + semántica + ARIA          |
| Fase 1    | PR3       | 10–15         | ~250        | Color contrast + screen reader + CI gate      |
| Fase 2    | PR4       | 12–18         | ~500        | Evidence rail UI + integración con RED        |
| Fase 2    | PR5       | 10–15         | ~400        | Approval inspector + diff visual + acciones   |
| Fase 3    | PR6       | 8–12          | ~350        | Accounting diff workspace                     |
| Fase 3    | PR7       | 10–15         | ~300        | Print stylesheet + 5 templates PDF            |
| Fase 3    | PR8       | 20–25         | ~400        | Storybook MVP (20 componentes)                |
| **Total** | **8 PRs** | **110–155**   | **~3,200**  |                                               |

---

## Riesgos

| Riesgo                                                                                       | Severidad | Mitigación                                                                   |
| -------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------- |
| Remediación WCAG rompe layouts existentes al agregar landmarks/focus traps                   | Alto      | PR2 aplica cambios incrementales con tests visuales (Playwright screenshots) |
| Cognitive-hub (152 archivos) es frágil; integrar diff workspace puede desestabilizarlo       | Alto      | PR6 agrega vista alternativa sin modificar la estructura existente del hub   |
| La generación de PDF server-side requiere Puppeteer en el backend (costo de infra)           | Medio     | Empezar con CSS print client-side; Puppeteer solo si la demanda lo justifica |
| La auditoría de accesibilidad revela problemas estructurales que requieren refactors grandes | Medio     | Fase 1 se limita a 10 rutas críticas; las demás se abordan en SDDs futuros   |
| Sin catálogo de componentes, el equipo sigue sin saber qué reutilizar                        | Medio     | Storybook MVP (20 componentes) es suficiente para cubrir el 80% de uso       |
| 3,200 líneas estimadas exceden el presupuesto de revisión (400)                              | Alto      | Dividir en 8 PRs y aplicar estrategia `auto-chain`; cada PR ≤ 600 líneas     |

---

## Rollback

- Cada PR es independiente y puede revertirse sin afectar a los demás.
- Las mejoras de accesibilidad (fase 1) son aditivas: agregar `aria-*`, landmarks, y focus management no rompe funcionalidad existente.
- El evidence rail (fase 2) es un panel adicional que puede ocultarse si hay problemas.
- El diff workspace (fase 3) es una vista alternativa; la vista original del cognitive-hub sigue disponible.
- Los estilos de print se activan solo en `@media print`, cero impacto en pantalla.

---

## Éxito

- **Fase 1:** 0 violaciones WCAG 2.1 AA en CI para las 10 rutas críticas; navegación por teclado completa.
- **Fase 2:** Evidence rail funcional con < 200ms de respuesta; approval inspector con diff visual claro.
- **Fase 3:** 5 reportes imprimibles en A4 profesional; diff workspace integrado al cognitive-hub; Storybook con 20 componentes documentados.
