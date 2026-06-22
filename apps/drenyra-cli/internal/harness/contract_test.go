package harness

import (
	"encoding/json"
	"testing"
)

func TestDrenyraDualSurfaceContractJSON(t *testing.T) {
	raw := []byte(`{"version":"2026-05-26.dual-surface.v1","sourceOfTruth":"apps/api","sharedDomain":"packages/domain/src/drenyra","sharedApplication":"packages/application/src/drenyra","requiredScopeHeaders":["x-company-ruc"],"idempotencyHeader":"x-idempotency-key","sseEventTypes":["heartbeat"],"offlineCommandKinds":["CREATE_FISCAL_CASE"],"endpoints":[{"method":"GET","path":"/api/drenyra/contract","idempotentReplay":true,"cliParity":"required","webParity":"required"}],"invariants":["API/domain/application are source of truth"]}`)
	var contract DrenyraDualSurfaceContract
	if err := json.Unmarshal(raw, &contract); err != nil {
		t.Fatalf("unmarshal contract: %v", err)
	}
	if contract.IdempotencyHeader != "x-idempotency-key" {
		t.Fatalf("unexpected idempotency header %q", contract.IdempotencyHeader)
	}
	if len(contract.Endpoints) != 1 || contract.Endpoints[0].Path != "/api/drenyra/contract" {
		t.Fatalf("unexpected endpoints: %#v", contract.Endpoints)
	}
}
