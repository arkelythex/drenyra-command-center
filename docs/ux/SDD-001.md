# SDD-001 — User Roles, Personas and Jobs-to-be-Done

| Campo | Valor |
|---|---|
| Estado | APPROVED |
| Versión | 1.0.0 |
| Fecha | 2026-07-14 |
| Producto | Drenyra |
| SDD padre | SDD-000 — Drenyra Experience Transformation Program |
| Tipo | Producto, investigación, experiencia y autorización |
| Alcance geográfico inicial | Perú |
| Autor de producto | Dreamcoder |
| Aprobado | 2026-07-14 |

## 1. Decisión ejecutiva

Drenyra priorizará inicialmente al **contador independiente peruano que administra varias empresas/RUC y soporta una alta carga operativa SUNAT**. La siguiente expansión será hacia estudios contables pequeños con separación entre preparación, revisión y aprobación.

La secuencia de mercado queda fijada así:

1. **v0 — Contadores independientes.** Validar SIRE, evidencia, revisión, cierre y operación multiempresa con una persona que puede acumular responsabilidades.
2. **v1 — Estudios contables pequeños.** Incorporar asignación, supervisión, segregación de funciones, capacidad del equipo y portafolio multi-RUC.
3. **v2 — PyMEs con contador externo o equipo interno.** Coordinar empresa, contador, gerencia y responsables de aprobación.
4. **v3 — Plataforma de compliance LATAM.** Adaptar country packs, terminología y reglas sin romper el núcleo de evidencia.

El usuario que determina la arquitectura de v0 es el profesional contable. El dueño de negocio, auditor y administrador serán actores importantes, pero no conducirán la navegación principal ni convertirán Drenyra en un dashboard genérico para gerencia.

## 2. Problema

Los productos contables suelen mezclar cuatro conceptos diferentes:

- **Segmento:** quién compra o adopta Drenyra.
- **Persona:** patrón de necesidades y comportamiento.
- **Rol operacional:** responsabilidad que alguien ejerce en un workflow.
- **Permiso:** acción concreta que una identidad puede realizar dentro de un scope.

Cuando estos conceptos se confunden aparecen errores como:

- asumir que todo owner puede aprobar una declaración;
- asumir que todo contador puede administrar usuarios;
- convertir el cargo laboral en autorización técnica;
- diseñar una misma home para quien prepara, revisa, audita y dirige;
- mostrar al dueño controles contables que no necesita;
- impedir que un contador independiente trabaje porque no tiene otro usuario disponible para revisar;
- conceder autoridad por haber seleccionado una empresa en la interfaz.

Este SDD define una arquitectura de usuarios que sirve tanto al producto inicial como a la futura colaboración multiempresa.

## 3. Principios

1. El workflow se diseña para responsabilidades, no para títulos laborales.
2. Una persona puede ejercer varios roles, pero cada acción conserva la responsabilidad utilizada.
3. La persona o rol visible en UI no concede autoridad; el backend evalúa permisos y scope verificados.
4. Preparar, revisar, aprobar y aplicar son responsabilidades diferentes, aunque v0 permita combinarlas bajo una política explícita.
5. El usuario profesional necesita excepciones accionables, no un health score opaco.
6. El gerente necesita impacto y decisiones; no una réplica simplificada del workspace contable.
7. El auditor necesita trazabilidad y evidencia; no acceso operativo innecesario.
8. La IA actúa como asistente y ejecutor controlado, nunca como persona responsable o autoridad fiscal.
9. Multiempresa es una capacidad nuclear, no un add-on para planes superiores.
10. La experiencia debe funcionar para una sola persona sin degradar el modelo de control requerido por un equipo.

## 4. Segmentación canónica

Los rangos siguientes son bandas de diseño del producto, no afirmaciones estadísticas sobre el mercado.

| Segmento | Banda operacional de diseño | Dolor dominante | Prioridad |
|---|---|---|---|
| Contador independiente | 1 usuario principal; 5–30 empresas activas | Cambiar de RUC, perseguir información, conciliar y cerrar bajo presión | v0 / primaria |
| Microestudio contable | 2–5 personas; 20–80 empresas | Asignación, visibilidad, revisión inconsistente y dependencia del fundador | v1 / primaria |
| Estudio contable pequeño | 6–20 personas; 50–250 empresas | Capacidad, segregación, estandarización, vencimientos y auditoría | v1–v2 / secundaria |
| PyME con contador externo | Gerencia + contador/estudio | Entregar información, aprobar decisiones y comprender obligaciones | v2 / secundaria |
| Equipo contable interno | Preparadores, reviewer y responsable fiscal | Coordinación interáreas, control interno y cierre | v2 / secundaria |
| Auditor o asesor | Acceso temporal y limitado | Examinar evidencia sin alterar operación | transversal |

Los límites numéricos sirven para diseñar rendimiento, navegación y pruebas. No definirán por sí solos precios, elegibilidad o permisos.

## 5. Arquetipos de persona

No se utilizarán nombres ficticios, fotografías de stock ni detalles demográficos decorativos. Cada persona representa un patrón observable de trabajo.

### 5.1 P1 — Contador independiente multi-RUC

**Prioridad:** primaria en v0.

**Contexto:** administra obligaciones recurrentes de varias empresas, recibe documentos por canales fragmentados y concentra preparación, revisión, comunicación y seguimiento.

**Objetivo principal:** completar cada periodo sin omisiones, con claridad sobre lo pendiente y evidencia suficiente para responder ante el cliente o una revisión posterior.

**Necesidades:**

- cambiar de empresa y periodo sin perder contexto;
- saber qué empresas requieren atención primero;
- conciliar SIRE y documentos propios;
- identificar datos faltantes y responsables;
- preparar IGV y cierre sin reconstruir el proceso cada mes;
- reutilizar workflows sin convertirlos en cajas negras;
- demostrar qué recibió, corrigió, aprobó y presentó;
- operar aun cuando sea la única persona disponible para revisar.

**Ansiedades:**

- trabajar accidentalmente en el RUC o periodo equivocado;
- descubrir una diferencia cerca del vencimiento;
- depender de hojas, chats y memoria personal;
- aplicar dos veces una operación;
- no poder reconstruir por qué tomó una decisión;
- que una automatización modifique información sin control.

**Comportamiento de interfaz esperado:** utiliza teclado, trabaja con alta densidad, alterna empresas con frecuencia y necesita conservar una cola global sin mezclar datos entre compañías.

### 5.2 P2 — Preparador o auxiliar contable

**Prioridad:** primaria en v1.

**Objetivo principal:** convertir información incompleta en trabajo listo para revisión.

**Necesidades:**

- tareas y criterios de término claros;
- validación inmediata;
- acceso limitado a empresas asignadas;
- explicación precisa de errores;
- guardar borradores y continuar;
- solicitar información o revisión sin salir del objeto;
- distinguir sugerencia agentic de regla obligatoria.

**Ansiedades:** ser responsabilizado por errores sin contexto, desconocer prioridades, modificar un periodo cerrado o no saber si su trabajo fue aceptado.

### 5.3 P3 — Contador revisor

**Prioridad:** primaria en v1.

**Objetivo principal:** concentrar el juicio profesional en diferencias materiales y riesgos, sin repetir toda la preparación.

**Necesidades:**

- cola de revisiones priorizada;
- antes/después contable;
- materialidad e impacto;
- fuentes, reglas, supuestos y validaciones;
- comentarios y devolución granular;
- detección de aprobación stale;
- evidencia de quién preparó cada cambio.

**Ansiedades:** aprobar por presión sin contexto, revisar información desactualizada o confiar en un porcentaje agentic no calibrado.

### 5.4 P4 — Aprobador o responsable fiscal

**Prioridad:** primaria en v1–v2.

**Objetivo principal:** asumir responsabilidad sobre una acción material con información suficiente y un alcance inequívoco.

**Necesidades:** resumen ejecutivo, monto e impacto, periodo, empresa/RUC, excepciones abiertas, evidencia de revisión, consecuencias y mecanismo de corrección.

**Ansiedades:** aprobar la empresa equivocada, autorizar después de un cambio no revisado o confundir aprobación interna con presentación efectiva.

### 5.5 P5 — Supervisor de estudio

**Prioridad:** secundaria en v1.

**Objetivo principal:** garantizar que ninguna empresa o vencimiento quede sin responsable y que el trabajo se distribuya de forma sostenible.

**Necesidades:**

- vista de portafolio;
- carga por persona;
- excepciones y bloqueos;
- vencimientos próximos;
- aging de revisiones;
- políticas por empresa;
- escalamiento sin inspeccionar cada asiento.

**Ansiedades:** convertirse en cuello de botella, descubrir retrasos demasiado tarde o no poder distinguir volumen de riesgo.

### 5.6 P6 — Dueño o gerente de PyME

**Prioridad:** secundaria en v2.

**Objetivo principal:** entregar información y tomar decisiones de negocio o aprobación sin aprender la interfaz operativa del contador.

**Necesidades:** solicitudes claras, impacto monetario, fecha límite, responsable, estado, documentos pendientes y explicación en lenguaje empresarial.

**No necesita:** configurar reglas fiscales, corregir conciliaciones complejas ni navegar libros completos por defecto.

### 5.7 P7 — Auditor o asesor externo

**Prioridad:** transversal.

**Objetivo principal:** verificar decisiones, fuentes, controles y cambios sin alterar el estado operacional.

**Necesidades:** acceso temporal, solo lectura, filtros, lineage, versiones, manifest de exportación y evidencia de integridad.

**Ansiedades:** recibir un export incompleto, perder relación entre evidencia y decisión o contaminar el audit trail al explorar.

### 5.8 P8 — Administrador organizacional

**Prioridad:** transversal.

**Objetivo principal:** administrar membresías, asignaciones, políticas e integraciones sin adquirir autoridad fiscal implícita.

**Necesidades:** invitaciones, revocación, scopes, roles, historial administrativo y recuperación segura.

**Restricción:** administrar acceso no otorga automáticamente permiso para aprobar, presentar o modificar objetos fiscales.

## 6. Roles operacionales

Los roles operacionales canónicos son:

| Rol | Responsabilidad | Puede combinarse en v0 |
|---|---|---|
| `owner` | Gobierno de la organización y políticas | Sí |
| `admin` | Membresías, asignaciones e integraciones | Sí |
| `accountant` | Preparar y corregir trabajo contable | Sí |
| `reviewer` | Revisar y devolver propuestas | Sí, con disclosure |
| `approver` | Autorizar acciones materiales | Sí, con policy y step-up |
| `viewer` | Consultar información permitida | Sí |
| `auditor` | Examinar evidencia y audit trail sin mutar | Sí |

`auditor` se incorpora como rol explícito porque su acceso temporal y sus necesidades de exportación difieren de un viewer ordinario.

### 6.1 Reglas de combinación

- Un contador independiente puede reunir `owner`, `admin`, `accountant`, `reviewer` y `approver`.
- La UI debe mostrar cuándo una acción constituye autorrevisión o autoaprobación.
- La autoaprobación nunca elimina evidence, audit trail, reautenticación o validadores.
- Una organización puede exigir separación obligatoria por empresa, workflow, monto o acción.
- Un preparador no puede aprobar simplemente porque creó la propuesta.
- Un admin no obtiene permisos fiscales por administrar membresías.
- La revocación o reducción de permisos invalida acciones pendientes que dependían de la autoridad anterior.
- El permiso se reevalúa en el momento de aplicar.

SDD-012 definirá el modelo RBAC/ABAC, condiciones, recursos y políticas exactas.

## 7. Jobs-to-be-Done

### 7.1 Jobs principales

| ID | Job | Frecuencia | Riesgo | Persona dominante |
|---|---|---:|---:|---|
| JTBD-01 | Cuando inicio mi jornada, quiero saber qué empresas y obligaciones requieren atención para priorizar sin revisar cada RUC | Diaria | Alto | P1, P5 |
| JTBD-02 | Cuando recibo documentos, quiero incorporarlos y validar su calidad para saber qué puede procesarse y qué debo solicitar | Diaria | Medio | P1, P2 |
| JTBD-03 | Cuando reviso SIRE, quiero comparar registros y resolver discrepancias con evidencia para preparar una propuesta confiable | Mensual/continua | Alto | P1, P2, P3 |
| JTBD-04 | Cuando aparece una excepción, quiero comprender causa, impacto y siguiente acción para resolverla sin navegar múltiples módulos | Diaria | Alto | P1, P2, P3 |
| JTBD-05 | Cuando preparo IGV, quiero verificar bases, crédito, reparos y diferencias para entregar un cálculo revisable | Mensual | Crítico | P1, P2, P3 |
| JTBD-06 | Cuando reviso una propuesta, quiero ver cambios, materialidad, fuentes y validaciones para aprobar o devolver solo lo necesario | Mensual | Crítico | P3, P4 |
| JTBD-07 | Cuando cierro un periodo, quiero confirmar dependencias y excepciones para bloquearlo sin ocultar trabajo pendiente | Mensual | Crítico | P1, P3, P4 |
| JTBD-08 | Cuando necesito corregir un periodo o declaración, quiero entender el estado anterior y el impacto para rectificar preservando el historial | Excepcional | Crítico | P1, P3, P4 |
| JTBD-09 | Cuando un cliente debe actuar, quiero solicitar exactamente la información o aprobación requerida y rastrear su respuesta | Semanal | Alto | P1, P2, P6 |
| JTBD-10 | Cuando delego trabajo, quiero saber responsable, estado, bloqueo y vencimiento para intervenir antes de que exista retraso | Diaria | Alto | P5 |
| JTBD-11 | Cuando una automatización trabaja en background, quiero conocer qué hizo, con qué autoridad y qué necesita revisión | Diaria | Alto | P1, P3, P5 |
| JTBD-12 | Cuando me auditan, quiero producir un expediente completo y verificable sin reconstruir meses de mensajes y archivos | Excepcional | Crítico | P1, P4, P7 |

### 7.2 Job emocional

> Quiero sentir que tengo control del periodo y que puedo demostrar cada decisión, incluso cuando administro muchas empresas bajo presión.

### 7.3 Job social

> Quiero que clientes, supervisores y auditores perciban mi trabajo como ordenado, profesional y sustentado, no dependiente de memoria o improvisación.

## 8. Cadencia de trabajo

### Diaria

- revisar attention inbox;
- recibir y clasificar información;
- resolver excepciones;
- asignar o responder solicitudes;
- observar jobs y automatizaciones;
- cambiar entre empresas manteniendo aislamiento.

### Semanal

- revisar empresas bloqueadas o sin avance;
- perseguir información faltante;
- balancear carga;
- revisar aging de propuestas;
- comprobar vencimientos próximos.

### Mensual

- conciliar SIRE;
- determinar IGV y otras obligaciones;
- revisar propuestas;
- cerrar periodo;
- preparar presentación y constancias;
- comunicar resultados.

### Excepcional

- reabrir periodo;
- rectificar;
- responder auditoría o fiscalización;
- revocar acceso;
- recuperar job fallido o estado UNKNOWN;
- corregir contaminación o duplicidad detectada.

## 9. Matriz de responsabilidades

Esta matriz describe defaults de producto. Las políticas finales pertenecen a SDD-012.

| Acción | Accountant | Reviewer | Approver | Admin | Viewer | Auditor |
|---|---:|---:|---:|---:|---:|---:|
| Preparar borrador | Sí | Sí | Política | No | No | No |
| Resolver excepción | Sí | Sí | Política | No | No | No |
| Solicitar revisión | Sí | Sí | Sí | No | No | No |
| Revisar/devolver | Política | Sí | Sí | No | No | No |
| Aprobar acción material | No por defecto | Política | Sí | No | No | No |
| Aplicar acción aprobada | Política | Política | Política | No | No | No |
| Cerrar/reabrir periodo | No por defecto | Política | Sí | No | No | No |
| Administrar miembros | No | No | No | Sí | No | No |
| Consultar evidencia | Scope | Scope | Scope | Metadata | Scope | Scope temporal |
| Exportar expediente | Política | Política | Sí | No | No por defecto | Sí |
| Configurar automatización | Política | Política | Política | Integración, no autoridad fiscal | No | No |

`Scope` significa únicamente empresas, periodos y objetos autorizados mediante membresía y política verificadas.

## 10. Implicaciones para la arquitectura de información

### 10.1 Home del contador independiente

Debe priorizar:

1. atención requerida;
2. vencimientos;
3. empresas bloqueadas;
4. trabajo preparado para revisión;
5. actividad agentic pendiente de decisión.

No debe priorizar un score fiscal único ni una cuadrícula de métricas genéricas.

### 10.2 Home del preparador

- Mis tareas.
- Excepciones asignadas.
- Información devuelta por reviewer.
- Empresas y periodos habilitados.
- Trabajo guardado o en proceso.

### 10.3 Home del reviewer/approver

- Cola de revisión por riesgo, monto y vencimiento.
- Propuestas stale o modificadas.
- Bloqueos críticos.
- Acciones que requieren step-up o segunda aprobación.

### 10.4 Home del supervisor

- Portafolio de empresas.
- Estado por periodo.
- Carga y aging.
- Ausencia de responsable.
- Riesgo de vencimiento.

### 10.5 Home del dueño

- Qué debe entregar o aprobar.
- Monto e impacto.
- Fecha límite.
- Estado resumido.
- Comunicación con el contador.

El dueño no recibirá por defecto la misma sidebar ni densidad del contador.

## 11. Personalización y progressive disclosure

Drenyra no creará productos completamente separados por persona. Utilizará:

- un dominio y contratos comunes;
- navegación condicionada por capacidades;
- home y colas adaptadas a responsabilidades;
- progressive disclosure;
- vistas ejecutivas distintas del workspace operacional;
- permisos evaluados en servidor;
- deep links que conservan contexto y verifican acceso.

Ocultar un control no reemplaza autorización. Mostrar un control deshabilitado deberá explicar la condición necesaria cuando hacerlo no revele información sensible.

## 12. Onboarding y activación

### 12.1 Preguntas de onboarding

El onboarding preguntará por hechos operativos, no por preferencias abstractas:

- ¿Trabajas solo o con un equipo?
- ¿Cuántas empresas activas administras?
- ¿Preparas, revisas o apruebas?
- ¿Quién entrega la información?
- ¿Quién autoriza acciones materiales?
- ¿Qué workflow quieres resolver primero?

Las respuestas configuran defaults, no conceden permisos. La membresía y las políticas se verifican por separado.

### 12.2 Momento de activación

Un usuario v0 se considera activado cuando:

1. crea o accede a una organización válida;
2. incorpora una empresa/RUC con contexto verificado;
3. selecciona un periodo;
4. importa o sincroniza una fuente;
5. detecta o confirma al menos una excepción;
6. completa una resolución con evidencia.

Iniciar un chat o visitar el dashboard no constituye activación.

## 13. Requisitos multiempresa

- La empresa activa siempre debe ser visible durante acciones materiales.
- Las colas globales pueden agregar metadata de varias empresas, pero cada apertura reestablece scope explícito.
- No se mostrarán montos agregados entre monedas incompatibles sin normalización declarada.
- El cambio de empresa preserva filtros compatibles, pero descarta selecciones de objetos de la empresa anterior.
- Los drafts se vinculan a empresa y periodo; no migran silenciosamente al cambiar contexto.
- Las acciones masivas cross-company estarán prohibidas inicialmente para mutaciones materiales.
- Los atajos recientes no pueden eludir revocaciones de membresía.
- La búsqueda universal filtra resultados antes de mostrar datos sensibles.

## 14. Requisitos de accesibilidad e inclusión

- No asumir experiencia avanzada en software por ser profesional contable.
- No usar únicamente color para responsabilidad, riesgo o estado.
- Ofrecer terminología fiscal consistente y explicaciones breves bajo demanda.
- Mantener operación completa por teclado para personas que procesan grandes volúmenes.
- Utilizar numerales tabulares y formatos peruanos configurables.
- Evitar copy que atribuya culpa: describir condición, impacto y siguiente acción.
- Diseñar para presión temporal sin utilizar dark patterns de urgencia.

## 15. Investigación y validación

Las personas son hipótesis de diseño hasta ser contrastadas. Se ejecutará una ronda inicial de 18 entrevistas:

| Grupo | Participantes |
|---|---:|
| Contadores independientes con operación multi-RUC | 8 |
| Miembros de estudios de 2–20 personas | 6 |
| Equipos contables internos o PyME con contador externo | 2 |
| Auditores o asesores externos | 2 |

### 15.1 Criterios de reclutamiento

- Ejercer actualmente una responsabilidad contable o fiscal en Perú.
- Participar en al menos un cierre o ciclo tributario mensual.
- Para P1 y P5, gestionar varias empresas o RUC.
- Para reviewer/approver, revisar trabajo preparado por otra persona al menos ocasionalmente.
- Para auditor, haber solicitado o recibido evidencia contable estructurada.

### 15.2 Métodos

1. Entrevistas problem-first de 45 minutos.
2. Cinco sesiones de observación contextual de un workflow real anonimizado.
3. Card sorting con vocabulario y navegación para SDD-002.
4. Pruebas de prototipo sobre attention inbox, context bar, SIRE y evidence inspector.
5. Revisión de hallazgos por frecuencia, riesgo y severidad, no por preferencia estética.

### 15.3 Umbrales de invalidación

La prioridad v0 deberá revisarse si ocurre cualquiera de estas condiciones:

- menos de 6 de 8 contadores independientes reconocen JTBD-01, 03, 04 y 07 como problemas frecuentes;
- menos de 5 de 8 alternan entre varias empresas durante una jornada o ciclo de trabajo;
- la conciliación SIRE no aparece entre los tres workflows de mayor dolor para al menos la mitad de P1 entrevistados;
- más de la mitad necesita colaboración multiusuario para completar el primer valor, haciendo inviable el supuesto single-user de v0;
- los permisos o la evidencia necesarios para resolver el workflow dependen estructuralmente de otro segmento.

Si un umbral se activa, SDD-001 vuelve a PROPOSED y SDD-000 registra el cambio de ICP o secuencia.

## 16. Métricas

### Activación

- Tiempo hasta primera empresa verificada.
- Tiempo hasta primera fuente incorporada.
- Tiempo hasta primera excepción resuelta con evidencia.
- Porcentaje que completa el primer workflow sin asistencia humana externa.

### Uso profesional

- Empresas activas por usuario.
- Cambios de contexto por sesión.
- Excepciones resueltas por periodo.
- Tiempo entre preparación y revisión.
- Aging de aprobaciones y tareas bloqueadas.
- Uso de búsqueda, teclado y comandos.

### Confianza

- Acciones materiales con evidencia completa.
- Autorrevisiones y autoaprobaciones explícitamente registradas.
- Intentos rechazados por scope o permisos.
- Propuestas stale detectadas antes de aplicar.
- Correcciones y reversiones posteriores.

Las métricas no se utilizarán para clasificar el rendimiento laboral individual sin una política separada aprobada.

## 17. Dependencias y consumidores

### Depende de

- SDD-000 — visión, invariantes y modelo agentic.
- Contratos vigentes de Tenant Isolation y membresía verificada.

### Informa directamente

- SDD-002 — vocabulario y arquitectura de información.
- SDD-004 — workflows y línea base.
- SDD-010 — contexto fiscal.
- SDD-012 — roles, permisos y segregación.
- SDD-037 — shell y navegación.
- SDD-038 — fiscal context bar.
- SDD-050 — attention inbox.
- SDD-055 — casos, tareas y colaboración.
- SDD-072 — SIRE.
- SDD-075 — cierre mensual.

## 18. Non-goals

Este SDD no define:

- permisos técnicos finales;
- precios o packaging comercial;
- organigramas legales de estudios contables;
- thresholds de materialidad;
- navegación visual definitiva;
- regulación laboral;
- country packs fuera de Perú;
- personalidades conversacionales del agente;
- scoring de productividad de empleados.

Estas decisiones pertenecen a SDD hijos o programas separados.

## 19. Criterios de aceptación

SDD-001 puede pasar a APPROVED cuando:

- Se acepta al contador independiente multi-RUC como persona primaria de v0.
- Se acepta la expansión v0 → v1 → v2 → v3.
- Se acepta la separación entre segmento, persona, rol y permiso.
- Se aceptan los ocho arquetipos sin convertirlos en identidades rígidas.
- Se aceptan los roles `owner`, `admin`, `accountant`, `reviewer`, `approver`, `viewer` y `auditor`.
- Se acepta permitir acumulación de roles en v0 con disclosure, audit trail y policy.
- Se aceptan los doce JTBD principales.
- Se acepta que multiempresa sea capacidad nuclear.
- Se aceptan la investigación de 18 participantes y los umbrales de invalidación.
- No quedan contradicciones con SDD-000 o los invariantes de tenant isolation.

## 20. Próximo paso

Después de aprobar SDD-001 se redactará **SDD-002 — Fiscal Domain Language and Information Architecture**. Utilizará los JTBD y responsabilidades aquí definidos para construir la taxonomía canónica del producto, evitando mezclar outcomes, impuestos, sistemas externos y representaciones visuales.

## 21. Continuidad y evolución

Drenyra deberá mantener coherencia entre versiones sin romper los principios definidos en este SDD. Cada iteración deberá:

- preservar la separación entre segmento, persona, rol y permiso;
- mantener la trazabilidad completa de acciones y decisiones;
- evitar shortcuts que comprometan evidencia o control;
- validar que nuevas funcionalidades no desplacen el foco del profesional contable en v0;
- asegurar que la expansión a equipos no degrade la experiencia single-user.

Las decisiones de evolución deberán documentarse como cambios incrementales en SDD hijos o versiones posteriores de este documento.

## 22. Riesgos identificados

- **Sobrecarga de interfaz:** intentar cubrir múltiples personas en una sola vista puede generar complejidad innecesaria.
- **Confusión de autoridad:** permitir acumulación de roles sin suficiente claridad puede inducir errores de responsabilidad.
- **Dependencia de automatización:** confiar excesivamente en procesos agentic sin visibilidad puede erosionar la confianza.
- **Escalabilidad multiempresa:** manejar múltiples RUC sin degradar rendimiento o claridad es crítico.
- **Adopción inicial:** si el onboarding no refleja la realidad operativa, la activación puede fallar.

Cada riesgo se mitigará mediante diseño iterativo, validación continua y monitoreo de métricas.

## 23. Gobernanza del documento

- Este SDD es propiedad del equipo de producto.
- Cualquier cambio requiere revisión cruzada con SDD-000 y SDD-012.
- Las versiones registran cambios significativos en alcance, personas o JTBD.
- Las decisiones rechazadas se documentan para evitar regresiones conceptuales.

## 24. Glosario mínimo

- **RUC:** Registro Único de Contribuyentes en Perú.
- **SIRE:** Sistema Integrado de Registros Electrónicos de SUNAT.
- **Scope:** conjunto de empresas, periodos y objetos autorizados para una identidad.
- **Evidence:** conjunto verificable de documentos, fuentes y decisiones asociadas a una acción.
- **Agentic:** comportamiento automatizado que ejecuta tareas bajo reglas y supervisión.

## 25. Cierre

Este documento establece la base conceptual para diseñar Drenyra como una plataforma centrada en el trabajo real del profesional contable, con capacidad de escalar hacia colaboración estructurada sin perder control, evidencia ni claridad de responsabilidades.
