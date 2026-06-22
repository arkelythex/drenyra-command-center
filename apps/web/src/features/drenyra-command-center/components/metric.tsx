export function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
			<p className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
				{label}
			</p>
			<p className="mt-2 text-2xl font-bold">{value}</p>
		</div>
	);
}
