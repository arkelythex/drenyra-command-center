export type DiffId = string & { readonly __brand: "DiffId" };

export function createDiffId(): DiffId {
	return crypto.randomUUID() as DiffId;
}
