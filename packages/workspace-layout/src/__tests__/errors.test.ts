import { describe, it, expect } from "vitest";
import {
	LayoutError,
	LayoutNotFoundError,
	LayoutValidationError,
	LayoutConflictError,
	LayoutSchemaVersionError,
	LayoutMigrationError,
	type LayoutErrorCode,
} from "../domain/errors";

describe("LayoutError", () => {
	it("should create a base LayoutError with code", () => {
		const error = new LayoutError("Something went wrong");
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(LayoutError);
		expect(error.message).toBe("Something went wrong");
		expect(error.name).toBe("LayoutError");
		expect(error.code).toBe("LAYOUT_UNKNOWN_ERROR");
	});

	it("should accept a custom error code", () => {
		const error = new LayoutError("Custom code", "LAYOUT_VALIDATION_ERROR");
		expect(error.code).toBe("LAYOUT_VALIDATION_ERROR");
	});
});

describe("LayoutNotFoundError", () => {
	it("should create with correct message and code", () => {
		const error = new LayoutNotFoundError("layout-123");
		expect(error).toBeInstanceOf(LayoutError);
		expect(error.message).toContain("layout-123");
		expect(error.code).toBe("LAYOUT_NOT_FOUND");
		expect(error.name).toBe("LayoutNotFoundError");
	});
});

describe("LayoutValidationError", () => {
	it("should create with correct message and code", () => {
		const error = new LayoutValidationError(
			"ratio must be between 0.1 and 0.9",
		);
		expect(error).toBeInstanceOf(LayoutError);
		expect(error.message).toBe("ratio must be between 0.1 and 0.9");
		expect(error.code).toBe("LAYOUT_VALIDATION_ERROR");
	});
});

describe("LayoutConflictError", () => {
	it("should create with code and formatted message", () => {
		const error = new LayoutConflictError("layout-abc", 3, 5);
		expect(error).toBeInstanceOf(LayoutError);
		expect(error.code).toBe("LAYOUT_CONFLICT");
		expect(error.message).toContain("layout-abc");
		expect(error.message).toContain("3");
		expect(error.message).toContain("5");
		expect(error.name).toBe("LayoutConflictError");
	});
});

describe("LayoutSchemaVersionError", () => {
	it("should create with code and version info", () => {
		const error = new LayoutSchemaVersionError(999, 1);
		expect(error).toBeInstanceOf(LayoutError);
		expect(error.code).toBe("LAYOUT_SCHEMA_VERSION");
		expect(error.message).toContain("999");
		expect(error.message).toContain("1");
		expect(error.name).toBe("LayoutSchemaVersionError");
	});
});

describe("LayoutMigrationError", () => {
	it("should create with code and migration info", () => {
		const error = new LayoutMigrationError("Cannot migrate from version 0");
		expect(error).toBeInstanceOf(LayoutError);
		expect(error.code).toBe("LAYOUT_MIGRATION_ERROR");
		expect(error.message).toBe("Cannot migrate from version 0");
		expect(error.name).toBe("LayoutMigrationError");
	});
});

describe("Error hierarchy", () => {
	it("should allow all errors to be caught as LayoutError", () => {
		const notFound = new LayoutNotFoundError("layout-abc");
		const validation = new LayoutValidationError("invalid");
		const conflict = new LayoutConflictError("layout-1", 2, 3);
		const schema = new LayoutSchemaVersionError(999, 1);
		const migration = new LayoutMigrationError("bad version");

		expect(notFound instanceof LayoutError).toBe(true);
		expect(validation instanceof LayoutError).toBe(true);
		expect(conflict instanceof LayoutError).toBe(true);
		expect(schema instanceof LayoutError).toBe(true);
		expect(migration instanceof LayoutError).toBe(true);
	});
});

describe("LayoutErrorCode type", () => {
	it("should have all expected codes", () => {
		const codes: LayoutErrorCode[] = [
			"LAYOUT_NOT_FOUND",
			"LAYOUT_VALIDATION_ERROR",
			"LAYOUT_SCHEMA_VERSION",
			"LAYOUT_CONFLICT",
			"LAYOUT_MIGRATION_ERROR",
			"LAYOUT_UNKNOWN_ERROR",
		];
		expect(codes).toHaveLength(6);
	});
});
