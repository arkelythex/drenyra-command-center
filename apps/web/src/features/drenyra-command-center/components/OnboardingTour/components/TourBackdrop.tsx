/**
 * TourBackdrop — Dark overlay behind the tour
 */
interface TourBackdropProps {
	fadeIn: boolean;
}

export function TourBackdrop({ fadeIn }: TourBackdropProps) {
	return (
		<div
			className="fixed inset-0 z-40 bg-black/60 pointer-events-none"
			style={{
				transition: "opacity 300ms ease",
				opacity: fadeIn ? 1 : 0,
			}}
		/>
	);
}
