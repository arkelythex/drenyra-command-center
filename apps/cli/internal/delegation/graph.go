package delegation

import "fmt"

// Agent describes one node in the Drenyra harness delegation graph.
type Agent struct {
	ID       string
	Tier     string
	Label    string
	MaySpawn []string
	Parent   string
	Leaf     bool
}

// Agents mirrors packages/drenyra-harness/src/delegation/graph.ts
var Agents = map[string]Agent{
	"drenyra-orchestrator": {
		ID: "drenyra-orchestrator", Tier: "tier0", Label: "Mother orchestrator",
		MaySpawn: []string{"drenyra-sdd-orchestrator", "kuntur-sdd-orchestrator"},
	},
	"drenyra-sdd-orchestrator": {
		ID: "drenyra-sdd-orchestrator", Tier: "tier1", Label: "Drenyra SDD coordinator",
		MaySpawn: []string{"fiscal-command-orchestrator", "ai-swarm-orchestrator", "latin-moderno-orchestrator", "drenyra-hr-orchestrator"},
	},
	"fiscal-command-orchestrator": {
		ID: "fiscal-command-orchestrator", Tier: "tier2", Label: "Fiscal command", Parent: "drenyra-sdd-orchestrator",
		MaySpawn: []string{"fiscal-sunat-agent", "fiscal-ledger-agent", "fiscal-reconcile-agent"},
	},
	"ai-swarm-orchestrator": {
		ID: "ai-swarm-orchestrator", Tier: "tier2", Label: "AI swarm", Parent: "drenyra-sdd-orchestrator",
		MaySpawn: []string{"swarm-codegen-agent", "swarm-test-agent", "swarm-review-agent"},
	},
	"latin-moderno-orchestrator": {
		ID: "latin-moderno-orchestrator", Tier: "tier2", Label: "Latin Moderno swarm", Parent: "drenyra-sdd-orchestrator",
		MaySpawn: []string{
			"cerno-agent", "custos-agent", "necto-agent", "regula-agent",
			"lumen-agent", "fusio-agent", "scripta-agent", "capsa-agent",
		},
	},
	"cerno-agent": {
		ID: "cerno-agent", Tier: "tier3b", Label: "Evidence & analysis",
		Parent: "latin-moderno-orchestrator", Leaf: true,
	},
	"custos-agent": {
		ID: "custos-agent", Tier: "tier3b", Label: "Validation & policy guard",
		Parent: "latin-moderno-orchestrator", Leaf: true,
	},
	"necto-agent": {
		ID: "necto-agent", Tier: "tier3b", Label: "Integration & linking",
		Parent: "latin-moderno-orchestrator", Leaf: true,
	},
	"regula-agent": {
		ID: "regula-agent", Tier: "tier3b", Label: "Governance & rule engine",
		Parent: "latin-moderno-orchestrator", Leaf: true,
	},
	"lumen-agent": {
		ID: "lumen-agent", Tier: "tier3b", Label: "Insight & discovery",
		Parent: "latin-moderno-orchestrator", Leaf: true,
	},
	"fusio-agent": {
		ID: "fusio-agent", Tier: "tier3b", Label: "Merge & consolidation",
		Parent: "latin-moderno-orchestrator", Leaf: true,
	},
	"scripta-agent": {
		ID: "scripta-agent", Tier: "tier3b", Label: "Documentation & scripting",
		Parent: "latin-moderno-orchestrator", Leaf: true,
	},
	"capsa-agent": {
		ID: "capsa-agent", Tier: "tier3b", Label: "Archive & packaging",
		Parent: "latin-moderno-orchestrator", Leaf: true,
	},
	"drenyra-hr-orchestrator": {
		ID: "drenyra-hr-orchestrator", Tier: "tier2", Label: "Drenyra HR", Parent: "drenyra-sdd-orchestrator",
		MaySpawn: []string{"hr-payroll-agent", "hr-compliance-agent"},
	},
	"fiscal-sunat-agent": {
		ID: "fiscal-sunat-agent", Tier: "tier3", Label: "SUNAT specialist", Parent: "fiscal-command-orchestrator",
		MaySpawn: []string{"fiscal-sunat-payload-agent"},
	},
	"fiscal-sunat-payload-agent": {
		ID: "fiscal-sunat-payload-agent", Tier: "tier3b", Label: "SUNAT payload drafter",
		Parent: "fiscal-sunat-agent", Leaf: true,
	},
	"fiscal-ledger-agent": {
		ID: "fiscal-ledger-agent", Tier: "tier3", Label: "Ledger specialist",
		Parent: "fiscal-command-orchestrator", Leaf: true,
	},
	"fiscal-reconcile-agent": {
		ID: "fiscal-reconcile-agent", Tier: "tier3", Label: "Reconciliation specialist",
		Parent: "fiscal-command-orchestrator", Leaf: true,
	},
	"hr-payroll-agent": {
		ID: "hr-payroll-agent", Tier: "tier3", Label: "Payroll specialist",
		Parent: "drenyra-hr-orchestrator", Leaf: true,
	},
	"hr-compliance-agent": {
		ID: "hr-compliance-agent", Tier: "tier3", Label: "HR compliance specialist",
		Parent: "drenyra-hr-orchestrator", Leaf: true,
	},
	"swarm-codegen-agent": {
		ID: "swarm-codegen-agent", Tier: "tier3", Label: "Codegen leaf",
		Parent: "ai-swarm-orchestrator", Leaf: true,
	},
	"swarm-test-agent": {
		ID: "swarm-test-agent", Tier: "tier3", Label: "Test leaf",
		Parent: "ai-swarm-orchestrator", Leaf: true,
	},
	"swarm-review-agent": {
		ID: "swarm-review-agent", Tier: "tier3", Label: "Review leaf",
		Parent: "ai-swarm-orchestrator", Leaf: true,
	},
}

const MaxDepth = 3

var fiscalKeywords = []string{"sunat", "sire", "cpe", "ruc", "libro", "ple", "fiscal", "concili", "asiento", "ledger"}
var hrKeywords = []string{"payroll", "plame", "nomina", "employee", "hr"}
var swarmKeywords = []string{"implement", "refactor", "test", "review", "codegen"}
var latinKeywords = []string{"investigat", "evidence", "governance", "consolidat", "archive", "insight", "validate"}

// ResolveRootAgent picks tier2 orchestrator from task keywords.
func ResolveRootAgent(task string) string {
	lower := toLower(task)
	for _, k := range fiscalKeywords {
		if contains(lower, k) {
			return "fiscal-command-orchestrator"
		}
	}
	for _, k := range hrKeywords {
		if contains(lower, k) {
			return "drenyra-hr-orchestrator"
		}
	}
	for _, k := range swarmKeywords {
		if contains(lower, k) {
			return "ai-swarm-orchestrator"
		}
	}
	for _, k := range latinKeywords {
		if contains(lower, k) {
			return "latin-moderno-orchestrator"
		}
	}
	return "fiscal-command-orchestrator"
}

func toLower(s string) string {
	b := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			c += 'a' - 'A'
		}
		b[i] = c
	}
	return string(b)
}

func contains(s, sub string) bool {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}

// PrintTree writes the delegation tree to stdout (delegates to TUI).
func PrintTree() {
	// Kept for tests; interactive CLI uses tui.PrintAgentStack directly.
	fmt.Print(`Drenyra Agent Stack (max depth: 3)
See: drenyra agents tree
`)
}

// AgentIDs returns sorted agent ids for display.
func AgentIDs() []string {
	ids := make([]string, 0, len(Agents))
	for id := range Agents {
		ids = append(ids, id)
	}
	sortStrings(ids)
	return ids
}

func sortStrings(a []string) {
	for i := 1; i < len(a); i++ {
		for j := i; j > 0 && a[j] < a[j-1]; j-- {
			a[j], a[j-1] = a[j-1], a[j]
		}
	}
}
