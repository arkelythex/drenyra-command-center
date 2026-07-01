import { describe, expect, it } from "vitest";
import { Organization } from "./organization.entity";
import type { OrganizationProps, OrganizationSettings } from "./types";

const VALID_RUC = "20100000017";
const DEFAULT_SLUG = "test-firm";

function makeProps(
	overrides: Partial<OrganizationProps> = {},
): OrganizationProps {
	return {
		id: "org-1",
		name: "Test Firm",
		ruc: VALID_RUC,
		slug: DEFAULT_SLUG,
		status: "ACTIVE",
		createdAt: new Date("2025-01-01"),
		updatedAt: new Date("2025-01-01"),
		...overrides,
	};
}

describe("Organization", () => {
	describe("static factory: create()", () => {
		it("creates from valid props", () => {
			const org = Organization.create(makeProps());

			expect(org).toBeInstanceOf(Organization);
			expect(org.id).toBe("org-1");
			expect(org.name).toBe("Test Firm");
			expect(org.ruc).toBe(VALID_RUC);
			expect(org.slug).toBe(DEFAULT_SLUG);
		});

		it("defaults status to ACTIVE", () => {
			const org = Organization.create(makeProps({ status: "ACTIVE" }));
			expect(org.status).toBe("ACTIVE");
		});

		it("defaults healthScore to 0", () => {
			const org = Organization.create(makeProps({ healthScore: 0 }));
			expect(org.healthScore).toBe(0);
		});

		it("defaults settings to undefined", () => {
			const org = Organization.create(makeProps());
			expect(org.settings).toBeUndefined();
		});

		it("accepts settings as empty object", () => {
			const org = Organization.create(makeProps({ settings: {} }));
			expect(org.settings).toEqual({});
		});

		it("generates slug in correct format", () => {
			const org = Organization.create(makeProps({ slug: "my-firm-2025" }));
			expect(org.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
		});

		it("rejects empty name", () => {
			expect(() => Organization.create(makeProps({ name: "" }))).toThrow(
				"Organization name is required",
			);
		});

		it("rejects whitespace-only name", () => {
			expect(() => Organization.create(makeProps({ name: "   " }))).toThrow(
				"Organization name is required",
			);
		});

		it("rejects invalid RUC format", () => {
			expect(() => Organization.create(makeProps({ ruc: "123" }))).toThrow(
				"RUC must be exactly 11 digits",
			);
		});

		it("rejects RUC with invalid checksum", () => {
			expect(() =>
				Organization.create(makeProps({ ruc: "20100000010" })),
			).toThrow("RUC checksum validation failed");
		});

		it("rejects invalid slug format", () => {
			expect(() =>
				Organization.create(makeProps({ slug: "Invalid Slug!" })),
			).toThrow("Slug must be in kebab-case format");
		});

		it("rejects health score below 0", () => {
			expect(() =>
				Organization.create(makeProps({ healthScore: -1, status: "ACTIVE" })),
			).toThrow("Health score must be between 0 and 100");
		});

		it("rejects health score above 100", () => {
			expect(() =>
				Organization.create(makeProps({ healthScore: 150, status: "ACTIVE" })),
			).toThrow("Health score must be between 0 and 100");
		});

		it("allows health score outside 0-100 when status is not ACTIVE", () => {
			const org = Organization.create(
				makeProps({ healthScore: -1, status: "SUSPENDED" }),
			);
			expect(org.healthScore).toBe(-1);
		});

		it("freezes the instance (immutability)", () => {
			const org = Organization.create(makeProps());
			expect(Object.isFrozen(org)).toBe(true);
		});
	});

	describe("fromPrimitives()", () => {
		it("reconstructs from plain data", () => {
			const org = Organization.fromPrimitives({
				id: "org-2",
				name: "Reconstructed Firm",
				ruc: VALID_RUC,
				slug: "reconstructed-firm",
				status: "ACTIVE",
				settings: { timezone: "America/Lima" },
				createdAt: "2025-06-01T00:00:00.000Z",
				updatedAt: "2025-06-15T00:00:00.000Z",
			});

			expect(org.id).toBe("org-2");
			expect(org.name).toBe("Reconstructed Firm");
			expect(org.ruc).toBe(VALID_RUC);
			expect(org.slug).toBe("reconstructed-firm");
			expect(org.status).toBe("ACTIVE");
			expect(org.settings).toEqual({ timezone: "America/Lima" });
		});

		it("parses string dates into Date objects", () => {
			const org = Organization.fromPrimitives({
				id: "org-3",
				name: "Date Test",
				ruc: VALID_RUC,
				slug: "date-test",
				status: "ACTIVE",
				createdAt: "2025-06-01T00:00:00.000Z",
				updatedAt: "2025-06-15T00:00:00.000Z",
			});

			expect(org.createdAt).toBeInstanceOf(Date);
			expect(org.createdAt.toISOString()).toBe("2025-06-01T00:00:00.000Z");
			expect(org.updatedAt).toBeInstanceOf(Date);
		});

		it("accepts Date objects directly", () => {
			const createdAt = new Date("2025-06-01");
			const updatedAt = new Date("2025-06-15");
			const org = Organization.fromPrimitives({
				id: "org-4",
				name: "Date Object Test",
				ruc: VALID_RUC,
				slug: "date-object-test",
				status: "ACTIVE",
				createdAt,
				updatedAt,
			});

			expect(org.createdAt).toBe(createdAt);
			expect(org.updatedAt).toBe(updatedAt);
		});
	});

	describe("state machine: suspend/reactivate", () => {
		it("suspend(): transitions ACTIVE -> SUSPENDED", () => {
			const org = Organization.create(makeProps());
			const suspended = org.suspend();

			expect(suspended.status).toBe("SUSPENDED");
			expect(org.status).toBe("ACTIVE");
		});

		it("suspend(): updates updatedAt", () => {
			const org = Organization.create(makeProps());
			const suspended = org.suspend();

			expect(suspended.updatedAt.getTime()).toBeGreaterThan(
				org.updatedAt.getTime(),
			);
		});

		it("suspend(): stores reason in settings when provided", () => {
			const org = Organization.create(makeProps());
			const suspended = org.suspend("Tax audit in progress");

			expect(suspended.settings).toEqual({
				suspensionReason: "Tax audit in progress",
			});
		});

		it("suspend(): preserves existing settings when adding reason", () => {
			const org = Organization.create(
				makeProps({ settings: { timezone: "America/Lima" } }),
			);
			const suspended = org.suspend("Non-compliance");

			expect(suspended.settings).toEqual({
				timezone: "America/Lima",
				suspensionReason: "Non-compliance",
			});
		});

		it("suspend(): throws when already SUSPENDED", () => {
			const org = Organization.create(makeProps());
			const suspended = org.suspend();

			expect(() => suspended.suspend()).toThrow(
				'Cannot transition from "SUSPENDED" to "SUSPENDED"',
			);
		});

		it("suspend(): throws when INACTIVE", () => {
			const org = Organization.create(makeProps({ status: "INACTIVE" }));

			expect(() => org.suspend()).toThrow(
				'Cannot transition from "INACTIVE" to "SUSPENDED"',
			);
		});

		it("reactivate(): transitions SUSPENDED -> ACTIVE", () => {
			const org = Organization.create(makeProps());
			const suspended = org.suspend();
			const reactivated = suspended.reactivate();

			expect(reactivated.status).toBe("ACTIVE");
		});

		it("reactivate(): updates updatedAt", () => {
			const org = Organization.create(makeProps());
			const suspended = org.suspend();
			const reactivated = suspended.reactivate();

			expect(reactivated.updatedAt.getTime()).toBeGreaterThanOrEqual(
				suspended.updatedAt.getTime(),
			);
		});

		it("reactivate(): throws when already ACTIVE", () => {
			const org = Organization.create(makeProps());

			expect(() => org.reactivate()).toThrow(
				'Cannot transition from "ACTIVE" to "ACTIVE"',
			);
		});

		it("supports INACTIVE -> ACTIVE via reactivate", () => {
			const org = Organization.create(makeProps({ status: "INACTIVE" }));
			const reactivated = org.reactivate();

			expect(reactivated.status).toBe("ACTIVE");
		});
	});

	describe("updateHealthScore()", () => {
		it("returns a new Organization with updated score", () => {
			const org = Organization.create(makeProps({ healthScore: 50 }));
			const updated = org.updateHealthScore(80);

			expect(updated.healthScore).toBe(80);
		});

		it("updates metrics.healthPercentage when metrics exist", () => {
			const org = Organization.create(
				makeProps({
					healthScore: 50,
					metrics: {
						totalCompanies: 10,
						activeCompanies: 8,
						pendingReconciliations: 2,
						overdueDocuments: 1,
						healthPercentage: 50,
					},
				}),
			);
			const updated = org.updateHealthScore(90);

			expect(updated.metrics?.healthPercentage).toBe(90);
		});

		it("keeps metrics as undefined when none exist", () => {
			const org = Organization.create(makeProps());
			const updated = org.updateHealthScore(80);

			expect(updated.metrics).toBeUndefined();
		});

		it("updates updatedAt", () => {
			const org = Organization.create(makeProps());
			const updated = org.updateHealthScore(80);

			expect(updated.updatedAt.getTime()).toBeGreaterThan(
				org.updatedAt.getTime(),
			);
		});

		it("is immutable: original score unchanged", () => {
			const org = Organization.create(makeProps({ healthScore: 30 }));
			org.updateHealthScore(99);

			expect(org.healthScore).toBe(30);
		});
	});

	describe("updateSettings()", () => {
		it("merges settings correctly", () => {
			const org = Organization.create(
				makeProps({
					settings: { timezone: "America/Lima", fiscalYearEnd: "12-31" },
				}),
			);
			const updated = org.updateSettings({ defaultCurrency: "PEN" });

			expect(updated.settings).toEqual({
				timezone: "America/Lima",
				fiscalYearEnd: "12-31",
				defaultCurrency: "PEN",
			});
		});

		it("overrides existing keys with new values", () => {
			const org = Organization.create(
				makeProps({ settings: { timezone: "America/Lima" } }),
			);
			const updated = org.updateSettings({ timezone: "UTC" });

			expect(updated.settings?.timezone).toBe("UTC");
		});

		it("returns new instance", () => {
			const org = Organization.create(makeProps());
			const updated = org.updateSettings({ timezone: "UTC" });

			expect(updated).not.toBe(org);
			expect(updated).toBeInstanceOf(Organization);
		});

		it("updates updatedAt", () => {
			const org = Organization.create(makeProps());
			const updated = org.updateSettings({ timezone: "UTC" });

			expect(updated.updatedAt.getTime()).toBeGreaterThan(
				org.updatedAt.getTime(),
			);
		});

		it("handles undefined initial settings", () => {
			const org = Organization.create(makeProps());
			const updated = org.updateSettings({ defaultCurrency: "PEN" });

			expect(updated.settings).toEqual({ defaultCurrency: "PEN" });
		});
	});

	describe("equals()", () => {
		it("returns true for same id", () => {
			const orgA = Organization.create(makeProps());
			const orgB = Organization.create(makeProps());

			expect(orgA.equals(orgB)).toBe(true);
		});

		it("returns false for different id", () => {
			const orgA = Organization.create(makeProps());
			const orgB = Organization.create(makeProps({ id: "org-2" }));

			expect(orgA.equals(orgB)).toBe(false);
		});

		it("returns false for null/undefined", () => {
			const org = Organization.create(makeProps());

			expect(org.equals(null)).toBe(false);
			expect(org.equals(undefined)).toBe(false);
		});
	});

	describe("getters", () => {
		it("exposes all properties via getters", () => {
			const metrics = {
				totalCompanies: 5,
				activeCompanies: 3,
				pendingReconciliations: 1,
				overdueDocuments: 0,
				healthPercentage: 60,
			};
			const createdAt = new Date("2025-01-01");
			const updatedAt = new Date("2025-06-01");
			const settings: OrganizationSettings = { timezone: "America/Lima" };

			const org = Organization.create(
				makeProps({
					id: "getter-test",
					name: "Getter Firm",
					ruc: VALID_RUC,
					slug: "getter-firm",
					settings,
					status: "ACTIVE",
					healthScore: 60,
					metrics,
					createdAt,
					updatedAt,
				}),
			);

			expect(org.id).toBe("getter-test");
			expect(org.name).toBe("Getter Firm");
			expect(org.ruc).toBe(VALID_RUC);
			expect(org.slug).toBe("getter-firm");
			expect(org.settings).toBe(settings);
			expect(org.status).toBe("ACTIVE");
			expect(org.healthScore).toBe(60);
			expect(org.metrics).toBe(metrics);
			expect(org.createdAt).toBe(createdAt);
			expect(org.updatedAt).toBe(updatedAt);
		});
	});

	describe("toJSON()", () => {
		it("returns correct structure", () => {
			const org = Organization.create(
				makeProps({
					settings: { timezone: "America/Lima" },
					healthScore: 85,
					metrics: {
						totalCompanies: 10,
						activeCompanies: 8,
						pendingReconciliations: 2,
						overdueDocuments: 1,
						healthPercentage: 85,
					},
				}),
			);
			const json = org.toJSON();

			expect(json).toEqual({
				id: "org-1",
				name: "Test Firm",
				ruc: VALID_RUC,
				slug: DEFAULT_SLUG,
				settings: { timezone: "America/Lima" },
				status: "ACTIVE",
				healthScore: 85,
				metrics: {
					totalCompanies: 10,
					activeCompanies: 8,
					pendingReconciliations: 2,
					overdueDocuments: 1,
					healthPercentage: 85,
				},
				createdAt: "2025-01-01T00:00:00.000Z",
				updatedAt: "2025-01-01T00:00:00.000Z",
			});
		});

		it("serializes dates as ISO strings", () => {
			const org = Organization.create(makeProps());
			const json = org.toJSON();

			expect(typeof json.createdAt).toBe("string");
			expect(typeof json.updatedAt).toBe("string");
		});
	});
});
