# Design Benchmark October 2026 — Drenyra Web

**Last updated:** 2026-10-25
**Scope:** `apps/web` desktop and mobile shell, design tokens
**Feature:** `odd/tasks/web-ux-system.md` (T2, specs S3, S4, S8, S10, S11)

## Purpose

Turn the references the owner asked for into concrete, testable decisions: adopt, adapt or reject. References inform Drenyra; they are never copied. Drenyra stays an operations-first tool for Peruvian accountants (RUC, S/, IGV, SUNAT/SIRE, PLAME, monthly close).

> Rule: a pattern is adopted only if it reduces the work of closing a period or makes a decision safer. Novelty alone is not a reason.

## 1. Palette source of truth: dreamcoder-dots

The owner's themes live in `dreamcoder-dots/DreamcoderThemes/dreamcoder/tokens.json`, the single source every app theme is generated from. Drenyra must consume it the same way: generated, never hand-copied.

| Role | Dreamcoder Dark ("Anthracite Steel") | Dreamcoder Light ("Cocoa/Lúcuma") |
|---|---|---|
| Canvas | `#000000` (canvas only) | `#f3eadc` |
| Surface 0 / raised | `#0B0B0B` | `#fff7ea` |
| Surface 1 / panel | `#0D0D0F` | `#decbb1` |
| Surface 2 | `#1F1F1F` | `#c8ad89` |
| Text | `#E6E6E6` | `#17120d` |
| Muted text | `#C7C7C7` | `#352e22` |
| Accent | `#A5B4FC` | `#824f16` |
| Focus | `#3B82F6` | `#0f6570` |
| Success / warning / error / info | `#34D399` / `#FBBF24` / `#FB8585` / `#7DD3FC` | `#315b31` / `#654300` / `#842f24` / `#0d4a68` |

Current state: Drenyra's light theme already matches Dreamcoder Light. Its dark theme ("Ember Noir", warm `#100f0d`) predates the Anthracite Steel migration and must be replaced. Contrast gates from tokens.json apply (WCAG AA 4.5 minimum, APCA body Lc 75 light / Lc 50 dark).

Decision: **adopt** both themes through a generator script that reads `tokens.json` and writes Drenyra's CSS variables (T3).

## 2. Desktop references (verified October 2026)

| Pattern | Source | Decision for Drenyra |
|---|---|---|
| Sidebar sessions grouped and sorted, nested, "needs attention" marker | Claude desktop changelog 2026-10-15/20; Codex app 2026-10-07 | **Adapt**: group work by RUC › period; mark periods that need a decision (IGV, SIRE). |
| ⌘K command menu, rebindable shortcuts, ⌘B toggles sidebar | Codex commands doc; Claude 2026-09-24 | **Adopt** ⌘K (exists as CommandPalette) and ⌘B. |
| Approvals as cards inside the conversation, not above the composer | Claude 2026-10-15 | **Adopt** for journal entries and SIRE proposals. |
| Return approves / Esc declines | Codex | **Reject for irreversible SUNAT actions** (PDT 621, PLAME, SIRE replacement): explicit button and confirmation only, as Claude 2026-10-22 does for notifications. |
| Live plan box while the agent works, recap with next-step buttons | Claude 2026-10-15/22 | **Adopt** for the monthly close mission (Ventas → Compras SIRE → bank → IGV/Renta → PLAME → lock). |
| Session rail of context cards (environment, sources, outputs, changes) | Claude 2026-10-15 | **Adapt** the right inspector: RUC and regime, sources (SUNAT, banks, XML), outputs (PLE, reports), proposed changes. |
| Queue or steer messages while the agent works; Tab-to-draft suggestions never auto-send | Claude 2026-09-10; Codex 2026-10-09 | **Adopt** in the Ask Drenyra composer; suggestions opt-in. |
| Review pane with scopes and per-line accept/revert | Codex code review doc | **Adapt** for proposed journal entries (scope: turn, period, document). |
| Free drag-and-drop pane grid | Claude desktop 2026-04 | **Reject**: conflicts with a calm layout; offer 2–3 fixed layouts. |

## 3. Fintech references

| Pattern | Source | Decision |
|---|---|---|
| Locked periods; agent edits become reviewable proposals | Digits Write MCP, 2026-10-15 | **Adopt**: a closed period locks; later changes become proposals with their tax impact. |
| AI actions reuse existing approval rules and limits | Mercury Command, 2026-06-16 | **Adopt** for payments and detracciones. |
| One typeface, one accent, neutral surfaces, no shadows | Digits, Mercury, Ramp brand tokens (2026-10-25) | **Adopt** as restraint; money in tabular figures, right-aligned, `S/` prefix. |
| Neon accents (#00FFBE, #E4F222) | Digits, Ramp | **Reject** as text color (fails contrast on light); the accent comes from dreamcoder-dots. |

Unverified this month: Digits/Mercury/Ramp in-app layouts and number typesetting. Treat statements about them as inference.

## 4. Mobile references

Award winners (Awwwards Oct 2026, Apple Design Awards 2026: Moonlitt for interaction, grug for delight) and the ChatGPT/Claude mobile apps converge on: one app bar with menu and search, a drawer for navigation, content-first screens, sheets for secondary panels. Implemented so far: MobileTopBar + drawer (b9061a22). Pending: inspector as bottom sheet.

## 5. Already applied in this feature

- Honest states: no fabricated evidence, no "100%" without data (121cf081); failed missions explained in user terms (c326d00f).
- Settings as grouped rows with auto-save status (95d123e9), the calm Digits-like settings pattern.

## Sources

- Claude desktop changelog: https://claude.com/docs/cowork/changelog (entries 2026-09-10 to 2026-10-22)
- Claude Code desktop redesign: https://claude.com/blog/claude-code-desktop-redesign (2026-04-14)
- Codex app changelog: https://learn.chatgpt.com/docs/changelog?type=codex-app (2026-10-07 to 2026-10-09)
- Codex commands: https://learn.chatgpt.com/docs/app/commands
- Codex code review: https://learn.chatgpt.com/docs/code-review
- Digits Write MCP: https://insightfulaccountant.com/accounting-tech/vendor-news/digits-launches-write-mcp-the-safe-way-for-ai-agents-to-do-accounting/ (2026-10-15)
- Mercury Command: https://mercury.com/blog/introducing-mercury-command (2026-06-16)
- Linear priority inbox: https://linear.app/changelog/2026-09-03-priority-inbox
- Awwwards Sites of the Day: https://www.awwwards.com/websites/sites_of_the_day/
- Apple Design Awards 2026: https://developer.apple.com/design/awards/
