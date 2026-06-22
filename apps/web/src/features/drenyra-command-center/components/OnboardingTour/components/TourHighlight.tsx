/**
 * TourHighlight — Transparent cutout ring that highlights the target element
 */
interface TourHighlightProps {
	rect: DOMRect | null;
}

export function TourHighlight({ rect }: TourHighlightProps) {
	if (!rect) return null;

	return (
		<div
			className="fixed z-50 pointer-events-none"
			style={{
				left: rect.left - 3,
				top: rect.top - 3,
				width: rect.width + 6,
				height: rect.height + 6,
				borderRadius: 14,
				boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
				transition: "all 300ms ease",
			}}
		>
			<div
				className="h-full w-full ring-2 ring-[var(--color-info)]"
				style={{ borderRadius: 12 }}
			/>
		</div>
	);
}
