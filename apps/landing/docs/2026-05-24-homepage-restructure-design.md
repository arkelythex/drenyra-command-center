# Homepage restructure — Arkelythex brand page

**Date**: 2026-05-24
**Type**: Design spec
**Status**: Draft

## Goal

Restructure `/` (brand homepage) to sell Arkelythex as **ecosystem/infrastructure**, not
as a product catalog. Each product (Drenyra, Ledger, Cortex) has its own dedicated page.
The homepage sells why the platform exists, and each product page sells how it works.

## Design DNA (agreed)

| Influence | Applies as |
|-----------|------------|
| **Anduril** | Cinematic full-bleed visuals, dark mood, military-grade precision |
| **Palantir** | Data-narrative mission copy, facts/figures, operational gravity |
| **OpenAI** | Clean structure, one-thing-at-a-time, minimal text, high whitespace |

## Current problems

1. **Product Showcase (3 full-bleed rows)** dominates the page but each product now has
   its own page — the homepage shouldn't compete with them.
2. **No data narrative** — the hero says "Infraestructura fiscal." but nothing makes it
   concrete. No numbers, no mission claim.
3. **Ecosystem feels secondary** — buried after 3 massive product rows.
4. **Stats section** is registered but not implemented.
5. **Brand Closing** repeats links already in navbar/hero — could be repurposed.

## Proposed section flow

```
Hero (cinematic + data strip)
  ↓
Stats / Mission narrative (Palantir data)
  ↓
Products entry grid (replaces 3 full-bleed rows)
  ↓
Ecosystem grid (keep, enhance)
  ↓
FAQ (keep)
  ↓
Closing (mission-driven)
  ↓
Footer
```

### 1. Hero — "Infraestructura fiscal."

**Keep** current full-bleed cinematic treatment (dark, `BrandSurfaceScene`,
gradient overlay, CTA buttons).

**Add** a subtle **data/metrics strip** at the bottom of the hero viewport:

```
+X empresas fiscales · YY+ transacciones/día · 99,9% uptime
```

This makes the hero concrete (Palantir) without losing the cinematic weight
(Anduril). The strip sits inside the hero section, light text on dark
background, minimal typography — no boxes, no backgrounds.

**Do NOT change**: headline, eyebrow, CTAs, scroll cue, the ArkelythexMark.

### 2. Stats / Mission narrative

This is the **Palantir section**. A single full-width panel with:

- A short mission statement ("La infraestructura que conecta operaciones fiscales
  en Perú" or similar)
- 3-4 data points in a row: companies served, tax documents processed,+
  transactions, compliance rate
- Clean typography, no decorative elements — just numbers + labels

This replaces the emotional weight of the product showcase rows with factual
weight. The data should be real (or aspirational but plausible).

### 3. Products entry grid

**Replaces** the 3 full-bleed `BrandShowcaseRow` components.

A simple 3-column card grid showing Drenyra / Ledger / Cortex as entry points:

- Each card has: a small visual/icon, eyebrow, product name, 1-line description,
  "Explorar" link
- No full-bleed images, no gradient overlays, no massive height
- These are **doors** to product pages, not the product page themselves

This is the **OpenAI influence** — clean, minimal, lets each product speak for
itself on its own page.

### 4. Ecosystem grid

**Keep** current `BrandEcosystemGrid` as-is. Maybe add a subtitle line explaining
that these modules compose the platform. No structural changes.

### 5. FAQ

**Keep** current `LandingFaq` as-is. No changes.

### 6. Brand Closing

**Repurpose** from current `BrandClosing` (editorial close) to a **mission-driven**
closing that reinforces the "why". Options:
- A short powerful quote or mission statement
- The closing CTAs (Drenyra / API Docs) remain
- The "Diseñado en Perú" line stays

### 7. Footer

**Keep** current `Footer` as-is.

## What to delete / archive

| Component | Reason |
|-----------|--------|
| `BrandShowcaseRow` | Replaced by product entry grid |
| `BrandSurfaceScene` in showcase | No longer needed for products on home |
| `BrandMediaSlot` hero variants for products | No longer needed on home |
| `brand-home.ts` products array | Will replace with simpler entry data |

## What to create

| File | Purpose |
|------|---------|
| `components/landing/brand/brand-stats-strip.tsx` | Data narrative section |
| `components/landing/brand/brand-product-grid.tsx` | 3-card product entry grid |
| Updated `landing-page.tsx` | New composition |
| Updated `hero.tsx` | Add data strip |

## What to keep unchanged

- `BrandEcosystemGrid`
- `LandingFaq`
- `LandingClosing` (brandPresentation mode)
- `Footer`
- `Navbar`
- `ScrollReveal`

## Visual guardrails

- Keep dark cinematic (`#0A0A0A`, full-bleed hero)
- No tab switchers, no carousels, no accordions (except FAQ)
- Animations stay subtle: fade + translateY, respect prefers-reduced-motion
- Copy stays minimal — the images and numbers carry weight
- Each section has ONE job. If it needs explanation, it's doing two things.
