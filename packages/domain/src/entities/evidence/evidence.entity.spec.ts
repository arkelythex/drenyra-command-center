import { describe, expect, it } from "vitest";
import { Evidence } from "./evidence.entity";
import type { EvidencePrimitiveData, EvidenceProps } from "./types";

function makeValidProps(overrides?: Partial<EvidenceProps>): EvidenceProps {
	return {
		id: "evt-001",
		organizationId: "org-sunat-2024",
		companyId: "20602018854",
		filename: "factura-001.pdf",
		mimeType: "application/pdf",
		sizeBytes: 1024,
		hash: "a".repeat(64),
		evidenceType: "INVOICE",
		source: "UPLOAD",
		status: "UPLOADED",
		createdAt: new Date("2024-01-01T00:00:00Z"),
		updatedAt: new Date("2024-01-01T00:00:00Z"),
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Static factory: create()
// ---------------------------------------------------------------------------
describe("Evidence.create()", () => {
	it("creates an Evidence with required props", () => {
		const ev = Evidence.create(makeValidProps());

		expect(ev).toBeInstanceOf(Evidence);
		expect(ev.id).toBe("evt-001");
		expect(ev.organizationId).toBe("org-sunat-2024");
		expect(ev.filename).toBe("factura-001.pdf");
		expect(ev.mimeType).toBe("application/pdf");
		expect(ev.sizeBytes).toBe(1024);
		expect(ev.hash).toBe("a".repeat(64));
		expect(ev.evidenceType).toBe("INVOICE");
		expect(ev.source).toBe("UPLOAD");
		expect(ev.status).toBe("UPLOADED");
	});

	it("sets initial status to UPLOADED", () => {
		const ev = Evidence.create(makeValidProps({ status: "UPLOADED" }));
		expect(ev.status).toBe("UPLOADED");
	});

	it("rejects empty filename", () => {
		expect(() => Evidence.create(makeValidProps({ filename: "" }))).toThrow(
			"El nombre del archivo es obligatorio",
		);
	});

	it("rejects whitespace-only filename", () => {
		expect(() => Evidence.create(makeValidProps({ filename: "   " }))).toThrow(
			"El nombre del archivo es obligatorio",
		);
	});

	it("rejects zero sizeBytes", () => {
		expect(() => Evidence.create(makeValidProps({ sizeBytes: 0 }))).toThrow(
			"El tamaño del archivo debe ser mayor a 0",
		);
	});

	it("rejects negative sizeBytes", () => {
		expect(() => Evidence.create(makeValidProps({ sizeBytes: -1 }))).toThrow(
			"El tamaño del archivo debe ser mayor a 0",
		);
	});

	it("rejects non-hex hash", () => {
		expect(() => Evidence.create(makeValidProps({ hash: "zzzz" }))).toThrow(
			/hash SHA-256 debe ser un string hexadecimal/,
		);
	});

	it("rejects short hash", () => {
		expect(() =>
			Evidence.create(makeValidProps({ hash: "a".repeat(63) })),
		).toThrow(/hash SHA-256 debe ser un string hexadecimal/);
	});

	it("accepts optional companyId", () => {
		const ev = Evidence.create(makeValidProps({ companyId: "20602018854" }));
		expect(ev.companyId).toBe("20602018854");
	});

	it("allows undefined companyId", () => {
		const ev = Evidence.create(makeValidProps({ companyId: undefined }));
		expect(ev.companyId).toBeUndefined();
	});

	it("accepts optional metadata", () => {
		const metadata = { department: "finanzas" };
		const ev = Evidence.create(makeValidProps({ metadata }));
		expect(ev.metadata).toEqual(metadata);
	});

	it("accepts optional tags", () => {
		const tags = ["urgent", "revisado"];
		const ev = Evidence.create(makeValidProps({ tags }));
		expect(ev.tags).toEqual(tags);
	});

	it("freezes the instance (Object.freeze)", () => {
		const ev = Evidence.create(makeValidProps());
		expect(Object.isFrozen(ev)).toBe(true);
	});

	it("validates hashChain hash format when hashChain is present", () => {
		expect(() =>
			Evidence.create(
				makeValidProps({
					hashChain: {
						hash: "bad",
						prevHash: null,
						timestamp: "2024-01-01T00:00:00Z",
					},
				}),
			),
		).toThrow("El hash del hashChain debe ser un hexadecimal de 64 caracteres");
	});

	it("validates hashChain prevHash format when non-null", () => {
		expect(() =>
			Evidence.create(
				makeValidProps({
					hashChain: {
						hash: "b".repeat(64),
						prevHash: "bad",
						timestamp: "2024-01-01T00:00:00Z",
					},
				}),
			),
		).toThrow(
			"El prevHash del hashChain debe ser un hexadecimal de 64 caracteres o null",
		);
	});

	it("accepts valid hashChain with prevHash=null (genesis)", () => {
		const ev = Evidence.create(
			makeValidProps({
				hashChain: {
					hash: "c".repeat(64),
					prevHash: null,
					timestamp: "2024-01-01T00:00:00Z",
				},
			}),
		);
		expect(ev.hashChain).toBeDefined();
		expect(ev.hashChain?.hash).toBe("c".repeat(64));
		expect(ev.hashChain?.prevHash).toBeNull();
	});

	it("accepts valid hashChain with prevHash", () => {
		const ev = Evidence.create(
			makeValidProps({
				hashChain: {
					hash: "d".repeat(64),
					prevHash: "c".repeat(64),
					timestamp: "2024-01-01T00:00:00Z",
				},
			}),
		);
		expect(ev.hashChain?.prevHash).toBe("c".repeat(64));
	});
});

// ---------------------------------------------------------------------------
// Static factory: fromPrimitives()
// ---------------------------------------------------------------------------
describe("Evidence.fromPrimitives()", () => {
	it("reconstructs an Evidence from plain data", () => {
		const data: EvidencePrimitiveData = {
			id: "evt-002",
			organizationId: "org-test",
			companyId: "20602018854",
			filename: "reporte.xlsx",
			mimeType:
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			sizeBytes: 2048,
			hash: "f".repeat(64),
			evidenceType: "BANK_STATEMENT",
			source: "EMAIL",
			status: "CLASSIFIED",
			createdAt: "2024-06-15T10:00:00Z",
			updatedAt: "2024-06-15T12:00:00Z",
		};

		const ev = Evidence.fromPrimitives(data);

		expect(ev.id).toBe("evt-002");
		expect(ev.organizationId).toBe("org-test");
		expect(ev.status).toBe("CLASSIFIED");
		expect(ev.evidenceType).toBe("BANK_STATEMENT");
		expect(ev.source).toBe("EMAIL");
	});

	it("sets status from string", () => {
		const ev = Evidence.fromPrimitives({
			id: "x",
			organizationId: "o",
			filename: "f.pdf",
			mimeType: "application/pdf",
			sizeBytes: 1,
			hash: "a".repeat(64),
			evidenceType: "INVOICE",
			source: "UPLOAD",
			status: "REJECTED",
		});
		expect(ev.status).toBe("REJECTED");
	});

	it("defaults createdAt/updatedAt to new Date when absent", () => {
		const ev = Evidence.fromPrimitives({
			id: "x",
			organizationId: "o",
			filename: "f.pdf",
			mimeType: "application/pdf",
			sizeBytes: 1,
			hash: "a".repeat(64),
			evidenceType: "INVOICE",
			source: "UPLOAD",
			status: "UPLOADED",
		});
		expect(ev.createdAt).toBeInstanceOf(Date);
		expect(ev.updatedAt).toBeInstanceOf(Date);
	});

	it("parses Date strings for validatedAt, createdAt, updatedAt", () => {
		const ev = Evidence.fromPrimitives({
			id: "x",
			organizationId: "o",
			filename: "f.pdf",
			mimeType: "application/pdf",
			sizeBytes: 1,
			hash: "a".repeat(64),
			evidenceType: "INVOICE",
			source: "UPLOAD",
			status: "VALIDATED",
			validatedAt: "2024-07-01T00:00:00Z",
			createdAt: "2024-06-01T00:00:00Z",
			updatedAt: "2024-07-01T00:00:00Z",
		});
		expect(ev.validatedAt?.toISOString()).toBe("2024-07-01T00:00:00.000Z");
		expect(ev.createdAt.toISOString()).toBe("2024-06-01T00:00:00.000Z");
	});

	it("validates business rules on reconstruction", () => {
		expect(() =>
			Evidence.fromPrimitives({
				id: "x",
				organizationId: "o",
				filename: "",
				mimeType: "application/pdf",
				sizeBytes: 1,
				hash: "a".repeat(64),
				evidenceType: "INVOICE",
				source: "UPLOAD",
				status: "UPLOADED",
			}),
		).toThrow("El nombre del archivo es obligatorio");
	});
});

// ---------------------------------------------------------------------------
// State machine: markAsExtracting()
// ---------------------------------------------------------------------------
describe("markAsExtracting()", () => {
	it("transitions from UPLOADED to EXTRACTING", () => {
		const ev = Evidence.create(makeValidProps());
		const next = ev.markAsExtracting();
		expect(next.status).toBe("EXTRACTING");
		expect(next.updatedAt.getTime()).toBeGreaterThanOrEqual(
			ev.updatedAt.getTime(),
		);
	});

	it("throws if already EXTRACTING", () => {
		const ev = Evidence.create(makeValidProps({ status: "EXTRACTING" }));
		expect(() => ev.markAsExtracting()).toThrow(/Transición inválida/);
	});

	it("throws if already CLASSIFIED", () => {
		const ev = Evidence.create(makeValidProps({ status: "CLASSIFIED" }));
		expect(() => ev.markAsExtracting()).toThrow(/Transición inválida/);
	});

	it("throws if already VALIDATED", () => {
		const ev = Evidence.create(makeValidProps({ status: "VALIDATED" }));
		expect(() => ev.markAsExtracting()).toThrow(/Transición inválida/);
	});

	it("throws if REJECTED", () => {
		const ev = Evidence.create(makeValidProps({ status: "REJECTED" }));
		expect(() => ev.markAsExtracting()).toThrow(/Transición inválida/);
	});

	it("throws if ERROR", () => {
		const ev = Evidence.create(makeValidProps({ status: "ERROR" }));
		expect(() => ev.markAsExtracting()).toThrow(/Transición inválida/);
	});

	it("does not mutate original instance", () => {
		const ev = Evidence.create(makeValidProps());
		ev.markAsExtracting();
		expect(ev.status).toBe("UPLOADED");
	});
});

// ---------------------------------------------------------------------------
// State machine: markAsClassified()
// ---------------------------------------------------------------------------
describe("markAsClassified()", () => {
	it("transitions from EXTRACTING to CLASSIFIED with evidenceType", () => {
		const ev = Evidence.create(makeValidProps({ status: "EXTRACTING" }));
		const next = ev.markAsClassified("CONTRACT");
		expect(next.status).toBe("CLASSIFIED");
		expect(next.evidenceType).toBe("CONTRACT");
	});

	it("throws if already VALIDATED", () => {
		const ev = Evidence.create(makeValidProps({ status: "VALIDATED" }));
		expect(() => ev.markAsClassified("INVOICE")).toThrow(/Transición inválida/);
	});

	it("throws if status is UPLOADED (invalid transition)", () => {
		const ev = Evidence.create(makeValidProps());
		expect(() => ev.markAsClassified("INVOICE")).toThrow(/Transición inválida/);
	});
});

// ---------------------------------------------------------------------------
// State machine: markAsValidated()
// ---------------------------------------------------------------------------
describe("markAsValidated()", () => {
	it("transitions from CLASSIFIED to VALIDATED with validatedBy", () => {
		const ev = Evidence.create(makeValidProps({ status: "CLASSIFIED" }));
		const next = ev.markAsValidated("user-001");
		expect(next.status).toBe("VALIDATED");
		expect(next.validatedBy).toBe("user-001");
		expect(next.validatedAt).toBeInstanceOf(Date);
	});

	it("throws if status is UPLOADED", () => {
		const ev = Evidence.create(makeValidProps());
		expect(() => ev.markAsValidated("user-001")).toThrow(/Transición inválida/);
	});

	it("throws if already REJECTED", () => {
		const ev = Evidence.create(makeValidProps({ status: "REJECTED" }));
		expect(() => ev.markAsValidated("user-001")).toThrow(/Transición inválida/);
	});
});

// ---------------------------------------------------------------------------
// State machine: markAsRejected()
// ---------------------------------------------------------------------------
describe("markAsRejected()", () => {
	it("transitions from UPLOADED to REJECTED with reason", () => {
		const ev = Evidence.create(makeValidProps());
		const next = ev.markAsRejected("Documento ilegible");
		expect(next.status).toBe("REJECTED");
		expect(next.errorMessage).toBe("Documento ilegible");
	});

	it("throws if EXTRACTING (invalid transition to REJECTED)", () => {
		const ev = Evidence.create(makeValidProps({ status: "EXTRACTING" }));
		expect(() => ev.markAsRejected("No se pudo extraer datos")).toThrow(
			/Transición inválida/,
		);
	});

	it("transitions from CLASSIFIED to REJECTED", () => {
		const ev = Evidence.create(makeValidProps({ status: "CLASSIFIED" }));
		const next = ev.markAsRejected("Clasificación incorrecta");
		expect(next.status).toBe("REJECTED");
	});

	it("transitions from VALIDATED to REJECTED", () => {
		const ev = Evidence.create(makeValidProps({ status: "VALIDATED" }));
		const next = ev.markAsRejected("Inconsistencias encontradas");
		expect(next.status).toBe("REJECTED");
	});

	it("throws if already REJECTED", () => {
		const ev = Evidence.create(makeValidProps({ status: "REJECTED" }));
		expect(() => ev.markAsRejected("otra vez")).toThrow(/Transición inválida/);
	});

	it("throws if already ERROR", () => {
		const ev = Evidence.create(makeValidProps({ status: "ERROR" }));
		expect(() => ev.markAsRejected("ya en error")).toThrow(
			/Transición inválida/,
		);
	});
});

// ---------------------------------------------------------------------------
// State machine: markAsError()
// ---------------------------------------------------------------------------
describe("markAsError()", () => {
	it("transitions from UPLOADED to ERROR", () => {
		const ev = Evidence.create(makeValidProps());
		const next = ev.markAsError("Fallo en el antivirus");
		expect(next.status).toBe("ERROR");
		expect(next.errorMessage).toBe("Fallo en el antivirus");
	});

	it("transitions from EXTRACTING to ERROR", () => {
		const ev = Evidence.create(makeValidProps({ status: "EXTRACTING" }));
		const next = ev.markAsError("Timeout de extracción");
		expect(next.status).toBe("ERROR");
	});

	it("transitions from CLASSIFIED to ERROR", () => {
		const ev = Evidence.create(makeValidProps({ status: "CLASSIFIED" }));
		const next = ev.markAsError("Error de clasificación");
		expect(next.status).toBe("ERROR");
	});

	it("transitions from VALIDATED to ERROR", () => {
		const ev = Evidence.create(makeValidProps({ status: "VALIDATED" }));
		const next = ev.markAsError("Error post-validación");
		expect(next.status).toBe("ERROR");
	});

	it("throws if already ERROR", () => {
		const ev = Evidence.create(makeValidProps({ status: "ERROR" }));
		expect(() => ev.markAsError("otro error")).toThrow(/Transición inválida/);
	});

	it("throws if already REJECTED", () => {
		const ev = Evidence.create(makeValidProps({ status: "REJECTED" }));
		expect(() => ev.markAsError("ya rechazado")).toThrow(/Transición inválida/);
	});
});

// ---------------------------------------------------------------------------
// Hash chain
// ---------------------------------------------------------------------------
describe("updateHashChain()", () => {
	it("returns a new Evidence with hashChain updated (genesis)", async () => {
		const ev = Evidence.create(makeValidProps());
		const next = await ev.updateHashChain(null);

		expect(next.hashChain).toBeDefined();
		expect(next.hashChain?.hash).toMatch(/^[0-9a-f]{64}$/);
		expect(next.hashChain?.prevHash).toBeNull();
		expect(next.hashChain?.timestamp).toBeDefined();
		expect(next).not.toBe(ev);
	});

	it("stores currentHash and prevHash", async () => {
		const ev = Evidence.create(makeValidProps());
		const prev = await ev.updateHashChain(null);
		const next = await prev.updateHashChain(prev.hashChain?.hash);

		expect(next.hashChain?.prevHash).toBe(prev.hashChain?.hash);
		expect(next.hashChain?.hash).not.toBe(prev.hashChain?.hash);
	});

	it("produces deterministic hash for same payload+prevHash", async () => {
		const a = await Evidence.create(makeValidProps()).updateHashChain(null);
		const b = await Evidence.create(makeValidProps()).updateHashChain(null);

		expect(a.hashChain?.hash).toBe(b.hashChain?.hash);
	});

	it("produces different hash when payload differs", async () => {
		const a = await Evidence.create(
			makeValidProps({ filename: "a.pdf" }),
		).updateHashChain(null);
		const b = await Evidence.create(
			makeValidProps({ filename: "b.pdf" }),
		).updateHashChain(null);

		expect(a.hashChain?.hash).not.toBe(b.hashChain?.hash);
	});

	it("produces different hash when prevHash differs", async () => {
		const ev = Evidence.create(makeValidProps());
		const first = await ev.updateHashChain(null);
		const second = await ev.updateHashChain(first.hashChain?.hash);

		expect(first.hashChain?.hash).not.toBe(second.hashChain?.hash);
	});
});

// ---------------------------------------------------------------------------
// equals()
// ---------------------------------------------------------------------------
describe("equals()", () => {
	it("returns true for same id", () => {
		const a = Evidence.create(makeValidProps());
		const b = Evidence.create(makeValidProps());
		expect(a.equals(b)).toBe(true);
	});

	it("returns false for different id", () => {
		const a = Evidence.create(makeValidProps());
		const b = Evidence.create(makeValidProps({ id: "evt-002" }));
		expect(a.equals(b)).toBe(false);
	});

	it("returns false against null", () => {
		const ev = Evidence.create(makeValidProps());
		expect(ev.equals(null)).toBe(false);
	});

	it("returns false against undefined", () => {
		const ev = Evidence.create(makeValidProps());
		expect(ev.equals(undefined)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------
describe("toJSON()", () => {
	it("returns correct structure", () => {
		const ev = Evidence.create(makeValidProps());
		const json = ev.toJSON();

		expect(json.id).toBe("evt-001");
		expect(json.organizationId).toBe("org-sunat-2024");
		expect(json.filename).toBe("factura-001.pdf");
		expect(json.status).toBe("UPLOADED");
		expect(json.evidenceType).toBe("INVOICE");
		expect(json.source).toBe("UPLOAD");
		expect(json.sizeBytes).toBe(1024);
		expect(json.hash).toBe("a".repeat(64));
	});

	it("serializes Date fields as ISO strings", () => {
		const ev = Evidence.create(makeValidProps());
		const json = ev.toJSON();

		expect(typeof json.createdAt).toBe("string");
		expect(typeof json.updatedAt).toBe("string");
		expect(json.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	it("includes validatedAt and validatedBy when present", () => {
		const ev = Evidence.create(
			makeValidProps({ status: "CLASSIFIED" }),
		).markAsValidated("admin");
		const json = ev.toJSON();

		expect(json.validatedBy).toBe("admin");
		expect(json.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	it("omits validatedAt/validatedBy when not present", () => {
		const ev = Evidence.create(makeValidProps());
		const json = ev.toJSON();

		expect(json.validatedBy).toBeUndefined();
		expect(json.validatedAt).toBeUndefined();
	});

	it("includes errorMessage when present", () => {
		const ev = Evidence.create(makeValidProps()).markAsError("algo salió mal");
		const json = ev.toJSON();

		expect(json.status).toBe("ERROR");
		expect(json.errorMessage).toBe("algo salió mal");
	});

	it("includes tags and metadata when present", () => {
		const ev = Evidence.create(
			makeValidProps({ tags: ["tag1"], metadata: { key: "val" } }),
		);
		const json = ev.toJSON();

		expect(json.tags).toEqual(["tag1"]);
		expect(json.metadata).toEqual({ key: "val" });
	});

	it("round-trips via fromPrimitives + toJSON", () => {
		const original = Evidence.create(
			makeValidProps({
				id: "evt-round",
				filename: "roundtrip.pdf",
				status: "UPLOADED",
			}),
		);
		const json = original.toJSON() as unknown as EvidencePrimitiveData;
		const restored = Evidence.fromPrimitives(json);

		expect(restored.id).toBe(original.id);
		expect(restored.filename).toBe(original.filename);
		expect(restored.status).toBe(original.status);
		expect(restored.createdAt.toISOString()).toBe(
			original.createdAt.toISOString(),
		);
	});

	it("includes hashChain when present", async () => {
		const ev = Evidence.create(makeValidProps());
		const withChain = await ev.updateHashChain(null);
		const json = withChain.toJSON();

		expect(json.hashChain).toBeDefined();
		expect((json.hashChain as { hash: string }).hash).toMatch(/^[0-9a-f]{64}$/);
	});
});

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------
describe("getters", () => {
	it("return correct values for all props", () => {
		const date = new Date("2024-01-01T00:00:00Z");
		const ev = Evidence.create(
			makeValidProps({
				companyId: "20602018854",
				metadata: { foo: "bar" },
				extractedData: { amount: 100 },
				classifierResult: { type: "INVOICE", confidence: 0.95 },
				tags: ["urgente"],
				validatedAt: date,
				validatedBy: "user-01",
				errorMessage: undefined,
			}),
		);

		expect(ev.companyId).toBe("20602018854");
		expect(ev.metadata).toEqual({ foo: "bar" });
		expect(ev.extractedData).toEqual({ amount: 100 });
		expect(ev.classifierResult).toEqual({ type: "INVOICE", confidence: 0.95 });
		expect(ev.tags).toEqual(["urgente"]);
		expect(ev.validatedAt).toEqual(date);
		expect(ev.validatedBy).toBe("user-01");
		expect(ev.errorMessage).toBeUndefined();
		expect(ev.hashChain).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// Full lifecycle (integration-style)
// ---------------------------------------------------------------------------
describe("full lifecycle", () => {
	it("traces a happy path through all states", () => {
		const ev = Evidence.create(makeValidProps());
		expect(ev.status).toBe("UPLOADED");

		const extracting = ev.markAsExtracting();
		expect(extracting.status).toBe("EXTRACTING");

		const classified = extracting.markAsClassified("CONTRACT");
		expect(classified.status).toBe("CLASSIFIED");
		expect(classified.evidenceType).toBe("CONTRACT");

		const validated = classified.markAsValidated("auditor-01");
		expect(validated.status).toBe("VALIDATED");
		expect(validated.validatedBy).toBe("auditor-01");

		const archived = validated.markAsRejected("Documento duplicado");
		expect(archived.status).toBe("REJECTED");
		expect(archived.errorMessage).toBe("Documento duplicado");
	});

	it("traces UPLOADED → ERROR → terminal", () => {
		const ev = Evidence.create(makeValidProps());
		const errored = ev.markAsError("falló la carga");
		expect(errored.status).toBe("ERROR");
		expect(() => errored.markAsError("otro")).toThrow(/Transición inválida/);
		expect(() => errored.markAsExtracting()).toThrow(/Transición inválida/);
	});

	it("original is not mutated by transitions", () => {
		const ev = Evidence.create(makeValidProps());
		ev.markAsExtracting();
		ev.markAsError("test");
		expect(ev.status).toBe("UPLOADED");
	});
});
