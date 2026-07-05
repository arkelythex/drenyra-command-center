import type { DrenyraBrainItem, DrenyraBrainThread, DrenyraBrainTurn } from "@drenyra/domain/drenyra";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-helpers";
import {
	createBrainThread,
	startBrainTurn,
} from "../api/drenyra-brain.api";
import { BrainThreadTimeline } from "./brain-thread-timeline";

describe("BrainThreadTimeline", () => {
	it("renders user and assistant text items plus web research citation", () => {
		const items: DrenyraBrainItem[] = [
			{
				id: "item-1",
				threadId: "thread-1",
				fiscalScope: {
					companyId: "company-1",
					companyRuc: "20601234567",
					period: "2026-05",
					countryCode: "PE",
				},
				type: "user_message",
				content: { text: "¿Podés revisar este riesgo fiscal?" },
				sourceSurface: "web",
				createdAt: "2026-05-24T13:00:00.000Z",
			},
			{
				id: "item-2",
				threadId: "thread-1",
				fiscalScope: {
					companyId: "company-1",
					companyRuc: "20601234567",
					period: "2026-05",
					countryCode: "PE",
				},
				type: "assistant_message",
				content: { text: "Encontré inconsistencias en SIRE vs libro mayor." },
				sourceSurface: "web",
				createdAt: "2026-05-24T13:01:00.000Z",
			},
			{
				id: "item-3",
				threadId: "thread-1",
				fiscalScope: {
					companyId: "company-1",
					companyRuc: "20601234567",
					period: "2026-05",
					countryCode: "PE",
				},
				type: "web_research_result",
				content: {
					query: "sunat sire inconsistencias libro mayor",
					sourceUrl: "https://example.com/sunat-sire-guide",
					sourceTitle: "SUNAT SIRE Guidance",
					retrievedAt: "2026-05-24T13:02:00.000Z",
					snippet: "SIRE debe cuadrar con el libro mayor y el periodo declarado.",
					citationText: "SUNAT SIRE Guidance, sección 2.1",
					toolName: "web-research",
					purpose: "grounding",
				},
				sourceSurface: "web",
				createdAt: "2026-05-24T13:02:00.000Z",
			},
		];

		render(<BrainThreadTimeline items={items} />);

		expect(screen.getByText("¿Podés revisar este riesgo fiscal?")).toBeInTheDocument();
		expect(
			screen.getByText("Encontré inconsistencias en SIRE vs libro mayor."),
		).toBeInTheDocument();
		expect(screen.getByText("SUNAT SIRE Guidance")).toBeInTheDocument();
		expect(
			screen.getByText(
				"SIRE debe cuadrar con el libro mayor y el periodo declarado.",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText("SUNAT SIRE Guidance, sección 2.1"),
		).toBeInTheDocument();
	});
});

const {
	getGovernanceAuditHeadersMock,
	getOrganizationIdMock,
	getCompanyContextMock,
	brainThreadsFn,
} = vi.hoisted(() => {
	const getGovernanceAuditHeadersMock = vi.fn(() => ({
		"x-company-id": "company-1",
		"x-user-id": "user-1",
	}));
	const getOrganizationIdMock = vi.fn(() => "org-1");
	const getCompanyContextMock = vi.fn(() => ({
		companyId: "company-1",
		ruc: "20601234567",
	}));

	const brainThreadsFn = vi.fn(() => ({
		turns: { post: vi.fn(async () => ({ data: {} })) },
		items: { get: vi.fn(async () => ({ data: {} })) },
	}));
	brainThreadsFn.get = vi.fn(async () => ({ data: {} }));
	brainThreadsFn.post = vi.fn(async () => ({ data: {} }));

	return {
		getGovernanceAuditHeadersMock,
		getOrganizationIdMock,
		getCompanyContextMock,
		brainThreadsFn,
	};
});

vi.mock("@/lib/api", () => ({
	getGovernanceAuditHeaders: () => getGovernanceAuditHeadersMock(),
	getOrganizationId: () => getOrganizationIdMock(),
	api: {
		api: {
			drenyra: {
				brain: {
					threads: brainThreadsFn,
				},
			},
		},
	},
}));

vi.mock("@/lib/api-helpers", async () => {
	const actual = await vi.importActual<typeof import("@/lib/api-helpers")>("@/lib/api-helpers");
	return {
		unwrap: actual.unwrap,
		extractOkData: (data: unknown) => data,
		ApiError: actual.ApiError,
	};
});

vi.mock("@/lib/company-context", () => ({
	getCompanyContext: () => getCompanyContextMock(),
}));

describe("drenyra-brain.api", () => {
	beforeEach(() => {
		Object.defineProperty(globalThis, "localStorage", {
			value: {
				getItem: (key: string) =>
					key === "drenyra-active-fiscal-period" ? "2026-05" : null,
				setItem: () => {},
				removeItem: () => {},
				clear: () => {},
			},
			configurable: true,
		});
		vi.clearAllMocks();
	});

	it("calls /api/drenyra/brain/threads with sourceSurface in request body", async () => {
		brainThreadsFn.post.mockResolvedValueOnce({ data: { id: "thread-1" } });

		await createBrainThread({ title: "Scope check", sourceSurface: "web" });

		expect(brainThreadsFn.post).toHaveBeenCalledTimes(1);
		const [body] = brainThreadsFn.post.mock.calls[0] as [unknown];
		expect(body).toEqual({ title: "Scope check", sourceSurface: "web" });
	});

	it("calls /api/drenyra/brain/threads/:threadId/turns with sourceSurface in request body", async () => {
		const turnsPost = vi.fn(async () => ({ data: { id: "turn-1" } }));
		brainThreadsFn.mockReturnValue({ turns: { post: turnsPost }, items: { get: vi.fn() } });

		await startBrainTurn("thread-1", {
			prompt: "Review mismatch",
			sourceSurface: "web",
		});

		expect(brainThreadsFn).toHaveBeenCalledWith({ id: "thread-1" });
		expect(turnsPost).toHaveBeenCalledTimes(1);
		const [body] = turnsPost.mock.calls[0] as [unknown];
		expect(body).toEqual({ prompt: "Review mismatch", sourceSurface: "web" });
	});

	it("throws error with status code and status message on non-2xx", async () => {
		const turnsPost = vi.fn(async () => ({
			error: { value: { error: "Bad request" } },
		}));
		brainThreadsFn.mockReturnValue({ turns: { post: turnsPost }, items: { get: vi.fn() } });

		await expect(
			startBrainTurn("thread-1", {
				prompt: "Review mismatch",
				sourceSurface: "web",
			}),
		).rejects.toThrow(ApiError);
	});
});
