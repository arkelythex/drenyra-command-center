import { CPELog } from "@drenyra/domain/accounting/cpe-log";
import { db } from "@drenyra/persistence/client";
import { cpeLog } from "@drenyra/persistence/schema";
import { and, between, eq, sql } from "drizzle-orm";
export class PostgresCpeLogRepository {
	async save(log, companyId) {
		await db.insert(cpeLog).values({
			id: log.id,
			companyId,
			invoiceId: log.invoiceId,
			sunatStatus: log.sunatStatus,
			submittedAt: log.submittedAt,
			acceptedAt: log.acceptedAt,
			rejectedAt: log.rejectedAt,
			observedAt: log.observedAt,
			cancelledAt: log.cancelledAt,
			sunatTicket: log.sunatTicket,
			cdrData: log.cdr
				? {
						id: log.cdr.id,
						content: log.cdr.content,
						resultCode: log.cdr.resultCode,
						resultDescription: log.cdr.resultDescription,
						ticket: log.cdr.ticket,
						receivedAt: log.cdr.receivedAt.toISOString(),
					}
				: null,
			hashValue: log.hashValue,
			hashAlgorithm: log.hashAlgorithm,
			errorMessage: log.errorMessage,
			errorCode: log.errorCode,
		});
	}
	async findById(id) {
		const result = await db
			.select()
			.from(cpeLog)
			.where(eq(cpeLog.id, id))
			.limit(1);
		if (!result[0]) return null;
		return this.mapToDomain(result[0]);
	}
	async findByInvoiceId(invoiceId) {
		const result = await db
			.select()
			.from(cpeLog)
			.where(eq(cpeLog.invoiceId, invoiceId))
			.orderBy(sql`${cpeLog.createdAt} DESC`)
			.limit(1);
		if (!result[0]) return null;
		return this.mapToDomain(result[0]);
	}
	async findByCompanyAndPeriod(companyId, year, month) {
		const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
		const endDate = new Date(year, month, 0, 23, 59, 59, 999);
		const result = await db
			.select()
			.from(cpeLog)
			.where(
				and(
					eq(cpeLog.companyId, companyId),
					between(cpeLog.createdAt, startDate, endDate),
				),
			)
			.orderBy(sql`${cpeLog.createdAt} DESC`);
		return result.map((row) => this.mapToDomain(row));
	}
	async findByStatus(companyId, status) {
		const result = await db
			.select()
			.from(cpeLog)
			.where(
				and(eq(cpeLog.companyId, companyId), eq(cpeLog.sunatStatus, status)),
			)
			.orderBy(sql`${cpeLog.createdAt} DESC`);
		return result.map((row) => this.mapToDomain(row));
	}
	async findByTicket(ticket) {
		const result = await db
			.select()
			.from(cpeLog)
			.where(eq(cpeLog.sunatTicket, ticket))
			.limit(1);
		if (!result[0]) return null;
		return this.mapToDomain(result[0]);
	}
	async updateStatus(id, newStatus, metadata) {
		const updateData = {
			sunatStatus: newStatus,
		};
		if (metadata?.sunatTicket !== undefined) {
			updateData.sunatTicket = metadata.sunatTicket;
		}
		if (metadata?.cdrData !== undefined) {
			updateData.cdrData = metadata.cdrData;
		}
		if (metadata?.errorMessage !== undefined) {
			updateData.errorMessage = metadata.errorMessage;
		}
		if (metadata?.errorCode !== undefined) {
			updateData.errorCode = metadata.errorCode;
		}
		if (metadata?.hashValue !== undefined) {
			updateData.hashValue = metadata.hashValue;
		}
		if (metadata?.hashAlgorithm !== undefined) {
			updateData.hashAlgorithm = metadata.hashAlgorithm;
		}
		if (metadata?.submittedAt !== undefined) {
			updateData.submittedAt = metadata.submittedAt;
		}
		if (metadata?.acceptedAt !== undefined) {
			updateData.acceptedAt = metadata.acceptedAt;
		}
		if (metadata?.rejectedAt !== undefined) {
			updateData.rejectedAt = metadata.rejectedAt;
		}
		if (metadata?.observedAt !== undefined) {
			updateData.observedAt = metadata.observedAt;
		}
		if (metadata?.cancelledAt !== undefined) {
			updateData.cancelledAt = metadata.cancelledAt;
		}
		await db.update(cpeLog).set(updateData).where(eq(cpeLog.id, id));
	}
	async verifyHash(id, xmlHash) {
		const result = await db
			.select({ hashValue: cpeLog.hashValue })
			.from(cpeLog)
			.where(eq(cpeLog.id, id))
			.limit(1);
		if (!result[0]?.hashValue) return false;
		return result[0].hashValue === xmlHash;
	}
	mapToDomain(raw) {
		return CPELog.fromJSON({
			id: raw.id,
			invoiceId: raw.invoiceId,
		});
	}
}
