import { describe, it, expect } from "vitest";
import {
  MissionErrorCode,
  MissionError,
  isMissionError,
} from "../mission-errors.js";

describe("MissionErrorCode", () => {
  it("should define all 13 error codes from the spec", () => {
    const codes = Object.values(MissionErrorCode);
    expect(codes).toHaveLength(13);
    expect(codes).toContain("INVALID_TRANSITION");
    expect(codes).toContain("VERSION_CONFLICT");
    expect(codes).toContain("IDEMPOTENCY_CONFLICT");
    expect(codes).toContain("TENANT_MISMATCH");
    expect(codes).toContain("MISSION_NOT_FOUND");
    expect(codes).toContain("ALREADY_EXECUTING");
    expect(codes).toContain("TERMINAL_STATE_GUARD");
    expect(codes).toContain("RECEIPT_VERIFICATION");
    expect(codes).toContain("SSE_CONNECTION_LOST");
    expect(codes).toContain("HARNESS_TIMEOUT");
    expect(codes).toContain("UNAUTHORIZED");
    expect(codes).toContain("FORBIDDEN");
    expect(codes).toContain("EVIDENCE_MISMATCH");
  });
});

describe("MissionError", () => {
  it("should extend Error", () => {
    const err = new MissionError(MissionErrorCode.INVALID_TRANSITION);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(MissionError);
  });

  it("should have the correct name", () => {
    const err = new MissionError(MissionErrorCode.INVALID_TRANSITION);
    expect(err.name).toBe("MissionError");
  });

  it("should store the error code", () => {
    const err = new MissionError(MissionErrorCode.VERSION_CONFLICT);
    expect(err.code).toBe("VERSION_CONFLICT");
  });

  it("should use the default status code from the mapping when not overridden", () => {
    const err = new MissionError(MissionErrorCode.INVALID_TRANSITION);
    expect(err.statusCode).toBe(409);
  });

  it("should allow overriding statusCode via constructor", () => {
    const err = new MissionError(MissionErrorCode.TERMINAL_STATE_GUARD, 409);
    expect(err.statusCode).toBe(409);
  });

  it("should store the message when provided", () => {
    const err = new MissionError(
      MissionErrorCode.INVALID_TRANSITION,
      409,
      "Cannot transition from COMPLETED",
    );
    expect(err.message).toBe("Cannot transition from COMPLETED");
  });

  it("should default message to the error code when not provided", () => {
    const err = new MissionError(MissionErrorCode.MISSION_NOT_FOUND);
    expect(err.message).toContain("MISSION_NOT_FOUND");
  });

  it("should store details as an object", () => {
    const err = new MissionError(MissionErrorCode.VERSION_CONFLICT, 409, undefined, {
      currentVersion: 5,
      expectedVersion: 3,
    });
    expect(err.details).toEqual({ currentVersion: 5, expectedVersion: 3 });
  });

  it("should default details to undefined when not provided", () => {
    const err = new MissionError(MissionErrorCode.INVALID_TRANSITION);
    expect(err.details).toBeUndefined();
  });

  it("should support all error codes with correct default status codes", () => {
    const tests: [MissionErrorCode, number][] = [
      [MissionErrorCode.UNAUTHORIZED, 401],
      [MissionErrorCode.FORBIDDEN, 403],
      [MissionErrorCode.TENANT_MISMATCH, 403],
      [MissionErrorCode.MISSION_NOT_FOUND, 404],
      [MissionErrorCode.INVALID_TRANSITION, 409],
      [MissionErrorCode.VERSION_CONFLICT, 409],
      [MissionErrorCode.IDEMPOTENCY_CONFLICT, 409],
      [MissionErrorCode.ALREADY_EXECUTING, 409],
      [MissionErrorCode.TERMINAL_STATE_GUARD, 409],
      [MissionErrorCode.EVIDENCE_MISMATCH, 409],
      [MissionErrorCode.RECEIPT_VERIFICATION, 500],
      [MissionErrorCode.SSE_CONNECTION_LOST, 500],
      [MissionErrorCode.HARNESS_TIMEOUT, 500],
    ];

    for (const [code, expectedStatus] of tests) {
      const err = new MissionError(code);
      expect(err.statusCode).toBe(expectedStatus);
      expect(err.code).toBe(code);
    }
  });
});

describe("isMissionError", () => {
  it("should return true for MissionError instances", () => {
    const err = new MissionError(MissionErrorCode.INVALID_TRANSITION);
    expect(isMissionError(err)).toBe(true);
  });

  it("should return false for plain Error", () => {
    expect(isMissionError(new Error("boom"))).toBe(false);
  });

  it("should return false for null", () => {
    expect(isMissionError(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isMissionError(undefined)).toBe(false);
  });

  it("should return false for string", () => {
    expect(isMissionError("error")).toBe(false);
  });

  it("should return false for object with code but no name match", () => {
    expect(isMissionError({ name: "Error", code: "INVALID_TRANSITION" })).toBe(false);
  });

  it("should narrow the type in a type guard branch", () => {
    const maybe = new MissionError(MissionErrorCode.TENANT_MISMATCH);
    if (isMissionError(maybe)) {
      const code: MissionErrorCode = maybe.code;
      expect(code).toBe("TENANT_MISMATCH");
    } else {
      expect.fail("should have entered the branch");
    }
  });
});
