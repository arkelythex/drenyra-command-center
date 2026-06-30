/**
 * Election Entity — Unit Tests
 *
 * Spec: id, name, date, region, status (draft | active | completed | audited), pollingStationIds[]
 */
import { describe, expect, it } from "vitest";
import { Election, ElectionStatus } from "../entity/Election";

describe("Election", () => {
	describe("Creation", () => {
		it("should create with draft status by default", () => {
			const election = Election.create({
				name: "Elecciones Generales 2026",
				date: new Date("2026-04-12"),
				region: "Nacional",
			});

			expect(election.name).toBe("Elecciones Generales 2026");
			expect(election.date).toEqual(new Date("2026-04-12"));
			expect(election.region).toBe("Nacional");
			expect(election.status).toBe(ElectionStatus.DRAFT);
			expect(election.pollingStationIds).toEqual([]);
		});

		it("should create with explicit status", () => {
			const election = Election.create({
				name: "Elecciones Regionales",
				date: new Date("2026-10-06"),
				region: "Lima",
				status: ElectionStatus.ACTIVE,
			});

			expect(election.status).toBe(ElectionStatus.ACTIVE);
		});

		it("should create with polling stations", () => {
			const election = Election.create({
				name: "Test Election",
				date: new Date("2026-04-12"),
				region: "Test",
				pollingStationIds: ["ps-1", "ps-2"],
			});

			expect(election.pollingStationIds).toHaveLength(2);
			expect(election.pollingStationIds[0]).toBe("ps-1");
		});
	});

	describe("Status Transitions", () => {
		it("should activate from draft", () => {
			const election = Election.create({
				name: "Test",
				date: new Date("2026-04-12"),
				region: "Test",
			});

			const activated = election.activate();
			expect(activated.status).toBe(ElectionStatus.ACTIVE);
			expect(election.status).toBe(ElectionStatus.DRAFT); // original unchanged
		});

		it("should complete from active", () => {
			const election = Election.create({
				name: "Test",
				date: new Date("2026-04-12"),
				region: "Test",
				status: ElectionStatus.ACTIVE,
			});

			const completed = election.complete();
			expect(completed.status).toBe(ElectionStatus.COMPLETED);
		});

		it("should throw when completing from draft", () => {
			const election = Election.create({
				name: "Test",
				date: new Date("2026-04-12"),
				region: "Test",
			});

			expect(() => election.complete()).toThrow(
				/Cannot transition election from DRAFT to COMPLETED/,
			);
		});

		it("should audit from completed", () => {
			const election = Election.create({
				name: "Test",
				date: new Date("2026-04-12"),
				region: "Test",
				status: ElectionStatus.COMPLETED,
			});

			const audited = election.audit();
			expect(audited.status).toBe(ElectionStatus.AUDITED);
		});

		it("should throw when auditing from draft", () => {
			const election = Election.create({
				name: "Test",
				date: new Date("2026-04-12"),
				region: "Test",
			});

			expect(() => election.audit()).toThrow(
				/Cannot transition election from DRAFT to AUDITED/,
			);
		});
	});

	describe("Polling Station Management", () => {
		it("should add polling station", () => {
			const election = Election.create({
				name: "Test",
				date: new Date("2026-04-12"),
				region: "Test",
			});

			const updated = election.addPollingStation("ps-1");
			expect(updated.pollingStationIds).toHaveLength(1);
			expect(updated.pollingStationIds[0]).toBe("ps-1");
		});

		it("should not add duplicate polling stations", () => {
			const election = Election.create({
				name: "Test",
				date: new Date("2026-04-12"),
				region: "Test",
				pollingStationIds: ["ps-1"],
			});

			expect(() => election.addPollingStation("ps-1")).toThrow(
				/Polling station ps-1 already registered/,
			);
		});
	});

	describe("Immutability", () => {
		it("should be frozen after creation", () => {
			const election = Election.create({
				name: "Test",
				date: new Date("2026-04-12"),
				region: "Test",
			});

			expect(Object.isFrozen(election)).toBe(true);
		});

		it("should return new instance on status change", () => {
			const election = Election.create({
				name: "Test",
				date: new Date("2026-04-12"),
				region: "Test",
			});

			const activated = election.activate();
			expect(activated).not.toBe(election);
		});
	});

	describe("Serialization", () => {
		it("should serialize to JSON", () => {
			const election = Election.create({
				name: "Test",
				date: new Date("2026-04-12"),
				region: "Test",
				pollingStationIds: ["ps-1"],
			});

			const json = election.toJSON();
			expect(json).toHaveProperty("id");
			expect(json.name).toBe("Test");
			expect(json.status).toBe("DRAFT");
			expect(json.pollingStationIds).toEqual(["ps-1"]);
		});
	});
});
