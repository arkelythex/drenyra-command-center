"use client";

import type { ReactElement } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { cn, n } from "@/lib/utils";
import type { InboxInvoiceSummary } from "../inbox.schema";

type InboxInvoiceListProps = {
	invoices: InboxInvoiceSummary[];
};

function StatusIcon({ status }: { status: InboxInvoiceSummary["status"] }) {
	if (status === "ready") {
		return <CheckCircle2 size={16} className="text-[var(--color-success)]" />;
	}
	if (status === "needs-review") {
		return <AlertTriangle size={16} className="text-[var(--color-warning)]" />;
	}
	return <XCircle size={16} className="text-[var(--color-danger)]" />;
}

export function InboxInvoiceList({
	invoices,
}: InboxInvoiceListProps): ReactElement | null {
	if (invoices.length === 0) return null;

	return (
		<section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 p-4">
			<h3 className="text-sm font-bold">Detalle por factura</h3>
			<ul className="mt-3 space-y-2">
				{invoices.map((invoice) => (
					<li
						key={invoice.invoiceId}
						className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/50 px-3 py-2"
					>
						<div className="flex items-start justify-between gap-3">
							<div className="flex items-center gap-2 min-w-0">
								<StatusIcon status={invoice.status} />
								<span className="truncate text-xs font-semibold">
									{invoice.filename}
								</span>
							</div>
							{invoice.total !== undefined ? (
								<span className="shrink-0 font-mono text-xs">
									{n(invoice.total)}
								</span>
							) : null}
						</div>
						{invoice.igv !== undefined ? (
							<p className="mt-1 text-2xs text-[var(--text-tertiary)]">
								IGV: {n(invoice.igv)}
							</p>
						) : null}
						{invoice.accountingLabel ? (
							<p className="text-2xs text-[var(--text-secondary)]">
								Contable: {invoice.accountingLabel}
							</p>
						) : null}
						{invoice.reason ? (
							<p
								className={cn(
									"mt-1 text-2xs",
									invoice.status === "needs-review"
										? "text-[var(--color-warning)]"
										: "text-[var(--text-tertiary)]",
								)}
							>
								{invoice.reason}
							</p>
						) : null}
						{invoice.error ? (
							<p className="mt-1 text-2xs text-[var(--color-danger)]">
								{invoice.error}
							</p>
						) : null}
					</li>
				))}
			</ul>
		</section>
	);
}
