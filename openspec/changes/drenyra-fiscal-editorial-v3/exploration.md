# Exploration — Drenyra Fiscal Editorial v3

**Última actualización:** 2026-06-30  
**Change ID:** `drenyra-fiscal-editorial-v3`

## Baseline audit

### Token drift (P0)

| Source | Primary accent | Canvas |
|--------|----------------|--------|
| `packages/ui/src/styles/tokens.css` | `#B97A45` | `#0E0A08` |
| `apps/web/tokens.dtcg.json` (generated) | `#d99555` | `#100f0d` |
| `apps/web/DESIGN.md` (stale) | `#B97A45` | `#0E0A08` |

### Adoption

- ~8/340+ component files use canonical token helpers per `design-tokens-guide.md`.
- Widespread hardcoded Tailwind colors, glass blur, decorative gradients.

### Shell duplication

- `MainLayout/` — default operational shell
- `CodexShell.tsx` — agent/command-center variant with overlapping sidebar + right rail

### Critical routes for visual baseline

| Route | Purpose |
|-------|---------|
| `/dashboard` | Operational home |
| `/facturas` | Dense fiscal table |
| `/cumplimiento/sire-diff` | Diff viewer pilot |
| `/configuracion/apariencia` | Theme settings (token dialect mismatch) |

### Screenshot baseline

Manual capture required when dev server runs:

```bash
bun run dev --filter @drenyra/web
# Capture: dashboard, invoices, sire-diff, settings/appearance
```

Placeholder paths (post-capture):

- `apps/web/docs/sdd/drenyra-fiscal-editorial-v3/baseline/dashboard.png`
- `apps/web/docs/sdd/drenyra-fiscal-editorial-v3/baseline/invoices.png`
- `apps/web/docs/sdd/drenyra-fiscal-editorial-v3/baseline/sire-diff.png`
- `apps/web/docs/sdd/drenyra-fiscal-editorial-v3/baseline/appearance.png`

## Decision inputs

- User confirmed **rebrand fuerte** toward Cursor 3 editorial aesthetic.
- Product constraint: **operations-first** — sidebar/workspace/rail zones immutable.

## Files mapped

- Tokens: `apps/web/src/lib/design-tokens/`, `packages/ui/src/styles/tokens.css`
- Primitives: `packages/ui/src/components/`, `apps/web/src/components/ui/`
- Shell: `apps/web/src/components/layout/`
- Agent: `apps/web/src/components/agentic/`
- Pilot: `apps/web/src/features/sire/SireDiffPage.tsx`
