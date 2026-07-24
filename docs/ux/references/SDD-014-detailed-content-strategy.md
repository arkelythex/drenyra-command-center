---
status: reference
normative: false
consumed_by: SDD-008
---

# SDD-014: Evidence-First Content Strategy

**Last updated**: 2026-07-14
**Content type**: UX specification
**Status**: ✍️ Draft
**Priority**: P1 — Trust Core
**Ola**: 2 — Fiscal Trust Core
**Dependencies**: SDD-002 (Trust Contracts), SDD-006 (Evidence System), SDD-003 (Information Architecture)
**Next**: SDD-015 — Fiscal Onboarding Progresivo

---

## 1. Abstract

Drenyra hoy presenta información fiscal como datos en crudo: tablas, números, indicadores. El problema no es la precisión — es la **falta de contexto probatorio**. Un contador ve una cifra pero no sabe de dónde vino, cómo se calculó, si está verificada, o si puede confiar en ella para una declaración.

Este SDD define cómo Drenyra **presenta información fiscal con evidencia integrada**. No se trata de añadir paneles de "confianza" decorativos. Se trata de que cada número, cada tabla, cada indicador traiga consigo: fuente, método de cálculo, estado de verificación, nivel de confianza, y camino a los datos crudos.

La premisa es simple: **en un sistema fiscal, la confianza no es un sentimiento — es una propiedad visible del dato.**

## 2. North star

> Que un contador pueda mirar CUALQUIER número en Drenyra y responder en <10 segundos: ¿esto de dónde salió, cómo se calculó, y puedo confiar en él?

## 3. Problem statement

Hoy en Drenyra (y en casi todos los sistemas contables):

| Problema | Costo fiscal |
|----------|-------------|
| Números sin fuente visible | Contador pierde 5-15 min rastreando origen manualmente |
| Confianza no diferenciada | Dato de SUNAT se ve igual que estimación de AI |
| Estado de verificación invisible | Contador declara un número que no estaba verificado |
| Evidencia colapsada en tooltip | Información crítica escondida en hover, invisible en print |
| Cálculos sin desglose | Contador no puede validar lógica intermedia |
| Datos sensibles sin marcación | Exposición accidental en reportes compartidos |

El resultado: **fricción constante, decisiones sin evidencia completa, y dependencia de "confianza institucional" en vez de confianza verificable.**

## 4. User research links

- SDD-001 — Archetypes P1-P8: Validación de que contadores necesitan ver la fuente antes de confiar
- SDD-001 — JTBD #4 ("Verificar consistencia de declaración"): Depende de evidencia visible
- SDD-001 — JTBD #7 ("Auditar período cerrado"): Requiere evidencia histórica accesible
- SDD-001 — Anxieties: "Si no veo de dónde sale, no lo firmo"

## 5. Invariants affected

| # | Invariant | Relevance |
|---|-----------|-----------|
| I1 | RUC scoping | Todo contenido evidencia debe mostrar RUC de origen |
| I2 | Explicabilidad AI | Cálculos de AI deben mostrar fuente y razonamiento |
| I6 | **Evidence first** | CRÍTICO — Datos crudos siempre accesibles desde cualquier resumen |
| I7 | Progressive disclosure | Evidencia L0 visible siempre, L1-L2 expandible |
| I10 | Print readiness | Todo contenido evidencia debe imprimirse sin pérdida |
| I11 | Consistency | Patrones de presentación de evidencia consistentes en todo el sistema |
| I12 | Performance | Indicadores de confianza no deben degradar tiempo de carga |

## 6. L0-L3 mapping (content presentation)

| Level | Qué muestra el usuario | Cuándo se usa |
|-------|----------------------|---------------|
| **L0** | Valor + badge de estado de confianza + fuente abreviada | Vista normal, tablas, resúmenes |
| **L1** | L0 + badge expandido con source, método, timestamp, y enlace "Ver detalle" | Hover o click en badge, primera expansión |
| **L2** | L1 + breakdown completo con sub-cálculos, evidence IDs, y enlaces a datos crudos | Panel lateral o modal dedicado |
| **L3** | L2 + datos crudos embedidos (JSON, XML SUNAT, PDF de CDR) sincronizados | Forense, auditoría, resolución de disputas |

Cada nivel carga bajo demanda. L0 es instantáneo. L1-L3 pueden ser async.

## 7. Evidence-first content principles

### P1 — La fuente es parte del dato
Todo valor fiscal mostrado debe incluir al menos:
- **Fuente** (SUNAT, usuario, AI, derivado, configuración, regla)
- **Estado** (verificado, pendiente, conflictivo, no verificado, error)
- **Confianza** (baja/media/alta/definitiva)

### P2 — El badge de confianza es parte del data display
No hay tooltip mágico. El badge de estado (SDD-002, Trust Contract #1) es un elemento visible del componente de dato, no un adorno flotante.

### P3 — El desglose no es un lujo
Para cálculos de múltiples pasos (IGV, detracción, percepción), el valor final debe poder expandirse para mostrar cada sub-operación con su propia fuente y confianza.

### P4 — Datos sensibles se marcan
Valores que contienen información de terceros (proveedores, clientes) deben mostrar un indicador visual sutil de "dato externo" sin revelar el contenido.

### P5 — Lo no verificado se ve diferente
Un valor pendiente de verificación (importación en proceso, conciliación sin confirmar) debe tener representación visual distinta a uno verificado — sin depender solo de color.

### P6 — El contexto persiste en exportación
PDF, CSV, y JSON exportados deben incluir metadatos de evidencia (fuente, timestamp, RUC, período) en header o metadata del archivo.

## 8. Content hierarchy for fiscal data

### 8.1 Hierarchy levels

| Level | Componente | Contenido evidencia | Interacción |
|-------|-----------|-------------------|-------------|
| H1 | Page title / dashboard metric | L0 badge integrado | Click → L1 panel |
| H2 | Card / section header | L0 badge inline | Hover → L0 tooltip expandido |
| H3 | Table cell | L0 badge compacto | Click → L1 inline expansion |
| H4 | Detail field | L1 inline | Expansión a L2 por defecto en detalle |
| H5 | Raw data viewer | L2+ completo | Navegación a L3 viewer |

### 8.2 Priority of evidence display

Cuando el espacio es limitado, mostrar en orden:
1. **Valor** — el dato fiscal
2. **Estado** — badge de confianza (SDD-002)
3. **Fuente** — abreviada (SUNAT/AI/Manual)
4. **Confianza** — numérica solo si < 1.0 o contextual

## 9. Data visualization patterns

### 9.1 Fiscal number display

```
Formato canónico: [Valor] [Badge Estado] [Fuente abreviada]

Ejemplos:
  S/ 15,234.00  ✓ Verificado  SUNAT
  S/ 3,200.00   ○ Pendiente   Usuario (15/07/2026)
  S/ 8,100.50   ⚠️ Conflictivo  Derivado
  S/ 45,000.00  — Sin verificar  AI
```

### 9.2 Comparison display

Cuando se muestran dos valores para comparar (declarado vs calculado, período actual vs anterior):

```
Declarado:     S/ 15,234.00  ✓ Verificado  SUNAT
Calculado:     S/ 15,210.00  ✓ Verificado  Regla (IGV 18%)
Diferencia:    S/ 24.00      • Explicable
```

Cada valor en la comparación lleva su propio badge de evidencia.

### 9.3 Time-series display

Gráficos de línea deben incluir:
- Tooltip en cada punto con L0 completo (valor + badge + fuente)
- Indicador de cambios de fuente (línea punteada cuando cambia de SUNAT a derivado)
- Anotaciones de eventos (declaración presentada, rectificación, auditoría)

### 9.4 Breakdown display

Para valores compuestos (ej: IGV total por período):

```
IGV Total: S/ 2,748.00  ✓ Verificado  Derivado
├── IGV Ventas: S/ 1,800.00  ✓ Verificado  SUNAT (F001-1..50)
├── IGV Compras: S/ 948.00   ✓ Verificado  SUNAT (E001-1..30)
└── Cálculo: (1,800 - 948) × 18% = S/ 2,748.00
```

Cada sub-componente expandible a L1 con su propia fuente.

## 10. Trust indicators by entity type

| Entity type | Evidence display | Trust indicator |
|-------------|-----------------|-----------------|
| **Documento (factura, boleta)** | Badge por línea + badge total | Estado SUNAT (aceptado/rechazado/pendiente) |
| **Declaración** | Badge por tributo + badge consolidado | Estado declaración (presentada/rectificada/omisa) |
| **Tributo (IGV, Renta)** | Badge por período + breakdown | Estado deuda (pagada/pendiente/vencida) |
| **Período fiscal** | Badge resumen + enlace a detalle por documento | Estado período (cerrado/abierto/en revisión) |
| **Contribuyente (RUC)** | Badge de estado SUNAT + alertas activas | Estado RUC (activo/suspendido/baja) |
| **Detracción/Percepción** | Badge por operación + breakdown acumulado | Estado SPOT |
| **Conciliación** | Badge por diferencia + nivel de confianza | % de coincidencia |

## 11. Presentation states

### 11.1 Loading state (evidence pending)

```
Valor: ████████  Verificando...
Estado: ⏳ En proceso
Fuente: SUNAT (consulta en curso...)
```

- Skeleton loader específico para evidencia (no genérico)
- Tiempo estimado visible si > 3s
- No ocultar otros datos verificados mientras uno carga

### 11.2 Empty state (no evidence available)

```
Valor: S/ 0.00  
Estado: — Sin datos
Fuente: — No hay registros para este período
```

- Diferente de "no verificado": significa que no existe el dato, no que está pendiente
- Sugerencia de acción: "Importar datos SUNAT" o "Ingresar manualmente"

### 11.3 Error state (evidence unavailable)

```
Valor: --.--  
Estado: ✗ Error al cargar
Fuente: SUNAT (Error de conexión)
Acción: [Reintentar] [Ver datos locales]
```

- Mantener último valor conocido si existe
- No perder contexto: mostrar RUC, período, y tipo de dato aunque falle la evidencia

### 11.4 Edge cases

| Edge case | Handling |
|-----------|----------|
| **Fuente mixta** (parte SUNAT + parte AI) | Badge compartido "Mixto" con breakdown por componente |
| **Confianza baja pero único disponible** | Badge "Sin verificar" + nota "Única fuente disponible" |
| **Dato recién actualizado** | Badge "Actualizado" con timestamp por 5 min, luego transición a estado normal |
| **Dato con advertencia** (ej: IGV calculado con tasa anterior) | Badge + nota de advertencia visible siempre |
| **Múltiples RUC en un mismo reporte** | Cada valor mantiene su badge RUC (SDD-009) + badge evidencia |

## 12. Evidence depth levels (UI)

### 12.1 L0 — Tag de confianza (siempre visible)

```
Componente mínimo: [Badge] [Fuente abreviada]
Ejemplo: ✓ Verificado  SUNAT
```

- Ocupa < 80px en línea
- No requiere interacción
- Color + icono + texto (WCAG AAA contraste)

### 12.2 L1 — Panel expandible

```
[Badge expandido]
Fuente: SUNAT (consulta directa)
Método: Obtenido de SUNAT OSE v2.1
Timestamp: 2026-07-14T10:30:00Z
Verificado: Sí (coincide con CDR)
[Ver detalle completo →]
```

- Accesible por click en badge L0 o atajo de teclado (Enter)
- Panel inline o flyout según contexto
- Cierra con Escape o click fuera

### 12.3 L2 — Raw data viewer

```
┌─────────────────────────────────────┐
│  Evidence ID: ev_20260714_001       │
│  Source: SUNAT OSE API              │
│  Method: consulta_cdr()             │
│  Confidence: 1.0 (definitivo)       │
│  Verified by: CDR match rule #42    │
│  Raw data: [Ver XML] [Ver JSON]     │
│  History: creado, verificado,       │
│           re-verificado (3 veces)   │
└─────────────────────────────────────┘
```

- Modal o página dedicada
- URLs a datos crudos (CDR XML, JSON de API, etc.)
- Timeline de cambios del valor

## 13. Progressive disclosure in evidence

| Contexto | Muestra por defecto | Expansión disponible |
|----------|--------------------|--------------------|
| Tabla de documentos | L0 badge + fuente | L1 con datos de línea |
| Dashboard de período | L0 badge + indicador consolidado | L1 breakdown, L2 datos crudos |
| Formulario de declaración | L1 inline (valor + badge + fuente) | L2 detalle de cálculo |
| Reporte exportado | L0-L1 según tipo (PDF = L1, CSV = L0) | N/A (estático) |
| Panel de auditoría | L2 completo | L3 datos crudos embedidos |

## 14. Accessibility for evidence

| Requisito | WCAG | Implementación |
|-----------|------|----------------|
| Badge de estado sin color | 1.4.1 | Icono + texto descriptivo siempre visible |
| Contraste badge | 1.4.3 AA (4.5:1), target 1.4.6 AAA (7:1) | Paleta de 8 estados con verificación automática |
| Lector de pantalla L0 | 4.1.2 | `aria-label="IGV: 15 mil 234 soles, verificado, fuente SUNAT"` |
| Live region en cambio de estado | 4.1.3 | `role="status"` con `aria-live="polite"` |
| Navegación L0→L1→L2 | 2.1.1 | Enter expande, Escape cierra, Tab mantiene foco |
| Print evidencia | 1.4.10 | Badges y metadatos visibles en print, no tooltips |

## 15. Print-ready evidence

Al exportar a PDF/print:

- **Badges se convierten en texto**: `✓ Verificado [SUNAT]` en vez de iconos de color
- **Tooltips se inlinean**: Toda información L1 aparece como nota al pie
- **URLs completas**: Enlaces a datos crudos se imprimen como URLs subrayadas
- **Header de evidencia por página**: Fuente, RUC, período, y timestamp en header de cada página
- **Formato columnar**: Datos crudos en formato tabular, no colapsados

## 16. Success metrics

| Métrica | Objetivo | Cómo se mide |
|---------|----------|-------------|
| Tiempo para identificar fuente de un valor | < 5s | Telemetría SDD-004 (click-to-evidence) |
| Tasa de expansión L0→L1 | > 60% en primera sesión | Analytics de panel |
| Tasa de abandono por falta de evidencia | < 5% | SDD-004 (session abandon) |
| Errores por confiar en dato no verificado | 0 (cero) | Auditoría de post-mortem |
| Tiempo para verificar un período completo | Reducción 40% vs línea base | Benchmark UX |
| Badges de evidencia ignorados | < 10% | Tracking de hover/click en badges |

## 17. Risks

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| **Saturación visual**: Demasiados badges hacen ruido | Progresiva disclosure L0-L3, agrupación por contexto |
| **Falsa confianza**: Badge "verificado" malinterpretado | Tooltip L1 obligatorio explica qué significa "verificado" |
| **Performance**: Consultas L2/L3 lentas | Carga lazy con skeleton, caché de 5 min, prefetch contextual |
| **Complejidad de implementación**: Cada tipo de dato requiere mapeo de evidencia diferente | Taxonomía unificada (SDD-003), renderizador de evidencia genérico |
| **Datos sin fuente**: Datos migrados de sistemas legacy sin origen | Badge "Sin fuente" + workflow para asignar fuente manual |

## 18. Dependencies

| SDD | Dependencia | Naturaleza |
|-----|------------|-----------|
| SDD-002 | Trust Contract #1 (Evidence) | Define el badge y estados |
| SDD-003 | Information Architecture | Taxonomía de entidades fiscales para aplicar evidencia |
| SDD-005 | Accessibility Strategy | Patrones WCAG para badges y expansión |
| SDD-006 | Evidence System | Define fuente, confianza, y niveles de evidencia |
| SDD-007 | L0-L3 AI Model | Mapeo L0-L3 para contenido generado por AI |
| SDD-009 | RUC Scoping | Badge RUC integrado con badge de evidencia |
| SDD-012 | Notification System | Notificaciones con evidencia embebida |
| SDD-013 | Error Recovery | Estados de error con evidencia contextual |

## 19. DONE criteria

- [ ] Catálogo completo de tipos de dato fiscal con mapeo de evidencia
- [ ] Componente `<EvidenceBadge>` implementado con L0-L3
- [ ] Sistema de carga lazy por nivel implementado y probado
- [ ] Todos los valores fiscales en pantalla tienen badge (sin excepciones sin justificar)
- [ ] Badges cumplen WCAG 2.2 AA+ (verificado con axe-core)
- [ ] Exportación PDF incluye metadatos de evidencia en header
- [ ] Print stylesheet con badges inlineados
- [ ] Dashboard de telemetría (SDD-004) mide tiempo de identificación de fuente
- [ ] Performance budget: L0 < 50ms, L1 < 200ms, L2 < 1s, L3 < 3s
- [ ] Keyboard navigation: Enter expande, Escape cierra, Tab cycle
- [ ] Edge cases cubiertos: fuente mixta, confianza baja, dato recién actualizado
- [ ] Pruebas con lectores de pantalla (NVDA, VoiceOver, JAWS)
- [ ] 100% de tipos de dato fiscal en SDD-003 tienen badge asignado
- [ ] Documentación de patrones publicada para desarrolladores

---

## 20. Changelog

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-07-14 | Creación inicial del documento | — |

---

**Próximo SDD**: SDD-015 — Fiscal Onboarding Progresivo (Ola 2, Fiscal Trust Core).
