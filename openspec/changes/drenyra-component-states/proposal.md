# DS4 — Component State Design (Empty/Error/Loading)

**Estado:** Proposal
**Creado:** 2026-07-05

---

## Problema

El error `entries.map is not a function` en producción expone un stack trace al usuario — síntoma de que los componentes de lista no tienen estados de borde diseñados explícitamente. El DS exige 3 estados por componente que renderice listas: **cargando**, **vacío** (con acción clara), y **error** (mensaje de usuario, no técnico).

## Propuesta

1. **Auditar componentes de lista** en la app web que pueden estar vacíos: asientos, comprobantes, facturas, etc.
2. **Crear componentes de estado genéricos reutilizables:**
   - `EmptyState` — mensaje + icono + CTA ("Subí tu primer comprobante")
   - `ErrorState` — mensaje amigable + botón reintentar + "copiar detalle"
   - `LoadingState` — skeleton loader o spinner contextual
3. **Envolver todas las listas** con un patrón de estado que renderice el state correcto según el data status
4. **Cerrar el bug** `entries.map is not a function` identificando qué componente lo causa y agregando type narrowing + guard clause + estado error

## No-alcance

- No se rediseñan los componentes existentes, solo se agregan estados
- No se toca el backend
- No se implementan animaciones complejas (skeleton simple basta)

## PRs

| PR  | Contenido                                                       | Archivos | Líneas est. |
| --- | --------------------------------------------------------------- | -------- | ----------- |
| PR1 | Componentes EmptyState/ErrorState/LoadingState + patrón wrapper | 4-5      | ~200        |
| PR2 | Aplicar a todas las listas + fix entries.map bug                | ~10      | ~200        |

## Riesgos

- **Medio**: Algunos componentes pueden tener sus propios estados de carga inline. Habrá que refactorizar para usar los genéricos sin romper estilos existentes.
- **Bajo**: Agregar estados error puede requerir cambios en hooks de datos existentes para exponer el estado correctamente.
