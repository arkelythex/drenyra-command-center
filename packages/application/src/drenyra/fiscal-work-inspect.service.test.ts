import { DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY } from "@drenyra/domain/drenyra";
import { describe, expect, it } from "vitest";
import { DrenyraFiscalWorkInspectService } from "./fiscal-work-inspect.service";
import { InMemoryDrenyraRepository } from "./in-memory-repository";
import {
	type DrenyraActorContext,
	DrenyraFiscalCommandCenterService,
} from "./service";

const context: DrenyraActorContext = {
	organizationId: "org-001",
	companyId: "company-001",
	companyRuc: "20100070970",
	period: "2026-05",
	userId: "user-001",
};

function makeServices() {
	const repository = new InMemoryDrenyraRepository();
	return {
		commandCenter: new DrenyraFiscalCommandCenterService(repository),
		inspect: new DrenyraFiscalWorkInspectService(
			repository,
			() => "trace-test-001",
		),
	};
}

describe("DrenyraFiscalWorkInspectService", () => {
	it("returns one shared read envelope for scoped fiscal work", async () => {
		const { commandCenter, inspect } = makeServices();
		const fiscalCase = await commandCenter.createFiscalCase(context, {
			type: "SIRE_REVIEW",
			title: "SIRE mayo",
			description: "Inspeccionar propuesta SIRE",
		});
		const evidence = await commandCenter.addEvidenceItem(
			context,
			fiscalCase.id,
			{
				type: "SUNAT_RECORD",
				title: "Propuesta SIRE",
				summary: "Registro descargado",
				source: "SUNAT",
			},
		);

		const result = await inspect.inspect({
			scope: {
				...fiscalCase.scope,
				organizationId: context.organizationId,
				actorId: context.userId,
			},
			workItemId: fiscalCase.id,
			grantedCapabilities: [DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY],
		});

		expect(result).toMatchObject({
			status: "success",
			reason: "ALLOWED",
			traceId: "trace-test-001",
			workItemId: fiscalCase.id,
		});
		expect(result.data?.evidenceRefs).toContain(evidence.id);
	});

	it("denies before data access when capability is missing", async () => {
		const { inspect } = makeServices();

		const result = await inspect.inspect({
			scope: { ...context, countryCode: "PE", actorId: context.userId },
			workItemId: "case-hidden",
			grantedCapabilities: [],
		});

		expect(result.status).toBe("denied");
		expect(result.reason).toBe("CAPABILITY_DENIED");
		expect(result.data).toBeUndefined();
	});

	it("does not leak details for out-of-scope work items", async () => {
		const { commandCenter, inspect } = makeServices();
		const fiscalCase = await commandCenter.createFiscalCase(context, {
			type: "MONTHLY_CLOSE",
			title: "Cierre mayo",
			description: "Trabajo fiscal scoped",
		});

		const result = await inspect.inspect({
			scope: {
				...context,
				companyId: "company-002",
				countryCode: "PE",
				actorId: context.userId,
			},
			workItemId: fiscalCase.id,
			grantedCapabilities: [DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY],
		});

		expect(result.status).toBe("not_found");
		expect(result.reason).toBe("WORK_ITEM_NOT_FOUND_OR_OUT_OF_SCOPE");
		expect(result.data).toBeUndefined();
	});
});
