# SDD-012 — Roles, Permissions and Segregation of Duties

**Estado:** PROPOSED  
**Depende de:** SDD-001, SDD-010, SDD-011  
**Informa:** acciones, approvals, automations y administración

## Decisión

Drenyra combinará RBAC para responsabilidades comunes y ABAC para empresa, periodo, estado, materialidad, ownership y política. Los roles canónicos son `owner`, `admin`, `accountant`, `reviewer`, `approver`, `viewer` y `auditor`; ninguna etiqueta concede acceso fuera de una membresía verificada.

## Modelo de decisión

```text
allow = authenticated
  AND active_membership
  AND resource_within_scope
  AND role_capability
  AND period_policy
  AND action_policy
  AND approval_freshness
```

Toda decisión retorna `allow/deny`, reason code, policy version y requerimientos adicionales; no retorna datos del recurso cuando el scope falla.

## Segregación

- `prepare`, `review`, `approve`, `apply`, `administer` son capacidades distintas.
- v0 permite combinación de roles con disclosure y audit.
- Una policy puede impedir que el preparador sea reviewer o approver.
- Acciones críticas pueden exigir dos aprobadores o step-up authentication.
- Administra membresías no implica autoridad fiscal.
- Auditor permanece read-only incluso si descarga evidence permitido.

## Revocación y freshness

Permisos se reevalúan al aplicar. Revocar membresía invalida sesiones, approvals no consumidos y automations futuras según policy. Cambiar propuesta, periodo, monto material o policy invalida approvals anteriores.

## UX

La UI puede ocultar controles irrelevantes, pero nunca sustituye la autorización. Un deny explicable muestra reason code traducido y siguiente paso sin revelar objetos extranjeros. La autoaprobación se etiqueta explícitamente.

## Criterios de aceptación

- Matriz recurso–acción–rol versionada y testeada.
- Tests cubren misma empresa, otra empresa, otra organización y revocación mid-flight.
- No existen checks aislados basados solo en rol frontend.
- Approval y automation conservan policy version.
- Logs permiten explicar por qué una acción fue permitida o denegada.
