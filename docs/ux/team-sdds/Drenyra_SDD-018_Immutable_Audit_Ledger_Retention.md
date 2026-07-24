# SDD-018 — Immutable Audit Ledger and Retention

**Estado:** PROPOSED  
**Depende de:** SDD-010–017  
**Informa:** seguridad, exportación y observabilidad

## Decisión

El audit ledger será append-only y separado de logs operacionales. Registrará decisiones y cambios relevantes con actor, contexto, recurso, acción, resultado, reason, policy, correlation y timestamp confiable.

## Evento canónico

```ts
type AuditEvent = {
  eventId: string
  eventType: string
  occurredAt: string
  actorRef: string
  organizationId: string
  companyId?: string
  fiscalPeriodId?: string
  resourceRef?: string
  action: string
  outcome: 'allowed' | 'denied' | 'succeeded' | 'failed' | 'unknown'
  reasonCode?: string
  policyVersion?: string
  correlationId: string
  evidenceRefs: string[]
}
```

## Reglas

- No almacenar secretos, passwords SOL, tokens o payloads completos innecesarios.
- Eventos no se actualizan ni borran por operaciones ordinarias.
- Correcciones producen eventos compensatorios.
- Timestamps se generan server-side.
- Accesos y exports sensibles también se auditan.
- Denials relevantes se registran sin confirmar existencia de recursos extranjeros.
- Retención se define por tipo, obligación y policy; no por un único TTL global.

## Integridad

Se usarán secuencias/hash chaining o manifests firmados por batch donde aporte verificación. La indisponibilidad de audit persistence bloquea acciones críticas; acciones de bajo riesgo siguen una policy explícita, nunca silent failure.

## UX

Timeline legible para profesionales y vista técnica exportable. El usuario puede filtrar por actor, objeto, periodo, acción y outcome. “System” y “Agent” se distinguen de humanos.

## Criterios de aceptación

- Eventos críticos sobreviven retries y duplicados sin doble semántica.
- Retención y redacción están documentadas.
- Tests prueban append-only, ordering/correlation y cross-tenant access.
- Export incluye manifest verificable.
- Soporte puede diagnosticar sin leer datos fiscales no necesarios.
