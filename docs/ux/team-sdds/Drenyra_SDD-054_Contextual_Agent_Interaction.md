# SDD-054 — Contextual Agent Interaction

**Estado:** PROPOSED  
**Depende de:** SDD-019, 020, 039, 051–053

## Decisión

El agente funcionará como sidecar contextual. El composer recibe referencias explícitas al objeto, selección y periodo; no copia silenciosamente todo el workspace. Acciones se expresan como Explain, Recommend, Prepare o Execute.

## Modos

- Preguntar sobre el objeto.
- Explicar una excepción o diff.
- Preparar propuesta estructurada.
- Ejecutar acción ya validada/aprobada.

## Context disclosure

Antes de enviar, la UI muestra chips de contexto: empresa, periodo, objeto/version y fuentes seleccionadas. El usuario puede remover referencias no obligatorias. Credenciales y datos fuera de scope nunca aparecen como contexto disponible.

## Output

Respuestas separan explicación de artifacts y tool activity. Un artifact preparado abre inspector/diff; no queda enterrado en chat. Citations apuntan a evidence refs. Tool failure conserva lenguaje preciso y recovery.

## Reglas

1. Composer no es global durante una acción material sin contexto.
2. Prompt history no cambia scope efectivo.
3. “Hazlo” no eleva L2 a L3 sin gates.
4. Agent output no modifica UI state crítico directamente.
5. Cancelar streaming no implica cancelar job ya iniciado.

## Criterios de aceptación

- Context chips coinciden con FiscalContext server-side.
- Outputs estructurados abren artifacts versionados.
- Prompt injection evals pasan.
- Usuario distingue conversación, propuesta y ejecución.
- Activity/evidence conservan tools y resultados sin secrets.
