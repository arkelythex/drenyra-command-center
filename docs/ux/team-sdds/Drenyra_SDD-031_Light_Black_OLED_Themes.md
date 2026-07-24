# SDD-031 — Light and Black OLED Themes

**Estado:** PROPOSED  
**Depende de:** SDD-030, SDD-036  
**Informa:** SDD-092

## Decisión

Drenyra ofrecerá Light y Black OLED con equivalencia funcional. Light usará blanco cálido casi neutral; OLED reservará negro profundo para canvas/shell y carbón distinguible para superficies. Ember/copper será acento de marca, no color de riesgo.

## Capas

- `canvas`: fondo global.
- `surface-1`: contenido principal.
- `surface-2`: panel/inspector.
- `surface-3`: elevated/overlay.
- `border`: separación visible sin depender de shadow.

## Reglas

1. Texto largo no usa blanco puro sobre negro puro cuando produzca halation.
2. Estados conservan significado y contraste en ambos themes.
3. No se utilizan gradientes o glass detrás de tablas/formularios.
4. Overlays pueden usar blur si existe fallback opaco y performance aceptable.
5. Charts se validan para daltonismo y grayscale.
6. System preference se respeta, pero la elección del usuario persiste.

## Verificación

Matrices de contraste cubren default, hover, active, disabled, selected, focus y status. Se verifican LCD/OLED, brillo bajo y high-contrast mode.

## Criterios de aceptación

- WCAG AA para texto/controles y focus claramente perceptible.
- Ningún estado depende de un único color.
- Data grids conservan separación sin banding excesivo.
- Cambio de theme no produce layout shift.
- Capturas golden cubren ambas apariencias.
