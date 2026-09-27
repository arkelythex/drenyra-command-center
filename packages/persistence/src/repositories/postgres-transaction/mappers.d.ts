import type { TransactionEntry, TransactionStatus, TransactionType } from "@drenyra/domain/entities/Transaction";
import { Money } from "@drenyra/domain/value-objects/Money";
import type { transactions } from "../../schema";
import type { DbDocumentType, DbTransactionStatus, DbTransactionType } from "./types";
export declare const mapDbStatusToDomain: (dbStatus: DbTransactionStatus | null) => TransactionStatus;
export declare const mapDomainStatusToDb: (domainStatus: TransactionStatus) => DbTransactionStatus;
export declare const mapDomainTypeToDb: (domainType: TransactionType) => DbTransactionType;
export declare const mapDomainTypeToDocumentType: (domainType: TransactionType) => DbDocumentType;
export declare const mapDbToDomainType: (dbType: DbTransactionType, dbDocumentType: DbDocumentType) => TransactionType;
export declare const formatCents: (cents: number) => string;
export declare const resolveReferenceParts: (referenceNumber: string | undefined, type: TransactionType) => {
    series: string;
    number: string;
};
export declare const buildSyntheticEntries: (raw: typeof transactions.$inferSelect, totalAmount: Money) => TransactionEntry[];
//# sourceMappingURL=mappers.d.ts.map