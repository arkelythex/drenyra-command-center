/**
 * Value Objects for SUNAT UBL 2.1
 * @principle Domain-Driven Design - Immutable value objects
 */

export class RUC {
	private constructor(private readonly value: string) {}

	static create(value: string): RUC {
		if (!/^\d{11}$/.test(value)) {
			throw new Error("RUC must be 11 digits");
		}
		return new RUC(value);
	}

	toString(): string {
		return this.value;
	}
}

export class InvoiceNumber {
	private constructor(
		private readonly series: string,
		private readonly number: number,
	) {}

	static create(series: string, number: number): InvoiceNumber {
		if (!/^[FB]\d{3}$/.test(series)) {
			throw new Error("Series must be F001, B001, etc.");
		}
		if (number < 1 || number > 99999999) {
			throw new Error("Number must be between 1 and 99999999");
		}
		return new InvoiceNumber(series, number);
	}

	toString(): string {
		return `${this.series}-${this.number.toString().padStart(8, "0")}`;
	}

	getSeries(): string {
		return this.series;
	}

	getNumber(): string {
		return this.number.toString().padStart(8, "0");
	}
}

export class MonetaryAmount {
	private constructor(
		private readonly amount: number,
		private readonly currency: "PEN" | "USD",
	) {}

	static create(
		amount: number,
		currency: "PEN" | "USD" = "PEN",
	): MonetaryAmount {
		if (amount < 0) {
			throw new Error("Amount cannot be negative");
		}
		return new MonetaryAmount(Math.round(amount * 100) / 100, currency);
	}

	toString(): string {
		return this.amount.toFixed(2);
	}

	getCurrency(): string {
		return this.currency;
	}

	getAmount(): number {
		return this.amount;
	}
}

export class InvoiceItem {
	constructor(
		public readonly id: number,
		public readonly description: string,
		public readonly quantity: number,
		public readonly unitPrice: MonetaryAmount,
		public readonly igvRate: number = 0.18,
	) {}

	getSubtotal(): MonetaryAmount {
		return MonetaryAmount.create(
			this.quantity * this.unitPrice.getAmount(),
			this.unitPrice.getCurrency() as "PEN" | "USD",
		);
	}

	getIGV(): MonetaryAmount {
		return MonetaryAmount.create(
			this.getSubtotal().getAmount() * this.igvRate,
			this.unitPrice.getCurrency() as "PEN" | "USD",
		);
	}

	getTotal(): MonetaryAmount {
		return MonetaryAmount.create(
			this.getSubtotal().getAmount() + this.getIGV().getAmount(),
			this.unitPrice.getCurrency() as "PEN" | "USD",
		);
	}
}
