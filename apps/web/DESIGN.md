---
version: '3.0.0'
name: 'Drenyra Fiscal Editorial'
description: 'Operations-first fiscal command center — warm editorial surfaces inspired by Cursor 3, adapted for SUNAT compliance.'
colors:
  canvas-dark: '#161614'
  canvas-light: '#f7f7f4'
  ink-primary: '#e8e6e0'
  ink-inverse: '#26251e'
  accent-voltage: '#f54e00'
  accent-fiscal: '#c45c2a'
  surface-1: '#242422'
  surface-2: '#2e2e2b'
  surface-3: '#3a3a36'
  hairline-dark: 'rgba(255,255,255,0.08)'
  hairline-light: 'rgba(38,37,30,0.12)'
  success: 'oklch(0.65 0.22 150)'
  warning: 'oklch(0.75 0.22 80)'
  danger: 'oklch(0.55 0.25 25)'
  info: '#c45c2a'
typography:
  display:
    fontFamily: 'Geist, Inter, ui-sans-serif'
    fontSize: '2.25rem'
    fontWeight: 400
    lineHeight: '1.1'
    letterSpacing: '-0.03em'
  h1:
    fontFamily: 'Geist, Inter, ui-sans-serif'
    fontSize: '1.875rem'
    fontWeight: 500
    lineHeight: '1.15'
    letterSpacing: '-0.02em'
  body-md:
    fontFamily: 'Geist, Inter, ui-sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: '1.5'
  data:
    fontFamily: 'Geist Mono, JetBrains Mono, ui-monospace'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: '1.4'
rounded:
  cta: '8px'
  panel: '12px'
  sm: '6px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '16px'
  lg: '24px'
  xl: '32px'
components:
  button-primary:
    backgroundColor: '{colors.accent-voltage}'
    textColor: '#ffffff'
    rounded: '{rounded.cta}'
    padding: '10px 16px'
  button-secondary:
    backgroundColor: 'transparent'
    textColor: '{colors.ink-primary}'
    borderColor: '{colors.hairline-dark}'
    rounded: '{rounded.cta}'
    padding: '10px 16px'
  surface-panel:
    backgroundColor: '{colors.surface-1}'
    textColor: '{colors.ink-primary}'
    borderColor: '{colors.hairline-dark}'
    rounded: '{rounded.panel}'
    padding: '24px'
  ai-right-rail:
    backgroundColor: '{colors.surface-2}'
    textColor: '{colors.ink-primary}'
    rounded: '{rounded.panel}'
    padding: '16px'
---

**Última actualización**: 2026-06-30

> Contract for `apps/web` — design system aligned with the **Financial Engineering Environment (FEE)** thesis.

## Three-minute summary

| Question       | Answer                                                                        |
| -------------- | ----------------------------------------------------------------------------- |
| System name    | **Drenyra FEE Design** (evolved from Fiscal Editorial)                        |
| Inspiration    | Cursor 3 (editorial clarity), Codex App (focused execution), Linear (density) |
| Product model  | **Operations-first** — sidebar / fiscal workspace / evidence rail             |
| Tokens         | `src/lib/design-tokens/tokens.dtcg.json` → `bun tokens:generate`              |
| Primary accent | Voltage `#f54e00` — CTAs, active nav, links only (≤5% pixels)                 |
| Fiscal accent  | `#c45c2a` — SUNAT/compliance badges only                                      |

## Rules

1. **Workspace first, AI assisted** — center holds the operation; right rail holds evidence.
2. **One primary action per view** — filled voltage CTA; secondary ghost with hairline.
3. **Flat surfaces** — use `SurfacePanel`; never decorative glass blur.
4. **Money in mono** — tabular figures via `n()` / Money VO.
5. **Evidence by default** — source · impact · confidence · diff · reversibility.

## Anti-patterns (blocked)

- Decorative gradient hero backgrounds
- `backdrop-blur` on data tables or cards
- More than two accent colors per page
- Pill buttons on every control
- "Powered by AI" marketing copy in operational UI
- Heavy card drop shadows
- Layout animation without `prefers-reduced-motion` fallback
- `--ink` / `--surface` dialect in settings (use canonical `--color-text-primary`)

## Agent prompt guide

Before generating UI for Drenyra web:

1. Read this file and `docs/design/design-influences-2026.md`.
2. Use `--color-*` and `--surface-*` tokens only.
3. Prefer `@drenyra/ui` Button, Card, Panel, SurfacePanel.
4. Shell: `FiscalEditorialShell` with `operational` or `command-center` mode.

## References

- [Design influences 2026](../../docs/design/design-influences-2026.md)
- [Design influences 2026](../../docs/design/design-influences-2026.md)
- [Drenyra Product Philosophy](../../docs/products/drenyra-product-philosophy.md)
