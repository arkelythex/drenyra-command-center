# SDD-074 — IGV Determination Workspace

**Estado:** PROPOSED  
**Depende de:** SDD-011–019, 034, 052, 053, 071, 072

## Decisión

La determinación de IGV será un artefacto versionado producido por reglas deterministas y evidence, con propuestas agentic limitadas a explicar/preparar. El usuario revisa base, débito, crédito, reparos, ajustes, saldo y excepciones antes de aprobar.

## Secciones

- ventas/base y débito fiscal;
- compras/crédito fiscal;
- documentos observados o fuera de periodo;
- ajustes, percepciones/retenciones según alcance;
- saldo anterior y arrastre;
- resultado y reconciliación con fuentes;
- evidence y rule versions.

## Invariantes

1. Cálculos usan precisión/rounding canónicos.
2. Inputs enlazan artifact versions.
3. Una modificación posterior vuelve stale la determinación.
4. Regla/periodo de vigencia son explícitos.
5. Overrides manuales exigen reason/evidence.
6. Resultado no se presenta como declaración enviada.

## UX

Summary explicable con drill-down, no score. Diff contra periodo previo y versión anterior separa variación económica de cambio de datos. Critical exceptions bloquean approval; warnings requieren acknowledgement según policy.

## Criterios de aceptación

- Golden fixtures fiscales aprobados por dominio.
- Recalculation determinista y hash estable.
- Stale inputs invalidan approval.
- Montos pueden trazarse hasta documentos.
- Review/apply registran evidencia completa.
