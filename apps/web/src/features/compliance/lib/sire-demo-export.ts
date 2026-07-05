import { runtimeConfig } from "@/lib/runtime-config";

const API_URL = runtimeConfig.apiUrl;

export const SIRE_DEMO_EXPORT_PERIOD = "2026-03";
export const SIRE_DEMO_EXPORT_PERIOD_LABEL = "Marzo 2026";

interface SireDemoExportInput {
	companyId: string;
	ledgerType: "ventas" | "compras";
	format: "TXT" | "EXCEL";
	period?: string;
}

export function createSireDemoExportUrl(input: SireDemoExportInput): string {
	const params = new URLSearchParams({
		companyId: input.companyId,
		ledgerType: input.ledgerType,
		format: input.format,
	});

	if (input.period) {
		params.set("period", input.period);
	}

	return `${API_URL}/api/compliance/sire-demo-export?${params.toString()}`;
}

export function triggerSireDemoExport(input: SireDemoExportInput): void {
	if (typeof document === "undefined") return;

	const anchor = document.createElement("a");
	anchor.href = createSireDemoExportUrl(input);
	anchor.rel = "noopener noreferrer";
	anchor.target = "_blank";
	anchor.click();
}
