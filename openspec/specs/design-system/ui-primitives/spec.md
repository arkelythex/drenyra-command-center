# Spec — ui-primitives

**Última actualización:** 2026-06-30  
**Capability:** `primitives-v3` (Modified)

## Requirements

### REQ-PRIM-001: Editorial flat surfaces

Button, Card, Panel SHALL use hairline borders and max 8px radius on CTAs, 12px on panels. No backdrop-blur on primitives.

### REQ-PRIM-002: SurfacePanel replaces glass

`SurfacePanel` SHALL be the canonical elevated surface. `GlassCard` and `LiquidGlass` SHALL re-export SurfacePanel with deprecation console warning in dev.

### REQ-PRIM-003: Primary button

Primary variant SHALL use voltage accent background with inverse text on dark; filled dark on light editorial mode.

## Scenarios

```gherkin
Given GlassCard import in new feature code
When ESLint runs with fiscal-editorial rules
Then warning or error is reported

Given Button variant primary
When rendered in web app
Then background uses --color-voltage-base or --color-primary mapped to voltage
```
