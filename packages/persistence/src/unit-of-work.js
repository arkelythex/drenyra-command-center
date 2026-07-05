import { db } from "./client";
export class UnitOfWork {
	_tx = null;
	get tx() {
		if (!this._tx) {
			throw new Error(
				"No active transaction. UnitOfWork must be used within execute().",
			);
		}
		return this._tx;
	}
	get isActive() {
		return this._tx !== null;
	}
	static async execute(work) {
		const unitOfWork = new UnitOfWork();
		return db.transaction(async (tx) => {
			unitOfWork._tx = tx;
			try {
				return await work(unitOfWork);
			} finally {
				unitOfWork._tx = null;
			}
		});
	}
	static async executeOptional(uow, work) {
		if (uow?.isActive) {
			return work(uow.tx);
		}
		return work(db);
	}
}
export function withTransaction(factory) {
	return (tx) => factory(tx ?? db);
}
export async function batchQuery(_tx, items, getId = (item) => item.id) {
	return new Map(items.map((item) => [getId(item), item]));
}
//# sourceMappingURL=unit-of-work.js.map
