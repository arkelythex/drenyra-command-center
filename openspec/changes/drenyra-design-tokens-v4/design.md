# DS1 — Design: Token Migration Plan

**Basado en:** proposal.md + color-palette-spec.md
**Estado:** Draft

---

## Approach

**Replace in place, validate by recompilation.** El generator `scripts/generate-tokens.ts` es un stub (solo valida JSON y printea recordatorio). Los archivos generados (`tokens.css`, `tokens.ts`) se editan manualmente para reflejar los cambios del JSON fuente.

### Flujo por archivo

```
tokens.dtcg.json  ──(manual sync)──▶  generated/tokens.css
                                     ▶  generated/tokens.ts
                                     ▶  index.css (remove overrides)
                                     ▶  SettingsContext.tsx (update)
```

## PR1: tokens.dtcg.json + generated/tokens.css

### tokens.dtcg.json changes

1. **Renombrar metadata**: `name` → "Drenyra Cyan/Violet Tokens", `palette` → "Cyan/Violet APCA-aware", `version` → "4.0.0"
2. **Primitive tier**: Reemplazar TODOS los colores de la paleta:
   - `espresso-N` → dark primitives (canvas, surface, surface-2, overlay)
   - `cream-N` → light primitives
   - `voltage-N` → `cyan-N` (base: #3CE6D8, dim: #1F8A80)
   - Agregar `violet-N` como nuevo primitivo
   - `white` → `text-light` (#EDEFF2), ajustar grays a valores APCA
   - Reemplazar oklch() con valores HEX donde el DS los especifique
   - Agregar `state-*` como primitivos directos
3. **Semantic tier**: Re-mapear referencias a los nuevos primitivos
   - `semantic.accent.voltage.*` → `semantic.accent.cyan.*`
   - Agregar `semantic.accent.violet.*`
   - `semantic.state.*` usar nuevos valores
   - `semantic.ai.*` cambiar a cyan/violet halo
4. **Component tier**: Re-mapear button, chip, editorial a nuevos colores

### generated/tokens.css changes

1. Replace `@theme` block values matching new palette
2. Replace `.dark` + `.light` `@layer base` values
3. Add new CSS variables: `--color-state-pending`, `--color-accent-cyan`, `--color-accent-violet`, etc.

## PR2: index.css cleanup + SettingsContext

### index.css cleanup

1. Review all 2109 lines. Remove duplicate variable definitions now covered by generated/tokens.css
2. Remove `.dark` overrides for `--color-primary`, `--accent`, `--ring` etc. that match the new tokens
3. Keep: animations, transitions, component-specific styles, custom-variant definitions
4. Ensure the remaining overrides use `var(--color-*)` from the new tokens, not hardcoded voltage values

### SettingsContext.tsx changes

1. `DEFAULT_CODEX_THEME`:
   - `surface`: #0B0E11, `surfaceLow`: #12161B, `surfaceHigh`: #1A1F26
   - `ink`: #EDEFF2, `inkSecondary`: #A8B0BC, `inkTertiary`: #6B7480
   - `border`: #262C34, `borderStrong`: #323A44
   - `accent`: #3CE6D8
   - `diffAdded`: #4ADE94, `diffRemoved`: #F0665E
   - `warning`: #F5B84A, `info`: #6B9FE8, `skill`: #9B7FE8
2. `CODEX_LIGHT_THEME`: Same structure, light mode values
3. `applyCodexThemeTokens()`: Add new CSS vars (`--state-pending`, `--accent-cyan`, `--accent-violet`) if referenced by components

## Risk Mitigation

| Risk                                                | Mitigation                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Componente usa `var(--color-primitive-voltage-500)` | Buscar con rg antes de PR2; si existe, reemplazar con `var(--color-accent-cyan)`           |
| Componente usa `var(--akx-violet)` de index.css     | Buscar con rg; reemplazar con `var(--color-accent-violet)`                                 |
| SettingsContext pierde sync con tokens              | Verificar en PR2 que los valores en applyCodexThemeTokens() coincidan con tokens.dtcg.json |
