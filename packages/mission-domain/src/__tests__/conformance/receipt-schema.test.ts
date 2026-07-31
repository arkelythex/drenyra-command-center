/**
 * Schema conformance for contracts/receipt-schema/v1 (draft-07).
 *
 * REQ-HARNESS-004: every fixture must validate against the canonical
 * schemas using a standard draft-07 validator. Design D1 selects Ajv 8
 * with allErrors + strict mode and ajv-formats for RFC 3339 date-time.
 *
 * All paths resolve from import.meta.url so the suite runs regardless of
 * the process working directory.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv, {
	type AnySchema,
	type ErrorObject,
	type ValidateFunction,
} from "ajv";
import addFormats from "ajv-formats";
import { ReceiptType } from "@drenyra/mission-protocol";
import {
	buildSignedReceipt,
	generateReceiptKeyPair,
	type ReceiptContent,
} from "../../mission-receipt.js";

const conformanceDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(conformanceDir, "../../../../..");

const SCHEMAS_DIR = join(
	repoRoot,
	"contracts",
	"receipt-schema",
	"v1",
	"schemas",
);
const LEGACY_FIXTURE_PATH = join(
	repoRoot,
	"fixtures",
	"receipts",
	"receipt-signed-valid.v1.json",
);

function loadJson(filePath: string): unknown {
	return JSON.parse(readFileSync(filePath, "utf-8")) as unknown;
}

function loadSchema(filePath: string): AnySchema {
	return JSON.parse(readFileSync(filePath, "utf-8")) as AnySchema;
}

function formatErrors(errors: ErrorObject[] | null | undefined): string {
	if (errors === null || errors === undefined || errors.length === 0) {
		return "no errors";
	}
	return errors
		.map((error) => `${error.instancePath || "/"} ${error.message ?? ""}`)
		.join("; ");
}

function compileValidator(
	contentSchema: AnySchema,
	signedReceiptSchema: AnySchema,
	keyInfoSchema: AnySchema,
): { validate: ValidateFunction; warnings: string[] } {
	const warnings: string[] = [];
	const ajv = new Ajv({
		allErrors: true,
		strict: true,
		logger: {
			log: () => {},
			warn: (message: unknown) => warnings.push(String(message)),
			error: () => {},
		},
	});
	addFormats(ajv);
	ajv.addSchema(contentSchema, "receipt-content.schema.json");
	ajv.addSchema(keyInfoSchema, "signing-key-info.schema.json");
	const validate = ajv.compile(signedReceiptSchema);
	return { validate, warnings };
}

function expectSchemaValid(
	validate: ValidateFunction,
	label: string,
	data: unknown,
): void {
	const valid = validate(data);
	expect(valid, `${label} should validate: ${formatErrors(validate.errors)}`).toBe(
		true,
	);
}

function expectSchemaInvalid(
	validate: ValidateFunction,
	label: string,
	data: unknown,
	errorContains: string,
): void {
	const valid = validate(data);
	expect(valid, `${label} should NOT validate`).toBe(false);
	expect(
		formatErrors(validate.errors),
		`${label} error should mention ${errorContains}`,
	).toContain(errorContains);
}

const sampleContent: ReceiptContent = {
	missionId: "mis_schema_test",
	companyId: "cmp_schema_test",
	actorId: "user_schema_test",
	decision: "APPROVE",
	proposalVersion: 3,
	evidenceHash: "a1b2c3d4e5",
	previousStatus: "AWAITING_APPROVAL",
	newStatus: "APPROVED",
	payloadHash: "f6e7d8c9b0",
	timestamp: "2026-07-30T12:00:00Z",
};

describe("receipt-schema contracts (draft-07)", () => {
const contentSchema = loadSchema(join(SCHEMAS_DIR, "receipt-content.schema.json"));
const signedReceiptSchema = loadSchema(
join(SCHEMAS_DIR, "signed-receipt.schema.json"),
);
const keyInfoSchema = loadSchema(
join(SCHEMAS_DIR, "signing-key-info.schema.json"),
);

	const { validate, warnings } = compileValidator(
		contentSchema,
		signedReceiptSchema,
		keyInfoSchema,
	);

	it("compiles the three schemas in Ajv strict mode without warnings", () => {
		expect(warnings, "Ajv strict mode must emit no compilation warnings").toEqual(
			[],
		);
	});

	it("validates a typed SignedReceipt built with buildSignedReceipt", () => {
		const keyPair = generateReceiptKeyPair("key_schema_test");
		const receipt = buildSignedReceipt(sampleContent, keyPair);
		expectSchemaValid(validate, "typed buildSignedReceipt receipt", receipt);
	});

	it("validates the additive legacy signed fixture", () => {
		const fixture = loadJson(LEGACY_FIXTURE_PATH);
		expectSchemaValid(
			validate,
			"fixtures/receipts/receipt-signed-valid.v1.json",
			fixture,
		);
	});

	describe("negative cases (broken fixtures must fail)", () => {
		const fixture = loadJson(LEGACY_FIXTURE_PATH);
		const fixtureRecord = fixture as Record<string, unknown>;
		const content = fixtureRecord.content as Record<string, unknown>;

		it("rejects an unknown receiptType", () => {
			expectSchemaInvalid(
				validate,
				"receiptType BOGUS",
				{ ...fixtureRecord, receiptType: "BOGUS" },
				"receiptType",
			);
		});

		it("rejects a non-hex receiptHash", () => {
			expectSchemaInvalid(
				validate,
				"receiptHash not hex",
				{ ...fixtureRecord, receiptHash: "zz-not-hex" },
				"receiptHash",
			);
		});

		it("rejects extra bundle properties", () => {
			expectSchemaInvalid(
				validate,
				"extra property",
				{ ...fixtureRecord, extraField: "surprise" },
				"additional properties",
			);
		});

		it("rejects content with an unknown decision", () => {
			expectSchemaInvalid(
				validate,
				"decision MAYBE",
				{ ...fixtureRecord, content: { ...content, decision: "MAYBE" } },
				"decision",
			);
		});

		it("rejects content with a non-integer proposalVersion", () => {
			// Non-integer built arithmetically: the schema must enforce integer.
			expectSchemaInvalid(
				validate,
				"proposalVersion non-integer",
				{ ...fixtureRecord, content: { ...content, proposalVersion: 7 / 2 } },
				"proposalVersion",
			);
		});

		it("rejects a bundle missing a required field", () => {
			const missingSignature: Record<string, unknown> = { ...fixtureRecord };
			delete missingSignature.signature;
			expectSchemaInvalid(
				validate,
				"missing signature",
				missingSignature,
				"signature",
			);
		});

		it("rejects a bundle whose receiptType is not a protocol receiptType", () => {
			expectSchemaInvalid(
				validate,
				"receiptType lowercase execution",
				{ ...fixtureRecord, receiptType: "execution" },
				"receiptType",
			);
		});

		it("rejects a bundle whose algorithm is not Ed25519", () => {
			expectSchemaInvalid(
				validate,
				"algorithm RSA",
				{ ...fixtureRecord, algorithm: "RSA" },
				"algorithm",
			);
		});

		it("rejects a bundle with a non-RFC3339 issuedAt", () => {
			expectSchemaInvalid(
				validate,
				"issuedAt not RFC3339",
				{ ...fixtureRecord, issuedAt: "31/07/2026" },
				"issuedAt",
			);
		});
	});

	it("keeps receiptType out of the content schema for COMPLETION bundles", () => {
		const keyPair = generateReceiptKeyPair("key_schema_completion");
		const completion = buildSignedReceipt(
			sampleContent,
			keyPair,
			"1.0",
			ReceiptType.COMPLETION,
		);
		expect(completion.receiptType).toBe(ReceiptType.COMPLETION);
		expectSchemaValid(validate, "typed COMPLETION receipt", completion);
	});
});
