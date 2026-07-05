# Instrucciones para Claude Code / Gemini CLI en DRENYRA (@drenyra/main)

## Objetivos Generales
- **War Architecture:** Ecosistema FinTech híbrido para cumplimiento SUNAT y atracción de inversión ProInnóvate.
- **Soberanía Técnica:** Core TypeScript (Vertical Slice + CQRS). Rust/WASM planificado para Phase 2 (Q2-Q4 2026, solo hot paths: tax engine, Money VO, XML).
- **Estabilidad Fiscal:** Cero errores en dominio. El cumplimiento de SUNAT (SIRE, facturación) es la prioridad #1.

## Arquitectura General
- **Core (TypeScript):** Vertical Slice Architecture (VSA) + CQRS. `packages/domain` con Value Objects, Entities, Events.
- **Infraestructura (TS/Bun):** Clean Architecture (Entities → Use Cases → Controllers → Adapters).
- **Monorepo:** `packages/` (lógica desacoplada), `apps/` (API Elysia, Web React 19).
- **Invariantes:** Validación explícita de reglas de negocio en TypeScript. Rust PLANNED para Phase 2 con TS fallback obligatorio.
- **Money:** `Money` VO en `@drenyra/domain` (cents pattern). dinero.js NO está instalado — no usar.

## Buenas Prácticas Obligatorias
- **SOLID + DDD:** Uso estricto de Aggregates, Entities y Value Objects.
- **Clean Code:** Funciones < 30 líneas, nombres expresivos, JSDoc mandatorio.
- **Seguridad:** OWASP Top 10. Prohibido hardcodear credenciales. Uso de `SecureLogger`.
- **SIRE Compliance:** Si el código toca facturación o libros, **DEBE** pasar `bun scripts/sire-ledger-repro-check.ts`.

## Pruebas y Calidad (Regla 80/100/0)
- **100% Cobertura:** Domain TypeScript (Vitest). Invariantes fiscales auditados.
- **80% Cobertura:** Integración y adaptadores de infraestructura.
- **Calidad:** Mutation testing en el Core para asegurar que los tests detectan cambios en la lógica fiscal.
- **Linters:** Biome (prioritario) + ESLint para tokens de diseño.

## Git worktrees y aislamiento

- Preferencia de directorio para worktrees: `~/Documents/PROYECTOS/drenyra/worktrees/drenyra/<task-name>`.
- Usar branch dedicada para cada cambio: `codex/<task-name>`.
- Usar worktree aislado para cambios medianos/grandes, fases SDD, trabajo paralelo o cualquier cambio fiscal/SUNAT/DB/AI-control/CI.
- No mezclar fases no relacionadas en la misma branch/worktree.
- Mantener `main` limpio y actualizado; después de mergear, borrar worktree y ramas ya fusionadas.

## Workflow de Ingeniería Autónoma
1. **Protocolo:** Leer `.claude/agents/_protocol.md` antes de cada sesión.
2. **Memoria:** Consultar `.claude/memory/active_plan.md` para el estado del tablero.
3. **Explore:** Analizar `@packages/domain` antes de proponer cambios. `packages/rust-core` no existe aún (Phase 2).
4. **Plan (Architect):** Escribir en `active_plan.md` el split de tareas paralelo.
5. **Implement:** Agentes de Backend y Frontend trabajan sobre sus respectivos slices.
6. **Finalize:** El Auditor valida y cierra la fase en el plan.

## Skills (Organización Socrática)
| Contexto | Ruta |
|----------|------|
| Core Logic, Rust, WASM | `.agents/skills/core/` |
| API, DB, SUNAT Compliance | `.agents/skills/backend/` |
| React 19, Tailwind 4, UI | `.agents/skills/frontend/` |
| CI/CD, Tests, Security | `.agents/skills/ops/` |

---

**Última actualización**: 2026-06-20

*Alineado con la [Filosofía Gentleman](docs/meta/gentleman-philosophy.md) de DRENYRA — documentación que prioriza la claridad y el respeto por tu tiempo.*

## Hooks de Control
- **Pre-command:** `biome check .` (no `cargo check` — Rust no está activo en el repo).
- **Post-command:** `bun run typecheck` (NUNCA npm).

## Integraciones y Modelos (Estrategia Híbrida 2026)
- **Lógica y Arquitectura:** Claude 4.6 Opus / 4.5 Sonnet para todo lo referente a `@.claude/` y lógica fiscal (Hexagonal/Rust).
- **Infraestructura y Multimodal:** Gemini 3 Flash/Pro para OCR de facturas, análisis de logs masivos y orquestación de Kubernetes/Fly.io.
- **Soberanía:** El enjambre agéntico en `.claude/` opera exclusivamente sobre Anthropic 4.5.
