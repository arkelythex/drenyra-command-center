/**
 * Transaction Reference Value Object
 * Normalizes and validates invoice/bill references for matching
 *
 * Handles formats like:
 * - "F001-00123" (standard factura)
 * - "f001 123" (with space)
 * - "F001/123" (with slash)
 * - "B001-00456" (boleta)
 *
 * @example
 * ```ts
 * const ref = TransactionReference.create("f001 123");
 * ref.getNormalized(); // "F001-00123"
 * ```
 */

export class TransactionReference {
	private static readonly PATTERNS = {
		INVOICE: /^[fF](\d{3})[-\s/]?0*(\d+)$/,
		BILL: /^[bB](\d{3})[-\s/]?0*(\d+)$/,
		BOLETA: /^[bB][vV]?(\d{3})[-\s/]?0*(\d+)$/,
	};

	private constructor(
		private readonly value: string,
		private readonly normalized: string,
		private readonly type: "INVOICE" | "BILL" | "BOLETA" | "OTHER",
	) {
		Object.freeze(this);
	}

	static create(reference: string): TransactionReference {
		const trimmed = reference.trim();
		const normalized = TransactionReference.normalize(trimmed);
		const type = TransactionReference.detectType(trimmed);

		return new TransactionReference(trimmed, normalized, type);
	}

	static normalize(reference: string): string {
		const cleaned = reference
			.trim()
			.toUpperCase()
			.replace(/\s+/g, "-")
			.replace(/\//g, "-");

		for (const [type, pattern] of Object.entries(
			TransactionReference.PATTERNS,
		)) {
			const match = cleaned.match(pattern);
			if (match) {
				const prefix =
					type === "INVOICE" ? "F" : type === "BOLETA" ? "BV" : "B";
				const series = match[1].padStart(3, "0");
				const number = match[2].padStart(5, "0");
				return `${prefix}${series}-${number}`;
			}
		}

		return cleaned;
	}

	static detectType(
		reference: string,
	): "INVOICE" | "BILL" | "BOLETA" | "OTHER" {
		const upper = reference.toUpperCase();

		if (TransactionReference.PATTERNS.INVOICE.test(upper)) {
			return "INVOICE";
		}
		if (TransactionReference.PATTERNS.BOLETA.test(upper)) {
			return "BOLETA";
		}
		if (TransactionReference.PATTERNS.BILL.test(upper)) {
			return "BILL";
		}

		return "OTHER";
	}

	static isValidDocumentReference(reference: string): boolean {
		const type = TransactionReference.detectType(reference);
		return type !== "OTHER";
	}

	getValue(): string {
		return this.value;
	}

	getNormalized(): string {
		return this.normalized;
	}

	getType(): "INVOICE" | "BILL" | "BOLETA" | "OTHER" {
		return this.type;
	}

	getSeries(): string | null {
		const match = this.normalized.match(/^[A-Z]+(\d{3})-/);
		return match ? match[1] : null;
	}

	getNumber(): string | null {
		const match = this.normalized.match(/-(\d+)$/);
		return match ? match[1] : null;
	}

	matches(other: TransactionReference): boolean {
		return this.normalized === other.normalized;
	}

	containsIn(text: string): boolean {
		const upperText = text.toUpperCase();
		return (
			upperText.includes(this.normalized) ||
			upperText.includes(this.value.toUpperCase())
		);
	}

	equals(other: TransactionReference | null | undefined): boolean {
		if (!other) return false;
		return this.normalized === other.normalized;
	}

	toString(): string {
		return this.normalized;
	}

	toJSON(): string {
		return this.normalized;
	}
}
