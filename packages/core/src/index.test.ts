import { expect, test } from "vitest";
import type { CoreUser } from "./iam/index";
import type { CoreClient } from "./ontology/index";

test("can import core types", () => {
	const user: CoreUser = {
		id: "usr_1" as any,
		email: "test@test.com",
		name: "Test",
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	expect(user.email).toBe("test@test.com");

	const client: CoreClient = {
		id: "cli_1" as any,
		organizationId: "org_1" as any,
		documentType: "ruc" as const,
		documentNumber: "123456789",
		businessName: "Test Client",
		isActive: true,
		tags: [],
		metadata: {},
		createdBy: "usr_1" as any,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	expect(client.businessName).toBe("Test Client");
});
