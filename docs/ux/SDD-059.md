# SDD-059 — Fiscal Rules and Skills Administration

**Estado:** PROPOSED  
**Depende de:** SDD-002, 012, 014, 019  
**Informa:** agent configuration y country packs

## Decisión

Drenyra separará tres recursos:

- **FiscalRule:** determinista, versionada, testeada y con vigencia.
- **Skill:** instrucciones/recursos/scripts para un workflow agentic.
- **CompanyPolicy:** configuración autorizada dentro de límites de producto/norma.

Ninguna skill puede redefinir una FiscalRule ni una CompanyPolicy puede desactivar un invariante legal o de seguridad.

## FiscalRule

Metadata: jurisdiction, obligation, effective range, source refs, inputs, output schema, test fixtures, version y status. Publicación requiere domain review y regression suite.

## Skill

Metadata: purpose, trigger, allowed levels/tools, dependencies, data access, owner, version y evals. Skills externas permanecen disabled hasta review.

## CompanyPolicy

Configura responsables, thresholds, approval chains, reminders y preferencias permitidas. Toda modificación genera audit event y aplica desde fecha/version explícita.

## UX

Tres secciones separadas; copy evita “regla de IA”. La UI muestra vigente, próxima, deprecated y superseded. Preview identifica empresas/workflows afectados.

## Criterios de aceptación

- Tipos y permisos separados en API/DB/UI.
- Rule evaluation es determinista.
- Skill no puede invocar tool fuera de manifest/policy.
- Cambios de vigencia invalidan propuestas dependientes cuando corresponde.
- Audit/evidence conserva rule/skill/policy version utilizadas.
