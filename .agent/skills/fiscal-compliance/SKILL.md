---
name: drenyra-fiscal-compliance
description: "Trigger: fiscal, sunat, compliance, sires, igv, detraccion, retencion, SUNAT flows, SIRE rules. Guide AI agents when working with Peruvian fiscal compliance logic in Drenyra. Ensures SUNAT regulations, SIRE..."
license: MIT
metadata:
  author: arkelythex
  version: "1.0"
---

# Fiscal Compliance Skill

> **Trigger**: fiscal, sunat, compliance, sires, igv, detraccion, retencion, SUNAT flows, SIRE rules
> **Scope**: `project`

## Purpose

Guide AI agents when working with Peruvian fiscal compliance logic in Drenyra. Ensures SUNAT regulations, SIRE requirements, IGV calculations, detracciones, and retenciones are handled correctly.

## Non-negotiables

- Do NOT bypass RUC/company scoping in any fiscal query, mutation, or report.
- Do NOT use floats for money — use the project `Money` value object.
- Do NOT hardcode tax rates — read them from the domain registry.
- Do NOT skip audit evidence logging for fiscal operations.

## SUNAT & SIRE Rules

1. **IGV (18%)**: Always calculate as subtotal × 0.18. Round to 2 decimal places using banker's rounding.
2. **Detracciones**: Verify the product/service code against the current SPOT table before applying.
3. **Retenciones**: Apply only when the provider is registered in the RRT (Registro de Retenciones).
4. **Document Series**: Validate against SUNAT-authorized series per document type (F001/B001/etc.).
5. **CDR Handling**: Always store the CDR (Comprobante de Recepción) hash and SUNAT response code.
6. **SIRE Reports**: Format `libro` entries according to the current SIRE schema version.

## Code Review Gate

Reject changes that:

- Remove RUC scoping from fiscal queries
- Use raw numbers for IGV calculations
- Skip CDR audit logging
- Introduce silent error handling in SUNAT API calls
- Modify document series without series migration plan

## Testing Requirements

All fiscal changes require:

- Unit tests for IGV/detracción/retención calculations
- Integration tests mocking SUNAT API responses
- A SIRE reprocessing verification step before merge (script `compliance:sire-repro` aún no implementado)
