import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { z } from "zod";

const DEMO_IDS = ["igv-error", "sire-auto", "detraccion-omitida"] as const;

const demosSearchSchema = z.object({
	play: z.enum(DEMO_IDS).optional(),
});

export const Route = createFileRoute("/onboarding/demos")({
	validateSearch: (search) => demosSearchSchema.parse(search),
	component: lazyRouteComponent(() => import("./onboarding.demos.component")),
});
