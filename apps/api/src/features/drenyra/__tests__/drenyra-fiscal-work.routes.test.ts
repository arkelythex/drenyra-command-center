import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	DrenyraActorContext,
	DrenyraFiscalCommandCenterService,
	InspectFiscalWorkItemInput,
} from "@drenyra/application/drenyra";
import {
	DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
	type DrenyraFiscalWorkInspectEnvelope,
} from "@drenyra/domain/drenyra";
import { createDrenyraFiscalWorkRoutes } from "../fiscal-work.routes";

const fiscalContext: DrenyraActorContext = {
	companyId: "company-1",
	companyRuc: "20601234567",
	organizationId: "org-1",
	period: "2026-05",
	userId: "user-1",
};

const inspectFiscalWorkItem = vi.fn<
	(context: DrenyraActorContext, input: InspectFiscalWorkItemInput) => Promise<DrenyraFiscalWorkInspectEnvelope>
>();

function createApp(contextOk = true) {
	const commandCenter = { inspectFiscalWorkItem } as unknown as DrenyraFiscalCommandCenterService;
	return new Elysia().use(
		createDrenyraFiscalWorkRoutes(commandCenter, () =>
			contextOk ? { ok: true, context: fiscalContext } : { ok: false, missingHeaders: ["x-company-ruc", "x-fiscal-period"] },
		),
	);
}

async function getInspect(path: string, headers: Record<string, string>, contextOk = true): Promise<Response> {
	return createApp(contextOk).handle(new Request(`http://localhost${path}`, { headers }));
}

describe("Drenyra fiscal work routes", () => {
	beforeEach(() => {
		inspectFiscalWorkItem.mockReset();
	});

	it("forwards scoped inspect requests with capability, trace and source surface", async () => {
		inspectFiscalWorkItem.mockResolvedValueOnce({
			status: "success",
			reasonCode: "OK",
			traceId: "trace-fiscal-work",
			capabilityId: DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
			evidenceRefs: ["evidence-1"],
			sourceSurface: "cli",
			summary: "Fiscal work ready",
		});

		const response = await getInspect("/fiscal-work/case-1/inspect", {
			"x-drenyra-capability-grant": `other, ${DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY}`,
			"x-drenyra-source-surface": "cli",
			"x-trace-id": "trace-fiscal-work",
		});
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(inspectFiscalWorkItem).toHaveBeenCalledWith(fiscalContext, {
			workItemId: "case-1",
			capabilityGranted: true,
			traceId: "trace-fiscal-work",
			sourceSurface: "cli",
		});
		expect(payload.status).toBe("success");
		expect(payload.evidenceRefs).toEqual(["evidence-1"]);
	});

	it("returns validation envelopes without calling the service when fiscal scope is missing", async () => {
		const response = await getInspect(
			"/fiscal-work/case-1/inspect",
			{
				"x-drenyra-source-surface": "automation",
				"x-trace-id": "trace-missing-scope",
			},
			false,
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(inspectFiscalWorkItem).not.toHaveBeenCalled();
		expect(payload.status).toBe("validation_failed");
		expect(payload.reasonCode).toBe("TENANT_CONTEXT_REQUIRED");
		expect(payload.traceId).toBe("trace-missing-scope");
		expect(payload.sourceSurface).toBe("automation");
		expect(payload.redactedDetail).toContain("x-company-ruc");
		expect(payload.data).toBeUndefined();
	});

	it("maps denied envelopes to 403 while preserving trace metadata", async () => {
		inspectFiscalWorkItem.mockResolvedValueOnce({
			status: "denied",
			reasonCode: "DRENYRA_CAPABILITY_DENIED",
			traceId: "trace-denied",
			capabilityId: DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
			redactedDetail: "Capability denied",
		});

		const response = await getInspect("/fiscal-work/case-1/inspect", {
			"x-trace-id": "trace-denied",
		});
		const payload = await response.json();

		expect(response.status).toBe(403);
		expect(payload.status).toBe("denied");
		expect(payload.traceId).toBe("trace-denied");
		expect(payload.redactedDetail).toBe("Capability denied");
	});
});
