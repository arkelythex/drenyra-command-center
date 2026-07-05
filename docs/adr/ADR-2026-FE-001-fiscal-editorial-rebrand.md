# ADR-2026-FE-001: Fiscal Editorial Rebrand (Copper → Voltage)

**Última actualización:** 2026-06-30  
**Status:** Accepted  
**Deciders:** Drenyra product + design system  
**Supersedes:** Glass & Steel primary accent (Copper `#B97A45` / Ember `#d99555`)

## Context

Drenyra's web app accumulated dual token systems (packages/ui vs web DTCG), stale DESIGN.md, and glass-heavy UI that reads as generic "AI slop." User approved a **strong rebrand** toward Cursor 3 editorial aesthetics while preserving operations-first fiscal UX.

Ecosystem brand guidelines (`06-brand-guidelines.md`) define Copper as primary accent for DRENYRA. Drenyra as flagship product may evolve visual weight independently while staying in the warm neutral family.

## Decision

1. Adopt **Fiscal Editorial** as the Drenyra web design system name (replaces "Glass & Steel" in app docs).
2. Primary interactive accent becomes **Voltage Orange** `#f54e00` (Cursor-adapted), used ≤5% of visible pixels.
3. Secondary fiscal accent **Copper-Orange bridge** `#c45c2a` for SUNAT/compliance badges only.
4. Canvas dark default: **Espresso** `#161614`; light: **Cream paper** `#f7f7f4`.
5. Deprecate decorative glassmorphism; replace with flat editorial surfaces + hairline borders.
6. Unify `packages/ui` tokens to import from web DTCG generated output (single source of truth).

## Consequences

### Positive

- Visual consistency across web and shared UI package
- Agent-readable DESIGN.md v3 contract
- Aligns with 2026 dev-tool editorial trend (Cursor, Codex, Linear)

### Negative

- Ecosystem marketing materials still show Copper until updated
- Large migration surface (~340 files)
- Users familiar with Ember Noir dark may notice shift

## Alternatives considered

| Option | Rejected because |
|--------|------------------|
| Evolve Glass & Steel in place | Does not fix dual-token drift or AI-slop signals |
| Full Cursor color clone | Loses LATAM fiscal brand warmth; no compliance badge distinction |
| Light-default theme | Fiscal ops users prefer dark for long sessions |

## Compliance

- Operations-first layout unchanged (sidebar / workspace / evidence rail)
- No fiscal logic changes
- WCAG AA required before merge to main

## References

- [Cursor 3 blog](https://cursor.com/blog/cursor-3)
- [Codex App docs](https://developers.openai.com/codex/app)
- `docs/design/operations-first-ai-assisted-2026.md`
