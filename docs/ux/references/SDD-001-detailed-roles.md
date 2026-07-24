---
status: reference
normative: false
consumed_by: SDD-001
---

---
title: "SDD-001 — Roles de Usuario, Personas y Jobs-to-be-Done"
description: "Define el modelo de usuarios del sistema: segmentos, arquetipos, roles operativos, JTBDs, cadencia de trabajo y plan de validación para Drenyra UX."
version: "1.0"
status: "Draft"
audience: ["UX", "Product", "Engineering"]
tags: ["sdd", "ux", "personas", "jtbd", "roles"]
last_updated: "2026-07-14"
---

# SDD-001 — Roles de Usuario, Personas y Jobs-to-be-Done

> **Part of**: Drenyra Experience Transformation Program (SDD-000)
> **Wave**: 1 — Program / Discovery
> **Next**: [SDD-002](./SDD-002.md)

---

## 1. Executive Decision: v0 Primary User

**Decisión**: El usuario primario de Drenyra v0 es el **contador independiente que atiende múltiples RUCs**.

| Iteración | Foco | Usuario primario | Alcance RUC |
|-----------|------|------------------|-------------|
| **v0** | Contador independiente multi-RUC | Contador / Estudio contable pequeño | 1–20 RUCs |
| **v1** | Empresa con equipo contable interno | CFO, contador senior, auxiliar | 1–5 RUCs |
| **v2** | Grupo económico / holding | Consolidación multi-empresa | 5–200+ RUCs |
| **v3** | SUNAT / ente fiscal | Auditor fiscal, supervisor | N/A |

### Rationale v0

1. **Mercado**: 60%+ de contadores peruanos ejercen de forma independiente o en estudios pequeños.
2. **Dolor máximo**: La fragmentación multi-RUC es donde el ecosistema actual falla más fuerte.
3. **Complejidad controlada**: 1–20 RUCs permite validar el modelo multi-tenancy sin la presión de escalar a holding.
4. **Efecto red**: Cada contador independiente trae 5–20 empresas al sistema.

> ⚠️ **Precaución**: No diseñar para el contador independiente *excluyendo* al resto. La arquitectura debe generalizar al equipo contable interno y al grupo económico sin rewrites.

---

## 2. Problem Statement

**Problema**: En el ecosistema fiscal peruano actual, confluyen tres confusiones que impiden un diseño UX coherente:

1. **Confusión segmento↔persona**: Se habla de "PYME" como si todos los usuarios dentro de una PYME tuvieran las mismas necesidades.
2. **Confusión persona↔rol**: Se asignan permisos basados en el título del puesto sin entender el contexto del operador.
3. **Confusión rol↔RUC**: Un mismo humano opera con distintas intenciones según el RUC que esté atendiendo.

**Sintoma**: Sistemas que obligan al contador a hacer "context switching" manual entre empresas sin preservar su identidad, sus atajos, ni sus pendientes.

---

## 3. Principles

1. **Identidad única, contexto múltiple**: El usuario es una sola persona con múltiples afiliaciones RUC.
2. **El RUC es el primer filtro**: Toda decisión UX parte de "¿a qué RUC estás atendiendo?"
3. **Permisos por rol × RUC**: No existe "admin" global; existe "admin para RUC X".
4. **JTBD sobre features**: Lo que importa no es lo que el sistema hace, sino lo que el usuario contrata al sistema para hacer.
5. **Cadencia sobre urgencia**: El trabajo fiscal tiene ritmos predecibles (diario, semanal, mensual, anual) — la UX debe bailar al ritmo del usuario.
6. **Progressive disclosure**: El contador no necesita ver todo el poder del sistema en el día 1.
7. **Evidencia primero, acción después**: Toda recomendación debe mostrar su sustento antes de pedir acción.
8. **Reversibilidad visible**: El usuario debe saber que todo es deshacible.
9. **Audit trail silencioso**: El sistema registra sin pedir permiso; el contador no debe "acordarse" de auditar.
10. **Offline como primera clase**: El contador trabaja desde el cliente, desde su casa, desde una zona sin internet.
---

## 4. Segmentación Canónica

Drenyra segmenta el mercado fiscal peruano en **6 bandas** definidas por facturación anual:

| Banda | Facturación Anual | Perfil | Features Drenyra |
|-------|------------------|--------|-----------------|
| **Solo** | < S/ 150K | Profesional individual, 1 RUC | Libro diario simplificado, detracciones, declaraciones mensuales |
| **Micro** | S/ 150K - S/ 1M | Microempresa familiar, 1-2 RUCs | + planilla electrónica, SIRE parcial |
| **Pequeña** | S/ 1M - S/ 15M | PYME formalizada, 1-5 RUCs | + SIRE completo, retenciones, inventarios, multi-establecimiento |
| **Mediana** | S/ 15M - S/ 100M | Empresa en crecimiento, 5-20 RUCs | + consolidación multi-RUC, flujo de caja, presupuesto |
| **Grande** | S/ 100M+ | Corporación, 20+ RUCs | + reporting gerencial, integración ERP, API fiscal |
| **Grupo** | Consolida 2+ empresas | Holding / Grupo Económico | + consolidación fiscal, transfer pricing, reportes SUNAT |

**Decisión**: Segmentación por banda (no por usuario) permite escalar del contador independiente al grupo corporativo sin cambiar la arquitectura de permisos.

## 5. Arquetipos (P1-P8)

Ocho perfiles de usuario:

| ID | Nombre | Banda Típica | Relación con Fiscal | Ansiedad Principal |
|----|--------|-------------|-------------------|-------------------|
| **P1** | El Indepe | Solo | Stack contable manual + Excel + SUNAT OL | "No sé si lo estoy haciendo bien" |
| **P2** | La Microempresaria | Micro | Negocio propio + contador part-time | "No entiendo por qué SUNAT me notifica" |
| **P3** | El Contador Tradicional | Pequeña-Media | Dueño de estudio, 10-50 clientes | "Si automatizo, pierdo el control" |
| **P4** | El Contador Digital | Pequeña-Media | Dueño de estudio, 20-100 clientes, digital | "Necesito escalar sin contratar más" |
| **P5** | El CFO Operativo | Mediana-Grande | Gerente finanzas, 5-15 RUCs, reporta a directorio | "Necesito visibilidad en tiempo real" |
| **P6** | La Auditora | Grande-Grupo | Auditor interno/externo, períodos cerrados | "Necesito pista de auditoría inalterable" |
| **P7** | El Practicante | Solo-Micro | Asistente contable, supervisado | "Tengo miedo de cometer un error irreversible" |
| **P8** | El Regulatorio | Grande-Grupo | Oficial de cumplimiento, seguimiento normativo | "Un cambio normativo me deja fuera de compliance" |

**Patrón**: Todos comparten accountability fiscal como ansiedad de fondo.

## 6. Roles Operativos

Siete roles combinables:

| Rol | Nivel | Permisos Clave | Puede |
|-----|-------|---------------|-------|
| **Owner** | RUC | Plenos | Transferir propiedad, cerrar RUC, delegar admin |
| **Admin** | RUC | Todos excepto transferir/cerrar | Gestionar usuarios, configurar planes, ver todo |
| **Accountant** | RUC | Operativos plenos | Registrar transacciones, generar declaraciones, emitir CDR, adjuntar evidencia |
| **Reviewer** | RUC | Revisión sin ejecución | Ver todo, comentar, aprobar/rechazar, NO registrar ni emitir |
| **Approver** | RUC | Aprobación de riesgo | Aprobar operaciones que superan umbrales de riesgo |
| **Viewer** | RUC | Solo lectura | Ver dashboards, reportes, pistas de auditoría |
| **Auditor** | RUC | Lectura histórica + exportación | Revisar períodos cerrados, exportar evidencia |

**Reglas de combinación**: Owner > Admin > Accountant > Reviewer > Approver > Viewer (herencia parcial). Auditor es ortogonal. Roles por RUC, no global.

## 7. Jobs-to-be-Done

**12 JTBDs principales**:
1. **Registrar un comprobante** — Capturar factura/boleta/NC/ND desde PDF/XML/manual/email con validación SUNAT
2. **Convalidar un registro** — Verificar coincidencia con original, corregir, adjuntar evidencia
3. **Cuadrar un período** — Verificar libros = declaraciones = saldos bancarios
4. **Declarar un impuesto** — Generar, revisar y presentar PDT/PLAME/SIRE
5. **Resolver una discrepancia** — Detectar diferencia SUNAT vs registros, entender origen, corregir, dejar evidencia
6. **Responder un requerimiento SUNAT** — Preparar documentación trazable, enviar, dar seguimiento
7. **Generar un reporte gerencial** — EE.RR, balance, flujo de caja desde data validada
8. **Supervisar el estado fiscal** — Dashboard de cumplimiento, fechas, notificaciones, riesgos
9. **Configurar un RUC** — Registrar empresa, asignar roles, conectar SUNAT, configurar libros
10. **Onboardear un cliente** — Invitar, asignar RUC, configurar alcance, transferir data histórica
11. **Auditar un período** — Revisar transacciones cerradas, verificar consistencia, emitir informe
12. **Exportar evidencia para SUNAT** — Paquete fiscal completo (libros, declaraciones, comprobantes, CDRs)

**Trabajos emocionales**: Sentirme en control, dormir tranquilo, parecer profesional, no ser el cuello de botella.
**Trabajos sociales**: Justificar decisiones, transferir conocimiento, diferenciarme como contador.

## 8. Cadencia de Trabajo

| Frecuencia | Actividad | Trigger | En Drenyra |
|-----------|-----------|---------|-----------|
| **Diaria** | Registro de comprobantes | Llegada de facturas | Inbox + matching automático + anomalías |
| **Semanal** | Convalidación y cuadre | Revisión período parcial | Dashboard semanal + diferencias + flujo de caja |
| **Mensual** | Cierre contable + declaraciones | Vencimiento SUNAT | Checklist de cierre + validación pre-declaración |
| **Excepcional** | Requerimiento SUNAT, fiscalización | Notificación / error | Bandeja de incidentes + workflow de respuesta |

**Insight**: La mayoría de errores fiscales se originan en la operación diaria y se descubren en el cuadre semanal. Drenyra debe reducir el feedback loop.

## 9. Matriz de Responsabilidad (RACI)

| Actividad | Owner | Admin | Accountant | Reviewer | Approver | Viewer | Auditor |
|-----------|-------|-------|-----------|----------|---------|-------|---------|
| Configurar RUC | A | R | C | I | I | I | I |
| Registrar comprobante | I | I | R/A | C | I | I | I |
| Convalidar registro | I | I | R | A | I | I | I |
| Aprobar operación riesgosa | I | I | C | C | R/A | I | I |
| Declarar impuesto | I | I | R | C | A | I | I |
| Responder requerimiento | C | I | R | C | A | I | I |
| Cerrar período | I | R | C | A | I | I | I |
| Auditar período cerrado | I | I | I | I | I | I | R/C |
| Generar reporte | I | I | C | I | I | I | I |
| Ver dashboard | I | I | C | C | C | R | R |

## 10. Implicaciones de IA

La IA de Drenyra se organiza alrededor de **homes por rol**, no de features:

| Rol | Home Principal | Acceso Rápido |
|-----|---------------|---------------|
| Accountant | Inbox Fiscal (comprobantes pendientes) | Cuadre semanal, RUC activo |
| Reviewer | Bandeja de Revisiones | Períodos pendientes, diferencias |
| Approver | Bandeja de Aprobaciones | Operaciones que superan umbral |
| Owner/Admin | Dashboard del RUC | Configuración, usuarios, plan |
| Viewer | Dashboard de Monitoreo | Reportes, estado general |
| Auditor | Panel de Auditoría | Períodos cerrados, exportación |

**Principio**: Cada rol llega a su home y ve exactamente lo que necesita hacer. No hay menú genérico.

## 11. Estrategia de Progressive Disclosure

| Etapa | Qué ve el usuario | Qué NO ve |
|-------|------------------|----------|
| **Día 1** | RUC activo, inbox fiscal, registrar comprobante | Historial completo, config avanzada |
| **Semana 1** | Dashboard semanal, cuadre, reportes básicos | Auditoría, consolidación multi-RUC |
| **Mes 1** | Declaraciones, cierre mensual, checklist | Histórico de años anteriores |
| **Trimestre 1** | Todo el RUC actual | Otros RUCs, features avanzadas |

La progresión se acelera si el usuario demuestra competencia (acciones completadas sin errores).

## 12. Onboarding y Activación

**Preguntas de activación** (necesarias para configurar el primer RUC):
- ¿Cuál es tu RUC?
- ¿Qué tipo de contribuyente eres? (Nuevo RUS / RER / General)
- ¿Qué libros electrónicos llevas? (Registro de Ventas, Compras, Diario Simplificado, etc.)
- ¿Qué periodicidad? (Mensual / Bimestral)
- ¿Cuál es tu correo registrado en SUNAT?

**Onboarding óptimo**: 3 pasos máximos antes de que el usuario vea data real. No pedir configuración que puede ser inferida del RUC.

## 13. Multi-tenancy

**Requerimientos**:
1. Un usuario puede operar N RUCs sin cerrar sesión ni dividir su identidad
2. El RUC activo es un cambio de contexto inmediato (cached, < 200ms)
3. Cada RUC preserva su propio estado, pendientes, configuración y audit trail
4. El usuario ve una bandeja unificada de pendientes a través de todos sus RUCs
5. Los shortcuts y preferencias del usuario viajan con él entre RUCs
6. El switcher de RUC muestra último acceso + alertas por RUC

**Anti-pattern**: Forzar al usuario a login/logout por cada RUC que atiende.

## 14. Requerimientos de Accesibilidad

- WCAG 2.2 AA+ como mínimo
- Contraste suficiente para lectura prolongada de tablas fiscales (70%+ del contenido)
- Navegación completa por teclado (el contador usa atajos como extensión de su memoria muscular)
- Soporte para lectores de pantalla en operaciones críticas (declarar, aprobar, auditar)
- Reducir parpadeo y animaciones en operaciones de alta concentración (cuadre, revisión)
- Modo alto contraste para trabajar en exteriores (sin solapamiento con modo oscuro)

## 15. Plan de Validación

**18 entrevistas** distribuidas:
- 3 P1 (El Indepe)
- 3 P3/P4 (Contadores Tradicional/Digital)
- 3 P5 (CFO Operativo)
- 2 P2 (La Microempresaria)
- 2 P6 (La Auditora)
- 2 P7 (El Practicante)
- 1 P8 (El Regulatorio)
- 2 cross-funcionales (multi-rol multi-RUC)

**5 métodos**: (1) Entrevista contextual, (2) Card sorting de JTBDs, (3) Prototipado flujo crítico (registrar→cuadrar→declarar), (4) Evaluación heurística con invariantes SDD-000, (5) Test de legibilidad de términos fiscales.

**Invalidación**: Más de 3 entrevistas muestran ansiedades no capturadas, o >40% no entienden JTBDs sin explicación.

## 16. Métricas de Éxito

| Categoría | Métrica | Target v0 | Cómo medir |
|-----------|--------|-----------|-----------|
| **Activación** | RUCs configurados primeros 7 días | > 80% | Evento completitud onboarding |
| **Activación** | Primer comprobante primeros 14 días | > 70% | Evento de registro |
| **Profesional** | TTR reducción vs línea base | > 40% | Tiempo registro → cuadre |
| **Profesional** | TTD reducción vs línea base | > 30% | Tiempo cuadre → declaración |
| **Profesional** | Discrepancias detectadas antes del cierre | > 90% | Alertas vs detectadas por usuario |
| **Confianza** | NPS "confianza en los datos" | > 40 | Encuesta post-declaración |
| **Confianza** | Operaciones reverseadas sin soporte | > 95% | Ratio reversiones autónomas / total |

## 17. Dependencias, No-Objetivos y Criterios de Aceptación

**Dependencias**:
- SDD-002 (Fiscal Trust Contracts): define los contratos de evidencia y reversibilidad que esta segmentación consume
- SDD-003 (Information Architecture): navegación que materializa las homes por rol
- SDD-004 (Analytics & Telemetry): habilitará la medición de métricas

**No-objetivos explícitos**:
- NO define UI visual — SDD-007+
- NO define arquitectura técnica multi-tenancy — SDD-010
- NO define modelo de datos de usuarios/roles — responsabilidad backend
- NO resuelve pricing/planes por banda

**Criterios de aceptación**:
1. Una persona no-contadora puede explicar la diferencia entre P1, P3 y P4
2. Un desarrollador puede asignar roles a un nuevo endpoint basado en la RACI
3. Las 6 bandas mapean 1:1 contra thresholds de negocio
4. Los 8 arquetipos cubren > 90% de patrones de uso
5. Las 12 JTBDs son mutuamente excluyentes y colectivamente exhaustivas
6. La RACI no tiene conflictos (nadie tiene R y A de la misma actividad)
7. Cualquier decisión UX puede rastrearse a un principio o invariante
8. El plan de validación es ejecutable por 2 personas en 4 semanas

---

> **Status**: Draft | **Próximo**: [SDD-002](./SDD-002.md) — Fiscal Trust Contracts
