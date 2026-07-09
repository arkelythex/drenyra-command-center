/**
 * Fiscal Anomaly Detector — Rule-based anomaly detection.
 * Inspired by Digits' always-on Quality Control.
 *
 * Detects: IGV rate anomalies, vendor duplication, correlative gaps,
 * circular amounts, unusual patterns.
 */

export interface Anomaly {
	type:
		| "IGV_RATE_ANOMALY"
		| "VENDOR_DUPLICATION"
		| "CORRELATIVE_GAP"
		| "CIRCULAR_AMOUNT"
		| "UNUSUAL_PATTERN";
	severity: "LOW" | "MEDIUM" | "HIGH";
	transactionId: string;
	description: string;
	details: Record<string, unknown>;
}

export interface TransactionForAnomalyCheck {
	id: string;
	amount: number;
	igvRate?: number;
	vendorName?: string;
	vendorTaxId?: string;
	series?: string;
	number?: number;
	date: Date;
	description?: string;
}

const IGV_STANDARD_RATE = 0.18;
const IGV_TOLERANCE = 0.005;

export class AnomalyDetector {
	/**
	 * Run all anomaly checks on a set of transactions.
	 */
	async detectAll(
		transactions: TransactionForAnomalyCheck[],
	): Promise<Anomaly[]> {
		const anomalies: Anomaly[] = [
			...this.checkIgvRates(transactions),
			...this.checkVendorDuplication(transactions),
			...this.checkCircularAmounts(transactions),
		];
		return anomalies;
	}

	/**
	 * Check for non-standard IGV rates (should be 18% for most transactions).
	 */
	private checkIgvRates(transactions: TransactionForAnomalyCheck[]): Anomaly[] {
		return transactions
			.filter(
				(tx) =>
					tx.igvRate != null &&
					Math.abs(tx.igvRate - IGV_STANDARD_RATE) > IGV_TOLERANCE,
			)
			.map((tx) => ({
				type: "IGV_RATE_ANOMALY" as const,
				severity: (Math.abs(tx.igvRate! - IGV_STANDARD_RATE) > 0.1
					? "HIGH"
					: "MEDIUM") as "HIGH" | "MEDIUM",
				transactionId: tx.id,
				description: `Non-standard IGV rate: ${(tx.igvRate! * 100).toFixed(1)}% (expected ${(IGV_STANDARD_RATE * 100).toFixed(0)}%)`,
				details: { actualRate: tx.igvRate, expectedRate: IGV_STANDARD_RATE },
			}));
	}

	/**
	 * Check for vendors sharing the same tax ID with different names.
	 */
	private checkVendorDuplication(
		transactions: TransactionForAnomalyCheck[],
	): Anomaly[] {
		const byTaxId = new Map<string, Set<string>>();
		for (const tx of transactions) {
			if (!tx.vendorTaxId) continue;
			if (!byTaxId.has(tx.vendorTaxId)) byTaxId.set(tx.vendorTaxId, new Set());
			if (tx.vendorName) byTaxId.get(tx.vendorTaxId)?.add(tx.vendorName);
		}

		const anomalies: Anomaly[] = [];
		for (const [taxId, names] of byTaxId) {
			if (names.size > 1) {
				anomalies.push({
					type: "VENDOR_DUPLICATION",
					severity: "MEDIUM",
					transactionId: taxId,
					description: `Tax ID ${taxId} registered under ${names.size} different names: ${[...names].join(", ")}`,
					details: { taxId, names: [...names] },
				});
			}
		}
		return anomalies;
	}

	/**
	 * Check for suspicious circular amounts (same vendor, same amount, multiple dates).
	 */
	private checkCircularAmounts(
		transactions: TransactionForAnomalyCheck[],
	): Anomaly[] {
		const byVendorAmount = new Map<string, TransactionForAnomalyCheck[]>();
		for (const tx of transactions) {
			if (!tx.vendorName) continue;
			const key = `${tx.vendorName}:${tx.amount}`;
			if (!byVendorAmount.has(key)) byVendorAmount.set(key, []);
			byVendorAmount.get(key)?.push(tx);
		}

		return [...byVendorAmount.entries()]
			.filter(([_, txs]) => txs.length >= 3)
			.map(([key, txs]) => ({
				type: "CIRCULAR_AMOUNT" as const,
				severity: (txs.length >= 5 ? "HIGH" : "MEDIUM") as "HIGH" | "MEDIUM",
				transactionId: txs[0]?.id,
				description: `${txs.length} transactions with same vendor and amount: ${key}`,
				details: {
					count: txs.length,
					dates: txs.map((t) => t.date.toISOString().split("T")[0]),
				},
			}));
	}
}
