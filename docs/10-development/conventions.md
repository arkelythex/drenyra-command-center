---
title: Convenciones de desarrollo
description: Naming, imports, providers, git y estándares de código
last-verified: 2026-07-11
audience: developer
---

# Convenciones de desarrollo

## Naming

| Contexto             | Convention    | Ejemplo                               |
| -------------------- | ------------- | ------------------------------------- |
| Archivos (TS/TSX)    | `kebab-case`  | `user-profile.tsx`, `api-routes.ts`   |
| Componentes React    | `PascalCase`  | `UserProfile`, `AccountingInbox`      |
| Funciones/ Variables | `camelCase`   | `getUser`, `isLoading`, `userName`    |
| Tipos/Interfaces     | `PascalCase`  | `UserProfile`, `MoneyConfig`          |
| Archivos Python      | `snake_case`  | `user_profile.py`                     |
| Archivos Go          | `snake_case`  | `user_profile.go`                     |
| Directorios          | `kebab-case`  | `accounting-inbox/`, `value-objects/` |
| Constantes           | `UPPER_SNAKE` | `MAX_RETRY_COUNT`, `IGV_RATE`         |

## Imports

### Path aliases

La web usa `@/` como alias para `src/`:

```typescript
// ✅ Correcto
import { FiscalInspectorProvider } from '@/context/FiscalInspectorContext'
import { useInboxDashboard } from './hooks/useInboxDashboard'

// ❌ Incorrecto
import { FiscalInspectorProvider } from '../../context/FiscalInspectorContext'
```

### Barrel exports

Cada directorio en `packages/` **debe** tener un `index.ts` que re-exporte lo público:

```typescript
// packages/domain/src/value-objects/index.ts
export { Money } from './Money'
export { RUC } from './RUC'
export { DNI } from './DNI'
```

**Reglas:**

- No imports a archivos `.ts` directamente si hay un `index.ts` en el mismo directorio
- Los barrel exports siguen la convención `index.ts` (sin verificación CI dedicada por el momento)

### Orden de imports

```
1. External (node_modules) — agrupados por paquete
2. Internal (@ alias) — agrupados por paquete
3. Relative (./ o ../) — ordenados por profundidad
```

```typescript
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { useFiscalInspector } from '@/context/FiscalInspectorContext'
import { cn } from '@/lib/utils'

import { useInboxDashboard } from './hooks/useInboxDashboard'
import { InboxRenderer } from './InboxRenderer'
```

## Providers (React Context)

Jerarquía de providers:

```
AppProviders (client.tsx)
├── QueryClientProvider      ← Capa 0: infra
├── AuthProvider             ← Capa 1: auth
├── SidebarWorkspaceProvider ← Capa 2: workspace
├── FiscalInspectorProvider  ← Capa 3: feature
└── PolicyGateProvider       ← Capa 3: feature
```

**Reglas:**

- Los providers de capa 0-3 van en `AppProviders` (se crea en `client.tsx`)
- Los providers de capa 4 van en la ruta específica
- **Nunca** repetir un provider de capa 3 en una ruta

## Git

### Conventional Commits

```
feat(scope): descripción en inglés, presente imperativo

- bullet points con cambios
- referencia a issue si aplica
```

| Tipo        | Uso                           |
| ----------- | ----------------------------- |
| `feat:`     | Nueva feature                 |
| `fix:`      | Bug fix                       |
| `refactor:` | Refactor sin cambio funcional |
| `docs:`     | Documentación                 |
| `test:`     | Tests                         |
| `chore:`    | Tooling, CI, config           |

### Branch naming

```
feat/<descripcion-corta>
fix/<descripcion-corta>
refactor/<descripcion-corta>
docs/<descripcion-corta>
```

### PRs

- PRs < 400 líneas (si excede, dividir en chained PRs)
- Template con: Summary, Scope, Fiscal correctness, Review path
- Siempre linkear al plan SDD si aplica

## TypeScript Strict Mode

El proyecto usa TypeScript estricto. Reglas clave:

- `noUncheckedIndexedAccess` — siempre verificar que un índice existe
- `exactOptionalPropertyTypes` — no usar `undefined` como "ausente"
- `strictNullChecks` — siempre manejar null/undefined
- `noUnusedLocals` / `noUnusedParameters` — error, no warning
- **No usar `any`**. Usar `unknown` + type narrowing, o tipos genéricos
