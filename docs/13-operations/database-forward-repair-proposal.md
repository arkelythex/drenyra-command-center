# Propuesta de diseño para la reparación hacia adelante de la base de datos

**Última actualización:** 2026-09-01

> **Decisión:** este documento propone cómo diseñar y verificar una reparación exclusivamente hacia adelante. No aprueba ejecutar SQL, migraciones, scripts ni cambios sobre bases persistentes. La actualización persistente permanece bloqueada hasta completar todas las fases y obtener aprobación explícita de un mantenedor.

## Alcance y resultado esperado

El objetivo de un futuro trabajo aprobado será producir una reparación idempotente y auditable para una base existente, sin reinterpretar ni reescribir el historial de migraciones. Esta propuesta define la evidencia, las clasificaciones y las puertas de decisión necesarias; no contiene SQL ejecutable ni instrucciones de ejecución.

El resultado esperado es un paquete revisable que permita a los mantenedores decidir si la reparación es segura. La existencia de ese paquete no habilita por sí sola una actualización persistente.

## Invariantes obligatorios

La futura unidad de trabajo deberá preservar todos estos límites:

- No modificar ninguna migración histórica.
- No editar `packages/infrastructure/drizzle/meta/_journal.json`.
- No crear aliases, copias o wrappers que oculten discrepancias del inventario.
- No reproducir automáticamente las migraciones `0019`–`0033`.
- No mutar `drenyra-db` ni su volumen persistente durante el diseño o la verificación.
- No convertir una coincidencia de nombre en prueba de equivalencia estructural o semántica.
- No mezclar esta reparación con cambios fiscales, de aislamiento por RUC o de comandos operativos.

## Evidencia actual de deriva

El guard de inventario termina antes de establecer una conexión con la base de datos. Por lo tanto, la discrepancia se detecta sin mutar ni inspeccionar una instancia persistente.

| Evidencia | Estado observado |
| --- | --- |
| Archivos presentes en el repositorio pero ausentes del journal | `0001_cool_lady_ursula.sql` y `0007_loose_squirrel_girl.sql` |
| Archivos numéricos no registrados en el journal | Incluyen `0001_add_ai_worker_queues.sql`, `0007_add_ai_control_plane_tables.sql` y `0019`–`0033` |
| Momento de salida del guard | Antes de cualquier conexión a la base de datos |
| Consecuencia | La ruta de actualización persistente continúa bloqueada |

Esta evidencia identifica una deriva de inventario, pero no demuestra qué objetos están ausentes, ya aplicados de forma equivalente o en conflicto dentro de una base existente. Esa determinación corresponde a las fases siguientes.

## Fases de una futura unidad de trabajo aprobada

Cada fase produce evidencia para la siguiente. Ninguna fase autoriza trabajar sobre `drenyra-db` ni sobre un volumen persistente.

### Fase 1 — Captura no mutante del inventario

**Objetivo:** establecer una línea base reproducible del repositorio y de una base representativa autorizada, sin modificar objetos ni metadatos.

**Cobertura mínima:**

- Inventario de archivos de migración y su relación con el journal.
- Objetos existentes en la base: esquemas, tablas, tipos, constraints, índices, funciones, políticas y triggers.
- Metadatos de Drizzle presentes en la base y en el repositorio.
- Estado y versión de la extensión vectorial requerida.
- Políticas RLS activas, sus tablas objetivo y sus condiciones.

**Artefactos de salida:**

- Manifiesto versionado del inventario del repositorio, con rutas y hashes o identificadores reproducibles.
- Informe de objetos y metadatos de la base representativa, sin datos de negocio ni secretos.
- Matriz de extensión vectorial y RLS con estado observado y fuente de evidencia.
- Registro de procedencia que identifique la copia desechable inspeccionada y confirme que no fue `drenyra-db`.

### Fase 2 — Auditoría de duplicados y equivalencias

**Objetivo:** comparar la intención de los archivos no registrados con el estado observado, sin ejecutar esos archivos ni asumir equivalencia por nombre.

**Cobertura mínima:** tablas, tipos y enums, constraints, índices, funciones, políticas y triggers. Cada elemento deberá clasificarse como:

- **Ausente:** no existe un objeto equivalente.
- **Ya aplicado:** existe una equivalencia estructural y semántica demostrada.
- **En conflicto:** existe el nombre o una estructura relacionada, pero difiere en una propiedad relevante.
- **Inseguro:** la evidencia es insuficiente o el efecto depende de datos, orden o contexto no demostrado.

**Artefactos de salida:**

- Matriz objeto por objeto con clasificación, evidencia y criterio de equivalencia.
- Registro de conflictos e incertidumbres con impacto y responsable de resolución.
- Mapa de dependencias y orden lógico, sin convertirlo en una secuencia ejecutable.
- Dictamen de continuidad: apto para diseño, requiere investigación adicional o bloqueado.

### Fase 3 — Auditoría de tenant/RUC y trazabilidad

**Objetivo:** identificar los objetos contables y fiscales cuya reparación podría afectar aislamiento por RUC, RLS o trazabilidad append-only.

**Cobertura mínima:**

- Tablas y vistas que contienen o derivan información por RUC.
- Políticas RLS y límites de organización aplicables a esas tablas.
- Operaciones que requieren validación del RUC contra el contexto de sesión.
- Tablas contables, libros y eventos que deben preservar historial append-only.
- Mutaciones que deban registrar RUC, periodo, fecha y hora, actor y motivo.
- Operaciones excepcionales entre RUC que requieran autorización explícita y auditoría.

**Artefactos de salida:**

- Matriz de superficies tenant/RUC con política esperada, evidencia actual y riesgo.
- Plan de pruebas negativas de acceso entre RUC, incluidos intentos de lectura y escritura denegados.
- Matriz de trazabilidad contable con evidencia requerida de append-only.
- Lista de casos SIRE y de conciliación afectados, sin modificar lógica fiscal.

### Fase 4 — Diseño de SQL idempotente hacia adelante

**Objetivo:** diseñar una reparación nueva y explícita que actúe según el estado clasificado, sin reproducir archivos históricos.

**Requisitos de diseño:**

- No ejecutar ni concatenar las migraciones no registradas como mecanismo de reparación.
- No modificar migraciones históricas ni el journal.
- Usar guardas `IF NOT EXISTS` únicamente cuando prueben la equivalencia necesaria; en los demás casos, usar verificaciones explícitas de catálogos.
- Rechazar conflictos o estados inseguros en lugar de sobrescribirlos.
- Declarar límites de transacción por grupo de objetos y justificar cualquier operación no transaccional.
- Definir el comportamiento ante fallos parciales, incluidos abortos, evidencia conservada y recuperación segura.
- Mantener separadas las precondiciones, los cambios propuestos y las verificaciones posteriores.

**Artefactos de salida:**

- Especificación revisable de precondiciones, guardas y efectos esperados por objeto.
- Borrador de SQL de reparación en una futura superficie expresamente autorizada, sujeto a revisión independiente; este documento no lo incluye.
- Mapa de transacciones y puntos de fallo con comportamiento esperado.
- Plan de recuperación hacia adelante que no dependa de editar historial ni journal.
- Matriz de trazabilidad entre cada hallazgo, su decisión y su verificación.

### Fase 5 — Verificación desechable

**Objetivo:** demostrar el comportamiento del diseño solamente sobre una copia o base representativa y desechable.

**Condiciones:**

- La base debe ser una copia autorizada, sanitizada cuando corresponda y eliminable; nunca `drenyra-db` ni su volumen persistente.
- Debe representar tanto los objetos existentes como las discrepancias relevantes identificadas.
- La reparación candidata se aplica únicamente en ese entorno desechable.
- Se vuelven a ejecutar los guards de inventario y esquema aplicables.
- Se ejecutan los controles SIRE pertinentes y las pruebas negativas entre RUC.
- Se verifica la segunda aplicación o evaluación idempotente según el diseño, sin aceptar cambios adicionales inesperados.

**Artefactos de salida:**

- Registro de construcción y procedencia del entorno desechable.
- Informe antes/después de objetos, metadatos, extensión vectorial y políticas RLS.
- Resultados de guards, controles SIRE, pruebas entre RUC y evidencia append-only.
- Informe de idempotencia y de comportamiento ante fallos controlados.
- Registro de eliminación del entorno desechable o evidencia equivalente de que no es persistente.

### Fase 6 — Puerta de aprobación del mantenedor

**Objetivo:** decidir explícitamente si existe evidencia suficiente para planificar una ejecución persistente separada.

La revisión deberá confirmar invariantes, clasificaciones, riesgos, resultados desechables y procedimientos de recuperación. La aprobación debe identificar la versión exacta de los artefactos revisados y el entorno persistente candidato.

**Artefactos de salida:**

- Checklist de aceptación firmado o aprobado por el mantenedor responsable.
- Registro de riesgos residuales y condiciones operativas.
- Decisión explícita: aprobado para planificar ejecución, requiere cambios o rechazado.
- Si se aprueba, un plan de ejecución persistente separado, con ventana, responsables, backup, observabilidad y criterios de detención. Ese plan queda fuera de esta propuesta.

## Criterios de aceptación del diseño

La propuesta futura estará lista para la puerta de aprobación solo si:

- [ ] El inventario del repositorio, el journal y la base representativa es reproducible y tiene procedencia verificable.
- [ ] Cada tabla, tipo o enum, constraint, índice, función, política y trigger relevante está clasificado con evidencia.
- [ ] Ninguna decisión depende de editar migraciones históricas, `_journal.json` o aliases.
- [ ] `0019`–`0033` no se reproducen automáticamente ni se tratan como una secuencia segura por defecto.
- [ ] Los conflictos y estados inseguros fallan de forma cerrada, sin sobrescritura implícita.
- [ ] El diseño define guardas de catálogo, transacciones, comportamiento ante fallos y recuperación hacia adelante.
- [ ] Las superficies tenant/RUC tienen pruebas negativas de acceso cruzado y evidencia de límites a nivel de base de datos.
- [ ] Las tablas contables afectadas conservan evidencia append-only y trazabilidad de RUC, periodo, fecha y hora, actor y motivo.
- [ ] Los guards aplicables y los controles SIRE pertinentes aprueban en un entorno representativo y desechable.
- [ ] La verificación demuestra idempotencia sin cambios adicionales inesperados.
- [ ] Existe aprobación explícita del mantenedor sobre artefactos identificados de forma exacta.

## Condiciones que mantienen el trabajo bloqueado

La reparación o una ejecución persistente no podrá avanzar si ocurre cualquiera de estas condiciones:

- Falta evidencia para clasificar un objeto, una dependencia o una política.
- Un objeto resulta conflictivo o inseguro y no existe una resolución revisada.
- La captura requiere conectarse o mutar `drenyra-db` o su volumen persistente.
- Se propone editar una migración histórica, `_journal.json` o introducir aliases.
- Se propone reproducir automáticamente `0019`–`0033`.
- Una guarda `IF NOT EXISTS` oculta diferencias estructurales o semánticas.
- No están definidos los límites de transacción o el comportamiento ante fallos parciales.
- Fallan los guards aplicables, los controles SIRE, las pruebas negativas entre RUC o la evidencia append-only.
- La segunda evaluación idempotente produce cambios inesperados.
- El entorno de verificación no es desechable, representativo o trazable.
- Falta aprobación explícita del mantenedor o la aprobación no identifica los artefactos exactos revisados.

## Separación de comandos operativos

Los futuros comandos `ops:db:*` son una superficie operativa separada. No forman parte del SQL de reparación ni quedan aprobados por este diseño. Su implementación y uso deben cumplir [Contratos de comandos operativos de base de datos](./db-ops-command-contracts.md), incluidos preflight, confirmación, evidencia, aislamiento por RUC y controles de seguridad correspondientes.

## Fuera de alcance

- Incluir SQL ejecutable o copiar el contenido de migraciones en esta propuesta.
- Implementar scripts, comandos, workflows, migraciones o cambios de infraestructura.
- Cambiar lógica fiscal, SIRE, tenant/RUC, RLS o trazabilidad contable.
- Diseñar backup, restore o respuesta a incidentes fuera de la evidencia requerida para una futura ejecución.
- Autorizar una actualización persistente por el solo hecho de completar documentación o pruebas desechables.

## Próxima decisión

Un mantenedor debe revisar esta propuesta antes de autorizar la creación de la futura unidad de trabajo. Hasta entonces, se mantiene bloqueada toda actualización persistente y este documento funciona únicamente como artefacto de planificación.
