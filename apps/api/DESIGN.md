---
version: "alpha"
name: "ARKELYTHEX API Service Contract"
description: "Non-UI contract for backend service outputs, docs, and machine-facing consistency."
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
  api-doc-callout:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "16px"
  api-primary-action:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "12px"
  api-status-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px"
  api-status-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px"
  api-status-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px"
  api-status-info:
    backgroundColor: "{colors.info}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px"
  api-title-on-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.h1}"
    rounded: "{rounded.md}"
    padding: "16px"
  api-secondary-panel:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.lg}"
    padding: "24px"
  api-divider:
    backgroundColor: "{colors.border}"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    height: "1px"
  api-elevated:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.lg}"
    padding: "24px"
  api-ai-halo-chip:
    backgroundColor: "{colors.ai-halo}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px"
---

**Última actualización**: 2026-06-20

> 🎨 Documentación bajo la [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md) — consistencia visual como requisito de calidad, no decoración.

## Si solo tenés tres minutos

Este archivo define el *contrato visual* del backend de Arkelythex: colores, tipografía, componentes de UI documental (callouts, chips de estado, paneles). No es un design system frontend — es el vocabulario visual que usamos para que la documentación generada, los reportes y las salidas automáticas se vean coherentes sin depender de un diseñador.

| Si necesitás... | Usá... |
|-----------------|--------|
| Color primario fondo | `{colors.primary}` → `#0E0A08` |
| Color de acento | `{colors.tertiary}` → `#B97A45` |
| Chip de éxito | `api-status-success` |
| Callout de documentación | `api-doc-callout` |

Los tokens están diseñados para ser deterministas y legibles por máquina — ideales para documentación generada y artefactos CI/CD.

---

## Overview

This file governs service-facing visual consistency for API documentation, generated reference artifacts, and status semantics. It is not a frontend design system.

Pensalo como el "mode guide" del backend: cuando una herramienta genere un PDF, un HTML de reporte, o un response de estado, estos tokens garantizan que se vea como Arkelythex sin que nadie tenga que abrir Figma.

## Components

Use semantic status chips and consistent callouts in docs/output surfaces. Keep states operational and unambiguous.

| Componente | Uso |
|------------|-----|
| `api-doc-callout` | Notas contextuales en documentación |
| `api-primary-action` | Botones/acciones principales |
| `api-status-success` | ✅ Operación exitosa |
| `api-status-warning` | ⚠️ Advertencia |
| `api-status-danger` | ❌ Error |
| `api-status-info` | ℹ️ Informativo |
| `api-title-on-primary` | Títulos sobre fondo oscuro |
| `api-secondary-panel` | Paneles secundarios |
| `api-divider` | Separadores |
| `api-elevated` | Superficies elevadas |
| `api-ai-halo-chip` | Contenido generado por IA |

## Do's and Don'ts

Do:
- Keep backend outputs deterministic and schema-driven.
- Use semantic chips (`api-status-*`) for operational states — no emojis sueltos.
- Reference tokens by their semantic name, not the raw hex value.

Don't:
- Treat this file as a replacement for frontend design contracts. This is for backend-generated surfaces only.
- Override tokens in individual docs — si necesitás un color nuevo, agregalo acá.

---

**Última actualización**: 2026-06-20 | [Gentleman Philosophy](../../docs/meta/gentleman-philosophy.md)
