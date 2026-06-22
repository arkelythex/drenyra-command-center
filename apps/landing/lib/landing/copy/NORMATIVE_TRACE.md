# Trazabilidad copy landing v2 ↔ docs normativos

Fuentes de verdad (alcance acordado):

| Fuente | Ruta |
|--------|------|
| Product surfaces | `docs/products/*.md`, `docs/products/README.md` |
| SUNAT / SIRE / CPE | `docs/concepts/sunat-regulations-2026.md` |
| Features montadas | `docs/features-index.md`, `docs/03-features/README.md` |
| Claims externos / gobernanza | `docs/business/claim-register-2026.md` |

## Matriz por bloque (`V2_LANDING_COPY`)

| Bloque | Claims / hechos que comunica | Documento normativo principal |
|--------|-------------------------------|------------------------------|
| `navbar` | SIRE-first, piloto demo | `products/*.md`, `claim-register` (formulación condicional) |
| `hero` | Pre-validación CPE, riesgo, evidencia antes de declarar; panel ilustrativo | `sunat-regulations-2026.md`; panel **no** implica enlace en vivo al portal SUNAT |
| `hero.operationalSnapshot` | Estados de ejemplo en UI | Mismo; alineado a generación/revisión interna, no “Conectado” a SUNAT |
| `hero.microProof` | Dolor operativo cualitativo | Sin cifras no registradas en `claim-register` |
| `trust` | SUNAT, SIRE/PLE, CPE UBL, multi-RUC, IA supervisada | `sunat-regulations-2026.md`, `claim-register` (IA asistida + aprobaciones) |
| `trust.authorityMetrics` | LCP/JS/metas técnicas con disclaimer | Narrativa producto; disclaimer explícito en copy |
| `valueBento` | Cola fiscal, SIRE+CPE, human-in-the-loop | Canon SUNAT + `products/ledger.md` (tesis fiscal) |
| `enterprise.problem` | Riesgo evidencia, silos | Estrategia coherente con `products/*.md` |
| `enterprise.shadowEngine` | Pre-auditoría, entradas/salidas motor | Coherente con `ledger.md` (pre-auditoría determinística) sin prometer envío automático |
| `howItWorks` | Integrar → detectar → validar → escalar | `03-features/README.md` (capacidades reales por feature) |
| `capabilities` | Facturación, conciliación, motor tributario, etc. | Features montadas; banca sin “moat bancario completo” (`claim-register` Blocked) |
| `pillars` | Ledger, Studio, Cortex | `docs/products/ledger.md`, `studio.md`, `cortex.md` |
| `peru` | Calendario local, pipeline CPE/SIRE/PLE/bancos | `sunat-regulations-2026.md`; nota transmisión OSE/SUNAT |
| `demo.states` | Estados UI ejemplo | Disclaimer OSE/SUNAT/red (como `transmissionFootnote`) |
| `comparison` | Fragmentación vs superficie única | Posicionamiento coherente con product docs |
| `video` | Demo guiada | No factual SUNAT |
| `testimonials` | Casos ilustrativos | Copy ya indica ilustrativo |
| `pricingSection` | Tesis económica cualitativa | Sin cifras no aprobadas en `claim-register` |
| `faqSection` | Alcance, límites, implementación | Honestidad operativa + portal SUNAT según despliegue |
| `finalCta` / `footer` | CTAs, contacto | `siteConfig`, sin claims bloqueados |
| `mockup` (closing) | Strings UI demo | Misma regla que hero panel: no “Conectado” como enlace en vivo |

## Revisión

Al cambiar regulación SUNAT, montaje de features o `claim-register`, actualizar primero la fuente normativa y luego este copy.
