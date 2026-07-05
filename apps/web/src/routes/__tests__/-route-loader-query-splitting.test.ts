import { QueryClient, type QueryKey } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route as ComplianceRoute } from "../cumplimiento/compliance";
import { Route as DashboardRoute } from "../dashboard";
import { Route as DocumentsRoute } from "../operaciones/documents";
import { Route as BankingRoute } from "../tesoreria/banking";

const COMPANY_ID = "company-loader-smoke";
let routeCompanyId = COMPANY_ID;

vi.mock("../../lib/api", () => ({
	getTenantContext: () => ({
		companyId: routeCompanyId,
		organizationId: routeCompanyId,
		isAuthenticated: Boolean(routeCompanyId),
		authUserId: routeCompanyId ? "auth-loader-smoke" : "anonymous",
		legacyUserId: routeCompanyId ? "legacy-loader-smoke" : "anonymous",
		userRole: routeCompanyId ? "ADMIN" : "VIEWER",
	}),
}));

vi.mock("../../features/dashboard/dashboard.query-options", () => ({
	dashboardOverviewQueryOptions: (companyId: string) =>
		loaderQueryOptions(["dashboard", "overview", companyId] as const),
	dashboardRecentDocumentsQueryOptions: (companyId: string, limit: number) =>
		loaderQueryOptions([
			"dashboard",
			"recent-documents",
			companyId,
			limit,
		] as const),
	dashboardSummaryQueryOptions: (companyId: string) =>
		loaderQueryOptions(["dashboard", "summary", companyId] as const),
	fiscalIndicatorsQueryOptions: () =>
		loaderQueryOptions(["dashboard", "fiscal-indicators"] as const),
}));

vi.mock("../../features/banking/api/query-options", () => ({
	bankingAccountsQueryOptions: (companyId: string) => ({
		queryKey: ["banking", "accounts", companyId] as const,
		queryFn: async () => [
			{ id: "account-fallback", isDefault: false },
			{ id: "account-default", isDefault: true },
		],
	}),
	bankingTransactionsQueryOptions: (accountId: string) =>
		loaderQueryOptions(["banking", "transactions", accountId] as const),
}));

vi.mock("../../features/compliance/compliance.query", () => ({
	complianceOverviewQueryOptions: (companyId: string) =>
		loaderQueryOptions(["compliance", "overview", companyId] as const),
}));

vi.mock("../../features/documents/documents.query", () => ({
	documentsQueryOptions: (companyId: string) =>
		loaderQueryOptions(["documents", companyId] as const),
}));

function loaderQueryOptions(queryKey: QueryKey) {
	return {
		queryKey,
		queryFn: async () => ({ ok: true }),
	};
}

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				gcTime: 0,
				retry: false,
			},
		},
	});
}

async function runLoader(
	route: typeof DashboardRoute,
	queryClient: QueryClient,
) {
	const loader = route.options.loader;
	if (!loader) throw new Error("Expected route loader to be defined");
	await loader({ context: { queryClient } } as Parameters<
		NonNullable<typeof loader>
	>[0]);
}

describe("route-loader query splitting", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		routeCompanyId = COMPANY_ID;
	});

	it("prefetches all dashboard queries with company scope", async () => {
		const queryClient = createQueryClient();

		await runLoader(DashboardRoute, queryClient);

		expect(
			queryClient.getQueryData(["dashboard", "overview", COMPANY_ID]),
		).toEqual({ ok: true });
		expect(
			queryClient.getQueryData([
				"dashboard",
				"recent-documents",
				COMPANY_ID,
				3,
			]),
		).toEqual({ ok: true });
		expect(
			queryClient.getQueryData(["dashboard", "summary", COMPANY_ID]),
		).toEqual({ ok: true });
		expect(
			queryClient.getQueryData(["dashboard", "fiscal-indicators"]),
		).toEqual({ ok: true });
	});

	it("prefetches banking accounts before default account transactions", async () => {
		const queryClient = createQueryClient();

		await runLoader(BankingRoute, queryClient);

		expect(
			queryClient.getQueryData(["banking", "accounts", COMPANY_ID]),
		).toEqual([
			{ id: "account-fallback", isDefault: false },
			{ id: "account-default", isDefault: true },
		]);
		expect(
			queryClient.getQueryData(["banking", "transactions", "account-default"]),
		).toEqual({ ok: true });
	});

	it("prefetches compliance overview with company scope", async () => {
		const queryClient = createQueryClient();

		await runLoader(ComplianceRoute, queryClient);

		expect(
			queryClient.getQueryData(["compliance", "overview", COMPANY_ID]),
		).toEqual({ ok: true });
	});

	it("prefetches documents with company scope", async () => {
		const queryClient = createQueryClient();

		await runLoader(DocumentsRoute, queryClient);

		expect(queryClient.getQueryData(["documents", COMPANY_ID])).toEqual({
			ok: true,
		});
	});

	it("does not prefetch tenant-scoped dashboard data without a company id", async () => {
		routeCompanyId = "";
		const queryClient = createQueryClient();

		await runLoader(DashboardRoute, queryClient);

		expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
	});

	it("does not prefetch tenant-scoped banking data without a company id", async () => {
		routeCompanyId = "";
		const queryClient = createQueryClient();

		await runLoader(BankingRoute, queryClient);

		expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
	});
});
