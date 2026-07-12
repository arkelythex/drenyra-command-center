# X4: Import Health & Dead Code Elimination

**Estado:** proposal
**Creado:** 2026-07-11
**Depende de:** P5 (Code Quality — applied), P6 (Package Health — proposal)
**PRs estimados:** 2
**Líneas estimadas:** ~400

---

## Problema

Durante la sesión de verificación del 2026-07-11 se encontraron:

1. **4 imports rotos**: `provider.ts` apuntaba a `./ai/` en vez de `../ai/`, faltaba barrel export `logger.ts`, `FiscalChat.tsx` y `CompareLoansView.tsx` nunca se crearon
2. **Lazy routes a componentes que no existen**: `routes/fiscal-chat.tsx` y `routes/configuracion/compare.tsx` importan componentes que jamás se implementaron
3. **Sin verificación automática**: No hay un gate que detecte imports rotos antes de que lleguen a producción

## Solución Propuesta

### PR1: Import Boundary Enforcer

Implementar un sistema que verifique automáticamente la salud de imports:

```typescript
// scripts/ci/check-import-health.ts
// 1. Verifica que todos los barrel exports (`index.ts`) existan
// 2. Verifica que todos los `lazyRouteComponent` imports resuelvan
// 3. Verifica que no haya imports a archivos eliminados
// 4. Verifica direcciones de dependencia (domain no importa infrastructure)
```

**Reglas de barrel export:**

```
packages/domain/src/
  index.ts  ← DEBE re-exportar todo lo público
  value-objects/
    index.ts  ← DEBE existir
  fiscal/
    index.ts  ← DEBE existir
  accounting/
    index.ts  ← DEBE existir
```

**Reglas de lazy routes:**

```
routes/*.tsx
  → Todos los lazyRouteComponent() deben resolver a un archivo existente
  → Fallar si el target no existe (error, no warning)
```

**Dependency direction enforcement:**

```text
apps/web/       → puede importar packages/*        ✓
packages/ui/    → puede importar shared, domain    ✓
packages/domain → NO puede importar infrastructure ✗
packages/ai     → puede importar domain            ✓
packages/ai     → NO puede importar persistence    ✗
```

### PR2: Dead Code Sweep + knip Integration

- Integrar `knip` para detectar exports sin usar, archivos no referenciados, dependencias no usadas
- Configurar en `package.json` como `bun run knip`
- Agregar a CI como advisory (warning, no blocker inicialmente)
- Sweep inicial: eliminar rutas muertas, componentes huérfanos, barrel exports sin contenido

```json
// knip.json (proyecto web)
{
  "entry": ["src/client.tsx"],
  "project": ["src/**/*.ts", "src/**/*.tsx"],
  "ignore": ["src/routeTree.gen.ts"],
  "rules": {
    "exports": "warn",
    "files": "warn",
    "dependencies": "warn"
  }
}
```

## Criterios de Aceptación

- [ ] Script `check-import-health.ts` implementado y corriendo en CI
- [ ] 0 lazy routes a componentes inexistentes
- [ ] Todos los `packages/*/src/index.ts` tienen barrel exports completos
- [ ] knip integrado con reporte semanal
- [ ] Primer sweep: mínimo 10 exports muertos eliminados

## Riesgos

- **Medio**: Barrel exports pueden romper imports si se cambia la estructura de exports
- **Bajo**: knip puede tener falsos positivos en archivos dinámicos (routeTree.gen.ts)

## Review Workload Forecast

| PR                   | Líneas | Review time | Reviewer  |
| -------------------- | ------ | ----------- | --------- |
| PR1: Import enforcer | ~250   | 20 min      | Backend   |
| PR2: Dead code sweep | ~150   | 15 min      | Full team |
