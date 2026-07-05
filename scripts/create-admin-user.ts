import { db } from "@drenyra/persistence/client";
import { eq } from "@drenyra/persistence/query";
import { companies } from "@drenyra/persistence/schema";
import { loadApiEnv } from "../apps/api/src/env/load-api-env";
import {
	bootstrapDemoAdminAuthUser,
	DEMO_ADMIN_RUC,
} from "../apps/api/src/features/auth/dev/bootstrap-demo-admin";

const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

async function ensureDemoCompany(): Promise<void> {
	const existing = await db
		.select({ id: companies.id })
		.from(companies)
		.where(eq(companies.ruc, DEMO_ADMIN_RUC))
		.limit(1);

	if (existing.length > 0) return;

	await db.insert(companies).values({
		id: DEMO_COMPANY_ID,
		ownerId: DEMO_COMPANY_ID,
		ruc: DEMO_ADMIN_RUC,
		businessName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
		tradeName: "Nebula Ops",
		address: "Av. Javier Prado Este 1021, San Isidro, Lima",
		isActive: true,
	});
}

await loadApiEnv();
await ensureDemoCompany();

const admin = await bootstrapDemoAdminAuthUser();

console.log("Demo admin ready for local login:");
console.log(`  email:    ${admin.email}`);
console.log(`  password: ${admin.password}`);
console.log(`  ruc:      ${admin.ruc}`);
console.log(`  company:  ${admin.companyName} (${admin.companyId})`);
