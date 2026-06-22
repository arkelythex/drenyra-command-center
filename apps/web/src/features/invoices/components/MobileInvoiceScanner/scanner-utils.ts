import type { ScanResult } from "../mobile-scanner/mobile-scanner.types";

export function generateMockScanResult(): ScanResult {
	return {
		invoiceNumber: `F${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
		amount: Math.floor(Math.random() * 10000) + 100,
		vendor:
			["SUNAT Corp", "Tech Solutions", "Consulting Peru", "Importadora XYZ"][
				Math.floor(Math.random() * 4)
			] ?? "Proveedor",
		date: new Date().toISOString().split("T")[0] ?? "",
		confidence: Math.floor(Math.random() * 20) + 80,
	};
}
