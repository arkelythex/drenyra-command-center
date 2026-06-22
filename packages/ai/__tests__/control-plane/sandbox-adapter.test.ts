import { describe, expect, it } from "vitest";
import {
	type CodexSandboxOperationRequest,
	validateCodexSandboxOperation,
} from "../../src/control-plane/sandbox-adapter";

const baseRequest: CodexSandboxOperationRequest = {
	operation: "read-sdd-artifacts",
	dataClassification: "synthetic",
	environment: "engineering-sandbox",
	capabilityScope: ["read-sdd-artifacts"],
};

describe("codex sandbox adapter", () => {
	it("accepts engineering-safe capability with synthetic/redacted data", () => {
		const result = validateCodexSandboxOperation(baseRequest);

		expect(result.allowed).toBe(true);
		if (!result.allowed) {
			throw new Error("expected allow result");
		}
		expect(result.metadata.sandboxOnly).toBe(true);
		expect(result.metadata.advisoryOnly).toBe(true);
		expect(result.metadata.executableCommand).toBeNull();
		expect(result.metadata.allowedCapabilities).toContain("read-sdd-artifacts");
	});

	it("blocks shell capability and wildcard scope fail-closed", () => {
		const shellResult = validateCodexSandboxOperation({
			...baseRequest,
			operation: "execute-safe-check",
		});

		expect(shellResult.allowed).toBe(false);
		if (shellResult.allowed) {
			throw new Error("expected denied shell operation");
		}
		expect(shellResult.reasonCode).toBe("RAW_SHELL_EXECUTION_BLOCKED");

		const wildcardResult = validateCodexSandboxOperation({
			...baseRequest,
			capabilityScope: ["*"],
		});

		expect(wildcardResult.allowed).toBe(false);
		if (wildcardResult.allowed) {
			throw new Error("expected wildcard deny result");
		}
		expect(wildcardResult.reasonCode).toBe("WILDCARD_PERMISSION_FORBIDDEN");
	});

	it("rejects production contexts and non-safe fixture classifications", () => {
		const productionResult = validateCodexSandboxOperation({
			...baseRequest,
			environment: "production",
		});

		expect(productionResult.allowed).toBe(false);
		if (productionResult.allowed) {
			throw new Error("expected production deny result");
		}
		expect(productionResult.reasonCode).toBe("PRODUCTION_CONTEXT_FORBIDDEN");

		const restrictedDataResult = validateCodexSandboxOperation({
			...baseRequest,
			dataClassification: "production",
		});

		expect(restrictedDataResult.allowed).toBe(false);
		if (restrictedDataResult.allowed) {
			throw new Error("expected production data deny result");
		}
		expect(restrictedDataResult.reasonCode).toBe(
			"DATA_CLASSIFICATION_NOT_ALLOWED",
		);
	});

	it("rejects production credentials and secrets access requests with deterministic reason codes", () => {
		const sunatResult = validateCodexSandboxOperation({
			...baseRequest,
			operation: "sunat.get-access-token",
		});

		expect(sunatResult.allowed).toBe(false);
		if (sunatResult.allowed) {
			throw new Error("expected SUNAT credential access deny result");
		}
		expect(sunatResult.reasonCode).toBe("SUNAT_OSE_CREDENTIAL_ACCESS_BLOCKED");

		const prodErpResult = validateCodexSandboxOperation({
			...baseRequest,
			operation: "erp.production.export-context",
		});

		expect(prodErpResult.allowed).toBe(false);
		if (prodErpResult.allowed) {
			throw new Error("expected production ERP context deny result");
		}
		expect(prodErpResult.reasonCode).toBe("PRODUCTION_DATA_ACCESS_BLOCKED");

		const dbUrlResult = validateCodexSandboxOperation({
			...baseRequest,
			operation: "read-sdd-artifacts",
			capabilityScope: ["read-sdd-artifacts", "postgresql://prod-db-url"],
		});

		expect(dbUrlResult.allowed).toBe(false);
		if (dbUrlResult.allowed) {
			throw new Error("expected production DB URL deny result");
		}
		expect(dbUrlResult.reasonCode).toBe("PRODUCTION_DATA_ACCESS_BLOCKED");

		const secretTokenResult = validateCodexSandboxOperation({
			...baseRequest,
			operation: "read-sdd-artifacts",
			capabilityScope: ["read-sdd-artifacts", "openai_api_key"],
		});

		expect(secretTokenResult.allowed).toBe(false);
		if (secretTokenResult.allowed) {
			throw new Error("expected token/secret deny result");
		}
		expect(secretTokenResult.reasonCode).toBe(
			"SUNAT_OSE_CREDENTIAL_ACCESS_BLOCKED",
		);
	});

	it("rejects authoritative fiscal and accounting mutation categories", () => {
		const fiscalResult = validateCodexSandboxOperation({
			...baseRequest,
			operation: "fiscal.post-journal-entry",
		});

		expect(fiscalResult.allowed).toBe(false);
		if (fiscalResult.allowed) {
			throw new Error("expected fiscal mutation deny result");
		}
		expect(fiscalResult.reasonCode).toBe("FISCAL_MUTATION_BLOCKED");

		const dbMutationResult = validateCodexSandboxOperation({
			...baseRequest,
			operation: "db.update-ledger-snapshot",
		});

		expect(dbMutationResult.allowed).toBe(false);
		if (dbMutationResult.allowed) {
			throw new Error("expected DB mutation deny result");
		}
		expect(dbMutationResult.reasonCode).toBe("DB_MUTATION_BLOCKED");
	});

	it("rejects raw shell/wildcard permissions even for allowed operations and keeps advisory-only metadata non-executable", () => {
		const shellScopeResult = validateCodexSandboxOperation({
			...baseRequest,
			capabilityScope: ["read-sdd-artifacts", "bash:*"],
		});

		expect(shellScopeResult.allowed).toBe(false);
		if (shellScopeResult.allowed) {
			throw new Error("expected raw shell capability-scope deny result");
		}
		expect(shellScopeResult.reasonCode).toBe("RAW_SHELL_EXECUTION_BLOCKED");
		expect(shellScopeResult.metadata.executableCommand).toBeNull();
		expect(shellScopeResult.metadata.advisoryOnly).toBe(true);

		const wildcardNamedScopeResult = validateCodexSandboxOperation({
			...baseRequest,
			capabilityScope: ["read-sdd-artifacts", "advisory.*"],
		});

		expect(wildcardNamedScopeResult.allowed).toBe(false);
		if (wildcardNamedScopeResult.allowed) {
			throw new Error("expected wildcard-pattern deny result");
		}
		expect(wildcardNamedScopeResult.reasonCode).toBe(
			"WILDCARD_PERMISSION_FORBIDDEN",
		);
		expect(wildcardNamedScopeResult.metadata.executableCommand).toBeNull();
		expect(wildcardNamedScopeResult.metadata.advisoryOnly).toBe(true);
	});
});
