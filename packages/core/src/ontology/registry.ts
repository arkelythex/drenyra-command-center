import { z } from "zod";

export interface OntologyTypeDefinition<T extends z.ZodTypeAny = z.ZodTypeAny> {
	name: string;
	description?: string;
	schema: T;
	owner: string;
}

export class OntologyRegistry {
	private types = new Map<string, OntologyTypeDefinition>();

	register<T extends z.ZodTypeAny>(def: OntologyTypeDefinition<T>): void {
		if (this.types.has(def.name)) {
			throw new Error(`Ontology type "${def.name}" is already registered`);
		}
		this.types.set(def.name, def);
	}

	get<T extends z.ZodTypeAny>(
		name: string,
	): OntologyTypeDefinition<T> | undefined {
		return this.types.get(name) as OntologyTypeDefinition<T> | undefined;
	}

	has(name: string): boolean {
		return this.types.has(name);
	}

	validate(
		name: string,
		data: unknown,
	): { success: boolean; data?: unknown; error?: z.ZodError } {
		const def = this.types.get(name);
		if (!def) {
			return {
				success: false,
				error: new z.ZodError([
					{
						code: z.ZodIssueCode.custom,
						path: [],
						message: `Unknown ontology type "${name}"`,
					},
				]),
			};
		}
		const result = def.schema.safeParse(data);
		if (result.success) {
			return { success: true, data: result.data };
		}
		return { success: false, error: result.error };
	}

	list(): string[] {
		return Array.from(this.types.keys());
	}

	registerAll(defs: OntologyTypeDefinition[]): void {
		for (const def of defs) {
			this.register(def);
		}
	}
}
