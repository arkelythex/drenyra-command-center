# SDD-040 — Command Palette and Universal Search

**Estado:** PROPOSED  
**Depende de:** SDD-002, SDD-010, SDD-012, SDD-037  
**Informa:** productivity y navegación

## Decisión

Command palette servirá para navegar, buscar objetos y ejecutar acciones contextuales permitidas. No reemplazará la IA, sidebar ni formularios.

## Tipos de resultado

- áreas/rutas;
- empresas y periodos autorizados;
- documentos, casos, obligaciones y evidencias;
- comandos sin side effect;
- acciones mutables que abren el workflow/confirmación correspondiente.

## Seguridad

Search filtra server-side por scope antes de devolver título/snippet. Resultados recientes se eliminan al revocar acceso. No se indexan secrets. Una acción material desde palette solo abre preparación o confirmación; no elude review/approval.

## UX

`Cmd/Ctrl+K`, búsqueda tolerante, grupos, shortcuts y contexto visible. Comandos utilizan verbos canónicos. Empty state propone navegación válida; errores no revelan resultados ocultos.

## Performance

Debounce/cancel, resultados iniciales en menos de 300 ms p95 dentro de infraestructura objetivo para queries comunes y fallback progresivo. Índices y ranking se instrumentan sin almacenar queries sensibles completas por defecto.

## Criterios de aceptación

- Navega a los doce JTBD y objetos principales.
- Cero resultados cross-tenant en tests adversariales.
- Keyboard completo y focus restoration.
- Commands respetan estado del periodo y permisos.
- Telemetría mide éxito sin capturar datos fiscales innecesarios.
