# SDD-036 — Accessibility and Keyboard Navigation

**Estado:** PROPOSED  
**Depende de:** SDD-001, SDD-005  
**Aplica a:** todo frontend

## Decisión

Drenyra apuntará a WCAG 2.2 AA y definirá teclado como modo de primera clase para trabajo contable de volumen. Accesibilidad es gate de release, no polish posterior.

## Requisitos

- landmarks y headings coherentes;
- skip links;
- focus visible y restaurado al cerrar overlays;
- orden de tab estable;
- shortcuts descubribles y remapeables cuando colisionen;
- mínimo 44×44 CSS px para touch targets críticos o alternativa equivalente;
- zoom 200% y reflow 400% en flujos compatibles;
- reduced motion, high contrast y screen reader labels;
- error identification no basada solo en color;
- charts con tabla/resumen alternativo.

## Keyboard model

Sidebar, context bar, grid, inspector, command palette y dialogs publican bindings. `Esc` cierra la capa superior sin perder drafts; shortcuts destructivos requieren confirmación. Scope/context changes no ocurren con una tecla accidental no modificada.

## Pruebas

Automated axe/lint, component tests de focus, E2E keyboard-only y revisión manual con al menos NVDA/Firefox y VoiceOver/Safari en releases mayores.

## Criterios de aceptación

- Cero issues críticos/serios automatizados en caminos principales.
- SIRE y cierre se completan sin mouse.
- Focus no se pierde durante async updates.
- Status/agent activity tiene announcements no intrusivos.
- Excepciones documentadas incluyen owner y fecha de expiración.
