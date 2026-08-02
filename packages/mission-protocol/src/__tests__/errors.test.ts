import { describe, expect, it } from "vitest";
import { isMissionError, MissionError, MissionErrorCode } from "../index.js";

describe("MissionError", () => {
	it("creates error with default status code", () => {
		const err = new MissionError(MissionErrorCode.MISSION_NOT_FOUND);
		expect(err.code).toBe("MISSION_NOT_FOUND");
		expect(err.statusCode).toBe(404);
		expect(err.message).toContain("MISSION_NOT_FOUND");
	});

	it("creates error with custom status code and message", () => {
		const err = new MissionError(
			MissionErrorCode.VERSION_CONFLICT,
			409,
			"custom",
		);
		expect(err.statusCode).toBe(409);
		expect(err.message).toBe("custom");
	});

	it("attaches details", () => {
		const err = new MissionError(
			MissionErrorCode.VERSION_CONFLICT,
			409,
			"msg",
			{ current: 2, expected: 1 },
		);
		expect(err.details).toEqual({ current: 2, expected: 1 });
	});

	it("returns correct family for AUTH errors", () => {
		const err = new MissionError(MissionErrorCode.UNAUTHORIZED);
		expect(err.family).toBe("AUTH");
	});

	it("returns correct family for TENANT errors", () => {
		const err = new MissionError(MissionErrorCode.TENANT_MISMATCH);
		expect(err.family).toBe("TENANT");
	});

	it("returns correct family for CONCURRENCY errors", () => {
		const err = new MissionError(MissionErrorCode.VERSION_CONFLICT);
		expect(err.family).toBe("CONCURRENCY");
	});

	it("marks HARNESS_TIMEOUT as retryable", () => {
		const err = new MissionError(MissionErrorCode.HARNESS_TIMEOUT);
		expect(err.isRetryable).toBe(true);
	});

	it("marks VERSION_CONFLICT as retryable", () => {
		const err = new MissionError(MissionErrorCode.VERSION_CONFLICT);
		expect(err.isRetryable).toBe(true);
	});

	it("marks INVALID_INPUT as not retryable", () => {
		const err = new MissionError(MissionErrorCode.INVALID_INPUT);
		expect(err.isRetryable).toBe(false);
	});

	it("isMissionError type guard works", () => {
		const err = new MissionError(MissionErrorCode.UNAUTHORIZED);
		expect(isMissionError(err)).toBe(true);
		expect(isMissionError(new Error("plain"))).toBe(false);
		expect(isMissionError(null)).toBe(false);
		expect(isMissionError({ name: "MissionError", code: "UNAUTHORIZED" })).toBe(
			true,
		);
	});
});
