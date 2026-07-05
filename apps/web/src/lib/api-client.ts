import type { App } from "@drenyra/api/contract";
import { treaty } from "@elysiajs/eden";
import { runtimeConfig } from "./runtime-config";

const API_URL = runtimeConfig.apiUrl;

/**
 * api - Instancia canónica y pura del cliente Eden Treaty.
 *
 * ATENCIÓN: Este archivo NO debe importar nada de features/auth
 * para evitar dependencias circulares. La inyección de estado
 * debe hacerse vía headers dinámicos o en el store directamente.
 */
export const api = treaty<App>(API_URL, {
	fetch: {
		credentials: "include",
	},
});
