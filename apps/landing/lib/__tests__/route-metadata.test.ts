import type { Metadata } from "next";
import { describe, expect, it } from "vitest";

import { metadata as homeMetadata } from "@/app/page";
import { metadata as apiMetadata } from "@/app/api/page";
import { metadata as drenyraMetadata } from "@/app/drenyra/page";

const REQUIRED_OG_IMAGE_ROUTES = [
	["/", homeMetadata],
	["/api", apiMetadata],
	["/drenyra", drenyraMetadata],
] as const satisfies ReadonlyArray<readonly [string, Metadata]>;

function hasOpenGraphImage(metadata: Metadata): boolean {
	const images = metadata.openGraph?.images;

	if (Array.isArray(images)) {
		return images.length > 0;
	}

	return Boolean(images);
}

function hasTwitterImage(metadata: Metadata): boolean {
	const images = metadata.twitter?.images;

	if (Array.isArray(images)) {
		return images.length > 0;
	}

	return Boolean(images);
}

describe("public route metadata", () => {
	it.each(
		REQUIRED_OG_IMAGE_ROUTES,
	)("%s exposes large social preview images", (_route, metadata) => {
		expect(hasOpenGraphImage(metadata)).toBe(true);
		expect(hasTwitterImage(metadata)).toBe(true);
	});
});
