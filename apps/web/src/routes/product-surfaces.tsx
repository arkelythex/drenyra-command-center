import type { SurfaceStatus } from "@drenyra/domain";
import { ARKELYTHEX_PRODUCT_SURFACES } from "@drenyra/domain";
import { createFileRoute } from "@tanstack/react-router";

const STATUS_LABELS: Record<SurfaceStatus, string> = {
	"canonical-in-core": "Canonical",
	"strategy-layer": "Strategy",
	"separate-runtime": "Standalone",
};

export const Route = createFileRoute("/product-surfaces")({
	component: ProductSurfaces,
});

function ProductSurfaces() {
	return (
		<div className="p-6">
			<h1 className="text-xl font-semibold">Product Surfaces</h1>
			<p className="text-muted-foreground mt-2">
				Canonical ARKELYTHEX product surfaces from the domain registry.
			</p>
			<div className="mt-6 space-y-4">
				{ARKELYTHEX_PRODUCT_SURFACES.map((surface) => (
					<div key={surface.id} className="rounded-lg border p-4">
						<div className="flex items-center justify-between">
							<h2 className="text-base font-medium">{surface.name}</h2>
							<span className="text-muted-foreground text-sm">
								{STATUS_LABELS[surface.status]}
							</span>
						</div>
						<p className="text-muted-foreground mt-1 text-sm">
							{surface.summary}
						</p>
						<div className="mt-3 flex flex-wrap gap-2">
							{surface.modules.map((module) => (
								<span
									key={`${surface.id}-${module.path}`}
									className="bg-muted rounded px-2 py-1 text-xs"
								>
									{module.kind}: {module.path}
								</span>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
