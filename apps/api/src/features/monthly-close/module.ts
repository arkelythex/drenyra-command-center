import type { CloseChecklistRepository } from "@drenyra/domain/repositories/close-checklist.repository";
import { PostgresCloseChecklistRepository } from "@drenyra/persistence";
import { createMonthlyCloseRoutes } from "./routes";

export function createMonthlyCloseModule(repo: CloseChecklistRepository) {
	return createMonthlyCloseRoutes(repo);
}

const defaultRepo = new PostgresCloseChecklistRepository();
export const monthlyCloseModule = createMonthlyCloseModule(defaultRepo);
