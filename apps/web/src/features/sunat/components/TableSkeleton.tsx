/**
 * TableSkeleton — loading placeholder for the SUNAT invoices table.
 */

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
	return (
		<>
			{Array.from({ length: rows }).map((_, i) => (
				<tr key={i}>
					<td className="px-6 py-4">
						<div className="h-4 w-28 animate-pulse rounded bg-[var(--surface-2)]" />
					</td>
					<td className="px-6 py-4">
						<div className="h-4 w-16 animate-pulse rounded bg-[var(--surface-2)]" />
					</td>
					<td className="px-6 py-4">
						<div className="h-4 w-36 animate-pulse rounded bg-[var(--surface-2)]" />
					</td>
					<td className="px-6 py-4">
						<div className="ml-auto h-4 w-20 animate-pulse rounded bg-[var(--surface-2)]" />
					</td>
					<td className="px-6 py-4">
						<div className="h-4 w-24 animate-pulse rounded bg-[var(--surface-2)]" />
					</td>
					<td className="px-6 py-4">
						<div className="h-5 w-20 animate-pulse rounded-full bg-[var(--surface-2)]" />
					</td>
				</tr>
			))}
		</>
	);
}
