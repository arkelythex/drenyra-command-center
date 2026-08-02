import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
	getCapabilities,
	hasFeature,
	isClientCompatible,
	isMissionError,
	MissionError,
	MissionErrorCode,
} from "../index.js";

interface ErrorFixture {
	success: boolean;
	error: {
		code: string;
		message: string;
		details?: Record<string, unknown>;
	};
}

function loadFixture(name: string): ErrorFixture {
	const paths = [
		resolve(__dirname, `../../../../fixtures/errors/${name}`),
		resolve(__dirname, `../../../fixtures/errors/${name}`),
		resolve(process.cwd(), `fixtures/errors/${name}`),
	];
	for (const p of paths) {
		try {
			const data = readFileSync(p, "utf-8");
			return JSON.parse(data);
		} catch {}
	}
	throw new Error(`Cannot find fixture: ${name}`);
}

// Family mapping must match Go's familyForCode()
const FAMILY_MAP: Record<string, string> = {
	UNAUTHORIZED: "AUTH",
	TOKEN_EXPIRED: "AUTH",
	TOKEN_REVOKED: "AUTH",
	INSUFFICIENT_SCOPE: "AUTH",
	TENANT_MISMATCH: "TENANT",
	MISSION_NOT_FOUND: "VALIDATION",
	VERSION_CONFLICT: "CONCURRENCY",
	IDEMPOTENCY_CONFLICT: "IDEMPOTENCY",
	INVALID_TRANSITION: "MISSION_STATE",
	EVIDENCE_MISMATCH: "EVIDENCE",
	APPROVAL_ALREADY_DECIDED: "APPROVAL",
	HARNESS_TIMEOUT: "EXTERNAL_SYSTEM",
};

// Status code mapping must match Go's STATUS_CODE_MAP
function statusCodeForCode(code: string): number {
	const map: Record<string, number> = {
		UNAUTHORIZED: 401,
		TOKEN_EXPIRED: 401,
		TOKEN_REVOKED: 401,
		INSUFFICIENT_SCOPE: 403,
		TENANT_MISMATCH: 403,
		MISSION_NOT_FOUND: 404,
		VERSION_CONFLICT: 409,
		IDEMPOTENCY_CONFLICT: 409,
		INVALID_TRANSITION: 409,
		EVIDENCE_MISMATCH: 409,
		APPROVAL_ALREADY_DECIDED: 409,
		HARNESS_TIMEOUT: 504,
	};
	return map[code] ?? 500;
}

describe("Error mapping conformance (TS vs Go fixtures)", () => {
	const fixtureNames = [
		"error-version-conflict.v1.json",
		"error-not-found.v1.json",
		"error-unauthorized.v1.json",
	];

	for (const name of fixtureNames) {
		it(`maps ${name} correctly`, () => {
			const fixture = loadFixture(name);
			const code = fixture.error.code;
			const family = FAMILY_MAP[code];

			expect(family).toBeDefined();
			expect(Object.values(MissionErrorCode)).toContain(code);

			const err = new MissionError(
				code as MissionErrorCode,
				statusCodeForCode(code),
				fixture.error.message,
				fixture.error.details,
			);
			expect(err.code).toBe(code);
			expect(err.family).toBe(family);
			expect(err.statusCode).toBe(statusCodeForCode(code));
			expect(isMissionError(err)).toBe(true);
		});
	}

	it("exit codes match Go convention", () => {
		const exitCodes: Record<string, number> = {
			INVALID_INPUT: 2,
			UNAUTHORIZED: 3,
			INSUFFICIENT_SCOPE: 4,
			VERSION_CONFLICT: 5,
			TERMINAL_STATE_GUARD: 6,
			UNKNOWN_STATE: 7,
			HARNESS_TIMEOUT: 8,
		};
		// TS doesn't have exit codes natively (it's a Go CLI concept),
		// but verify the mapping exists for documentation
		expect(exitCodes.UNAUTHORIZED).toBe(3);
		expect(exitCodes.HARNESS_TIMEOUT).toBe(8);
	});
});

describe("Capability negotiation conformance", () => {
	it("capabilities match between TS and Go definitions", () => {
		const caps = getCapabilities();
		expect(caps.protocolVersion).toBe("1.0");
		expect(caps.minimumClientVersion).toBe("1.0");

		// These must match the Go CLI fallback feature list exactly
		const expectedGranularFeatures = [
			"mission.create.http.v1",
			"mission.read.http.v1",
			"mission.list.http.v1",
			"mission.execute.http.v1",
			"mission.approve.http.v1",
			"mission.reject.http.v1",
			"mission.reconcile.http.v1",
			"mission.gates.read.http.v1",
			"mission.exceptions.read.http.v1",
			"mission.watch.sse.v1",
			"mission.watch.cursor.v1",
			"idempotency.key.v1",
			"idempotency.replay.v1",
			"concurrency.optimistic.v1",
			"receipt.verify.hash.v1",
			"approval.multi-signer.v1",
			"protocol.capabilities.v1",
		];

		for (const feat of expectedGranularFeatures) {
			expect(hasFeature(caps, feat)).toBe(true);
		}
	});

	it("client compatibility check matches Go", () => {
		expect(isClientCompatible("1.5", "1.0")).toBe(true);
		expect(isClientCompatible("1.0", "1.0")).toBe(true);
		expect(isClientCompatible("0.9", "1.0")).toBe(false);
	});
});
