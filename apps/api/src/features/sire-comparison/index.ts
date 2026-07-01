import { Elysia } from "elysia";
import { sireComparisonRoutes } from "./routes";

export const sireComparisonModule = new Elysia({
	name: "sire-comparison-module",
}).use(sireComparisonRoutes);

export { SireComparisonService } from "./infrastructure/compare.service";
export { sireComparisonRoutes } from "./routes";
export * from "./types";
