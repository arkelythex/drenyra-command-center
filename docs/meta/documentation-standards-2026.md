# Estándares de documentación (2026)

**Última actualización**: 2026-10-02
**Audiencia**: quien escribe o revisa documentación en este repo.
**Estado**: vigente; la reorganización completa está planificada en [`odd/tasks/docs-world-class-ecosystem.md`](../../odd/tasks/docs-world-class-ecosystem.md).

## Reglas

| Regla | Detalle |
|-------|---------|
| **Verdad primero** | Cada afirmación debe coincidir con el repo. Lo no implementado se marca *Planned*; nunca se describe como actual. |
| **Fecha** | Todo documento lleva `Última actualización` (`AAAA-MM-DD`). |
| **Enlaces** | Solo a archivos que existen. `bun run docs:check-links --full` debe pasar sin errores. |
| **Un tipo por documento** | Tutorial, how-to, referencia o explicación ([Diátaxis](https://diataxis.fr/)); no mezclarlos en una página. |
| **Docs con el código** | La documentación cambia en el mismo PR que el comportamiento que describe. |
| **Sin secretos ni datos reales** | Ejemplos con RUC/período ficticios; dinero en centavos. |
| **Fuente canónica única** | Una regla vive en un solo lugar y los demás documentos la enlazan ([`AGENTS.md`](../../AGENTS.md) para reglas operativas). |
| **Nombres vigentes** | `drenyra-shell` (antes `drenyra-pi`), `drenyra-ai`, `drenyra-engram`. Lo histórico se marca como tal. |

## Verificación

```bash
bun run docs:verify            # guardas ODD + enlaces del núcleo + superficies de producto
bun run docs:check-links --full  # todos los .md del repo
```

Filosofía y motivos: [`gentleman-philosophy.md`](gentleman-philosophy.md).
