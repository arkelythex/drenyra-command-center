---
status: reference
normative: false
consumed_by: SDD-002
---

---
title: "SDD-003 — Arquitectura de Información Fiscal"
description: "Taxonomía fiscal, modelo de navegación cognitiva y estructura de información para Drenyra"
version: "0.1"
tags: [sdd, ux, information-architecture, taxonomy, navigation]
audience: [ux-engineer, frontend-engineer, product-manager, fiscal-architect]
status: borrador
last_updated: 2026-07-14
---

> **SDD-003** | Ola 1 — Program & Discovery | **Previsto**: 4 días hábiles

---

## 1. Abstract

SDD-003 define la **Arquitectura de Información Fiscal** de Drenyra — la taxonomía de entidades fiscales, el modelo de navegación cognitiva y las reglas de organización de información que permiten a un contador encontrar, entender y relacionar datos fiscales con el mínimo esfuerzo cognitivo.

Este SDD responde a una pregunta central: **¿cómo organizamos la información fiscal para que un contador sepa siempre dónde está, qué puede hacer y adónde ir?**

El alcance cubre:
- Taxonomía canónica de entidades fiscales (8 categorías)
- Sistema de navegación en tres modos: fiscal, operacional y exploratorio
- Home para cada rol (definido en SDD-001)
- Modelo de búsqueda fiscal con filtros semánticos
- Estrategia de breadcrumbs y contexto persistente
- Reglas de información jerárquica vs. plana según la tarea

---

## 2. North Star

> "Un contador nunca debería preguntarse 'dónde está eso' ni 'cómo llegué aquí'."

La navegación fiscal debe ser **predecible, contextual y recuperable**: predecible porque las rutas siguen la lógica fiscal (no la técnica), contextual porque el RUC y la tarea activa determinan qué es relevante, y recuperable porque cualquier estado perdido se restaura en ≤ 2 clics.

---

## 3. Problem Statement

Los sistemas fiscales actuales presentan tres fallas de arquitectura de información:

1. **Organización técnica vs. fiscal.** Los menús reflejan la estructura del sistema (módulos, tablas) no la lógica del contador (periodo, tributo, contribuyente). Un contador piensa en "IGV del periodo marzo" no en "módulo de ventas → reporte 12.1".

2. **Contexto perdido.** Sin un RUC activo visible y persistente, el usuario realiza operaciones en el contexto equivocado. Los cambios de pantalla borran el contexto anterior, obligando al usuario a reconstruirlo manualmente.

3. **Carga cognitiva plana.** Toda la información se presenta al mismo nivel de detalle. No hay jerarquía entre resumen, detalle y raw data. El usuario recibe 30 campos cuando necesita 3.

Los hallazgos de SDD-001 confirman: los contadores P1-P3 saltan entre 5-15 pantallas por tarea, pierden contexto en cada salto, y desarrollan "rutinas de navegación defensiva" para no perderse.

## 4. User Research (link)

SDD-001 revelo patrones de navegacion especificos por arquetipo:

## 4. User Research (link)

SDD-001 revelo patrones de navegacion especificos por arquetipo:

| Arquetipo | Patron de Navegacion | Implicacion IA |
|---|---|---|
| P1 - Contador solitario | Lineal: dashboard > cliente > periodo > reporte | Navegacion plana, minima profundidad |
| P2 - Estudio pequeno | Radial: dashboard como hub, expande a clientes | Dashboard como centro, navegacion en estrella |
| P3 - Outsourcing | Batch: opera en lote por periodo | Acceso rapido multi-RUC, batch |
| P4 - Socio firma grande | Jerarquica: firma > oficina > staff > cliente | Navegacion profunda con atajos |
| P5 - Contador industrial | Por proceso: cierre > ajustes > reports | Navegacion guiada por workflow |
| P6 - Freelance hibrido | Exploratoria: busca, encuentra, sigue pistas | Search-first, navegacion por asociacion |
| P7 - Revisor fiscal | Dual: scan para aprobar, deep para auditar | Dos modos de navegacion |
| P8 - Analista fiscal senior | Por excepcion: alertas > investigacion > solucion | Navegacion reactiva desde notificaciones |

> Ver SDD-001 secciones 5 (segmentacion), 6 (arquetipos) y 7 (roles).

---

## 5. Invariantes Afectados

| # | Invariante | Relevancia | Justificacion |
|---|---|---|---|
| I1 | Alcance por RUC | **Critico** | El RUC es el eje de toda navegacion |
| I6 | Evidencia primero | Alto | Cada entidad debe tener acceso a su fuente |
| I7 | Divulgacion progresiva | **Critico** | La IA es el mecanismo de progressive disclosure |
| I10 | Print readiness | Medio | Vistas imprimibles como navegadas |
| I11 | Consistencia perceptual | **Critico** | Patrones de navegacion consistentes |
| I12 | Performance fiscal | Alto | Navegacion no se degrada con volumen |
| I13 | WCAG 2.2 AA+ | Alto | Navegacion operable por teclado |

---

## 6. Mapeo L0-L3

| Nivel | Rol del Sistema en IA | Rol del Usuario | Activacion |
|---|---|---|---|
| L0 | Navegacion explicita completa | Navega manualmente | Siempre default |
| L1 | Sugiere rutas por tarea/frecuencia | Elige si seguir | Tarea conocida |
| L2 | Prepara espacio con filtros pre-aplicados | Revisa y ajusta | Tareas predecibles |
| L3 | Reorganiza navegacion por patrones | Supervisa y overridea | >5 repeticiones |

**Regla:** L1-L3 solo afectan sugerencias. Navegacion explicita siempre en L0.

---

## 7. Taxonomia Fiscal Canonica

### 7.1 Ocho Categorias de Entidades

FISCAL ENTITY TAXONOMY
+-- 01. CONTRIBUYENTES
|   +-- Persona Juridica (RUC)
|   +-- Persona Natural (RUC/DNI)
|   +-- Establecimientos secundarios
+-- 02. PERIODOS FISCALES
|   +-- Mensual (enero-diciembre)
|   +-- Anual (ejercicio gravable)
|   +-- Personalizado (periodos atipicos)
+-- 03. TRIBUTOS
|   +-- IGV (18%, exportacion, exonerado)
|   +-- Renta (1ra, 2da, 3ra, 4ta, 5ta)
|   +-- ITAN y otros (ISC, IPM)
+-- 04. DOCUMENTOS TRIBUTARIOS
|   +-- Comprobantes de Pago (factura, boleta, NC, ND)
|   +-- Declaraciones (PDT, DJ Anual, DET)
|   +-- Comunicaciones SUNAT
+-- 05. OPERACIONES CONTABLES
|   +-- Asientos y libros contables
|   +-- Conciliaciones (bancaria, fiscal)
|   +-- Ajustes
+-- 06. REPORTES
|   +-- Reportes SUNAT (SIRE, Libros Electronicos)
|   +-- Reportes internos (balance, resultados)
|   +-- Reportes personalizados
+-- 07. REGIMENES Y BENEFICIOS
|   +-- RMT, Regimen General, Nuevo RUS
|   +-- Amazonia / ZOFRATECNA
+-- 08. ALERTAS Y EXCEPCIONES
    +-- Discrepancias, vencimientos, omisiones, riesgos

### 7.2 Relaciones entre Entidades

Cuatro tipos de vinculos:
1. Pertenece a: CONTRIBUYENTE > PERIODO > TRIBUTO
2. Genera: OPERACION > DOCUMENTO > REPORTE
3. Depende de: REPORTE > DECLARACION > TRIBUTO
4. Alerta sobre: ALERTA > DOCUMENTO / OPERACION

### 7.3 Reglas de Taxonomia

T1: Cada entidad pertenece exactamente a una categoria
T2: Categorias estables - no se renombran sin SDD
T3: Entidad puede tener multiples relaciones pero una clasificacion
T4: Nuevas entidades se asignan a categoria existente o requieren SDD

---

## 8. Modelo de Navegacion en Tres Modos

### 8.1 Modo Fiscal (default)

RUC > Periodo > Tributo > Documento

Header con RUC select + Periodo select + pestanas de categoria.
Panel izquierdo con arbol de navegacion fiscal.
Panel central con contenido segun seleccion.

**Uso:** tareas cotidianas - consultar, declarar, conciliar.
**Default para:** Owner, Admin, Accountant, Viewer.

### 8.2 Modo Operacional (por tarea)

Procesos con pasos secuenciales.

Header con RUC + nombre de tarea + paso actual.
Timeline horizontal de pasos (completado/activo/pendiente).
Panel de accion + panel de vista previa.

**Uso:** cierre mensual, declaracion, conciliacion.
**Default para:** Approver.

### 8.3 Modo Exploratorio (por excepcion)

Alerta > Documento > Periodo > Operacion.

Header con RUC + barra de busqueda siempre visible.
Graph de relaciones entre entidades.
Timeline de eventos + panel de detalle.

**Uso:** auditoria, investigacion de anomalias.
**Default para:** Auditor, Reviewer.

---

## 9. Homes por Rol

| Rol | Modo Default | Home |
|---|---|---|
| Owner | Fiscal | Resumen periodo vigente + alertas criticas |
| Admin (estudio) | Fiscal | Dashboard multi-RUC con tareas batch |
| Accountant | Fiscal | Documentos pendientes del periodo activo |
| Reviewer | Exploratorio | Alertas y excepciones pendientes |
| Approver | Operacional | Cola de aprobaciones pendientes |
| Viewer | Fiscal | Reportes y consultas programadas |
| Auditor | Exploratorio | Trail de auditoria + graph relaciones |

---

## 10. Sistema de Busqueda Fiscal

### 10.1 Interfaz

Barra global en header, siempre visible. Resultados agrupados por categoria de entidad.

### 10.2 Filtros por Entidad

| Categoria | Filtros |
|---|---|
| Contribuyentes | RUC, Razon Social, Estado, Regimen |
| Documentos | Tipo, Serie, Rango fecha, Monto, Estado |
| Periodos | Ano, Mes, Estado |
| Alertas | Tipo, Severidad, Estado, Origen |

### 10.3 Search Cross-RUC

- Single-RUC (default): scoped al RUC activo
- Multi-RUC: seleccion explicita, agrupado por contribuyente
- Global: sin filtro de RUC, solo admin

---

## 11. Breadcrumbs y Contexto Persistente

### 11.1 Breadcrumb Fiscal

Formato: RUC > Periodo > Tributo > Documento

Cada nivel es clickeable. Persiste al cambiar de vista. Se incluye en impresiones/PDFs. Maximo 4 niveles, truncado con hover para expandir.

### 11.2 Contexto Persistente

RUC activo + periodo activo se mantienen al navegar. Solo se pierden al cambiar de RUC (con advertencia), expirar sesion, o cerrar sesion.

---

## 12. Estados

| Estado | Patron | Ejemplo |
|---|---|---|
| Loading | Skeleton por entidad | 5 filas skeleton |
| Empty | Empty state con accion | "No hay docs. Importar?" |
| Error | Contextual + recovery | [Reintentar] [Modo offline] |
| Edge: 10k+ | Virtualizacion + contador | "50 de 12,430. Cargar mas" |
| Edge: offline | Banner + cache | "Sin conexion. Datos al 12/07" |

---

## 13. IA para Multi-RUC

| Modo | Comportamiento |
|---|---|
| Single-RUC (default) | Scoped a 1 RUC |
| Batch multi-RUC | Misma operacion en N RUCs |
| Comparativo | Misma metrica en varios RUCs |
| Global admin | Dashboard consolidado con drill-down |

Cambio de RUC requiere: confirmacion explicita, preservar advertencias, restaurar ultimo estado, boton Volver (5 min ventana).

---

## 14. Accesibilidad en IA

| Requisito | WCAG | Implementacion |
|---|---|---|
| Navegacion por teclado | 2.1.1 | Todos los items focusables con Tab |
| Skip to content | 2.4.1 | Primer elemento salta al contenido principal |
| Orden navegacion | 2.4.3 | Izquierda > contenido > panel derecho |
| Breadcrumb navegable | 2.4.5 | nav aria-label con links estructurados |
| Anuncio cambios | 4.1.3 | aria-live en paneles que se actualizan |

---

## 15. Performance Budget

| Componente | Budget |
|---|---|
| Carga inicial sidebar | <= 300ms |
| Cambio de vista (misma entidad) | <= 100ms |
| Busqueda resultados | <= 200ms |
| Cambio de RUC | <= 500ms |
| Batch multi-RUC | <= 2s |

---

## 16. Success Metrics

| Metrica | Objetivo | Medicion |
|---|---|---|
| Tiempo hasta encontrar entidad | <= 5s | Telemetria SDD-004 |
| Tasa navegacion erronea | <= 10% | Session replay |
| Profundidad promedio navegacion | <= 4 niveles | Analytics |
| Uso de busqueda vs menu | >= 30% search | Feature usage |
| Cambios RUC accidentales | <= 1/sesion | Telemetria |
| Tiempo aprendizaje nuevo usuario | <= 15 min | Onboarding tracking |

---

## 17. Riesgos

| Riesgo | Prob | Impacto | Mitigacion |
|---|---|---|---|
| Tree muy profundo para P1 | Alta | Alto | Vistas planas para P1, tree para P4 |
| Modos de navegacion confusos | Alta | Medio | Onboarding guiado explicando modos |
| Search cross-RUC confunde | Media | Medio | Separar single/multi explicitamente |
| Breadcrumb largo | Alta | Bajo | Truncar con hover expandible |

---

## 18. Dependencias

| Dependencia | Tipo | SDD |
|---|---|---|
| Personas y roles definidos | Bloqueante | SDD-001 |
| Contratos de confianza definidos | Informativo | SDD-002 |
| Plataforma de telemetria UX | Informativo | SDD-004 |
| Sistema de diseno fiscal | Bloqueado-por | Ola 3 (SDD-016+) |
| Taxonomia validada con contadores | Bloqueante | 2 sesiones validacion externa |

---

## 19. Criterios de DONE

| Criterio | Verificacion |
|---|---|
| Taxonomia de 8 categorias documentada | Revision documento |
| Tres modos de navegacion definidos | Revision documento |
| Homes por rol para 7 roles | Tabla completa |
| Busqueda fiscal especificada con filtros | Filtros semanticos por entidad |
| Breadcrumb y contexto persistente definidos | Reglas de persistencia |
| Estados cubiertos para todas las vistas | Matriz entidad x estado |

---

## 20. Changelog

| Version | Fecha | Cambio | Autor |
|---|---|---|---|
| 0.1 | 2026-07-14 | Version inicial - taxonomia 8 cat, 3 modos navegacion, homes por rol, busqueda, breadcrumb | - |

---

> **Proximo SDD:** SDD-004 - Plataforma de Telemetria de UX - Metricas, dashboards y deteccion de friccion
