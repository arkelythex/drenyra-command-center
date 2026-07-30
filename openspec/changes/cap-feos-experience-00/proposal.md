# CAP-FEOS-EXPERIENCE-00: Ghostty-Inspired Financial Interaction Environment

## Solicitud

### Problema

Drenyra tiene el núcleo operacional completo (workspace domain, state authority, event projections, layout canónico, command bus) pero carece de una **capa de interacción profesional**. La experiencia actual usa un layout chat-céntrico sin la velocidad, precisión y semántica financiera que un contador necesita.

### Objetivo

Construir un Financial Application Shell que aplique los principios de Ghostty — instantaneidad, composición nativa, teclado poderoso, mouse completo, seguridad visible — al dominio financiero.

### Principio rector
>
> La aplicación debe sentirse como una herramienta local, aunque los datos sean remotos. Cada división tiene un propósito financiero. Ninguna función esencial depende de conocer atajos.

### SDDs

| # | SDD | Descripción |
|---|-----|-------------|
| 031 | Financial Application Shell | Shell 3 paneles, top bar, sidebar, status bar |
| 032 | Pane, Tab and Focus Interaction Model | Paneles redimensionables, tabs semánticos, foco |
| 033 | Universal Command Palette | ⌘K: buscar, navegar y ejecutar comandos |
| 034 | Keyboard, Mouse and Accessibility Model | Shortcuts, foco determinista, a11y |
| 035 | Density, Theme and Financial Typography | Temas, densidad, tipografía financiera |
| 036 | Perceived Performance and Rendering Budgets | Presupuestos de render, streaming, skeleton states |
| 037 | Platform-Native Desktop Capability Bridge | Tauri adapter, capabilities granulares |
| 038 | Secure and Risk-Aware Interaction States | R0-R3 visual, modo seguro, modo auditoría |

### Acceptance Criteria

1. Shell responde visualmente en <100ms
2. Los 5 templates layout (portfolio, close, SIRE, reconciliation, evidence) renderizan correctamente
3. ⌘K abre en <100ms y permite buscar/navegar/ejecutar
4. Sidebar muestra Attention rollup en vivo
5. Shortcuts R2/R3 nunca ejecutan sin revisión
6. Estado de riesgo visible en la interfaz
7. Layout se restaura en <300ms
8. Zero configuración inicial: primer open muestra template útil

### Anti-patrones prohibidos

- Chat como navegación principal
- Terminal negra / clon visual de Codex
- Cards para absolutamente todo
- Verde para "confianza alta de IA"
- Animaciones que retrasen operación
- Ocultar scope de compañía/periodo
- Persistir JSON interno de biblioteca visual

### Dependencias

- packages/workspace-layout (layout canónico, templates, migrations)
- packages/workspace-contracts (command schemas)
- packages/workspace-control (attach/detach/command bus)
- React 19, TanStack Router, Tailwind 4, Radix primitives
- react-resizable-panels (a instalar)
