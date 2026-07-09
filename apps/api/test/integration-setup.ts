/**
 * Integration Test Setup
 *
 * DOES NOT MOCK anything.
 * Uses real database and real services.
 */

import { vi } from "vitest";

// We DO NOT mock anything for integration tests.
// All imports will resolve to real implementations.

// However, we can still configure global test behavior if needed:

// Increase timeout for integration tests (they're slower)
vi.setConfig({ testTimeout: 10000 });

// Optional: Check that DATABASE_URL is set
if (!process.env.DATABASE_URL) {
	console.warn(
		"⚠️  WARNING: DATABASE_URL not set. Integration tests will use default database.",
	);
	process.env.DATABASE_URL = "postgres://user:password@localhost:5435/arkomix";
}

console.log("✅ Integration test setup complete (no mocks)");
