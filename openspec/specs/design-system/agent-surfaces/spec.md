# Spec — agent-surfaces

**Última actualización:** 2026-06-30  
**Capability:** `agent-command-surfaces` (Modified)

## Requirements

### REQ-AGENT-001: DiffViewer v3

Inline diff viewer SHALL support stage/revert visual language inspired by Cursor 3; used in RightPanel and SIRE diff pilot.

### REQ-AGENT-002: ArtifactSidebar

Sidebar section SHALL show plans, sources, and file previews (Codex artifact pattern) within evidence rail.

### REQ-AGENT-003: Evidence by default

AI suggestions SHALL show source, impact, confidence, diff without expanding chat.

## Scenarios

```gherkin
Given SIRE diff page with proposal
When user opens evidence rail
Then DiffViewer v3 shows line-level changes with editorial tokens

Given AI recommendation with low confidence
When right rail renders
Then diff and source visible without chat interaction

Given ArtifactSidebar
When agent run completes
Then plan summary and linked files appear in sidebar artifacts section
```
