---
version: "alpha"
name: "Arkelythex Landing Design System"
description: "Monochrome marketing surface — OpenAI / Anduril aesthetic. See docs/design/design-influences-2026.md for full design influence documentation."
colors:
  primary: "#0A0A0A"
  on-primary: "#FAFAFA"
  secondary: "#111111"
  on-secondary: "#FAFAFA"
  tertiary: "#FAFAFA"
  on-tertiary: "#0A0A0A"
  neutral: "#A3A3A3"
  surface: "#111111"
  surface-elevated: "#1A1A1A"
  border: "#2E2E2E"
  muted: "#737373"
typography:
  display:
    fontFamily: "Inter"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: "1.05"
    letterSpacing: "-0.03em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "999px"
---

**Última actualización**: 2026-06-20 · Filosofía: [Gentleman Philosophy](../../docs/meta/gentleman-philosophy.md) — cognitive load reduction, warm teaching, progressive disclosure.

## Overview

Strict **monochrome** system across ALL routes in `apps/landing`: near-black canvas (`#0A0A0A`), white copy (`#FAFAFA`), gray structure. Hex network mark for Arkelythex.

Every page (homepage, product pages, marketing pages) uses `theme-oled` class for full dark OLED consistency.

## Surface Hierarchy

Content-heavy pages (product detail, data tables, forms) use elevated surfaces for readability:

| Token | Hex | Use |
|-------|-----|-----|
| `--color-background` | `#000000` | Page canvas |
| `--color-surface` | `#0A0A0A` | Cards, panels |
| `--color-surface-elevated` | `#111111` | Content sections, tables |
| `--color-surface-elevated-hover` | `#1A1A1A` | Hover states on elevated |
| `--color-surface-data` | `#0D0D0D` | Data-dense areas |

Text contrast on each surface passes WCAG AA (≥4.5:1 body, ≥3:1 large text).

## Design Influences

This design system is explicitly inspired by:

- **Anduril Industries** — Dark technical aesthetic, product-first authority, asymmetric layouts, institutional weight without bureaucracy.
- **OpenAI** — Monochrome discipline, "beauty in nothingness" negative space, clean hierarchy, CTAs as white fills on dark canvas.

See [`docs/design/design-influences-2026.md`](../../docs/design/design-influences-2026.md) for the complete design influence documentation, including Drenyra's Codex App + Digits AI inspirations and their adaptation to the Peruvian fiscal context.

## Rules

- **No warm brand hues** (copper, cocoa browns, celeste gradients).
- **Inter only** for UI and display — no secondary display serif on marketing.
- **CTAs:** `.btn-primary` = white fill, dark label (use class, not ad-hoc `bg-primary` except buttons).
- **Eyebrows:** `text-muted-foreground` + `tracking-[0.22em]` — never copper or white accents for labels.
- **Surfaces:** `border-foreground/10`, `bg-foreground/[0.02]` — no colored glows or orbs.
- **Tokens:** consume `app/globals.css` / Tailwind semantic aliases; avoid hardcoded hex in components.
- **Shared fragments:** `lib/landing/ui-classes.ts` for repeated marketing patterns.

## Brand assets

| Asset | Path |
|-------|------|
| Mark (currentColor) | `public/brand/mark.svg`, `components/brand/arkelythex-mark.tsx` |
| Favicon / icon | `public/brand/favicon.svg`, `icon.svg` |
| PNG exports | `public/brand/logo-light.png`, `logo-dark.png` |

## Engineering

- Design token contract: `lib/design-system-token-contract.ts` (must match `globals.css`).
- OG images: `app/api/og/route.tsx` (monochrome grid + hex mark).
- Tests: `bun test` in `apps/landing` for token alignment and key UI.

## Context

Authoritative for `apps/landing` over root `DESIGN.md`.
