import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as schema from '@arkelythex/persistence/schema';
import { ensureDemoSeedContext } from './seed-demo-context';
import { seedOperationalDemoData } from './seed-operational-demo';
import { companies, economicGroups, firmModels, interCompanyTransactions, } from '@arkelythex/persistence/schema';
const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5436/arkelythex';
const client = postgres(connectionString);
const db = drizzle(client, { schema });
async function seed() {
    console.log('🌱 Seeding database...');
    console.log('📡 Database URL:', connectionString.replace(/:[^:@]+@/, ':****@'));
    try {
        const { adminUserId, companyId } = await ensureDemoSeedContext(db);
        const operationalDemo = await seedOperationalDemoData(db, { companyId });
        console.log(`✅ Operational dashboard demo seeded (${operationalDemo.monthsSeeded} months)`);
        console.log(`   - ${operationalDemo.partnersSeeded} partners`);
        console.log(`   - ${operationalDemo.productsSeeded} products`);
        console.log('\n🚀 Creating Killer Features demo data...');
        const existingGroup = await db.query.economicGroups.findFirst({
            where: eq(economicGroups.groupCode, 'GEI-2026'),
        });
        let economicGroupId;
        let economicGroup;
        if (existingGroup) {
            console.log('✅ Economic Group exists, skipping creation.');
            economicGroupId = existingGroup.id;
            economicGroup = existingGroup;
        }
        else {
            const [newGroup] = await db.insert(economicGroups).values({
                ownerId: adminUserId,
                groupName: 'GRUPO EMPRESARIAL INTERAMERICANA',
                groupCode: 'GEI-2026',
                subscriptionTier: 'PROFESSIONAL',
                monthlyFee: '350.00',
                maxCompanies: -1,
                isActive: true,
            }).returning();
            economicGroupId = newGroup.id;
            economicGroup = newGroup;
            console.log('✅ Economic Group created:', newGroup.groupName);
        }
        const existingAdditional = await db.query.companies.findFirst({
            where: eq(companies.ruc, '20551234567'),
        });
        let insertedAdditionalCompanies = [];
        if (!existingAdditional) {
            insertedAdditionalCompanies = await db.insert(companies).values([
                {
                    ownerId: adminUserId,
                    economicGroupId: economicGroupId,
                    ruc: '20551234567',
                    businessName: 'INMOBILIARIA INTERAMERICANA SAC',
                    tradeName: 'SurInmo',
                    isPrimary: false,
                    isActive: true,
                },
                {
                    ownerId: adminUserId,
                    economicGroupId: economicGroupId,
                    ruc: '20449876543',
                    businessName: 'TRANSPORTES RÁPIDOS DEL SUR SRL',
                    tradeName: 'TransSur',
                    isPrimary: false,
                    isActive: true,
                },
            ]).returning();
            console.log(`✅ ${insertedAdditionalCompanies.length} additional companies created in group`);
        }
        await db.update(companies)
            .set({
            economicGroupId: economicGroupId,
            isPrimary: true,
        })
            .where(eq(companies.id, companyId));
        console.log('✅ Main company linked to economic group as primary');
        const firmModelExamples = JSON.stringify([
            {
                description: 'Pago Movistar Internet',
                accountCode: '63',
                accountName: 'Gastos de Servicios Prestados por Terceros',
                taxType: 'GRAVADO',
                reason: 'Servicio de telecomunicaciones gravado con IGV',
            },
            {
                description: 'Alquiler oficina Principal',
                accountCode: '63',
                accountName: 'Gastos de Servicios Prestados por Terceros',
                taxType: 'GRAVADO',
                reason: 'Alquiler de inmueble sujeto a detracción',
            },
            {
                description: 'Compra útiles de oficina',
                accountCode: '60',
                accountName: 'Compras',
                taxType: 'GRAVADO',
                reason: 'Compra de mercadería',
            },
        ]);
        const existingModel = await db.query.firmModels.findFirst({
            where: eq(firmModels.economicGroupId, economicGroupId),
        });
        if (!existingModel) {
            await db.insert(firmModels).values({
                economicGroupId: economicGroupId,
                modelName: `Modelo IA - GRUPO INTERAMERICANA`,
                modelType: 'CLASSIFICATION',
                baseModel: 'gemini-2.0-flash-exp',
                temperature: '0.10',
                trainingExamples: firmModelExamples,
                accuracy: '95.50',
                lastTrainedAt: new Date(),
                isActive: true,
            });
            console.log('✅ Firm Model created with 3 training examples');
        }
        const existingInterTx = await db.query.interCompanyTransactions.findFirst({
            where: eq(interCompanyTransactions.concept, 'Alquiler Oficina - Mes Enero 2026'),
        });
        if (!existingInterTx && insertedAdditionalCompanies.length > 0) {
            await db.insert(interCompanyTransactions).values({
                economicGroupId: economicGroupId,
                fromCompanyId: companyId,
                toCompanyId: insertedAdditionalCompanies[0].id,
                concept: 'Alquiler Oficina - Mes Enero 2026',
                amount: '5000.00',
                taxType: 'GRAVADO',
                igvAmount: '900.00',
                detractionAmount: '295.00',
                detractionRate: '5.00',
                status: 'RECONCILED',
                reconciledAt: new Date(),
                currency: 'PEN',
            });
            console.log('✅ Inter-company transaction created (auto-reconciled)');
        }
        console.log('\n🎉 Seeding completed successfully!');
        console.log('\n🔐 Demo Auth Bootstrap:');
        console.log('Run `bun scripts/create-admin-user.ts` or the root `bun run db:seed` command');
        console.log('to guarantee Better Auth login credentials are aligned with the demo company.');
        console.log(`\n🏢 Company ID: ${companyId}`);
        console.log(`📦 Economic Group ID: ${economicGroupId}`);
        console.log(`   - GRUPO INTERAMERICANA`);
        console.log(`   - 3 Companies (Multi-RUC)`);
        console.log(`   - Monthly Fee: S/ ${economicGroup.monthlyFee} (vs S/ 900 in CONCAR)`);
        console.log(`   - Savings: S/ 550/month (61%)`);
        console.log('\n🧠 Firm Model trained with 3 examples (95.5% accuracy)');
        console.log('🔗 1 Inter-company transaction demo');
        console.log('\n💡 Use these features to impress investors!');
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
}
export async function seedDatabase() {
    await seed();
}
if (import.meta.main) {
    const shouldExitProcess = process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test';
    seedDatabase()
        .then(async () => {
        await client.end();
        if (shouldExitProcess) {
            process.exit(0);
        }
    })
        .catch(async (error) => {
        console.error(error);
        await client.end();
        if (shouldExitProcess) {
            process.exit(1);
        }
    });
}
//# sourceMappingURL=seed.js.map