import { SurfacePanel, type SurfacePanelProps } from "./SurfacePanel";

/** @deprecated Use SurfacePanel — GlassCard removed in Fiscal Editorial v3 */
function GlassCard(props: SurfacePanelProps) {
	if (import.meta.env.DEV) {
		console.warn(
			"[GlassCard] deprecated — use SurfacePanel from @/components/ui/SurfacePanel",
		);
	}
	const { hoverEffect: _hoverEffect, ...rest } = props as SurfacePanelProps & {
		hoverEffect?: boolean;
	};
	return <SurfacePanel {...rest} />;
}
GlassCard.displayName = "GlassCard";

export { GlassCard };
