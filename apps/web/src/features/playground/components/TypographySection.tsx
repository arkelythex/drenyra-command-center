"use client";

import { useEffect, useState } from "react";

interface TypeScale {
	token: string;
	label: string;
	sample: string;
	weight: string;
}

const TYPE_SCALES: TypeScale[] = [
	{
		token: "--text-xs",
		label: "Extra Small",
		sample: "The quick brown fox",
		weight: "400",
	},
	{
		token: "--text-sm",
		label: "Small",
		sample: "The quick brown fox",
		weight: "400",
	},
	{
		token: "--text-base",
		label: "Base",
		sample: "The quick brown fox",
		weight: "400",
	},
	{
		token: "--text-lg",
		label: "Large",
		sample: "The quick brown fox",
		weight: "500",
	},
	{
		token: "--text-xl",
		label: "XL",
		sample: "The quick brown fox",
		weight: "600",
	},
	{
		token: "--text-2xl",
		label: "2XL",
		sample: "The quick brown fox",
		weight: "700",
	},
	{
		token: "--text-3xl",
		label: "3XL",
		sample: "The quick brown fox",
		weight: "700",
	},
	{
		token: "--text-4xl",
		label: "4XL",
		sample: "The quick brown fox",
		weight: "800",
	},
	{
		token: "--text-5xl",
		label: "5XL",
		sample: "The quick brown",
		weight: "900",
	},
	{
		token: "--text-display-sm",
		label: "Display SM",
		sample: "Display Text",
		weight: "900",
	},
	{
		token: "--text-display-md",
		label: "Display MD",
		sample: "Display Text",
		weight: "900",
	},
	{
		token: "--text-display-lg",
		label: "Display LG",
		sample: "Display",
		weight: "900",
	},
];

function readCssVar(name: string): string {
	try {
		return getComputedStyle(document.documentElement)
			.getPropertyValue(name)
			.trim();
	} catch {
		return "—";
	}
}

export function TypographySection() {
	const [resolvedSizes, setResolvedSizes] = useState<Record<string, string>>(
		{},
	);

	useEffect(() => {
		const sizes: Record<string, string> = {};
		for (const t of TYPE_SCALES) {
			sizes[t.token] = readCssVar(t.token);
		}
		setResolvedSizes(sizes);
	}, []);

	return (
		<section id="typography" className="scroll-mt-20">
			<h2 className="n text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
				Typography
			</h2>

			{/* Type Scale */}
			<div className="mb-10">
				<h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
					Type Scale
				</h3>
				<div className="space-y-1">
					{TYPE_SCALES.map((t) => {
						const size = resolvedSizes[t.token];
						return (
							<div
								key={t.token}
								className="flex items-center gap-4 px-4 py-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]"
							>
								<span className="text-xs font-mono text-[var(--text-muted)] w-40 shrink-0 truncate">
									{t.token}
								</span>
								<span className="text-xs font-mono text-[var(--text-muted)] w-16 shrink-0">
									{size || "—"}
								</span>
								<span
									className="flex-1 text-[var(--text-primary)] truncate"
									style={{
										fontSize: `var(${t.token})`,
										fontWeight: Number(t.weight),
									}}
								>
									{t.sample}
								</span>
								<span className="text-xs text-[var(--text-muted)] w-16 text-right">
									w{t.weight}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Font Families */}
			<div className="mb-10">
				<h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
					Font Families
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
						<span className="text-xs font-mono text-[var(--text-muted)] mb-2 block">
							font-sans (Inter / Geist)
						</span>
						<p className="font-sans text-[var(--text-primary)]">
							The quick brown fox jumps over the lazy dog. 0123456789
						</p>
						<p className="font-sans text-sm text-[var(--text-secondary)] mt-2">
							Variable weight & optical sizing for UI text at any scale.
						</p>
					</div>
					<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
						<span className="text-xs font-mono text-[var(--text-muted)] mb-2 block">
							font-mono (JetBrains Mono)
						</span>
						<p className="font-mono text-[var(--text-primary)]">
							The quick brown fox jumps over the lazy dog. 0123456789
						</p>
						<p className="font-mono text-sm text-[var(--text-secondary)] mt-2">
							Ligatures, coding ligs & tabular-nums for financial data.
						</p>
					</div>
				</div>
			</div>

			{/* Tabular Numerals */}
			<div className="mb-6">
				<h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
					Tabular Numerals
				</h3>
				<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
					<span className="text-xs font-mono text-[var(--text-muted)] mb-3 block">
						font-mono + tabular-nums — critical for financial alignment
					</span>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
						<div>
							<p className="text-xs text-[var(--text-muted)] mb-2">
								With tabular-nums (✓)
							</p>
							<p className="font-mono tabular-nums text-lg text-[var(--text-primary)] leading-relaxed">
								S/ 1,234.56
								<br />
								S/ 12,345.67
								<br />
								S/ 123,456.78
								<br />
								S/ 1,000,000.00
							</p>
						</div>
						<div>
							<p className="text-xs text-[var(--text-muted)] mb-2">
								Without tabular-nums
							</p>
							<p className="font-mono text-lg text-[var(--text-muted)] leading-relaxed">
								S/ 1,234.56
								<br />
								S/ 12,345.67
								<br />
								S/ 123,456.78
								<br />
								S/ 1,000,000.00
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
