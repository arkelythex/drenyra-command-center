# Spec — app-shell

**Última actualización:** 2026-06-30  
**Capability:** `fiscal-editorial-shell` (New)

## Requirements

### REQ-SHELL-001: Unified shell

`FiscalEditorialShell` SHALL replace duplicated layout logic in MainLayout and CodexShell. CodexShell SHALL re-export FiscalEditorialShell with `mode="command-center"`.

### REQ-SHELL-002: Three zones

Sidebar (operational nav), central workspace, evidence right rail — unchanged semantics per operations-first doc.

### REQ-SHELL-003: Responsive

Mobile SHALL use bottom nav without glass blur stack. Sidebar overlay on tablet/mobile preserved.

## Scenarios

```gherkin
Given route /dashboard
When page loads
Then FiscalEditorialShell operational mode renders sidebar + workspace

Given route using CodexShell
When page loads
Then same shell component with command-center mode is used

Given viewport width < 1024px
When sidebar opens
Then overlay backdrop appears without decorative blur on workspace content
```
