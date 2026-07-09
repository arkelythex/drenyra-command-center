---
version: "alpha"
name: "ARKELYTHEX Data Engine Service Contract"
description: "Non-UI contract for analytics outputs, reports, and machine-readable status semantics."
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
  h1:
    fontFamily: "Inter"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: "1.2"
  body-md:
    fontFamily: "Inter"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5"
rounded:
  md: "14px"
  lg: "18px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  report-callout:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "16px"
  report-primary-action:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "12px"
  report-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px"
  report-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px"
  report-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px"
  report-info:
    backgroundColor: "{colors.info}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px"
  report-title-on-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.h1}"
    rounded: "{rounded.md}"
    padding: "16px"
  report-secondary-panel:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.lg}"
    padding: "24px"
  report-divider:
    backgroundColor: "{colors.border}"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    height: "1px"
  report-elevated:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.lg}"
    padding: "24px"
  report-ai-halo-chip:
    backgroundColor: "{colors.ai-halo}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px"
---

**Última actualización**: 2026-07-09 · Filosofía: [Gentleman Philosophy](../../docs/meta/gentleman-philosophy.md) — cognitive load reduction, warm teaching, progressive disclosure.

## Overview

This file governs data-engine output styling semantics for generated reports and analytical artifacts. It is a service contract, not a UI component library.

## Components

Use semantic statuses and consistent callouts so downstream consumers can map results predictably.

## Do's and Don'ts

Do:
- Keep report semantics explicit and stable.

Don't:
- Introduce ambiguous status coding in analytical outputs.
