/**
 * ProductEcosystem — Links grid to related capabilities in the Drenyra platform.
 *
 * @example
 * <ProductEcosystem
 *   tagline="Ecosistema"
 *   headline="Drenyra opera integrado."
 *   links={[
 *     { href: "/drenyra", title: "Drenyra", description: "..." },
 *   ]}
 * />
 */

"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface EcosystemLink {
	href: string;
	title: string;
	description: string;
}

export interface ProductEcosystemProps {
	tagline: string;
	headline: string;
	links: readonly EcosystemLink[];
	headlineEmphasis?: string;
}

export function ProductEcosystem({
	tagline,
	headline,
	links,
	headlineEmphasis,
}: ProductEcosystemProps): ReactElement {
	return (
		<section className="py-20 md:py-28">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
					<div>
						<p className="landing-eyebrow">{tagline}</p>
						<h2 className="mt-4 font-display text-4xl font-black tracking-tight text-foreground md:text-5xl">
							{headline}
							{headlineEmphasis && (
								<>
									<br />
									<span className="text-product-accent">
										{headlineEmphasis}
									</span>
								</>
							)}
						</h2>
					</div>
					<Link
						href="/precios"
						className="inline-flex min-h-6 items-center gap-2 text-sm font-medium text-foreground hover:opacity-80"
					>
						Ver planes
						<ArrowRight className="h-4 w-4" aria-hidden />
					</Link>
				</div>
				<div className="grid gap-px overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/10 md:grid-cols-3">
					{links.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="group bg-background p-6 transition-colors hover:bg-product-accent/5"
						>
							<h3 className="text-lg font-black text-foreground transition-colors group-hover:text-product-accent">
								{link.title}
							</h3>
							<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
								{link.description}
							</p>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}
