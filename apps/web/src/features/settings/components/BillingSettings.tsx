import { CreditCard, Download, TrendingUp, Zap } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { SettingsButton } from "./appearance/SettingsUI";
import { SettingsSection } from "./SettingsPrimitives";
import { SettingsShell } from "./SettingsShell";

const INVOICES = [
	{
		id: "FAC-2026-0012",
		period: "January 2026",
		amount: "S/ 299.00",
		status: "Paid",
	},
	{
		id: "FAC-2025-0121",
		period: "December 2025",
		amount: "S/ 299.00",
		status: "Paid",
	},
	{
		id: "FAC-2025-0110",
		period: "November 2025",
		amount: "S/ 299.00",
		status: "Paid",
	},
];

export const BillingSettings = () => {
	return (
		<SettingsShell
			title="Recursos y Facturación"
			description="Audit your subscription levels, resource allocation, and payment matrix."
			icon={CreditCard}
			badge="PRO SUBSCRIPTION"
			actions={
				<SettingsButton variant="primary" size="xs">
					Upgrade Plan
				</SettingsButton>
			}
		>
			<div className="space-y-10">
				{/* Subscription Overview Bento */}
				<div className="grid gap-4 md:grid-cols-3">
					<SurfaceCard
						variant="muted"
						padding="lg"
						className="group relative overflow-hidden rounded-2xl border-[var(--border-default)] bg-[var(--surface-2)] transition-all hover:bg-[var(--surface-2)]"
					>
						<div className="mb-4 flex items-center gap-2">
							<Zap size={14} className="text-[var(--accent)]" />
							<span className="text-xs font-black uppercase tracking-widest text-[var(--text-tertiary)]">
								Current Plan
							</span>
						</div>
						<p className="text-2xl font-black text-[var(--text-primary)]">
							ENTERPRISE
						</p>
						<p className="mt-2 text-xs font-bold text-[var(--accent)] uppercase tracking-tighter">
							Unlimited Neural Memory
						</p>
					</SurfaceCard>

					<SurfaceCard
						variant="muted"
						padding="lg"
						className="group relative overflow-hidden rounded-2xl border-[var(--border-default)] bg-[var(--surface-2)] transition-all hover:bg-[var(--surface-2)]"
					>
						<div className="mb-4 flex items-center gap-2">
							<TrendingUp size={14} className="text-[var(--accent)]" />
							<span className="text-xs font-black uppercase tracking-widest text-[var(--text-tertiary)]">
								Resource Usage
							</span>
						</div>
						<div className="space-y-2">
							<div className="flex justify-between text-xs font-bold uppercase text-[var(--text-secondary)]">
								<span>Agents</span>
								<span>08 / 12</span>
							</div>
							<div className="h-1.5 w-full rounded-full bg-[var(--surface-1)]">
								<div className="h-full w-[66%] rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]" />
							</div>
						</div>
					</SurfaceCard>

					<SurfaceCard
						variant="muted"
						padding="lg"
						className="group relative overflow-hidden rounded-2xl border-[var(--border-default)] bg-[var(--surface-2)] transition-all hover:bg-[var(--surface-2)]"
					>
						<div className="mb-4 flex items-center gap-2 text-[var(--text-tertiary)]">
							<CreditCard size={14} />
							<span className="text-xs font-black uppercase tracking-widest">
								Payment Loop
							</span>
						</div>
						<p className="text-2xl font-black text-[var(--text-primary)]">
							S/ 299
							<span className="text-xs text-[var(--text-tertiary)]">.00</span>
						</p>
						<p className="mt-2 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-tighter">
							Monthly Cycle
						</p>
					</SurfaceCard>
				</div>

				{/* Payment Method Card */}
				<SettingsSection
					title="Arquitectura de Pagos"
					description="Active credit matrix and billing scheduled events."
				>
					<SurfaceCard
						variant="muted"
						padding="xl"
						className="flex flex-col gap-6 rounded-2xl border-[var(--border-default)] bg-[var(--surface-2)]/50 md:flex-row md:items-center md:justify-between"
					>
						<div className="flex items-center gap-6">
							<div className="relative h-14 w-20 rounded-xl bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)] p-3 shadow-2xl ring-1 ring-[var(--border-default)]">
								<div className="h-4 w-6 rounded-md bg-[var(--text-primary)]/10" />
								<div className="absolute bottom-3 right-3 text-xs font-mono font-bold text-[var(--text-tertiary)]">
									**** 2048
								</div>
							</div>
							<div>
								<p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">
									Corporate Platinum
								</p>
								<p className="mt-1 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-widest">
									Next cycle: March 15, 2026
								</p>
							</div>
						</div>
						<SettingsButton variant="secondary" size="sm">
							Change Method
						</SettingsButton>
					</SurfaceCard>
				</SettingsSection>

				{/* Invoice Ledger */}
				<SettingsSection
					title="Libro de Facturas"
					description="Verifiable billing artifacts for audit compliance."
				>
					<SurfaceCard
						variant="muted"
						padding="none"
						className="overflow-hidden rounded-2xl border-[var(--border-default)] bg-[var(--surface-2)]/20"
					>
						<table className="w-full text-left">
							<thead>
								<tr className="border-b border-[var(--border-default)] bg-[var(--surface-2)]/40">
									<th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-tertiary)]">
										Reference
									</th>
									<th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-tertiary)]">
										Period
									</th>
									<th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-tertiary)]">
										Amount
									</th>
									<th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--text-tertiary)]">
										Status
									</th>
									<th className="px-8 py-4 text-right" />
								</tr>
							</thead>
							<tbody className="divide-y divide-[var(--border-default)]">
								{INVOICES.map((invoice) => (
									<tr
										key={invoice.id}
										className="group hover:bg-[var(--surface-1)]/40 transition-colors"
									>
										<td className="px-8 py-5 text-xs font-bold text-[var(--text-primary)]">
											{invoice.id}
										</td>
										<td className="px-8 py-5 text-xs text-[var(--text-secondary)]">
											{invoice.period}
										</td>
										<td className="px-8 py-5 text-xs font-black text-[var(--text-primary)]">
											{invoice.amount}
										</td>
										<td className="px-8 py-5">
											<StatusBadge status="success" label={invoice.status} />
										</td>
										<td className="px-8 py-5 text-right">
											<button
												type="button"
												className="rounded-lg p-2 text-[var(--text-tertiary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)] transition-all"
											>
												<Download size={14} />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</SurfaceCard>
				</SettingsSection>
			</div>
		</SettingsShell>
	);
};
