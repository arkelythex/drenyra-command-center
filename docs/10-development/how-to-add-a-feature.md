---
title: Cómo agregar una feature
description: Pipeline completo para agregar una nueva feature
last-verified: 2026-07-11
audience: developer
---

# Cómo agregar una feature

Este documento describe el pipeline para agregar una nueva feature a Drenyra, desde el dominio hasta la interfaz de usuario.

## Pipeline

```
domain → application → API → web
```

Cada capa tiene responsabilidades específicas y dependencias unidireccionales: `domain` no conoce `application`, `application` no conoce `API`, etc.

## 1. Domain (`packages/domain/src/`)

Acá van las reglas de negocio, value objects y entidades. **Sin frameworks, sin dependencias externas.**

```typescript
// packages/domain/src/fiscal/ejemplo.ts
export class TipoDocumento {
  private constructor(
    readonly codigo: string,
    readonly nombre: string
  ) {
    Object.freeze(this)
  }

  static create(codigo: string, nombre: string): TipoDocumento {
    if (codigo.length !== 2) throw new Error('Código debe tener 2 caracteres')
    return new TipoDocumento(codigo, nombre)
  }
}
```

**Reglas:**

- Value objects inmutables (constructor privado + `Object.freeze`)
- Métodos fábrica `static create()` con validación
- Tests en `__tests__/` dentro del mismo package
- Sin imports de `application`, `persistence`, `infrastructure`

## 2. Application (`packages/application/src/`)

Casos de uso (Commands/Queries). Depende solo de `domain`.

```typescript
// packages/application/src/features/ejemplo/create-ejemplo.use-case.ts
import { TipoDocumento } from '@drenyra/domain'

export class CreateTipoDocumentoUseCase {
  execute(input: { codigo: string; nombre: string }) {
    const tipo = TipoDocumento.create(input.codigo, input.nombre)
    // Lógica de negocio...
    return tipo
  }
}
```

## 3. API (`apps/api/src/features/`)

Rutas HTTP, schemas de validación. Sigue patrón vertical slice.

```typescript
// apps/api/src/features/ejemplo/ejemplo.routes.ts
import { Elysia, t } from 'elysia'

export const ejemploRoutes = new Elysia().post(
  '/api/ejemplo',
  ({ body }) => {
    // Validación, use case, response
  },
  {
    body: t.Object({
      codigo: t.String({ maxLength: 2 }),
      nombre: t.String(),
    }),
  }
)
```

**Reglas:**

- Registrar en `apps/api/src/app-core.ts`
- Schemas con Elysia `t` (no Zod separado — Elysia lo integra)

## 4. Web (`apps/web/src/features/`)

Componentes React + rutas TanStack Router.

```typescript
// apps/web/src/routes/ejemplo.tsx
import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/ejemplo')({
  component: lazyRouteComponent(
    () => import('../features/ejemplo/EjemploPage'),
    'EjemploPage'
  ),
})
```

**Reglas:**

- Lazy loading con `lazyRouteComponent` para todas las rutas
- Providers globales en `AppProviders` (no enrutar providers por ruta)
- Feature components en `src/features/<nombre>/`

## Checklist por feature

- [ ] Value objects en `packages/domain/`
- [ ] Tests de dominio (unit + property-based si aplica)
- [ ] Use case en `packages/application/`
- [ ] Ruta API + schema en `apps/api/`
- [ ] Registro en `app-core.ts`
- [ ] Ruta web en `apps/web/src/routes/`
- [ ] Componente feature en `apps/web/src/features/`
- [ ] Tests de integración (si aplica)
- [ ] Documentación (si cambia contrato público)
