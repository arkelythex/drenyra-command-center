import type { ReactElement } from "react";

import { BrandMediaSlot } from "@/components/landing/brand/brand-media-slot";
import {
	BRAND_HOME_SURFACE_MEDIA,
	type BrandHomeSurfaceId,
} from "@/lib/landing/brand-media";
import { cn } from "@/lib/utils";

export type BrandSurfaceKind = BrandHomeSurfaceId;

/** Contenedor full-bleed; el contenido visual lo aporta multimedia en `public/brand/home/`. */
export function BrandSurfaceScene({
	kind,
	className,
	priority,
}: {
	readonly kind: BrandSurfaceKind;
	readonly className?: string;
	readonly priority?: boolean;
}): ReactElement {
	const media = BRAND_HOME_SURFACE_MEDIA[kind];

	return (
		<div
			className={cn(
				"brand-surface-scene relative w-full overflow-hidden",
				className,
			)}
			aria-hidden
		>
			<BrandMediaSlot media={media} priority={priority} />
		</div>
	);
}
