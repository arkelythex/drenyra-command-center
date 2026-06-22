import { randomUUID } from "crypto";
import { and, eq, gte, lte } from "drizzle-orm";
import { Invoice, } from "@arkelythex/domain/entities/Invoice";
import { DNI } from "@arkelythex/domain/value-objects/DNI";
import { DocumentSeries } from "@arkelythex/domain/value-objects/DocumentSeries";
import { Money } from "@arkelythex/domain/value-objects/Money";
import { RUC } from "@arkelythex/domain/value-objects/RUC";
import { db } from "../../client";
import { businessPartners, customerProfiles, invoiceItems, invoices, } from "../../schema";
import { resolveCompanyIdFromOrganization } from "../support/organization-resolver";
import { formatInvoiceAmount, mapModularStatusToInvoiceStatus, mapInvoiceItemToModularInsert, mapInvoiceStatusToModularStatus, mapInvoiceStatusToSunatStatus, resolveInvoicePartnerIdentity, } from "../support/invoice-modern-persistence";
import { toStableUuid } from "../support/stable-uuid";
const normalizeInvoiceReadStatus = (status) => {
    if (status === "CANCELLED")
        return "CANCELLED";
    if (status === "SENT")
        return "SENT";
    return "DRAFT";
};
const normalizeSunatReadStatus = (status) => {
    if (status === "SUBMITTED" || status === "ACCEPTED" || status === "REJECTED" || status === "ANNULLED")
        return status;
    return status === "DRAFT" ? "DRAFT" : null;
};
export class PostgresInvoiceRepository {
    async save(_invoice) {
        throw new Error("InvoiceRepository.save requires tenant context. Use saveForOrganization(invoice, organizationId).");
    }
    async saveForOrganization(invoice, organizationId) {
        await this.upsertToModularStore(invoice, organizationId);
    }
    async findById(id) {
        const modular = await this.findModularById(id);
        if (!modular) {
            return null;
        }
        return this.mapModularToDomain(modular);
    }
    async findAll(filters) {
        const normalizedFilters = this.normalizeFilters(filters);
        const results = await this.findAllModular(normalizedFilters);
        const offset = normalizedFilters.offset ?? 0;
        const limit = normalizedFilters.limit;
        if (limit === undefined) {
            return results.slice(offset);
        }
        return results.slice(offset, offset + limit);
    }
    async delete(id) {
        await db.delete(invoices).where(eq(invoices.id, toStableUuid(id)));
    }
    async update(_invoice) {
        throw new Error("InvoiceRepository.update requires tenant context. Use updateForOrganization(invoice, organizationId).");
    }
    async updateForOrganization(invoice, organizationId) {
        await this.upsertToModularStore(invoice, organizationId);
    }
    async count(filters) {
        const normalizedFilters = this.normalizeFilters(filters);
        const results = await this.findAllModular(normalizedFilters);
        return results.length;
    }
    async upsertToModularStore(invoice, organizationId) {
        const companyId = await resolveCompanyIdFromOrganization(organizationId);
        const persistedInvoiceId = toStableUuid(invoice.id);
        const partnerIdentity = resolveInvoicePartnerIdentity(invoice, persistedInvoiceId);
        await db.transaction(async (tx) => {
            const existingPartnerRows = await tx
                .select({ id: businessPartners.id })
                .from(businessPartners)
                .where(and(eq(businessPartners.companyId, companyId), eq(businessPartners.taxId, partnerIdentity.taxId)))
                .limit(1);
            let customerId = existingPartnerRows[0]?.id;
            if (customerId) {
                await tx
                    .update(businessPartners)
                    .set({
                    partnerDocumentType: partnerIdentity.partnerDocumentType,
                    legalName: invoice.clientName,
                    address: invoice.clientAddress ?? null,
                })
                    .where(eq(businessPartners.id, customerId));
            }
            else {
                customerId = randomUUID();
                await tx.insert(businessPartners).values({
                    id: customerId,
                    companyId,
                    taxId: partnerIdentity.taxId,
                    partnerDocumentType: partnerIdentity.partnerDocumentType,
                    legalName: invoice.clientName,
                    address: invoice.clientAddress ?? null,
                    createdAt: invoice.createdAt,
                });
                await tx.insert(customerProfiles).values({
                    id: customerId,
                    creditLimit: "0.00",
                    creditDays: 30,
                    createdAt: invoice.createdAt,
                    updatedAt: invoice.updatedAt,
                });
            }
            await tx
                .insert(invoices)
                .values({
                id: persistedInvoiceId,
                companyId,
                customerId,
                invoiceNumber: invoice.getFullNumber(),
                series: invoice.series.toString(),
                correlative: invoice.number,
                issueDate: invoice.issueDate,
                dueDate: invoice.dueDate ?? invoice.issueDate,
                currency: invoice.totalAmount.getCurrency(),
                exchangeRate: "1.0000",
                subtotal: formatInvoiceAmount(invoice.baseAmount.getAmount()),
                igvAmount: formatInvoiceAmount(invoice.igvAmount.getAmount()),
                totalAmount: formatInvoiceAmount(invoice.totalAmount.getAmount()),
                status: mapInvoiceStatusToModularStatus(invoice.status),
                sunatStatus: mapInvoiceStatusToSunatStatus(invoice.status),
                paidAmount: "0.00",
                balanceDue: formatInvoiceAmount(invoice.totalAmount.getAmount()),
                notes: invoice.notes ?? null,
                createdAt: invoice.createdAt,
                updatedAt: invoice.updatedAt,
            })
                .onConflictDoUpdate({
                target: invoices.id,
                set: {
                    customerId,
                    invoiceNumber: invoice.getFullNumber(),
                    series: invoice.series.toString(),
                    correlative: invoice.number,
                    issueDate: invoice.issueDate,
                    dueDate: invoice.dueDate ?? invoice.issueDate,
                    currency: invoice.totalAmount.getCurrency(),
                    subtotal: formatInvoiceAmount(invoice.baseAmount.getAmount()),
                    igvAmount: formatInvoiceAmount(invoice.igvAmount.getAmount()),
                    totalAmount: formatInvoiceAmount(invoice.totalAmount.getAmount()),
                    status: mapInvoiceStatusToModularStatus(invoice.status),
                    sunatStatus: mapInvoiceStatusToSunatStatus(invoice.status),
                    balanceDue: formatInvoiceAmount(invoice.totalAmount.getAmount()),
                    notes: invoice.notes ?? null,
                    updatedAt: invoice.updatedAt,
                },
            });
            await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, persistedInvoiceId));
            if (invoice.items.length > 0) {
                await tx.insert(invoiceItems).values(invoice.items.map((item) => mapInvoiceItemToModularInsert(persistedInvoiceId, item)));
            }
        });
    }
    normalizeFilters(filters) {
        if (!filters) {
            return {};
        }
        const { startDate, endDate, ...rest } = filters;
        return {
            ...rest,
            startDate: startDate ?? filters.dateFrom,
            endDate: endDate ?? filters.dateTo,
        };
    }
    async findModularById(id) {
        const persistedId = toStableUuid(id);
        const rows = await db
            .select({ invoice: invoices, customer: businessPartners })
            .from(invoices)
            .innerJoin(businessPartners, eq(invoices.customerId, businessPartners.id))
            .where(eq(invoices.id, persistedId))
            .limit(1);
        if (rows.length === 0) {
            return null;
        }
        const items = await db
            .select()
            .from(invoiceItems)
            .where(eq(invoiceItems.invoiceId, persistedId));
        return {
            invoice: rows[0].invoice,
            customer: rows[0].customer,
            items,
        };
    }
    async findAllModular(filters) {
        const whereConditions = [];
        if (filters.status) {
            if (filters.status === "CANCELLED") {
                whereConditions.push(eq(invoices.status, "CANCELLED"));
            }
            else if (filters.status === "SENT" ||
                filters.status === "ACCEPTED" ||
                filters.status === "REJECTED") {
                whereConditions.push(eq(invoices.status, "SENT"));
            }
            else {
                whereConditions.push(eq(invoices.status, "DRAFT"));
            }
        }
        if (filters.startDate) {
            whereConditions.push(gte(invoices.issueDate, filters.startDate));
        }
        if (filters.endDate) {
            whereConditions.push(lte(invoices.issueDate, filters.endDate));
        }
        if (filters.series) {
            whereConditions.push(eq(invoices.series, filters.series));
        }
        if (filters.minAmount !== undefined) {
            whereConditions.push(gte(invoices.totalAmount, filters.minAmount.toFixed(2)));
        }
        if (filters.maxAmount !== undefined) {
            whereConditions.push(lte(invoices.totalAmount, filters.maxAmount.toFixed(2)));
        }
        const rows = await db
            .select({ invoice: invoices, customer: businessPartners })
            .from(invoices)
            .innerJoin(businessPartners, eq(invoices.customerId, businessPartners.id))
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(invoices.createdAt);
        const results = [];
        for (const row of rows) {
            if (filters.clientName) {
                const clientNameMatch = row.customer.legalName
                    .toLowerCase()
                    .includes(filters.clientName.toLowerCase());
                if (!clientNameMatch) {
                    continue;
                }
            }
            if (filters.clientRUC) {
                const clientRucMatch = row.customer.taxId
                    .toLowerCase()
                    .includes(filters.clientRUC.toLowerCase());
                if (!clientRucMatch) {
                    continue;
                }
            }
            if (filters.clientSearch) {
                const search = filters.clientSearch.toLowerCase();
                const matchesSearch = row.customer.legalName.toLowerCase().includes(search) ||
                    row.customer.taxId.toLowerCase().includes(search);
                if (!matchesSearch) {
                    continue;
                }
            }
            const items = await db
                .select()
                .from(invoiceItems)
                .where(eq(invoiceItems.invoiceId, row.invoice.id));
            const domainInvoice = this.mapModularToDomain({
                invoice: row.invoice,
                customer: row.customer,
                items,
            });
            if (filters.status &&
                domainInvoice.status !== filters.status &&
                !(filters.status === "PENDING" && domainInvoice.status === "DRAFT")) {
                continue;
            }
            results.push(domainInvoice);
        }
        return results;
    }
    mapModularToDomain(raw) {
        const currency = raw.invoice.currency;
        const customerTaxId = raw.customer.taxId;
        const customerDocumentType = raw.customer.partnerDocumentType;
        const items = raw.items.map((item) => ({
            id: item.id,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Money.fromAmount(Number(item.unitPrice), currency),
            subtotal: Money.fromAmount(Number(item.subtotal), currency),
            igv: Money.fromAmount(Number(item.igvAmount), currency),
            total: Money.fromAmount(Number(item.totalAmount), currency),
        }));
        return Invoice.create({
            id: raw.invoice.id,
            series: DocumentSeries.create(raw.invoice.series),
            number: raw.invoice.correlative,
            issueDate: raw.invoice.issueDate,
            dueDate: raw.invoice.dueDate ?? undefined,
            clientName: raw.customer.legalName,
            clientRUC: customerDocumentType === "RUC" ? RUC.create(customerTaxId) : undefined,
            clientDNI: customerDocumentType === "DNI" ? DNI.create(customerTaxId) : undefined,
            clientAddress: raw.customer.address ?? undefined,
            baseAmount: Money.fromAmount(Number(raw.invoice.subtotal), currency),
            igvAmount: Money.fromAmount(Number(raw.invoice.igvAmount), currency),
            totalAmount: Money.fromAmount(Number(raw.invoice.totalAmount), currency),
            status: mapModularStatusToInvoiceStatus(normalizeInvoiceReadStatus(raw.invoice.status), normalizeSunatReadStatus(raw.invoice.sunatStatus)),
            items,
            notes: raw.invoice.notes ?? undefined,
            sentToSunatAt: raw.invoice.status === "SENT" ? raw.invoice.updatedAt : undefined,
            createdAt: raw.invoice.createdAt,
            updatedAt: raw.invoice.updatedAt,
        });
    }
}
//# sourceMappingURL=repository.js.map