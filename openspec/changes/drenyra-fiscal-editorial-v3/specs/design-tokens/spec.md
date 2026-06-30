# Spec — design-tokens-core

**Última actualización:** 2026-06-30  
**Capability:** `design-tokens-core` (Modified)

## Requirements

### REQ-TOK-001: Single source of truth

`apps/web/src/lib/design-tokens/tokens.dtcg.json` SHALL be the only authoritative color definition. `packages/ui` SHALL reference the same semantic variables.

### REQ-TOK-002: Fiscal Editorial palette

Dark canvas `#161614`, light canvas `#f7f7f4`, voltage accent `#f54e00`, fiscal accent `#c45c2a`.

### REQ-TOK-003: Primitive naming

Legacy `onyx-*` aliases MAY remain for compatibility; new docs use `espresso-*`. Legacy `blue-500` accent SHALL alias to `voltage-500`.

### REQ-TOK-004: WCAG AA

Body text pairs SHALL meet 4.5:1 contrast on dark and light canvases (enforced by `contrast.test.ts`).

## Scenarios

```gherkin
Given tokens.dtcg.json is updated
When bun tokens:generate runs (or generated files are synced)
Then packages/ui and web render identical primary button colors

Given theme dark editorial
When user views invoice table body text
Then contrast ratio >= 4.5:1 against canvas

Given accent voltage token
When used on a full page background
Then ESLint design-tokens rule flags violation
```
