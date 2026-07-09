# H0: Agentic Harness — Superar gentle-ai

## Propuesta

El harness agentico de Drenyra debe superar a gentle-ai en las capacidades que gentle-ai tiene y Drenyra no: sub-agentes reales, sesiones persistidas, artifact browser, skill registry fiscal, slash commands.

## Scope

3 PRs, ~1,200 líneas estimadas.

## Estrategia

No copiar gentle-ai. Superarlo con identidad fiscal: los sub-agentes hablan fiscal, las sesiones guardan evidencia, los slash commands ejecutan compliance chains.

## PRs

1. **Sub-agentes reales**: SubAgentRunner runtime=subagent funcional con creación de sesiones Pi via intercom. Timeout, retry, logging.
2. **Sesiones persistidas + resume UI**: El resume() del orchestrator conectado al artifact store + comando CLI para listar/reanudar pipelines.
3. **Skill registry fiscal**: Registry de skills por tipo de cambio normativo (ej: "cambio-tasa-igv" → chain IGV, "cierre-mensual" → chain cierre). Resolución automática.

## Dependencias

- Base: FiscalComplianceOrchestrator (existe)
- packages/domain: nuevos tipos de skill registry
- apps/cli: nuevos comandos slash

## Riesgos

- intercom puede no estar disponible en todas las sesiones → fallback a inline
- Skill registry necesita mantenerse actualizado con nuevas chains
