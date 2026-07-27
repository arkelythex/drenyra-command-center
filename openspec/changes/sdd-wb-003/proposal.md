# SDD-WB-003 — Universal Command & Navigation

**Wave:** A (Shell)
**Status:** 🎯 partially implemented in WB-001 PR5

The command palette with registry (command-registry.ts, default-commands.ts) was built as part of SDD-WB-001 PR5. This SDD formalizes query commands (explain variance, find entries) and execution commands with precondition checks.

**Existing implementation:** `lib/commands/command-registry.ts`, `default-commands.ts`, evolved CommandPalette.tsx
**Pending:** query command integration with workspace context, dynamic commands from agents/skills
