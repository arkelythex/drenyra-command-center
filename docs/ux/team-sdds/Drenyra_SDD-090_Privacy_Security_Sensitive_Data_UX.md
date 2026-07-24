# SDD-090 — Privacy, Security and Sensitive Data UX

**Estado:** PROPOSED  
**Depende de:** SDD-010–020, SDD-030–041  
**Aplica a:** producto completo

## Decisión

Drenyra aplicará data minimization, purpose limitation y least privilege desde UI hasta storage. Clasificación inicial: `PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `FISCAL_SENSITIVE`, `SECRET`. Credenciales y tokens son SECRET y nunca entran a prompts, logs, analytics o exports ordinarios.

## Controles

- masking y reveal con permiso/step-up;
- vault references para credentials;
- encryption in transit/at rest;
- signed URLs de corta duración;
- malware scanning y content isolation;
- retention/deletion policy por tipo;
- session/device visibility;
- export/share controls;
- redaction en logs y support tools;
- tenant isolation y deny-by-default.

## UX

Seguridad debe ser comprensible: scope visible, permisos explicables, sesiones revocables y confirmations proporcionales. No usar dark patterns para solicitar acceso. Errores de autorización no revelan existencia ajena. Copy distingue oculto, restringido, expirado y eliminado.

## Agentic threats

Prompt injection, data exfiltration, overbroad retrieval, tool abuse y secret exposure forman parte de threat model. Content externo se etiqueta untrusted y tools aplican schemas/policies independientemente del modelo.

## Criterios de aceptación

- Data inventory y retention matrix aprobados.
- Secrets ausentes de logs/prompts/telemetry.
- Tests de IDOR/cross-tenant en API, jobs, search y exports.
- Uploads peligrosos aislados.
- Incident response y revocation tienen runbook.
