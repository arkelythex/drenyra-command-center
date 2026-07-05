/**
 * Agent Error Tests
 *
 * @module __tests__/services/error-recovery
 */

import { describe, expect, it } from "vitest";
import {
	AgentError,
	classifyError,
	FiscalViolationError,
	InvalidInputError,
	NetworkError,
	ProviderError,
	RateLimitError,
	TimeoutError,
	ValidationError,
} from "../../../src/services/error-recovery/agent-error";

// ─── AgentError Construction ──────────────────────────────────────────────────

describe("AgentError", () => {
	it("creates a TRANSIENT error with the given properties", () => {
		const err = new AgentError({
			message: "Something went wrong",
			type: "TRANSIENT",
			agentName: "reader",
			details: { attempt: 3 },
		});

		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe("AgentError");
		expect(err.message).toBe("Something went wrong");
		expect(err.type).toBe("TRANSIENT");
		expect(err.agentName).toBe("reader");
		expect(err.details).toEqual({ attempt: 3 });
		expect(err.recoverable).toBe(true);
		expect(err.retryable).toBe(true);
	});

	it("creates a PERMANENT error that is not retryable", () => {
		const err = new AgentError({
			message: "Invalid input",
			type: "PERMANENT",
			agentName: "validator",
		});

		expect(err.type).toBe("PERMANENT");
		expect(err.recoverable).toBe(false);
		expect(err.retryable).toBe(false);
	});

	it("creates an UNKNOWN error that is retryable by default", () => {
		const err = new AgentError({
			message: "Unexpected failure",
			type: "UNKNOWN",
			agentName: "parser",
		});

		expect(err.type).toBe("UNKNOWN");
		expect(err.recoverable).toBe(true);
		expect(err.retryable).toBe(true);
	});

	it("defaults details to empty object when not provided", () => {
		const err = new AgentError({
			message: "test",
			type: "TRANSIENT",
			agentName: "agent",
		});

		expect(err.details).toEqual({});
	});
});

// ─── Transient Subclasses ─────────────────────────────────────────────────────

describe("TimeoutError", () => {
	it("has type TRANSIENT and default message", () => {
		const err = new TimeoutError({ agentName: "reader" });
		expect(err).toBeInstanceOf(AgentError);
		expect(err.type).toBe("TRANSIENT");
		expect(err.message).toContain("reader");
		expect(err.name).toBe("TimeoutError");
		expect(err.retryable).toBe(true);
	});

	it("accepts a custom message", () => {
		const err = new TimeoutError({
			message: "Custom timeout",
			agentName: "reader",
		});
		expect(err.message).toBe("Custom timeout");
	});
});

describe("RateLimitError", () => {
	it("has type TRANSIENT and optional retryAfter", () => {
		const err = new RateLimitError({
			agentName: "provider",
			retryAfter: 30,
		});
		expect(err.type).toBe("TRANSIENT");
		expect(err.retryAfter).toBe(30);
		expect(err.name).toBe("RateLimitError");
	});

	it("defaults retryAfter to undefined", () => {
		const err = new RateLimitError({ agentName: "provider" });
		expect(err.retryAfter).toBeUndefined();
	});
});

describe("NetworkError", () => {
	it("has type TRANSIENT", () => {
		const err = new NetworkError({ agentName: "reader" });
		expect(err.type).toBe("TRANSIENT");
		expect(err.name).toBe("NetworkError");
	});
});

describe("ProviderError", () => {
	it("has type TRANSIENT with provider and statusCode", () => {
		const err = new ProviderError({
			agentName: "reader",
			provider: "openai",
			statusCode: 502,
		});
		expect(err.type).toBe("TRANSIENT");
		expect(err.provider).toBe("openai");
		expect(err.statusCode).toBe(502);
		expect(err.name).toBe("ProviderError");
	});
});

// ─── Permanent Subclasses ─────────────────────────────────────────────────────

describe("ValidationError", () => {
	it("has type PERMANENT", () => {
		const err = new ValidationError({ agentName: "validator" });
		expect(err.type).toBe("PERMANENT");
		expect(err.retryable).toBe(false);
		expect(err.name).toBe("ValidationError");
	});
});

describe("InvalidInputError", () => {
	it("has type PERMANENT", () => {
		const err = new InvalidInputError({ agentName: "parser" });
		expect(err.type).toBe("PERMANENT");
		expect(err.retryable).toBe(false);
		expect(err.name).toBe("InvalidInputError");
	});
});

describe("FiscalViolationError", () => {
	it("has type PERMANENT", () => {
		const err = new FiscalViolationError({ agentName: "validator" });
		expect(err.type).toBe("PERMANENT");
		expect(err.retryable).toBe(false);
		expect(err.name).toBe("FiscalViolationError");
	});
});

// ─── classifyError ────────────────────────────────────────────────────────────

describe("classifyError", () => {
	it("classifies timeout messages as TRANSIENT (TimeoutError)", () => {
		const err = classifyError(
			new Error("Request timed out after 30s"),
			"reader",
		);
		expect(err.type).toBe("TRANSIENT");
		expect(err).toBeInstanceOf(TimeoutError);
		expect(err.agentName).toBe("reader");
	});

	it("classifies network errors as TRANSIENT (NetworkError)", () => {
		const err = classifyError(
			new Error("network error: connection refused"),
			"reader",
		);
		expect(err.type).toBe("TRANSIENT");
		expect(err).toBeInstanceOf(NetworkError);
	});

	it("classifies ECONNREFUSED as TRANSIENT (NetworkError)", () => {
		const err = classifyError(new Error("econnrefused"), "reader");
		expect(err.type).toBe("TRANSIENT");
		expect(err).toBeInstanceOf(NetworkError);
	});

	it("classifies ECONNRESET as TRANSIENT (NetworkError)", () => {
		const err = classifyError(new Error("econnreset"), "reader");
		expect(err.type).toBe("TRANSIENT");
		expect(err).toBeInstanceOf(NetworkError);
	});

	it("classifies 429 rate limit as TRANSIENT (RateLimitError)", () => {
		const err = classifyError(new Error("429 Too Many Requests"), "provider");
		expect(err.type).toBe("TRANSIENT");
		expect(err).toBeInstanceOf(RateLimitError);
	});

	it("classifies 503 as TRANSIENT (ProviderError)", () => {
		const err = classifyError(new Error("503 Service Unavailable"), "reader");
		expect(err.type).toBe("TRANSIENT");
		expect(err).toBeInstanceOf(ProviderError);
		expect((err as ProviderError).statusCode).toBe(503);
	});

	it("classifies 502 as TRANSIENT", () => {
		const err = classifyError(new Error("502 Bad Gateway"), "reader");
		expect(err.type).toBe("TRANSIENT");
	});

	it("classifies validation messages as PERMANENT (ValidationError)", () => {
		const err = classifyError(
			new Error("Validation failed: field is required"),
			"validator",
		);
		expect(err.type).toBe("PERMANENT");
		expect(err).toBeInstanceOf(ValidationError);
	});

	it("classifies 'invalid' messages as PERMANENT (InvalidInputError)", () => {
		const err = classifyError(new Error("Invalid input data"), "parser");
		expect(err.type).toBe("PERMANENT");
		expect(err).toBeInstanceOf(InvalidInputError);
	});

	it("classifies 400 as PERMANENT (InvalidInputError)", () => {
		const err = classifyError(new Error("400 Bad Request"), "parser");
		expect(err.type).toBe("PERMANENT");
		expect(err).toBeInstanceOf(InvalidInputError);
	});

	it("classifies 403 as PERMANENT (InvalidInputError)", () => {
		const err = classifyError(new Error("403 Forbidden"), "reader");
		expect(err.type).toBe("PERMANENT");
		expect(err).toBeInstanceOf(InvalidInputError);
	});

	it("classifies fiscal violation as PERMANENT (FiscalViolationError)", () => {
		const err = classifyError(
			new Error("Fiscal violation: IGV rate mismatch"),
			"validator",
		);
		expect(err.type).toBe("PERMANENT");
		expect(err).toBeInstanceOf(FiscalViolationError);
	});

	it("classifies unknown errors as UNKNOWN", () => {
		const err = classifyError(
			new Error("Something completely unexpected"),
			"agent",
		);
		expect(err.type).toBe("UNKNOWN");
		expect(err).toBeInstanceOf(AgentError);
		expect(err.retryable).toBe(true);
	});

	it("handles non-Error values gracefully", () => {
		const err = classifyError("string error", "agent");
		expect(err.type).toBe("UNKNOWN");
		expect(err.message).toBe("string error");
	});

	it("handles null/undefined as UNKNOWN", () => {
		const err = classifyError(null, "agent");
		expect(err.type).toBe("UNKNOWN");
		expect(err.message).toBe("Unknown error");
	});
});
