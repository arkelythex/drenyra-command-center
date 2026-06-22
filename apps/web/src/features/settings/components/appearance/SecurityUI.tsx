import React from "react";
import { ShieldCheck, ShieldAlert, Zap, Lock, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";

export const SecurityHealth = ({ score = 85 }: { score?: number }) => {
	return (
		<div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--ink)]/[0.02] p-8 backdrop-blur-3xl shadow-xl">
			{/* Background Glow */}
			<div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--accent)]/5 blur-3xl" />
			
			<div className="relative z-10 grid gap-8 md:grid-cols-[200px_1fr]">
				{/* Circular Progress */}
				<div className="flex flex-col items-center justify-center">
					<div className="relative flex h-32 w-32 items-center justify-center">
						<svg className="h-full w-full -rotate-90">
							<circle
								cx="64"
								cy="64"
								r="58"
								stroke="currentColor"
								strokeWidth="8"
								fill="transparent"
								className="text-[var(--ink)]/5"
							/>
							<circle
								cx="64"
								cy="64"
								r="58"
								stroke="currentColor"
								strokeWidth="8"
								fill="transparent"
								strokeDasharray="364"
								strokeDashoffset={364 - (364 * score) / 100}
								className="text-[var(--accent)] transition-all duration-1000 ease-out"
								strokeLinecap="round"
							/>
						</svg>
						<div className="absolute flex flex-col items-center">
							<span className="text-3xl font-black text-[var(--ink)]">{score}%</span>
							<span className="text-[8px] font-black uppercase tracking-widest text-[var(--ink)]/30">Safe</span>
						</div>
					</div>
				</div>

				{/* Security Context */}
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
						<h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--ink)]">Trust Analysis</h3>
					</div>
					<p className="max-w-md text-sm leading-relaxed text-[var(--ink)]/50">
						Your account is currently in the <span className="text-[var(--ink)] font-bold">Top 15%</span> of secured profiles. 2FA is active and your session matrix is clean.
					</p>
					<div className="flex flex-wrap gap-2">
						{[
							{ icon: ShieldCheck, label: "2FA Active", active: true },
							{ icon: Lock, label: "Biometrics", active: true },
							{ icon: Zap, label: "Audit Log", active: false },
						].map((tag) => (
							<div 
								key={tag.label}
								className={cn(
									"flex items-center gap-1.5 rounded-full border px-3 py-1 transition-colors",
									tag.active 
										? "border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]" 
										: "border-[var(--border)] bg-[var(--ink)]/5 text-[var(--ink)]/20"
								)}
							>
								<tag.icon size={10} strokeWidth={3} />
								<span className="text-xs font-black uppercase tracking-wider">{tag.label}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

interface SessionCardProps {
  device: string;
  location: string;
  status: string;
  isCurrent?: boolean;
}

export const SessionCard = ({ device, location, status, isCurrent }: SessionCardProps) => {
	return (
		<div className={cn(
			"group relative flex items-center justify-between overflow-hidden rounded-3xl border p-5 transition-all duration-300",
			isCurrent 
				? "border-[var(--accent)]/30 bg-[var(--accent)]/[0.03] shadow-lg" 
				: "border-[var(--border)] bg-[var(--ink)]/[0.01] hover:border-[var(--accent)]/10 hover:bg-[var(--ink)]/[0.03]"
		)}>
			<div className="flex items-center gap-4">
				<div className={cn(
					"flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors",
					isCurrent ? "border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[var(--border)] bg-[var(--ink)]/5 text-[var(--ink)]/30"
				)}>
					<Laptop size={20} strokeWidth={1.5} />
				</div>
				<div>
					<div className="flex items-center gap-2">
						<span className="text-xs font-black uppercase tracking-widest text-[var(--ink)]">{device}</span>
						{isCurrent && (
							<span className="rounded-full bg-[var(--accent)]/10 px-1.5 py-0.5 text-[8px] font-black text-[var(--accent)]">CURRENT</span>
						)}
					</div>
					<p className="mt-1 text-xs font-medium text-[var(--ink)]/30 uppercase tracking-[0.1em]">{location} • Last active: Just now</p>
				</div>
			</div>
			
			<button className="rounded-xl border border-[var(--border)] bg-[var(--ink)]/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--ink)]/40 opacity-0 transition-all group-hover:opacity-100 hover:border-[var(--diff-removed)]/30 hover:bg-[var(--diff-removed)]/10 hover:text-[var(--diff-removed)]">
				Terminate
			</button>
		</div>
	);
};
