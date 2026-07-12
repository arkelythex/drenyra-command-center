# X3: Frontend Provider/Context Architecture

**Estado:** proposal
**Creado:** 2026-07-11
**Depende de:** DS5 (Three-Panel Layout — applied), F1 (Agentic Shell — spec)
**PRs estimados:** 2
**Líneas estimadas:** ~500

---

## Problema

La web app tiene 8 providers de React Context que **cada ruta debe envolver manualmente**. Esto causa:

1. **Errores en runtime** si una ruta olvida un provider (ej: `FiscalInspectorProvider` en `/`)
2. **Duplicación**: `FiscalInspectorProvider` se envuelve en 3 lugares distintos (MainLayout, AgenticLayout, cierre-mensual)
3. **Sin jerarquía clara**: no hay distinción entre providers globales (auth, query) y de feature (fiscal, artifact)
4. **Zustand + Context sin convención**: algunas cosas usan `ui-store.ts` (Zustand) y otras Context, sin reglas claras

## Solución Propuesta

### PR1: Provider Hierarchy Unification

Crear un único `AppProviders` que organice los providers en capas:

```typescript
// components/providers/AppProviders.tsx
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SidebarWorkspaceProvider>
            <ArtifactEventProvider>
              <FiscalInspectorProvider>
                <AgentAwareProvider>
                  <PolicyGateProvider>
                    {children}
                  </PolicyGateProvider>
                </AgentAwareProvider>
              </FiscalInspectorProvider>
            </ArtifactEventProvider>
          </SidebarWorkspaceProvider>
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}
```

**Reglas de capas:**

| Capa          | Providers                               | Scope       | Quién los usa           |
| ------------- | --------------------------------------- | ----------- | ----------------------- |
| 0 (infra)     | QueryClient, Router                     | Global      | Toda la app             |
| 1 (auth)      | AuthProvider                            | Global      | Sesión, permisos        |
| 2 (workspace) | SidebarWorkspace, ArtifactEvent         | Semi-global | Layout                  |
| 3 (feature)   | FiscalInspector, AgentAware, PolicyGate | Feature     | Componentes específicos |
| 4 (page)      | Page-specific providers                 | Local       | Una sola ruta           |

**Regla**: Los providers de capa 3 se envuelven en `AppProviders` en `client.tsx`. Los de capa 4 se envuelven en la ruta. **Nunca** se repite un provider de capa 3 en una ruta.

### PR2: Zustand vs Context Convention + Migration

Documentar y migrar a una convención clara:

**Usar Zustand cuando:**

- Estado compartido entre componentes no relacionados (sidebar, theme)
- Estado que persiste (localStorage)
- Estado que cambia frecuentemente (UI state)

**Usar React Context cuando:**

- Estado inyectado por un provider (auth, fiscal inspector)
- Dependencia de ciclo de vida (mount/unmount de un feature)
- Estado que rara vez cambia (config, settings)

Migrar: mover UI state de Context a Zustand, mantener domain providers en Context.

## Criterios de Aceptación

- [ ] `AppProviders` existe y envuelve toda la app desde `client.tsx`
- [ ] Ninguna ruta necesita envolver `FiscalInspectorProvider` manualmente
- [ ] Guía de convención Zustand vs Context en `apps/web/docs/state-management.md`
- [ ] 0 providers duplicados en rutas
- [ ] Test que verifique que no hay providers huérfanos

## Riesgos

- **Bajo**: Cambio mecánico, fácil de revertir
- **Medio**: Algunos providers pueden tener dependencias circulares si no se ordenan bien
- **Bajo**: Tests pueden necesitar wrapper de providers actualizado

## Review Workload Forecast

| PR                          | Líneas | Review time | Reviewer |
| --------------------------- | ------ | ----------- | -------- |
| PR1: Provider hierarchy     | ~250   | 20 min      | Frontend |
| PR2: Convention + migration | ~250   | 15 min      | Frontend |
