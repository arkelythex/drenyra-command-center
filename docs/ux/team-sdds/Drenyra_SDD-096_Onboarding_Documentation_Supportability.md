# SDD-096 — Onboarding, Documentation and Supportability

**Estado:** PROPOSED  
**Depende de:** SDD-001, SDD-002, SDD-070, SDD-093–095

## Decisión

Ayuda se integrará al momento de necesidad. Drenyra tendrá guidance contextual, documentación orientada a outcomes y herramientas de soporte con acceso mínimo. Un tour genérico no sustituye onboarding real.

## Capas

- Empty states con primer paso.
- Inline explanations para términos/estados.
- Checklists de activación por workflow.
- Command/help search.
- Guías por outcome y rol.
- Runbooks operacionales internos.
- Diagnostic bundle redactado y consentido.

## Reglas

1. Help copy usa vocabulario SDD-002.
2. Documentación indica versión y vigencia.
3. Agente puede citar docs aprobadas, no inventar policy.
4. Support impersonation está prohibida; access temporal se audita.
5. Diagnostic export excluye secrets y contenido fiscal salvo selección explícita.
6. Errores incluyen correlation ID seguro y recovery.

## Activación

El sistema adapta guidance a v0 contador independiente y v1 equipos. Completar primera resolución con evidencia es activation; cerrar tour no lo es.

## Criterios de aceptación

- Top support issues tienen guía y telemetry.
- Docs se prueban contra UI vigente.
- Diagnostic bundle permite investigar sin sobreexposición.
- Keyboard/screen reader acceden a ayuda.
- Deprecated workflows redirigen a documentación actual.
