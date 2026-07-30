import { describe, it, expect } from "vitest";
import {
	WorkspaceError,
	WorkspaceNotFoundError,
	WorkspaceValidationError,
	WorkspaceDuplicateCompanyError,
	WorkspaceSchemaVersionError,
	type WorkspaceErrorCode,
} from "../errors";

describe("WorkspaceError", () => {
	it("should create a base WorkspaceError with code", () => {
		const error = new WorkspaceError("Something went wrong");
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(WorkspaceError);
		expect(error.message).toBe("Something went wrong");
		expect(error.name).toBe("WorkspaceError");
		expect(error.code).toBe("WORKSPACE_UNKNOWN_ERROR");
	});

	it("should accept a custom error code", () => {
		const error = new WorkspaceError(
			"Custom code",
			"WORKSPACE_VALIDATION_ERROR",
		);
		expect(error.code).toBe("WORKSPACE_VALIDATION_ERROR");
	});
});

describe("WorkspaceNotFoundError", () => {
	it("should create with correct message and code", () => {
		const error = new WorkspaceNotFoundError("ws-123");
		expect(error).toBeInstanceOf(WorkspaceError);
		expect(error.message).toContain("ws-123");
		expect(error.code).toBe("WORKSPACE_NOT_FOUND");
		expect(error.name).toBe("WorkspaceNotFoundError");
	});
});

describe("WorkspaceValidationError", () => {
	it("should create with correct message and code", () => {
		const error = new WorkspaceValidationError("companyIds must not be empty");
		expect(error).toBeInstanceOf(WorkspaceError);
		expect(error.message).toBe("companyIds must not be empty");
		expect(error.code).toBe("WORKSPACE_VALIDATION_ERROR");
	});
});

describe("WorkspaceDuplicateCompanyError", () => {
	it("should create with code and formatted message", () => {
		const error = new WorkspaceDuplicateCompanyError("company-a", "ws-123");
		expect(error).toBeInstanceOf(WorkspaceError);
		expect(error.code).toBe("WORKSPACE_DUPLICATE_COMPANY");
		expect(error.message).toContain("company-a");
		expect(error.message).toContain("ws-123");
		expect(error.name).toBe("WorkspaceDuplicateCompanyError");
	});
});

describe("WorkspaceSchemaVersionError", () => {
	it("should create with code and version info", () => {
		const error = new WorkspaceSchemaVersionError(999, 1);
		expect(error).toBeInstanceOf(WorkspaceError);
		expect(error.code).toBe("WORKSPACE_SCHEMA_VERSION");
		expect(error.message).toContain("999");
		expect(error.message).toContain("1");
		expect(error.name).toBe("WorkspaceSchemaVersionError");
	});
});

describe("Error hierarchy", () => {
	it("should allow all errors to be caught as WorkspaceError", () => {
		const notFound = new WorkspaceNotFoundError("ws-abc");
		const validation = new WorkspaceValidationError("invalid");
		const duplicate = new WorkspaceDuplicateCompanyError("co-a", "ws-1");
		const schema = new WorkspaceSchemaVersionError(999, 1);

		expect(notFound instanceof WorkspaceError).toBe(true);
		expect(validation instanceof WorkspaceError).toBe(true);
		expect(duplicate instanceof WorkspaceError).toBe(true);
		expect(schema instanceof WorkspaceError).toBe(true);
	});
});

describe("WorkspaceErrorCode type", () => {
	it("should have all expected codes", () => {
		const codes: WorkspaceErrorCode[] = [
			"WORKSPACE_NOT_FOUND",
			"WORKSPACE_VALIDATION_ERROR",
			"WORKSPACE_DUPLICATE_COMPANY",
			"WORKSPACE_INVALID_STATE",
			"WORKSPACE_SCHEMA_VERSION",
			"WORKSPACE_UNKNOWN_ERROR",
		];
		expect(codes).toHaveLength(6);
	});
});
