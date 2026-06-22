---
version: "alpha"
name: "ARKELYTHEX Core App Design System"
description: "Operational Light/Dark design contract for the core ARKELYTHEX web app."
colors:
  primary: "#0E0A08"
  on-primary: "#F7F1E8"
  secondary: "#18110D"
  on-secondary: "#EFE4D7"
  tertiary: "#B97A45"
  on-tertiary: "#0E0A08"
  neutral: "#DCCDBE"
  surface: "#241A14"
  surface-elevated: "#32241B"
  border: "#4A392E"
  muted: "#DCCDBE"
  success: "#7F9A74"
  warning: "#C59442"
  danger: "#B76353"
  info: "#7D8894"
  ai-halo: "#B6C0C8"
typography:
  display:
    fontFamily: "Inter"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: "1.1"
    letterSpacing: "-0.03em"
  h1:
    fontFamily: "Inter"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: "1.15"
    letterSpacing: "-0.02em"
  h2:
    fontFamily: "Inter"
    fontSize: "1.5rem"
    fontWeight: 650
    lineHeight: "1.2"
    letterSpacing: "-0.015em"
  body-md:
    fontFamily: "Inter"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5"
rounded:
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "12px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.md}"
    padding: "12px"
  card-operational:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.lg}"
    padding: "24px"
  ai-right-rail:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.xl}"
    padding: "24px"
  chip-info:
    backgroundColor: "{colors.info}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px"
  heading-on-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.h1}"
    rounded: "{rounded.md}"
    padding: "16px"
  panel-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.lg}"
    padding: "24px"
  caption-muted:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "8px"
  divider-subtle:
    backgroundColor: "{colors.border}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.sm}"
    height: "1px"
  chip-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px"
  chip-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px"
  chip-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px"
  ai-presence:
    backgroundColor: "{colors.ai-halo}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px"
---

**Última actualización**: 2026-06-20

> 📖 **Referencias**: [Gentleman Philosophy](../../docs/meta/gentleman-philosophy.md) · [Documentation Standards 2026](../../docs/meta/documentation-standards-2026.md)

---

## ⏱ Si solo tenés tres minutos

Este archivo es el contrato de diseño del SPA de Drenyra. Definí cómo se ven y se sienten las pantallas que usan contadores y fiscalistas peruanos todos los días.

| Si venís por... | Respuesta corta |
|----------------|-----------------|
| **¿Qué es este documento?** | Contrato de diseño core del web app — tokens, componentes, reglas visuales |
| **Sistema de diseño** | Glass & Steel — dark mode first, surface-elevated, colores funcionales (success/warning/danger/info) |
| **Inspiración** | Codex App (shell + sidebar) + Digits AI (ledger AI-native) |
| **Tokens** | DTCG JSON → `src/lib/design-tokens/tokens.dtcg.json` → generados con `bun tokens:generate` |
| **Regla de oro** | Workspace first, AI assisted — el trabajo principal en el centro, AI en el right rail |
| **Contexto fiscal peruano** | SUNAT, IGV 18%, RUC, UBL 2.1, detracciones, retenciones, PEN/USD |

El diseño prioriza legibilidad, densidad de información y visibilidad de evidencia sobre efectos decorativos.

---

## Overview

Core app contract for accountant-grade operation flows. Prioritizes readability, density, evidence visibility, and stable Light/Dark theming over decorative visual effects.

> **Warm take**: Accountants stare at these screens for 8+ hours. Every visual decision — from the amber tertiary to the restrained glass depth — exists to reduce eye strain and cognitive load, not to impress in a portfolio. If it doesn't help a user find a discrepancy faster, it doesn't belong here.

## Design Influences

The Drenyra workspace design is explicitly inspired by:

- **Codex App** — Shell with sidebar + content architecture, tool-first over chat-first, information density, split-view for evidence/context, tree-based navigation hierarchy.
- **Digits AI** — AI-native ledger approach, modular dashboard with KPI cards, progressive data disclosure, semantic AI/human iconography, warm-contrast palette for financial data.

Both references are **adapted to the Peruvian fiscal context**: SUNAT compliance, IGV 18%, RUC validation, UBL 2.1 electronic invoicing, detracciones/retenciones/percepciones, and dual PEN/USD currency support.

See [`docs/design/design-influences-2026.md`](../../docs/design/design-influences-2026.md) for the complete design influence documentation.

## Rules

- Workspace first, AI assisted: main operation stays in center, AI in right rail.
- Light/Dark are functional themes (`Claro` / `Oscuro`), not aesthetic skins.
- Use tokens from `apps/web/src/lib/design-tokens/` as implementation source.
- Prefer restrained glass depth only where hierarchy improves.

## Context

This file is authoritative for `apps/web`. If it conflicts with root `DESIGN.md`, this app-local contract wins.
