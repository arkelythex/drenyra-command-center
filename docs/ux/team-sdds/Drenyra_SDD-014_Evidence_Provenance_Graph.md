# SDD-014 — Evidence and Provenance Graph

**Estado:** PROPOSED  
**Depende de:** SDD-010, SDD-013  
**Informa:** SDD-015–019, 052, 078

## Decisión

Drenyra representará provenance como grafo dirigido de artefactos y eventos. Cada resultado material debe enlazar sus fuentes, transformaciones, reglas, validaciones, decisiones y salida aplicada.

## Nodos

- `SourceArtifact`
- `DerivedArtifact`
- `RuleVersion`
- `ValidationRun`
- `AgentRun`
- `ProposalVersion`
- `ReviewDecision`
- `ApprovalDecision`
- `ExecutionResult`
- `ExternalReceipt`

## Aristas

`derived_from`, `validated_by`, `proposed_by`, `reviewed_as`, `approved_as`, `applied_as`, `supersedes`, `reverses`, `submitted_to` y `confirmed_by`.

## Invariantes

1. Una arista nunca cruza company scope salvo relación explícita autorizada y no material.
2. Evidence links son append-only; correcciones agregan relaciones.
3. Una propuesta material sin fuentes o razón de ausencia no puede aprobarse.
4. Un AgentRun registra modelo/configuración relevante, tools, inputs referenciados y output estructurado sin almacenar secretos.
5. External receipts se vinculan con solicitud y respuesta efectiva.
6. El grafo soporta explicación upstream y downstream.

## UX

La vista por defecto muestra una cadena resumida: Fuente → Regla/Validación → Propuesta → Decisión → Resultado. El inspector permite expandir sin convertir el grafo en decoración. Evidence missing se muestra como bloqueo o excepción, no como 0% confidence.

## Retención

El grafo almacena referencias y hashes; el contenido sigue políticas por tipo. Si un contenido expira legalmente, permanece un tombstone con motivo, fecha y hash cuando sea permitido.

## Criterios de aceptación

- Todo vertical slice define nodos/aristas generados.
- Puede reconstruirse por qué una acción se aplicó.
- Evidence export verifica hashes y enlaces.
- Tests impiden edge cross-tenant y referencias huérfanas.
- La UI distingue evidencia ausente, inaccesible, expirada y corrupta.
