# SDD-057 — Notifications and Deadline Management

**Estado:** PROPOSED  
**Depende de:** SDD-050, 055, 056  
**Informa:** inbox, email/push futuros

## Decisión

Notificación comunica cambio; attention item representa trabajo. No se enviará una notificación por cada evento. El sistema agrupa por caso/objeto, respeta quiet hours y escala según deadline, riesgo y responsabilidad.

## Tipos

- action required;
- deadline approaching;
- review/approval requested;
- blocking failure/unknown;
- assignment/mention;
- informational completion.

## Reglas

1. Delivery es at-least-once con dedup visible.
2. Leer notification no resuelve attention item.
3. Snooze tiene fecha y límites para critical items.
4. Deadline conserva timezone, fuente y version.
5. Links validan membership al abrir.
6. Mensajes externos minimizan datos sensibles.
7. El usuario configura canal/frecuencia dentro de límites organizacionales.

## UX

Centro de notificaciones con grupos, unread state y acciones seguras. Toasts solo para feedback inmediato de la sesión, no para información durable. Critical banners aparecen únicamente ante riesgo que afecta el trabajo actual.

## Criterios de aceptación

- Cero cascadas duplicadas por retries.
- Deadlines usan America/Lima inicialmente y muestran timezone.
- Revoked users dejan de recibir contenido.
- Métricas miden action completion, no solo opens.
- Fatigue review forma parte del rollout.
