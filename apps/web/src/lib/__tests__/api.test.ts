import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../../features/auth/types/auth.types";

vi.mock("@elysiajs/eden", () => ({
	treaty: vi.fn(() => ({})),
}));

import { useAuthStore } from "../../features/auth/hooks/useAuth";
import {
	getAuthUserId,
	getGovernanceAuditHeaders,
	getLegacyUserId,
	getTenantContext,
	getTenantHeaders,
	getUserId,
} from "../api";

function createUser(overrides: Partial<User> = {}): User {
	return {
		id: "auth-user-default",
		email: "user@example.com",
		name: "Drenyra User",
		emailVerified: true,
		...overrides,
	};
}

describe("user id helpers", () => {
	beforeEach(() => {
		localStorage.clear();
		useAuthStore.setState({
			user: null,
			session: null,
			isAuthenticated: false,
			isLoading: false,
		});
	});

	it("returns the Better Auth id explicitly", () => {
		useAuthStore.setState({
			user: createUser({
				id: "auth-user-1",
				legacyUserId: "11111111-1111-1111-1111-111111111111",
			}),
			isAuthenticated: true,
		});

		expect(getAuthUserId()).toBe("auth-user-1");
	});

	it("prefers the legacy user shadow id for legacy consumers", () => {
		useAuthStore.setState({
			user: createUser({
				id: "auth-user-1",
				legacyUserId: "11111111-1111-1111-1111-111111111111",
			}),
			isAuthenticated: true,
		});

		expect(getLegacyUserId()).toBe("11111111-1111-1111-1111-111111111111");
		expect(getUserId()).toBe("11111111-1111-1111-1111-111111111111");
	});

	it("falls back to the Better Auth id when no legacy shadow exists", () => {
		useAuthStore.setState({
			user: createUser({
				id: "auth-user-2",
			}),
			isAuthenticated: true,
		});

		expect(getAuthUserId()).toBe("auth-user-2");
		expect(getLegacyUserId()).toBe("auth-user-2");
		expect(getUserId()).toBe("auth-user-2");
	});

	it("builds governance headers with tenant and explicit auth identities", () => {
		useAuthStore.setState({
			user: createUser({
				id: "auth-user-1",
				legacyUserId: "11111111-1111-1111-1111-111111111111",
				role: "ADMIN",
				activeCompanyId: "cmp-1",
				companyId: "cmp-1",
			}),
			isAuthenticated: true,
		});

		expect(getGovernanceAuditHeaders()).toEqual({
			"x-company-id": "cmp-1",
			"x-active-company-id": "cmp-1",
			"x-auth-user-id": "auth-user-1",
			"x-user-id": "11111111-1111-1111-1111-111111111111",
			"x-user-role": "ADMIN",
		});
	});

	it("exposes a stable tenant context contract for feature api clients", () => {
		useAuthStore.setState({
			user: createUser({
				id: "auth-user-3",
				legacyUserId: "legacy-user-3",
				role: "ACCOUNTANT",
				activeCompanyId: "cmp-9",
				companyId: "org-9",
			}),
			isAuthenticated: true,
		});

		expect(getTenantContext()).toEqual({
			companyId: "cmp-9",
			organizationId: "org-9",
			isAuthenticated: true,
			authUserId: "auth-user-3",
			legacyUserId: "legacy-user-3",
			userRole: "ACCOUNTANT",
		});
	});

	it("does not emit a demo company fallback for unauthenticated tenant headers", () => {
		expect(getTenantHeaders()).toEqual({});
		expect(getTenantContext()).toMatchObject({
			companyId: "",
			organizationId: "",
			isAuthenticated: false,
			authUserId: "anonymous",
			legacyUserId: "anonymous",
			userRole: "VIEWER",
		});
		expect(getGovernanceAuditHeaders()).toEqual({
			"x-auth-user-id": "anonymous",
			"x-user-id": "anonymous",
			"x-user-role": "VIEWER",
		});
	});

	it("falls back to the user's company id only when no active company is selected", () => {
		useAuthStore.setState({
			user: createUser({
				id: "auth-user-4",
				companyId: "cmp-fallback",
			}),
			isAuthenticated: true,
		});

		expect(getTenantHeaders()).toEqual({
			"x-company-id": "cmp-fallback",
			"x-active-company-id": "cmp-fallback",
		});
		expect(getTenantContext()).toMatchObject({
			companyId: "cmp-fallback",
			organizationId: "cmp-fallback",
			isAuthenticated: true,
		});
	});
});
