import {
	ARKELYTHEX_PRODUCT_SURFACES,
	type ArkelythexProductSurface,
} from "@arkelythex/domain";
import {
	Blocks,
	BookOpenText,
	FolderKanban,
	Layers3,
	Rocket,
	ShieldCheck,
	Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const STATUS_META: Record<
	ArkelythexProductSurface["status"],
	{ label: string; className: string; icon: typeof Layers3 }
> = {
	"canonical-in-core": {
		label: "Canónico en core",
		className:
			"border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]",
		icon: Layers3,
	},
	"separate-runtime": {
		label: "Runtime separado",
		className:
			"border-[var(--color-info)]/30 bg-[var(--color-info)]/10 text-[var(--color-info)]",
		icon: Smartphone,
	},
	"strategy-layer": {
		label: "Capa estratégica",
		className:
			"border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
		icon: Rocket,
	},
};

const surfaceGroups = [
	{
		id: "canonical-in-core" as const,
		title: "Superficies canónicas en core",
		description:
			"Deben evolucionar dentro de drenyra y compartir substrate, contratos y release cadence.",
	},
	{
		id: "separate-runtime" as const,
		title: "Runtimes separados",
		description:
			"Mantienen boundary real por constraints de plataforma o despliegue.",
	},
	{
		id: "strategy-layer" as const,
		title: "Capas estratégicas",
		description:
			"Narrativas o vías de expansión sin runtime independiente actual.",
	},
] satisfies ReadonlyArray<{
	id: ArkelythexProductSurface["status"];
	title: string;
	description: string;
}>;

export function ProductSurfacesView() {
	const totalModules = ARKELYTHEX_PRODUCT_SURFACES.reduce(
		(sum, surface) => sum + surface.modules.length,
		0,
	);
	const totalDocs = ARKELYTHEX_PRODUCT_SURFACES.reduce(
		(sum, surface) => sum + surface.documentationRefs.length,
		0,
	);

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
			<header className="space-y-4">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<ShieldCheck className="h-4 w-4" />
					Canon de workspace + ownership operativo
				</div>
				<div className="space-y-2">
					<h1 className="text-3xl font-semibold tracking-tight">
						Product surfaces
					</h1>
					<p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
						Vista operativa de cómo Arkelythex mapea marcas de producto a
						módulos reales, documentación canónica y boundaries de runtime
						dentro del monorepo.
					</p>
				</div>
			</header>

			<section className="grid gap-4 md:grid-cols-3">
				<MetricCard
					icon={Blocks}
					label="Superficies"
					value={String(ARKELYTHEX_PRODUCT_SURFACES.length)}
					hint="Mapa derivado desde @arkelythex/domain"
				/>
				<MetricCard
					icon={FolderKanban}
					label="Módulos referenciados"
					value={String(totalModules)}
					hint="Apps, packages, features y docs"
				/>
				<MetricCard
					icon={BookOpenText}
					label="Referencias canónicas"
					value={String(totalDocs)}
					hint="Rastreo explícito a @docs/"
				/>
			</section>

			{surfaceGroups.map((group) => {
				const surfaces = ARKELYTHEX_PRODUCT_SURFACES.filter(
					(surface) => surface.status === group.id,
				);
				if (surfaces.length === 0) return null;

				return (
					<section key={group.id} className="space-y-4">
						<div className="space-y-1">
							<h2 className="text-xl font-semibold tracking-tight">
								{group.title}
							</h2>
							<p className="text-sm text-muted-foreground">
								{group.description}
							</p>
						</div>

						<div className="grid gap-4 xl:grid-cols-2">
							{surfaces.map((surface) => (
								<SurfaceCard key={surface.id} surface={surface} />
							))}
						</div>
					</section>
				);
			})}
		</div>
	);
}

function MetricCard({
	icon: Icon,
	label,
	value,
	hint,
}: {
	icon: typeof Layers3;
	label: string;
	value: string;
	hint: string;
}) {
	return (
		<Card className="border-border/70 bg-card shadow-none">
			<CardContent className="flex items-start gap-4 p-5">
				<div className="rounded-xl border border-border/70 bg-muted/40 p-2.5">
					<Icon className="h-5 w-5" />
				</div>
				<div className="space-y-1">
					<p className="text-xs uppercase tracking-wide text-muted-foreground">
						{label}
					</p>
					<p className="text-2xl font-semibold leading-none">{value}</p>
					<p className="text-sm text-muted-foreground">{hint}</p>
				</div>
			</CardContent>
		</Card>
	);
}

function SurfaceCard({ surface }: { surface: ArkelythexProductSurface }) {
	const statusMeta = STATUS_META[surface.status];
	const StatusIcon = statusMeta.icon;

	return (
		<Card className="border-border/70 bg-card shadow-none">
			<CardHeader className="space-y-3">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="outline" className={statusMeta.className}>
						<StatusIcon className="mr-1 h-3.5 w-3.5" />
						{statusMeta.label}
					</Badge>
					<Badge variant="secondary">{surface.id}</Badge>
				</div>
				<div className="space-y-1">
					<CardTitle>{surface.name}</CardTitle>
					<CardDescription>{surface.summary}</CardDescription>
				</div>
			</CardHeader>

			<CardContent className="space-y-5">
				<div className="space-y-2">
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Canonical home
					</p>
					<code className="rounded-md border border-border/70 bg-muted/30 px-2.5 py-1.5 text-xs">
						{surface.canonicalHome}
					</code>
				</div>

				<div className="space-y-2">
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Módulos reales
					</p>
					<ul className="space-y-2">
						{surface.modules.map((moduleRef) => (
							<li
								key={`${surface.id}-${moduleRef.kind}-${moduleRef.path}`}
								className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
							>
								<div className="flex flex-wrap items-center gap-2">
									<Badge variant="outline" className="capitalize">
										{moduleRef.kind}
									</Badge>
									<code className="text-xs">{moduleRef.path}</code>
								</div>
								<p className="mt-1 text-sm text-muted-foreground">
									{moduleRef.role}
								</p>
							</li>
						))}
					</ul>
				</div>

				<div className="space-y-2">
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Referencias en docs
					</p>
					<ul className="space-y-1 text-sm text-muted-foreground">
						{surface.documentationRefs.map((docRef) => (
							<li
								key={`${surface.id}-${docRef}`}
								className="flex items-start gap-2"
							>
								<BookOpenText className="mt-0.5 h-4 w-4 shrink-0" />
								<code className="text-xs sm:text-sm">{docRef}</code>
							</li>
						))}
					</ul>
				</div>
			</CardContent>
		</Card>
	);
}
