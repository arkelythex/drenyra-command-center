---
status: reference
normative: false
consumed_by: SDD-006
---

---
title: "SDD-002 — Contratos de Confianza Fiscal"
description: "Principios de UI/UX que garantizan los invariantes del sistema fiscal — contratos de evidencia, reversibilidad, auditoría, aprobación humana y alcance por RUC."
version: "0.1"
tags: [sdd, ux, fiscal-trust, invariants, evidence-first]
audience: [ux-engineer, frontend-engineer, product-manager, fiscal-architect]
status: borrador
last_updated: 2026-07-14
---

> **SDD-002** | Ola 1 — Program & Discovery | **Previsto**: 3 días hábiles

---

## 1. Abstract

SDD-002 define los **Contratos de Confianza Fiscal** — un conjunto de principios, patrones UI/UX y reglas de interacción que garantizan los 15 invariantes del sistema Drenyra en cada punto de contacto con el usuario. No se trata de una guía de estilos visuales, sino de un **sistema de garantías explícitas** que todo flujo, componente y pantalla debe cumplir para preservar la integridad fiscal.

Cada contrato especifica:
- **Qué garantiza** (el invariante que protege)
- **Cómo se manifiesta en UI** (patrón visual e interactivo)
- **Cómo se viola** (lo que nunca debe pasar)
- **Cómo se recupera** (reversibilidad y evidencia)
- **Qué nivel de IA lo activa** (L0–L3)

---

## 2. North Star

> "Que un contador pueda detectar, entender, resolver y probar un problema fiscal con mínimo riesgo."

Este north star se traduce a una exigencia concreta: **cada acción en Drenyra debe poder explicarse, revertirse y auditarse sin depender de la buena voluntad del sistema ni del conocimiento tácito del usuario.**

---

## 3. Problem Statement

Los sistemas fiscales tradicionales fallan en la confianza por tres razones:

1. **Opacidad**: el usuario no sabe qué pasó ni por qué. Las acciones son cajas negras.
2. **Irreversibilidad**: los errores requieren soporte, rollbacks manuales o procesos externos.
3. **Falta de evidencia**: cuando algo sale mal, no hay un registro comprobable de lo que ocurrió.

Los sistemas modernos con IA agravan estos problemas al añadir comportamientos no deterministas. Un agente que recomienda, prepara o ejecuta acciones fiscales sin contratos explícitos de confianza es un riesgo inaceptable.

**Drenyra resuelve esto invirtiendo la carga de la prueba: el sistema debe demostrar confianza, no el usuario.**

---

## 4. User Research (link)

Las decisiones de este SDD se basan en los hallazgos de **SDD-001** (Roles, Personas y JTBD). Específicamente:

| Hallazgo SDD-001 | Implicación para SDD-002 |
|---|---|
| P1 (Contador solitario multi-RUC) no tiene tiempo para auditar cada acción | Contratos deben ser automáticos y visibles sin fricción |
| P4 (Socio firma grande) exige trazabilidad completa | Contrato de auditoría debe ser exportable e inmutable |
| P7 (Revisor fiscal) separa preparación de aprobación | Contrato de aprobación humana en L3 |
| Ansiedad compartida: "no saber si está bien" | Contrato de evidencia como garantía visible |
| Cadencia semanal/mensual con picos de cierre | Contratos deben funcionar offline y en lote |

> Ver SDD-001 secciones 5 (segmentación), 6 (arquetipos), 7 (roles) y 10 (cadencia).

---

## 5. Invariantes Afectados

SDD-002 afecta a **los 15 invariantes**, pero establece contratos explícitos para los 7 de mayor impacto en UI/UX:

| # | Invariante | Tipo | Contrato Clave |
|---|---|---|---|
| I1 | ✅ Alcance por RUC | Seguridad | Filtro RUC en cada operación |
| I2 | ✅ Explicabilidad | UX | Contrato de evidencia |
| I3 | ✅ Reversibilidad | UX | Contrato de reversibilidad |
| I4 | ✅ Aprobación humana | UX | Contrato de aprobación |
| I5 | ✅ Trazabilidad de auditoría | Seguridad | Contrato de auditoría |
| I6 | ✅ Evidencia primero | UX | Contrato de evidencia |
| I7 | ✅ Divulgación progresiva | UX | Contrato de disclosure |

Los invariantes I8–I15 (resiliencia offline, keyboard-first, print readiness, consistencia, performance, WCAG, bundle discipline, privacidad) se cubren como contratos secundarios en las secciones 14 y 15.

---

## 6. Mapeo L0–L3

Cada contrato de confianza fiscal define qué nivel de autonomía IA activa qué comportamiento:

| Nivel | Nombre | Rol del Sistema | Rol del Usuario | Contrato Activado |
|---|---|---|---|---|
| **L0** | Explicar | Muestra datos fiscales, detecta anomalías | Interpreta, decide | Evidencia (+), Auditoría |
| **L1** | Recomendar | Sugiere acciones con evidencia | Revisa, acepta/rechaza | Evidencia, Reversibilidad |
| **L2** | Preparar | Prepara borradores, el usuario ejecuta | Revisa, modifica, ejecuta | Reversibilidad, Aprobación |
| **L3** | Ejecutar | Ejecuta acciones programadas | Supervisa, revierte si necesario | Aprobación (+), Auditoría (+), Reversibilidad (+) |

**Regla de activación:** ningún nivel superior puede operar sin cumplir los contratos del nivel inferior. L3 requiere L2 + L1 + L0.

---

## 7. Catálogo de Contratos de Confianza

### 7.1 Contrato de Evidencia (I2, I6)

**Qué garantiza:** Toda afirmación del sistema tiene una fuente comprobable visible.

**Manifestación UI:**
- Cada pieza de información deriva de un `evidence://` link
- La fuente se muestra como badge: `📄 DET N° 123-2024-SUNAT` o `📊 Cálculo basado en 3 facturas`
- Las recomendaciones L1/L2 muestran su cadena de evidencia expandible
- Los datos sin fuente se marcan con `⚠️ Sin verificar`

**Nunca:**
- Mostrar un número sin origen visible en ≤2 clics
- Ocultar evidencia detrás de "confianza en el modelo"

**Recuperación:** el usuario puede solicitar "profundizar evidencia" que expande la cadena completa.

### 7.2 Contrato de Reversibilidad (I3)

**Qué garantiza:** Toda acción fiscal es reversible dentro de la ventana fiscal aplicable.

**Manifestación UI:**
- Botón "Deshacer" visible por un período configurable post-acción
- El deshace se registra como acción de auditoría independiente
- Acciones irreversibles (ej: envío a SUNAT) muestran advertencia explícita + confirmación
- El sistema estima la ventana de reversión: `⏳ Reversible hasta 15/04/2026`

**Nunca:**
- Realizar una acción sin confirmación en L2/L3
- Ocultar el estado de reversibilidad de una operación

**Recuperación:** guía paso a paso para reversión manual cuando la ventana automática expiró.

### 7.3 Contrato de Aprobación Humana (I4)

**Qué garantiza:** Las acciones L3 requieren aprobación explícita de un rol autorizado antes de ejecutarse.

**Manifestación UI:**
- Las acciones que requieren aprobación muestran estado `🔄 Pendiente de aprobación`
- Flujo: preparar → someter → revisar → aprobar/rechazar → ejecutar
- Cada aprobación registra quién, cuándo y desde qué contexto
- Las aprobaciones requieren autenticación separada (verificación de identidad)

**Nunca:**
- Ejecutar una acción L3 sin aprobación explícita
- Permitir auto-aprobación del preparador (conflicto de interés)

**Recuperación:** una aprobación errónea puede revocarse por otro aprobador de mayor rango.

### 7.4 Contrato de Auditoría (I5)

**Qué garantiza:** Toda interacción con datos fiscales queda registrada en un trail inmutable, exportable y legible.

**Manifestación UI:**
- Cada entidad tiene un botón `📋 Ver historial de auditoría`
- Trail muestra: timestamp, usuario, acción, estado anterior → estado nuevo, evidencia asociada
- Exportable a JSON, CSV y PDF con sello de integridad (hash)
- Búsqueda y filtro por rango de fechas, usuario, tipo de acción

**Nunca:**
- Permitir acciones no registradas (ni siquiera reads sensibles)
- Mostrar un trail truncado o editable

**Recuperación:** el trail es append-only. No se edita ni elimina.

### 7.5 Contrato de Alcance por RUC (I1)

**Qué garantiza:** Toda operación está explícitamente acotada a un RUC y el usuario nunca opera fuera de su alcance autorizado.

**Manifestación UI:**
- Selector de RUC/RazonSocial en el header global, siempre visible
- Cada pantalla, reporte y acción está scoped al RUC activo
- Cambiar de RUC cierra sesiones activas, borra borradores no guardados (con advertencia)
- Acciones batch multi-RUC requieren workflow explícito

**Nunca:**
- Mezclar datos de dos RUCs en la misma vista sin separación visual explícita
- Permitir una operación que cruce el límite del RUC sin barrera

**Recuperación:** cambio de RUC reversible dentro de los últimos 5 minutos.

### 7.6 Contrato de Divulgación Progresiva (I7)

**Qué garantiza:** La complejidad se revela en capas, no se impone de golpe.

**Manifestación UI:**
- Vista resumen → detalle → raw data
- Los paneles laterales y modales se usan para profundizar sin perder contexto
- Los términos fiscales complejos tienen tooltips o glosarios inline (`¿Qué es IGV?`)
- El nivel de detalle se recuerda por rol (P1 ve resumen, P4 ve detalle completo)

**Nunca:**
- Mostrar 30 campos en un formulario sin agruparlos lógicamente
- Usar jerga fiscal sin explicación en el primer encuentro

---

## 8. Wireframes / Prototipos

> **Nota:** Este SDD establece contratos de comportamiento, no layouts específicos. Los wireframes detallados se producen en SDD-007 (Fiscal Core Wireframes). Aquí se definen los patrones conceptuales.

### Patrón: Ancla de Evidencia

```
[📄 RUC 20123456789]
  └─ 📊 IGV 18% → S/ 18,000
       ├─ 📄 Factura F001-0001 (S/ 50,000)
       ├─ 📄 Factura F001-0002 (S/ 30,000)
       └─ 📄 Nota de Crédito NC01-0001 (S/ 20,000)
```

### Patrón: Barra de Confianza

```
[🔒 Alcance: RUC 20123456789 — Drenyra SAC]
[📋 Última auditoría: Hoy 14:23 — Sin anomalías]
[🔄 3 acciones reversibles | ⏳ Ventana: 48h]
```

### Patrón: Timeline de Auditoría

```
[🕐 14:23:15] admin@drenyra.com → Actualizó DET 123
  📄 Antes: Pendiente → Después: Aprobado
  🔗 Evidencia: docs/tributos/det-123-v2.pdf
  
[🕐 14:20:00] sistema@drenyra.com → Detectó discrepancia IGV
  📊 Base: F001-0001 vs F001-0005
  🔗 Profundizar →
```

---

## 9. Estados

Cada contrato debe representar 4 estados posibles:

| Estado | Visual | Significado | Acción Esperada |
|---|---|---|---|
| **Conforme** | `✅` Verde | Contrato cumplido | Ninguna |
| **Advertencia** | `⚠️` Amarillo | Contrato en riesgo pero no violado | Revisar, corregir si aplica |
| **Violación** | `🚫` Rojo | Contrato incumplido | Acción correctiva requerida |
| **Recuperación** | `🔄` Azul | Contrato en proceso de restauración | Monitorear, verificar resultado |

---

## 10. Approval Gates

| Gate | Contrato | Quién Aprueba | Condición |
|---|---|---|---|
| G1 | Todos | Arquitecto fiscal | Los contratos cubren todos los invariantes |
| G2 | Evidencia | UX Lead | Los patrones de evidencia implementan lo especificado |
| G3 | Reversibilidad | Tech Lead | La reversibilidad es técnicamente viable |
| G4 | Auditoría | Seguridad | Trail cumple append-only + hash de integridad |
| G5 | Alcance RUC | Product Manager | Multi-RUC testing cubre todos los escenarios de cambio |

---

## 11. Audit Trail Requirements

Cada contrato de confianza debe generar un trail de auditoría con la siguiente estructura mínima:

| Campo | Descripción | Obligatorio |
|---|---|---|
| `timestamp` | ISO 8601 con timezone | ✅ |
| `ruc` | RUC scope al momento de la acción | ✅ |
| `user_id` | Usuario que ejecutó la acción | ✅ |
| `session_id` | Sesión activa | ✅ |
| `action_type` | create / update / delete / approve / revert / view | ✅ |
| `entity_type` | Tipo de entidad fiscal (DET, factura, etc.) | ✅ |
| `entity_id` | ID de la entidad afectada | ✅ |
| `before_state` | Estado anterior (snapshot o diff) | ✅ |
| `after_state` | Estado nuevo (snapshot o diff) | ✅ |
| `evidence_link` | Enlace a la evidencia que justifica la acción | Opcional |
| `ai_confidence` | Nivel de confianza del modelo si aplica | L1+ |
| `reverted_by` | ID de la acción de reversión (si fue revertida) | Opcional |

**Garantía de integridad:** el trail se almacena con hash encadenado (Merkle tree local) y se exporta con sello que permite verificar que no hubo alteración.

---

## 12. Evidence Requirements

El contrato de evidencia define tres niveles de profundidad:

| Nivel | Nombre | Contenido | Acceso |
|---|---|---|---|
| L0_E | Superficial | Badge con tipo y referencia | 1 clic |
| L1_E | Expandida | Resumen ejecutivo + fuente primaria | 2 clics |
| L2_E | Completa | Datos raw, cálculos, auditoría completa | 3 clics |

**Reglas:**
- Toda cifra en L0 debe ser expandible a L1_E
- Las recomendaciones L1+ deben incluir L1_E por defecto
- L2_E debe ser exportable como PDF/JSON
- Datos sin fuente disponible se marcan explícitamente como `🔶 Estimado — no verificado`

---

## 13. Reversibility Requirements

| Escenario | Ventana de Reversión | UI |
|---|---|---|
| Acción dentro del sistema | 7 días o hasta siguiente cierre | Botón "Deshacer" + timeline |
| Envío a SUNAT (no aceptado) | Hasta recepción de CDR | "Anular envío" con confirmación L2 |
| Envío a SUNAT (aceptado) | No reversible — guiar a proceso SUNAT | "¿Necesitas anular?" → guía paso a paso |
| Cambio de RUC | 5 minutos | Banner "¿Deshacer cambio?" |

**Reversibilidad compuesta:** revertir una acción que desencadenó otras debe mostrar el árbol de dependencias: "Esto revertirá 3 acciones relacionadas".

---

## 14. Accessibility Contracts

Cada contrato debe cumplir:

| Contrato | Requisito WCAG | Criterio |
|---|---|---|
| Evidencia | 1.1.1 | Alternativa textual para badges visuales (`📄` → "Documento" via aria-label) |
| Reversibilidad | 2.2.1 | Ventana de reversión ajustable, sin timeouts que bloqueen |
| Aprobación | 3.3.4 | Error prevention (legal/financial) — reversible antes de enviar |
| Auditoría | 1.3.1 | Timeline de auditoría como lista estructurada, no solo visual |
| Alcance RUC | 2.4.3 | Selector de RUC en orden de navegación predecible |
| Divulgación | 4.1.2 | Regiones expandibles con ARIA expand/collapse |

Ver SDD-001 sección 14 (accesibilidad) para requisitos generales.

---

## 15. Performance Budget

| Contrato | Budget | Medición |
|---|---|---|
| Evidencia (carga de source) | ≤ 200ms | TTFB del source referenciado |
| Timeline de auditoría (carga) | ≤ 500ms para 100 entradas | Tiempo de render inicial |
| Selector de RUC | ≤ 50ms respuesta a interacción | Input latency |
| Reversibilidad (ejecución) | ≤ 200ms | Tiempo de ejecución del revert |

---

## 16. Success Metrics

| Métrica | Objetivo | Cómo se mide |
|---|---|---|
| % de acciones con evidencia visible | ≥ 98% | Auditoría automática de trail |
| % de reversiones exitosas sin soporte | ≥ 95% | Logs de reversibilidad |
| Tiempo hasta entender un problema fiscal | ≤ 2 min | UX telemetry (SDD-004) |
| Violaciones de contrato por sesión | ≤ 1 | Monitoreo de contratos |
| % de usuarios que confían en recomendaciones L1 | ≥ 80% | Encuesta trimestral |
| Tasa de aprobación sin rechazo en L3 | ≥ 85% | Auditoría de aprobaciones |

---

## 17. Risks

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Contratos muy abstractos → implementación inconsistente | Alta | Alto | SDD-007 traduce contratos a wireframes concretos |
| Evidencia offline no disponible | Media | Alto | Cache local de evidencia con staleness configurable |
| Reversibilidad imposible por constraints técnicos | Media | Alto | Auditoría temprana en sprint 0, plan B con guía manual |
| Usuarios ignoran contratos (fatiga visual) | Alta | Medio | Diseño progresivo — contratos silenciosos hasta que se violan |

---

## 18. Dependencies

| Dependencia | Tipo | SDD Relacionado |
|---|---|---|
| Roles y permisos definidos | Bloqueante | SDD-001 |
| Research de contadores validado | Informativo | SDD-001 |
| Infraestructura de evidencia | Técnica | SDD-006 (Sistema de Evidencia Fiscal) |
| Plataforma de telemetría UX | Informativo | SDD-004 |
| Wireframes fiscales detallados | Bloqueado-por | SDD-007 |

---

## 19. Criterios de DONE

| Criterio | Verificación |
|---|---|
| Los 7 contratos principales están documentados con UI patterns | Revisión de documento |
| Cada contrato especifica qué invariante protege | Matriz de trazabilidad |
| Los estados (conforme/warning/violation/recovery) están definidos por contrato | Revisión de documento |
| Los approval gates están identificados y asignados | Tabla G1-G5 completa |
| Los requisitos de audit trail están especificados | Schema de trail definido |
| Dependencias con SDDs adyacentes están mapeadas | Tabla de dependencias |
| Contratos revisados y aprobados por arquitecto fiscal | Gate G1 aprobado |

---

## 20. Changelog

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 0.1 | 2026-07-14 | Versión inicial — catálogo de 7 contratos, estados, approval gates, audit trail, métricas | — |

---

> **Próximo SDD:** [SDD-003 — Arquitectura de Información Fiscal](SDD-003.md) — Taxonomía, navegación y modelos mentales
