import { eq } from "drizzle-orm";
import * as schema from "@drenyra/persistence/schema";
export const ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_COMPANY_RUC = "20608451231";
export async function ensureDemoSeedContext(db) {
    const existingAdminByEmail = await db.query.users.findFirst({
        where: eq(schema.users.email, "admin@drenyrafounders.com"),
    });
    let adminUserId = ADMIN_USER_ID;
    if (existingAdminByEmail) {
        console.log("✅ Admin user exists by email, using existing ID:", existingAdminByEmail.id);
        adminUserId = existingAdminByEmail.id;
    }
    else {
        const existingAdminById = await db.query.users.findFirst({
            where: eq(schema.users.id, ADMIN_USER_ID),
        });
        if (!existingAdminById) {
            await db.insert(schema.users).values({
                id: ADMIN_USER_ID,
                email: "admin@drenyrafounders.com",
                password: "password123",
                name: "Admin User",
                role: "ADMIN",
            });
            console.log("✅ Admin user created:", adminUserId);
        }
    }
    const existingCompanyByRuc = await db.query.companies.findFirst({
        where: eq(schema.companies.ruc, DEMO_COMPANY_RUC),
    });
    let companyId = DEMO_COMPANY_ID;
    if (existingCompanyByRuc) {
        console.log("✅ Company exists by RUC, using existing ID:", existingCompanyByRuc.id);
        companyId = existingCompanyByRuc.id;
    }
    else {
        const existingCompanyById = await db.query.companies.findFirst({
            where: eq(schema.companies.id, DEMO_COMPANY_ID),
        });
        if (!existingCompanyById) {
            await db.insert(schema.companies).values({
                id: DEMO_COMPANY_ID,
                ownerId: adminUserId,
                ruc: DEMO_COMPANY_RUC,
                businessName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
                tradeName: "Nebula Ops",
                address: "Av. Javier Prado Este 1021, San Isidro, Lima",
                isActive: true,
            });
            console.log("✅ Company created: NEBULA OPERACIONES LOGISTICAS S.A.C.");
        }
    }
    await db
        .update(schema.companies)
        .set({
        ownerId: adminUserId,
        businessName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
        tradeName: "Nebula Ops",
        address: "Av. Javier Prado Este 1021, San Isidro, Lima",
        isActive: true,
    })
        .where(eq(schema.companies.id, companyId));
    await db
        .update(schema.users)
        .set({ companyId })
        .where(eq(schema.users.id, adminUserId));
    console.log("✅ Admin user linked to company");
    return { adminUserId, companyId };
}
//# sourceMappingURL=seed-demo-context.js.map