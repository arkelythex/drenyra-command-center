# SDD-093 — Product Observability and UX Telemetry

**Estado:** PROPOSED  
**Depende de:** SDD-004, SDD-018, SDD-020, SDD-090  
**Aplica a:** frontend, API, jobs y producto

## Decisión

Observabilidad técnica, audit y product analytics serán sistemas separados con correlation IDs y políticas de datos distintas. Analytics mide outcomes sin capturar contenido fiscal sensible.

## Señales

- traces request/job/adapter;
- error rate y reason codes;
- latency por route/query/tool;
- queue age, retries, unknown y reconciliation;
- task success y tiempo activo;
- workflow step/drop-off;
- attention resolution;
- approval aging/staleness;
- Web Vitals, long tasks y grid performance.

## Privacy

Events usan IDs pseudónimos y categorías; no RUC, nombres, montos exactos, documentos, prompts o comentarios por defecto. Sampling/retention se documentan. Audit events no se reutilizan como analytics sin policy.

## Alerting

Alertas se basan en SLO y customer impact: cross-tenant deny anomaly, submission unknown, queue backlog, credential adapter failure, elevated stale data y frontend crash loop.

## Criterios de aceptación

- Correlation sigue SIRE end-to-end.
- Dashboards distinguen external dependency e internal fault.
- Baseline SDD-004 puede compararse después del rollout.
- Telemetry schema versionado y testeado.
- Support diagnostica sin acceso excesivo.
