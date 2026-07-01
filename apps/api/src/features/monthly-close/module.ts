import type { CloseChecklistRepository } from "@arkelythex/domain/repositories/close-checklist.repository";
import { PostgresCloseChecklistRepository } from "@arkelythex/persistence";
import { Elysia } from "elysia";
import { createMonthlyCloseRoutes } from "./routes";

export function createMonthlyCloseModule(repo: CloseChecklistRepository) {
	return createMonthlyCloseRoutes(repo);
}

const defaultRepo = new PostgresCloseChecklistRepository();
export const monthlyCloseModule = createMonthlyCloseModule(defaultRepo);
