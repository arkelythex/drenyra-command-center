# ADR-006: React Context + Zustand para Estado

**Estado:** Aceptado
**Fecha:** 2026-05-01
**Decisores:** Equipo Frontend

## Contexto

La web necesita manejar estado global (auth, sidebar, theme) y estado de feature (fiscal inspector, artifacts, agents). Sin una convención clara, se termina mezclando patrones.

## Opciones Consideradas

1. **React Context + Zustand** — Context para providers de dominio, Zustand para UI state
2. **Solo Zustand** — unifica todo, pero pierde el lifecycle de providers (mount/unmount)
3. **Solo React Context** — providers puros, pero re-renders innecesarios en UI state
4. **Jotai** — atoms, pero más abstracción que Zustand para UI state
5. **Redux** — demasiado boilerplate para SPA moderna

## Decisión

React Context + Zustand.

**Reglas:**

- **Zustand**: UI state compartido (sidebar, theme, layout). Store chico: `ui-store.ts` (~100 líneas).
- **React Context**: estado de dominio con lifecycle (auth, fiscal inspector, artifacts). Se monta/desmonta con la feature.
- **No mezclar**: un estado no puede estar en ambos. Si dudás, default a Zustand.

## Consecuencias

**Positivas:**

- UI state con Zustand es simple y performante (suscriptores selectivos)
- Domain state con Context respeta el lifecycle de la feature
- Convención documentada evita "otro provider más"

**Negativas:**

- Dos patrones que aprender en vez de uno
- Posible fricción: "¿esto va en Zustand o Context?"

## Impacto Fiscal

Ninguno.

## Supersedes

N/A
