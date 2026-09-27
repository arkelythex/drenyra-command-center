export const CONCENTRATION_THRESHOLD_PCT = 50;
export const PAYMENT_DELAY_DAYS_THRESHOLD = 15;
export const NEW_SUPPLIER_HIGH_VALUE_THRESHOLD = 10_000;
export const DEBT_AGING_BUCKETS = [30, 60, 90];
export const NEW_SUPPLIER_LOOKBACK_DAYS = 90;
function detectConcentrationRisk(input, now) {
    const anomalies = [];
    const supplierSpend = new Map();
    for (const tx of input.transactions) {
        const current = supplierSpend.get(tx.supplierId) ?? {
            name: tx.supplierName,
            total: 0,
        };
        current.total += Math.abs(tx.amount);
        supplierSpend.set(tx.supplierId, current);
    }
    const totalSpend = Array.from(supplierSpend.values()).reduce((sum, s) => sum + s.total, 0);
    if (totalSpend === 0)
        return anomalies;
    for (const [supplierId, data] of supplierSpend) {
        const pct = (data.total / totalSpend) * 100;
        if (pct > CONCENTRATION_THRESHOLD_PCT) {
            anomalies.push({
                id: `conc-${supplierId}`,
                timestamp: now.toISOString(),
                entityType: "supplier",
                entityId: supplierId,
                metric: "concentration_pct",
                expectedValue: CONCENTRATION_THRESHOLD_PCT,
                actualValue: Math.round(pct * 100) / 100,
                deviation: Math.round((pct - CONCENTRATION_THRESHOLD_PCT) * 100) / 100,
                severity: pct > 75 ? "critical" : "high",
                confidence: 0.85,
                reasoning: `Supplier "${data.name}" represents ${pct.toFixed(1)}% of total procurement spend, exceeding the ${CONCENTRATION_THRESHOLD_PCT}% threshold. Single-supplier dependency poses operational and fiscal risk.`,
                detectionMethod: "supplier_concentration",
                context: {
                    supplierName: data.name,
                    supplierTotal: data.total,
                    totalSpend,
                    percentage: Math.round(pct * 100) / 100,
                },
            });
        }
    }
    return anomalies;
}
function detectPaymentDelayTrend(input, now) {
    const anomalies = [];
    const supplierDelays = new Map();
    for (const tx of input.transactions) {
        if (!tx.paid || !tx.paymentDate)
            continue;
        const due = new Date(tx.dueDate);
        const paid = new Date(tx.paymentDate);
        const delayDays = (paid.getTime() - due.getTime()) / (1000 * 60 * 60 * 24);
        if (delayDays <= 0)
            continue;
        const current = supplierDelays.get(tx.supplierId) ?? {
            name: tx.supplierName,
            delays: [],
        };
        current.delays.push(delayDays);
        supplierDelays.set(tx.supplierId, current);
    }
    for (const [supplierId, data] of supplierDelays) {
        if (data.delays.length < 3)
            continue;
        const avgDelay = data.delays.reduce((sum, d) => sum + d, 0) / data.delays.length;
        const maxDelay = Math.max(...data.delays);
        if (avgDelay > PAYMENT_DELAY_DAYS_THRESHOLD) {
            const delaySeverity = avgDelay > 30 ? "critical" : avgDelay > 20 ? "high" : "medium";
            anomalies.push({
                id: `delay-${supplierId}`,
                timestamp: now.toISOString(),
                entityType: "supplier",
                entityId: supplierId,
                metric: "avg_payment_delay_days",
                expectedValue: PAYMENT_DELAY_DAYS_THRESHOLD,
                actualValue: Math.round(avgDelay * 100) / 100,
                deviation: Math.round((avgDelay - PAYMENT_DELAY_DAYS_THRESHOLD) * 100) / 100,
                severity: delaySeverity,
                confidence: 0.75,
                reasoning: `Supplier "${data.name}" has an average payment delay of ${avgDelay.toFixed(1)} days across ${data.delays.length} payments (max: ${maxDelay.toFixed(0)} days). Persistent delays may trigger SUNAT interest and penalties.`,
                detectionMethod: "payment_delay_trend",
                context: {
                    supplierName: data.name,
                    avgDelayDays: Math.round(avgDelay * 100) / 100,
                    maxDelayDays: Math.round(maxDelay),
                    paymentCount: data.delays.length,
                },
            });
        }
    }
    return anomalies;
}
function detectNewSupplierHighValue(input, now) {
    const anomalies = [];
    const cutoff = new Date(now.getTime() - NEW_SUPPLIER_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const recentSuppliers = new Set(input.suppliers
        .filter((s) => new Date(s.createdAt) >= cutoff)
        .map((s) => s.id));
    for (const tx of input.transactions) {
        if (!recentSuppliers.has(tx.supplierId))
            continue;
        if (Math.abs(tx.amount) < NEW_SUPPLIER_HIGH_VALUE_THRESHOLD)
            continue;
        anomalies.push({
            id: `new-supplier-${tx.supplierId}-${tx.id}`,
            timestamp: now.toISOString(),
            entityType: "supplier",
            entityId: tx.supplierId,
            metric: "first_invoice_amount_pen",
            expectedValue: NEW_SUPPLIER_HIGH_VALUE_THRESHOLD,
            actualValue: Math.abs(tx.amount),
            deviation: Math.abs(tx.amount) - NEW_SUPPLIER_HIGH_VALUE_THRESHOLD,
            severity: Math.abs(tx.amount) > 50_000 ? "critical" : "high",
            confidence: 0.7,
            reasoning: `Supplier "${tx.supplierName}" was registered within the last ${NEW_SUPPLIER_LOOKBACK_DAYS} days and has a first invoice of S/ ${Math.abs(tx.amount).toLocaleString()}. High-value transactions with new suppliers warrant enhanced due diligence per SUNAT fiscal intelligence protocols.`,
            detectionMethod: "new_supplier_high_value",
            context: {
                supplierName: tx.supplierName,
                supplierRuc: tx.supplierRuc,
                amount: Math.abs(tx.amount),
                lookbackDays: NEW_SUPPLIER_LOOKBACK_DAYS,
                firstInvoiceId: tx.id,
            },
        });
    }
    return anomalies;
}
function detectDebtAging(input, now) {
    const anomalies = [];
    const unpaidBySupplier = new Map();
    for (const tx of input.transactions) {
        if (tx.paid || tx.paymentDate)
            continue;
        const dueDate = new Date(tx.dueDate);
        if (dueDate > now)
            continue;
        const current = unpaidBySupplier.get(tx.supplierId) ?? {
            name: tx.supplierName,
            unpaid: [],
        };
        current.unpaid.push(tx);
        unpaidBySupplier.set(tx.supplierId, current);
    }
    for (const [supplierId, data] of unpaidBySupplier) {
        const buckets = {
            "30": { count: 0, total: 0 },
            "60": { count: 0, total: 0 },
            "90+": { count: 0, total: 0 },
        };
        let totalPastDue = 0;
        let maxDaysOverdue = 0;
        for (const tx of data.unpaid) {
            const dueDate = new Date(tx.dueDate);
            const daysOverdue = (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
            const amount = Math.abs(tx.amount);
            totalPastDue += amount;
            maxDaysOverdue = Math.max(maxDaysOverdue, daysOverdue);
            if (daysOverdue >= 90) {
                buckets["90+"].count++;
                buckets["90+"].total += amount;
            }
            else if (daysOverdue >= 60) {
                buckets["60"].count++;
                buckets["60"].total += amount;
            }
            else {
                buckets["30"].count++;
                buckets["30"].total += amount;
            }
        }
        if (totalPastDue > 0) {
            const bucketSummary = Object.entries(buckets)
                .filter(([, v]) => v.count > 0)
                .map(([k, v]) => `>${k}d: S/ ${v.total.toLocaleString()} (${v.count} inv)`)
                .join("; ");
            const severity = buckets["90+"].count > 0
                ? "critical"
                : buckets["60"].count > 0
                    ? "high"
                    : "medium";
            anomalies.push({
                id: `debt-${supplierId}`,
                timestamp: now.toISOString(),
                entityType: "supplier",
                entityId: supplierId,
                metric: "past_due_total_pen",
                expectedValue: 0,
                actualValue: Math.round(totalPastDue * 100) / 100,
                deviation: Math.round(totalPastDue * 100) / 100,
                severity,
                confidence: 0.9,
                reasoning: `Supplier "${data.name}" has S/ ${totalPastDue.toLocaleString()} in past-due invoices across ${data.unpaid.length} unpaid items. ${bucketSummary}. Aging debt increases default risk and may affect IGV credit eligibility.`,
                detectionMethod: "debt_aging",
                context: {
                    supplierName: data.name,
                    totalPastDue: Math.round(totalPastDue * 100) / 100,
                    unpaidCount: data.unpaid.length,
                    maxDaysOverdue: Math.round(maxDaysOverdue),
                    buckets: {
                        past30: buckets["30"],
                        past60: buckets["60"],
                        past90: buckets["90+"],
                    },
                },
            });
        }
    }
    return anomalies;
}
function detectDuplicateSupplier(input, now) {
    const anomalies = [];
    const byRuc = new Map();
    for (const sup of input.suppliers) {
        const current = byRuc.get(sup.ruc) ?? {
            names: new Set(),
            ids: [],
        };
        current.names.add(sup.name.toUpperCase().trim());
        current.ids.push(sup.id);
        byRuc.set(sup.ruc, current);
    }
    for (const [ruc, data] of byRuc) {
        if (data.names.size > 1) {
            anomalies.push({
                id: `dup-ruc-${ruc}`,
                timestamp: now.toISOString(),
                entityType: "supplier",
                entityId: data.ids[0],
                metric: "duplicate_ruc",
                expectedValue: 1,
                actualValue: data.names.size,
                deviation: data.names.size - 1,
                severity: "high",
                confidence: 0.95,
                reasoning: `RUC ${ruc} is registered under ${data.names.size} different supplier names: ${Array.from(data.names).join(", ")}. This may indicate duplicate supplier records, requiring reconciliation per SUNAT fiscal registry rules.`,
                detectionMethod: "duplicate_supplier_ruc",
                context: {
                    ruc,
                    supplierNames: Array.from(data.names),
                    supplierIds: data.ids,
                    duplicateCount: data.names.size,
                },
            });
        }
    }
    const byAccount = new Map();
    for (const sup of input.suppliers) {
        if (!sup.bankAccount)
            continue;
        const current = byAccount.get(sup.bankAccount) ?? {
            rucs: new Set(),
            names: [],
        };
        current.rucs.add(sup.ruc);
        current.names.push(sup.name);
        byAccount.set(sup.bankAccount, current);
    }
    for (const [account, data] of byAccount) {
        if (data.rucs.size > 1) {
            anomalies.push({
                id: `dup-acct-${account.replace(/\s+/g, "-")}`,
                timestamp: now.toISOString(),
                entityType: "supplier",
                entityId: data.names[0],
                metric: "shared_bank_account",
                expectedValue: 1,
                actualValue: data.rucs.size,
                deviation: data.rucs.size - 1,
                severity: "critical",
                confidence: 0.9,
                reasoning: `Bank account "${account}" is shared by ${data.rucs.size} different RUCs: ${Array.from(data.rucs).join(", ")} (${data.names.slice(0, 3).join(", ")}${data.names.length > 3 ? "..." : ""}). Shared accounts across suppliers is a red flag for potential tax evasion or fraud per SUNAT fiscal intelligence protocols.`,
                detectionMethod: "shared_bank_account",
                context: {
                    bankAccount: account,
                    rucs: Array.from(data.rucs),
                    supplierNames: data.names,
                    sharedCount: data.rucs.size,
                },
            });
        }
    }
    return anomalies;
}
export function createSupplierIntelligenceStrategy(options = {}) {
    const concentrationThresholdPct = options.concentrationThresholdPct ?? CONCENTRATION_THRESHOLD_PCT;
    const paymentDelayDaysThreshold = options.paymentDelayDaysThreshold ?? PAYMENT_DELAY_DAYS_THRESHOLD;
    const newSupplierHighValueThreshold = options.newSupplierHighValueThreshold ?? NEW_SUPPLIER_HIGH_VALUE_THRESHOLD;
    const newSupplierLookbackDays = options.newSupplierLookbackDays ?? NEW_SUPPLIER_LOOKBACK_DAYS;
    return {
        id: "supplier-intelligence",
        name: "Supplier Intelligence",
        description: "Detects supplier-related fiscal risks: concentration risk, payment delay trends, new supplier high-value transactions, debt aging, and duplicate supplier records. Based on SUNAT fiscal intelligence protocols and TUO IGV requirements.",
        minSeverity: "low",
        execute(data, _context) {
            const input = data;
            if (!input?.suppliers || !input?.transactions) {
                return [];
            }
            const now = new Date();
            const anomalies = [
                ...detectConcentrationRisk(input, now),
                ...detectPaymentDelayTrend(input, now),
                ...detectNewSupplierHighValue(input, now),
                ...detectDebtAging(input, now),
                ...detectDuplicateSupplier(input, now),
            ];
            return anomalies;
        },
    };
}
//# sourceMappingURL=supplier-intelligence.strategy.js.map