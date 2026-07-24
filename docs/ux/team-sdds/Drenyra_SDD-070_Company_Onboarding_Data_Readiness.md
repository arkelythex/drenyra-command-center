# SDD-070 — Company Onboarding and Data Readiness

**Estado:** PROPOSED  
**Depende de:** SDD-001, 010–014, 019, 020, 035, 038

## Decisión

Onboarding termina cuando una empresa está lista para resolver un workflow, no cuando el usuario completa un tour. El flujo crea/accede a organización, verifica membresía, registra empresa/RUC, configura periodo y fuentes, valida credenciales mediante adapters seguros y produce un diagnóstico de data readiness.

## Etapas

1. Organización y rol.
2. Empresa/RUC y datos maestros.
3. Periodo inicial.
4. Fuentes/integraciones.
5. Importación o sincronización de muestra.
6. Validación y readiness report.
7. Primer workflow recomendado.

## Readiness dimensions

- identidad/configuración;
- permisos;
- periodos;
- PCGE/mappings;
- documentos y cobertura;
- integraciones;
- datos faltantes;
- blockers de SIRE/cierre.

No se resume en score opaco. Cada dimensión tiene estado `READY`, `ATTENTION`, `BLOCKED`, evidence y next action.

## Seguridad

Credenciales se capturan en canal seguro y almacenan en vault; no retornan a UI ni modelo. RUC no concede membership. Reintentos usan idempotencia y duplicate company detection dentro del scope.

## Criterios de aceptación

- Usuario v0 llega a primera excepción resuelta.
- Onboarding reanudable y multiempresa.
- Duplicate/revoked/invalid credentials tienen recovery.
- Readiness explica blockers concretos.
- Audit registra configuración sensible sin secrets.
