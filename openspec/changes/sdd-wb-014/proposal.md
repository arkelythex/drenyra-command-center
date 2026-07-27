# SDD-WB-014 — Performance Budgets & UX Telemetry

**Wave:** A (Shell)
**Status:** 🎯 partially implemented

Performance targets were defined in CAP-WORKBENCH-00 and the keyboard model (useWorkspaceKeyboard.ts) was built. This SDD formalizes measurement, instrumentation, and enforcement.

**Performance targets:**

- Visual feedback < 100ms
- Command palette visible < 100ms
- Layout restoration < 300ms
- First agentic event < 500ms
- Grid scrolling at 60fps

**Pending:** performance.mark() instrumentation, UX telemetry events, budget enforcement CI
