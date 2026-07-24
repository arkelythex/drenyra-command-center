---
status: reference
normative: false
consumed_by: SDD-000
---

# SDD-000: Drenyra Experience Transformation Program

**Last updated**: 2026-07-14
**Content type**: Program specification
**Status**: ✅ Approved
**Priority**: P0 — Fundacional

---

## 1. Abstract

Drenyra nació como plataforma agente de inteligencia fiscal. Funciona. Pero su experiencia de usuario fue diseñada por ingenieros para ingenieros: paneles genéricos, AI omnipresente sin contexto fiscal, y cero validación con contadores reales.

Este SDD-000 define el programa de transformación para que Drenyra pase de "herramienta que funciona" a "sistema fiscal inevitablemente confiable". No es un rediseño cosmetico. Es una reestructuración profunda de cómo Drenyra presenta información fiscal, cómo interactúa con sus usuarios, y cómo garantiza que cada acción sea explicable, auditable, reversible, y aprobada por un humano cuando el riesgo lo requiera.

## 2. North star del programa

> ¿Cómo logramos que un contador **detecte**, **entienda**, **resuelva** y **pruebe** un problema fiscal con el mínimo riesgo?

Cada SDD en este programa responde a esa pregunta. Si no lo hace, no pertenece aquí.

## 3. Estructura del programa

### 3.1 Seis olas

| Ola | Nombre | SDDs | Enfoque |
|-----|--------|------|---------|
| 1 | Program & Discovery | 5 | Research, definiciones, contratos, plataforma |
| 2 | Fiscal Trust Core | 12 | Invariantes, evidencia, reversibilidad, L0-L3 |
| 3 | Experience Platform | 10 | Sistema de diseño, accesibilidad, rendering, i18n |
| 4 | Operational Workspace | 10 | Navegación fiscal, paneles operativos, búsqueda |
| 5 | Fiscal Vertical Slices | 12 | SIRE, detracciones, conciliación, CDR, reporting |
| 6 | Production & Migration | 6 | Strangler Fig, feature flags, QA, rollout |

### 3.2 Los 15 SDDs fundacionales (Ola 1 + Ola 2)

**Ola 1 — Program & Discovery**

| SDD | Título | Propósito |
|-----|--------|-----------|
| SDD-001 | UX Research con contadores | Journey maps, pain points, validación de supuestos |
| SDD-002 | Contratos de confianza fiscal | Principios de UI/UX que garantizan invariantes |
| SDD-003 | Arquitectura de información fiscal | Taxonomía, navegación, modelos mentales |
| SDD-004 | Plataforma de telemetría de UX | Métricas, dashboards, detección de fricción |
| SDD-005 | Estrategia de accesibilidad fiscal | WCAG 2.2 AA+, lectores de pantalla, contraste |

**Ola 2 — Fiscal Trust Core**

| SDD | Título | Propósito |
|-----|--------|-----------|
| SDD-006 | Sistema de evidencia fiscal | Fuente, razonamiento, nivel de confianza por acción |
| SDD-007 | Modelo L0-L3 de asistencia AI | Explain → Recommend → Prepare → Execute |
| SDD-008 | Reversibilidad de acciones fiscales | Undo/redo, journaling, compensación contable |
| SDD-009 | Tenant/RUC scoping visible | Indicador de contexto activo, cambio seguro |
| SDD-010 | Approval gates por nivel de riesgo | Workflows de aprobación humana escalonados |
| SDD-011 | Audit trail visual | Timeline de acciones, quién, cuándo, por qué |
| SDD-012 | Fiscal notification system | Alertas contextuales, no spam |
| SDD-013 | Error recovery patterns | Estados de error fiscales, recuperación guiada |
| SDD-014 | Evidence-first content strategy | Cómo se presenta información fiscal |
| SDD-015 | Fiscal onboarding progresivo | Incorporación por rol y complejidad |

## 4. Invariantes del programa (15)

Cada SDD DEBE preservar estos invariantes. Cualquier propuesta que los viole requiere escalación al equipo de programa.

1. **RUC scoping**: Toda acción está asociada a un RUC. No hay operaciones sin contexto de contribuyente.
2. **Explicabilidad AI**: Toda recomendación muestra fuente, razonamiento, y nivel de confianza. No hay "magia".
3. **Reversibilidad**: Toda acción fiscal tiene un camino de reversa documentado. No hay one-way doors sin aprobación.
4. **Aprobación humana**: Acciones sobre umbral de riesgo requieren aprobación explícita. No hay ejecución autónoma de alto riesgo.
5. **Audit trail**: Toda acción queda registrada con quién, cuándo, qué, y por qué. No hay operaciones invisibles.
6. **Evidencia primero**: Los datos crudos son siempre accesibles. No hay resúmenes sin acceso a la fuente.
7. **Progressive disclosure**: La complejidad se revela según rol y contexto. No hay pantallas abrumadoras.
8. **Offline resilience**: Las operaciones críticas tienen modo offline. No hay dependencia absoluta de red.
9. **Keyboard-first**: Toda acción es posible por teclado. No hay funciones exclusivas de mouse.
10. **Print readiness**: Los reportes fiscales se pueden imprimir/exportar sin pérdida. No hay "solo web".
11. **Consistencia perceptual**: Patrones repetidos, no reinventados. No hay tres formas de hacer lo mismo.
12. **Performance fiscal**: Tablas de 10k+ filas virtualizadas. No hay scroll infinito sin memoria.
13. **WCAG 2.2 AA+**: Contraste, navegación por teclado, lectores de pantalla. No hay exclusión.
14. **Bundle discipline**: Code splitting por ruta fiscal. No hay monolitos JS.
15. **Privacy by default**: Datos fiscales visibles solo con autorización. No hay exposición accidental.

## 5. Modelo L0-L3 de asistencia AI

| Nivel | Nombre | Comportamiento | UX |
|-------|--------|---------------|-----|
| L0 | Explain | Explica información fiscal existente | Tooltip expandido con fuente + razonamiento |
| L1 | Recommend | Sugiere acciones sin ejecutar | Tarjeta con evidencia, "Aplicar" requiere clic |
| L2 | Prepare | Prepara la acción, deja lista para revisión | Draft visible, usuario revisa y confirma |
| L3 | Execute | Ejecuta dentro de límites definidos | Solo en acciones de riesgo bajo, con undo disponible |

**Regla de oro**: Drenyra nunca ejecuta L3 en acciones fiscales de alto riesgo sin aprobación humana explícita. El nivel máximo se configura por tenant y por tipo de acción.

## 6. Template de 24 secciones por SDD

Cada SDD en este programa DEBE seguir esta estructura:

| # | Sección | Obligatorio |
|---|---------|-------------|
| 1 | Abstract | Sí |
| 2 | North star | Sí |
| 3 | Problem statement | Sí |
| 4 | User research (link) | Sí (Ola 1+) |
| 5 | Invariantes afectados | Sí |
| 6 | L0-L3 mapping | Sí |
| 7 | Escenarios de uso | Sí |
| 8 | Wireframes / prototipos | Sí |
| 9 | Estados (loading, empty, error, edge) | Sí |
| 10 | Approval gates | Sí |
| 11 | Audit trail requirements | Sí |
| 12 | Evidence requirements | Sí |
| 13 | Reversibilidad | Sí |
| 14 | Accesibilidad | Sí |
| 15 | Performance budget | Sí |
| 16 | Bundle impact | Sí |
| 17 | Métricas de éxito | Sí |
| 18 | Riesgos | Sí |
| 19 | Dependencias | Sí |
| 20 | Criterios de DONE | Sí |
| 21 | Aceptación del sponsor de negocio | Sí |
| 22 | Firma del equipo de programa | Sí |
| 23 | Changelog | Sí |
| 24 | Archivo de especificación | Sí |

## 7. Gates de calidad

| Gate | Momento | Qué se evalúa | Quién aprueba |
|------|---------|---------------|---------------|
| G1 | Brief aprobado | SDD completo, sponsor firmado | Equipo de programa |
| G2 | Spec congelada | 24 secciones completas, wireframes OK | Arquitecto + Sponsor |
| G3 | Implementación completa | Pasa tests, typecheck, lint, accesibilidad | Tech lead |
| G4 | Review UX | Recorre escenarios con contador real | UX lead |
| G5 | Performance budget | Cumple métricas de bundle, render, red | Performance engineer |
| G6 | Aceptación de negocio | Sponsor firma que resuelve el problema | Sponsor de negocio |
| G7 | Release | Feature flag activada en producción | Equipo de programa |

**DONE real** = Todos los gates G1-G7 cerrados. No antes.

## 8. Matriz de riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Desalineación research → implementación | Alta | Alto | SDD-001 primero, validación continua con contadores |
| SDD-004 requiere telemetría inexistente | Alta | Alto | Implementar infraestructura de telemetría como prerrequisito |
| SIRE revela cambios en contratos de confianza | Media | Alto | Ola 5 temprana como slice de validación |
| Sobrecarga de especificación (55 SDDs) | Alta | Medio | SDD Lite para Olas 3-4, full 24-secciones solo en Trust Core + Slices |
| Desgaste del equipo por 55 entregables | Media | Medio | Priorizar valor por SDD, celebrar hitos, evitar crunch |
| Estrategia Strangler Fig mal ejecutada | Baja | Alto | Feature flags + dark launches + rollout progresivo |

## 9. Estrategia de entrega híbrida

- **Olas 1-2**: Full 24-secciones. Cada SDD es completo, revisado, firmado.
- **Olas 3-4**: SDD Lite — mínimo 12 secciones (Abstract, North Star, Escenarios, Wireframes, Estados, Accesibilidad, Performance, Métricas, Riesgos, Dependencias, DONE, Changelog). Decisiones de implementación se documentan en el código y ADRs.
- **Ola 5**: Full 24-secciones para los slices fiscales (SIRE, detracciones, etc.). Son el core del negocio.
- **Ola 6**: Lite + checklists operativos.

**Validación temprana**: SDD de SIRE (Ola 5) se inicia después de SDD-005 para validar que los contratos de confianza funcionan con un caso real complejo.

## 10. Criterios de éxito del programa

- [ ] Contadores reales pueden completar una tarea fiscal sin asistencia en < 5 intentos (medido en SDD-004)
- [ ] Toda acción fiscal tiene audit trail visible en < 2 clics
- [ ] Toda recomendación AI muestra evidencia + fuente + nivel de confianza
- [ ] Performance: tablas de 10k filas renderizan en < 2s
- [ ] WCAG 2.2 AA+ certificado en rutas críticas
- [ ] Tasa de error fiscal reducida vs línea base (medido en SDD-004)
- [ ] Usuarios reportan "confianza" en el sistema ≥ 4/5 en encuesta NPS fiscal

## 11. Changelog

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2026-07-14 | Versión inicial — 55 SDDs, 6 olas, 15 invariantes | dreamcoder08 |
| 2026-07-14 | Aprobación formal del programa Opción A | dreamcoder08 |
