# Domain Package Rules

**Última actualización**: 2026-06-20 · [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md)

Se aplica a `packages/domain`.

## Límites del dominio

- Mantené este paquete framework-free y adapter-free.
- No importes Elysia, Drizzle, React, browser APIs, clientes de base de datos, colas ni servicios de infraestructura.
- Modelá conceptos de negocio con entities, services, events, errors, repositories y value objects.
- Mantené la lógica de dominio determinística y fácil de testear unitariamente.

## Corrección monetaria y fiscal

- No uses floats ni aritmética de `number` crudo para dinero.
- Usá el modelo/value object `Money` del proyecto para valores monetarios.
- Preservá semántica explícita de moneda, redondeo, IGV, retenciones, detracciones y auditoría.
- Para lógica sensible a SUNAT, cubrí checksum de RUC, tipo/serie de documento, UBL 2.1, SIRE y comportamiento CDR/auditoría donde corresponda.

## Tests y exports

- Agregá tests unitarios enfocados para reglas de negocio nuevas o modificadas.
- Mantené los exports públicos intencionales a través de `src/index.ts` o `exports` del package.json.
- No agregues exports de compatibilidad a `packages/core`; ese paquete es un shim a menos que una migración lo requiera explícitamente.
