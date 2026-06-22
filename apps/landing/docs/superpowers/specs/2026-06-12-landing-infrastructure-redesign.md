# Landing Page Infrastructure Redesign

**Date**: 2026-06-12
**Status**: Approved
**Approach**: "The Stack" (Infrastructure-first narrative)

## Context

The current landing page sells products (Drenyra, Ledger, Cortex). The new narrative sells infrastructure — Arkelythex as the intelligence infrastructure for Latin America. Shift from "product catalog" to "continental platform".

## Design Decisions

### Narrative Structure

1. **Hero**: "Intelligence Infrastructure for Latin America" — not products
2. **The Stack**: Architecture diagram showing Aevon → Core (Mentara, Noreva, Lexori, Korveth, Lathera, Geavon)
3. **Why It Exists**: 5 continental problems with real data (informality, evasion, fragmentation, corruption, lack of evidence)
4. **Applications**: 8 verticals in minimalist grid (Drenyra, Solevra, Ascleron, Aurevon, Arkoven, Aetheron, Ferion, Valion)
5. **Operating System**: Node diagram showing actors (Governments, Companies, Banks, Auditors, Citizens) → Aevon → Infrastructure
6. **Request Access**: Single CTA, Palantir-style

### Visual Direction

- **Palette**: Blanco (#FAFAF8), Grafito (#2D2D2D), Cobre (#C4793A) accent
- **Less cards**: Lines, diagrams, nodes, negative space
- **Institution + Laboratory** aesthetic, not premium fintech
- **Typography**: Inter (body), Cinzel (display accent) — keep existing

### Content Changes

- Reduce Drenyra prominence by 70%
- Increase Aevon and core infra visibility by 200%
- Remove Ledger, Cortex, Studio as separate products (they become features of verticals)
- Add 5 new verticals: Solevra, Ascleron, Aurevon, Arkoven, Ferion

### Routes

- Keep all existing routes intact
- Add new vertical routes: /solevra, /ascleron, /aurevon, /arkoven, /ferion
- Home page is the new narrative, routes sell specific verticals

## Files to Change

### Copy
- `lib/landing/copy/brand-home.ts` — hero, stats, products, ecosystem
- `lib/landing/copy/ecosystem.ts` — ecosystem modules
- `lib/landing/copy/closing.ts` — closing CTA

### Styles
- `app/globals.css` — color palette variables

### Components (new)
- `components/sections/the-stack.tsx` — architecture diagram
- `components/sections/why-it-exists.tsx` — problems with data
- `components/sections/applications.tsx` — 8 verticals grid
- `components/sections/operating-system.tsx` — node diagram

### Components (modify)
- `components/landing/landing-page.tsx` — new section composition
- `components/sections/hero.tsx` — new hero content

### Routes (new)
- `app/solevra/page.tsx`
- `app/ascleron/page.tsx`
- `app/aurevon/page.tsx`
- `app/arkoven/page.tsx`
- `app/ferion/page.tsx`

## Verification

- `bun run build` passes
- `bun run lint` passes
- All existing tests pass
- Visual review in browser
