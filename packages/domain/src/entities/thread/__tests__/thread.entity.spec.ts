import { describe, expect, it } from "vitest";
import { Thread } from "../thread.entity";
import type { TaskStatus, ThreadProps, ThreadStatus } from "../types";

function createValidProps(overrides: Partial<ThreadProps> = {}): ThreadProps {
	return {
		id: "thread-1",
		companyId: "company-1",
		title: "Cierre Jun 2026",
		description: "Cierre mensual",
		status: "DRAFT",
		environment: "local",
		period: "2026-06",
		priority: "MEDIUM",
		tags: ["cierre", "igv"],
		tasks: [
			{
				id: "task-1",
				title: "Validar SIRE",
				status: "PENDING",
				evidenceIds: [],
				order: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		],
		agentAssignments: [],
		evidenceIds: [],
		createdById: "user-1",
		createdAt: new Date("2026-07-01"),
		updatedAt: new Date("2026-07-01"),
		...overrides,
	};
}

describe("Thread Entity", () => {
	describe("Creation", () => {
		it("should create a thread in DRAFT state", () => {
			const thread = Thread.create(createValidProps());
			expect(thread.status).toBe("DRAFT");
			expect(thread.title).toBe("Cierre Jun 2026");
		});

		it("should reject empty title", () => {
			expect(() => Thread.create(createValidProps({ title: "" }))).toThrow(
				"Thread title is required",
			);
		});

		it("should reject title over 200 chars", () => {
			expect(() =>
				Thread.create(createValidProps({ title: "x".repeat(201) })),
			).toThrow("Thread title must be at most 200 characters");
		});

		it("should reject invalid period format", () => {
			expect(() =>
				Thread.create(createValidProps({ period: "2026-13" })),
			).toThrow("Thread period must match the pattern YYYY-MM");
		});

		it("should reject more than 10 tags", () => {
			expect(() =>
				Thread.create(
					createValidProps({
						tags: Array.from({ length: 11 }, (_, i) => `tag-${i}`),
					}),
				),
			).toThrow("Thread tags must have at most 10 items");
		});

		it("should create from primitives", () => {
			const thread = Thread.fromPrimitives({
				id: "t-1",
				companyId: "c-1",
				title: "Test",
				status: "DRAFT",
				environment: "local",
				priority: "HIGH",
				tags: [],
				tasks: [],
				agentAssignments: [],
				evidenceIds: [],
				createdById: "u-1",
				createdAt: "2026-07-01T00:00:00Z",
				updatedAt: "2026-07-01T00:00:00Z",
			});
			expect(thread.id).toBe("t-1");
			expect(thread.status).toBe("DRAFT");
		});
	});

	describe("State Machine", () => {
		it("should transition DRAFT → ACTIVE", () => {
			const thread = Thread.create(createValidProps()).activate();
			expect(thread.status).toBe("ACTIVE");
		});

		it("should reject ACTIVATE without tasks", () => {
			expect(() =>
				Thread.create(createValidProps({ tasks: [] })).activate(),
			).toThrow("Cannot activate a thread without at least one task");
		});

		it("should transition ACTIVE → BLOCKED → ACTIVE", () => {
			const thread = Thread.create(createValidProps())
				.activate()
				.block("Waiting for documents");
			expect(thread.status).toBe("BLOCKED");

			const unblocked = thread.unblock();
			expect(unblocked.status).toBe("ACTIVE");
		});

		it("should reject invalid transition", () => {
			const thread = Thread.create(createValidProps());
			expect(() => thread.submitForReview()).toThrow(
				"Cannot transition from DRAFT to PENDING_REVIEW",
			);
		});

		it("should transition ACTIVE → PENDING_REVIEW when all tasks done", () => {
			const tasks = [
				{
					id: "task-1",
					title: "Task 1",
					status: "COMPLETED" as TaskStatus,
					evidenceIds: [],
					order: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];
			const thread = Thread.create(createValidProps({ tasks }))
				.activate()
				.submitForReview();
			expect(thread.status).toBe("PENDING_REVIEW");
		});

		it("should reject submitForReview with incomplete tasks", () => {
			const thread = Thread.create(createValidProps()).activate();
			expect(() => thread.submitForReview()).toThrow(
				"Cannot submit for review until all tasks are completed or skipped",
			);
		});

		it("should transition PENDING_REVIEW → REVIEWED", () => {
			const tasks = [
				{
					id: "task-1",
					title: "Task 1",
					status: "COMPLETED" as TaskStatus,
					evidenceIds: [],
					order: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];
			const thread = Thread.create(createValidProps({ tasks }))
				.activate()
				.submitForReview()
				.review(true);
			expect(thread.status).toBe("REVIEWED");
		});

		it("should transition REVIEWED → CLOSED", () => {
			const tasks = [
				{
					id: "task-1",
					title: "Task 1",
					status: "COMPLETED" as TaskStatus,
					evidenceIds: [],
					order: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];
			const thread = Thread.create(createValidProps({ tasks }))
				.activate()
				.submitForReview()
				.review(true)
				.close("user-1", "Cierre completado");
			expect(thread.status).toBe("CLOSED");
			expect(thread.closedById).toBe("user-1");
			expect(thread.closeNote).toBe("Cierre completado");
		});
	});

	describe("Queries", () => {
		it("should be modifiable when not CLOSED", () => {
			const thread = Thread.create(createValidProps());
			expect(thread.canBeModified()).toBe(true);
		});

		it("should not be modifiable when CLOSED", () => {
			const tasks = [
				{
					id: "task-1",
					title: "Task 1",
					status: "COMPLETED" as TaskStatus,
					evidenceIds: [],
					order: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];
			const thread = Thread.create(createValidProps({ tasks }))
				.activate()
				.submitForReview()
				.review(true)
				.close("user-1");
			expect(thread.canBeModified()).toBe(false);
		});

		it("should compare equality by id", () => {
			const a = Thread.create(createValidProps({ id: "same-id" }));
			const b = Thread.create(createValidProps({ id: "same-id" }));
			expect(a.equals(b)).toBe(true);
		});

		it("should serialize to JSON", () => {
			const thread = Thread.create(createValidProps());
			const json = thread.toJSON();
			expect(json.id).toBe("thread-1");
			expect(json.status).toBe("DRAFT");
			expect(typeof json.createdAt).toBe("string");
		});
	});
});
