/**
 * Global test setup file for API integration tests.
 *
 * Imports mocks from @drenyra/test-utils and extends with
 * SUNAT and Prometeo mock factories.
 */
import { vi } from "vitest";

// Mock ALL problematic dependencies globally.
// Vitest hoists `vi.mock`; keep declarations at module top-level so setup files do
// not emit nested/hoist warnings for every test file.
vi.mock("@ai-sdk/google", () => ({
	google: vi.fn(() => ({})),
	GoogleGenerativeAI: vi.fn(),
}));

vi.mock("ai", () => ({
	generateText: vi.fn(),
	streamText: vi.fn(),
	generateObject: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", () => ({
	S3Client: vi.fn(),
	PutObjectCommand: vi.fn(),
	GetObjectCommand: vi.fn(),
	DeleteObjectCommand: vi.fn(),
}));

vi.mock("@aws-sdk/lib-storage", () => ({
	Upload: vi.fn(),
}));

vi.mock("bullmq", () => ({
	Queue: vi.fn(),
	Worker: vi.fn(),
	QueueEvents: vi.fn(),
}));

// Mock @/lib/db path aliases from infrastructure package
vi.mock("@/lib/db", () => ({
	default: { query: {} },
	db: { query: {} },
}));

vi.mock("@/lib/db/schema", () => ({}));
vi.mock("@/lib/db/schema-extensions", () => ({}));
vi.mock("@/shared/errors", () => ({}));

vi.mock("@drenyra/shared", async () => {
	const actual =
		await vi.importActual<typeof import("@drenyra/shared")>("@drenyra/shared");

	return {
		...actual,
		SecureLogger: {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			audit: vi.fn(),
			namespace: vi.fn(() => ({
				info: vi.fn(),
				error: vi.fn(),
				warn: vi.fn(),
				debug: vi.fn(),
			})),
		},
	};
});

// Mock SUNAT API using shared test-utils factory.
vi.mock("@drenyra/infrastructure/services/sunat-api", async () => {
	const { createSunatMock } = await vi.importActual<
		typeof import("@drenyra/test-utils/mocks")
	>("@drenyra/test-utils/mocks");
	const mock = createSunatMock();

	return {
		SunatApiService: vi.fn(() => mock),
	};
});

// Mock Prometeo API using shared test-utils factory.
vi.mock("@drenyra/infrastructure/services/prometeo", async () => {
	const { createPrometeoMock } = await vi.importActual<
		typeof import("@drenyra/test-utils/mocks")
	>("@drenyra/test-utils/mocks");
	const mock = createPrometeoMock();

	return {
		PrometeoService: vi.fn(() => mock),
	};
});
