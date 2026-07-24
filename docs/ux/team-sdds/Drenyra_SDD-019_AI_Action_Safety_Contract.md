# SDD-019 — AI Action Safety Contract

**Estado:** PROPOSED  
**Depende de:** SDD-010–018  
**Informa:** SDD-054, 058, 059 y vertical slices

## Decisión

Toda capacidad de IA se clasifica L0 Explain, L1 Recommend, L2 Prepare o L3 Execute. El modelo nunca recibe autoridad implícita por poder invocar una tool. Tools, policies, validators y approvals forman el boundary real.

## Contrato de acción

Cada tool declara:

- nivel máximo L0–L3;
- scopes requeridos;
- schemas de input/output;
- side effects;
- idempotency requirement;
- validators deterministas;
- approval policy;
- reversibility;
- datos permitidos;
- timeout/retry semantics;
- audit/evidence producidos.

## Reglas

1. Outputs del modelo son untrusted hasta validar schema y dominio.
2. Texto recuperado, documentos y sitios externos pueden contener prompt injection.
3. La IA no interpreta un ID como autorización.
4. El motor fiscal decide cálculos y reglas normativas.
5. L2 produce versión/propuesta; no muta libros.
6. L3 exige permission check actual, validators, approval freshness e idempotencia.
7. Secrets no entran al prompt salvo mecanismo aislado que no los revele al modelo.
8. El modelo no declara éxito externo; lo confirma un adapter/reconciler.

## UX

Cada acción muestra nivel y resultado en lenguaje natural: “Explicó”, “Propuso”, “Preparó” o “Aplicó”. No usar “la IA decidió”. Para L2/L3 se muestran fuentes, cambios, validaciones, impacto y siguiente gate.

## Evaluación

- prompt injection indirecta;
- tool argument tampering;
- cross-tenant IDs;
- stale context;
- hallucinated rule/version;
- duplicate execution;
- external timeout after success;
- excessive data disclosure.

## Criterios de aceptación

- Ninguna tool mutable carece de nivel, policy o idempotencia.
- Outputs estructurados rechazan campos inesperados cuando corresponda.
- Validators deterministas pueden bloquear al modelo.
- AgentRun enlaza evidence y audit sin secrets.
- Evals adversariales son gate de release.
