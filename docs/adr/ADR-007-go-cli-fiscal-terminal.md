# ADR-007: Go para CLI (Fiscal Terminal)

**Estado:** Aceptado
**Fecha:** 2026-05-10
**Decisores:** Equipo Drenyra

## Contexto

El CLI de Drenyra necesita ser rápido, distribuible como binario único, y con buen soporte para TUI. Las opciones incluyen TypeScript (Bun), Rust, y Go.

## Opciones Consideradas

1. **Go** — binario estático, buen ecosistema TUI (bubbletea, charm), rápido
2. **Rust** — más rápido, más seguro, pero curva más alta y ecosistema TUI menos maduro
3. **Bun/TypeScript** — mismo lenguaje que el backend, pero necesita runtime, binario más grande
4. **Python** — lento, necesita runtime, no ideal para CLI

## Decisión

Go con Charm CLI framework (bubbletea + lipgloss + huh).

**Razones:**

- Binario estático: `go build` produce un solo binario sin dependencias
- Buena DX: bubbletea + lipgloss = TUI declarativo type-safe
- Rendimiento: suficiente para operaciones fiscales (no es bottleneck)
- Go routines: ideales para concurrencia (múltiples agentes simultáneos)
- Cross-compilation: build para Linux/macOS/Windows desde CI

## Consecuencias

**Positivas:**

- CLI portable (un binario, anywhere)
- TUI rica con bubbletea
- Cross-stack: Go y TypeScript comparten contratos fiscales

**Negativas:**

- Stack adicional que mantener (Go toolchain)
- Duplicación de lógica fiscal entre Go y TypeScript (mitigado con X1)
- Go no tiene type-safe end-to-end con TypeScript

## Impacto Fiscal

Medio — el CLI expone operaciones fiscales que deben ser consistentes con la API.

## Supersedes

N/A
