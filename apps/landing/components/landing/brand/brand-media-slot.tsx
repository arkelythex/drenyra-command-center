"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import Image from "next/image";

import type { BrandMediaAsset } from "@/lib/landing/brand-media";
import { cn } from "@/lib/utils";

type BrandMediaSlotProps = {
	readonly media: BrandMediaAsset;
	readonly className?: string;
	readonly priority?: boolean;
	readonly sizes?: string;
};

/**
 * Slot vacío hasta que exista el archivo en `public/`.
 * Si la imagen carga, se muestra a pantalla completa (`object-cover`).
 */
export function BrandMediaSlot({
	media,
	className,
	priority = false,
	sizes = "100vw",
}: BrandMediaSlotProps): ReactElement {
	const [loaded, setLoaded] = useState(false);

	return (
		<div
			className={cn(
				"brand-media-slot relative h-full w-full min-h-[inherit] bg-[#0a0a0a]",
				className,
			)}
			data-media-src={media.src}
		>
			<Image
				src={media.src}
				alt={media.alt}
				fill
				priority={priority}
				sizes={sizes}
				className={cn(
					"object-cover transition-opacity duration-500",
					loaded ? "opacity-100" : "opacity-0",
				)}
				onLoad={() => setLoaded(true)}
				onError={() => setLoaded(false)}
			/>
		</div>
	);
}
