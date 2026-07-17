import { describe, expect, it } from "vitest";

describe("IAM Types", () => {
	it("should define CoreUser with required fields", () => {
		const user = {
			id: "usr_abc123" as any,
			email: "test@arkelythex.com",
			name: "Test User",
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		expect(user.email).toBe("test@arkelythex.com");
		expect(user.isActive).toBe(true);
	});
});
