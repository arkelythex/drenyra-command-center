# Design Influences 2026 — Drenyra Web

**Última actualización:** 2026-06-30  
**Scope:** `apps/web` Fiscal Editorial rebrand

## Purpose

Document external design references that inform Drenyra's **Fiscal Editorial** system without copying them literally. Product remains **operations-first** for Peruvian fiscal compliance.

---

## Cursor 3 (April 2026 — "Glass")

**Source:** [cursor.com/blog/cursor-3](https://cursor.com/blog/cursor-3)

| Adopt | Reject |
|-------|--------|
| Warm cream canvas `#f7f7f4` for light mode | Agent-first home replacing fiscal workspace |
| Espresso ink `#26251e` | Chat as primary navigation |
| Single voltage accent `#f54e00` | Orange used as background fill |
| Clean diff review UI | Desktop-only ultrawide breakage patterns |
| Multi-panel orchestration clarity | — |

**Translation:** Editorial calm and single-accent discipline apply to Drenyra shells and diffs. Layout zones stay operational.

---

## Codex App (OpenAI, 2026)

**Source:** [developers.openai.com/codex/app](https://developers.openai.com/codex/app)

| Adopt | Reject |
|-------|--------|
| Project sidebar + thread organization | Desktop-only assumptions |
| Sidebar artifacts (plans, sources, previews) | Chat-only workflows |
| Inline diff + stage/revert | — |
| Floating pop-out panels for review | — |
| Command palette + terminal integration | — |

**Translation:** `ArtifactSidebar`, `DiffViewerV3`, and `FiscalEditorialShell` command-center mode.

---

## Linear

| Adopt | Reject |
|-------|--------|
| Monochrome default, accent sparingly | Hiding fiscal evidence behind minimal chrome |
| Dense tables, tight type ramp | — |
| Hairline borders, no heavy shadows | — |

---

## Stripe / Vercel (via DESIGN.md ecosystem)

| Adopt | Reject |
|-------|--------|
| Precision hierarchy, one CTA | Vercel full-bleed marketing layouts in app shell |
| Semantic state colors | Stripe purple gradients in fiscal tables |

---

## Drenyra legacy (Glass & Steel)

| Keep | Retire |
|------|--------|
| DTCG token pipeline | Dual tokens packages/ui vs web |
| Right rail evidence model | Glassmorphism cards |
| Complexity / density modes | Ember/cocoa as primary accent |
| CodexShell patterns | Duplicate MainLayout + CodexShell shells |

---

## Fiscal context (non-negotiable)

Peruvian operators need: RUC scoping, SUNAT states, IGV clarity, long-session readability, audit trails. Any influence that reduces evidence visibility is rejected regardless of trend.
