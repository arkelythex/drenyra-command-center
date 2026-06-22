import { eq } from "drizzle-orm";
import * as schema from "@arkelythex/persistence/schema";
import { DEFAULT_VISIBLE_MONTHS, DEMO_PARTNERS, DEMO_PRODUCTS, INVOICE_BLUEPRINTS, BILL_BLUEPRINTS, BANK_TRANSACTION_BLUEPRINTS, IGV_RATE, } from "./seed-operational-demo.data";
function money(value) {
    return value.toFixed(2);
}
function monthDate(baseDate, monthOffset, day) {
    return new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, day, 10, 0, 0, 0);
}
function totalsFromSubtotal(subtotal) {
    const igvAmount = Number((subtotal * IGV_RATE).toFixed(2));
    const totalAmount = Number((subtotal + igvAmount).toFixed(2));
    return {
        subtotal: money(subtotal),
        igvAmount: money(igvAmount),
        totalAmount: money(totalAmount),
    };
}
function buildInvoiceNumber(correlative) {
    return `F001-${String(correlative).padStart(8, "0")}`;
}
export async function seedOperationalDemoData(db, input) {
    const { companyId } = input;
    const now = new Date();
    await db.transaction(async (tx) => {
        await tx
            .delete(schema.bankTransactions)
            .where(eq(schema.bankTransactions.companyId, companyId));
        await tx
            .delete(schema.bankReconciliations)
            .where(eq(schema.bankReconciliations.companyId, companyId));
        await tx
            .delete(schema.bankAccounts)
            .where(eq(schema.bankAccounts.companyId, companyId));
        await tx
            .delete(schema.payments)
            .where(eq(schema.payments.companyId, companyId));
        await tx
            .delete(schema.transactions)
            .where(eq(schema.transactions.companyId, companyId));
        await tx
            .delete(schema.invoices)
            .where(eq(schema.invoices.companyId, companyId));
        await tx.delete(schema.bills).where(eq(schema.bills.companyId, companyId));
        await tx
            .delete(schema.inventoryMovements)
            .where(eq(schema.inventoryMovements.companyId, companyId));
        await tx
            .delete(schema.inventory)
            .where(eq(schema.inventory.companyId, companyId));
        await tx
            .delete(schema.warehouses)
            .where(eq(schema.warehouses.companyId, companyId));
        await tx
            .delete(schema.products)
            .where(eq(schema.products.companyId, companyId));
        await tx
            .delete(schema.businessPartners)
            .where(eq(schema.businessPartners.companyId, companyId));
        const partners = await tx
            .insert(schema.businessPartners)
            .values(DEMO_PARTNERS.map((partner) => ({
            companyId,
            taxId: partner.taxId,
            legalName: partner.legalName,
            email: partner.email,
            sunatCondition: "HABIDO",
            complianceScore: 96,
        })))
            .returning();
        const partnerByKey = Object.fromEntries(DEMO_PARTNERS.map((partner, index) => [partner.key, partners[index]]));
        const products = await tx
            .insert(schema.products)
            .values(DEMO_PRODUCTS.map((product) => ({
            companyId,
            sku: product.sku,
            name: product.name,
            description: `${product.name} para operacion demo del dashboard`,
            category: "Logistica",
            unitPrice: money(product.unitPrice),
            costPrice: money(product.costPrice),
            taxType: "GRAVADO",
            unit: product.unit,
            stockQuantity: "24",
            minStock: "6",
            maxStock: "48",
            isActive: true,
        })))
            .returning();
        const productByKey = Object.fromEntries(DEMO_PRODUCTS.map((product, index) => [product.key, products[index]]));
        const warehouses = await tx
            .insert(schema.warehouses)
            .values([
            {
                companyId,
                name: "Centro Operativo San Isidro",
                code: "CO-001",
                address: "Av. Javier Prado Este 1021, San Isidro",
                city: "Lima",
                country: "PE",
                phone: "+51 1 555-0101",
                manager: "Lucia Alvarado",
                isActive: true,
                isDefault: true,
            },
            {
                companyId,
                name: "Hub Callao Ultima Milla",
                code: "CO-002",
                address: "Av. Argentina 2140, Callao",
                city: "Callao",
                country: "PE",
                phone: "+51 1 555-0102",
                manager: "Diego Paredes",
                isActive: true,
                isDefault: false,
            },
        ])
            .returning();
        await tx.insert(schema.inventory).values(products.map((product) => ({
            companyId,
            productId: product.id,
            warehouseId: warehouses[0].id,
            quantity: product.stockQuantity ?? "0",
            minStock: product.minStock ?? "6",
            maxStock: product.maxStock ?? "48",
            unitCost: product.costPrice ?? "0",
            totalValue: money(Number(product.costPrice ?? "0") *
                Number(product.stockQuantity ?? "0")),
        })));
        await tx.insert(schema.inventoryMovements).values([
            {
                companyId,
                productId: productByKey.scanner.id,
                warehouseId: warehouses[0].id,
                type: "IN",
                quantity: "24",
                unitCost: "1190.00",
                totalCost: "28560.00",
                reference: "PURCHASE",
                referenceNumber: "PO-2026-DEMO-01",
                reason: "Carga inicial de stock demo",
                notes: "Seed deterministico para Neural Dashboard",
            },
            {
                companyId,
                productId: productByKey.scanner.id,
                warehouseId: warehouses[1].id,
                type: "OUT",
                quantity: "4",
                unitCost: "1190.00",
                totalCost: "4760.00",
                reference: "TRANSFER",
                referenceNumber: "TR-2026-DEMO-01",
                reason: "Redistribucion a hub de ultima milla",
                notes: "Movimiento interno para demo",
            },
        ]);
        const invoices = await tx
            .insert(schema.invoices)
            .values(INVOICE_BLUEPRINTS.map((invoice) => {
            const issueDate = monthDate(now, invoice.monthOffset, invoice.day);
            const totals = totalsFromSubtotal(invoice.subtotal);
            const isPaid = invoice.status === "PAID";
            return {
                companyId,
                customerId: partnerByKey[invoice.customerKey].id,
                invoiceNumber: buildInvoiceNumber(invoice.correlative),
                series: "F001",
                correlative: invoice.correlative,
                issueDate,
                dueDate: monthDate(now, invoice.monthOffset, invoice.day + 15),
                currency: "PEN",
                exchangeRate: "1.0000",
                subtotal: totals.subtotal,
                igvAmount: totals.igvAmount,
                totalAmount: totals.totalAmount,
                status: invoice.status,
                sunatStatus: invoice.sunatStatus,
                paidAmount: isPaid ? totals.totalAmount : "0.00",
                balanceDue: isPaid ? "0.00" : totals.totalAmount,
                paidDate: isPaid
                    ? monthDate(now, invoice.monthOffset, invoice.day + 2)
                    : null,
                sunatTicket: invoice.sunatStatus === "ACCEPTED"
                    ? `TKT-${invoice.correlative}`
                    : null,
                notes: "Factura demo para dashboard operativo",
                tags: {
                    source: "operational-demo",
                    kind: "invoice",
                },
            };
        }))
            .returning();
        await tx.insert(schema.invoiceItems).values(invoices.map((invoice, index) => {
            const blueprint = INVOICE_BLUEPRINTS[index];
            const product = productByKey[blueprint.productKey];
            const totals = totalsFromSubtotal(blueprint.subtotal);
            return {
                invoiceId: invoice.id,
                productId: product.id,
                description: product.name,
                quantity: "1.00",
                unitPrice: money(blueprint.subtotal),
                taxType: "GRAVADO",
                igvRate: "18.00",
                subtotal: totals.subtotal,
                igvAmount: totals.igvAmount,
                totalAmount: totals.totalAmount,
            };
        }));
        await tx.insert(schema.transactions).values(INVOICE_BLUEPRINTS.map((invoice) => {
            const issueDate = monthDate(now, invoice.monthOffset, invoice.day);
            const dueDate = monthDate(now, invoice.monthOffset, invoice.day + 15);
            const totals = totalsFromSubtotal(invoice.subtotal);
            const status = invoice.sunatStatus ?? "DRAFT";
            const transaction = {
                companyId,
                partnerId: partnerByKey[invoice.customerKey].id,
                type: "INCOME",
                documentType: "FACTURA",
                series: "F001",
                number: String(invoice.correlative).padStart(8, "0"),
                issueDate,
                dueDate,
                currency: "PEN",
                exchangeRate: "1.000",
                subtotal: totals.subtotal,
                igvAmount: totals.igvAmount,
                totalAmount: totals.totalAmount,
                status,
                notes: "Transaccion demo derivada de factura operativa",
                tags: {
                    source: "operational-demo",
                    kind: "invoice-ledger",
                },
            };
            return transaction;
        }));
        const bills = await tx
            .insert(schema.bills)
            .values(BILL_BLUEPRINTS.map((bill) => {
            const issueDate = monthDate(now, bill.monthOffset, bill.day);
            const totals = totalsFromSubtotal(bill.subtotal);
            return {
                companyId,
                vendorId: partnerByKey[bill.vendorKey].id,
                billNumber: bill.billNumber,
                issueDate,
                dueDate: monthDate(now, bill.monthOffset, bill.day + 10),
                currency: "PEN",
                exchangeRate: "1.0000",
                subtotalAmount: totals.subtotal,
                igvAmount: totals.igvAmount,
                totalAmount: totals.totalAmount,
                status: bill.status,
                notes: "Gasto demo para dashboard operativo",
            };
        }))
            .returning();
        await tx.insert(schema.billItems).values(bills.map((bill, index) => {
            const blueprint = BILL_BLUEPRINTS[index];
            const product = productByKey[blueprint.productKey];
            const totals = totalsFromSubtotal(blueprint.subtotal);
            return {
                billId: bill.id,
                productId: product.id,
                description: product.name,
                quantity: "1.00",
                unitPrice: totals.totalAmount,
                total: totals.totalAmount,
            };
        }));
        const mainAccount = await tx
            .insert(schema.bankAccounts)
            .values({
            companyId,
            accountName: "Cuenta Operativa BCP",
            accountNumber: "191-84561234-0-18",
            accountType: "CHECKING",
            bankName: "BCP",
            bankCode: "002",
            branch: "San Isidro",
            currency: "PEN",
            currentBalance: "124580.40",
            availableBalance: "121380.40",
            isActive: true,
            isDefault: true,
        })
            .returning();
        await tx.insert(schema.bankAccounts).values({
            companyId,
            accountName: "Cuenta Recaudadora Interbank",
            accountNumber: "898-0023411120",
            accountType: "CHECKING",
            bankName: "Interbank",
            bankCode: "003",
            branch: "Miraflores",
            currency: "PEN",
            currentBalance: "28640.90",
            availableBalance: "28640.90",
            isActive: true,
            isDefault: false,
        });
        const primaryAccountId = mainAccount[0].id;
        let runningBalance = 92400.4;
        await tx.insert(schema.bankTransactions).values(BANK_TRANSACTION_BLUEPRINTS.map((entry) => {
            runningBalance +=
                entry.type === "CREDIT" ? entry.amount : -entry.amount;
            const invoiceId = "invoiceIndex" in entry && entry.invoiceIndex !== null
                ? invoices[entry.invoiceIndex].id
                : null;
            const billId = "billIndex" in entry && entry.billIndex !== null
                ? bills[entry.billIndex].id
                : null;
            return {
                companyId,
                accountId: primaryAccountId,
                transactionDate: monthDate(now, entry.monthOffset, entry.day)
                    .toISOString()
                    .split("T")[0],
                description: entry.description,
                reference: `BTX-${entry.day}-${entry.type}`,
                type: entry.type,
                amount: money(entry.amount),
                balance: money(runningBalance),
                category: entry.type === "CREDIT" ? "COBRO" : "PAGO",
                tags: JSON.stringify(["demo", "dashboard", entry.type.toLowerCase()]),
                isReconciled: true,
                importedFrom: "MANUAL",
                invoiceId,
                billId,
            };
        }));
    });
    return {
        monthsSeeded: DEFAULT_VISIBLE_MONTHS,
        partnersSeeded: DEMO_PARTNERS.length,
        productsSeeded: DEMO_PRODUCTS.length,
    };
}
//# sourceMappingURL=seed-operational-demo.js.map