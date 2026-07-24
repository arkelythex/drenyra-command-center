import sys
content = """

## 4. User Research (link)

SDD-001 revelo patrones de navegacion especificos por arquetipo:

| Arquetipo | Patron de Navegacion | Implicacion IA |
|---|---|---|
| P1 - Contador solitario | Lineal: dashboard - cliente - periodo - reporte | Navegacion plana, minima profundidad |
| P2 - Estudio pequeno | Radial: dashboard como hub, expande a clientes | Dashboard como centro, navegacion en estrella |
| P3 - Outsourcing | Batch: opera en lote por periodo, no por cliente | Acceso rapido multi-RUC, acciones batch |
| P4 - Socio firma grande | Jerarquica: firma - oficina - staff - cliente | Navegacion profunda con atajos |
| P5 - Contador industrial | Por proceso: cierre mensual - ajustes - reports | Navegacion guiada por workflow |
| P6 - Freelance hibrido | Exploratoria: busca, encuentra, sigue pistas | Search-first, navegacion por asociacion |
| P7 - Revisor fiscal | Dual: vista rapida para aprobar, profunda para auditar | Dos modos de navegacion: scan y deep |
| P8 - Analista fiscal senior | Por excepcion: alertas - investigacion - resolucion | Navegacion reactiva, desde notificaciones |

> Ver SDD-001 secciones 5 (segmentacion), 6 (arquetipos) y 7 (roles).

---

## 5. Invariantes Afectados

| # | Invariante | Relevancia | Justificacion |
|---|---|---|---|
| I1 | Alcance por RUC | **Critico** | El RUC es el eje de toda navegacion |
| I6 | Evidencia primero | Alto | Cada entidad debe tener acceso a su fuente |
| I7 | Divulgacion progresiva | **Critico** | La IA es el mecanismo de progressive disclosure |
| I10 | Print readiness | Medio | Las vistas deben ser imprimibles como navegadas |
| I11 | Consistencia perceptual | **Critico** | Patrones de navegacion consistentes |
| I12 | Performance fiscal | Alto | Navegacion no debe degradarse con volumen |
| I13 | WCAG 2.2 AA+ | Alto | Navegacion operable por teclado |

---

## 6. Mapeo L0-L3

| Nivel | Rol del Sistema en IA | Rol del Usuario |
|---|---|---|
| L0 | Mostrar estructura de navegacion explicita | Navega manualmente - default |
| L1 | Sugerir rutas basadas en tarea y frecuencia | Elige si seguir sugerencia |
| L2 | Preparar espacio de trabajo con filtros pre-aplicados | Revisa y ajusta |
| L3 | Reorganizar navegacion segun comportamiento recurrente | Supervisa y overridea |

**Regla:** L1-L3 solo afectan sugerencias. Navegacion explicita siempre disponible en L0.

---

## 7. Taxonomia Fiscal Canonica

### 7.1 Ocho Categorias de Entidades

FISCAL ENTITY TAXONOMY
+-- 01. CONTRIBUYENTES
|   +-- Persona Juridica (RUC)
|   +-- Persona Natural (RUC/DNI)
|   +-- Establecimientos secundarios
|
+-- 02. PERIODOS FISCALES
|   +-- Mensual (enero-diciembre)
|   +-- Anual (ejercicio gravable)
|   +-- Personalizado (periodos atipicos)
|
+-- 03. TRIBUTOS
|   +-- IGV (18%, exportacion, exonerado)
|   +-- Renta (1ra, 2da, 3ra, 4ta, 5ta)
|   +-- ITAN
|   +-- Otros (ISC, IPM, etc.)
|
+-- 04. DOCUMENTOS TRIBUTARIOS
|   +-- Comprobantes de Pago (factura, boleta, NC, ND)
|   +-- Declaraciones (PDT, DJ Anual, DET)
|   +-- Comunicaciones (cartas induccion, fiscalizacion)
|
+-- 05. OPERACIONES CONTABLES
|   +-- Asientos contables
|   +-- Libros contables
|   +-- Conciliaciones (bancaria, fiscal)
|   +-- Ajustes
|
+-- 06. REPORTES Y DECLARACIONES
|   +-- Reportes SUNAT (SIRE, Libros Electronicos)
|   +-- Reportes internos (balance, resultados)
|   +-- Reportes personalizados
|
+-- 07. REGIMENES Y BENEFICIOS
|   +-- RMT, Regimen General, Nuevo RUS
|   +-- Amazonia / ZOFRATECNA
|   +-- Beneficios sectoriales
|
+-- 08. ALERTAS Y EXCEPCIONES
    +-- Discrepancias (IGV, detracciones)
    +-- Vencimientos proximos
    +-- Omisiones y riesgos fiscales

### 7.2 Relaciones entre Entidades

Cuatro tipos de vinculos:
1. Pertenece a: CONTRIBUYENTE > PERIODO > TRIBUTO
2. Genera: OPERACION > DOCUMENTO > REPORTE
3. Depende de: REPORTE > DECLARACION > TRIBUTO
4. Alerta sobre: ALERTA > DOCUMENTO / OPERACION

**Regla IA:** navegacion debe reflejar estas relaciones en <= 2 clics.

### 7.3 Reglas de Taxonomia

T1: Cada entidad pertenece exactamente a una categoria
T2: Categorias estables - no se renombran sin SDD
T3: Entidad puede tener multiples relaciones pero una clasificacion
T4: Nuevas entidades se asignan a categoria existente o requieren SDD

---

## 8. Modelo de Navegacion en Tres Modos

### 8.1 Modo Fiscal (default)

Basado en: RUC > Periodo > Tributo > Documento

Header con RUC select + Periodo select + pestanas de categoria.
Panel izquierdo con arbol de navegacion fiscal.
Panel central con contenido segun seleccion.

Uso: tareas cotidianas - consultar, declarar, conciliar.
Default para: Owner, Admin, Accountant, Viewer.

### 8.2 Modo Operacional (por tarea)

Basado en procesos con pasos secuenciales.

Header con RUC + nombre de tarea + paso actual.
Timeline horizontal de pasos.
Panel de accion con herramientas del paso activo.
Panel de vista previa.

Uso: cierre mensual, declaracion, conciliacion.
Default para: Approver.

### 8.3 Modo Exploratorio (por excepcion)

Basado en conexiones: Alerta > Documento > Periodo > Operacion.

Header con RUC + barra de busqueda siempre visible.
Graph de relaciones entre entidades.
Timeline de eventos cronologico.
Panel de detalle de entidad seleccionada.

Uso: investigacion de anomalias, auditoria.
Default para: Auditor, Reviewer.

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
| Auditor | Exploratorio | Trail de auditoria + graph de relaciones |

---

## 10. Sistema de Busqueda Fiscal

### 10.1 Interfaz

Barra global en header, siempre visible. Resultados agrupados por categoria.

Cada resultado muestra: tipo, resumen, RUC asociado, fecha.
Resultado seleccionable para navegar directamente.

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
- Global admin: sin filtro de RUC, solo admin

---

## 11. Breadcrumbs y Contexto Persistente

### 11.1 Breadcrumb Fiscal

Formato: RUC > Periodo > Tributo > Documento

- Cada nivel es clickeable (navegacion directa)
- Persiste al cambiar de vista dentro del mismo contexto
- Se incluye en impresiones y PDFs
- Maximo 4 niveles visibles, trunca con hover para expandir

### 11.2 Contexto Persistente

RUC activo y periodo activo se mantienen al navegar. Solo se pierden cuando:
- Usuario cambia explicitamente de RUC (con advertencia)
- Sesion expira
- Usuario cierra sesion

Cambio de RUC muestra confirmacion: "Se cerraran las vistas activas. Cambios no guardados se perderan."

---

## 12. Estados (loading, empty, error, edge)

| Estado | Patron | Ejemplo |
|---|---|---|
| Loading | Skeleton por entidad | Tabla con 5 filas skeleton |
| Empty | Empty state con accion | "No hay documentos. Importar del periodo anterior?" |
| Error | Contextual con recovery | "No pudimos cargar. [Reintentar] [Modo offline]" |
| Edge: 10k+ filas | Virtualizacion + contador | "50 de 12,430 facturas. Cargar mas >" |
| Edge: sin conexion | Banner offline + datos cacheados | "Sin conexion. Datos al 12/07/2026 14:30" |

---

## 13. IA para Multi-RUC

### 13.1 Modos Multi-RUC

| Modo | Comportamiento | UI |
|---|---|---|
| Single-RUC (default) | Todo scoped a 1 RUC | Selector en header |
| Batch multi-RUC | Misma operacion en N RUCs | Selector multi + "Aplicar a todos" |
| Comparativo | Misma metrica en varios RUCs | Tabla lado a lado |
| Global admin | Dashboard consolidado | Vista agregada con drill-down |

### 13.2 Cambio de RUC

Requiere:
1. Confirmacion explicita (banner)
2. Preservar advertencias pendientes del RUC anterior
3. Restaurar ultimo estado visitado en RUC destino
4. Boton "Volver" al RUC anterior (5 min ventana)

---

## 14. Accesibilidad en IA

| Requisito | WCAG | Implementacion |
|---|---|---|
| Navegacion por teclado | 2.1.1 | Todos los items focusables con Tab |
| Skip to content | 2.4.1 | Primer elemento salta al contenido |
| Orden de navegacion | 2.4.3 | Izquierda > contenido > panel derecho |
| Breadcrumb como nav | 2.4.5 | <nav aria-label> con links |
| Busqueda con autocomplete | 3.3.2 | Label + sugerencias accesibles |
| Anuncio de cambios | 4.1.3 | aria-live en paneles dinamicos |

---

## 15. Performance Budget

| Componente | Budget | Medicion |
|---|---|---|
| Carga inicial de sidebar | <= 300ms | TTFB + render |
| Cambio de vista (misma entidad) | <= 100ms | Tiempo transicion |
| Busqueda (resultados) | <= 200ms | Tiempo respuesta |
| Breadcrumb render | <= 50ms | Render time |
| Cambio de RUC | <= 500ms | Recarga de contexto |
| Operacion batch multi-RUC | <= 2s | Tiempo operacion |

---

## 16. Success Metrics

| Metrica | Objetivo | Medicion |
|---|---|---|
| Tiempo hasta encontrar entidad | <= 5s | Telemetria (SDD-004) |
| Tasa de navegacion erronea | <= 10% | Session replay |
| Profundidad promedio | <= 4 niveles | Analytics |
| Uso de busqueda vs menu | >= 30% search | Feature usage |
| Cambios de RUC accidentales | <= 1/sesion | Telemetria |
| Tiempo de aprendizaje nuevo usuario | <= 15 min | Onboarding tracking |

---

## 17. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| Tree muy profundo para P1 (6+ niveles) | Alta | Alto | Vistas planas para P1, tree para P4 |
| Search cross-RUC confunde | Media | Medio | Separar single vs multi explicitamente |
| Modos de navegacion confusos al inicio | Alta | Medio | Onboarding guiado explicando modos |
| Breadcrumb muy largo en entidades profundas | Alta | Bajo | Truncar con hover expandible |

---

## 18. Dependencias

| Dependencia | Tipo | SDD |
|---|---|---|
| Personas y roles definidos | Bloqueante | SDD-001 |
| Contratos de confianza definidos | Informativo | SDD-002 |
| Plataforma de telemetria UX | Informativo | SDD-004 |
| Sistema de diseno fiscal | Bloqueado-por | Ola 3 (SDD-016+) |
| Taxonomia validada con contadores | Bloqueante | 2 sesiones de validacion externa |

---

## 19. Criterios de DONE

| Criterio | Verificacion |
|---|---|
| Taxonomia de 8 categorias documentada | Revision de documento |
| Tres modos de navegacion definidos | Revision de documento |
| Homes por rol para 7 roles | Tabla completa |
| Sistema de busqueda fiscal especificado | Filtros semanticos por entidad |
| Breadcrumb y contexto persistente definidos | Reglas de persistencia |
| Estados cubiertos para todas las vistas | Matriz entidad x estado |
| IA validada con 2 contadores reales | Reporte de validacion |
| Dependencias mapeadas con SDDs adyacentes | Tabla de dependencias |

---

## 20. Changelog

| Version | Fecha | Cambio | Autor |
|---|---|---|---|
| 0.1 | 2026-07-14 | Version inicial - taxonomia 8 categorias, 3 modos navegacion, homes por rol, busqueda, breadcrumb | - |

---

> **Proximo SDD:** SDD-004 - Plataforma de Telemetria de UX - Metricas, dashboards y deteccion de friccion
"""

with open('/home/dreamcoder08/Documents/PROYECTOS/Drenyra/docs/ux/SDD-003.md', 'a') as f:
    f.write(content)

print("Appended successfully")
"""
with open('/home/dreamcoder08/Documents/PROYECTOS/Drenyra/docs/ux/append_sdd003.py', 'w') as f:
    f.write(py_code)
print("Script written")
