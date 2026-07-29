# 09 — Country Plane

**Última actualización:** 2026-07-27
**FEOS Plano:** 8 de 8 — País
**Propósito:** Country packs, fiscal rules, tax calendars, localization
**Principio:** Composición sobre fork — un core universal, reglas locales

---

## Filosofía

La expansión latinoamericana debe diseñarse desde el inicio como composición, no como forks.

```
Drenyra Core
├── Universal Ledger
├── Evidence Graph
├── Agent Runtime
├── Workflow Engine
├── Policy Engine
├── Identity and Permissions
└── Country Packs (composable)
```

Cada Country Pack:

```
country-packs/peru/
├── authority-connectors/
├── tax-calendar/
├── document-types/
├── chart-mappings/
├── validation-rules/
├── filing-workflows/
├── terminology/
├── legal-sources/
├── test-cases/
└── migrations/
```

### Estrategia de expansión

```
Perú (cuña inicial)
→ Colombia
→ Chile
→ Ecuador
→ México
→ Brasil (cuando el capital lo permita)
```

Criterios de selección:

```
Market attractiveness
× regulatory digitization
× accounting pain
× API accessibility
× partner availability
× competitive weakness
÷ localization cost
```

---

## Documentos planificados

Los siguientes documentos están identificados pero aún no han sido creados. Se generarán como parte de los SDDs del [programa FEOS](../01-foundation/feos-program.md):

- `country-pack-runtime.md` — Runtime, loading, isolation
- `peru-pack.md` — SUNAT, SIRE, RUC, UBL 2.1, IGV
- `expansion-strategy.md` — LATAM roadmap, market selection
- `country-neutral-core.md` — IFRS/NIIF, universal accounting

---

## Relación con otros planos

| Plano                                                 | Relación                            |
| ----------------------------------------------------- | ----------------------------------- |
| [07 — Financial](../07-financial-plane/README.md)     | Ledger universal es country-neutral |
| [08 — Integration](../08-integration-plane/README.md) | Conectores varían por país          |
| [05 — Trust](../05-trust-plane/README.md)             | Policy engine evalúa reglas locales |
