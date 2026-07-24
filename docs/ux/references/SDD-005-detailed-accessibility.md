---
status: reference
normative: false
consumed_by: SDD-036
---

---
title: "SDD-005 — Estrategia de Accesibilidad Fiscal"
description: "WCAG 2.2 AA+, lectores de pantalla, contraste, y navegación por teclado para sistemas fiscales"
version: "1.0"
status: "draft"
priority: "P0 — Fundacional"
wave: "1 — Program & Discovery"
depends_on:
  - SDD-001 (Personas y roles — incluye perfiles con discapacidad)
  - SDD-002 (Contratos de confianza — progressive disclosure, evidencia)
  - SDD-003 (Arquitectura de Información — taxonomía y navegación)
  - SDD-004 (Telemetría — medición de accesibilidad)
---

**Última actualización**: 2026-07-14
**Content type**: Specification
**Status**: Draft
**Priority**: P0 — Fundacional

---

## 1. Abstract

Drenyra maneja información fiscal crítica. Un contador con discapacidad visual no puede permitirse "esperar a que alguien le lea la pantalla". Un contador con movilidad reducida no puede depender del mouse. Un contador mayor (y en Perú, muchos contadores son mayores de 50) no puede luchar con contraste bajo o tipografía pequeña.

La accesibilidad en Drenyra no es un checklist de compliance. Es un requisito fiscal: si un usuario no puede operar el sistema de forma independiente, el sistema falla en su propósito fundamental.

Este SDD define la estrategia de accesibilidad (WCAG 2.2 AA+), con énfasis en los desafíos únicos de datos fiscales: tablas complejas, jerarquías anidadas, navegación multi-RUC, y estados de confianza (conforme/warning/violation/recovery de SDD-002).

## 2. North star

> Un contador con cualquier discapacidad opera Drenyra con la misma velocidad, precisión y confianza que uno sin discapacidad.

Si un usuario no puede *detectar, entender, resolver y probar* un problema fiscal (north star del programa) usando solo teclado y lector de pantalla, la accesibilidad no está resuelta.

## 3. Problem statement

1. **Tablas fiscales complejas**: Los comprobantes, declaraciones, y reportes son tablas densas con datos anidados (cabecera + detalle + tributos). Los lectores de pantalla no manejan bien tablas complejas sin marked-up semántico.
2. **Estados de confianza multi-sensorial**: SDD-002 define 4 estados (conforme/warning/violation/recovery). Si la única diferenciación es color, un usuario con daltonismo no los distingue.
3. **Jerarquías de navegación**: Multi-RUC, multi-periodo, multi-entity. La navegación por teclado debe ser predecible y no abrumadora.
4. **Progressive disclosure vs screen readers**: Ocultar contenido por complejidad (SDD-002) puede hacer que lectores de pantalla no lo descubran.
5. **Gráficos y visualizaciones**: Los dashboards fiscales usan gráficos. Sin alternativas textuales, son inaccesibles.
6. **Rango etario de usuarios**: Muchos contadores peruanos son >50 años. Presbicia, fatiga visual, y menor velocidad de procesamiento son reales.
7. **Sin precedentes**: No hay sistemas fiscales peruanos accesibles como referencia. Drenyra define el estándar.

## 4. Research context

### 4.1 Vínculo con SDD-001 (Personas)

Del SDD-001, todas las personas se benefician de accesibilidad, pero algunas tienen necesidades específicas:

| Perfil | Necesidad de accesibilidad | Prioridad |
|--------|---------------------------|-----------|
| Contador independiente >55 años | Contraste alto, tipografía grande, tiempo de respuesta generoso | Alta |
| Contador con discapacidad visual | Lector de pantalla + teclado completo | Alta |
| Contador con movilidad reducida | Keyboard-first, tabulación lógica, sin drag & drop obligatorio | Alta |
| Supervisor que revisa en múltiples dispositivos | Responsive a11y, enfoque visible en touch | Media |
| Auditor externo (uso esporádico) | Onboarding accesible, recuperación rápida de contexto | Media |

### 4.2 Vínculo con SDD-002 (Contratos de confianza)

Los 4 estados de confianza requieren representación no-visual:

| Estado | Color | Icono | Texto alternativo | Anuncio screen reader |
|--------|-------|-------|-------------------|----------------------|
| Conforme | Verde | ✓ | "Verificado — conforme" | "Estado conforme. Todo en orden." |
| Warning | Ámbar | ⚠ | "Advertencia — requiere atención" | "Advertencia. Revisar antes de continuar." |
| Violation | Rojo | ✗ | "Violación — acción requerida" | "Alerta. Violación fiscal detectada. Acción requerida." |
| Recovery | Azul | ↺ | "Recuperación — en proceso" | "Recuperación en curso. El sistema está revirtiendo la acción." |

**Regla**: Ningún estado se comunica SOLO con color. Siempre icono + texto + anuncio ARIA.

### 4.3 Vínculo con SDD-003 (Arquitectura de Información)

La navegación definida en SDD-003 (Fiscal/Operational/Exploratory) debe ser operable por teclado:

- Skip links al inicio de cada modo de navegación
- Landmarks ARIA por zona (banner, navigation, main, complementary, contentinfo)
- Tabulación predecible (no saltos entre modos)
- Atajos de teclado documentados y re-mapeables

## 5. Invariantes afectados

1. **WCAG 2.2 AA+**: Este SDD define cómo se implementa. No negociable.
2. **Keyboard-first**: Toda acción debe ser operable por teclado. Mouse es opcional.
3. **Progressive disclosure**: La revelación progresiva no debe ocultar contenido de lectores de pantalla.
4. **Consistencia perceptual**: Patrones de accesibilidad consistentes en toda la plataforma.
5. **Performance fiscal**: ARIA y live regions no deben degradar rendimiento de tablas virtualizadas.
6. **Privacidad**: Los lectores de pantalla en espacios públicos no deben anunciar datos fiscales sensibles sin autorización.

## 6. Principios de accesibilidad fiscal

1. **Semántica primero**: Usar elementos HTML nativos (<table>, <nav>, <button>) antes que divs con ARIA. ARIA solo cuando HTML nativo no cubre el caso.
2. **Sin dependencia sensorial única**: Ninguna información se comunica solo con color, solo con sonido, o solo con icono.
3. **Tabulación predecible**: El orden de tabulación sigue el orden visual. Sin saltos. Sin trampas de teclado.
4. **Enfoque siempre visible**: El focus ring nunca se oculta. Contraste mínimo 3:1 contra el fondo.
5. **Anuncios contextuales**: Los cambios de estado (acción ejecutada, error, advertencia) se anuncian con ARIA live regions, no con alerts que interrumpen.
6. **Rata de usuario**: El usuario controla la velocidad. Sin animaciones automáticas, sin auto-advance, sin timeouts no configurables.
7. **Compatibilidad con AT**: Probado con NVDA, JAWS, VoiceOver, y TalkBack. No asumir que un lector de pantalla = todos.
8. **Print a11y**: Los formatos de impresión/PDF deben ser accesibles (estructura de marcado, no imágenes de tabla).

## 7. Requerimientos por nivel de WCAG 2.2

### 7.1 Nivel A (obligatorio — 100% cumplimiento)

| Criterio | Afecta en Drenyra |
|----------|-------------------|
| 1.1.1 Non-text Content | Iconos de estado fiscal, gráficos, logos |
| 2.1.1 Keyboard | Toda acción fiscal operable por teclado |
| 2.1.2 No Keyboard Trap | Modales, wizards, paneles de detalle |
| 2.2.1 Timing Adjustable | Sesiones con timeout, aprobaciones con ventana |
| 2.4.1 Bypass Blocks | Skip links para navegación fiscal |
| 2.4.2 Page Titled | Títulos descriptivos por vista (incluyen RUC activo) |
| 2.4.3 Focus Order | Tabulación sigue orden visual |
| 2.4.4 Link Purpose | "Ver detalle" vs "Ver detalle del comprobante F001-123" |
| 3.3.1 Error Identification | Errores fiscales identificados con texto claro |
| 3.3.2 Labels | Campos de formulario fiscal con etiquetas explícitas |
| 4.1.2 Name, Role, Value | Componentes personalizados (árbol de cuentas, tabla dinámica) |

### 7.2 Nivel AA (obligatorio — 100% cumplimiento)

| Criterio | Afecta en Drenyra |
|----------|-------------------|
| 1.3.4 Orientation | Tablas fiscales en landscape y portrait |
| 1.4.3 Contrast (Minimum) | 4.5:1 texto normal, 3:1 texto grande |
| 1.4.4 Resize Text | 200% sin pérdida de contenido fiscal |
| 1.4.10 Reflow | 320px sin scroll horizontal |
| 1.4.11 Non-text Contrast | Estados de confianza, gráficos, iconos (3:1) |
| 1.4.12 Text Spacing | Sin pérdida de funcionalidad con spacing aumentado |
| 2.4.5 Multiple Ways | Al menos 2 formas de llegar a cada entidad fiscal |
| 2.4.7 Focus Visible | Focus ring siempre visible (3:1 contraste) |
| 2.5.8 Target Size (24x24) | Botones de acción fiscal, iconos de estado |
| 3.2.3 Consistent Navigation | Navegación fiscal consistente en toda la app |
| 3.2.4 Consistent Identification | "Ver detalle" siempre significa lo mismo |
| 3.3.3 Error Suggestion | Sugerencias de corrección para errores fiscales |
| 3.3.4 Error Prevention | Confirmación antes de acciones fiscales irreversibles |
| 4.1.3 Status Messages | Live regions para estados de operación fiscal |

### 7.3 Nivel AAA (target — priorizar según impacto)

| Criterio | Prioridad en Drenyra |
|----------|---------------------|
| 1.4.6 Contrast Enhanced (7:1) | Alta — contadores mayores se benefician |
| 1.4.9 Images of Text | Alta — reportes fiscales no deben ser imágenes |
| 2.1.3 Keyboard (todas las funciones) | Alta — keyboard-first es invariante |
| 2.2.4 Interruptions | Media — no hay interrupciones sin permiso |
| 2.4.8 Location | Media — breadcrumbs muestran ubicación fiscal |
| 2.5.6 Concurrent Input | Baja — no aplica en escritorio |

## 8. Patrones de accesibilidad fiscal

### 8.1 Tablas fiscales complejas

Las tablas fiscales (comprobantes, declaraciones, libros) son el componente más crítico:

```html
<!-- PATRÓN: Tabla fiscal con cabecera + detalle + subtotales -->
<table role="table" aria-label="Comprobantes electrónicos — Periodo 2026-07">
  <caption>Comprobantes emitidos — RUC 20123456789</caption>
  <thead>
    <tr>
      <th scope="col" id="h-tipo">Tipo</th>
      <th scope="col" id="h-serie">Serie</th>
      <th scope="col" id="h-numero">Número</th>
      <th scope="col" id="h-monto">Monto</th>
      <th scope="col" id="h-estado">Estado</th>
      <th scope="col" id="h-accion">Acción</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td headers="h-tipo">Factura</td>
      <td headers="h-serie">F001</td>
      <td headers="h-numero">123</td>
      <td headers="h-monto">S/ 1,200.00</td>
      <td headers="h-estado">
        <span role="status" aria-label="Estado conforme">
          ✓ Conforme
        </span>
      </td>
      <td headers="h-accion">
        <button aria-label="Ver detalle de Factura F001-123">Ver</button>
      </td>
    </tr>
  </tbody>
</table>
```

**Reglas para tablas fiscales**:
- `<caption>` descriptivo (incluye RUC + periodo)
- `headers` en celdas para tablas complejas (multi-row/multi-column)
- `<table>` nativo antes que `role="grid"`
- Tablas virtualizadas (10k+ filas) usan `role="grid"` con row-increment ARIA live
- Ordenamiento anunciado con `aria-sort` y live region

### 8.2 Navegación multi-RUC (de SDD-003)

El selector de RUC activo es un landmark navegable:

```html
<nav aria-label="Selección de RUC activo" role="navigation">
  <button 
    aria-current="page"
    aria-label="RUC activo: 20123456789 — Mi Empresa S.A.C."
    aria-haspopup="listbox"
    aria-expanded="false"
  >
    <span aria-hidden="true">🏢</span>
    20123456789 — Mi Empresa S.A.C.
  </button>
</nav>
```

- `aria-current` en el RUC activo
- Al cambiar de RUC, live region anuncia: "Contexto cambiado a RUC 20123456789 — Mi Empresa S.A.C."
- Tecla de acceso directo documentada (ej: `Ctrl+Shift+R` para selector de RUC)

### 8.3 Estados de confianza multi-sensorial

Implementación del contrato de SDD-002 para comunicación no-visual:

```html
<!-- PATRÓN: Estado de confanza con redundancia sensorial -->
<div 
  role="status" 
  aria-live="polite"
  class="trust-status trust-status--violation"
>
  <svg aria-hidden="true" focusable="false">
    <!-- icono de alerta -->
  </svg>
  <span class="trust-status__icon" aria-hidden="true">✗</span>
  <span class="trust-status__text">Violación — IGV no declarado</span>
  <span class="trust-status__detail">
    <a href="#detalle">Ver detalle de la violación</a>
  </span>
</div>
```

### 8.4 Wizards multi-paso fiscales

Los flujos de aprobación, reversión, y declaración son wizards:

```html
<nav aria-label="Progreso del wizard" role="navigation">
  <ol role="list" aria-label="Pasos para reversión de comprobante">
    <li aria-current="step">1. Seleccionar comprobante</li>
    <li>2. Confirmar motivo</li>
    <li>3. Revisar impacto</li>
    <li>4. Firmar y enviar</li>
  </ol>
</nav>
<button aria-label="Paso anterior: Seleccionar comprobante" disabled>Anterior</button>
<button aria-label="Siguiente paso: Confirmar motivo">Siguiente</button>
```

- `aria-current="step"` en paso activo
- Cada paso es un `<h2>` con anuncio de live region al cambiar
- Errores por paso se anuncian con `aria-live="assertive"`
- No hay timeouts automáticos en wizards fiscales

### 8.5 Print y export accesible

Los reportes fiscales imprimibles deben:

1. Usar HTML semántico (no canvas, no imágenes de tabla)
2. Incluir `role="doc-*"` de ARIA Digital Publishing cuando aplique
3. Tener estructura de encabezados jerárquica (`<h1>` título del reporte, `<h2>` secciones)
4. Tablas con `<caption>` y `<thead>` completos
5. No usar color como única distinción (igual que en web)

## 9. Navegación por teclado

### 9.1 Atajos principales

| Atajo | Acción | Aplicación |
|-------|--------|------------|
| `Tab` / `Shift+Tab` | Navegar entre elementos enfocables | Global |
| `Enter` / `Space` | Activar elemento enfocado | Global |
| `Escape` | Cerrar modal/dropdown/panel | Global |
| `Ctrl+K` | Búsqueda fiscal (de SDD-003) | Global |
| `Ctrl+R` | Selector de RUC | Global |
| `Ctrl+Period` | Selector de periodo | Global |
| `1`-`4` | Cambiar entre modos (Fiscal/Oper/Exploratory/[n]) | Global |
| `Ctrl+Z` | Revertir última acción (cuando aplica) | Contextual |
| `?` | Mostrar/ocultar cheat sheet de atajos | Global |

### 9.2 Atajos re-mapeables

Todos los atajos deben ser configurables por el usuario. Un contador que usa lector de pantalla puede necesitar liberar `Ctrl+K` para su lector.

- Almacenamiento en preferencias del usuario
- UI de configuración de atajos con búsqueda y filtro por acción
- Reset a valores por defecto

### 9.3 Modo "focus trap" seguro

Los modales y paneles laterales deben:

1. Atrapar el foco dentro del modal mientras está abierto
2. Al abrir: focus en el primer elemento interactivo
3. Al cerrar: focus vuelve al elemento que abrió el modal
4. `Escape` siempre cierra
5. El fondo (backdrop) tiene `aria-hidden="true"` para lectores

## 10. ARIA live regions para operaciones fiscales

| Operación | Live region | Mensaje |
|-----------|------------|---------|
| Acción ejecutada (éxito) | `aria-live="polite"` | "Comprobante F001-123 registrado correctamente" |
| Acción ejecutada (error) | `aria-live="assertive"` | "Error al registrar comprobante: serie no coincide con RUC" |
| Estado de confianza cambia | `aria-live="polite"` | "Estado cambiado a Warning: IGV pendiente de declarar" |
| RUC activo cambia | `aria-live="polite"` | "Contexto cambiado a RUC 20123456789" |
| Resultados de búsqueda | `aria-live="polite"` | "15 resultados para Factura F001" |
| Progreso de operación larga | `aria-live="polite"` role="progressbar" | "Conciliando 150 comprobantes. 45% completado." |

## 11. Estrategia de testing

| Método | Frecuencia | Herramientas |
|--------|-----------|-------------|
| Auditoría automática | Cada PR (CI) | axe-core, Lighthouse a11y |
| Pruebas de teclado | Cada PR (manual) | Checklist de tabulación |
| Pruebas con NVDA | Cada release candidate | NVDA + Firefox |
| Pruebas con VoiceOver | Cada release candidate | VoiceOver + Safari |
| Pruebas de contraste | Cada PR (CI) | Contrast ratio checker automatizado |
| Pruebas de zoom/reflow | Cada release candidate | 200% zoom, 320px viewport |
| Pruebas con usuarios | Cada release mayor | Usuarios con discapacidad (reclutados) |

### 11.1 CI Gates

| Gate | Tool | Falla si... |
|------|------|-------------|
| Lint AXE | axe-core | Violaciones nivel A o AA |
| Contraste | Color contrast checker | Ratio < 4.5:1 texto, < 3:1 no-texto |
| Teclado | Tab order test script | Elemento enfocable no alcanzable por tab |
| Labels | ARIA label checker | Elemento interactivo sin label accesible |

## 12. Performance y accesibilidad

La accesibilidad no debe degradar la performance:

- **ARIA en tablas virtualizadas**: Solo los rows visibles tienen ARIA. Los rows virtualizados (off-screen) no tienen atributos hasta que entran al viewport.
- **Live regions**: Solo cuando el contenido cambia. No hay live regions estáticas.
- **Focus visible**: `:focus-visible` nativo. No polyfills. Sin animaciones en focus ring.
- **Anuncios**: Un solo `aria-live` region reutilizable, no múltiples.
- **Iconos SVG decorativos**: `aria-hidden="true"` y `focusable="false"`. No cargan en lectores.

## 13. Progresión (phasing)

| Fase | Alcance | WCAG nivel | Timeline sugerido |
|------|---------|-----------|-------------------|
| **Fase 1 — Foundation** | Tipografía, contraste, keyboard nav básico, skip links | A parcial | Previo a primera release |
| **Fase 2 — Components** | Tablas fiscales, formularios, estados de confianza | A + AA parcial | Con release de tablas |
| **Fase 3 — Navigation** | Multi-RUC, atajos, modales, live regions | AA | Con release de navegación |
| **Fase 4 — Media** | Print a11y, gráficos accesibles, dashboards | AA + AAA target | Con release de reporting |
| **Fase 5 — Hardening** | Screen reader full coverage, usuarios reales | AA completo | Pre-producción |

## 14. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| ARIA overhead degrada performance de tablas virtualizadas | Media | Alto | ARIA solo en rows visibles, test de performance con lectores |
| Componentes de terceros no accesibles | Alta | Alto | Auditoría de a11y en CI, veto de componentes sin a11y |
| Costo de pruebas con lectores reales | Media | Medio | Automatizar lo posible, reservar presupuesto para pruebas manuales |
| Atajos de teclado conflictúan con lectores de pantalla | Alta | Alto | Atajos re-mapeables, documentación de conflictos conocidos |
| "Coverage" falso de a11y (pasar AXE pero ser inusable) | Alta | Medio | Auditoría manual + pruebas con usuarios reales |

## 15. Dependencias

| SDD | Relación |
|-----|----------|
| SDD-001 (Personas) | Perfiles con necesidades de accesibilidad |
| SDD-002 (Contratos) | Estados multi-sensoriales, progressive disclosure accesible |
| SDD-003 (IA) | Navegación navegable por teclado, landmarks ARIA |
| SDD-004 (Telemetría) | Monitoreo de errores de a11y en producción |
| Sistema de diseño (Ola 3) | Componentes base deben tener a11y incorporada |

## 16. Acceptance criteria

- [ ] Checklist de cumplimiento WCAG 2.2 AA documentado y verificado por sección
- [ ] Tablas fiscales con marcado semántico completo
- [ ] Estados de confianza con redundancia sensorial (color + icono + texto + ARIA)
- [ ] Navegación completa por teclado sin trampas de foco
- [ ] Atajos de teclado documentados y re-mapeables
- [ ] Live regions implementadas para operaciones fiscales clave
- [ ] CI gates de a11y configurados (axe-core, contraste, teclado)
- [ ] Pruebas con NVDA y VoiceOver pasadas en componentes críticos
- [ ] Print/export accesible (HTML semántico, no imágenes)
- [ ] Contraste 4.5:1 mínimo en toda la interfaz

## 17. DONE criteria (gate G2)

1. **WCAG 2.2 AA auditado** sin violaciones en componentes críticos
2. **Navegación por teclado probada** en todas las rutas de SDD-003
3. **Estados multi-sensoriales implementados** en todos los componentes de estado
4. **CI gates de a11y bloqueantes** en el pipeline
5. **Pruebas con NVDA + VoiceOver documentadas** y pasadas
6. **Atajos de teclado documentados** y accesibles desde la app (cheat sheet con `?`)
7. **Guía de accesibilidad para desarrolladores** publicada en la documentación interna

---

**Siguiente**: SDD-006 — Sistema de Evidencia Fiscal (Ola 2 — Fiscal Trust Core)
