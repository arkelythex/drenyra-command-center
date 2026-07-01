import { ArrowUpRight, Building2, Mail, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const OrganizationIdentity = ({
	name,
	ruc,
}: {
	name: string;
	ruc: string;
}) => {
	return (
		<div className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-8">
			{/* Decorative Entity Icon */}
			<div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--accent)]/5 blur-2xl" />

			<div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center">
				<div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 text-[var(--accent)] shadow-2xl">
					<Building2 size={32} strokeWidth={1.5} />
				</div>

				<div className="space-y-1">
					<div className="flex items-center gap-3">
						<h3 className="text-xl font-black tracking-tight text-[var(--ink)]">
							{name}
						</h3>
						<div className="flex items-center gap-1 rounded-full bg-success-subtle px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-success border border-success-subtle">
							<ShieldCheck size={10} />
							Verified Entity
						</div>
					</div>
					<p className="font-mono text-xs font-bold tracking-widest text-[var(--ink-secondary)]">
						ID: {ruc}
					</p>
				</div>

				<div className="flex-1 md:flex md:justify-end">
					<div className="grid grid-cols-2 gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-high)]/50 p-4">
						<div className="text-center">
							<p className="text-xs font-black uppercase tracking-widest text-[var(--ink-tertiary)]">
								Subsidiaries
							</p>
							<p className="text-sm font-black text-[var(--ink)]">04</p>
						</div>
						<div className="text-center border-l border-[var(--border)]">
							<p className="text-xs font-black uppercase tracking-widest text-[var(--ink-tertiary)]">
								Region
							</p>
							<p className="text-sm font-black text-[var(--ink)]">LATAM</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

interface MemberCardProps {
	name: string;
	email: string;
	role: string;
	status?: string;
}

export const MemberCard = ({ name, email, role }: MemberCardProps) => {
	const isAdmin = role.toLowerCase() === "admin";

	return (
		<div className="group relative flex items-center justify-between rounded-3xl border border-[var(--border)] bg-[var(--surface-low)]/30 p-5 transition-all duration-300 hover:border-[var(--accent)]/20 hover:bg-[var(--surface-low)]/60">
			<div className="flex items-center gap-4">
				<div
					className={cn(
						"flex h-11 w-11 items-center justify-center rounded-2xl border font-black text-xs transition-colors",
						isAdmin
							? "border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]"
							: "border-[var(--border)] bg-[var(--surface-high)] text-[var(--ink-secondary)]",
					)}
				>
					{name
						.split(" ")
						.map((n: string) => n[0])
						.join("")}
				</div>
				<div>
					<p className="text-xs font-black uppercase tracking-widest text-[var(--ink)]">
						{name}
					</p>
					<div className="flex items-center gap-2 mt-0.5">
						<Mail size={10} className="text-[var(--ink-tertiary)]" />
						<p className="text-xs font-medium text-[var(--ink-secondary)] lowercase">
							{email}
						</p>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<div
					className={cn(
						"rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.15em] border",
						isAdmin
							? "border-[var(--accent)]/20 bg-[var(--accent)]/5 text-[var(--accent)]"
							: "border-[var(--border)] bg-[var(--surface-high)] text-[var(--ink-tertiary)]",
					)}
				>
					{role}
				</div>
				<button
					type="button"
					className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-high)] text-[var(--ink-tertiary)] opacity-0 transition-all group-hover:opacity-100 hover:text-[var(--accent)] hover:border-[var(--accent)]/30"
				>
					<ArrowUpRight size={14} />
				</button>
			</div>
		</div>
	);
};
