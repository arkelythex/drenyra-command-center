# SDD-037 — Application Shell and Navigation

**Estado:** PROPOSED  
**Depende de:** SDD-001, SDD-002, SDD-030–036  
**Informa:** todas las rutas

## Decisión

El shell tendrá sidebar global colapsable, context bar persistente, canvas y capas contextuales. La sidebar representará las áreas de SDD-002: Atención, Operación, Conciliación, Cumplimiento, Cierre y Evidencia; Administración aparecerá separada según capacidad.

## Sidebar

- identidad de Drenyra y organización;
- navegación por áreas;
- recientes/favoritos con scope visible;
- indicador no intrusivo de background activity;
- footer de usuario y configuración;
- collapse que conserva tooltips accesibles.

## Reglas

1. No incluir agentes, chats o swarms como navegación primaria.
2. Contexto fiscal no se duplica en cada header.
3. Page title expresa objeto/outcome.
4. Back/forward restaura ruta, filtros y selección cuando siga autorizada.
5. Responsive convierte sidebar en drawer; no elimina acceso.
6. Role-aware navigation oculta irrelevancia, pero autorización sigue server-side.

## Estados

Shell carga antes del feature y presenta offline/degraded banners. Un error de ruta no destruye sidebar/context. Cambiar organización exige resolver drafts y limpia caches scopeadas.

## Criterios de aceptación

- Doce JTBD encuentran destino estable.
- Sidebar no supera dos niveles persistentes.
- Keyboard, deep links y browser history funcionan.
- Ninguna ruta crea un shell paralelo.
- Pruebas cubren rol, viewport y context changes.
