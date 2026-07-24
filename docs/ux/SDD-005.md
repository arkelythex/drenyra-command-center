# SDD-005 — Product and Design Governance

**Estado:** PROPOSED  
**Depende de:** SDD-000  
**Aplica a:** todo el programa

## Decisión

Drenyra utilizará una gobernanza ligera pero obligatoria: **problema → SDD → ADR cuando corresponda → plan → implementación → verificación → rollout**. Ningún mockup, componente o agente podrá introducir por sí solo una nueva regla fiscal, permiso o estado de dominio.

## Ownership

Cada SDD identifica responsables por función:

- Product/UX: resultado, usuarios, interacción y métricas.
- Fiscal domain: reglas, lenguaje e invariantes.
- Architecture: contratos, datos y dependencias.
- Security: scope, permisos, datos sensibles y abuso.
- Delivery: pruebas, observabilidad, migración y rollback.

Una misma persona puede cubrir varias funciones en etapa founder-led, pero registra cada revisión por separado.

## Gates

- **DRAFT:** exploración incompleta, no autoriza implementación.
- **PROPOSED:** diseño coherente listo para review.
- **APPROVED:** decisiones aceptadas y dependencias resueltas.
- **IN_PROGRESS:** plan activo y cambios trazables.
- **VERIFYING:** implementación completa bajo gates.
- **DONE:** desplegado según alcance con evidencia.
- **SUPERSEDED:** reemplazado mediante referencia explícita.

## Reglas

1. Cambios de scope, permisos, lifecycle o evidencia exigen actualización de SDD.
2. Una decisión costosa o irreversible exige ADR enlazado.
3. Los componentes visuales cumplen tokens semánticos y accessibility gates.
4. Las excepciones temporales tienen owner, expiración y criterio de eliminación.
5. Las métricas no se añaden sin propósito, retención y clasificación de datos.
6. Ningún SDD contiene decisiones ocultas en anexos no revisados.
7. Las pruebas adversariales son parte del comportamiento, no un follow-up opcional.

## Review cadence

- Review de diseño antes del plan.
- Review de contrato antes de migrations/API.
- Review visual y accessibility antes de rollout.
- Review post-release con métricas y fallos.
- Revisión trimestral de deuda y SDD superseded.

## Criterios de aceptación

- Existe un owner funcional para cada SDD.
- PRs enlazan SDD, criterio y evidencia relevante.
- Excepciones de arquitectura quedan registradas y expiran.
- DONE no se utiliza para documentación o código no desplegado.
- Producto, dominio, arquitectura y seguridad pueden bloquear una entrega dentro de su responsabilidad.
