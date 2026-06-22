**Última actualización**: 2026-06-10

# Feature Template — Vertical Slice Architecture

Cada feature en `features/` es un **vertical slice** independiente con su propia API client, hooks, componentes y tipos. El patrón garantiza aislamiento (FSD), facilita el testing y mantiene el código predecible.

## Estructura estándar

```
features/{name}/
├── index.ts                    # Barrel export — public API del feature
├── api/
│   ├── {name}.api.ts           # API client con Eden Treaty
│   ├── {name}-treaty-client.ts # Treaty route client (opcional)
│   └── query-keys.ts           # Query key factory
├── components/
│   ├── {Name}View.tsx          # Vista principal
│   ├── {Name}Modal.tsx         # Modal create/edit
│   └── {Name}Form.tsx          # Formulario (react-hook-form + zod)
├── hooks/
│   └── use{Name}.ts            # TanStack Query hooks + UI state
├── types/
│   └── index.ts                # Type definitions (si no usas schemas)
```

## Convenciones

| Concepto | Regla |
|---|---|
| **Nombres de archivo** | kebab-case: `customers.api.ts`, `query-keys.ts` |
| **Componentes** | PascalCase con prefijo del feature: `CustomersView`, `VendorForm` |
| **Hooks** | camelCase con prefijo `use`: `useCustomers`, `useCreateVendor` |
| **API client** | objeto `{name}Api` con métodos `list`, `create`, `getById`, `update`, `delete` |
| **Tipos** | Schema-driven desde `lib/schemas/{name}.schema.ts` o interfaces en `types/index.ts` |
| **Export** | Barrel `index.ts` con exports agrupados por capa (UI, API, Hooks, Types) |

## Query keys

Crea un archivo `api/query-keys.ts` con la factory:

```ts
export const featureKeys = {
  all: ['features'] as const,
  list: (companyId: string) => [...featureKeys.all, companyId] as const,
} as const;
```

Las `queryKey` de TanStack Query se estructuran como `['resource', companyId]`. Las mutaciones invalidan `featureKeys.all`.

## API Client

El API client usa Eden Treaty + `unwrap()` + `extractOkDataOrPassthrough()`:

```ts
import { extractOkDataOrPassthrough, unwrap } from "@/lib/api-helpers";
import { treatyClient } from "./{name}-treaty-client";

export const featureApi = {
  list: async (filters: { companyId: string }): Promise<Record[]> => {
    const body = await unwrap(treatyClient.get({ query: filters }));
    return extractOkDataOrPassthrough<Record[]>(body, "{name}.list");
  },
  create: async (payload: CreatePayload) => unwrap(treatyClient.post(payload)),
  getById: async (id: string) => unwrap(treatyClient({ id }).get()),
  update: async (id: string, payload: UpdatePayload) => unwrap(treatyClient({ id }).patch(payload)),
  delete: async (id: string) => unwrap(treatyClient({ id }).delete()),
};
```

## Hooks

Cada feature exporta un hook principal `use{Name}` para queries + filtros/ui-state local, y hooks individuales `useCreate{Name}`, `useUpdate{Name}`, `useDelete{Name}` para mutaciones.

```ts
// Hook principal — query + UI state
export function useFeature(): UseFeatureResult {
  const { companyContext } = useActiveCompanyContext();
  const companyId = companyContext.companyId;

  const query = useQuery({
    queryKey: featureKeys.list(companyId),
    queryFn: () => featureApi.list({ companyId }),
  });

  // UI state local
  const [searchQuery, setSearchQuery] = useState("");

  return { ..., searchQuery, setSearchQuery, ...query };
}

// Mutation hooks individuales
export function useCreateFeature() { /* useMutation + invalidate featureKeys.all */ }
export function useUpdateFeature() { /* useMutation + invalidate featureKeys.all */ }
export function useDeleteFeature() { /* useMutation + invalidate featureKeys.all */ }
```

## CRUD Reutilizable — `lib/crud-api.ts`

Para features CRUD estándar sin lógica especial de normalización o UI state, usa `createCrudHooks` de `@/lib/crud-api`:

```ts
import { createCrudHooks } from "@/lib/crud-api";
import { featureApi } from "../api/{name}.api";
import type { Record, CreatePayload, UpdatePayload } from "../types";

export const {
  keys: featureKeys,
  useList: useFeatureList,
  useGet: useFeature,
  useCreate: useCreateFeature,
  useUpdate: useUpdateFeature,
  useDelete: useDeleteFeature,
} = createCrudHooks<Record, CreatePayload, UpdatePayload>({
  key: "features",
  list: (companyId) => featureApi.list({ companyId }),
  getById: (id) => featureApi.getById(id),
  create: (companyId, data) => featureApi.create({ ...data, companyId }),
  update: (id, data) => featureApi.update(id, data),
  delete: (id) => featureApi.delete(id),
});
```

Esto genera automáticamente:
- `useFeatureList()` — query con company context + query keys tipadas
- `useFeature(id)` — query individual por ID
- `useCreateFeature()` — mutation que invalida `featureKeys.all`
- `useUpdateFeature()` — mutation que invalida `featureKeys.all`
- `useDeleteFeature()` — mutation que invalida `featureKeys.all`
- `featureKeys` — factory `{ all, list(companyId), detail(id) }`

Usa `createCrudHooks` cuando el feature no requiera normalización extra, UI state local (search, tabs), o lógica de negocio en el hook. Para features complejos (como customers con search/stats/tabs), implementa el hook manualmente siguiendo el patrón de `useCustomers`.

## Componentes

### View (Vista principal)

Renderiza la página completa del feature. Orquesta modales, tabs y widgets.

### Modal + Form (Create/Edit)

```tsx
interface FeatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: Feature | null;
  mode: "create" | "edit";
}

interface FeatureFormProps {
  defaultValues?: Partial<CreateDTO>;
  onSubmit: (data: CreateDTO) => void;
  isLoading?: boolean;
}
```

- Usa `react-hook-form` + `zodResolver` con el schema del feature
- Helper `{name}-form-defaults.ts` para valores iniciales
- Inyecta `companyId` desde `useActiveCompanyContext()`

## Comandos

```bash
# Scaffold un nuevo feature
bun run scaffold:feature -- customers

# O manualmente:
mkdir -p features/{name}/{api,components,hooks,types}
```

## Features existentes de referencia

| Feature | Hook principal | Normalización | UI State | Treaty Client |
|---|---|---|---|---|
| customers | `useCustomers` | Sí (mapper fn) | search, tabs, expand | `customer-treaty-client.ts` |
| vendors | `useVendors` | Sí (mapper fn) | search, expand | `vendor-treaty-client.ts` |
| products | `useProducts` | En API | No | Directo (`api.products`) |
| bills | Hook modular | En mappers | Sí (complejo) | `bill-treaty-client.ts` |

Para features simples: copia `products`. Para features con UI state: copia `customers` o `vendors`. Para features complejos con workflow: mira `bills`.
