# SDD-000 — Drenyra Experience Transformation Program

| Campo | Valor |
|---|---|
| Estado | APPROVED |
| Versión | 1.0.0 |
| Fecha | 2026-07-13 |
| Producto | Drenyra |
| Marca madre | Arkelythex |
| Tipo | SDD maestro / constitución del programa |
| Alcance | Producto, dominio fiscal, UX, frontend, backend, datos, IA, seguridad, pruebas y operación |
| Autor de producto | Dreamcoder |
| Aprobado | 2026-07-14 |

## 1. Decisión ejecutiva

Drenyra evolucionará de un conjunto amplio de módulos, dashboards y superficies agentic hacia un **workspace fiscal contextual, verificable y orientado a resultados**.

La aplicación no se diseñará como una copia literal de Codex ni como un chat con herramientas contables. Adoptará de los sistemas agentic modernos sus principios de contexto persistente, ejecución observable, trabajo revisable y automatización controlada, pero utilizará un modelo mental propio del dominio contable peruano.

La unidad principal de interacción será el **objeto fiscal dentro de un contexto verificado** —empresa, RUC, periodo y estado—. La IA podrá explicar, preparar y proponer trabajo. Toda acción material deberá atravesar validadores deterministas, permisos explícitos, revisión humana cuando corresponda y una cadena permanente de evidencia.

La estrategia de entrega será híbrida:

1. Establecer los contratos mínimos de confianza y experiencia.
2. Validarlos mediante vertical slices fiscales completos.
3. Empezar por conciliación SIRE.
4. Continuar con cierre mensual e IGV.
5. Migrar progresivamente las superficies legacy.

## 2. Problema

Drenyra dispone de una base frontend extensa, múltiples features, un sistema de diseño propio y conceptos agentic avanzados. Sin embargo, la amplitud técnica no garantiza una experiencia coherente.

Los riesgos identificados son:

- Navegación organizada por módulos, términos técnicos o representaciones heterogéneas, en lugar de tareas fiscales coherentes.
- Uso excesivo del chat como superficie principal.
- Layouts de tres paneles aplicados aunque la tarea no necesite los tres.
- Contexto de empresa, RUC y periodo tratado como encabezado visual, no como frontera operacional.
- Evidencia, aprobación, materialidad y reversión representadas parcialmente.
- Confianza probabilística del agente utilizada como sustituto de evidencia verificable.
- Mezcla entre reglas fiscales deterministas, skills agentic, configuraciones empresariales y automatizaciones.
- Sistemas visuales superpuestos: tokens equivalentes, glass legacy, múltiples acentos y densidad aplicada de forma inconsistente.
- Ausencia de una estrategia de migración que conecte dominio, API, frontend, telemetría y rollout.
- Riesgo de trasladar metáforas de ingeniería de software —threads, worktrees y diffs— sin adaptarlas a las obligaciones del dominio fiscal.

## 3. Visión

> Drenyra es el workspace fiscal donde un profesional detecta, comprende, resuelve y demuestra cada decisión contable con contexto, control y evidencia.

La experiencia debe responder en menos de cinco segundos:

1. ¿En qué empresa y periodo estoy trabajando?
2. ¿Está todo en orden?
3. ¿Qué necesita atención primero?
4. ¿Qué impacto tiene?
5. ¿Qué puedo hacer ahora?
6. ¿Quién o qué produjo esta información?
7. ¿Cómo puedo demostrar o revertir la decisión?

## 4. Tesis de confianza

La tesis operativa de Arkelythex se convierte en requisito de arquitectura:

> La IA asiste; el sistema valida; el profesional revisa; la evidencia permanece.

Esto implica:

- La IA no es fuente normativa.
- Una skill no reemplaza el motor de reglas fiscales.
- Una puntuación de confianza no reemplaza la procedencia de los datos.
- El frontend nunca puede inferir permisos o scope a partir de selección visual.
- Los cambios materiales no se representan como acciones instantáneas e irreversibles.
- Todo resultado aplicado debe poder vincularse con sus fuentes, reglas, actores y estado anterior.

## 5. Objetivos del programa

### 5.1 Objetivos de producto

- Organizar Drenyra alrededor de resultados fiscales y objetos contables.
- Convertir las excepciones y obligaciones pendientes en una cola de atención accionable.
- Hacer visible el contexto fiscal durante toda acción relevante.
- Integrar evidencia, revisión, aprobación y reversión dentro del workflow, no como módulos aislados.
- Permitir que agentes y automatizaciones preparen trabajo sin eliminar el control profesional.
- Crear patrones reutilizables para SIRE, IGV, conciliación, cierre, declaración y auditoría.

### 5.2 Objetivos de experiencia

- Reducir al menos 30% el tiempo mediano de resolución de los workflows seleccionados respecto de la línea base establecida por SDD-004.
- Reducir al menos 40% los cambios de pantalla necesarios en SIRE y cierre mensual.
- Mantener visible o recuperable en una sola interacción el contexto de empresa, RUC, periodo y estado.
- Garantizar que 100% de las acciones materiales muestren impacto, procedencia y mecanismo de revisión antes de su aplicación.
- Permitir completar los workflows críticos mediante teclado, con focus visible y sin bloqueos de accesibilidad.
- Mantener una tasa de éxito mínima de 95% en pruebas moderadas de los caminos principales después de dos rondas de refinamiento.

### 5.3 Objetivos técnicos

- Definir contratos canónicos para contexto, periodos, artefactos, evidencia, aprobación, diff, reversión y ejecución durable.
- Unificar la arquitectura de tokens mediante capas primitivas, semánticas y de componente.
- Establecer ownership explícito para router state, server state, form state y interaction state.
- Implementar budgets de rendimiento por ruta y para data grids de alta densidad.
- Garantizar pruebas cross-layer para tenant isolation, permisos, idempotencia, concurrencia, auditoría y recuperación.

## 6. Non-goals

Este programa no tiene como objetivo:

- Copiar visualmente Codex, Digits, Linear, Stripe, Ramp o cualquier otro producto.
- Reescribir toda la aplicación antes de entregar valor.
- Convertir cada operación contable en una conversación.
- Crear un marketplace público de skills durante las primeras olas.
- Mostrar agent swarms, worktrees u orquestación interna como conceptos de primer nivel para el contador.
- Sustituir asesoría profesional o juicio contable mediante scores generados por IA.
- Reabrir sin evidencia las garantías de Tenant Isolation y Wave 2 ya implementadas.
- Mantener compatibilidad visual indefinida con componentes legacy.
- Añadir themes, acentos o efectos antes de cerrar contraste, accesibilidad y semántica.

## 7. Usuarios y responsabilidades

SDD-001 especificará investigación, tareas y permisos en detalle. Este programa reconoce inicialmente:

| Rol | Responsabilidad principal | Necesidad dominante |
|---|---|---|
| Auxiliar contable | Preparar, clasificar y resolver datos | Velocidad, claridad y prevención de errores |
| Contador responsable | Revisar y cerrar obligaciones | Impacto, materialidad y control |
| Supervisor de estudio | Coordinar múltiples empresas | Priorización, delegación y vencimientos |
| Auditor | Examinar decisiones y evidencia | Trazabilidad, integridad y exportación |
| Dueño o gerente | Comprender estado y riesgo | Resumen explicable sin jerga operativa |
| Administrador | Configurar acceso y organización | Permisos, políticas y auditabilidad |

Una persona puede desempeñar varios roles, pero el sistema conservará la separación lógica entre preparar, revisar, aprobar y administrar.

## 8. Conceptos canónicos

| Concepto | Definición |
|---|---|
| Contexto fiscal | Organización, empresa, RUC, periodo y estado verificados para una operación |
| Periodo | Unidad contable con lifecycle explícito, bloqueos y reglas de reapertura |
| Objeto fiscal | Documento, asiento, conciliación, obligación, declaración u otro artefacto versionado |
| Caso fiscal | Contenedor de trabajo con objetivo, responsables, estado, vencimiento y evidencia |
| Excepción | Condición verificable que requiere atención, decisión o información adicional |
| Propuesta | Cambio preparado pero todavía no aplicado |
| Evidencia | Fuente o resultado verificable vinculado con una decisión |
| Regla fiscal | Lógica determinista, versionada y testeable |
| Skill | Workflow reutilizable que orienta a un agente; no constituye autoridad normativa |
| Automatización | Ejecución programada o disparada por evento bajo permisos y límites explícitos |
| Acción material | Operación que cambia libros, obligaciones, declaraciones, periodos o evidencia oficial |
| Reversión | Operación compensatoria o restaurativa permitida por el dominio y preservada en auditoría |

## 9. Invariantes del programa

1. El tenant y la empresa efectiva se derivan de membresía verificada; no de payload controlado por cliente.
2. Toda lectura y escritura tenant-owned utiliza scope explícito.
3. Ninguna acción se aplica a un periodo distinto del mostrado en la confirmación final.
4. Un periodo cerrado rechaza mutaciones ordinarias.
5. Los artefactos fiscales conservan identidad y versionado.
6. Toda acción material crea eventos auditables y enlaza evidencia suficiente.
7. Preparar, aprobar y aplicar son estados distintos, aunque una política permita que una misma persona ejecute más de uno.
8. La autoridad del actor y la política vigente se revalidan al aplicar, no solo al abrir la pantalla.
9. La idempotencia y natural uniqueness se aplican en backend; deshabilitar botones en frontend no constituye garantía.
10. Los jobs exponen estados consistentes, incluidos retryable, terminal y unknown.
11. Las automatizaciones no amplían los permisos de su creador.
12. Los agentes no pueden omitir validadores deterministas.
13. Toda diferencia monetaria utiliza moneda, precisión y reglas de redondeo explícitas.
14. La UI diferencia información faltante, cero, no aplicable, no disponible y error.
15. El historial aplicado no se elimina para simular que una decisión nunca ocurrió.

## 10. Modelo operacional de IA

Las capacidades agentic se dividen en cuatro niveles:

| Nivel | Capacidad | Aplicación |
|---|---|---|
| L0 — Explain | Resumir y explicar datos existentes | Sin mutación |
| L1 — Recommend | Proponer una acción y mostrar razonamiento y evidencia | Sin mutación |
| L2 — Prepare | Construir borradores, diffs, clasificaciones o conciliaciones | Requiere revisión antes de aplicar |
| L3 — Execute | Aplicar una acción previamente validada | Solo con política, permisos, audit trail y confirmación requeridos |

Las decisiones L2 y L3 deberán mostrar:

- actor o agente autor;
- fuentes;
- reglas y versiones;
- supuestos y datos faltantes;
- cambio exacto;
- impacto monetario y periodos afectados;
- validaciones ejecutadas;
- permisos requeridos;
- reversibilidad;
- responsable de aprobación.

No se mostrará un porcentaje de confianza como señal principal para aprobar acciones materiales.

## 11. Arquitectura de experiencia

### 11.1 Shell

- Sidebar global colapsable para áreas, recientes y trabajo guardado.
- Context bar persistente para empresa, RUC, periodo y estado.
- Canvas central determinado por el objeto y la tarea.
- Inspector contextual para detalles, evidencia, explicación y aprobación.
- Panel inferior opcional para actividad, ejecución o resultados técnicos.
- Command palette para navegación y acciones permitidas.
- Composer agentic únicamente cuando el contexto admite interacción útil.

### 11.2 Principios de composición

- El canvas conserva prioridad espacial.
- El inspector permanece cerrado cuando no existe un objeto seleccionado o una decisión que revisar.
- Las tablas financieras no compiten con dos paneles permanentes en pantallas estrechas.
- Las tareas de revisión pueden usar composición de tres paneles; esta no será el layout universal.
- El agente opera sobre el contexto y objeto seleccionados.
- La navegación no mezcla resultado, impuesto, sistema externo y representación visual en el mismo nivel.

### 11.3 Arquitectura visual

- Light utilizará superficies neutrales con calidez mínima.
- Black OLED reservará negro profundo para el shell y carbón para superficies distinguibles.
- Ember/copper será acento de marca e interacción, no señal universal de estado.
- Estados críticos, warning, success e info utilizarán tokens semánticos independientes de la marca.
- Glass se limitará a overlays donde mejore jerarquía sin reducir contraste.
- La autoría humana, agentic o sistémica se comunicará con metadata, iconografía y copy, no con materiales visuales distintos.

## 12. Arquitectura lógica del producto

El programa se organiza en seis capas:

1. **Program and Discovery:** usuarios, vocabulario, flujos y métricas.
2. **Fiscal Trust Core:** scope, periodos, permisos, artefactos, evidencia, aprobación, audit y ejecución durable.
3. **Experience Platform:** tokens, accesibilidad, shell, context bar, layouts, grids y arquitectura frontend.
4. **Operational Workspace:** inbox, objetos, inspector, diff, agente, colaboración, actividad y automatizaciones.
5. **Fiscal Vertical Slices:** documentos, SIRE, banca, IGV, cierre, declaración, rectificación y auditoría.
6. **Production and Migration:** seguridad, pruebas, observabilidad, migración, rollout y soporte.

Cada capa consume contratos de la anterior. Un vertical slice no puede crear versiones locales incompatibles de contexto, approval, diff o evidence.

## 13. Portafolio de SDD hijos

### 13.1 Program and discovery

- SDD-001 User Roles, Personas and Jobs-to-be-Done
- SDD-002 Fiscal Domain Language and Information Architecture
- SDD-003 Current Experience and Redundancy Audit
- SDD-004 Critical Workflow Baseline
- SDD-005 Product and Design Governance

### 13.2 Fiscal Trust Core

- SDD-006 Fiscal Trust Contracts (principios UI/UX que garantizan invariantes)
- SDD-007 Error Recovery Patterns (recuperación ante errores fiscales)
- SDD-008 Evidence-First Content Strategy (presentación de datos con evidencia)
- SDD-010 Verified Fiscal Context Propagation
- SDD-011 Accounting Period Lifecycle
- SDD-012 Roles, Permissions and Segregation of Duties
- SDD-013 Fiscal Artifact Identity and Versioning
- SDD-014 Evidence and Provenance Graph
- SDD-015 Human Review and Approval Workflow
- SDD-016 Accounting Diff and Materiality Engine
- SDD-017 Correction, Reversal and Rectification
- SDD-018 Immutable Audit Ledger and Retention
- SDD-019 AI Action Safety Contract
- SDD-020 Durable Fiscal Execution

### 13.3 Experience Platform

- SDD-030 Design Token Architecture
- SDD-031 Light and Black OLED Themes
- SDD-032 Typography, Numerals and Localization
- SDD-033 Density System
- SDD-034 Financial Data Grid
- SDD-035 Fiscal Forms and Validation
- SDD-036 Accessibility and Keyboard Navigation
- SDD-037 Application Shell and Navigation
- SDD-038 Persistent Fiscal Context Bar
- SDD-039 Adaptive Workspace and Inspector
- SDD-040 Command Palette and Universal Search
- SDD-041 Frontend Architecture and Performance

### 13.4 Operational Workspace

- SDD-050 Fiscal Attention Inbox
- SDD-051 Object-Centered Fiscal Workspace
- SDD-052 Evidence and Approval Inspector
- SDD-053 Accounting Review and Diff Workspace
- SDD-054 Contextual Agent Interaction
- SDD-055 Fiscal Cases, Tasks and Collaboration
- SDD-056 Execution Timeline and Activity
- SDD-057 Notifications and Deadline Management
- SDD-058 Automations Control Center
- SDD-059 Fiscal Rules and Skills Administration

### 13.5 Fiscal vertical slices

- SDD-070 Company Onboarding and Data Readiness
- SDD-071 CPE and Source Document Ingestion
- SDD-072 SIRE Reconciliation Workspace
- SDD-073 Banking Reconciliation Workspace
- SDD-074 IGV Determination Workspace
- SDD-075 Monthly Close Command Workspace
- SDD-076 Tax Filing and Pre-submission Review
- SDD-077 Rectification Workflow
- SDD-078 Audit and Evidence Export

### 13.6 Production and migration

- SDD-090 Privacy, Security and Sensitive Data UX
- SDD-091 Cross-layer Verification Strategy
- SDD-092 Visual Regression and Design QA
- SDD-093 Product Observability and UX Telemetry
- SDD-094 Legacy UI Migration and Deprecation
- SDD-095 Progressive Rollout and Feature Flags
- SDD-096 Onboarding, Documentation and Supportability

## 14. Estrategia de entrega

### Fase A — Constitución

Cerrar SDD-000 a SDD-008. El resultado es vocabulario compartido, usuarios, métricas, governance, trust contracts y estrategia de contenido evidence-first.

### Fase B — Trust Core mínimo

Cerrar SDD-010, 011, 012, 014, 015, 019 y 020. SDD-013, 016, 017 y 018 se completan antes de aplicar cambios materiales en producción.

### Fase C — Experience Platform mínima

Cerrar SDD-030, 034, 036, 037, 038, 039 y 041. Los themes y refinamientos visuales no bloquean la validación estructural mientras se cumplan contraste y accesibilidad.

### Fase D — Vertical slice SIRE

Cerrar SDD-051, 052, 053, 054, 056 y 072. Esta fase valida de extremo a extremo contexto, tablas, evidencia, diff, approval, agente y ejecución durable.

### Fase E — Cierre e IGV

Cerrar SDD-050, 057, 074 y 075. Se incorporan priorización de excepciones, vencimientos y coordinación del cierre.

### Fase F — Expansión y migración

Implementar los demás vertical slices, automatizaciones y administración de skills. Retirar superficies legacy mediante SDD-094 y rollout progresivo.

## 15. Governance de SDD

### 15.1 Estados

`DRAFT → PROPOSED → APPROVED → IN_PROGRESS → VERIFYING → DONE → SUPERSEDED`

No se utilizará DONE para documentos únicamente redactados. DONE significa que el comportamiento especificado está implementado, verificado, desplegado según alcance y respaldado por evidencia.

### 15.2 Revisión obligatoria

Cada SDD requiere aprobación de:

- Producto/UX para workflows y resultados.
- Dominio fiscal para reglas e invariantes.
- Arquitectura para contratos, datos y dependencias.
- Seguridad cuando existan permisos, información sensible o acciones materiales.

En una etapa temprana una misma persona puede cubrir varios roles, pero las revisiones deberán registrarse por responsabilidad.

### 15.3 Relación con ADR

- SDD define problema, comportamiento y criterios de aceptación.
- ADR registra una decisión arquitectónica irreversible o costosa de cambiar.
- Un SDD referencia ADR existentes y crea nuevos ADR solo cuando una decisión lo justifica.
- Los ADR de Tenant Isolation, idempotencia e integridad existentes prevalecen salvo supersession explícita.

### 15.4 Referencias complementarias

`docs/ux/references/` contiene especificaciones detalladas (TypeScript interfaces, WCAG checklists, performance budgets, patrones UI) que complementan los SDD canónicos. Cada reference tiene metadata explícita:

- `status: reference` — no es normativo por sí mismo
- `normative: false` — no impone decisiones vinculantes
- `consumed_by: SDD-XXX` — identifica el SDD canónico que consume este detalle

**Precedencia:** el SDD canónico siempre prevalece sobre una reference. Si hay contradicción, actualizar el SDD canónico o la reference, no ambas.

## 16. Gates de calidad

Un SDD no puede cerrarse sin evidencia proporcional a su riesgo:

### Producto y UX

- Caminos principal, alternativo, vacío, loading, error y degradado.
- Copy y estados comprensibles para el rol objetivo.
- Pruebas de usabilidad para workflows de alto impacto.
- Métricas instrumentadas.

### Dominio

- Invariantes y máquina de estados verificadas.
- Precisión, moneda y redondeo definidos.
- Materialidad e impacto explicables.
- Fuentes y versiones normativas identificables.

### Frontend

- Navegación completa por teclado.
- Focus visible y contraste aceptable.
- Responsive en breakpoints definidos por SDD-039.
- Error boundaries y recuperación.
- Budgets de carga y render cumplidos.

### Backend y datos

- Scope y permisos comprobados en servidor.
- Constraints y transacciones alineados con invariantes.
- Idempotencia y concurrencia verificadas.
- Auditoría y evidence links persistidos.
- Migración reversible o compensable.

### Agentic

- Nivel L0–L3 declarado.
- Tools y acciones permitidas enumeradas.
- Validadores deterministas ejecutados.
- Aprobación y confirmación probadas.
- Prompt injection y datos no confiables considerados.

### Operación

- Logs, métricas y tracing suficientes.
- Alertas y runbook.
- Feature flag y rollback cuando exista riesgo de migración.
- Evidencia de verificación en ambiente equivalente a producción.

## 17. Estrategia de pruebas

El programa exige una pirámide cross-layer:

- Unit tests para reglas, estados, permisos y formatters.
- Contract tests para API, schemas, comandos y eventos.
- Integration tests con PostgreSQL real para scope, transacciones, constraints, idempotencia y auditoría.
- Component tests para interacciones, teclado y estados.
- Visual regression en Light, Black OLED y densidades soportadas.
- E2E por vertical slice con roles y escenarios adversariales.
- Failure injection para jobs, dependencias externas y estados UNKNOWN.
- Pruebas de accesibilidad automatizadas y manuales.
- Pruebas de rendimiento con volúmenes representativos.

Los tests no solo comprobarán el happy path. Cada acción material incluirá casos cross-tenant, cross-period, stale approval, double submission, retry, permission revoked y reversal.

## 18. Métricas del programa

### North-star operacional

**Porcentaje de excepciones fiscales resueltas con evidencia completa antes de su vencimiento.**

### Métricas de resultado

- Tiempo desde detección hasta resolución.
- Porcentaje de cierres completados a tiempo.
- Cantidad de excepciones reabiertas.
- Cambios aplicados que posteriormente requieren corrección.
- Tiempo de preparación y revisión por workflow.

### Métricas de confianza

- Acciones materiales con provenance completo.
- Acciones rechazadas por scope, periodo o permisos.
- Aprobaciones stale detectadas antes de aplicar.
- Reversiones exitosas y tiempo de recuperación.
- Jobs duplicados evitados por idempotencia.

### Métricas de experiencia

- Task success rate.
- Tiempo mediano por workflow.
- Cambios de pantalla por resolución.
- Uso de teclado y command palette.
- Errores de formulario y abandonos.
- Apertura de explicaciones y evidence inspector.

Las métricas no se utilizarán para puntuar empleados individualmente sin una política separada de privacidad y gobernanza.

## 19. Migración

La migración será strangler, no big-bang:

1. Inventariar rutas y componentes con SDD-003.
2. Definir equivalencias origen–destino.
3. Introducir contratos canónicos detrás de adapters.
4. Activar el nuevo workflow por feature flag y empresa piloto.
5. Comparar resultados entre experiencia legacy y nueva.
6. Corregir regresiones antes de ampliar rollout.
7. Bloquear creación de nuevas dependencias legacy.
8. Retirar rutas y tokens solo después de confirmar ausencia de consumidores.

Las URLs críticas contarán con redirect o compatibilidad temporal. Los datos y decisiones históricas conservarán identidad y audit trail durante la migración.

## 20. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Crear demasiados SDD antes de validar | Especificación just-in-time y vertical slices |
| Sobrediseñar el shell | Validarlo con SIRE y cierre, no mediante mockups aislados |
| Duplicar Trust Core existente | Referenciar ADR y suites vigentes; crear adapters |
| Usar IA como autoridad | Contrato L0–L3 y validadores deterministas |
| Fatiga de aprobaciones | Políticas por materialidad, rol y riesgo |
| Exceso de información en pantalla | Inspector contextual y progressive disclosure |
| Regresiones por tokens | Migración semántica y visual regression |
| Rendimiento deficiente en tablas | Virtualización, budgets y datasets representativos |
| Diferencias entre UI y backend | Contract tests y autorización server-side |
| Big-bang migration | Flags, empresas piloto y rollback |

## 21. Decisiones delegadas a SDD hijos

Las siguientes decisiones quedan explícitamente delegadas, no indefinidas:

- Roles y combinación de responsabilidades: SDD-001 y SDD-012.
- Taxonomía final de navegación: SDD-002 y SDD-037.
- Paletas exactas y contrastes: SDD-030 y SDD-031.
- Breakpoints y comportamiento de paneles: SDD-039.
- Thresholds de materialidad: SDD-016 y vertical slice correspondiente.
- Retención y exportación de audit events: SDD-018 y SDD-090.
- Políticas de aprobación de automatizaciones: SDD-012, SDD-019 y SDD-058.
- Budgets cuantitativos de rendimiento: SDD-034 y SDD-041.

Los SDD hijos pueden refinar esta constitución, pero cualquier contradicción exige actualizar SDD-000 o registrar una supersession explícita.

## 22. Criterios de aceptación de SDD-000

SDD-000 puede pasar a APPROVED cuando:

- La visión de Drenyra como workspace fiscal contextual es aceptada.
- La tesis de confianza y las quince invariantes son aceptadas.
- El modelo de IA L0–L3 es aceptado.
- La arquitectura de experiencia y sus límites son aceptados.
- El portafolio de SDD hijos y el orden SIRE → cierre → IGV son aceptados.
- Los gates de calidad y el significado de DONE son aceptados.
- La estrategia strangler y el rechazo al big-bang son aceptados.
- Cualquier cambio solicitado queda incorporado sin contradicciones.

## 23. Siguiente decisión

Tras aprobar SDD-000, el programa continúa con:

1. SDD-001 — User Roles, Personas and Jobs-to-be-Done.
2. SDD-002 — Fiscal Domain Language and Information Architecture.
3. SDD-003 — Current Experience and Redundancy Audit, una vez disponible el repositorio.

No se iniciará un rediseño de componentes ni implementación del nuevo shell antes de cerrar como mínimo SDD-001, SDD-002, SDD-010 y SDD-037.
