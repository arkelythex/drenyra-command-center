# Phase 6 — Dead Code Cleanup Plan

## Status: PLANNED — do NOT execute until shadow execution confirms parity

After `ShadowRunner` confirms parity between `LegacyMastraRuntimeAdapter` and
`PiAgentRuntimeAdapter`, execute the following deletions.

---

## 1. Delete Mastra and AI SDK v4

### Files to delete

| File                               | LOC | Reason                                                       |
| ---------------------------------- | --- | ------------------------------------------------------------ |
| `src/mastra/session-manager.ts`    | 125 | Replaced by Pi SDK `SessionManager.inMemory()`               |
| `src/mastra/orchestrator.ts`       | 229 | Replaced by Pi SDK `createAgentSession()`                    |
| `src/mastra/domain-agent.ts`       | 195 | Replaced by `PiAgentRuntimeAdapter`                          |
| `src/mastra/supervisor.ts`         | 94  | Replaced by Pi SDK subagents                                 |
| `src/mastra/task-decomposer.ts`    | 81  | Replaced by Pi SDK subagents                                 |
| `src/mastra/intent-detector.ts`    | 225 | Replaced by Pi SDK tools/extensions                          |
| `src/mastra/latin-orchestrator.ts` | 210 | Replaced by Pi SDK delegation                                |
| `src/mastra/approval-gate.ts`      | 279 | Replaced by `@drenyra/fiscal-agent-domain` approval policies |
| `src/mastra/approval-store.ts`     | 150 | Replaced by Pi SDK session state                             |
| `src/mastra/event-bus.ts`          | 42  | Replaced by Pi SDK `session.subscribe()`                     |
| `src/mastra/result-merger.ts`      | 28  | Replaced by Pi SDK tree navigation                           |
| `src/mastra/agents/compliance/*`   | 950 | Adapt to Pi skills/tools                                     |
| `src/mastra/tools/*`               | 80  | Replace with Pi `defineTool()`                               |
| `src/mastra/workflows/*`           | 60  | Replace with Pi SDK sessions                                 |
| `src/mastra/memory/*`              | 80  | Replace with Pi SDK sessions/memory                          |

### Dependencies to remove

```diff
- "@ai-sdk/openai": "^4.0.7",
- "@mastra/core": "^1.4.0",
- "ai": "^6.0.39",
```

---

## 2. Delete harness-core runtime (keep policy)

| File                             | LOC | Action                                              |
| -------------------------------- | --- | --------------------------------------------------- |
| `src/harness-core/approval.ts`   | 132 | **KEEP** — policy logic, not runtime                |
| `src/harness-core/delegation.ts` | 229 | **ADAPT** — extract policy, delete runtime          |
| `src/harness-core/evidence.ts`   | 168 | **KEEP** — evidence is domain concept               |
| `src/harness-core/schemas.ts`    | 28  | **DELETE** — generic, unused                        |
| `src/harness-core/types.ts`      | 293 | **ADAPT** — keep domain types, delete runtime types |
| `src/harness-core/index.ts`      | 12  | **ADAPT** — re-export only retained                 |

---

## 3. Delete swarm-core (never implemented)

| File                             | LOC | Action                                |
| -------------------------------- | --- | ------------------------------------- |
| `src/swarm-core/orchestrator.ts` | 191 | **DELETE** — replaced by Pi subagents |
| `src/swarm-core/router.ts`       | 274 | **DELETE** — replaced by Pi tools     |
| `src/swarm-core/types.ts`        | 42  | **DELETE** — just interfaces          |
| `src/swarm-core/worker-pool.ts`  | 21  | **DELETE** — just interface           |

---

## 4. Delete plugin generic infrastructure

| File                          | LOC | Action                                                          |
| ----------------------------- | --- | --------------------------------------------------------------- |
| `src/plugin/registry.ts`      | 182 | **DELETE** — replaced by Pi SDK `ResourceLoader`                |
| `src/plugin/interface.ts`     | 268 | **DELETE** — replaced by Pi SDK extensions API                  |
| `src/plugin/types.ts`         | 32  | **DELETE** — replaced by Pi SDK types                           |
| `src/plugin/fiscal-plugin.ts` | 460 | **ADAPT** — move fiscal-specific logic to `fiscal-agent-domain` |

---

## 5. Delete legacy compatibility

| File                                 | LOC | Action     |
| ------------------------------------ | --- | ---------- |
| `src/legacy/agent-registry.ts`       | 28  | **DELETE** |
| `src/legacy/agent-swarm-types.ts`    | 8   | **DELETE** |
| `src/legacy/control-plane-facade.ts` | 152 | **DELETE** |
| `src/legacy/queue-manager.ts`        | 87  | **DELETE** |
| `src/legacy/index.ts`                | 8   | **DELETE** |

---

## 6. Replace HTTP server with Pi RPC mode

| File           | LOC | Action                                                     |
| -------------- | --- | ---------------------------------------------------------- |
| `src/serve.ts` | 345 | **DELETE** — replaced by Pi SDK RPC mode (`pi --mode rpc`) |

---

## 7. Delete kernel types

| File                  | LOC | Action     |
| --------------------- | --- | ---------- |
| `src/kernel/types.ts` | 9   | **DELETE** |

---

## 8. Estimated reduction

```
Before cleanup (Phase 5 complete):
  @drenyra/pi LOC:          ~31,766
  @drenyra/pi-adapter LOC:   ~1,100
  @drenyra/fiscal-agent-domain LOC: ~700

After cleanup:
  @drenyra/pi LOC:          ~18,000  (domain + adapted)
  @drenyra/pi-adapter LOC:   ~1,100  (port + adapter + shadow)
  @drenyra/fiscal-agent-domain LOC: ~700   (pure domain types)

Total reduction: ~14,000 LOC (44% of original)
```

---

## Execution checklist

- [ ] Run `ShadowRunner` on R0, R1, R2 scenarios
- [ ] Fix any mismatches found by shadow execution
- [ ] Delete Mastra runtime files
- [ ] Delete swarm-core
- [ ] Delete plugin generic infrastructure
- [ ] Delete legacy compatibility
- [ ] Delete serve.ts
- [ ] Run full test suite — expect 558+ tests passing
- [ ] Run typecheck — expect no errors from new packages
- [ ] Commit deletion as single cleanup commit
- [ ] Remove `@ai-sdk/openai`, `@mastra/core`, `ai` v6 from package.json
- [ ] Final `bun install` to remove unused dependencies
