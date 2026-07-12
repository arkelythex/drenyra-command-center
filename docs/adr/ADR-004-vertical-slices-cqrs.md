# ADR-004: Vertical Slices + CQRS en API

**Estado:** Aceptado
**Fecha:** 2026-04-20
**Decisores:** Equipo Drenyra

## Contexto

La API de Drenyra crece rápido (42+ features). Necesita un patrón que permita escalar el desarrollo en paralelo sin pisar archivos del otro, manteniendo consistencia fiscal.

## Opciones Consideradas

1. **Vertical Slices + CQRS** — cada feature autocontenida, commands/queries separados
2. **Layered Architecture (Controller → Service → Repository)** — tradicional, pero acopla features
3. **Hexagonal (Ports & Adapters)** — más desacoplado, pero más boilerplate
4. **Modular Monolith** — módulos DDD, pero más overhead organizacional

## Decisión

Vertical Slices + CQRS ligero.

**Razones:**

- Cada feature en su directorio: `features/<name>/` — nadie pisa a nadie
- CQRS liviano: commands/queries como funciones, no como clases con event bus
- Dos niveles: full hexagonal (para features complejas como billing, banking) y lightweight (para features simples)
- No hay capas horizontales compartidas (sin "services/" global)

## Consecuencias

**Positivas:**

- Múltiples developers pueden trabajar en distintas features sin conflictos
- Una feature se puede refactorizar sin afectar otras
- Fácil de navegar: sabés exactamente dónde está cada cosa

**Negativas:**

- Puede haber duplicación entre features similares (se mitiga con packages compartidos)
- La composición en `app-core.ts` se hace larga (42 imports)
- No hay restricción técnica contra cross-feature dependency

## Impacto Fiscal

Alto — cada feature fiscal está aislada, cambios en una no afectan otras.

## Supersedes

N/A
