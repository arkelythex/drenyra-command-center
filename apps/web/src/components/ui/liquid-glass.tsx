import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SurfacePanel } from "./SurfacePanel";

interface LiquidGlassProps {
	children: ReactNode;
	className?: string;
	intensity?: "light" | "medium" | "heavy";
	animate?: boolean;
	adaptive?: boolean;
}

/** @deprecated Use SurfacePanel — LiquidGlass removed in Fiscal Editorial v3 */
export function LiquidGlass({
	children,
	className,
	intensity = "medium",
}: LiquidGlassProps) {
	if (import.meta.env.DEV) {
		console.warn(
			"[LiquidGlass] deprecated — use SurfacePanel from @/components/ui/SurfacePanel",
		);
	}
	return (
		<SurfacePanel
			className={cn(
				intensity === "heavy" && "bg-[var(--surface-2)]",
				className,
			)}
			padding="md"
		>
			{children}
		</SurfacePanel>
	);
}

/** @deprecated Use SurfacePanel */
export function LiquidGlassCard({
	children,
	className,
}: LiquidGlassProps & { ref?: unknown }) {
	return <LiquidGlass className={className}>{children}</LiquidGlass>;
}

LiquidGlassCard.displayName = "LiquidGlassCard";
