/**
 * CANONICAL EXAMPLE — Application Layer Test
 *
 * Demonstrates recommended patterns for testing @drenyra/application
 * services, commands, and queries with mock repository injection.
 *
 * Key patterns shown:
 * 1. Mock repository injection
 * 2. Command/Query execution
 * 3. Result assertion
 *
 * @last-verified: 2026-06-06
 */
import { describe, expect, it, vi } from "vitest";
import { JournalEntryBuilder } from "../../src/builders";
import {
	createSunatMock,
	type SunatResponse,
	sunatSuccess,
} from "../../src/mocks";

// ============================================================
// 1. MOCK REPOSITORY INJECTION
// ============================================================

describe("Mock Repository Injection", () => {
	it("injects mock repository into a service", async () => {
		// Arrange: create mock repository
		const mockRepo = {
			findById: vi.fn<() => Promise<unknown>>(),
			save: vi.fn<() => Promise<void>>(),
			delete: vi.fn<() => Promise<void>>(),
		};

		const mockData = { id: "je_001", gloss: "Asiento de prueba" };
		mockRepo.findById.mockResolvedValue(mockData);

		// Act: call the service that uses the mock
		const result = await mockRepo.findById("je_001");

		// Assert: verify interactions
		expect(mockRepo.findById).toHaveBeenCalledWith("je_001");
		expect(result).toEqual(mockData);
	});

	it("handles repository not found", async () => {
		const mockRepo = {
			findById: vi.fn<() => Promise<null>>().mockResolvedValue(null),
		};

		const result = await mockRepo.findById("nonexistent");

		expect(result).toBeNull();
		expect(mockRepo.findById).toHaveBeenCalledTimes(1);
	});

	it("injects mock into an application command handler", async () => {
		// Arrange: create mock for external service
		const sunatMock = createSunatMock();
		sunatMock.sendInvoice.mockResolvedValue(sunatSuccess());

		// Act: simulate command that sends to SUNAT
		const response: SunatResponse = await sunatMock.sendInvoice();

		// Assert: verify the command flow
		expect(sunatMock.sendInvoice).toHaveBeenCalledOnce();
		expect(response.status).toBe("accepted");
		expect(response.cdrCode).toBe("0");
	});
});

// ============================================================
// 2. COMMAND / QUERY PATTERN
// ============================================================

describe("Command/Query Pattern", () => {
	it("executes a CreateJournalEntry command successfully", () => {
		// Arrange: build the command input
		const command = {
			organizationId: 1,
			description: "Pago de servicios",
			lines: [
				{ accountCode: "6311", amount: 500, type: "debit" as const },
				{ accountCode: "1041", amount: 500, type: "credit" as const },
			],
		};

		// Act: execute the command (simulated — creates a JournalEntry)
		const entry = new JournalEntryBuilder()
			.withOrganizationId(command.organizationId)
			.withDescription(command.description)
			.withDebit(command.lines[0].accountCode, command.lines[0].amount)
			.withCredit(command.lines[1].accountCode, command.lines[1].amount)
			.build();

		// Assert: verify the command result
		expect(entry.organizationId).toBe(1);
		expect(entry.gloss).toBe("Pago de servicios");
		expect(entry.isBalanced()).toBe(true);
		expect(entry.status).toBe("borrador");
	});

	it("executes a GetJournalEntry query returning null when not found", async () => {
		// Arrange: mock query handler
		const mockQuery = vi.fn<() => Promise<null>>().mockResolvedValue(null);

		// Act: execute query
		const result = await mockQuery("nonexistent");

		// Assert: verify query result
		expect(result).toBeNull();
		expect(mockQuery).toHaveBeenCalledWith("nonexistent");
	});

	it("executes a GetJournalEntry query returning data", async () => {
		// Arrange: mock query handler with builder output
		const entry = new JournalEntryBuilder()
			.withDebit("1041", 2000)
			.withCredit("7011", 2000)
			.build();

		const mockQuery = vi
			.fn<() => Promise<typeof entry>>()
			.mockResolvedValue(entry);

		// Act: execute query
		const result = await mockQuery("je_002");

		// Assert: verify query result
		expect(result).toBeDefined();
		expect(result.isBalanced()).toBe(true);
		expect(result.getTotalDebit().getAmount()).toBe(2000);
	});
});

// ============================================================
// 3. RESULT ASSERTION PATTERNS
// ============================================================

describe("Result Assertion Patterns", () => {
	it("asserts success result shape", () => {
		const result = {
			success: true,
			data: { id: "je_003", balanced: true },
		};

		expect(result.success).toBe(true);
		expect(result.data.balanced).toBe(true);
	});

	it("asserts error result shape", () => {
		const result = {
			success: false,
			error: {
				code: "UNBALANCED_ENTRY",
				message: "El asiento debe estar balanceado",
			},
		};

		expect(result.success).toBe(false);
		expect(result.error.code).toBe("UNBALANCED_ENTRY");
		expect(result.error.message).toContain("balanceado");
	});

	it("asserts paginated result shape", () => {
		const result = {
			data: [
				{ id: "je_001", gloss: "Asiento 1" },
				{ id: "je_002", gloss: "Asiento 2" },
			],
			metadata: {
				total: 2,
				page: 1,
				pageSize: 10,
			},
		};

		expect(result.data).toHaveLength(2);
		expect(result.metadata.total).toBe(2);
		expect(result.metadata.page).toBe(1);
	});
});
