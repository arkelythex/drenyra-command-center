package workflow

import (
	"fmt"
	"sort"
	"strings"
)

// Template is one reusable built-in Drenyra product workflow.
type Template struct {
	ID          string
	Description string
	RootAgentID string
	Template    string
}

var catalog = map[string]Template{
	"architecture-check": {
		ID:          "architecture-check",
		Description: "Check architecture boundaries before implementation",
		RootAgentID: "ai-swarm-orchestrator",
		Template: `Check the architecture implications for: {{CONTEXT}}

Evaluate:

- Vertical Slice + CQRS boundaries.
- Domain purity: packages/domain must stay framework-free.
- application depends on domain; adapters stay in persistence/infrastructure/ai.
- Tenant/company/RUC scoping across APIs, jobs, exports, seeds, and tests.
- Whether this needs SDD/OpenSpec artifacts before implementation.
- Narrow verification commands such as architecture:check-boundaries or targeted typecheck.

Return a concise decision: safe to implement directly, needs scout/reviewer, or needs SDD.`,
	},
	"bugfix-tdd": {
		ID:          "bugfix-tdd",
		Description: "Fix a bug using strict TDD evidence",
		RootAgentID: "ai-swarm-orchestrator",
		Template: `Fix this Drenyra App / Arkelythex platform bug using strict TDD discipline: {{CONTEXT}}

Protocol:

1. Reproduce or characterize the failure first.
2. Write or identify a failing test before production changes when feasible.
3. Implement the smallest safe fix.
4. Run the narrowest relevant test/typecheck command.
5. Report RED, GREEN, TRIANGULATE, and REFACTOR evidence.

Preserve tenant/company/RUC scoping, fiscal correctness, Money value objects, and auditability. Do not use untyped escape hatches such as TypeScript any.`,
	},
	"pre-pr": {
		ID:          "pre-pr",
		Description: "Prepare the current change for review",
		RootAgentID: "ai-swarm-orchestrator",
		Template: `Prepare this Drenyra App / Arkelythex platform change for review: {{CONTEXT}}

Follow the project rules in AGENTS.md. Inspect the current git diff and report:

1. Review workload risk and likely PR size.
2. Files changed by area: API, web, landing, domain, application, persistence, infrastructure, docs, tests.
3. Required verification commands, using the narrowest relevant checks first.
4. Fiscal/SUNAT, tenant isolation, money, security, and audit-trail risks.
5. Whether a fresh reviewer should audit before commit/PR.

Do not commit or push. If code changes are non-trivial, recommend a fresh-context review before PR.`,
	},
	"review-sunat": {
		ID:          "review-sunat",
		Description: "Review changes for SUNAT and fiscal correctness",
		RootAgentID: "fiscal-command-orchestrator",
		Template: `Review this Drenyra App / Arkelythex platform change for Peruvian fiscal correctness and SUNAT safety: {{CONTEXT}}

Focus on:

- RUC scoping and tenant/company isolation.
- IGV, retenciones, detracciones, SIRE, CDR, UBL 2.1, OSE, and audit trails.
- Money precision: no floats or raw number arithmetic for currency.
- Deterministic domain logic and compliance-focused tests.
- Public contract or schema changes that require docs/spec updates.

Return blockers first, then risks, then recommended verification commands.`,
	},
	"analyze-invoice": {
		ID:          "analyze-invoice",
		Description: "Analyze an invoice for fiscal correctness and SUNAT compliance",
		RootAgentID: "fiscal-command-orchestrator",
		Template: `Analyze this invoice for Peruvian fiscal correctness and SUNAT compliance: {{CONTEXT}}

Evaluate:

- CPE type (factura, boleta, nota de crédito/débito) and document series validity.
- IGV (18%) calculation: base imponible, IGV, total — verify 1/1/1 split.
- Retenciones (3%, 6%) and detracciones SPOT detection and rates.
- RUC del emisor y receptor: módulo 11 checksum, estado activo, domicilio fiscal habilitado.
- UBL 2.1 required fields: issue date, document currency code, tax scheme, legal identifier.
- CDR (Comunicación de Baja) or SUNAT ticket presence.
- SIRE period alignment if applicable.
- Currency and rounding: no floats, precise cent handling.

Return: PASS, BLOCKER (with specific reason), or NEEDS_REVIEW (with flagged items).`,
	},
	"explain-risk": {
		ID:          "explain-risk",
		Description: "Analyze fiscal risk level for a situation, change, or proposed action",
		RootAgentID: "fiscal-command-orchestrator",
		Template: `Analyze the fiscal risk level for this Drenyra App / Arkelythex context: {{CONTEXT}}

Classify risk as:

- LOW: Read-only query, existing evidence retrieval, no fiscal state mutation.
- MEDIUM: Draft proposal, explain action, suggest classification, generate report.
- HIGH: Approve payment, submit to SUNAT, post ledger entry, modify fiscal period state.
- CRITICAL: Cross-tenant operation, mass update, retroactive period change, delete evidence.

For each risk level, verify:

- Required scope: organization, company, RUC, period, country all set and match.
- Required approvals: approval guard configured and actor has authority.
- Evidence completeness: all referenced evidence IDs exist and are consistent.
- Deterministic fallback: if AI is involved, is there a non-AI validation path?

Return risk level, evidence scope, approval requirements, and recommended fallback.`,
	},
	"prepare-evidence": {
		ID:          "prepare-evidence",
		Description: "Gather and format fiscal evidence for a specific claim or period",
		RootAgentID: "fiscal-command-orchestrator",
		Template: `Prepare fiscal evidence bundle for: {{CONTEXT}}

Evidence types to collect and format:

- CPE (comprobante electrónico) facts: invoice/credit-note/debit-note data with XML hash.
- CDR (comunicación de baja) receipt: SUNAT acceptance/rejection, ticket, description.
- SIRE records: period register with purchase/sales book entries, IGV totals.
- Bank statements: matching transactions with reconciliation status.
- Payment evidence: transfer receipts, deposit slips, confirmation codes.
- Ledger entries: posted amounts with fiscal period, account code (PCGE), and approval trail.

For each evidence item, return:
- Evidence ID (or reference)
- Type (CPE/CDR/SIRE/bank/payment/ledger)
- Fiscal period
- Confidence (COMPLETE/PARTIAL/MISSING)
- Hash or integrity reference

Format as structured evidence bundle suitable for audit trail or approval workflow.`,
	},
	"propose-ledger-entry": {
		ID:          "propose-ledger-entry",
		Description: "Create a draft ledger entry with fiscal evidence and approval state",
		RootAgentID: "fiscal-command-orchestrator",
		Template: `Create a draft ledger entry for: {{CONTEXT}}

Requirements:

- Accounting entries MUST use PCGE (Plan Contable General Empresarial) account codes.
- Debe and haber MUST balance (total debe == total haber).
- Each entry MUST reference at least one evidence ID (CPE, CDR, SIRE, bank transaction).
- Fiscal period (year + month) MUST be explicit and match the transaction date.
- Organization and company scoping MUST be present.
- Approval state MUST start as DRAFT — never POSTED without explicit approval.

Return structured proposal with:

- Fiscal period and scope.
- Lines: account code, description, debe amount, haber amount, evidence refs.
- IGV breakdown if applicable (base imponible, IGV, total with 1/1/1 split).
- Required approval level (agent, human, or both).
- Deterministic validation checks passed (balance, evidence, scope, period).

Do NOT post, promote, or approve. Return only a DRAFT proposal.`,
	},
}

// List returns workflows sorted by ID.
func List() []Template {
	ids := make([]string, 0, len(catalog))
	for id := range catalog {
		ids = append(ids, id)
	}
	sort.Strings(ids)

	workflows := make([]Template, 0, len(ids))
	for _, id := range ids {
		workflows = append(workflows, catalog[id])
	}
	return workflows
}

// Resolve returns a workflow by ID.
func Resolve(id string) (Template, error) {
	workflow, ok := catalog[id]
	if !ok {
		return Template{}, fmt.Errorf("unknown workflow %q", id)
	}
	return workflow, nil
}

// RenderPrompt injects context into a workflow prompt.
func RenderPrompt(workflow Template, context string) string {
	trimmed := strings.TrimSpace(context)
	if trimmed == "" {
		trimmed = "No additional context provided. Inspect the current repository state where relevant."
	}
	return strings.ReplaceAll(workflow.Template, "{{CONTEXT}}", trimmed)
}
