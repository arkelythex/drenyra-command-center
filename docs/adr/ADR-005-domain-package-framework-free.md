# ADR-005: Domain Package Framework-Free

**Estado:** Aceptado
**Fecha:** 2026-04-25
**Decisores:** Equipo Drenyra

## Contexto

El dominio fiscal (value objects, entidades, reglas de negocio) debe ser portable entre stacks: Bun API, Go CLI, Python data-engine. Si el dominio depende de un framework, no se puede reutilizar.

## Opciones Consideradas

1. **Domain package framework-free** — TypeScript puro, sin dependencias externas
2. **Domain package con DDD framework** (TypeDDD,等功能) — más herramientas, pero coupling
3. **Domain en cada app** — duplicación entre stacks

## Decisión

`packages/domain/` completamente framework-free.

**Razones:**

- Los value objects (Money, RUC, AccountingPeriod) deben poder migrarse a Go/Python sin reescribir lógica
- `packages/application/` puede depender de domain, pero domain no depende de nadie
- Tests con Vitest (no necesitan framework)
- Inmutable: constructor privado + `Object.freeze`

## Consecuencias

**Positivas:**

- Reglas fiscales portables (sin framework lock-in)
- Tests rápidos (sin setup de framework)
- Clareza: "esto es dominio puro, no hay magia"

**Negativas:**

- Más boilerplate (validación manual, sin decorators)
- No hay inyección de dependencias automática

## Impacto Fiscal

Crítico — las reglas fiscales están aisladas de la infraestructura.

## Supersedes

N/A
