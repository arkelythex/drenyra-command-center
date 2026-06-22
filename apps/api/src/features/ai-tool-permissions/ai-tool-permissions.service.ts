import { db } from "@arkelythex/persistence/client";
import { desc, eq } from "@arkelythex/persistence/query";
import { aiToolPermissions } from "@arkelythex/persistence/schema";

type AiToolPermissionRow = typeof aiToolPermissions.$inferSelect;

export type { AiToolPermissionRow };

type NewAiToolPermission = typeof aiToolPermissions.$inferInsert;

export interface AiToolPermissionCreateInput {
	toolName: string;
	effect: "ALLOW" | "DENY" | "REQUIRE_APPROVAL";
	companyId?: string;
	organizationId?: string;
}

export interface AiToolPermissionUpdateInput {
	toolName?: string;
	effect?: "ALLOW" | "DENY" | "REQUIRE_APPROVAL";
	companyId?: string;
	organizationId?: string;
}

/**
 * AI Tool Permissions application service (CRUD + list).
 *
 * @example
 * ```ts
 * const permissions = await AiToolPermissionService.list('cmp_123');
 * ```
 */
export class AiToolPermissionService {
	/**
	 * Creates a new AI tool permission.
	 */
	static async create(
		data: AiToolPermissionCreateInput,
	): Promise<AiToolPermissionRow> {
		const values: NewAiToolPermission = {
			toolName: data.toolName,
			effect: data.effect,
			companyId: data.companyId ?? null,
			organizationId: data.organizationId ?? null,
		};

		const [newPermission] = await db
			.insert(aiToolPermissions)
			.values(values)
			.returning();

		if (!newPermission) {
			throw new Error("No se pudo crear el permiso de herramienta de IA");
		}

		return newPermission;
	}

	/**
	 * Lists AI tool permissions with optional company filter.
	 */
	static async list(companyId?: string): Promise<AiToolPermissionRow[]> {
		const whereClause = companyId
			? eq(aiToolPermissions.companyId, companyId)
			: undefined;

		return await db.query.aiToolPermissions.findMany({
			where: whereClause,
			orderBy: [desc(aiToolPermissions.createdAt)],
		});
	}

	/**
	 * Gets an AI tool permission by ID.
	 */
	static async getById(id: string): Promise<AiToolPermissionRow | null> {
		const row = await db.query.aiToolPermissions.findFirst({
			where: eq(aiToolPermissions.id, id),
		});
		return row ?? null;
	}

	/**
	 * Updates an AI tool permission.
	 */
	static async update(
		id: string,
		data: AiToolPermissionUpdateInput,
	): Promise<AiToolPermissionRow> {
		const [updatedPermission] = await db
			.update(aiToolPermissions)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(aiToolPermissions.id, id))
			.returning();

		if (!updatedPermission) {
			throw new Error("AI Tool Permission not found");
		}

		return updatedPermission;
	}

	/**
	 * Deletes an AI tool permission (hard delete).
	 */
	static async delete(id: string): Promise<AiToolPermissionRow> {
		const [deletedPermission] = await db
			.delete(aiToolPermissions)
			.where(eq(aiToolPermissions.id, id))
			.returning();

		if (!deletedPermission) {
			throw new Error("AI Tool Permission not found");
		}

		return deletedPermission;
	}
}
