# Phase 0 — Lexori Audit + CI Guardrail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify Lexori resolves SUNAT/NIIF/PCGE rules once per case with identical citations across sub-agents, and add a CI guardrail preventing forbidden English/orchestration terms in user-facing UI copy.

**Architecture:** Two independent tasks — (1) an audit/investigation of the Lexori resolution pipeline, (2) a utility script for CI. They can run in parallel.

**Tech Stack:** TypeScript, Bun, Node.js glob/fs for CI script

## Global Constraints

- All new code must pass `bun run typecheck` before commit
- CI script must `process.exit(1)` on forbidden terms found
- Lexori audit is investigation-only — no code changes unless divergence is found

---

## File Structure

### New files
- `scripts/ci/check-forbidden-terms.ts` — scans `.tsx`/`.ts` files in `apps/web/src/` for forbidden terms in JSX string literals

### No new files for Lexori audit (investigation only)
- But may create `docs/superpowers/audits/2026-07-06-lexori-resolution-audit.md` if divergence found

### Modified files
- `package.json` — add `"ci:forbidden-terms"` script entry

---

### Task 1: Create CI forbidden-terms guardrail script

**Files:**
- Create: `scripts/ci/check-forbidden-terms.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `apps/web/src/` files (read-only scan)
- Produces: exit code 0 (clean) or 1 (terms found), prints report to stdout

- [ ] **Step 1: Create scripts/ci/ directory**

```bash
mkdir -p scripts/ci
```

- [ ] **Step 2: Create the check script**

```typescript
#!/usr/bin/env bun
/**
 * check-forbidden-terms.ts
 *
 * CI guardrail: scans apps/web/src/ for forbidden English/orchestration-internal
 * terms in JSX string literals. Fails the build if any are found outside
 * allowed locations (route paths, code comments, test files, copy registry).
 */

import { readFileSync } from "node:fs";
import { globSync } from "glob";

const FORBIDDEN_TERMS = [
  // English status labels that expose orchestration internals
  { term: "idle", context: "jsx-string", message: "Use Spanish equivalent ('inactivo', 'esperando', or a progress-based label)" },
  { term: "Idle", context: "jsx-string", message: "Use Spanish equivalent" },
  // Internal component names leaking to UI
  { term: "Swarm", context: "code", message: "Internal orchestration concept — do not expose in UI" },
  { term: "swarm", context: "code", message: "Internal orchestration concept" },
  { term: "Worktree", context: "code", message: "Developer concept — not for user UI" },
  { term: "worktree", context: "code", message: "Developer concept — not for user UI" },
  { term: "Cognitive", context: "code", message: "Internal component name — use 'Inteligencia' or context-specific term" },
  { term: "cognitive", context: "code", message: "Internal component name" },
  { term: "Orchestrator", context: "code", message: "Internal system concept" },
  { term: "orchestrator", context: "code", message: "Internal system concept" },
  { term: "Pipeline", context: "code", message: "Technical concept — not for user UI" },
  { term: "pipeline", context: "code", message: "Technical concept — not for user UI" },
  { term: "Hub", context: "code", message: "Internal component name" },
  { term: "hub", context: "code", message: "Internal component name" },
  { term: "Gateway", context: "code", message: "Internal component name" },
  { term: "gateway", context: "code", message: "Internal component name" },
] as const;

const ALLOWED_PATTERNS = [
  // Route paths — allowed to contain these as URL segments
  /\/drenyra\/control-tower/,
  /\/drenyra\/hub/,
  /routeTree/,
  // Copy registry file — central location for approved translations
  /i18n/,
  /locales/,
  /translations/,
  // Test files — orchestration terms may appear in test descriptions
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  // Type definitions — orchestration types are allowed in .ts
  /\.d\.ts$/,
  // The CI script itself
  /check-forbidden-terms\.ts$/,
];

interface Violation {
  file: string;
  line: number;
  term: string;
  message: string;
}

function isAllowed(path: string): boolean {
  return ALLOWED_PATTERNS.some((pattern) => pattern.test(path));
}

function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comments
    if (line.trimStart().startsWith("//") || line.trimStart().startsWith("/*") || line.trimStart().startsWith("*")) {
      continue;
    }

    for (const { term, context, message } of FORBIDDEN_TERMS) {
      if (!line.includes(term)) continue;

      // For JSX context terms, verify we're in a display context (not code)
      if (context === "jsx-string") {
        const inDisplayContext = line.includes(`>${term}<`) ||
          line.includes(`{${term}}`) ||
          line.includes(`"${term}"`) ||
          line.includes(`'${term}'`);
        if (!inDisplayContext) continue;
      }

      violations.push({ file: filePath, line: lineNum, term, message });
    }
  }

  return violations;
}

function main(): void {
  const files = globSync("apps/web/src/**/*.{tsx,ts}", {
    ignore: ["**/node_modules/**", "**/routeTree.gen.ts", "**/routeTree.gen.ts/*"],
  });

  let allViolations: Violation[] = [];

  for (const file of files) {
    if (isAllowed(file)) continue;
    const violations = scanFile(file);
    allViolations = allViolations.concat(violations);
  }

  if (allViolations.length > 0) {
    console.error("❌ Forbidden terms found in user-facing code:\n");
    for (const v of allViolations) {
      console.error(`  ${v.file}:${v.line} — "${v.term}"`);
      console.error(`    ${v.message}`);
    }
    console.error(`\nTotal: ${allViolations.length} violation(s)`);
    process.exit(1);
  }

  console.log("✅ No forbidden terms found in user-facing code.");
  process.exit(0);
}

main();
```

- [ ] **Step 3: Verify it runs and produces output**

Run: `bun run scripts/ci/check-forbidden-terms.ts`
Expected: Reports either violations found or clean — should not crash with runtime error

- [ ] **Step 4: Add script to package.json**

Edit `package.json` scripts section:

Add after the existing `ci:depcheck` line:
```
"ci:forbidden-terms": "bun scripts/ci/check-forbidden-terms.ts",
```

- [ ] **Step 5: Verify package script works**

Run: `bun run ci:forbidden-terms`
Expected: Same output as step 3

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "ci: add forbidden-terms guardrail for UI copy

- Scans apps/web/src/ for English/orchestration-internal terms
- Fails build if terms appear in JSX string literals outside allowed locations
- Phase 0 of agentic migration"
```

---

### Task 2: Lexori resolution audit

**Files:** No files to create or modify — this is an investigation task.

**Interfaces:**
- Consumes: Lexori resolution pipeline in `packages/agents/src/`, `packages/domain/src/drenyra/skills-types.ts`, regulation tracker agents
- Produces: Audit report either confirming single-resolution or identifying divergence

- [ ] **Step 1: Map the Lexori resolution flow**

Trace the path of a regulation citation from request to sub-agent:

1. **Entry point:** `LexoriSkillDefinition` in `packages/domain/src/drenyra/skills-types.ts` defines the schema
2. **Resolution:** `renderLexoriSkillContext()` renders a context template with variables — this creates the citation text
3. **Consumption:** Each sub-agent (Validador SIRE, Contabilizador, etc.) calls `renderLexoriSkillContext()` with their own `variables` object
4. **Key question:** Is there a session-level cache or does each sub-agent re-resolve?

Check:
- `packages/agents/src/mastra/agents/compliance/` — regulation-tracker.agent.ts has `sunatRegulations` as a constant array, each sub-agent iterates independently
- `packages/drenyra-orchestrator/src/mastra/agents/compliance/` — same pattern, duplicated across packages

- [ ] **Step 2: Check for session-level cache**

Search for caching patterns around Lexori resolution:

```bash
grep -r "cache\|memoize\|Map\|session" --include="*.ts" packages/agents/src/ | grep -i "lexori\|regulation\|norma\|skill" | head -20
```

Expected findings:
- Likely NO session-level cache (each sub-agent calls `renderLexoriSkillContext` independently)
- `sunatRegulations` is re-iterated by each sub-agent via `regulationTrackerPort.execute()`
- The system likely re-resolves the same citation for each sub-agent

- [ ] **Step 3: Instrument a test case**

Find or create a test case that exercises 3+ sub-agents on the same case:

```bash
# Find existing integration tests
grep -r "regulation-tracker\|Validador SIRE\|Contabilizador" --include="*.test.*" --include="*.spec.*" packages/ | head -10
```

If no existing test:
- Spawn a manual test by adding temporary logging at:
  - `renderLexoriSkillContext()` in `packages/domain/src/drenyra/skills-types.ts`
  - `regulationTrackerPort.execute()` in both agent packages

- [ ] **Step 4: Compare citations across sub-agents**

Run the test case and collect:
1. The rendered context each sub-agent receives
2. The regulation IDs each sub-agent resolves
3. Are they byte-identical? If not, what's the delta?

Document findings in a structured format:
```
Case: [case ID or description]
Sub-agents involved: [list]
Citations received:
  - Validador SIRE: [hash or first 50 chars]
  - Contabilizador: [hash or first 50 chars]
  - Gestor Evidencia: [hash or first 50 chars]
Divergence: YES/NO
If YES, delta: [description of difference]
```

- [ ] **Step 5: Document outcome**

**If CLEAN (all sub-agents receive identical citations):**
- Write conclusion to Phase 0 gate log
- No code changes needed
- Proceed to Phase 1

**If DIVERGENCE FOUND:**
- Create `docs/superpowers/audits/2026-07-06-lexori-resolution-audit.md`
- Document the specific regulation, sub-agents involved, and the delta
- Fix: add a session-level cache in the Geavon orchestrator that:
  1. On first regulation resolution for a case, stores the result
  2. On subsequent resolutions for the same case, returns cached citation
  3. Invalidates cache if case context changes (RUC, period, regimenTributario)

- [ ] **Step 6: Gate verification**

Run: `bun run ci:forbidden-terms`
Expected: Pass (0 violations)

Confirm Phase 0 gate passes:
- Lexori audit complete with documented outcome
- CI guardrail active and passing

```bash
git add -A && git commit -m "feat: complete Phase 0 — Lexori audit + CI guardrail"
```
