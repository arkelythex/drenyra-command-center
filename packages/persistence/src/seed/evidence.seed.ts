/**
 * Evidence Seed Data
 *
 * Seeds evidence records with audit trails for demo / development environments.
 * Run via `bun run db:seed` (root) or standalone via `tsx src/db/seed-evidence.ts`.
 *
 * @module persistence/src/seed
 */
import * as schema from "@drenyra/persistence/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

interface SeedEvidenceParams {
	db: ReturnType<typeof drizzle>;
	companyId: string;
	organizationId: number;
	userId: string;
}

/**
 * Seed evidence records with audit trails for demo purposes.
 *
 * Creates:
 * - 3 evidence records (INVOICE, RECEIPT, CONTRACT)
 * - Associated audit trail entries
 *
 * @returns Array of seeded evidence IDs
 */
export async function seedEvidence({
	db,
	companyId,
	organizationId,
	userId,
}: SeedEvidenceParams): Promise<string[]> {
	const evidenceIds: string[] = [];

	const evidenceData = [
		{
			filename: "factura-proveedor-001.pdf",
			mimeType: "application/pdf",
			sizeBytes: 245760,
			hash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
			evidenceType: "INVOICE" as const,
			source: "UPLOAD" as const,
			status: "VALIDATED" as const,
			tags: ["proveedor", "factura", "2026-06"],
		},
		{
			filename: "recibo-banco-001.pdf",
			mimeType: "application/pdf",
			sizeBytes: 102400,
			hash: "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
			evidenceType: "BANK_STATEMENT" as const,
			source: "SYNC" as const,
			status: "CLASSIFIED" as const,
			tags: ["banco", "extracto", "2026-06"],
		},
		{
			filename: "contrato-servicio-001.pdf",
			mimeType: "application/pdf",
			sizeBytes: 512000,
			hash: "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
			evidenceType: "CONTRACT" as const,
			source: "UPLOAD" as const,
			status: "CLASSIFIED" as const,
			tags: ["contrato", "servicio", "proveedor"],
		},
	];

	for (const data of evidenceData) {
		const [ev] = await db
			.insert(schema.evidence)
			.values({
				organizationId: String(organizationId),
				companyId,
				...data,
			})
			.returning({ id: schema.evidence.id });

		evidenceIds.push(ev.id);

		// Add audit trail entry
		await db.insert(schema.evidenceAuditTrail).values({
			evidenceId: ev.id,
			action: "SEED",
			previousStatus: "UPLOADED",
			newStatus: data.status,
			hash: data.hash,
			hashChain: {
				hash: data.hash,
				prevHash: null,
				timestamp: new Date().toISOString(),
			},
			actor: userId,
		});
	}
	return evidenceIds;
}

/**
 * Standalone entry point: seeds evidence for the first active company found.
 */
async function main() {
	const connectionString =
		process.env.DATABASE_URL ||
		"postgresql://user:password@localhost:5436/drenyra";

	const client = postgres(connectionString);
	const db = drizzle(client, { schema });

	try {
		// Find the first active company
		const [company] = await db
			.select({ id: schema.companies.id, ownerId: schema.companies.ownerId })
			.from(schema.companies)
			.limit(1);

		if (!company) {
			console.error("❌ No companies found. Run the main seed first.");
			process.exit(1);
		}

		await seedEvidence({
			db,
			companyId: company.id,
			organizationId: 1,
			userId: company.ownerId,
		});
	} catch (error) {
		console.error("❌ Error seeding evidence:", error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

if (import.meta.main) {
	main();
}
