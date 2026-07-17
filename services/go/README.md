# Go services (Arkelythex)

## Por qué existe Go aquí

Los servicios en Go cubren **workers de alto throughput** y rutas muy acotadas donde el runtime y el ecosistema estándar aportan más que Bun/TS para el mismo coste operativo. La decisión de capas está en [ADR-015](../../docs/02-adr/adr-015-layered-language-placement-ts-go-rust.md).

## Criterio de permanencia

- **Mantener** si el servicio sigue siendo el punto de entrada para conciliación u otros flujos batch con requisitos de latencia/CPU distintos al API principal.
- **Reevaluar / migrar a TS** si el contrato HTTP se estabiliza, el volumen baja, o el coste de operar dos runtimes supera el beneficio (documentar en ADR).
- **No añadir** nuevos binarios Go sin revisión de arquitectura y sin README en la carpeta del servicio.

## Contenido

| Ruta | Rol |
| :--- | :--- |
| [reconciliation-worker](./reconciliation-worker/) | Worker HTTP de conciliación por referencia/importe |

## Contrato con el monorepo TypeScript

- **Transporte**: HTTP JSON (rutas versionadas bajo el prefijo del worker).
- **Descubrimiento**: el API Bun orquesta llamadas; los contratos de request/response deben alinearse con los DTOs o tests de contrato del lado TS donde existan.
- **CI**: `bun run architecture:check-polyglot` ejecuta `go test ./...` en este servicio; también corre en el workflow nocturno.

## Comandos

```bash
bun run go:reconcile:dev   # desarrollo local
bun run go:reconcile:test  # tests
```

---

**Última actualización**: 2026-06-20

*Alineado con la [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md) de ARKELYTHEX — documentación que reduce carga cognitiva y enseña con calidez.*
