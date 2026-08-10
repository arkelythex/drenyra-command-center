# 11 — Architecture Decision Records

**Última actualización:** 2026-07-27
**Propósito:** Decisiones arquitectónicas irrevocables o costosas
**Total:** 14 ADRs existentes + ADR-034
**Formato:** `ADR-NNNN-title.md`

---

## Qué es un ADR

Un Architecture Decision Record documenta una decisión que:

- Es irreversible o costosa de revertir
- Tiene consecuencias significativas en el sistema
- Debe ser entendida por futuros contribuyentes

## Formato

```
ADR-NNNN: Title

Context:   situación que motiva la decisión
Decision:  qué se decidió
Consequences: implicaciones positivas y negativas
Alternatives: opciones consideradas y por qué se descartaron
```

---

## ADRs registrados

| #   | Título                                                                        | Dominio      | Estado |
| --- | ----------------------------------------------------------------------------- | ------------ | ------ |
| 001 | [Bun + Elysia API](./ADR-001-bun-elysia-api.md)                               | Stack        | ✅     |
| 002 | [Drizzle ORM](./ADR-002-drizzle-orm.md)                                       | DB           | ✅     |
| 003 | [TanStack Router](./ADR-003-tanstack-router.md)                               | Frontend     | ✅     |
| 004 | [Vertical Slices + CQRS](./ADR-004-vertical-slices-cqrs.md)                   | Arquitectura | ✅     |
| 005 | [Domain Package Framework-Free](./ADR-005-domain-package-framework-free.md)   | Domain       | ✅     |
| 006 | [React Context + Zustand](./ADR-006-react-context-zustand.md)                 | Frontend     | ✅     |
| 007 | [Go CLI — Fiscal Terminal](./ADR-007-go-cli-fiscal-terminal.md)               | CLI          | ✅     |
| 008 | [Property-Based Testing](./ADR-008-property-based-testing.md)                 | Testing      | ✅     |
| 009 | [Canonical Idempotency Contract](./ADR-009-canonical-idempotency-contract.md) | Data         | ✅     |
| 010 | [Ecosystem Boundary & Authority](./ADR-010-ecosystem-boundary-authority.md)     | Arquitectura | ✅     |
| 011 | [Agent Model — AI Proposes, Core Decides](./ADR-011-agent-model-ai-proposes-core-decides.md) | Arquitectura | ✅     |
| 012 | [Persistence, Security & Recovery](./ADR-012-persistence-security-recovery.md)          | Arquitectura | ✅     |
| 034 | [Drenyra Fiscal App Server](./adr-034-drenyra-fiscal-app-server.md)           | Agent        | ✅     |
| —   | [Descope Decisions](./2026-07-06-descope-decisions.md)                        | Scope        | ✅     |
| —   | [Natural Uniqueness Inventory](./W2-04A-natural-uniqueness-inventory.md)      | Data         | ✅     |
| —   | [Consumer Dedup Inventory](./W2-05A-consumer-dedup-inventory.md)              | Data         | ✅     |
| —   | [Job Uniqueness Inventory](./W2-06A-job-uniqueness-inventory.md)              | Jobs         | ✅     |
| —   | [Scenarios Schema Alignment](./W2-07-scenarios-schema-alignment.md)           | Schema       | ✅     |

---

## Documentos migrados

| Anterior                                           | Nueva ubicación                          |
| -------------------------------------------------- | ---------------------------------------- |
| `docs/adr/*.md`                                    | `./` (todos los ADRs)                    |
| `docs/02-adr/adr-034-drenyra-fiscal-app-server.md` | `./adr-034-drenyra-fiscal-app-server.md` |
| `docs/architecture/decisions/*.md`                 | `./` (decisiones)                        |
