# SDD Proposal: Accountant Interface — Drenyra para Contadores

> **Estado**: proposal
> **Creado**: 2026-07-09
> **Audiencia**: El contador que usa Drenyra a diario para gestión fiscal

---

## 1. Problema

Drenyra tiene un motor fiscal robusto: pipelines SDD con gates, evidence store, review lenses, orquestador con delegación. Pero **todo eso es invisible para el contador**.

Hoy un contador no puede:

- Preguntar "¿cuál es el IGV de julio 2026?" y obtener respuesta con evidencia
- Decir "analizame este período" y que el sistema ejecute el pipeline fiscal completo
- Ver una recomendación del agente y aprobarla o rechazarla con un comando
- Obtener un reporte legible con CDR, hash SUNAT, confianza y período

El harness está listo para ingenieros. Falta la capa para **contadores**.

## 2. Solución

Tres campañas que construyen la interfaz contable de Drenyra:

### A1: Natural Language Query Engine

Un intérprete de lenguaje natural → pipeline fiscal:

- `drenyra consulta "IGV de julio 2026"`
- `drenyra consulta "detracciones pendientes"`
- `drenyra consulta "resumen SIRE del período"`

El orquestador recibe el intent, decide qué pipeline ejecutar, corre el pipeline fiscal, y devuelve una respuesta estructurada con evidencia.

**Componentes**:

- `packages/fiscal-query-engine/` — NLP intent classifier + pipeline router
- `apps/cli/internal/cmd/consulta.go` — CLI command `drenyra consulta`
- `apps/api/src/features/consulta/` — API endpoint POST /api/consulta
- Evidence formatter: texto legible + JSON estructurado

### A2: Recommendation + Approval Workflow

El agente recomienda acciones fiscales, el contador aprueba o rechaza:

```
Agente: "Recomiendo contabilizar IGV S/18,000 basado en factura F001-123 (CDR ok, confianza 0.92)"
Contador: "drenyra aprobar rec-001"
→ Se ejecuta la acción, se registra el approval trail
→ Si rechaza: "drenyra rechazar rec-001 --motivo 'periodo incorrecto'"
→ Se registra el rechazo con motivo y se sugiere corrección
```

**Componentes**:

- `packages/fiscal-approval/` — Recommendation engine, approval gate, audit trail
- `apps/cli/internal/cmd/aprobar.go` — CLI `drenyra aprobar|rechazar|pendientes`
- Evidence display: confianza, fuente, período, RUC, hash CDR
- Pre-approval gate en el pipeline fiscal (bloquea hasta aprobación humana)

### A3: Accountant Web Panel

Panel web para el contador con:

- **Dashboard**: resumen fiscal del período, alertas, pendientes de aprobación
- **Query input**: campo de lenguaje natural con resultados visuales
- **Approval panel**: lista de recomendaciones con aprobar/rechazar con un click
- **Evidence viewer**: expandir para ver CDR, hash, confianza, fuente
- **History**: historial de consultas, aprobaciones y pipelines ejecutados

**Componentes**:

- `apps/web/src/features/consulta/` — Query input + results page
- `apps/web/src/features/approval/` — Approval panel + dashboard
- `apps/web/src/features/evidence/` — Evidence viewer component
- Shared types en `packages/shared/src/consulta/`

## 3. Decisiones de Arquitectura

| Decisión        | Opción elegida                                                | Alternativa descartada                               |
| --------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| NLP engine      | Pattern matching + AI classifier (DeepSeek/Claude) vía agente | Modelo NLP custom (mucho costo, lento de entrenar)   |
| Approval state  | En evidence store del pipeline fiscal                         | Tabla separada (duplicación, risk de inconsistencia) |
| CLI vs Web      | Ambos (CLI para rápidas, Web para revisión)                   | Solo uno (limita casos de uso)                       |
| Pre-aprobación  | El pipeline pausa en el gate hasta approved                   | Siempre automático (riesgo fiscal)                   |
| Evidence format | Markdown + JSON (machine + human readable)                    | Solo JSON (ilegible para contadores)                 |

## 4. No-Goalls (para esta iteración)

- Dashboards complejos con gráficos (futuro)
- Múltiples períodos simultáneos
- Integración con sistemas contables externos
- Mobile app
- Traducción a quechua/aimara (aunque sería genial)

## 5. Estimación de Esfuerzo

| Campaña               | Archivos  | Líneas estimadas | PRs                    |
| --------------------- | --------- | ---------------- | ---------------------- |
| A1: Query Engine      | 8-12      | ~600             | 2 (CLI + API)          |
| A2: Approval Workflow | 6-10      | ~500             | 2 (engine + CLI)       |
| A3: Web Panel         | 10-15     | ~800             | 2 (components + pages) |
| **Total**             | **24-37** | **~1900**        | **6**                  |

## 6. Riesgos

| Riesgo                                  | Probabilidad | Mitigación                              |
| --------------------------------------- | ------------ | --------------------------------------- |
| NLP classifier impreciso                | Media        | Fallback a CLI tradicional con flags    |
| Contador no quiere CLI                  | Baja         | Web panel first, CLI como secondary     |
| Aprobación lenta (cuello de botella)    | Media        | Timeout + escalación automática         |
| Evidence incompleta por bug en pipeline | Baja         | Approval bloquea si falta evidence hash |

---

**Próximo paso**: ¿Aprobás este proposal para pasar a spec + design?
