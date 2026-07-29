# Drenyra Glossary

**Last updated:** 2026-07-29
**Audience:** All contributors — developers, fiscal operators, accountants

---

## A

### Approval Control Plane

The Trust Plane component that governs who can approve what, based on policy, risk level, materiality, and segregation of duties. See [Trust Plane](../05-trust-plane/README.md).

---

## C

### Candidate

The frozen, hashed representation of a proposed financial action. A candidate includes scope (company, period), payload (journal entries, document changes), evidence references, policy version, and risk level. Reviewers approve or reject the candidate — not a description or an intention.

### CDR (Comprobante de Recepción)

XML file digitally signed by SUNAT confirming the acceptance or rejection of an electronic invoice (CPE). Without an accepted CDR (code 0), a CPE has no tax effects. See [CDR doc](../06-fiscal/peru/cdr.md).

### Change Set

Drenyra's equivalent of a Git branch for financial changes. Isolates proposed modifications (journal entries, document updates, classification changes) until reviewed and approved. See [Change Set guide](../02-guides/how-to-review-a-change-set.md).

### Country Pack

A composable, versioned package that encapsulates the fiscal rules, document types, calendar, and connectors for a specific jurisdiction. See [Country Plane](../09-country-plane/README.md).

### CPE (Comprobante de Pago Electrónico)

Standardized electronic invoice format used in Peru. Types include Factura (01), Boleta (03), Nota de Crédito (07), Nota de Débito (08). Based on UBL 2.1. See [CPE doc](../06-fiscal/peru/comprobantes.md).

---

## D

### Detracción (SPOT)

A mandatory deposit system: the buyer of goods or services subject to detracción deposits a percentage of the transaction into the seller's Banco de la Nación account. These funds can only be used for tax payments. See [Detracciones doc](../06-fiscal/peru/detracciones.md).

### DFP (Drenyra Financial Protocol)

The domain abstraction that allows consistent integration with external systems (SUNAT, banks, ERPs) regardless of their underlying protocol. See [Integration Plane](../08-integration-plane/README.md).

---

## E

### Evidence Graph

The directed acyclic graph connecting source documents, normalizations, validations, proposals, approvals, and receipts. Every node is hashed; every edge is versioned. The graph is traversable from any node — given a receipt, you can trace back to the original source document. See [Evidence explanation](../04-explanation/evidence-graph.md).

### Evidence Root

A Merkle root of all evidence hashes referenced by an operation. Included in the receipt to prove what evidence was considered.

### Execution Receipt / RED Receipt

The immutable record of a material financial operation. Contains candidate hash, evidence root, policy version, approver, execution proof, and output. Independently verifiable without a Drenyra server. See [Receipt guide](../02-guides/how-to-interpret-a-receipt.md).

---

## F

### FEOS (Financial Engineering Operating System)

Drenyra's architectural framework: 8 planes that organize the system from Experience to Country. See [FEOS Program](../01-foundation/feos-program.md).

### Financial Diff

A structured before/after comparison of a financial change set, showing account movements, document changes, tax impact, and evidence references.

### FSD (Fiscal Specification Document)

A normative document that defines a fiscal obligation: purpose, data requirements, validation rules, and output. Every fiscal obligation starts with an FSD — no spec, no code. See [Program Taxonomy](../01-foundation/program-taxonomy.md).

---

## I

### IGV (Impuesto General a las Ventas)

Peru's value-added tax. Rate: 18% composed of IGV (15.5%) and IPM (2.5%) in 2026. See [IGV doc](../06-fiscal/peru/igv.md).

### IPM (Impuesto de Promoción Municipal)

Municipal component of the IGV rate. Increasing gradually from 2% to 4% between 2025 and 2029 under Law 32387.

---

## M

### Materiality

A measure of financial impact combining risk, amount, and deadline. Used to prioritize attention, determine approval level, and escalate decisions. R0 actions have no materiality; R3 actions require explicit dual approval above a threshold.

---

## P

### PLE (Programa de Libros Electrónicos)

SUNAT's electronic bookkeeping program (predecessor to SIRE). Still active for contributors not yet migrated. Generates plain-text files in specific formats (3.1, 4.1, etc.). See [PLE doc](../06-fiscal/peru/ple.md).

---

## R

### R0–R3

Risk-based governance levels:

- **R0**: Read-only, no approval needed
- **R1**: Preferred structure, exception-based review
- **R2**: Mandatory JSON Schema, deterministic validation
- **R3**: Strict schema, deterministic validation, step-up authentication, dual control

### RCE (Registro de Compras Electrónico)

SUNAT's electronic purchases record, generated automatically by SIRE from received CPEs. See [SIRE doc](../06-fiscal/peru/sire.md).

### RED (Receipt-Driven Execution)

The protocol that governs every material operation in Drenyra: propose → freeze → hash → validate → review → approve → revalidate → execute → receipt. Every step is recorded and independently verifiable. See [RED spec](../14-design/red-spec.md).

### RUC (Registro Único de Contribuyente)

Peru's 11-digit tax ID with check digit. Required for all taxpayers. States: Activo, Suspensión temporal, De baja. See [SUNAT Basics](../06-fiscal/peru/sunat-basics.md).

### RVIE (Registro de Ventas e Ingresos Electrónico)

SUNAT's electronic sales and income record, generated automatically by SIRE from emitted CPEs. See [SIRE doc](../06-fiscal/peru/sire.md).

---

## S

### SIRE (Sistema Integrado de Registros Electrónicos)

SUNAT's platform that replaces PLE by auto-generating RVIE and RCE from CPEs. Mandatory rollout from 2023 to October 2026. See [SIRE doc](../06-fiscal/peru/sire.md).

### SOL (Sistema de Operaciones en Línea)

SUNAT's web platform for tax operations: declarations, consultations, SIRE, PLE. Access requires RUC and SOL credentials. See [SUNAT Basics](../06-fiscal/peru/sunat-basics.md).

### SUNAT (Superintendencia Nacional de Administración Tributaria)

Peru's tax authority.

---

## U

### UBL 2.1 (Universal Business Language)

XML standard used for electronic invoices in Peru. Drenyva validates CPEs against the UBL 2.1 schema.

### UIT (Unidad Impositiva Tributaria)

Peru's tax reference unit. 2026 value: S/ 5,350. Used for tax brackets, fines, and deductions.

---

## W

### Workspace

Drenyra's unit of work. Scopes every operation to an explicit company, period, and objective. See [Workspace guide](../02-guides/how-to-create-a-workspace.md).
