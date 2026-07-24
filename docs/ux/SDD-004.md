# SDD-004 — Critical Workflow Baseline

**Estado:** PROPOSED  
**Depende de:** SDD-001, SDD-002  
**Informa:** todos los vertical slices y SDD-093

## Decisión

El programa medirá el estado actual antes de declarar mejoras. La línea base cubrirá seis workflows: **ingesta documental, conciliación SIRE, resolución de excepciones, determinación de IGV, cierre mensual y preparación de evidencia para auditoría**.

## Métricas por workflow

- tiempo total y tiempo activo;
- número de pantallas y cambios de contexto;
- fuentes externas consultadas;
- pasos manuales repetidos;
- errores, retrabajo y bloqueos;
- handoffs entre personas;
- datos faltantes;
- acciones no reversibles;
- evidencia producida;
- nivel de confianza declarado por el participante.

## Método

Se observarán al menos cinco ejecuciones por workflow, distribuidas entre contadores independientes y estudios pequeños. Se anonimizarán clientes, RUC, montos y credenciales. La sesión registrará eventos y tiempos, no contenido fiscal sensible.

Cada workflow se descompone en: trigger, preparación, decisión, acción, confirmación y evidencia. El tiempo de espera del cliente o SUNAT se mide por separado del tiempo de interacción.

## Métricas de éxito del rediseño

- reducción mínima de 30% en tiempo mediano activo;
- reducción mínima de 40% en cambios de pantalla para SIRE y cierre;
- 100% de acciones materiales con contexto y evidencia;
- task success de al menos 95% en el camino principal tras refinamiento;
- cero errores cross-company o cross-period en pruebas moderadas;
- disminución de retrabajo sin aumentar aprobación ciega.

No se optimizará velocidad sacrificando controles. Si una mejora reduce tiempo pero aumenta decisiones sin evidencia, falla.

## Criterios de aceptación

- Existe baseline reproducible por workflow y rol.
- Tiempo activo y tiempo de espera están separados.
- Los datasets de prueba representan multiempresa y periodos cerrados/abiertos.
- SDD-093 puede instrumentar las mismas métricas en producción.
- Los objetivos de cada vertical slice se expresan contra esta línea base.
