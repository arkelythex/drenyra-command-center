# SDD Proposal: Cierre Pipeline Flow + P0 Hero + Contextual Recommendations

**Purpose:** Replace the 8-card phase grid with a connected pipeline, make P0 blockers the dominant visual element, and convert recommendations into interactive mini-threads.

## Changes

### 1. ClosePhaseStrip → Pipeline visualization

Connected dot pipeline: ●──●──●──◐──!──○──○──○

- Phases are connected by lines showing causality
- Blocked phase gets a red ! marker
- Active phase pulses

### 2. MissionBlockers → P0 Hero

- Dominant card at the top of the workspace
- Shows: severity, evidence count, amount involved
- Action buttons: "Revisar con Drenyra" (agentic-first) + "Ver evidencia"
- Deadline/countdown if applicable

### 3. SidePanel → Contextual Tabs

Tabs: [Contexto] [Agentes] [Auditoría]

- Contexto: Shows detail of selected blocker/item
- Agentes: Agent list with status (running, completed, waiting)
- Auditoría: Timeline of recent events

### 4. CierreMensualPage reorder

- P0 Hero (MissionBlockers upgraded)
- Pipeline (ClosePhaseStrip upgraded)
- Progress + TaxReviewGate + Checklist + Timeline + Contextual SidePanel
