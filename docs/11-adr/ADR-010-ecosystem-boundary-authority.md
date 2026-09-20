# ADR-010: Ecosystem Boundary & Authority (Design 1)

**Fecha:** 2026-08-11
**Estado:** Aprobado — separación de frontera y autoridad del ecosistema Drenyra
**Alcance:** Drenyra, Drenyra-AI, Drenyra Pi, Drenyra Engram, Drenyra Skills, Adaptadores, Guardian Angel

---

## Context

El ecosistema Drenyra creció con componentes superpuestos: el Command Center llegó a
contener lógica de runtime, la UI podía interpretar narraciones de agentes, y las
fronteras entre interfaz, autoridad, memoria y revisión no estaban formalizadas.
Esta ambigüedad generaba riesgos concretos:

- La UI podía mutar estados autoritativos que pertenecen al Core.
- Un consumidor podía (por error o diseño) convertir un rechazo del Core en aprobación.
- La memoria (Engram) corría riesgo de ser tratada como evidencia autorizante.
- La versión del runtime podía resolverse desde `PATH` en lugar de una versión publicada.

Se necesita una decisión formal que fije **qué componente hace qué** y **qué nunca debe
hacer**, más una **cadena de autoridad** única para toda operación material.

## Decision

Aprobado el Diseño 1 — Frontera y autoridad del ecosistema, con tres piezas normativas:

### 1. Separación de frontera

| Componente | Responsabilidad | Nunca debe |
| --- | --- | --- |
| **Drenyra** | Interfaz, bandejas, visualización, revisión y aprobación | Reimplementar gates o modificar estados directamente |
| **Drenyra-AI** | Misiones, candidatos, materialidad, autoridad, gates, receipts, ledger y recovery | Depender de la UI o confiar en narraciones del agente |
| **Drenyra Pi** | Harness optimizado para ejecutar agentes especializados | Resolver versiones desde PATH o saltarse el Core |
| **Drenyra Engram** | Memoria institucional y recuperación de contexto | Autorizar acciones o tratar recuerdos como evidencia |
| **Drenyra Skills** | Conocimiento contable, fiscal y jurisdiccional versionado | Cambiar políticas congeladas silenciosamente |
| **Adaptadores** | Obtener evidencia de ERP, bancos, SUNAT y archivos | Declarar éxito sin respuesta verificable |
| **Guardian Angel** | Revisión independiente y adversarial | Aprobar su propio trabajo o sustituir al profesional |

### 2. Cadena de autoridad

1. El profesional solicita un resultado desde Drenyra.
2. Drenyra crea una misión mediante el contrato publicado de Drenyra-AI.
3. Los agentes investigan, proponen y preparan candidatos.
4. Drenyra-AI calcula identidad, alcance y materialidad.
5. Los gates determinan qué evidencia y aprobación se requieren.
6. El profesional aprueba cuando corresponde.
7. Un adaptador ejecuta o confirma la acción externa.
8. Drenyra-AI registra el resultado con receipt firmado y ledger verificable.
9. Drenyra solo representa el estado autoritativo retornado por el Core.

### 3. Regla de dependencia

- Drenyra y Drenyra Pi consumen **versiones publicadas** de Drenyra-AI; Drenyra-AI nunca
  depende de ellos.
- La UI puede caerse y reconstruirse desde el estado del Core; un transcript puede
  perderse y la misión recuperarse desde eventos y evidencia.
- **Ningún consumidor puede convertir un rechazo del Core en aprobación.**

## Consequences

**Positivas:**

- Fronteras revisables: un PR que reimplementa lógica del Core en la UI se rechaza con
  referencia a esta decisión.
- Recuperación garantizada: la UI es reconstruible desde el estado del Core; los
  transcripts son prescindibles.
- Evidencia no negociable: memoria ≠ autorización, narrativa ≠ evidencia, versión
  publicada ≠ checkout.

**Negativas / costos:**

- Extracción pendiente: partes de Drenyra todavía consumen artefactos internos mientras
  la extracción a los repos hermanos termina.
- Requiere disciplina de versionado publicada en drenyra-ai (RELEASING) y verificación
  de pin en Drenyra Pi.
- El Guardian Angel necesita un contrato de independencia explícito (no revisar su
  propio trabajo) que aún debe implementarse en el harness.

## Alternatives

- **Mantener el estado actual (fronteras implícitas):** descartado — la ambigüedad ya
  produjo duplicación real (services/engram, scripts muertos) y riesgo de autoridad.
- **Drenyra como fuente única de verdad:** descartado — viola la reconstruibilidad de la
  UI y acopla la interfaz al estado autoritativo.
- **Engram como capa de autorización:** descartado — "remember is not authorize" es un
  invariante de seguridad del ecosistema.

---

**Fuente canónica de esta decisión:** [Ecosystem Boundaries — Drenyra](../architecture/ecosystem-boundaries.md) y sus espejos en `drenyra-ai`, `drenyra-pi` y `drenyra-engram`.

**Ver también:** [ADR-011 — Agent Model (Design 3)](./ADR-011-agent-model-ai-proposes-core-decides.md) — cómo los agentes proponen y el Core determinista decide.
