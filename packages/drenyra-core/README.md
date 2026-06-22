---
last-verified: 2026-06-20
source-of-truth: packages/drenyra-core/package.json
auto-generated: false
---

# @arkelythex/drenyra-core

**Última actualización**: 2026-06-20 · [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md)

Definiciones core de Drenyra compartidas por los agentes de Arkelythex y los workflows del plano de control.

## Propósito

`@arkelythex/drenyra-core` provee los metadatos canónicos de subagentes Drenyra y exports type-safe que se usan para coordinar workflows fiscales y operativos gobernados.

El paquete es intencionalmente pequeño y privado: mantiene la identidad/constantes de agente cerca del dominio Drenyra sin acoplar consumidores a código de API, persistencia o UI runtime.

### ¿Qué contiene?

| Categoría | Descripción |
|-----------|-------------|
| Identidad de agentes | IDs, nombres, roles y capacidades de subagentes Drenyra |
| Constantes | Thresholds, valores por defecto, configuraciones compartidas |
| Tipos | Interfaces TypeScript para comunicación entre agentes |

## Source of truth

- **Package manifest**: [`package.json`](./package.json)
- **Entrypoint público**: [`src/index.ts`](./src/index.ts)

## Scripts

| Script | Propósito |
|--------|----------|
| `test` | Ejecuta la suite Vitest |
| `typecheck` | Valida TypeScript sin emitir |

## Notas de seguridad

- No agregues comportamiento de mutación fiscal acá.
- Mantené las definiciones determinísticas y framework-free.
- La aprobación humana y captura de evidencia quedan en las capas consumidoras del plano de control.
