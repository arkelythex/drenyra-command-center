# Phase 2 — Right Panel: Artifact Feed

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current right panel (ChatContextPanel — single artifact preview + pinned artifacts) with a chronological artifact feed showing all artifacts generated during the current session.

**Architecture:** Create `ArtifactFeed` component that reads all `CognitiveMessage.artifacts` from the chat messages array and displays them as a chronological feed. Replace ChatContextPanel usage in `DrenyraCommandCenter` with the new feed component.

**Tech Stack:** React 19 + Tailwind CSS 4 + Vitest

## Global Constraints

- Use existing `HubArtifact` type from `packages/shared/src/artifacts/types.ts` (17-type discriminated union)
- Artifact feed is the **ephemeral session view** — `ledger` and `evidence` remain as full-board views via sidebar (no changes to those routes)
- Each artifact displays its type badge, title, summary, and timestamp
- Follow existing Tailwind 4 patterns (CSS variables)
- New components get at least one test file
- `ChatContextPanel` stays in the codebase (not deleted) — it's simply replaced in the render. The component can be cleaned up in a later phase.

---

### Task 1: Create ArtifactFeed component

**Files:**
- Create: `apps/web/src/features/drenyra-command-center/components/ArtifactFeed/ArtifactFeed.tsx`
- Create: `apps/web/src/features/drenyra-command-center/components/ArtifactFeed/ArtifactFeedCard.tsx`
- Create: `apps/web/src/features/drenyra-command-center/components/ArtifactFeed/ArtifactFeed.data.ts`
- Test: `apps/web/src/features/drenyra-command-center/components/ArtifactFeed/__tests__/ArtifactFeed.test.tsx`
- Test: `apps/web/src/features/drenyra-command-center/components/ArtifactFeed/__tests__/ArtifactFeedCard.test.tsx`

**Interfaces:**
- Consumes: `CognitiveMessage` (with `artifacts: HubArtifact[]`) from `@/features/cognitive-hub/types/hub.types`
- Consumes: `HubArtifact` from `@drenyra/shared/artifacts/types` (or `@/features/cognitive-hub/types/hub.types`)
- Produces: `ArtifactFeed` component, `ArtifactFeedCard` component, `collectArtifacts(messages)` helper

- [ ] **Step 1: Write the failing tests**

```tsx
// apps/web/src/features/drenyra-command-center/components/ArtifactFeed/__tests__/ArtifactFeedCard.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArtifactFeedCard } from "../ArtifactFeedCard";
import type { HubArtifact } from "@drenyra/shared/artifacts";

describe("ArtifactFeedCard", () => {
  it("renders artifact title", () => {
    const artifact: HubArtifact = {
      id: "a1",
      title: "Invoice #001-23456",
      type: "explanation",
      content: "This invoice was processed successfully",
    };
    render(<ArtifactFeedCard artifact={artifact} />);
    expect(screen.getByText("Invoice #001-23456")).toBeTruthy();
  });

  it("renders type badge for accounting_diff", () => {
    const artifact: HubArtifact = {
      id: "a2",
      title: "Diff de conciliación",
      type: "accounting_diff",
      payload: { command: "reconcile", scope: "banking", diffs: [] },
    };
    render(<ArtifactFeedCard artifact={artifact} />);
    expect(screen.getByText(/accounting_diff/)).toBeTruthy();
  });

  it("shows summary for sheet_diff artifacts", () => {
    const artifact: HubArtifact = {
      id: "a3",
      title: "Sheet Diff",
      type: "sheet_diff",
      payload: {
        command: "diff",
        sourceName: "ledger.xlsx",
        acceptShortcut: "Ctrl+Enter",
        rows: [],
        summary: { total: 150, updated: 12, flagged: 3 },
      },
    };
    render(<ArtifactFeedCard artifact={artifact} />);
    expect(screen.getByText(/150/)).toBeTruthy();
    expect(screen.getByText(/12 actualizados/)).toBeTruthy();
  });

  it("renders nothing when artifact has no title and no content", () => {
    const artifact: HubArtifact = {
      id: "a4",
      title: "",
      type: "explanation",
      content: "",
    };
    const { container } = render(<ArtifactFeedCard artifact={artifact} />);
    expect(container.innerHTML).toBe("");
  });
});
```

```tsx
// apps/web/src/features/drenyra-command-center/components/ArtifactFeed/__tests__/ArtifactFeed.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArtifactFeed } from "../ArtifactFeed";
import type { CognitiveMessage } from "@/features/cognitive-hub/types/hub.types";

describe("ArtifactFeed", () => {
  it("shows empty state when no messages have artifacts", () => {
    const messages: CognitiveMessage[] = [
      {
        id: "m1",
        role: "user",
        content: "Hello",
        timestamp: new Date(),
      },
      {
        id: "m2",
        role: "assistant",
        content: "Hi there",
        timestamp: new Date(),
      },
    ];
    render(<ArtifactFeed messages={messages} />);
    expect(screen.getByText(/Sin artifacts/)).toBeTruthy();
  });

  it("renders artifacts from messages in chronological order", () => {
    const messages: CognitiveMessage[] = [
      {
        id: "m1",
        role: "user",
        content: "Process invoice",
        timestamp: new Date("2026-01-01T10:00:00"),
      },
      {
        id: "m2",
        role: "assistant",
        content: "Done",
        timestamp: new Date("2026-01-01T10:01:00"),
        artifacts: [
          {
            id: "a1",
            title: "Invoice result",
            type: "explanation",
            content: "Processed successfully",
          },
        ],
      },
    ];
    render(<ArtifactFeed messages={messages} />);
    expect(screen.getByText("Invoice result")).toBeTruthy();
    expect(screen.queryByText(/Sin artifacts/)).toBeNull();
  });

  it("collects artifacts from multiple messages", () => {
    const messages: CognitiveMessage[] = [
      {
        id: "m1",
        role: "assistant",
        content: "Step 1",
        timestamp: new Date("2026-01-01T10:00:00"),
        artifacts: [{ id: "a1", title: "First", type: "explanation", content: "ok" }],
      },
      {
        id: "m2",
        role: "assistant",
        content: "Step 2",
        timestamp: new Date("2026-01-01T10:02:00"),
        artifacts: [{ id: "a2", title: "Second", type: "chart", payload: { data: [1, 2] } }],
      },
    ];
    render(<ArtifactFeed messages={messages} />);
    expect(screen.getByText("First")).toBeTruthy();
    expect(screen.getByText("Second")).toBeTruthy();
  });
});
```

Run: `cd apps/web && bun run test -- src/features/drenyra-command-center/components/ArtifactFeed/`
Expected: FAIL — modules not found

- [ ] **Step 2: Create ArtifactFeed.data.ts**

```ts
// apps/web/src/features/drenyra-command-center/components/ArtifactFeed/ArtifactFeed.data.ts
import type { HubArtifact } from "@drenyra/shared/artifacts";
import type { CognitiveMessage } from "@/features/cognitive-hub/types/hub.types";

/**
 * Collect all artifacts from messages, preserving chronological order.
 * Each artifact record includes the source message timestamp for ordering.
 */
export interface ArtifactFeedEntry {
  artifact: HubArtifact;
  messageTimestamp: Date;
}

export function collectArtifacts(
  messages: CognitiveMessage[],
): ArtifactFeedEntry[] {
  const entries: ArtifactFeedEntry[] = [];
  for (const msg of messages) {
    if (!msg.artifacts || msg.artifacts.length === 0) continue;
    for (const artifact of msg.artifacts) {
      entries.push({ artifact, messageTimestamp: msg.timestamp });
    }
  }
  return entries;
}

/**
 * Human-readable summary for common artifact types.
 */
export function artifactSummary(artifact: HubArtifact): string {
  switch (artifact.type) {
    case "accounting_diff":
      return `${artifact.payload.diffs.length} cambios propuestos`;
    case "sheet_diff":
      return `${artifact.payload.summary.total} registros (${artifact.payload.summary.updated} actualizados, ${artifact.payload.summary.flagged} flagged)`;
    case "dashboard": {
      const pm = artifact.payload.primaryMetric;
      return `${pm.value} (${pm.trend}) — Score: ${artifact.payload.statusScore}%`;
    }
    case "simulation":
      return `${artifact.payload.entries.length} asientos simulados`;
    case "comparison":
      return `${artifact.payload.scenarios.length} escenarios`;
    case "banking_reconciliation":
      return `${artifact.payload.rows.length} movimientos (Diff: ${artifact.payload.summary.totalDifference})`;
    case "bills_payable":
      return `${artifact.payload.summary.count} cuentas ($${artifact.payload.summary.totalPending} pendiente)`;
    case "cashflow_projection":
      return `${artifact.payload.projections.length} períodos proyectados`;
    case "tax_summary":
      return `${artifact.payload.rows.length} tributos ($${artifact.payload.summary.totalPayable} a pagar)`;
    case "payroll_summary":
      return `${artifact.payload.summary.employeeCount} empleados ($${artifact.payload.summary.totalNetPay} neto)`;
    default:
      return "";
  }
}

/**
 * Type badge color mapping.
 */
export const ARTIFACT_TYPE_COLORS: Record<string, string> = {
  explanation: "bg-blue-500/10 text-blue-500",
  chart: "bg-purple-500/10 text-purple-500",
  table: "bg-cyan-500/10 text-cyan-500",
  action_card: "bg-amber-500/10 text-amber-500",
  simulation: "bg-violet-500/10 text-violet-500",
  comparison: "bg-indigo-500/10 text-indigo-500",
  accounting_diff: "bg-orange-500/10 text-orange-500",
  sheet_diff: "bg-orange-500/10 text-orange-500",
  banking_reconciliation: "bg-emerald-500/10 text-emerald-500",
  bills_payable: "bg-rose-500/10 text-rose-500",
  cashflow_projection: "bg-teal-500/10 text-teal-500",
  tax_summary: "bg-red-500/10 text-red-500",
  payroll_summary: "bg-pink-500/10 text-pink-500",
  dashboard: "bg-sky-500/10 text-sky-500",
  search_result: "bg-gray-500/10 text-gray-500",
  report: "bg-neutral-500/10 text-neutral-500",
  knowledge_graph: "bg-lime-500/10 text-lime-500",
};
```

- [ ] **Step 3: Create ArtifactFeedCard component**

```tsx
// apps/web/src/features/drenyra-command-center/components/ArtifactFeed/ArtifactFeedCard.tsx
import type { HubArtifact } from "@drenyra/shared/artifacts";
import { ARTIFACT_TYPE_COLORS, artifactSummary } from "./ArtifactFeed.data";

interface ArtifactFeedCardProps {
  artifact: HubArtifact;
}

export function ArtifactFeedCard({ artifact }: ArtifactFeedCardProps) {
  // Skip empty artifacts — those with no title and no content
  const isEmpty =
    !artifact.title &&
    (artifact.type === "explanation" ? !artifact.content : true);
  if (isEmpty) return null;

  const badgeColor =
    ARTIFACT_TYPE_COLORS[artifact.type] ?? "bg-gray-500/10 text-gray-500";
  const summary = artifactSummary(artifact);

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${badgeColor}`}>
          {artifact.type}
        </span>
      </div>

      {artifact.title && (
        <p className="text-xs font-bold text-[var(--text-primary)] truncate">
          {artifact.title}
        </p>
      )}

      {summary && (
        <p className="text-2xs text-[var(--text-tertiary)] line-clamp-2">
          {summary}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create ArtifactFeed component**

```tsx
// apps/web/src/features/drenyra-command-center/components/ArtifactFeed/ArtifactFeed.tsx
import type { CognitiveMessage } from "@/features/cognitive-hub/types/hub.types";
import { collectArtifacts, type ArtifactFeedEntry } from "./ArtifactFeed.data";
import { ArtifactFeedCard } from "./ArtifactFeedCard";

interface ArtifactFeedProps {
  messages: CognitiveMessage[];
}

export function ArtifactFeed({ messages }: ArtifactFeedProps) {
  const entries: ArtifactFeedEntry[] = collectArtifacts(messages);

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-2xs text-[var(--text-tertiary)]">
          Sin artifacts en esta sesión
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mb-4 flex items-center gap-2">
        <p className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
          Artefactos ({entries.length})
        </p>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => (
          <ArtifactFeedCard key={entry.artifact.id} artifact={entry.artifact} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/web && bun run test -- src/features/drenyra-command-center/components/ArtifactFeed/`
Expected: PASS (7 tests: 4 for ArtifactFeedCard, 3 for ArtifactFeed)

- [ ] **Step 6: Run typecheck**

Run: `cd apps/web && bun run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/features/drenyra-command-center/components/ArtifactFeed/
git commit -m "feat(command-center): add ArtifactFeed component and helpers"
```

---

### Task 2: Replace ChatContextPanel with ArtifactFeed

**Files:**
- Modify: `apps/web/src/features/drenyra-command-center/components/DrenyraCommandCenter.tsx` — replace `ChatContextPanel` with `ArtifactFeed`
- Modify: `apps/web/src/features/drenyra-command-center/components/DrenyraCommandCenter.tsx` — pass messages to ArtifactFeed

**Interfaces:**
- Consumes: `ArtifactFeed` from Task 1
- Consumes: `messages` from `useChatHistory` (already available in DrenyraCommandCenter scope)

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/features/drenyra-command-center/__tests__/ArtifactFeedIntegration.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArtifactFeed } from "../components/ArtifactFeed/ArtifactFeed";
import type { CognitiveMessage } from "@/features/cognitive-hub/types/hub.types";

// Integration test: verify ArtifactFeed works with realistic message data
describe("ArtifactFeed integration", () => {
  it("renders artifacts from typical session messages", () => {
    const messages: CognitiveMessage[] = [
      {
        id: "m1",
        role: "user",
        content: "Revisa la factura 001-23456",
        timestamp: new Date("2026-01-01T10:00:00"),
      },
      {
        id: "m2",
        role: "assistant",
        content: "Aquí está el resultado del análisis:",
        timestamp: new Date("2026-01-01T10:01:00"),
        artifacts: [
          {
            id: "a1",
            title: "Factura 001-23456",
            type: "explanation",
            content: "Documento procesado exitosamente. IGV: S/ 45.00.",
          },
        ],
      },
      {
        id: "m3",
        role: "assistant",
        content: "Previsualización de asientos:",
        timestamp: new Date("2026-01-01T10:02:00"),
        artifacts: [
          {
            id: "a2",
            title: "Simulación de asientos contables",
            type: "simulation",
            payload: {
              entries: [
                { account: "70111", debit: 295, credit: 0 },
                { account: "40111", debit: 0, credit: 45 },
              ],
            },
          },
        ],
      },
    ];

    render(<ArtifactFeed messages={messages} />);
    expect(screen.getByText("Factura 001-23456")).toBeTruthy();
    expect(screen.getByText("Simulación de asientos contables")).toBeTruthy();
    expect(screen.getByText(/2 asientos simulados/)).toBeTruthy();
  });
});
```

Run: `cd apps/web && bun run test -- src/features/drenyra-command-center/__tests__/ArtifactFeedIntegration.test.tsx`
Expected: PASS (ArtifactFeed already works from Task 1)

- [ ] **Step 2: Replace ChatContextPanel in DrenyraCommandCenter**

Edit `apps/web/src/features/drenyra-command-center/components/DrenyraCommandCenter.tsx`:

Replace the import:
```tsx
// Remove:
// import { ChatContextPanel } from "./ChatContextPanel/ChatContextPanel";

// Add:
import { ArtifactFeed } from "./ArtifactFeed/ArtifactFeed";
```

Replace the `rightPanelContent` variable (around line 277-288):

Before:
```tsx
const rightPanelContent = (
  <ChatContextPanel
    context={chatContext}
    activeArtifact={chatLastArtifact}
    caseDetails={details ?? null}
    pendingApprovalsCount={
      details?.approvals.filter((a) => a.status === "PENDING").length ?? 0
    }
    isStreaming={chatStreaming}
    pinnedArtifacts={pinnedArtifacts}
  />
);
```

After:
```tsx
const rightPanelContent = (
  <div className="border-l border-[var(--border-subtle)] bg-[var(--surface-2)] p-4 overflow-y-auto">
    <ArtifactFeed messages={messages} />
  </div>
);
```

The `messages` variable already exists from the `useChatHistory` hook call. The removal of ChatContextPanel means we no longer need `chatContext`, `chatLastArtifact`, or `pinnedArtifacts` for the right panel — but keep them for any other dependencies in the component.

- [ ] **Step 3: Run existing tests to verify nothing broke**

Run: `cd apps/web && bun run test -- src/features/drenyra-command-center/`
Expected: All tests pass (existing + new integration test)

- [ ] **Step 4: Run typecheck**

Run: `cd apps/web && bun run typecheck`
Expected: PASS (may need to remove unused imports for chatContext/chatLastArtifact in DrenyraCommandCenter)

- [ ] **Step 5: Run CI guardrail**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/Drenyra
node --experimental-transform-types scripts/ci/check-forbidden-terms.ts \
  --exceptions-file scripts/ci/forbidden-terms-exceptions.json
```
Expected: ✅ Clean — no new violations

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/drenyra-command-center/components/DrenyraCommandCenter.tsx \
       apps/web/src/features/drenyra-command-center/__tests__/ArtifactFeedIntegration.test.tsx
git commit -m "feat(command-center): replace right panel with ArtifactFeed"
```
