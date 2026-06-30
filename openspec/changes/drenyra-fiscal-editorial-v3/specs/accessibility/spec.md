# Spec — accessibility

**Última actualización:** 2026-06-30  
**Capability:** `lint-enforcement` + a11y

## Requirements

### REQ-A11Y-001: Reduced motion

Layout animations in agent panels SHALL respect `prefers-reduced-motion`; only semantic spinners allowed.

### REQ-A11Y-002: Focus visible

All interactive primitives SHALL expose `focus-visible` ring using voltage accent at 2px.

### REQ-A11Y-003: Settings token parity

Settings appearance page SHALL use same CSS variables as main shell (no `--ink` dialect).

## Scenarios

```gherkin
Given prefers-reduced-motion: reduce
When user opens agent right panel
Then no Framer layout animation runs

Given settings appearance route
When user toggles light editorial theme
Then --color-text-primary matches shell token values

Given keyboard user tabbing through shell
When focus moves to primary button
Then focus ring is visible with sufficient contrast
```
