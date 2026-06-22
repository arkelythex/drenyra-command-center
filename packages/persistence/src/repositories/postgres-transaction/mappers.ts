import type { TransactionEntry, TransactionStatus, TransactionType } from "@arkelythex/domain/entities/Transaction";
import { Money } from "@arkelythex/domain/value-objects/Money";
import { transactions } from "../../schema";
import type { DbDocumentType, DbTransactionStatus, DbTransactionType } from "./types";

export const mapDbStatusToDomain = (dbStatus: DbTransactionStatus | null): TransactionStatus => {
	switch (dbStatus) {
		case "ACCEPTED":
			return "POSTED";
		case "ANNULLED":
			return "VOIDED";
		default:
			return "DRAFT";
	}
};

export const mapDomainStatusToDb = (
	domainStatus: TransactionStatus,
): DbTransactionStatus => {
	switch (domainStatus) {
		case "POSTED":
			return "ACCEPTED";
		case "VOIDED":
			return "ANNULLED";
		default:
			return "DRAFT";
	}
};

export const mapDomainTypeToDb = (domainType: TransactionType): DbTransactionType => {
	switch (domainType) {
		case "PURCHASE":
		case "PAYMENT":
			return "EXPENSE";
		default:
			return "INCOME";
	}
};

export const mapDomainTypeToDocumentType = (
	domainType: TransactionType,
): DbDocumentType => {
	switch (domainType) {
		case "PAYMENT":
		case "RECEIPT":
		case "TRANSFER":
			return "MOVIMIENTO_BANCARIO";
		case "ADJUSTMENT":
			return "NOTA_CREDITO";
		default:
			return "FACTURA";
	}
};

export const mapDbToDomainType = (
	dbType: DbTransactionType,
	dbDocumentType: DbDocumentType,
): TransactionType => {
	if (
		dbDocumentType === "NOTA_CREDITO" ||
		dbDocumentType === "NOTA_DEBITO"
	) {
		return "ADJUSTMENT";
	}

	if (dbDocumentType === "MOVIMIENTO_BANCARIO") {
		return dbType === "INCOME" ? "RECEIPT" : "PAYMENT";
	}

	return dbType === "INCOME" ? "SALE" : "PURCHASE";
};

export const formatCents = (cents: number): string => (cents / 100).toFixed(2);

export const resolveReferenceParts = (
	referenceNumber: string | undefined,
	type: TransactionType,
): { series: string; number: string } => {
	const [seriesPart, numberPart] = referenceNumber?.split("-") ?? [];
	const year = new Date().getFullYear();
	const fallbackSeries = type === "ADJUSTMENT" ? `ADJ${year}` : `TRX${year}`;

	return {
		series: seriesPart || fallbackSeries,
		number: numberPart || "00000001",
	};
};

export const buildSyntheticEntries = (
	raw: typeof transactions.$inferSelect,
	totalAmount: Money,
): TransactionEntry[] => {
	const description = raw.notes ?? "Movimiento fiscal";

	return [
		{
			id: `${raw.id}-debit`,
			accountCode: "1041",
			accountName: "Caja",
			debit: totalAmount,
			credit: Money.zero(totalAmount.getCurrency()),
			description,
		},
		{
			id: `${raw.id}-credit`,
			accountCode: raw.type === "INCOME" ? "7011" : "4212",
			accountName: raw.type === "INCOME" ? "Ventas" : "Proveedores",
			debit: Money.zero(totalAmount.getCurrency()),
			credit: totalAmount,
			description,
		},
	];
};
