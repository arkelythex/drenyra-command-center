# P6: Package Health Audit

**Fecha:** 2026-07-07
**Autor:** el Gentleman
**PRs estimados:** 2
**Líneas estimadas:** ~300
**Depende de:** S3 (types migrated to packages)

---

## Problema

El monorepo tiene 15+ packages en `packages/` y cada app en `apps/`. Con el crecimiento rápido:

- Algunos packages exportan de más (cosas internas que deberían ser privadas)
- Hay bundles que incluyen código que no se usa (tree-shaking inefectivo)
- No hay budget de bundle size (nadie sabe cuánto pesa cada package)
- Las dependencias entre packages no están auditadas (quién depende de quién)
- Hay packages que podrían ser internal (no publicables) vs publicables

Para una infraestructura contable, cada package debe tener un contrato claro y medible.

## Cambios Propuestos

### PR 1: Tree-Shaking + Bundle Budget (150 líneas)

**Qué:** Asegurar que solo se exporta lo que se necesita y medir el impacto.

**Herramientas:**

- `@arethetypeswrong/cli` (attw) — verificar que los tipos se exportan correctamente
- `vite-bundle-visualizer` — visualizar qué pesa en cada bundle
- `size-limit` — budget de bundle por paquete

**Acciones:**

1. Marcar exports internos como `@internal` (JSDoc) o moverlos a `_internal/`
2. Configurar `exports` field en package.json (solo exports públicos)
3. Agregar `sideEffects: false` en package.json donde corresponda
4. Establecer bundle budgets:

| Package                | Budget                                  |
| ---------------------- | --------------------------------------- |
| `@drenyra/domain`      | < 50KB (framework-free, pura lógica)    |
| `@drenyra/application` | < 30KB (solo DTOs y casos de uso)       |
| `@drenyra/persistence` | < 20KB (tipos de schema, no runtime DB) |
| `@drenyra/ui`          | < 200KB (design system completo)        |
| `@drenyra/shared`      | < 10KB (helpers)                        |

### PR 2: Dependency Graph Audit (150 líneas)

**Qué:** Mapear dependencias entre packages y limpiar lo que sobre.

**Acciones:**

1. Generar dependency graph con `madge` o `dpdm`
2. Identificar dependencias circulares
3. Identificar dependencias que deberían ser devDependencies (tipos solamente)
4. Identificar dependencias duplicadas entre packages (misma lib en distintas versiones)
5. Identificar packages que importan de otros packages incorrectamente (domain importando de infrastructure, etc.)

**Cleanup:**

- Mover type-only imports a `devDependencies` para no inflar bundles
- Unificar versiones de dependencias compartidas
- Eliminar dependencias no usadas
- Documentar el dependency graph esperado vs real

## Dependencias Esperadas (Clean Architecture)

```text
apps/web ──→ @drenyra/ui ──→ @drenyra/shared
     │                          │
     └──→ @drenyra/application ─┤
              │                  │
              └──→ @drenyra/domain
                       │
                       └── (framework-free, 0 deps)
```

## Criterios de Aceptación

1. `attw` pasa sin errors para todos los packages
2. `size-limit` pasa en CI (budgets no excedidos)
3. 0 dependencias circulares entre packages
4. 0 dependencias duplicadas en distintas versiones
5. `@drenyra/domain` tiene 0 dependencias runtime (framework-free)
6. Todos los type-only imports están en `devDependencies`
