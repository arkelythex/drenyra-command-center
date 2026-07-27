# SDD-WB-002 — Persistent Pane & Layout System

**Wave:** A (Shell)
**Status:** 🎯 partially implemented in WB-001 PR6

The dynamic pane system (Pane, PaneContainer, ResizeHandle) was built as part of SDD-WB-001 PR6. This SDD formalizes it as a separate capability for multi-pane layouts, drag-to-reorder, and full persistence.

**Existing implementation:** `components/workbench/Pane.tsx`, `PaneContainer.tsx`, `ResizeHandle.tsx`
**Pending:** pane reorder (drag & drop), multi-workspace layout sync, pane type registry
