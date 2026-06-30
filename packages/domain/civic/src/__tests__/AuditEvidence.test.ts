/**
 * AuditEvidence Value Object — Unit Tests
 *
 * Spec: type (image | document | report | data), content, hash, timestamp
 */
import { describe, expect, it } from "vitest";
import {
	AuditEvidence,
	AuditEvidenceType,
} from "../value-object/AuditEvidence";

describe("AuditEvidence", () => {
	describe("Creation", () => {
		it("should create with document type", () => {
			const evidence = AuditEvidence.create({
				type: AuditEvidenceType.DOCUMENT,
				content: "base64-encoded-pdf",
				hash: "sha256-hash-value",
				timestamp: new Date("2026-04-12T10:00:00Z"),
			});

			expect(evidence.type).toBe(AuditEvidenceType.DOCUMENT);
			expect(evidence.content).toBe("base64-encoded-pdf");
			expect(evidence.hash).toBe("sha256-hash-value");
			expect(evidence.timestamp).toEqual(new Date("2026-04-12T10:00:00Z"));
		});

		it("should create with image type", () => {
			const evidence = AuditEvidence.create({
				type: AuditEvidenceType.IMAGE,
				content: "image-bytes",
				hash: "hash-001",
				timestamp: new Date(),
			});

			expect(evidence.type).toBe(AuditEvidenceType.IMAGE);
		});

		it("should create with report type", () => {
			const evidence = AuditEvidence.create({
				type: AuditEvidenceType.REPORT,
				content: "report-content",
				hash: "hash-002",
				timestamp: new Date(),
			});

			expect(evidence.type).toBe(AuditEvidenceType.REPORT);
		});

		it("should create with data type", () => {
			const evidence = AuditEvidence.create({
				type: AuditEvidenceType.DATA,
				content: "data-payload",
				hash: "hash-003",
				timestamp: new Date(),
			});

			expect(evidence.type).toBe(AuditEvidenceType.DATA);
		});
	});

	describe("Immutability", () => {
		it("should be frozen after creation", () => {
			const evidence = AuditEvidence.create({
				type: AuditEvidenceType.DOCUMENT,
				content: "test-content",
				hash: "test-hash",
				timestamp: new Date(),
			});

			expect(Object.isFrozen(evidence)).toBe(true);
		});
	});

	describe("Equality", () => {
		it("should be equal when same hash", () => {
			const date = new Date("2026-04-12T10:00:00Z");
			const a = AuditEvidence.create({
				type: AuditEvidenceType.DOCUMENT,
				content: "content-a",
				hash: "same-hash",
				timestamp: date,
			});
			const b = AuditEvidence.create({
				type: AuditEvidenceType.REPORT,
				content: "content-b",
				hash: "same-hash",
				timestamp: date,
			});

			expect(a.equals(b)).toBe(true);
		});

		it("should not be equal with different hashes", () => {
			const a = AuditEvidence.create({
				type: AuditEvidenceType.DOCUMENT,
				content: "content-a",
				hash: "hash-a",
				timestamp: new Date(),
			});
			const b = AuditEvidence.create({
				type: AuditEvidenceType.DOCUMENT,
				content: "content-a",
				hash: "hash-b",
				timestamp: new Date(),
			});

			expect(a.equals(b)).toBe(false);
		});
	});

	describe("Serialization", () => {
		it("should serialize to JSON", () => {
			const date = new Date("2026-04-12T10:00:00Z");
			const evidence = AuditEvidence.create({
				type: AuditEvidenceType.IMAGE,
				content: "base64-img",
				hash: "sha256:abc123",
				timestamp: date,
			});

			const json = evidence.toJSON();
			expect(json).toEqual({
				type: "IMAGE",
				content: "base64-img",
				hash: "sha256:abc123",
				timestamp: date.toISOString(),
			});
		});
	});
});
