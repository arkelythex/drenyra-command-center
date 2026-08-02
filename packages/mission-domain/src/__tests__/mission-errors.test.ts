/**
 * Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents;
 * no float is ever used for money; status/version numbers are JSON integers,
 * never floats. (Object.values over the enum is a code-listing operation, not a
 * monetary amount.)
 */

import { describe, expect, it } from "vitest";
import {
	isMissionError,
	MissionError,
	MissionErrorCode,
} from "../mission-errors.js";

describe("MissionErrorCode (canonical 31-code taxonomy via drenyra-ai)", () => {
	it("defines the canonical code set from the single authority", () => {
		const codes = Object.values(MissionErrorCode);
		expect(codes.length).toBeGreaterThanOrEqual(30);
		expect(codes).toContain("INVALID_TRANSITION");
		expect(codes).toContain("VERSION_CONFLICT");
		expect(codes).toContain("TERMINAL_STATE_GUARD");
		expect(codes).toContain("HARNESS_TIMEOUT");
		expect(codes).toContain("TOKEN_EXPIRED");
		// The legacy domain-only code is retired.
		expect(codes).not.toContain("FORBIDDEN");
	});
});

describe("MissionError (shared class)", () => {
	it("extends Error", () => {
		const err = new MissionError(MissionErrorCode.INVALID_TRANSITION);
		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe("MissionError");
	});

	it("defaults statusCode from the canonical map", () => {
		expect(
			new MissionError(MissionErrorCode.INVALID_TRANSITION).statusCode,
		).toBe(409);
		expect(new MissionError(MissionErrorCode.HARNESS_TIMEOUT).statusCode).toBe(
			504,
		);
	});

	it("allows overriding statusCode", () => {
		const err = new MissionError(MissionErrorCode.INVALID_TRANSITION, 400);
		expect(err.statusCode).toBe(400);
	});

	it("defaults the message to the code when not provided", () => {
		expect(
			new MissionError(MissionErrorCode.MISSION_NOT_FOUND).message,
		).toContain("MISSION_NOT_FOUND");
	});

	it("stores details", () => {
		const err = new MissionError(
			MissionErrorCode.VERSION_CONFLICT,
			409,
			undefined,
			{
				expected: 3,
				current: 5,
			},
		);
		expect(err.details).toEqual({ expected: 3, current: 5 });
	});
});

describe("isMissionError", () => {
	it("returns true for MissionError instances", () => {
		expect(
			isMissionError(new MissionError(MissionErrorCode.INVALID_TRANSITION)),
		).toBe(true);
	});

	it("returns true structurally for MissionError-shaped errors", () => {
		expect(
			isMissionError({
				name: "MissionError",
				code: "INVALID_TRANSITION",
				message: "x",
			}),
		).toBe(true);
	});

	it("returns false for unrelated errors", () => {
		expect(isMissionError(new Error("boom"))).toBe(false);
		expect(isMissionError(null)).toBe(false);
	});
});
