# ADR-003: TanStack Router para Frontend

**Estado:** Aceptado
**Fecha:** 2026-04-20
**Decisores:** Equipo Drenyra

## Contexto

Drenyra Web es una SPA con ~60 rutas, layouts anidados, lazy loading, y autenticación. Necesita un router type-safe, con soporte para loaders y transiciones.

## Opciones Consideradas

1. **TanStack Router v1** — type-safe, file-based routing, loaders, search params
2. **React Router v6/v7** — maduro, pero sin type-safety nativa
3. **Next.js App Router** — server components no aplican (SPA), más peso del que necesitamos

## Decisión

TanStack Router v1 (file-based).

**Razones:**

- Type-safe: las rutas, params y search params son tipos inferidos del filesystem
- File-based routing: el router se genera del árbol de archivos en `src/routes/`
- Lazy loading nativo con `lazyRouteComponent`
- Loaders y pending states integrados
- TypeScript-first: todo el routing tipado

## Consecuencias

**Positivas:**

- Error de ruta = error de compilación (no runtime)
- Ruta nueva = archivo nuevo, sin config manual
- Route tree generado automáticamente (2888 líneas, pero no se toca a mano)

**Negativas:**

- Dependencia de un plugin de Vite para generar el route tree
- Curva de aprendizaje: el modelo de TanStack Router es distinto a React Router
- Menos recursos de aprendizaje que React Router

## Impacto Fiscal

Ninguno.

## Supersedes

N/A
