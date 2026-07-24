# SDD-002 — Fiscal Domain Language and Information Architecture

**Estado:** PROPOSED  
**Depende de:** SDD-000, SDD-001  
**Informa:** SDD-010, 037, 038, 040, 050, 051 y todos los vertical slices

## Decisión

Drenyra organizará el producto por **trabajo fiscal y objetos de dominio**, no por tecnología, agentes o nombres de sistemas externos. La arquitectura global tendrá seis áreas: **Atención, Operación, Conciliación, Cumplimiento, Cierre y Evidencia**. Administración quedará separada de la operación fiscal.

## Vocabulario canónico

| Término | Uso obligatorio | Evitar |
|---|---|---|
| Empresa | Entidad operativa dentro de una organización | tenant, workspace como copy de usuario |
| Periodo | Mes o ejercicio con lifecycle contable | branch, worktree |
| Obligación | Resultado fiscal sujeto a preparación/presentación | job genérico |
| Caso | Trabajo coordinado con objetivo y responsables | thread cuando implique workflow fiscal |
| Excepción | Condición verificable que requiere atención | alerta para cualquier mensaje |
| Propuesta | Cambio preparado aún no aplicado | respuesta de IA |
| Evidencia | Fuente o validación enlazada a una decisión | attachment genérico |
| Revisión | Evaluación profesional de una propuesta | approval indistinto |
| Aprobación | Autorización para una acción material | confirmación visual |
| Aplicación | Ejecución efectiva del cambio | submit cuando no existe envío externo |

## Arquitectura global

- **Atención:** vencimientos, bloqueos, excepciones y revisiones.
- **Operación:** documentos, asientos, partners y tareas recurrentes.
- **Conciliación:** SIRE, banca y otras comparaciones entre fuentes.
- **Cumplimiento:** IGV, obligaciones, validaciones y presentación.
- **Cierre:** checklist, dependencias, revisión, cierre y reapertura.
- **Evidencia:** lineage, decisiones, auditoría y expedientes.
- **Administración:** empresas, membresías, integraciones, reglas y políticas.

SIRE será una fuente/workflow dentro de Conciliación y Cumplimiento; IGV será una obligación; Diff será una representación de revisión; Auditoría será una capacidad transversal. Ninguno ocupará el mismo nivel por razones meramente históricas.

## Reglas de navegación

1. El primer nivel representa áreas estables durante años.
2. El segundo nivel representa outcomes u objetos.
3. Empresa y periodo se mantienen fuera de la taxonomía como contexto persistente.
4. Las acciones aparecen junto al objeto; no como módulos globales duplicados.
5. Búsqueda y command palette atraviesan áreas sin romper permisos.
6. Las rutas antiguas pueden redirigir, pero no definir el nuevo lenguaje.
7. El copy debe distinguir preparar, revisar, aprobar, aplicar, presentar y rectificar.

## URL conceptual

Las URLs preservarán `organization/company/period` mediante identificadores seguros o estado resuelto; no usarán RUC o datos sensibles cuando no sea necesario. Los enlaces a objetos incluyen identidad estable y recuperan el contexto autorizado. Un enlace no concede acceso.

## Validación

Se realizará card sorting con contadores independientes, preparadores y reviewers. La arquitectura de información se considera válida si al menos 80% ubica correctamente los doce JTBD de SDD-001 y ninguna categoría crítica produce confusión sistemática entre aprobación y presentación.

## Criterios de aceptación

- Se adoptan las seis áreas y Administración separada.
- Existe glosario único para producto, API y documentación.
- Cada ruta actual tiene destino, redirect o deprecación.
- No se utiliza thread, worktree, diff o skill como sustituto del dominio fiscal.
- La taxonomía es comprendida por roles primarios sin explicar la arquitectura interna.
