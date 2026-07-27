# SDD-WB-013 — Keyboard & Accessibility

**Wave:** D (Continuous Operations)
**Status:** 🎯 partially implemented

Keyboard model (useWorkspaceKeyboard.ts) and density modes (3 CSS density modes in index.css) were built as part of SDD-WB-001 PR7.

**Existing implementation:**

- `hooks/useWorkspaceKeyboard.ts` — Global shortcuts: ⌘K, ⌘B, ⌘\, ⌘`, Esc
- 3 density modes in index.css with --spacing-unit, --font-scale, --sidebar-width
- DensityProvider in contexts/

**Pending:**

- Full keyboard nav (⌘1-9 workspace switching, ⌘↑/↓ hierarchy nav)
- Screen reader announcements on pane/layout changes
- aria-live regions for activity feed
- Focus indicators on all interactive elements
- Three density modes as user preference (stored)
